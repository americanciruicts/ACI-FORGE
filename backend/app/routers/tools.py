"""
Tool access routes
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.deps import (
    get_current_active_user,
    require_compare_tool,
    require_aci_excel_migration,
    require_aci_inventory,
    require_aci_chat
)
from app.models.user import User
from app.schemas.tool import Tool as ToolSchema
from app.services.user import UserService
from app.services.tool import ToolService

router = APIRouter(prefix="/api/tools", tags=["tools"])

@router.get("/", response_model=List[ToolSchema])
async def get_user_tools(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get tools assigned to current user"""
    tools = UserService.get_user_tools(current_user, db)
    return tools

@router.get("/{tool_id}", response_model=ToolSchema)
async def get_tool(
    tool_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific tool if user has access"""
    tool = ToolService.get_tool(db, tool_id)
    if not tool:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tool not found"
        )
    
    # Check if user has access to this tool
    user_tools = UserService.get_user_tools(current_user, db)
    if tool not in user_tools:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this tool"
        )
    
    return tool

# Specific tool access endpoints
@router.get("/compare/access")
async def access_compare_tool(
    current_user: User = Depends(require_compare_tool)
):
    """Access Compare Tool"""
    return {
        "message": "Compare Tool accessed successfully",
        "user": current_user.username,
        "tool": "Compare Tool"
    }


# Tool-specific functionality endpoints
@router.post("/compare/execute")
async def execute_compare_tool(
    data: dict,
    current_user: User = Depends(require_compare_tool)
):
    """Execute Compare Tool functionality"""
    return {
        "message": "Compare Tool executed",
        "user": current_user.username,
        "result": "Comparison completed",
        "data": data
    }


@router.get("/aci-excel-migration/access")
async def access_aci_excel_migration(
    current_user: User = Depends(require_aci_excel_migration)
):
    """Access ACI Excel Migration Tool"""
    return {
        "message": "ACI Excel Migration Tool accessed successfully",
        "user": current_user.username,
        "tool": "ACI Excel Migration"
    }

@router.post("/aci-excel-migration/execute")
async def execute_aci_excel_migration(
    data: dict,
    current_user: User = Depends(require_aci_excel_migration)
):
    """Execute ACI Excel Migration Tool functionality"""
    return {
        "message": "ACI Excel Migration Tool executed",
        "user": current_user.username,
        "result": "Excel migration completed",
        "data": data
    }

@router.get("/aci-inventory/access")
async def access_aci_inventory(
    current_user: User = Depends(require_aci_inventory)
):
    """Access Kosh Tool"""
    return {
        "message": "Kosh Tool accessed successfully",
        "user": current_user.username,
        "tool": "Kosh"
    }

@router.post("/aci-inventory/execute")
async def execute_aci_inventory(
    data: dict,
    current_user: User = Depends(require_aci_inventory)
):
    """Execute Kosh Tool functionality"""
    return {
        "message": "Kosh Tool executed",
        "user": current_user.username,
        "result": "Inventory operation completed",
        "data": data
    }

@router.get("/aci-chat/access")
async def access_aci_chat(
    current_user: User = Depends(require_aci_chat)
):
    """Access ACI Chat Tool"""
    return {
        "message": "ACI Chat Tool accessed successfully",
        "user": current_user.username,
        "tool": "ACI Chat",
        "url": "http://acidashboard.aci.local:4000"
    }

@router.post("/aci-chat/execute")
async def execute_aci_chat(
    data: dict,
    current_user: User = Depends(require_aci_chat)
):
    """Execute ACI Chat Tool functionality"""
    return {
        "message": "ACI Chat Tool executed",
        "user": current_user.username,
        "result": "AI chat session ready",
        "url": "http://acidashboard.aci.local:4000",
        "data": data
    }

# Admin endpoints for tools
@router.get("/admin/all", response_model=List[ToolSchema])
async def get_all_tools_admin(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all tools (SuperUser only)"""
    # Check if user is superuser
    if not any(role.name == 'superuser' for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. SuperUser required."
        )
    
    tools = ToolService.get_tools(db)
    return tools