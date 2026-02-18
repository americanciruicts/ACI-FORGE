"""
Pydantic schemas for API serialization
"""

from .user import User, UserCreate, UserUpdate, UserInDB
from .role import Role, RoleCreate
from .tool import Tool, ToolCreate, ToolUpdate
from .auth import Token, TokenData, LoginRequest, RefreshRequest
from .maintenance_request import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse,
    MaintenanceRequestListResponse,
    StatusUpdate
)

__all__ = [
    "User", "UserCreate", "UserUpdate", "UserInDB",
    "Role", "RoleCreate",
    "Tool", "ToolCreate", "ToolUpdate",
    "Token", "TokenData", "LoginRequest", "RefreshRequest",
    "MaintenanceRequestCreate", "MaintenanceRequestUpdate",
    "MaintenanceRequestResponse", "MaintenanceRequestListResponse",
    "StatusUpdate"
]