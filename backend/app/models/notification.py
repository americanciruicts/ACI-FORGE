"""
Notification model for in-app notifications (super_admin only).
"""

from sqlalchemy import Column, String, Text, Boolean
from .base import BaseModel


class Notification(BaseModel):
    """Stores login and user-creation events for super_admin viewing."""
    __tablename__ = "notifications"

    type = Column(String(50), nullable=False, index=True)   # "login" | "user_created"
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)                   # JSON string with details
    is_read = Column(Boolean, default=False, nullable=False)
