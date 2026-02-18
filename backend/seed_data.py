"""
Seed data script for ACI Dashboard
This script creates initial roles, tools, and users in the database
"""

import os
import sys
from passlib.context import CryptContext
from sqlalchemy.orm import Session

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
from models import Base, User, Role, Tool

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_roles(db: Session):
    """Create initial roles"""
    roles_data = [
        {"name": "superuser", "description": "Super User with full access"},
        {"name": "user", "description": "Regular user"},
        {"name": "operator", "description": "Operator role"},
        {"name": "itar", "description": "ITAR role"}
    ]
    
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            print(f"Created role: {role_data['name']}")
    
    db.commit()

def create_tools(db: Session):
    """Create initial tools"""
    tools_data = [
        {
            "name": "compare_tool",
            "display_name": "BOM Compare",
            "description": "Compare Bill of Materials",
            "route": "/dashboard/tools/compare",
            "icon": "compare"
        },
        {
            "name": "aci_inventory",
            "display_name": "Kosh",
            "description": "Inventory management system",
            "route": "/dashboard/tools/aci-inventory",
            "icon": "package"
        },
        {
            "name": "aci_chat",
            "display_name": "ACI Chat",
            "description": "AI-powered chat using OLLAMA (Local LLM)",
            "route": "/dashboard/tools/aci-chat",
            "icon": "message-circle"
        },
        {
            "name": "suitemaster",
            "display_name": "SuiteMaster",
            "description": "Suite management and control system",
            "route": "/dashboard/tools/suitemaster",
            "icon": "layout"
        },
        {
            "name": "nexus",
            "display_name": "NEXUS",
            "description": "Traveler Management System",
            "route": "/dashboard/tools/nexus",
            "icon": "hexagon"
        }
    ]
    
    for tool_data in tools_data:
        existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
        if not existing_tool:
            tool = Tool(**tool_data)
            db.add(tool)
            print(f"Created tool: {tool_data['display_name']}")
    
    db.commit()

def create_users(db: Session):
    """Create initial users with hashed passwords"""
    # Sample users data with tool assignments
    sample_users = [
        {
            "full_name": "Tony",
            "username": "tony967",
            "email": "tony@americancircuits.com",
            "password": "AhFnrAASWN0a",
            "roles": ["superuser"],
            "tools": []  # Super user gets all tools automatically
        },
        {
            "full_name": "Preet",
            "username": "preet858",
            "email": "preet@americancircuits.com",
            "password": "AaWtgE1hRECG",
            "roles": ["superuser"],
            "tools": []
        },
        {
            "full_name": "Kanav",
            "username": "kanav651",
            "email": "kanav@americancircuits.com",
            "password": "XCSkRBUbQKdY",
            "roles": ["superuser"],
            "tools": []
        },
        {
            "full_name": "Khash",
            "username": "khash826",
            "email": "khash@americancircuits.com",
            "password": "9OHRzT69Y3AZ",
            "roles": ["superuser"],
            "tools": []
        },
        {
            "full_name": "Max",
            "username": "max463",
            "email": "max@americancircuits.com",
            "password": "CCiYxAAxyR0z",
            "roles": ["user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Ket",
            "username": "ket833",
            "email": "ket@americancircuits.com",
            "password": "jzsNCHDdFGJv",
            "roles": ["user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Julia",
            "username": "julia509",
            "email": "julia@americancircuits.com",
            "password": "SkqtODKmrLjW",
            "roles": ["user"],
            "tools": []
        },
        {
            "full_name": "Praful",
            "username": "praful396",
            "email": "praful@americancircuits.com",
            "password": "F1Cur8klq4pe",
            "roles": ["user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Kris",
            "username": "kris500",
            "email": "kris@americancircuits.com",
            "password": "RSoX1Qcmc3Tu",
            "roles": ["user", "operator"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Adam",
            "username": "adam585",
            "email": "adam@americancircuits.com",
            "password": "5AdsYCEqrrIg",
            "roles": ["operator", "user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Alex",
            "username": "alex343",
            "email": "alex@americancircuits.com",
            "password": "zQE3SqCV5zAE",
            "roles": ["operator", "user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Pratiksha",
            "username": "pratiksha649",
            "email": "pratiksha@americancircuits.com",
            "password": "hUDcvxtL26I9",
            "roles": ["user", "operator"],
            "tools": ["compare_tool"]  # Specific assignment as requested
        },
        {
            "full_name": "Cathy",
            "username": "cathy596",
            "email": "cathy@americancircuits.com",
            "password": "KOLCsB4kTzow",
            "roles": ["user", "operator"],
            "tools": ["compare_tool"]  # Specific assignment as requested
        },
        {
            "full_name": "Bob",
            "username": "bob771",
            "email": "bob@americancircuits.com",
            "password": "n6mTWAOhVDda",
            "roles": ["user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Abhishek",
            "username": "abhishek878",
            "email": "abhishek@americancircuits.com",
            "password": "2umk93LcQ5cX",
            "roles": ["user", "operator"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Theresa",
            "username": "receiving",
            "email": "parts@americancircuits.com", 
            "password": "keKv!2WXvbzX",
            "roles": ["operator"],
            "tools": ["aci_inventory"]  # Kosh
        },
    ]
    
    for user_data in sample_users:
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing_user:
            # Hash the password
            hashed_password = get_password_hash(user_data["password"])
            
            # Create user
            user = User(
                full_name=user_data["full_name"],
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=hashed_password,
                is_active=True
            )
            
            # Add roles to user
            for role_name in user_data["roles"]:
                role = db.query(Role).filter(Role.name == role_name).first()
                if role:
                    user.roles.append(role)
            
            # Add tools to user (only if not superuser)
            if not any(role_name == "superuser" for role_name in user_data["roles"]):
                for tool_name in user_data["tools"]:
                    tool = db.query(Tool).filter(Tool.name == tool_name).first()
                    if tool:
                        user.tools.append(tool)
            
            db.add(user)
            print(f"Created user: {user_data['full_name']} ({user_data['username']})")
    
    db.commit()

def seed_database():
    """Main function to seed the database"""
    print("Starting database seeding...")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Create seed data
        print("\n1. Creating roles...")
        create_roles(db)
        
        print("\n2. Creating tools...")
        create_tools(db)
        
        print("\n3. Creating users...")
        create_users(db)
        
        print("\n✅ Database seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()