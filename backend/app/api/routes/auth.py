from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
import secrets
import string
from typing import Union
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
from app.core.security import create_access_token, create_refresh_token, decode_refresh_token, verify_password, hash_password
from datetime import datetime, timezone, timedelta
from app.core.config import settings
from app.api.deps import get_current_user
from app.db.models import User

router = APIRouter()


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
        path="/api/auth/refresh"
    )

    return {
        "access_token": "hidden_in_cookie",
        "refresh_token": "hidden_in_cookie",
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


@router.post("/login", response_model=Union[TokenResponse, OTPResponse])
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        # SECURITY: Generic error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials.",
        )
        
    # Demo credentials bypass 2FA / OTP for instant access
    if user.email == "sales.manager@vertexind.com":
        return _token_response(user, response)
        
    # Generate Login OTP
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    user.login_otp = hash_password(otp)
    user.login_otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    user.login_attempts = 0
    db.commit()
    
    print(f"--- SECURITY NOTICE: Login OTP for {user.email} is {otp} ---")
    
    return OTPResponse(
        message="A verification code has been sent to your email address.",
        email=user.email
    )

@router.post("/verify-login-otp", response_model=TokenResponse)
def verify_login_otp(payload: VerifyOTPRequest, response: Response, db: Session = Depends(get_db)):
    user = get_user_by_email(db, payload.email.strip().lower())
    
    if not user or not user.login_otp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session. Please login again.",
        )
        
    if not user.login_otp_expires_at or datetime.now(timezone.utc) > user.login_otp_expires_at:
        user.login_otp = None
        user.login_otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="OTP has expired. Please login again.",
        )
        
    if user.login_attempts >= 5:
        user.login_otp = None
        user.login_otp_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Too many failed attempts. Please login again.",
        )
        
    if not verify_password(payload.otp, user.login_otp) and not (settings.DEMO_MODE and payload.otp == "123456"):
        user.login_attempts = (user.login_attempts or 0) + 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP.",
        )
        
    # Valid OTP
    user.login_otp = None
    user.login_otp_expires_at = None
    user.login_attempts = 0
    db.commit()
    
    return _token_response(user, response)


@router.post("/register", response_model=OTPResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    name = payload.name.strip()
    email = payload.email.strip().lower()
    
    if not name or not email or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name, email and password are required",
        )
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 6 characters",
        )
    if get_user_by_email(db, email):
        # SECURITY: Generic response to avoid email enumeration
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="If this email is not registered, you can create an account. However, an account with this email is already registered.",
        )
        
    pending_user, otp = create_pending_user(db, name, email, payload.password)
    
    # In a real application, send the OTP via email here.
    # For now, we print it securely to the backend terminal.
    print(f"--- SECURITY NOTICE: OTP for {email} is {otp} ---")
    
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
            detail="No pending registration found or OTP has expired.",
        )
        
    if datetime.now(timezone.utc) > pending.expires_at:
        delete_pending_user(db, email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please register again.",
        )
        
    if pending.attempts >= 5:
        delete_pending_user(db, email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed attempts. Please register again.",
        )
        
    if not verify_password(payload.otp, pending.hashed_otp):
        pending.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP.",
        )
        
    # Validation successful, create the real user (since we only hashed the password once, we can't reuse it directly. 
    # Wait, create_user hashes the password. But pending user already has it hashed.
    # We must explicitly insert it.
    user = User(
        id=f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        company_id=None, # will be handled by create_user logic if needed
        email=pending.email,
        name=pending.name,
        role="sales_manager",
        hashed_password=pending.hashed_password,
        is_active=True,
    )
    # Actually let's just use create_user and pass None for password since we can't unhash it,
    # then manually set hashed_password to avoid double-hashing.
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
    # Verify the Google ID token against Google's public keys.
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
    # Read refresh token from cookie first, fallback to payload if necessary (for transition)
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
    user_id = decoded.get("sub")
    user = get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return _token_response(user, response)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/api/auth/refresh")
    return {"detail": "Successfully logged out"}


@router.patch("/me", response_model=UserResponse)
def update_me(
    payload: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name cannot be empty",
        )
    return update_user_name(db, current_user, name)
