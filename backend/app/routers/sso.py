"""
SSO (Single Sign-On) routes for cross-app authentication.
Generates short-lived SSO tokens that target apps can validate.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from app.db.session import get_db
from app.core.config import settings
from app.core.deps import get_current_active_user
from app.services.user import UserService
from app.models.user import User

router = APIRouter(prefix="/api/auth/sso", tags=["sso"])

# Map tool names in FORGE DB to target app identifiers
TOOL_TO_APP_MAP = {
    "nexus": "nexus",
    "aci_inventory": "kosh",
    "bom_tool_suite": "bom",
    "compare_tool": "bom",
}


class SSOGenerateRequest(BaseModel):
    target_app: str  # "nexus", "kosh", or "bom"
    use_local: bool = False  # If True, return local network redirect URLs


class SSOGenerateResponse(BaseModel):
    sso_token: str
    redirect_url: str
    expires_in: int


class SSOValidateRequest(BaseModel):
    sso_token: str


class SSOValidateResponse(BaseModel):
    valid: bool
    username: str
    target_app: str
    forge_user_id: int


@router.post("/generate", response_model=SSOGenerateResponse)
async def generate_sso_token(
    request: SSOGenerateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate a short-lived SSO token for a target application."""
    target_app = request.target_app.lower()

    if target_app not in ("nexus", "kosh", "bom"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid target app: {target_app}. Must be nexus, kosh, or bom."
        )

    # Verify user has access to the target tool
    user_tools = UserService.get_user_tools(current_user, db)
    tool_names = [t.name.lower() for t in user_tools]

    has_access = False
    for tool_name, app_id in TOOL_TO_APP_MAP.items():
        if app_id == target_app and tool_name in tool_names:
            has_access = True
            break

    if not has_access:
        raise HTTPException(
            status_code=403,
            detail=f"You do not have access to {target_app}"
        )

    # Generate SSO JWT token
    expire = datetime.now(timezone.utc) + timedelta(seconds=settings.SSO_TOKEN_EXPIRE_SECONDS)
    payload = {
        "sub": current_user.username,
        "type": "sso",
        "target_app": target_app,
        "forge_user_id": current_user.id,
        "exp": expire,
    }

    sso_token = jwt.encode(payload, settings.SSO_SECRET_KEY, algorithm="HS256")

    # Build redirect URL based on target app
    app_urls = {
        "nexus": "https://aci-nexus.vercel.app/sso/callback",
        "kosh": "https://aci-kosh.vercel.app/sso/callback",
        "bom": "https://bom-tool.vercel.app/sso/callback",
    }
    local_app_urls = {
        "nexus": "http://acidashboard.aci.local:100/sso/callback",
        "kosh": "http://acidashboard.aci.local:5002/sso/callback",
        "bom": "http://acidashboard.aci.local:8081/sso/callback",
    }

    urls = local_app_urls if request.use_local else app_urls
    redirect_url = f"{urls[target_app]}?token={sso_token}"

    # Store in-app notification record (non-blocking)
    try:
        from app.routers.notifications import NotificationService
        login_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        NotificationService.create(
            db,
            ntype="sso_login",
            title=f"{current_user.full_name} logged into {target_app.upper()} via SSO",
            data={
                "username": current_user.username,
                "full_name": current_user.full_name,
                "target_app": target_app.upper(),
                "login_time": login_time,
            },
        )
    except Exception:
        pass

    return SSOGenerateResponse(
        sso_token=sso_token,
        redirect_url=redirect_url,
        expires_in=settings.SSO_TOKEN_EXPIRE_SECONDS,
    )


@router.post("/validate", response_model=SSOValidateResponse)
async def validate_sso_token(request: SSOValidateRequest):
    """Validate an SSO token (called by target apps)."""
    try:
        payload = jwt.decode(
            request.sso_token,
            settings.SSO_SECRET_KEY,
            algorithms=["HS256"]
        )

        if payload.get("type") != "sso":
            raise HTTPException(status_code=401, detail="Invalid token type")

        return SSOValidateResponse(
            valid=True,
            username=payload["sub"],
            target_app=payload["target_app"],
            forge_user_id=payload["forge_user_id"],
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired SSO token"
        )
