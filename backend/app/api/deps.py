from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
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
        
    user = get_user_by_id(db, payload["sub"])
    if not user or not user.is_active:
        raise unauthorized
        
    return user
