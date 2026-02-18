"""
Comprehensive seed data script for ACI Dashboard
Creates all roles, tools, and users as specified
"""

import os
import sys
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.db.base import SessionLocal, engine
from app.models.user import User
from app.models.role import Role
from app.models.tool import Tool
from app.core.security import get_password_hash

def create_roles(db: Session):
    """Create all required roles"""
    roles_data = [
        {"name": "superuser", "description": "Super User with full access to all features"},
        {"name": "manager", "description": "Manager role with elevated permissions"},
        {"name": "user", "description": "Regular user with standard access"},
        {"name": "operator", "description": "Operator role with operational permissions"},
        {"name": "itra", "description": "ITRA role with specialized access"},
    ]
    
    print("Creating roles...")
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            print(f"  ✓ Created role: {role_data['name']}")
        else:
            print(f"  - Role already exists: {role_data['name']}")
    
    db.commit()

def create_tools(db: Session):
    """Create all required tools"""
    tools_data = [
        {
            "name": "compare_tool",
            "display_name": "Compare Tool",
            "description": "Tool for comparing data and analyzing differences",
            "route": "/dashboard/tools/compare",
            "icon": "compare",
            "is_active": True
        },
        {
            "name": "x_tool",
            "display_name": "X Tool",
            "description": "Advanced X functionality and analysis",
            "route": "/dashboard/tools/x-tool",
            "icon": "x-circle",
            "is_active": True
        },
        {
            "name": "y_tool",
            "display_name": "Y Tool",
            "description": "Y analysis tool for specialized operations",
            "route": "/dashboard/tools/y-tool",
            "icon": "y-circle",
            "is_active": True
        }
    ]
    
    print("Creating tools...")
    for tool_data in tools_data:
        existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
        if not existing_tool:
            tool = Tool(**tool_data)
            db.add(tool)
            print(f"  ✓ Created tool: {tool_data['display_name']}")
        else:
            print(f"  - Tool already exists: {tool_data['display_name']}")
    
    db.commit()

def create_users(db: Session):
    """Create all users from the provided list"""
    sample_users = [
        # SuperUsers
        {
            "full_name": "Administrator",
            "username": "admin",
            "email": "admin@americancircuits.com",
            "password": "admin",
            "roles": ["superuser"],
            "tools": []
        },
        {
            "full_name": "Tony",
            "username": "tony",
            "email": "tony@americancircuits.com",
            "password": "AhFnrAASWN0a",
            "roles": ["superuser"],
            "tools": []  # SuperUsers get all tools automatically
        },
        {
            "full_name": "Preet",
            "username": "preet",
            "email": "preet@americancircuits.com",
            "password": "AaWtgE1hRECG",
            "roles": ["superuser"],
            "tools": []
        },
        {
            "full_name": "Kanav",
            "username": "kanav",
            "email": "kanav@americancircuits.com",
            "password": "XCSkRBUbQKdY",
            "roles": ["superuser"],
            "tools": []
        },
        {
            "full_name": "Khash",
            "username": "khash",
            "email": "khash@americancircuits.com",
            "password": "9OHRzT69Y3AZ",
            "roles": ["superuser"],
            "tools": []
        },
        
        # Managers
        {
            "full_name": "Max",
            "username": "max",
            "email": "max@americancircuits.com",
            "password": "CCiYxAAxyR0z",
            "roles": ["manager"],
            "tools": ["compare_tool", "x_tool"]
        },
        {
            "full_name": "Ket",
            "username": "ket",
            "email": "ket@americancircuits.com",
            "password": "jzsNCHDdFGJv",
            "roles": ["manager"],
            "tools": ["compare_tool", "y_tool"]
        },
        {
            "full_name": "Julia",
            "username": "julia",
            "email": "julia@americancircuits.com",
            "password": "SkqtODKmrLjW",
            "roles": ["manager"],
            "tools": ["x_tool", "y_tool"]
        },
        {
            "full_name": "Praful",
            "username": "praful",
            "email": "praful@americancircuits.com",
            "password": "F1Cur8klq4pe",
            "roles": ["manager"],
            "tools": ["compare_tool"]
        },
        
        # Mixed roles
        {
            "full_name": "Kris",
            "username": "kris",
            "email": "kris@americancircuits.com",
            "password": "RSoX1Qcmc3Tu",
            "roles": ["manager", "user", "operator"],
            "tools": ["compare_tool", "x_tool", "y_tool"]
        },
        
        # Regular users and operators
        {
            "full_name": "Adam",
            "username": "adam",
            "email": "adam@americancircuits.com",
            "password": "5AdsYCEqrrIg",
            "roles": ["operator", "user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Alex",
            "username": "alex",
            "email": "alex@americancircuits.com",
            "password": "zQE3SqCV5zAE",
            "roles": ["operator", "user"],
            "tools": ["x_tool"]
        },
        
        # Specific assignments as requested
        {
            "full_name": "Pratiksha",
            "username": "pratiksha",
            "email": "pratiksha@americancircuits.com",
            "password": "hUDcvxtL26I9",
            "roles": ["user", "operator"],
            "tools": ["compare_tool"]  # Only Compare Tool as specified
        },
        {
            "full_name": "Cathy",
            "username": "cathy",
            "email": "cathy@americancircuits.com",
            "password": "KOLCsB4kTzow",
            "roles": ["user", "operator"],
            "tools": ["compare_tool"]  # Only Compare Tool as specified
        },
        
        # Additional users
        {
            "full_name": "Bob",
            "username": "bob",
            "email": "bob@americancircuits.com",
            "password": "n6mTWAOhVDda",
            "roles": ["user"],
            "tools": ["compare_tool"]
        },
        {
            "full_name": "Abhishek",
            "username": "abhishek",
            "email": "abhishek@americancircuits.com",
            "password": "2umk93LcQ5cX",
            "roles": ["user", "operator"],
            "tools": ["y_tool"]
        },
        
        # ITRA users
        {
            "full_name": "Sarah ITRA",
            "username": "sarah_itra",
            "email": "sarah@itra.gov",
            "password": "ITRA2024Secure!",
            "roles": ["itra", "user"],
            "tools": ["compare_tool", "x_tool"]
        },
        {
            "full_name": "Mike ITRA",
            "username": "mike_itra", 
            "email": "mike@itra.gov",
            "password": "ITRAAccess2024!",
            "roles": ["itra"],
            "tools": ["compare_tool", "y_tool"]
        }
    ]
    
    print("Creating users...")
    for user_data in sample_users:
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        if not existing_user:
            # Hash password
            hashed_password = get_password_hash(user_data["password"])
            
            # Create user
            user = User(
                full_name=user_data["full_name"],
                username=user_data["username"].lower(),
                email=user_data["email"].lower(),
                password_hash=hashed_password,
                is_active=True
            )
            
            # Add roles
            for role_name in user_data["roles"]:
                role = db.query(Role).filter(Role.name == role_name).first()
                if role:
                    user.roles.append(role)
            
            # Add tools (only if not superuser)
            has_superuser = any(role_name == "superuser" for role_name in user_data["roles"])
            if not has_superuser:
                for tool_name in user_data["tools"]:
                    tool = db.query(Tool).filter(Tool.name == tool_name).first()
                    if tool:
                        user.tools.append(tool)
            
            db.add(user)
            print(f"  ✓ Created user: {user_data['full_name']} ({user_data['username']})")
        else:
            print(f"  - User already exists: {user_data['username']}")
    
    db.commit()

def display_summary(db: Session):
    """Display summary of created data"""
    print("\n" + "="*60)
    print("DATABASE SEED SUMMARY")
    print("="*60)
    
    # Roles summary
    roles = db.query(Role).all()
    print(f"\n📋 ROLES ({len(roles)} total):")
    for role in roles:
        user_count = len([u for u in db.query(User).all() if any(r.name == role.name for r in u.roles)])
        print(f"  • {role.name.upper()}: {role.description} ({user_count} users)")
    
    # Tools summary
    tools = db.query(Tool).all()
    print(f"\n🔧 TOOLS ({len(tools)} total):")
    for tool in tools:
        user_count = len([u for u in db.query(User).all() if any(t.name == tool.name for t in u.tools) or any(r.name == "superuser" for r in u.roles)])
        print(f"  • {tool.display_name}: {tool.description} ({user_count} users)")
    
    # Users summary
    users = db.query(User).all()
    print(f"\n👥 USERS ({len(users)} total):")
    
    # Group by role
    role_groups = {}
    for user in users:
        for role in user.roles:
            if role.name not in role_groups:
                role_groups[role.name] = []
            role_groups[role.name].append(user)
    
    for role_name in ["superuser", "manager", "user", "operator", "itra"]:
        if role_name in role_groups:
            users_with_role = role_groups[role_name]
            print(f"\n  {role_name.upper()} ROLE ({len(users_with_role)} users):")
            for user in users_with_role:
                tools_list = []
                if any(r.name == "superuser" for r in user.roles):
                    tools_list = ["ALL TOOLS"]
                else:
                    tools_list = [t.display_name for t in user.tools]
                
                print(f"    • {user.full_name} ({user.username}) - Tools: {', '.join(tools_list) if tools_list else 'None'}")
    
    print("\n" + "="*60)
    print("✅ Database seeding completed successfully!")
    print("="*60)

def seed_database():
    """Main function to seed the database"""
    print("🌱 Starting comprehensive database seeding...")
    print("="*60)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create all tables
        from app.models.base import BaseModel
        BaseModel.metadata.create_all(bind=engine)
        
        # Seed data in order
        create_roles(db)
        create_tools(db)
        create_users(db)
        
        # Display summary
        display_summary(db)
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()