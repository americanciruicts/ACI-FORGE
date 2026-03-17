"""
Audit logging service for tracking security-relevant actions
"""

import logging
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


class AuditService:
    """Service for recording audit log entries"""

    @staticmethod
    def log(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> None:
        """
        Record an audit log entry.

        Args:
            db: Database session
            action: Action performed (e.g. "login", "user_create", "user_delete")
            user_id: ID of the user performing the action
            resource_type: Type of resource affected (e.g. "user", "maintenance_request")
            resource_id: ID of the affected resource
            details: Additional JSON-serializable details
            ip_address: IP address of the request
        """
        try:
            entry = AuditLog(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id is not None else None,
                details=details,
                ip_address=ip_address,
            )
            db.add(entry)
            db.commit()
        except Exception as e:
            logger.error("Failed to write audit log: %s", e, exc_info=True)
            try:
                db.rollback()
            except Exception:
                pass
