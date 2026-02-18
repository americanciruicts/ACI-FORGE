"""
User model with relationships
"""

from sqlalchemy import Column, String, Boolean, Table, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

# Association tables for many-to-many relationships
user_roles = Table(
    'user_roles',
    BaseModel.metadata,
    Column('user_id', ForeignKey('users.id'), primary_key=True),
    Column('role_id', ForeignKey('roles.id'), primary_key=True)
)

user_tools = Table(
    'user_tools', 
    BaseModel.metadata,
    Column('user_id', ForeignKey('users.id'), primary_key=True),
    Column('tool_id', ForeignKey('tools.id'), primary_key=True)
)

class User(BaseModel):
    """User model with authentication and authorization"""
    __tablename__ = "users"
    
    full_name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    roles = relationship("Role", secondary=user_roles, lazy="joined")
    tools = relationship("Tool", secondary=user_tools, lazy="joined")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="submitter", foreign_keys="[MaintenanceRequest.submitter_id]")