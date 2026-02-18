"""
Dependencies for authentication and authorization
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.auth import AuthService
from app.services.user import UserService
from app.models.user import User

# OAuth2 security scheme
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token
    token = credentials.credentials
    
    # Get user from token
    user = AuthService.get_user_from_token(db, token, "access")
    if user is None:
        raise credentials_exception
    
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(role_name: str):
    """Dependency factory for role-based access control"""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not UserService.has_role(current_user, role_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {role_name}"
            )
        return current_user
    return role_checker

def require_tool_access(tool_name: str):
    """Dependency factory for tool-based access control"""
    def tool_checker(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        if not UserService.has_tool_access(current_user, tool_name, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required tool access: {tool_name}"
            )
        return current_user
    return tool_checker

# Shortcut dependencies for common roles
require_superuser = require_role("superuser")
require_manager = require_role("manager")
require_operator = require_role("operator")
require_maintenance = require_role("maintenance")

def require_maintenance_or_superuser(current_user: User = Depends(get_current_active_user)) -> User:
    """Require user to have either maintenance role or superuser role"""
    has_access = any(role.name in ["superuser", "maintenance"] for role in current_user.roles)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Required role: superuser or maintenance"
        )
    return current_user

# Tool access dependencies
require_compare_tool = require_tool_access("compare_tool")
require_aci_excel_migration = require_tool_access("aci_excel_migration")
require_aci_inventory = require_tool_access("aci_inventory")
require_aci_chat = require_tool_access("aci_chat")