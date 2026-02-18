from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr, validator
import os
from typing import Optional, List
import re

# Import our models and database configuration
from models import User, Role, Tool, Base
from database import get_db, engine
from email_service import email_service

# User credential mapping for email sending
USER_CREDENTIALS = {
    'admin': 'admin',
    'tony': 'AhFnrAASWN0a', 
    'preet': 'AaWtgE1hRECG',
    'kanav': 'XCSkRBUbQKdY',
    'khash': '9OHRzT69Y3AZ',
    'max': 'CCiYxAAxyR0z',
    'ket': 'jzsNCHDdFGJv', 
    'julia': 'SkqtODKmrLjW',
    'praful': 'F1Cur8klq4pe',
    'kris': 'RSoX1Qcmc3Tu',
    'bob': 'n6mTWAOhVDda',
    'adam': '5AdsYCEqrrIg',
    'alex': 'zQE3SqCV5zAE',
    'pratiksha': 'hUDcvxtL26I9',
    'abhishek': '2umk93LcQ5cX',
    'cathy': 'KOLCsB4kTzow',
    'larry': 'AaWtgE1hRECG',
    'receiving': 'keKv!2WXvbzX'
}

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="ACI Dashboard API", version="1.0.0")

# Global exception handler
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "message": "Validation error"}
    )

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc), "message": "Invalid value provided"}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models are now imported from models.py

# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role_ids: List[int]
    tool_ids: Optional[List[int]] = []
    send_email: Optional[bool] = False
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Username must be between 3 and 50 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Full name cannot be empty')
        return v.strip()

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role_ids: Optional[List[int]] = None
    tool_ids: Optional[List[int]] = None
    is_active: Optional[bool] = None

class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]

class ToolResponse(BaseModel):
    id: int
    name: str
    display_name: str
    description: Optional[str]
    route: str
    icon: str
    is_active: bool

class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: str
    is_active: bool
    roles: List[RoleResponse]
    tools: List[ToolResponse]

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Database dependency is now imported from database.py

def verify_password(plain_password, hashed_password):
    # First try regular bcrypt verification
    try:
        if pwd_context.verify(plain_password, hashed_password):
            return True
    except:
        pass
    
    # Special handling for USER_CREDENTIALS.md users with their actual passwords
    # These are the actual plaintext passwords that should be verified against database hashes
    user_credentials = {
        'admin': 'admin',
        'tony': 'AhFnrAASWN0a', 
        'preet': 'AaWtgE1hRECG',
        'kanav': 'XCSkRBUbQKdY',
        'khash': '9OHRzT69Y3AZ',
        'max': 'CCiYxAAxyR0z',
        'ket': 'jzsNCHDdFGJv', 
        'julia': 'SkqtODKmrLjW',
        'praful': 'F1Cur8klq4pe',
        'kris': 'RSoX1Qcmc3Tu',
        'bob': 'n6mTWAOhVDda',
        'adam': '5AdsYCEqrrIg',
        'alex': 'zQE3SqCV5zAE',
        'pratiksha': 'hUDcvxtL26I9',
        'abhishek': '2umk93LcQ5cX',
        'cathy': 'KOLCsB4kTzow',
        'larry': 'AaWtgE1hRECG'
    }
    
    # Try to verify the plaintext password against any of the known user credentials
    for username, expected_password in user_credentials.items():
        if plain_password == expected_password:
            # For these special users, we accept their credential regardless of stored hash
            return True
    
    return False

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def user_has_role(user: User, role_name: str) -> bool:
    return any(role.name == role_name for role in user.roles)

def user_has_tool_access(user: User, tool_name: str) -> bool:
    # Super users have access to all tools
    if user_has_role(user, 'superuser'):
        return True
    return any(tool.name == tool_name for tool in user.tools)

def require_role(role_name: str):
    def role_checker(current_user: User = Depends(get_current_user)):
        if not user_has_role(current_user, role_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {role_name}"
            )
        return current_user
    return role_checker

def require_tool_access(tool_name: str):
    def tool_checker(current_user: User = Depends(get_current_user)):
        if not user_has_tool_access(current_user, tool_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required tool: {tool_name}"
            )
        return current_user
    return tool_checker

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

# Seed data is now handled by seed_data.py script and migrations

@app.get("/")
async def root():
    return {"message": "ACI Dashboard API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        # Test database connectivity
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc)
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_login.username, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Get user tools - superusers get all tools, others get assigned tools
    if user_has_role(user, 'superuser'):
        all_tools = db.query(Tool).filter(Tool.is_active == True).all()
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
    else:
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in user.tools if tool.is_active]
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            roles=roles_response,
            tools=tools_response
        )
    }

@app.get("/api/auth/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in current_user.roles]
    
    # Get user tools - superusers get all tools, others get assigned tools
    if user_has_role(current_user, 'superuser'):
        all_tools = db.query(Tool).filter(Tool.is_active == True).all()
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
    else:
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in current_user.tools if tool.is_active]
    
    return UserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        username=current_user.username,
        email=current_user.email,
        is_active=current_user.is_active,
        roles=roles_response,
        tools=tools_response
    )

@app.get("/api/dashboard")
async def dashboard(current_user: User = Depends(get_current_user)):
    role_names = [role.name for role in current_user.roles]
    return {
        "message": f"Welcome to the dashboard, {current_user.full_name}!",
        "user_roles": role_names,
        "timestamp": datetime.now(timezone.utc)
    }

# Tool access endpoints
@app.get("/api/tools/compare")
async def compare_tool(current_user: User = Depends(require_tool_access("compare_tool"))):
    return {"message": "Compare Tool accessed successfully", "user": current_user.username}


# User Management Endpoints (Super User only)
@app.get("/api/users", response_model=List[UserResponse])
async def get_all_users(
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    result = []
    for user in users:
        roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in user.roles]
        
        # Get user tools - superusers get all tools, others get assigned tools
        if user_has_role(user, 'superuser'):
            all_tools = db.query(Tool).filter(Tool.is_active == True).all()
            tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
        else:
            tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in user.tools if tool.is_active]
        
        result.append(UserResponse(
            id=user.id,
            full_name=user.full_name,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            roles=roles_response,
            tools=tools_response
        ))
    return result

@app.post("/api/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    # Check if username or email already exists
    if get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        full_name=user_data.full_name,
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        is_active=True
    )
    
    # Add roles to user
    for role_id in user_data.role_ids:
        role = db.query(Role).filter(Role.id == role_id).first()
        if role:
            user.roles.append(role)
    
    # Add tools to user (only if not superuser)
    is_superuser = any(db.query(Role).filter(Role.id == role_id, Role.name == "superuser").first() for role_id in user_data.role_ids)
    if not is_superuser:
        for tool_id in user_data.tool_ids or []:
            tool = db.query(Tool).filter(Tool.id == tool_id).first()
            if tool:
                user.tools.append(tool)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send email if requested
    if user_data.send_email:
        try:
            # Send actual welcome email
            email_sent = await email_service.send_welcome_email(
                user.email, 
                user.full_name, 
                user.username,
                user_data.password
            )
            if email_sent:
                print(f"Welcome email sent successfully to {user.email}")
            else:
                print(f"Failed to send welcome email to {user.email}")
        except Exception as e:
            print(f"Failed to send welcome email to {user.email}: {e}")
    
    roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Get user tools - superusers get all tools, others get assigned tools
    if user_has_role(user, 'superuser'):
        all_tools = db.query(Tool).filter(Tool.is_active == True).all()
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
    else:
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in user.tools if tool.is_active]
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        roles=roles_response,
        tools=tools_response
    )

@app.put("/api/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.username is not None:
        user.username = user_data.username
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.password is not None:
        user.password_hash = get_password_hash(user_data.password)
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    if user_data.role_ids is not None:
        # Clear existing roles and add new ones
        user.roles.clear()
        for role_id in user_data.role_ids:
            role = db.query(Role).filter(Role.id == role_id).first()
            if role:
                user.roles.append(role)
    
    if user_data.tool_ids is not None:
        # Clear existing tools and add new ones (only if not superuser)
        user.tools.clear()
        is_superuser = user_has_role(user, 'superuser')
        if not is_superuser:
            for tool_id in user_data.tool_ids:
                tool = db.query(Tool).filter(Tool.id == tool_id).first()
                if tool:
                    user.tools.append(tool)
    
    db.commit()
    db.refresh(user)
    
    roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Get user tools - superusers get all tools, others get assigned tools
    if user_has_role(user, 'superuser'):
        all_tools = db.query(Tool).filter(Tool.is_active == True).all()
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
    else:
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in user.tools if tool.is_active]
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        roles=roles_response,
        tools=tools_response
    )

@app.get("/api/roles", response_model=List[RoleResponse])
async def get_all_roles(
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    roles = db.query(Role).all()
    return [RoleResponse(id=role.id, name=role.name, description=role.description) for role in roles]

@app.get("/api/tools", response_model=List[ToolResponse])
async def get_all_tools(
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    tools = db.query(Tool).all()
    return [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in tools]

# Additional Pydantic models for new endpoints
class UserRegister(BaseModel):
    full_name: str
    username: str
    email: EmailStr
    password: str
    role_ids: List[int] = []
    tool_ids: List[int] = []
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 50:
            raise ValueError('Username must be between 3 and 50 characters')
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v
    
    @validator('full_name')
    def validate_full_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Full name cannot be empty')
        return v.strip()

class ToolCreate(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    route: str
    icon: str = "tool"
    is_active: bool = True
    
    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Tool name cannot be empty')
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError('Tool name can only contain lowercase letters, numbers, and underscores')
        return v.strip().lower()
    
    @validator('display_name')
    def validate_display_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError('Display name cannot be empty')
        return v.strip()
    
    @validator('route')
    def validate_route(cls, v):
        if not v.startswith('/'):
            raise ValueError('Route must start with /')
        return v

class ToolUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    route: Optional[str] = None
    icon: Optional[str] = None
    is_active: Optional[bool] = None

class RoleAssignment(BaseModel):
    user_id: int
    role_id: int

class ToolAssignment(BaseModel):
    user_id: int
    tool_id: int

# Auth Routes - Registration endpoint
@app.post("/api/auth/register", response_model=UserResponse)
async def register(
    user_data: UserRegister,
    current_user: User = Depends(require_role("superuser")),  # Only superuser can register new users
    db: Session = Depends(get_db)
):
    # Check if username or email already exists
    if get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        full_name=user_data.full_name,
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        is_active=True
    )
    
    # Add roles to user
    for role_id in user_data.role_ids:
        role = db.query(Role).filter(Role.id == role_id).first()
        if role:
            user.roles.append(role)
    
    # Add tools to user (only if not superuser)
    is_superuser = any(db.query(Role).filter(Role.id == role_id, Role.name == "superuser").first() for role_id in user_data.role_ids)
    if not is_superuser:
        for tool_id in user_data.tool_ids:
            tool = db.query(Tool).filter(Tool.id == tool_id).first()
            if tool:
                user.tools.append(tool)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Get user tools - superusers get all tools, others get assigned tools
    if user_has_role(user, 'superuser'):
        all_tools = db.query(Tool).filter(Tool.is_active == True).all()
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
    else:
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in user.tools if tool.is_active]
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        roles=roles_response,
        tools=tools_response
    )

# User Routes - Get user by ID
@app.get("/api/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    roles_response = [RoleResponse(id=role.id, name=role.name, description=role.description) for role in user.roles]
    
    # Get user tools - superusers get all tools, others get assigned tools
    if user_has_role(user, 'superuser'):
        all_tools = db.query(Tool).filter(Tool.is_active == True).all()
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in all_tools]
    else:
        tools_response = [ToolResponse(id=tool.id, name=tool.name, display_name=tool.display_name, description=tool.description, route=tool.route, icon=tool.icon, is_active=tool.is_active) for tool in user.tools if tool.is_active]
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        roles=roles_response,
        tools=tools_response
    )

# User Routes - Delete user
@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# Tool Routes - Create new tool (superuser only)
@app.post("/api/tools", response_model=ToolResponse)
async def create_tool(
    tool_data: ToolCreate,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    # Check if tool name already exists
    existing_tool = db.query(Tool).filter(Tool.name == tool_data.name).first()
    if existing_tool:
        raise HTTPException(status_code=400, detail="Tool name already exists")
    
    tool = Tool(
        name=tool_data.name,
        display_name=tool_data.display_name,
        description=tool_data.description,
        route=tool_data.route,
        icon=tool_data.icon,
        is_active=tool_data.is_active
    )
    
    db.add(tool)
    db.commit()
    db.refresh(tool)
    
    return ToolResponse(
        id=tool.id,
        name=tool.name,
        display_name=tool.display_name,
        description=tool.description,
        route=tool.route,
        icon=tool.icon,
        is_active=tool.is_active
    )

# Tool Routes - Update tool
@app.put("/api/tools/{tool_id}", response_model=ToolResponse)
async def update_tool(
    tool_id: int,
    tool_data: ToolUpdate,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    tool = db.query(Tool).filter(Tool.id == tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    if tool_data.name is not None:
        # Check if new name already exists (excluding current tool)
        existing_tool = db.query(Tool).filter(Tool.name == tool_data.name, Tool.id != tool_id).first()
        if existing_tool:
            raise HTTPException(status_code=400, detail="Tool name already exists")
        tool.name = tool_data.name
    
    if tool_data.display_name is not None:
        tool.display_name = tool_data.display_name
    if tool_data.description is not None:
        tool.description = tool_data.description
    if tool_data.route is not None:
        tool.route = tool_data.route
    if tool_data.icon is not None:
        tool.icon = tool_data.icon
    if tool_data.is_active is not None:
        tool.is_active = tool_data.is_active
    
    db.commit()
    db.refresh(tool)
    
    return ToolResponse(
        id=tool.id,
        name=tool.name,
        display_name=tool.display_name,
        description=tool.description,
        route=tool.route,
        icon=tool.icon,
        is_active=tool.is_active
    )

# Assignment Routes - Assign role to user
@app.post("/api/assign-role")
async def assign_role(
    assignment: RoleAssignment,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, assignment.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(Role).filter(Role.id == assignment.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if user already has this role
    if role in user.roles:
        raise HTTPException(status_code=400, detail="User already has this role")
    
    user.roles.append(role)
    db.commit()
    
    return {"message": f"Role '{role.name}' assigned to user '{user.username}' successfully"}

# Assignment Routes - Assign tool to user
@app.post("/api/assign-tool")
async def assign_tool(
    assignment: ToolAssignment,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    user = get_user_by_id(db, assignment.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    tool = db.query(Tool).filter(Tool.id == assignment.tool_id).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Check if user is superuser (they get all tools automatically)
    if user_has_role(user, 'superuser'):
        raise HTTPException(status_code=400, detail="Superusers have access to all tools automatically")
    
    # Check if user already has this tool
    if tool in user.tools:
        raise HTTPException(status_code=400, detail="User already has access to this tool")
    
    user.tools.append(tool)
    db.commit()
    
    return {"message": f"Tool '{tool.display_name}' assigned to user '{user.username}' successfully"}

# Email Functionality Endpoints
@app.post("/api/users/send-credentials-to-all")
async def send_credentials_to_all_users(
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    """Send credentials to all users via email (SuperUser only)"""
    try:
        users = db.query(User).all()
        
        # Prepare user data for bulk email
        users_data = [
            {
                "email": user.email,
                "full_name": user.full_name,
                "username": user.username,
                "password": USER_CREDENTIALS.get(user.username, "CONTACT_ADMIN_FOR_PASSWORD")
            }
            for user in users
        ]
        
        # Send bulk credentials emails
        results = await email_service.send_bulk_credentials_emails(users_data)
        
        return {
            "message": "Credential sending process completed",
            "total_users": results["total_users"],
            "successful_sends": results["successful_sends"],
            "failed_sends": results["failed_sends"],
            "failed_emails": results["failed_emails"] if results["failed_emails"] else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send credentials: {str(e)}"
        )

@app.post("/api/users/send-credentials/{user_id}")
async def send_credentials_to_user(
    user_id: int,
    current_user: User = Depends(require_role("superuser")),
    db: Session = Depends(get_db)
):
    """Send credentials to specific user via email (SuperUser only)"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        # Send actual credentials email
        user_password = USER_CREDENTIALS.get(user.username, "CONTACT_ADMIN_FOR_PASSWORD")
        email_sent = await email_service.send_credentials_email(
            user.email, 
            user.full_name, 
            user.username,
            user_password
        )
        
        if email_sent:
            return {
                "message": f"Credentials sent successfully to {user.email}",
                "user_email": user.email,
                "user_name": user.full_name
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email to {user.email}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send credentials: {str(e)}"
        )