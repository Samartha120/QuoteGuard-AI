"""Password hashing (bcrypt) and JWT issue/verify helpers for QuoteGuard auth."""
import bcrypt
import jwt
import uuid
import re
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings

# Common passwords to protect against dictionary attacks
COMMON_WEAK_PASSWORDS = {
    "password", "12345678", "123456789", "qwerty123", "admin123",
    "password123", "welcome123", "letmein123", "changeme123"
}

# Constant pre-computed hash for dummy timing-equalized comparison
_DUMMY_BCRYPT_HASH = "$2b$12$K1dCwhc92wzZJ3h6eH2q4uH5j8w.fI1j2k3l4m5n6o7p8q9r0s1t2"


def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: Optional[str]) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def dummy_verify_password() -> bool:
    """Performs constant-time hash verification to neutralize timing side-channels
    when an email does not exist in the database."""
    try:
        bcrypt.checkpw(b"dummy_timing_probe", _DUMMY_BCRYPT_HASH.encode("utf-8"))
    except Exception:
        pass
    return False


def validate_password_strength(password: str) -> None:
    """Enforces server-side password security constraints without excessive complexity rules."""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(password) > 128:
        raise ValueError("Password cannot exceed 128 characters.")
    if password.lower() in COMMON_WEAK_PASSWORDS and not settings.DEMO_MODE:
        raise ValueError("This password is too common and easily guessed. Please choose a stronger password.")


def create_access_token(subject: str, extra: Optional[dict] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jti = uuid.uuid4().hex
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "jti": jti,
        "iss": settings.JWT_ISSUER,
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    days = getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 7)
    expire = now + timedelta(days=days)
    jti = uuid.uuid4().hex
    payload = {
        "sub": subject,
        "exp": expire,
        "iat": now,
        "jti": jti,
        "iss": settings.JWT_ISSUER,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]}
        )
        if payload.get("type") == "refresh":
            return None
        return payload
    except jwt.PyJWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]}
        )
        if payload.get("type") != "refresh":
            return None
        return payload
    except jwt.PyJWTError:
        return None


def revoke_token(db: Session, jti: str, expires_at: datetime) -> None:
    """Records a revoked JWT ID into the database blacklist."""
    from app.db.models import RevokedToken
    existing = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
    if not existing:
        token_entry = RevokedToken(jti=jti, expires_at=expires_at)
        db.add(token_entry)
        db.commit()


def is_token_revoked(db: Session, jti: Optional[str]) -> bool:
    """Checks whether a token JTI has been invalidated/logged out."""
    if not jti:
        return False
    from app.db.models import RevokedToken
    return db.query(RevokedToken).filter(RevokedToken.jti == jti).first() is not None
