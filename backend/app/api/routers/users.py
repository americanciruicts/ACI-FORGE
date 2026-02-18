"""
User-related routes for authenticated users
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.user import User as UserSchema
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])

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