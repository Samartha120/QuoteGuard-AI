from sqlalchemy.orm import Session
from app.db.models import User, Company, PendingUser
from app.core.security import verify_password, hash_password
from datetime import datetime, timedelta, timezone
import secrets
import string
import uuid


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def _default_company_id(db: Session) -> str | None:
    company = db.query(Company).first()
    return company.id if company else None


def create_user(
    db: Session,
    name: str,
    email: str,
    password: str | None = None,
    role: str = "sales_manager",
) -> User:
    """Create a new active user under the default company. Password is optional
    for federated (e.g. Google) accounts that authenticate without one."""
    user = User(
        id=f"user_{uuid.uuid4().hex[:12]}",
        company_id=_default_company_id(db),
        email=email.lower().strip(),
        name=name.strip(),
        role=role,
        hashed_password=hash_password(password) if password else None,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_pending_user_by_email(db: Session, email: str) -> PendingUser | None:
    return db.query(PendingUser).filter(PendingUser.email == email).first()

def create_pending_user(db: Session, name: str, email: str, password: str) -> tuple[PendingUser, str]:
    # Generate 6 digit OTP
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    hashed_otp = hash_password(otp)
    hashed_pwd = hash_password(password)
    
    # Check if there's already a pending user for this email
    pending = get_pending_user_by_email(db, email)
    if pending:
        db.delete(pending)
        db.flush()

    now = datetime.now(timezone.utc)
    pending_user = PendingUser(
        email=email.lower().strip(),
        name=name.strip(),
        hashed_password=hashed_pwd,
        hashed_otp=hashed_otp,
        expires_at=now + timedelta(minutes=5),
        last_otp_sent_at=now,
        attempts=0,
        created_at=now,
    )
    db.add(pending_user)
    db.commit()
    db.refresh(pending_user)
    
    return pending_user, otp

def delete_pending_user(db: Session, email: str) -> None:
    pending = get_pending_user_by_email(db, email)
    if pending:
        db.delete(pending)
        db.commit()


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_user_name(db: Session, user: User, name: str) -> User:
    user.name = name
    db.commit()
    db.refresh(user)
    return user
