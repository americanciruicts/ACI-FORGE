"""
Maintenance Request Service
Business logic for maintenance request operations
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc
from fastapi import HTTPException, status
from datetime import datetime, timezone
import json

from app.models.maintenance_request import MaintenanceRequest, RequestStatus
from app.models.user import User
from app.schemas.maintenance_request import MaintenanceRequestCreate, MaintenanceRequestUpdate


class MaintenanceRequestService:
    """Service for maintenance request operations"""

    @staticmethod
    def create_request(
        db: Session,
        request_data: MaintenanceRequestCreate,
        submitter: User
    ) -> MaintenanceRequest:
        """
        Create a new maintenance request

        Args:
            db: Database session
            request_data: Request data from form
            submitter: User submitting the request

        Returns:
            Created maintenance request
        """
        # Convert attachments list to JSON string
        attachments_json = json.dumps(request_data.attachments) if request_data.attachments else "[]"

        # Create request object
        db_request = MaintenanceRequest(
            title=request_data.title,
            description=request_data.description,
            priority=request_data.priority,
            equipment_name=request_data.equipment_name,
            location=request_data.location,
            requested_completion_date=request_data.requested_completion_date,
            last_maintenance_date=request_data.last_maintenance_date,
            maintenance_cycle_days=request_data.maintenance_cycle_days,
            warranty_status=request_data.warranty_status,
            warranty_expiry_date=request_data.warranty_expiry_date,
            part_order_list=request_data.part_order_list,
            attachments=attachments_json,
            submitter_id=submitter.id,
            status=RequestStatus.PENDING
        )

        db.add(db_request)
        db.commit()
        db.refresh(db_request)

        return db_request

    @staticmethod
    def get_request(db: Session, request_id: int) -> Optional[MaintenanceRequest]:
        """
        Get a single maintenance request by ID

        Args:
            db: Database session
            request_id: Request ID

        Returns:
            Maintenance request or None
        """
        return db.query(MaintenanceRequest).options(
            joinedload(MaintenanceRequest.submitter),
            joinedload(MaintenanceRequest.completed_by)
        ).filter(MaintenanceRequest.id == request_id).first()

    @staticmethod
    def get_all_requests(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        status_filter: Optional[str] = None,
        priority_filter: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[MaintenanceRequest], int]:
        """
        Get all maintenance requests with filters

        Args:
            db: Database session
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            status_filter: Filter by status
            priority_filter: Filter by priority
            search: Search term for title, description, equipment

        Returns:
            Tuple of (requests list, total count)
        """
        query = db.query(MaintenanceRequest).options(
            joinedload(MaintenanceRequest.submitter)
        )

        # Apply filters
        filters = []

        if status_filter:
            filters.append(MaintenanceRequest.status == status_filter)

        if priority_filter:
            filters.append(MaintenanceRequest.priority == priority_filter)

        if search:
            search_term = f"%{search}%"
            filters.append(or_(
                MaintenanceRequest.title.ilike(search_term),
                MaintenanceRequest.description.ilike(search_term),
                MaintenanceRequest.equipment_name.ilike(search_term),
                MaintenanceRequest.location.ilike(search_term)
            ))

        if filters:
            query = query.filter(and_(*filters))

        # Get total count
        total = query.count()

        # Apply pagination and ordering
        requests = query.order_by(desc(MaintenanceRequest.created_at)).offset(skip).limit(limit).all()

        return requests, total

    @staticmethod
    def get_user_requests(
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> tuple[List[MaintenanceRequest], int]:
        """
        Get maintenance requests submitted by a specific user

        Args:
            db: Database session
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            Tuple of (requests list, total count)
        """
        query = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.submitter_id == user_id
        )

        total = query.count()

        requests = query.order_by(desc(MaintenanceRequest.created_at)).offset(skip).limit(limit).all()

        return requests, total

    @staticmethod
    def update_request(
        db: Session,
        request_id: int,
        update_data: MaintenanceRequestUpdate,
        user: User
    ) -> MaintenanceRequest:
        """
        Update a maintenance request

        Args:
            db: Database session
            request_id: Request ID to update
            update_data: Updated data
            user: User performing the update

        Returns:
            Updated maintenance request

        Raises:
            HTTPException: If request not found
        """
        db_request = MaintenanceRequestService.get_request(db, request_id)

        if not db_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Maintenance request not found"
            )

        # Update fields that are provided
        update_dict = update_data.model_dump(exclude_unset=True)

        for field, value in update_dict.items():
            setattr(db_request, field, value)

        # If status is being changed to completed, record completion details
        if update_data.status == RequestStatus.COMPLETED and db_request.status != RequestStatus.COMPLETED:
            db_request.completed_at = datetime.now(timezone.utc)
            db_request.completed_by_id = user.id

        db.commit()
        db.refresh(db_request)

        return db_request

    @staticmethod
    def update_status(
        db: Session,
        request_id: int,
        new_status: RequestStatus,
        user: User
    ) -> MaintenanceRequest:
        """
        Update just the status of a request

        Args:
            db: Database session
            request_id: Request ID
            new_status: New status
            user: User performing the update

        Returns:
            Updated maintenance request
        """
        update_data = MaintenanceRequestUpdate(status=new_status)
        return MaintenanceRequestService.update_request(db, request_id, update_data, user)

    @staticmethod
    def delete_request(db: Session, request_id: int) -> bool:
        """
        Delete a maintenance request

        Args:
            db: Database session
            request_id: Request ID to delete

        Returns:
            True if deleted, False if not found

        Note:
            This also deletes associated attachments
        """
        db_request = MaintenanceRequestService.get_request(db, request_id)

        if not db_request:
            return False

        # Delete associated files
        if db_request.attachments:
            from app.utils.file_upload import delete_multiple_files
            try:
                attachments = json.loads(db_request.attachments)
                delete_multiple_files(attachments)
            except json.JSONDecodeError:
                pass

        db.delete(db_request)
        db.commit()

        return True

    @staticmethod
    def add_attachments(
        db: Session,
        request_id: int,
        new_filenames: List[str]
    ) -> MaintenanceRequest:
        """
        Add attachments to a request

        Args:
            db: Database session
            request_id: Request ID
            new_filenames: List of new filenames to add

        Returns:
            Updated maintenance request
        """
        db_request = MaintenanceRequestService.get_request(db, request_id)

        if not db_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Maintenance request not found"
            )

        # Get existing attachments
        existing_attachments = json.loads(db_request.attachments) if db_request.attachments else []

        # Add new attachments
        existing_attachments.extend(new_filenames)

        # Update
        db_request.attachments = json.dumps(existing_attachments)

        db.commit()
        db.refresh(db_request)

        return db_request

    @staticmethod
    def can_view_request(user: User, request: MaintenanceRequest) -> bool:
        """
        Check if user can view a request

        Args:
            user: User to check
            request: Request to check access for

        Returns:
            True if user can view
        """
        # User is the submitter
        if request.submitter_id == user.id:
            return True

        # User is superuser or has maintenance role
        return MaintenanceRequestService.has_maintenance_access(user)

    @staticmethod
    def can_edit_request(user: User, request: MaintenanceRequest) -> bool:
        """
        Check if user can edit a request

        Args:
            user: User to check
            request: Request to check access for

        Returns:
            True if user can edit
        """
        # User is the submitter
        if request.submitter_id == user.id:
            return True

        # User has maintenance role or is superuser (can edit any request)
        return MaintenanceRequestService.has_maintenance_access(user)

    @staticmethod
    def has_maintenance_access(user: User) -> bool:
        """
        Check if user has maintenance role or is superuser

        Args:
            user: User to check

        Returns:
            True if user has access
        """
        return any(role.name in ["superuser", "maintenance"] for role in user.roles)

    @staticmethod
    def get_statistics(db: Session) -> dict:
        """
        Get maintenance request statistics

        Args:
            db: Database session

        Returns:
            Dictionary with statistics
        """
        total = db.query(MaintenanceRequest).count()
        pending = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == RequestStatus.PENDING).count()
        in_progress = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == RequestStatus.IN_PROGRESS).count()
        completed = db.query(MaintenanceRequest).filter(MaintenanceRequest.status == RequestStatus.COMPLETED).count()
        urgent = db.query(MaintenanceRequest).filter(
            MaintenanceRequest.priority == "urgent",
            MaintenanceRequest.status != RequestStatus.COMPLETED
        ).count()

        return {
            "total": total,
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "urgent": urgent
        }
