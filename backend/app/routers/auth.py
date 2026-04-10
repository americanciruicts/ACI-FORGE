"""
Authentication routes
"""

import logging
import threading
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.auth import LoginRequest, Token, RefreshRequest, RefreshResponse, ResetPasswordWithCurrentRequest, PasswordResetResponse
from app.schemas.user import User as UserSchema
from app.schemas.tool import Tool as ToolSchema
from app.services.auth import AuthService
from app.services.user import UserService
from app.services.admin_notify import AdminNotifyService
from app.services.audit import AuditService
from app.core.security import create_access_token, blacklist_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta, timezone
from typing import Dict
from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()

# In-memory rate limiter for login attempts
_login_attempts: Dict[str, list] = defaultdict(list)
_rate_limit_lock = threading.Lock()
LOGIN_RATE_LIMIT = 50  # max failed attempts per day
LOGIN_RATE_WINDOW = 24 * 60 * 60  # 24 hours in seconds


def _check_rate_limit(ip: str) -> None:
    """Check if the IP has exceeded the login rate limit. Raises 429 if so."""
    now = time.time()
    with _rate_limit_lock:
        # Prune old attempts outside the window
        _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < LOGIN_RATE_WINDOW]
        if len(_login_attempts[ip]) >= LOGIN_RATE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please try again later.",
            )


def _record_failed_attempt(ip: str) -> None:
    """Record a failed login attempt for the given IP."""
    with _rate_limit_lock:
        _login_attempts[ip].append(time.time())


def _clear_attempts(ip: str) -> None:
    """Clear login attempts for an IP after successful login."""
    with _rate_limit_lock:
        _login_attempts.pop(ip, None)

router = APIRouter(prefix="/api/auth", tags=["authentication"])

@router.post("/login", response_model=Token)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Login endpoint that returns access and refresh tokens
    """
    # Rate limit check
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    _check_rate_limit(client_ip)

    # Authenticate user
    user = AuthService.authenticate_user(db, login_data)
    if not user:
        _record_failed_attempt(client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Clear rate limit on successful login
    _clear_attempts(client_ip)

    # Audit log: successful login
    try:
        AuditService.log(
            db,
            action="login",
            user_id=user.id,
            resource_type="user",
            resource_id=user.id,
            details={"username": user.username},
            ip_address=client_ip,
        )
    except Exception:
        pass

    # Create tokens
    tokens = AuthService.create_user_tokens(user)

    # Get user tools (superusers get all tools, others get assigned tools)
    user_tools = UserService.get_user_tools(user, db)

    # Prepare user schema with tools (convert to Pydantic before any DB commits)
    user_schema = UserSchema.model_validate(user)
    user_schema.tools = [ToolSchema.model_validate(tool) for tool in user_tools]

    # Notify Preet & Kanav about login (non-blocking)
    try:
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        login_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        AdminNotifyService.notify_user_login(
            username=user.username,
            full_name=user.full_name,
            login_time=login_time,
            ip_address=client_ip,
        )
    except Exception:
        pass  # Never block login for notification failure

    # Store in-app notification record (non-blocking)
    try:
        from app.routers.notifications import NotificationService
        client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
        login_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        NotificationService.create(
            db,
            ntype="login",
            title=f"{user.full_name} logged in",
            data={
                "username": user.username,
                "full_name": user.full_name,
                "ip_address": client_ip,
                "login_time": login_time,
            },
        )
    except Exception:
        pass

    return Token(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        token_type=tokens["token_type"],
        user=user_schema
    )

@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    refresh_data: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    # Verify refresh token
    username = AuthService.verify_refresh_token(refresh_data.refresh_token)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user
    user = UserService.get_user_by_username(db, username)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(user.username, access_token_expires)
    
    return RefreshResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Logout endpoint - blacklists the provided token so it cannot be reused
    """
    token = credentials.credentials
    blacklist_token(token)
    return {"message": "Successfully logged out"}

@router.post("/reset-password", response_model=PasswordResetResponse)
async def reset_password(
    request: ResetPasswordWithCurrentRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password with current password verification
    """
    # Authenticate user with current password
    login_data = LoginRequest(username=request.username, password=request.current_password)
    user = AuthService.authenticate_user(db, login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or current password"
        )
    
    # Validate new password strength
    if not AuthService.validate_password_strength(request.new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        )
    
    # Reset password
    success = AuthService.reset_password_by_username(db, request.username, request.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to reset password"
        )
    
    return PasswordResetResponse(message="Password successfully reset")

# /me endpoint is available at /api/v1/users/me