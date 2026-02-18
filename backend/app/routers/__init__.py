"""
API routers
"""

from .auth import router as auth_router
from .users import router as users_router
from .admin import router as admin_router
from .tools import router as tools_router
from .maintenance_requests import router as maintenance_requests_router

__all__ = ["auth_router", "users_router", "admin_router", "tools_router", "maintenance_requests_router"]