"""
Maintenance Request Router
API endpoints for maintenance request management
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import json

from app.db.session import get_db
from app.core.deps import (
    get_current_active_user,
    require_maintenance_or_superuser,
    require_superuser
)
from app.models.user import User
from app.models.maintenance_request import MaintenanceRequest
from app.schemas.maintenance_request import (
    MaintenanceRequestCreate,
    MaintenanceRequestUpdate,
    MaintenanceRequestResponse,
    MaintenanceRequestListResponse,
    StatusUpdate
)
from app.services.maintenance_request import MaintenanceRequestService
from app.services.user import UserService
from app.services.email import email_service
from app.utils.file_upload import (
    save_upload_file,
    save_multiple_files,
    get_file_path,
    get_file_info,
    init_upload_directory
)

router = APIRouter(prefix="/api/maintenance-requests", tags=["maintenance-requests"])

# Initialize upload directory
init_upload_directory()


@router.post("", response_model=MaintenanceRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_request(
    request_data: MaintenanceRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new maintenance request

    Any authenticated user can submit a maintenance request
    """
    try:
        # Create the request
        new_request = MaintenanceRequestService.create_request(db, request_data, current_user)

        # Send email notification to all superusers
        superusers = db.query(User).join(User.roles).filter(
            User.roles.any(name="superuser")
        ).all()

        if superusers:
            superuser_emails = [user.email for user in superusers]

            email_data = {
                "title": new_request.title,
                "priority": new_request.priority.value,
                "description": new_request.description,
                "submitter_name": current_user.full_name,
                "submitter_email": current_user.email,
                "equipment_name": new_request.equipment_name,
                "location": new_request.location,
                "created_at": new_request.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_request.created_at else "N/A"
            }

            email_service.send_maintenance_request_notification(superuser_emails, email_data)

        # Format response
        response = MaintenanceRequestResponse(
            id=new_request.id,
            title=new_request.title,
            description=new_request.description,
            priority=new_request.priority,
            status=new_request.status,
            equipment_name=new_request.equipment_name,
            location=new_request.location,
            requested_completion_date=new_request.requested_completion_date,
            last_maintenance_date=new_request.last_maintenance_date,
            maintenance_cycle_days=new_request.maintenance_cycle_days,
            warranty_status=new_request.warranty_status,
            warranty_expiry_date=new_request.warranty_expiry_date,
            part_order_list=new_request.part_order_list,
            attachments=json.loads(new_request.attachments) if new_request.attachments else [],
            submitter_id=new_request.submitter_id,
            submitter_email=new_request.submitter.email,
            submitter_name=new_request.submitter.full_name,
            created_at=new_request.created_at,
            updated_at=new_request.updated_at,
            completed_at=new_request.completed_at,
            completed_by_id=new_request.completed_by_id
        )

        return response

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create maintenance request: {str(e)}"
        )


@router.get("", response_model=MaintenanceRequestListResponse)
def get_all_maintenance_requests(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_maintenance_or_superuser),
    db: Session = Depends(get_db)
):
    """
    Get all maintenance requests (requires maintenance or superuser role)

    Supports filtering by status, priority, and search term
    """
    requests, total = MaintenanceRequestService.get_all_requests(
        db,
        skip=skip,
        limit=limit,
        status_filter=status_filter,
        priority_filter=priority_filter,
        search=search
    )

    # Format responses
    formatted_requests = []
    for req in requests:
        formatted_requests.append(MaintenanceRequestResponse(
            id=req.id,
            title=req.title,
            description=req.description,
            priority=req.priority,
            status=req.status,
            equipment_name=req.equipment_name,
            location=req.location,
            requested_completion_date=req.requested_completion_date,
            last_maintenance_date=req.last_maintenance_date,
            maintenance_cycle_days=req.maintenance_cycle_days,
            warranty_status=req.warranty_status,
            warranty_expiry_date=req.warranty_expiry_date,
            part_order_list=req.part_order_list,
            attachments=json.loads(req.attachments) if req.attachments else [],
            submitter_id=req.submitter_id,
            submitter_email=req.submitter.email,
            submitter_name=req.submitter.full_name,
            created_at=req.created_at,
            updated_at=req.updated_at,
            completed_at=req.completed_at,
            completed_by_id=req.completed_by_id,
            completed_by_name=req.completed_by.full_name if req.completed_by else None
        ))

    page = skip // limit + 1 if limit > 0 else 1

    return MaintenanceRequestListResponse(
        requests=formatted_requests,
        total=total,
        page=page,
        page_size=limit
    )


@router.get("/my-requests", response_model=MaintenanceRequestListResponse)
def get_my_maintenance_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's maintenance requests

    Any authenticated user can view their own requests
    """
    requests, total = MaintenanceRequestService.get_user_requests(
        db,
        user_id=current_user.id,
        skip=skip,
        limit=limit
    )

    # Format responses
    formatted_requests = []
    for req in requests:
        formatted_requests.append(MaintenanceRequestResponse(
            id=req.id,
            title=req.title,
            description=req.description,
            priority=req.priority,
            status=req.status,
            equipment_name=req.equipment_name,
            location=req.location,
            requested_completion_date=req.requested_completion_date,
            last_maintenance_date=req.last_maintenance_date,
            maintenance_cycle_days=req.maintenance_cycle_days,
            warranty_status=req.warranty_status,
            warranty_expiry_date=req.warranty_expiry_date,
            part_order_list=req.part_order_list,
            attachments=json.loads(req.attachments) if req.attachments else [],
            submitter_id=req.submitter_id,
            submitter_email=req.submitter.email,
            submitter_name=req.submitter.full_name,
            created_at=req.created_at,
            updated_at=req.updated_at,
            completed_at=req.completed_at,
            completed_by_id=req.completed_by_id,
            completed_by_name=req.completed_by.full_name if req.completed_by else None
        ))

    page = skip // limit + 1 if limit > 0 else 1

    return MaintenanceRequestListResponse(
        requests=formatted_requests,
        total=total,
        page=page,
        page_size=limit
    )


@router.get("/statistics")
def get_maintenance_statistics(
    current_user: User = Depends(require_maintenance_or_superuser),
    db: Session = Depends(get_db)
):
    """
    Get maintenance request statistics

    Returns counts of total, pending, in progress, completed, and urgent requests
    """
    return MaintenanceRequestService.get_statistics(db)


@router.get("/{request_id}", response_model=MaintenanceRequestResponse)
def get_maintenance_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a single maintenance request by ID

    Users can view their own requests or if they have maintenance/superuser role
    """
    request = MaintenanceRequestService.get_request(db, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    # Check permissions
    if not MaintenanceRequestService.can_view_request(current_user, request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this request"
        )

    return MaintenanceRequestResponse(
        id=request.id,
        title=request.title,
        description=request.description,
        priority=request.priority,
        status=request.status,
        equipment_name=request.equipment_name,
        location=request.location,
        requested_completion_date=request.requested_completion_date,
        last_maintenance_date=request.last_maintenance_date,
        maintenance_cycle_days=request.maintenance_cycle_days,
        warranty_status=request.warranty_status,
        warranty_expiry_date=request.warranty_expiry_date,
        part_order_list=request.part_order_list,
        attachments=json.loads(request.attachments) if request.attachments else [],
        submitter_id=request.submitter_id,
        submitter_email=request.submitter.email,
        submitter_name=request.submitter.full_name,
        created_at=request.created_at,
        updated_at=request.updated_at,
        completed_at=request.completed_at,
        completed_by_id=request.completed_by_id,
        completed_by_name=request.completed_by.full_name if request.completed_by else None
    )


@router.put("/{request_id}", response_model=MaintenanceRequestResponse)
def update_maintenance_request(
    request_id: int,
    update_data: MaintenanceRequestUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a maintenance request

    Users can update their own requests or if they have maintenance/superuser role
    """
    request = MaintenanceRequestService.get_request(db, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    # Check permissions
    if not MaintenanceRequestService.can_edit_request(current_user, request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this request"
        )

    updated_request = MaintenanceRequestService.update_request(db, request_id, update_data, current_user)

    return MaintenanceRequestResponse(
        id=updated_request.id,
        title=updated_request.title,
        description=updated_request.description,
        priority=updated_request.priority,
        status=updated_request.status,
        equipment_name=updated_request.equipment_name,
        location=updated_request.location,
        requested_completion_date=updated_request.requested_completion_date,
        last_maintenance_date=updated_request.last_maintenance_date,
        maintenance_cycle_days=updated_request.maintenance_cycle_days,
        warranty_status=updated_request.warranty_status,
        warranty_expiry_date=updated_request.warranty_expiry_date,
        part_order_list=updated_request.part_order_list,
        attachments=json.loads(updated_request.attachments) if updated_request.attachments else [],
        submitter_id=updated_request.submitter_id,
        submitter_email=updated_request.submitter.email,
        submitter_name=updated_request.submitter.full_name,
        created_at=updated_request.created_at,
        updated_at=updated_request.updated_at,
        completed_at=updated_request.completed_at,
        completed_by_id=updated_request.completed_by_id,
        completed_by_name=updated_request.completed_by.full_name if updated_request.completed_by else None
    )


@router.patch("/{request_id}/status", response_model=MaintenanceRequestResponse)
def update_request_status(
    request_id: int,
    status_update: StatusUpdate,
    current_user: User = Depends(require_maintenance_or_superuser),
    db: Session = Depends(get_db)
):
    """
    Update the status of a maintenance request

    Requires maintenance or superuser role
    """
    updated_request = MaintenanceRequestService.update_status(
        db,
        request_id,
        status_update.status,
        current_user
    )

    return MaintenanceRequestResponse(
        id=updated_request.id,
        title=updated_request.title,
        description=updated_request.description,
        priority=updated_request.priority,
        status=updated_request.status,
        equipment_name=updated_request.equipment_name,
        location=updated_request.location,
        requested_completion_date=updated_request.requested_completion_date,
        last_maintenance_date=updated_request.last_maintenance_date,
        maintenance_cycle_days=updated_request.maintenance_cycle_days,
        warranty_status=updated_request.warranty_status,
        warranty_expiry_date=updated_request.warranty_expiry_date,
        part_order_list=updated_request.part_order_list,
        attachments=json.loads(updated_request.attachments) if updated_request.attachments else [],
        submitter_id=updated_request.submitter_id,
        submitter_email=updated_request.submitter.email,
        submitter_name=updated_request.submitter.full_name,
        created_at=updated_request.created_at,
        updated_at=updated_request.updated_at,
        completed_at=updated_request.completed_at,
        completed_by_id=updated_request.completed_by_id,
        completed_by_name=updated_request.completed_by.full_name if updated_request.completed_by else None
    )


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_maintenance_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a maintenance request

    Users can delete their own requests or superusers can delete any request
    """
    request = MaintenanceRequestService.get_request(db, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    # Check permissions - owner or superuser
    is_owner = request.submitter_id == current_user.id
    is_superuser = any(role.name == "superuser" for role in current_user.roles)

    if not is_owner and not is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this request"
        )

    MaintenanceRequestService.delete_request(db, request_id)


@router.post("/{request_id}/upload")
async def upload_attachment(
    request_id: int,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload attachments to a maintenance request

    Users can upload to their own requests or if they have maintenance/superuser role
    """
    request = MaintenanceRequestService.get_request(db, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    # Check permissions
    if not MaintenanceRequestService.can_edit_request(current_user, request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to upload to this request"
        )

    try:
        # Save files
        filenames = await save_multiple_files(files)

        # Add to request
        updated_request = MaintenanceRequestService.add_attachments(db, request_id, filenames)

        return {
            "message": "Files uploaded successfully",
            "filenames": filenames,
            "total_attachments": len(json.loads(updated_request.attachments))
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload files: {str(e)}"
        )


@router.get("/{request_id}/attachments/{filename}")
async def download_attachment(
    request_id: int,
    filename: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Download an attachment from a maintenance request

    Users can download from requests they have access to view
    """
    request = MaintenanceRequestService.get_request(db, request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance request not found"
        )

    # Check permissions
    if not MaintenanceRequestService.can_view_request(current_user, request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this request's attachments"
        )

    # Verify filename is in request attachments
    attachments = json.loads(request.attachments) if request.attachments else []
    if filename not in attachments:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found in this request"
        )

    try:
        file_path = get_file_path(filename)
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/octet-stream"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {str(e)}"
        )
