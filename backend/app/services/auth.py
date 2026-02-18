"""
Authentication service
"""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import verify_password, create_tokens, verify_token, hash_password
from app.models.user import User
from app.schemas.auth import LoginRequest
import re
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Authentication service"""
    
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest) -> Optional[User]:
        """Authenticate user by username and password"""
        user = db.query(User).filter(User.username == login_data.username.lower()).first()
        if not user:
            return None
        if not verify_password(login_data.password, user.password_hash):
            return None
        if not user.is_active:
            return None
        return user
    
    @staticmethod
    def create_user_tokens(user: User) -> dict:
        """Create access and refresh tokens for user"""
        return create_tokens(user.username)
    
    @staticmethod
    def verify_refresh_token(refresh_token: str) -> Optional[str]:
        """Verify refresh token and return username"""
        return verify_token(refresh_token, "refresh")
    
    @staticmethod
    def get_user_from_token(db: Session, token: str, token_type: str = "access") -> Optional[User]:
        """Get user from JWT token"""
        username = verify_token(token, token_type)
        if username is None:
            return None
        
        user = db.query(User).filter(User.username == username).first()
        if not user or not user.is_active:
            return None
        
        return user
    
    @staticmethod
    def validate_password_strength(password: str) -> bool:
        """Validate password strength according to security requirements"""
        if len(password) < 8:
            return False
        if not re.search(r"[A-Z]", password):
            return False
        if not re.search(r"[a-z]", password):
            return False
        if not re.search(r"\d", password):
            return False
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            return False
        return True
    
    @staticmethod
    def reset_password_by_username(db: Session, username: str, new_password: str) -> bool:
        """Reset user password by username"""
        try:
            user = db.query(User).filter(User.username == username.lower()).first()
            if not user:
                return False
            
            # Hash the new password
            hashed_password = hash_password(new_password)
            
            # Update user password
            user.password_hash = hashed_password
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            logger.error(f"Error resetting password: {e}", exc_info=True)
            return False