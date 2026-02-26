"""
Notification endpoints for super_admin users (Preet & Kanav).
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_active_user
from app.core.config import settings
from app.models.user import User
from app.models.notification import Notification

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def _require_super_admin(user: User):
    """Raise 403 if user does not have the super_admin role."""
    if not any(r.name == "super_admin" for r in user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin access required.",
        )


# ---------------------------------------------------------------------------
# Helper used by auth.py and users.py to create notification records
# ---------------------------------------------------------------------------
class NotificationService:
    @staticmethod
    def create(db: Session, *, ntype: str, title: str, data: dict):
        """Insert a notification row.  Caller wraps in try/except."""
        notif = Notification(
            type=ntype,
            title=title,
            message=json.dumps(data, default=str),
        )
        db.add(notif)
        db.commit()

    @staticmethod
    def create_standalone(ntype: str, title: str, data: dict):
        """Create notification using a fresh DB session (for use outside request context)."""
        from app.db.session import get_db
        try:
            db = next(get_db())
            notif = Notification(
                type=ntype,
                title=title,
                message=json.dumps(data, default=str),
            )
            db.add(notif)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to create notification: {e}", exc_info=True)
        finally:
            try:
                db.close()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------
@router.get("")
@router.get("/")
async def list_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List notifications, newest first.  Super_admin only."""
    _require_super_admin(current_user)

    q = db.query(Notification)
    if unread_only:
        q = q.filter(Notification.is_read == False)

    total = q.count()
    notifications = q.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    return {
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": json.loads(n.message) if n.message else {},
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ],
        "total": total,
    }


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Return count of unread notifications.  Super_admin only."""
    _require_super_admin(current_user)
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"count": count}


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark a single notification as read."""
    _require_super_admin(current_user)
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.patch("/mark-all-read")
async def mark_all_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Mark all notifications as read."""
    _require_super_admin(current_user)
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


# ---------------------------------------------------------------------------
# Webhook for external apps (Nexus) to push login notifications
# ---------------------------------------------------------------------------
class ExternalLoginWebhook(BaseModel):
    app: str  # "nexus", "kosh", etc.
    username: str
    full_name: str
    login_time: str
    secret: str  # shared SSO secret for authentication


@router.post("/webhook/login")
async def webhook_login(
    payload: ExternalLoginWebhook,
    db: Session = Depends(get_db),
):
    """Receive login notifications from external apps (Nexus, Kosh)."""
    # Authenticate using the shared SSO secret
    if payload.secret != settings.SSO_SECRET_KEY:
        raise HTTPException(status_code=401, detail="Invalid secret")

    app_name = payload.app.upper()
    ntype = f"{payload.app.lower()}_login"

    try:
        NotificationService.create(
            db,
            ntype=ntype,
            title=f"{payload.full_name} logged into {app_name}",
            data={
                "username": payload.username,
                "full_name": payload.full_name,
                "login_time": payload.login_time,
            },
        )
    except Exception as e:
        logger.error(f"Failed to create webhook notification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create notification")

    return {"message": "Notification created"}
