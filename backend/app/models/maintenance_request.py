"""
Maintenance Request Model
Handles maintenance request submissions and tracking
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.models.base import BaseModel
import enum


class PriorityLevel(str, enum.Enum):
    """Priority levels for maintenance requests"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RequestStatus(str, enum.Enum):
    """Status of maintenance requests"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class WarrantyStatus(str, enum.Enum):
    """Warranty status options"""
    ACTIVE = "active"
    EXPIRED = "expired"
    NOT_APPLICABLE = "not_applicable"


class MaintenanceRequest(BaseModel):
    """
    Maintenance Request Model
    Stores all maintenance request information including equipment details,
    scheduling, warranty, and parts tracking
    """
    __tablename__ = "maintenance_requests"

    # Basic fields
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    company = Column(String(255), nullable=False, default="American Circuits, Inc.")
    team = Column(String(255), nullable=False, default="Internal Maintenance")
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False, index=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING, nullable=False, index=True)

    # Equipment details
    equipment_name = Column(String(255))
    location = Column(String(255))

    # Date fields
    requested_completion_date = Column(DateTime)
    last_maintenance_date = Column(DateTime)
    maintenance_cycle_days = Column(Integer)  # Regular maintenance cycle in days

    # Warranty information
    warranty_status = Column(Enum(WarrantyStatus), default=WarrantyStatus.NOT_APPLICABLE, nullable=False)
    warranty_expiry_date = Column(DateTime)

    # Parts and tracking
    part_order_list = Column(Text)  # Can store comma-separated or JSON string

    # File attachments (store as JSON array of filenames)
    attachments = Column(Text)  # JSON array: ["file1.jpg", "file2.pdf"]

    # Relationships
    submitter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    submitter = relationship("User", back_populates="maintenance_requests", foreign_keys=[submitter_id])

    # Audit fields for completion
    completed_at = Column(DateTime)
    completed_by_id = Column(Integer, ForeignKey("users.id"))
    completed_by = relationship("User", foreign_keys=[completed_by_id])

    def __repr__(self):
        return f"<MaintenanceRequest(id={self.id}, title='{self.title}', status='{self.status}')>"
