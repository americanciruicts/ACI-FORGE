"""
Admin routes - SuperUser only
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import require_superuser
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserUpdate
from app.schemas.role import Role as RoleSchema, RoleCreate, RoleUpdate
from app.schemas.tool import Tool as ToolSchema, ToolCreate, ToolUpdate
from app.services.user import UserService
from app.services.role import RoleService
from app.services.tool import ToolService

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_superuser)])

# User Management
@router.get("/users", response_model=List[UserSchema])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Get all users (SuperUser only)"""
    users = UserService.get_users(db, skip=skip, limit=limit)
    
    # Add tools for each user
    user_schemas = []
    for user in users:
        user_tools = UserService.get_user_tools(user, db)
        user_schema = UserSchema.model_validate(user)
        user_schema.tools = user_tools
        user_schemas.append(user_schema)
    
    return user_schemas

@router.get("/users/{user_id}", response_model=UserSchema)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Get specific user by ID (SuperUser only)"""
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add user tools
    user_tools = UserService.get_user_tools(user, db)
    user_schema = UserSchema.model_validate(user)
    user_schema.tools = user_tools
    
    return user_schema

@router.post("/users", response_model=UserSchema)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Create new user (SuperUser only)"""
    user = UserService.create_user(db, user_data)
    
    # Add user tools
    user_tools = UserService.get_user_tools(user, db)
    user_schema = UserSchema.model_validate(user)
    user_schema.tools = user_tools
    
    return user_schema

@router.put("/users/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Update user (SuperUser only)"""
    user = UserService.update_user(db, user_id, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Add user tools
    user_tools = UserService.get_user_tools(user, db)
    user_schema = UserSchema.model_validate(user)
    user_schema.tools = user_tools
    
    return user_schema

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Delete user (SuperUser only)"""
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    success = UserService.delete_user(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}

# Role Management
@router.get("/roles", response_model=List[RoleSchema])
async def get_all_roles(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Get all roles (SuperUser only)"""
    return RoleService.get_roles(db, skip=skip, limit=limit)

@router.post("/roles", response_model=RoleSchema)
async def create_role(
    role_data: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Create new role (SuperUser only)"""
    return RoleService.create_role(db, role_data)

@router.put("/roles/{role_id}", response_model=RoleSchema)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Update role (SuperUser only)"""
    role = RoleService.update_role(db, role_id, role_data)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Delete role (SuperUser only)"""
    success = RoleService.delete_role(db, role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return {"message": "Role deleted successfully"}

# Tool Management
@router.get("/tools", response_model=List[ToolSchema])
async def get_all_tools(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Get all tools (SuperUser only)"""
    return ToolService.get_tools(db, skip=skip, limit=limit)

@router.post("/tools", response_model=ToolSchema)
async def create_tool(
    tool_data: ToolCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Create new tool (SuperUser only)"""
    return ToolService.create_tool(db, tool_data)

@router.put("/tools/{tool_id}", response_model=ToolSchema)
async def update_tool(
    tool_id: int,
    tool_data: ToolUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Update tool (SuperUser only)"""
    tool = ToolService.update_tool(db, tool_id, tool_data)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )
    return tool

@router.delete("/tools/{tool_id}")
async def delete_tool(
    tool_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superuser)
):
    """Delete tool (SuperUser only)"""
    success = ToolService.delete_tool(db, tool_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )
    return {"message": "Tool deleted successfully"}