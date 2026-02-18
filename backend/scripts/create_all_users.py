#!/usr/bin/env python3
"""
Comprehensive user creation script for ACI Dashboard
Creates all 15 users with exact roles, emails, and passwords as specified
"""

import os
import sys
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database.database import SessionLocal, engine
from database.models import User, Role, Tool
from app.core.security import get_password_hash

def create_all_roles(db: Session):
    """Create all required roles"""
    roles_data = [
        {"name": "superuser", "description": "Super User with full access to all features"},
        {"name": "manager", "description": "Manager role with elevated permissions"},
        {"name": "user", "description": "Regular user with standard access"},
        {"name": "operator", "description": "Operator role with operational permissions"},
        {"name": "itar", "description": "ITAR role with specialized functions"},
    ]
    
    print("Creating roles...")
    created_roles = {}
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            db.commit()
            created_roles[role_data["name"]] = role
            print(f"  Created role: {role_data['name']}")
        else:
            created_roles[role_data["name"]] = existing_role
            print(f"  - Role already exists: {role_data['name']}")
    
    return created_roles

def create_all_tools(db: Session):
    """Create all required tools"""
    tools_data = [
        {
            "name": "compare_tool",
            "display_name": "Compare Tool",
            "description": "Tool for comparing data and analyzing differences",
            "route": "/dashboard/tools/compare",
            "icon": "compare",
            "is_active": True
        }
    ]
    
    print("Creating tools...")
    created_tools = {}
    for tool_data in tools_data:
        existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
        if not existing_tool:
            tool = Tool(**tool_data)
            db.add(tool)
            db.commit()
            created_tools[tool_data["name"]] = tool
            print(f"  Created tool: {tool_data['display_name']}")
        else:
            created_tools[tool_data["name"]] = existing_tool
            print(f"  - Tool already exists: {tool_data['display_name']}")
    
    return created_tools

def create_all_users(db: Session, roles: dict, tools: dict):
    """Create all 15 users from the exact specification"""
    
    # Exact user data from your specification
    all_users = [
        # SuperUsers
        {"full_name": "Tony", "username": "tony", "email": "tony@americancircuits.com", "password": "AhFnrAASWN0a", "roles": ["superuser", "manager"]},
        {"full_name": "Preet", "username": "preet", "email": "preet@americancircuits.com", "password": "AaWtgE1hRECG", "roles": ["superuser"]},
        {"full_name": "Kanav", "username": "kanav", "email": "kanav@americancircuits.com", "password": "XCSkRBUbQKdY", "roles": ["superuser"]},
        {"full_name": "Khash", "username": "khash", "email": "khash@americancircuits.com", "password": "9OHRzT69Y3AZ", "roles": ["superuser"]},
        
        # Managers
        {"full_name": "Max", "username": "max", "email": "max@americancircuits.com", "password": "CCiYxAAxyR0z", "roles": ["manager"]},
        {"full_name": "Ket", "username": "ket", "email": "ket@americancircuits.com", "password": "jzsNCHDdFGJv", "roles": ["manager"]},
        {"full_name": "Julia", "username": "julia", "email": "julia@americancircuits.com", "password": "SkqtODKmrLjW", "roles": ["manager"]},
        {"full_name": "Praful", "username": "praful", "email": "praful@americancircuits.com", "password": "F1Cur8klq4pe", "roles": ["manager"]},
        
        # Mixed roles
        {"full_name": "Kris", "username": "kris", "email": "kris@americancircuits.com", "password": "RSoX1Qcmc3Tu", "roles": ["manager", "user", "operator"]},
        
        # Operators and Users
        {"full_name": "Adam", "username": "adam", "email": "adam@americancircuits.com", "password": "5AdsYCEqrrIg", "roles": ["operator", "user"]},
        {"full_name": "Alex", "username": "alex", "email": "alex@americancircuits.com", "password": "zQE3SqCV5zAE", "roles": ["operator", "user"]},
        {"full_name": "Pratiksha", "username": "pratiksha", "email": "pratiksha@americancircuits.com", "password": "hUDcvxtL26I9", "roles": ["user", "operator"]},
        {"full_name": "Cathy", "username": "cathy", "email": "cathy@americancircuits.com", "password": "KOLCsB4kTzow", "roles": ["user", "operator", "itar"]},
        {"full_name": "Bob", "username": "bob", "email": "bob@americancircuits.com", "password": "n6mTWAOhVDda", "roles": ["user"]},
        {"full_name": "Abhishek", "username": "abhishek", "email": "abhi@americancircuits.com", "password": "2umk93LcQ5cX", "roles": ["user", "operator"]},
        {"full_name": "Larry", "username": "larry", "email": "larry@americancircuits.com", "password": "AaWtgE1hRECG", "roles": ["user", "manager", "operator", "itar"]},
    ]
    
    print("Creating all 16 users...")
    created_count = 0
    
    for user_data in all_users:
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
                if role_name in roles:
                    user.roles.append(roles[role_name])
            
            # Add tools based on roles
            # Superusers get all tools
            if "superuser" in user_data["roles"]:
                for tool in tools.values():
                    user.tools.append(tool)
            # Managers and regular users get compare_tool
            elif "manager" in user_data["roles"] or "user" in user_data["roles"]:
                if "compare_tool" in tools:
                    user.tools.append(tools["compare_tool"])
            
            db.add(user)
            db.commit()
            created_count += 1
            print(f"  Created: {user_data['full_name']} ({user_data['username']}) - Roles: {user_data['roles']}")
        else:
            print(f"  - Already exists: {user_data['full_name']} ({user_data['username']})")
    
    return created_count

def display_final_summary(db: Session):
    """Display comprehensive summary"""
    print("\n" + "="*70)
    print("ACI DASHBOARD - USER CREATION SUMMARY")
    print("="*70)
    
    # Get all data
    users = db.query(User).all()
    roles = db.query(Role).all()
    tools = db.query(Tool).all()
    
    print(f"\nTOTALS:")
    print(f"  • Users: {len(users)}")
    print(f"  • Roles: {len(roles)}")
    print(f"  • Tools: {len(tools)}")
    
    print(f"\nALL USERS CREATED:")
    print("-" * 70)
    
    # Sort by role hierarchy
    role_order = ["superuser", "manager", "user", "operator"]
    
    for role_name in role_order:
        role_users = [u for u in users if any(r.name == role_name for r in u.roles)]
        if role_users:
            print(f"\n{role_name.upper()}S ({len(role_users)} users):")
            for user in role_users:
                roles_list = [r.name for r in user.roles]
                tools_list = [t.display_name for t in user.tools]
                print(f"  {user.full_name:<12} ({user.username:<12}) - {user.email:<30} - Roles: {roles_list} - Tools: {[t.display_name for t in user.tools]}")
    
    print("\n" + "="*70)
    print("All users successfully created with exact specifications!")
    print("="*70)

def main():
    """Main execution function"""
    print("Starting comprehensive user creation for ACI Dashboard...")
    print("="*70)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Create all tables
        from database.models import Base
        Base.metadata.create_all(bind=engine)
        
        # Create roles and tools
        roles = create_all_roles(db)
        tools = create_all_tools(db)
        
        # Create all users
        created_count = create_all_users(db, roles, tools)
        
        # Display summary
        display_final_summary(db)
        
        print(f"\nSuccessfully created {created_count} new users!")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()
