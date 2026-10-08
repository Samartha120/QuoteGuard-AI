from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
import secrets
import string
import re
from typing import Union
from datetime import datetime, timezone, timedelta

from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    GoogleAuthRequest,
    TokenResponse,
    UserResponse,
    UpdateProfileRequest,
    RefreshRequest,
    VerifyOTPRequest,
    OTPResponse,
)
from app.services.auth_service import (
    authenticate_user,
    update_user_name,
    create_user,
    get_user_by_email,
    get_user_by_id,
    create_pending_user,
    get_pending_user_by_email,
    delete_pending_user,
)
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    verify_password,
    hash_password,
    validate_password_strength,
    dummy_verify_password,
    revoke_token,
    is_token_revoked,
)
from app.core.config import settings
from app.core.logging import logger
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter()

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def _token_response(user: User, response: Response) -> dict:
    token = create_access_token(subject=user.id, extra={"role": user.role})
    refresh_token = create_refresh_token(subject=user.id)
    
    secure_cookie = settings.ENVIRONMENT == "production"
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 7) * 24 * 60 * 60,
        path=f"{settings.API_V1_STR}/auth/refresh"
    )

    return {
        "access_token": "hidden_in_cookie",
        "refresh_token": "hidden_in_cookie",
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


@router.post("/login", response_model=Union[TokenResponse, OTPResponse])
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    
    # 1. Server-side format validation
    if not email or not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format.",
        )
    if not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required.",
        )

    # 2. Check account existence and temporary lockout
    user = get_user_by_email(db, email)
    now = datetime.now(timezone.utc)
    
    if user:
        if user.locked_until and now < user.locked_until:
            wait_seconds = int((user.locked_until - now).total_seconds())
            logger.warning(f"Security: Blocked login attempt on locked account {email}.")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Account temporarily locked due to multiple failed login attempts. Please try again in {wait_seconds} seconds.",
            )

    # 3. Password Verification
    authenticated_user = authenticate_user(db, email, payload.password)
    if not authenticated_user:
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                user.failed_login_attempts = 0
                logger.warning(f"Security: Account {email} locked for 15 minutes after 5 failed password attempts.")
            db.commit()
        else:
            # Constant-time dummy verify to neutralize timing side-channel attacks
            dummy_verify_password()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials.",
        )

    # Clear failed attempts on successful password verification
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    # Demo credentials bypass 2FA / OTP for instant access in demo mode
    if settings.DEMO_MODE and user.email == "sales.manager@vertexind.com":
        return _token_response(user, response)

    # 4. OTP Request Cooldown (60 seconds)
    if user.login_otp_created_at:
        elapsed = (now - user.login_otp_created_at).total_seconds()
        if elapsed < 60:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(60 - elapsed)} seconds before requesting a new verification code.",
            )

    # 5. Generate Cryptographically Secure OTP
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    user.login_otp = hash_password(otp)
    user.login_otp_expires_at = now + timedelta(minutes=5)
    user.login_otp_created_at = now
    user.login_attempts = 0
    db.commit()

    # Never log OTP in production
    if settings.ENVIRONMENT != "production":
        logger.debug(f"[DEV ONLY] Login OTP generated for {user.email}")

    return OTPResponse(
        message="A verification code has been sent to your email address.",
        email=user.email
    )


@router.post("/verify-login-otp", response_model=TokenResponse)
def verify_login_otp(payload: VerifyOTPRequest, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = get_user_by_email(db, email)
    
    if not user or not user.login_otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session. Please login again.",
        )

    now = datetime.now(timezone.utc)
    if not user.login_otp_expires_at or now > user.login_otp_expires_at:
        user.login_otp = None
        user.login_otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Verification code has expired. Please login again.",
        )

    if user.login_attempts >= 5:
        user.login_otp = None
        user.login_otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Too many failed attempts. Verification code has been invalidated. Please login again.",
        )

    is_valid_otp = verify_password(payload.otp, user.login_otp)
    is_demo_otp = settings.DEMO_MODE and payload.otp == "123456"

    if not is_valid_otp and not is_demo_otp:
        user.login_attempts = (user.login_attempts or 0) + 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid verification code.",
        )

    # Single-use: Invalidate OTP immediately upon successful verification
    user.login_otp = None
    user.login_otp_expires_at = None
    user.login_attempts = 0
    db.commit()

    return _token_response(user, response)


@router.post("/register", response_model=OTPResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip().lower()

    if not name or len(name) > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name is required and must not exceed 100 characters.",
        )
    if not email or not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email address is required.",
        )

    try:
        validate_password_strength(payload.password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )

    # Account Enumeration Protection:
    # If the user already exists, simulate sending OTP without leaking existence or creating duplicate
    if get_user_by_email(db, email):
        return OTPResponse(
            message="If this email is eligible for registration, a verification code has been sent.",
            email=email
        )

    # Check cooldown on existing pending registration
    pending = get_pending_user_by_email(db, email)
    now = datetime.now(timezone.utc)
    if pending and pending.last_otp_sent_at:
        elapsed = (now - pending.last_otp_sent_at).total_seconds()
        if elapsed < 60:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {int(60 - elapsed)} seconds before requesting a new verification code.",
            )

    pending_user, otp = create_pending_user(db, name, email, payload.password)

    if settings.ENVIRONMENT != "production":
        logger.debug(f"[DEV ONLY] Registration OTP generated for {email}")

    return OTPResponse(
        message="A verification code has been sent to your email address.",
        email=email
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(payload: VerifyOTPRequest, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    pending = get_pending_user_by_email(db, email)

    if not pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No pending registration found or verification code has expired.",
        )

    now = datetime.now(timezone.utc)
    if now > pending.expires_at:
        delete_pending_user(db, email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please register again.",
        )

    if pending.attempts >= 5:
        delete_pending_user(db, email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please register again.",
        )

    is_valid = verify_password(payload.otp, pending.hashed_otp)
    is_demo = settings.DEMO_MODE and payload.otp == "123456"

    if not is_valid and not is_demo:
        pending.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code.",
        )

    # Validation successful, create active user and clean up pending registration
    user = create_user(db, name=pending.name, email=pending.email, password=None)
    user.hashed_password = pending.hashed_password
    db.commit()

    delete_pending_user(db, email)
    return _token_response(user, response)


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, response: Response, db: Session = Depends(get_db)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on this server.",
        )
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests

        info = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google auth library is not installed on this server.",
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google credential.",
        )

    email = (info.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account did not provide an email.",
        )
    user = get_user_by_email(db, email)
    if not user:
        user = create_user(db, name=info.get("name") or email, email=email, password=None)
    return _token_response(user, response)


@router.get("/me", response_model=UserResponse)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, response: Response, payload: RefreshRequest = None, db: Session = Depends(get_db)):
    token_to_verify = request.cookies.get("refresh_token")
    if not token_to_verify and payload:
        token_to_verify = payload.refresh_token

    if not token_to_verify:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    decoded = decode_refresh_token(token_to_verify)
    if not decoded:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    jti = decoded.get("jti")
    # Detect refresh token reuse / revoked tokens
    if is_token_revoked(db, jti):
        logger.warning(f"Security: Attempted reuse of revoked refresh token JTI {jti}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked.",
        )

    user_id = decoded.get("sub")
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    # Refresh Token Rotation: Revoke previous refresh token
    if jti:
        exp_timestamp = decoded.get("exp")
        exp_dt = datetime.fromtimestamp(exp_timestamp, timezone.utc) if exp_timestamp else datetime.now(timezone.utc) + timedelta(days=7)
        revoke_token(db, jti, exp_dt)

    return _token_response(user, response)


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    # Extract access and refresh tokens to invalidate them server-side
    access_token = request.cookies.get("access_token")
    if not access_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ")[1]

    if access_token:
        decoded_access = decode_access_token(access_token)
        if decoded_access and decoded_access.get("jti"):
            exp_ts = decoded_access.get("exp")
            exp_dt = datetime.fromtimestamp(exp_ts, timezone.utc) if exp_ts else datetime.now(timezone.utc) + timedelta(hours=1)
            revoke_token(db, decoded_access["jti"], exp_dt)

    refresh_token_val = request.cookies.get("refresh_token")
    if refresh_token_val:
        decoded_refresh = decode_refresh_token(refresh_token_val)
        if decoded_refresh and decoded_refresh.get("jti"):
            exp_ts = decoded_refresh.get("exp")
            exp_dt = datetime.fromtimestamp(exp_ts, timezone.utc) if exp_ts else datetime.now(timezone.utc) + timedelta(days=7)
            revoke_token(db, decoded_refresh["jti"], exp_dt)

    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path=f"{settings.API_V1_STR}/auth/refresh")
    return {"detail": "Successfully logged out"}


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    if not name or len(name) > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name must be between 1 and 100 characters.",
        )
    return update_user_name(db, current_user, name)
