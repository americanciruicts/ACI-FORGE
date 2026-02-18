"""
Pydantic schemas for Maintenance Requests
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.maintenance_request import PriorityLevel, RequestStatus, WarrantyStatus


class MaintenanceRequestBase(BaseModel):
    """Base schema for maintenance request"""
    title: str = Field(..., min_length=1, max_length=255, description="Title of the maintenance request")
    description: str = Field(..., min_length=1, description="Detailed description of the issue or request")
    company: str = Field(default="American Circuits, Inc.", max_length=255, description="Company name")
    team: str = Field(default="Internal Maintenance", max_length=255, description="Team name")
    priority: PriorityLevel = Field(default=PriorityLevel.MEDIUM, description="Priority level")
    equipment_name: Optional[str] = Field(None, max_length=255, description="Name of the equipment")
    location: Optional[str] = Field(None, max_length=255, description="Location of the equipment")
    requested_completion_date: Optional[datetime] = Field(None, description="Requested completion date")
    last_maintenance_date: Optional[datetime] = Field(None, description="Date of last maintenance")
    maintenance_cycle_days: Optional[int] = Field(None, ge=0, description="Regular maintenance cycle in days")
    warranty_status: WarrantyStatus = Field(default=WarrantyStatus.NOT_APPLICABLE, description="Warranty status")
    warranty_expiry_date: Optional[datetime] = Field(None, description="Warranty expiration date")
    part_order_list: Optional[str] = Field(None, description="List of parts needed or ordered")


class MaintenanceRequestCreate(MaintenanceRequestBase):
    """Schema for creating a maintenance request"""
    attachments: Optional[List[str]] = Field(default_factory=list, description="List of attachment filenames")


class MaintenanceRequestUpdate(BaseModel):
    """Schema for updating a maintenance request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    company: Optional[str] = Field(None, max_length=255)
    team: Optional[str] = Field(None, max_length=255)
    priority: Optional[PriorityLevel] = None
    status: Optional[RequestStatus] = None
    equipment_name: Optional[str] = Field(None, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    requested_completion_date: Optional[datetime] = None
    last_maintenance_date: Optional[datetime] = None
    maintenance_cycle_days: Optional[int] = Field(None, ge=0)
    warranty_status: Optional[WarrantyStatus] = None
    warranty_expiry_date: Optional[datetime] = None
    part_order_list: Optional[str] = None
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None


class StatusUpdate(BaseModel):
    """Schema for updating just the status"""
    status: RequestStatus


class MaintenanceRequestResponse(MaintenanceRequestBase):
    """Schema for maintenance request response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: RequestStatus
    attachments: Optional[List[str]] = Field(default_factory=list)
    submitter_id: int
    submitter_email: Optional[str] = None
    submitter_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    completed_by_id: Optional[int] = None
    completed_by_name: Optional[str] = None


class MaintenanceRequestListResponse(BaseModel):
    """Schema for list of maintenance requests with metadata"""
    requests: List[MaintenanceRequestResponse]
    total: int
    page: int
    page_size: int
