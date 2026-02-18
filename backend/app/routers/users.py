"""
User-related routes for authenticated users
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.schemas.auth import ResetPasswordWithCurrentRequest, PasswordResetResponse, LoginRequest
from app.services.user import UserService
from app.services.auth import AuthService

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/me", response_model=UserSchema)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user profile"""
    # Get user tools
    user_tools = UserService.get_user_tools(current_user, db)

    # Create user schema with tools
    user_schema = UserSchema.model_validate(current_user)
    user_schema.tools = user_tools

    return user_schema

@router.get("/me/roles")
async def get_current_user_roles(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's roles"""
    return {
        "user": current_user.username,
        "roles": [role.name for role in current_user.roles]
    }

@router.get("/me/tools")
async def get_current_user_tools(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's available tools"""
    tools = UserService.get_user_tools(current_user, db)
    return {
        "user": current_user.username,
        "tools": [
            {
                "id": tool.id,
                "name": tool.name,
                "display_name": tool.display_name,
                "description": tool.description,
                "route": tool.route,
                "icon": tool.icon
            }
            for tool in tools
        ]
    }

# Shared function for getting all users
async def _get_all_users_logic(current_user: User, db: Session):
    """Get all users logic (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )

    from app.services.user import UserService
    users = UserService.get_users(db)

    # Add tools for each user
    user_list = []
    for user in users:
        user_tools = UserService.get_user_tools(user, db)
        user_dict = {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat() if hasattr(user, 'created_at') and user.created_at else None,
            "roles": [{"id": r.id, "name": r.name, "description": r.description} for r in user.roles],
            "tools": [{"id": t.id, "name": t.name, "display_name": t.display_name, "description": t.description} for t in user_tools]
        }
        user_list.append(user_dict)

    return user_list

# Admin endpoints - handle both with and without trailing slash
@router.get("/", response_model=list)
@router.get("", response_model=list, include_in_schema=False)
async def get_all_users_admin(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all users (SuperUser only)"""
    return await _get_all_users_logic(current_user, db)

@router.post("/", response_model=dict)
async def create_user_admin(
    user_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create new user (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )
    
    try:
        from app.services.user import UserService
        from app.core.security import get_password_hash
        from app.models.role import Role
        from app.models.tool import Tool
        
        # Create user
        user = User(
            full_name=user_data["full_name"],
            username=user_data["username"].lower(),
            email=user_data["email"].lower(),
            password_hash=get_password_hash(user_data["password"]),
            is_active=True
        )
        
        # Add roles
        if "role_ids" in user_data:
            roles = db.query(Role).filter(Role.id.in_(user_data["role_ids"])).all()
            user.roles = roles
        
        # Add tools
        if "tool_ids" in user_data:
            tools = db.query(Tool).filter(Tool.id.in_(user_data["tool_ids"])).all()
            user.tools = tools
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "message": "User created successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {str(e)}"
        )

@router.put("/{user_id}", response_model=dict)
async def update_user_admin(
    user_id: int,
    user_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        from app.models.role import Role
        from app.models.tool import Tool
        
        # Update basic fields
        if "full_name" in user_data:
            user.full_name = user_data["full_name"]
        if "email" in user_data:
            user.email = user_data["email"].lower()
        if "is_active" in user_data:
            user.is_active = user_data["is_active"]
        
        # Update roles
        if "role_ids" in user_data:
            roles = db.query(Role).filter(Role.id.in_(user_data["role_ids"])).all()
            user.roles = roles
        
        # Update tools
        if "tool_ids" in user_data:
            tools = db.query(Tool).filter(Tool.id.in_(user_data["tool_ids"])).all()
            user.tools = tools
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "full_name": user.full_name,
            "username": user.username,
            "email": user.email,
            "message": "User updated successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/{user_id}")
async def delete_user_admin(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete user (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete user: {str(e)}"
        )

# Email functionality
@router.post("/send-credentials-to-all")
async def send_credentials_to_all_users(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send credentials to all users via email (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )
    
    try:
        from app.services.user import UserService
        users = UserService.get_users(db)
        successful_sends = 0
        failed_sends = 0
        
        for user in users:
            try:
                # In a real implementation, you would send actual emails here
                print(f"Sending credentials to {user.email}")
                print(f"Username: {user.username}")
                print(f"Email: {user.email}")
                successful_sends += 1
            except Exception as e:
                print(f"Failed to send email to {user.email}: {e}")
                failed_sends += 1
        
        return {
            "message": "Credential sending process completed",
            "total_users": len(users),
            "successful_sends": successful_sends,
            "failed_sends": failed_sends
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send credentials: {str(e)}"
        )

@router.post("/send-credentials/{user_id}")
async def send_credentials_to_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Send credentials to specific user via email (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        # In a real implementation, you would send actual emails here
        print(f"Sending credentials to {user.email}")
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        
        return {
            "message": f"Credentials sent successfully to {user.email}",
            "user_email": user.email,
            "user_name": user.full_name
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send credentials: {str(e)}"
        )

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