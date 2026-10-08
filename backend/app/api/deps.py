from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token, is_token_revoked
from app.services.auth_service import get_user_by_id
from app.db.models import User

def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            
    if not token:
        raise unauthorized

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise unauthorized

    # Check if the token has been explicitly revoked upon logout
    if is_token_revoked(db, payload.get("jti")):
        raise unauthorized
        
    user = get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise unauthorized
        
    return user


def require_roles(*allowed_roles: str):
    """Enforces server-side Role-Based Access Control (RBAC)."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )
        return current_user
    return role_checker
