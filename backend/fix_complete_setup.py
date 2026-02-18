#!/usr/bin/env python3
"""
Complete ACI Dashboard Database Fix Script
- Fixes ITAR role (was "itra")
- Adds Cathy and Larry with ITAR roles as specified
- Updates tools with correct URLs
- Creates all users exactly as specified in USER_CREDENTIALS.md
"""

import os
import sys
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db.base import SessionLocal, engine
from app.models.user import User
from app.models.role import Role
from app.models.tool import Tool
from app.core.security import get_password_hash

def create_all_roles(db: Session):
    """Create all required roles including ITAR"""
    roles_data = [
        {"name": "superuser", "description": "Super User with full access to all features"},
        {"name": "manager", "description": "Manager role with elevated permissions"},
        {"name": "user", "description": "Regular user with standard access"},
        {"name": "operator", "description": "Operator role with operational permissions"},
        {"name": "itar", "description": "ITAR role with specialized access"},  # Fixed: was "itra"
    ]

    print("🎯 Creating/updating roles...")
    created_roles = {}
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(**role_data)
            db.add(role)
            db.commit()
            created_roles[role_data["name"]] = role
            print(f"  ✓ Created role: {role_data['name']}")
        else:
            created_roles[role_data["name"]] = existing_role
            print(f"  - Role already exists: {role_data['name']}")

    return created_roles

def create_all_tools(db: Session):
    """Create all required tools with correct URLs"""
    tools_data = [
        {
            "name": "bom_compare",
            "display_name": "BOM Compare",
            "description": "Compare and analyze Bill of Materials",
            "route": "http://acidashboard.aci.local:8081/",
            "icon": "compare",
            "is_active": True
        },
        {
            "name": "aci_inventory",
            "display_name": "Kosh",
            "description": "Inventory management system",
            "route": "http://acidashboard.aci.local:5002/",
            "icon": "package",
            "is_active": True
        },
        {
            "name": "aci_excel_migration",
            "display_name": "ACI Excel Migration",
            "description": "Excel migration and data processing tool",
            "route": "http://acidashboard.aci.local:6003/",
            "icon": "file-text",
            "is_active": True
        },
        {
            "name": "aci_chat",
            "display_name": "ACI Chat",
            "description": "AI-powered chat using OLLAMA (Local LLM)",
            "route": "http://acidashboard.aci.local:4000/",
            "icon": "message-circle",
            "is_active": True
        }
    ]

    print("🔧 Creating/updating tools...")
    created_tools = {}
    for tool_data in tools_data:
        existing_tool = db.query(Tool).filter(Tool.name == tool_data["name"]).first()
        if not existing_tool:
            tool = Tool(**tool_data)
            db.add(tool)
            db.commit()
            created_tools[tool_data["name"]] = tool
            print(f"  ✓ Created tool: {tool_data['display_name']}")
        else:
            # Update existing tool with correct route
            existing_tool.route = tool_data["route"]
            existing_tool.description = tool_data["description"]
            existing_tool.display_name = tool_data["display_name"]
            db.commit()
            created_tools[tool_data["name"]] = existing_tool
            print(f"  ✓ Updated tool: {tool_data['display_name']}")

    return created_tools

def create_all_users(db: Session, roles: dict, tools: dict):
    """Create all users exactly as specified in USER_CREDENTIALS.md"""

    # All users from the USER_CREDENTIALS.md specification
    all_users = [
        # Super Users
        {"full_name": "Administrator", "username": "admin", "email": "admin@americancircuits.com", "password": "admin", "roles": ["superuser"], "tools": []},
        {"full_name": "Tony", "username": "tony", "email": "tony@americancircuits.com", "password": "AhFnrAASWN0a", "roles": ["superuser"], "tools": []},
        {"full_name": "Preet", "username": "preet", "email": "preet@americancircuits.com", "password": "AaWtgE1hRECG", "roles": ["superuser"], "tools": []},
        {"full_name": "Kanav", "username": "kanav", "email": "kanav@americancircuits.com", "password": "XCSkRBUbQKdY", "roles": ["superuser"], "tools": []},
        {"full_name": "Khash", "username": "khash", "email": "khash@americancircuits.com", "password": "9OHRzT69Y3AZ", "roles": ["superuser"], "tools": []},

        # Manager/Users
        {"full_name": "Max", "username": "max", "email": "max@americancircuits.com", "password": "CCiYxAAxyR0z", "roles": ["user", "manager"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Ket", "username": "ket", "email": "ket@americancircuits.com", "password": "jzsNCHDdFGJv", "roles": ["user", "manager"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Julia", "username": "julia", "email": "julia@americancircuits.com", "password": "SkqtODKmrLjW", "roles": ["user", "manager"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Praful", "username": "praful", "email": "praful@americancircuits.com", "password": "F1Cur8klq4pe", "roles": ["user", "manager"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Kris", "username": "kris", "email": "kris@americancircuits.com", "password": "RSoX1Qcmc3Tu", "roles": ["user", "manager", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},

        # Regular User
        {"full_name": "Bob", "username": "bob", "email": "bob@americancircuits.com", "password": "n6mTWAOhVDda", "roles": ["user"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},

        # User/Operators
        {"full_name": "Adam", "username": "adam", "email": "adam@americancircuits.com", "password": "5AdsYCEqrrIg", "roles": ["user", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Alex", "username": "alex", "email": "alex@americancircuits.com", "password": "zQE3SqCV5zAE", "roles": ["user", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Pratiksha", "username": "pratiksha", "email": "pratiksha@americancircuits.com", "password": "hUDcvxtL26I9", "roles": ["user", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Abhishek", "username": "abhishek", "email": "abhi@americancircuits.com", "password": "2umk93LcQ5cX", "roles": ["user", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},

        # User/Operator/ITAR
        {"full_name": "Cathy", "username": "cathy", "email": "cathy@americancircuits.com", "password": "KOLCsB4kTzow", "roles": ["user", "operator", "itar"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        {"full_name": "Larry", "username": "larry", "email": "larry@americancircuits.com", "password": "AaWtgE1hRECG", "roles": ["user", "manager", "operator", "itar"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},

        # Additional User/Operators
        {"full_name": "LeeAnn", "username": "leeann", "email": "leeann@americancircuits.com", "password": "iEAiQtPuHdQA", "roles": ["user", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},
        # {"full_name": "Bruce", "username": "bruce", "email": "bruce@americancircuits.com", "password": "PENDING", "roles": ["user", "operator"], "tools": ["bom_compare", "aci_inventory", "aci_excel_migration", "aci_chat"]},  # Uncomment and add password when available
    ]

    print("👥 Creating/updating all users...")
    created_count = 0
    updated_count = 0

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

            # Add tools (superusers get all tools automatically)
            if "superuser" in user_data["roles"]:
                for tool in tools.values():
                    user.tools.append(tool)
            else:
                for tool_name in user_data["tools"]:
                    if tool_name in tools:
                        user.tools.append(tools[tool_name])

            db.add(user)
            db.commit()
            created_count += 1
            print(f"  ✓ Created: {user_data['full_name']} ({user_data['username']}) - Roles: {user_data['roles']}")
        else:
            # Update existing user's roles and tools
            # Clear existing roles and tools
            existing_user.roles.clear()
            existing_user.tools.clear()

            # Add roles
            for role_name in user_data["roles"]:
                if role_name in roles:
                    existing_user.roles.append(roles[role_name])

            # Add tools (superusers get all tools automatically)
            if "superuser" in user_data["roles"]:
                for tool in tools.values():
                    existing_user.tools.append(tool)
            else:
                for tool_name in user_data["tools"]:
                    if tool_name in tools:
                        existing_user.tools.append(tools[tool_name])

            db.commit()
            updated_count += 1
            print(f"  ✓ Updated: {user_data['full_name']} ({user_data['username']}) - Roles: {user_data['roles']}")

    return created_count, updated_count

def display_final_summary(db: Session):
    """Display comprehensive summary"""
    print("\n" + "="*80)
    print("🎉 ACI DASHBOARD - COMPLETE DATABASE SETUP SUMMARY")
    print("="*80)

    # Get all data
    users = db.query(User).all()
    roles = db.query(Role).all()
    tools = db.query(Tool).all()

    print(f"\n📊 TOTALS:")
    print(f"  • Users: {len(users)}")
    print(f"  • Roles: {len(roles)}")
    print(f"  • Tools: {len(tools)}")

    print(f"\n🔧 TOOLS CONFIGURED:")
    for tool in tools:
        print(f"  • {tool.display_name}: {tool.route}")

    print(f"\n👥 ALL USERS BY ROLE:")
    print("-" * 80)

    # Group users by primary role
    role_groups = {
        "superuser": [],
        "manager": [],
        "user": [],
        "operator": [],
        "itar": []
    }

    for user in users:
        user_roles = [r.name for r in user.roles]
        if "superuser" in user_roles:
            role_groups["superuser"].append(user)
        elif "manager" in user_roles:
            role_groups["manager"].append(user)
        elif "itar" in user_roles:
            role_groups["itar"].append(user)
        elif "operator" in user_roles:
            role_groups["operator"].append(user)
        else:
            role_groups["user"].append(user)

    for role_name, users_list in role_groups.items():
        if users_list:
            print(f"\n{role_name.upper()}S ({len(users_list)} users):")
            for user in users_list:
                roles_list = [r.name for r in user.roles]
                tools_count = "ALL TOOLS" if any(r.name == "superuser" for r in user.roles) else f"{len(user.tools)} tools"
                print(f"  • {user.full_name:<12} ({user.username:<12}) - {user.email:<30} - Roles: {roles_list} - {tools_count}")

    print(f"\n🌐 DASHBOARD ACCESS:")
    print(f"  • Application URL: http://acidashboard.aci.local:2005/")
    print(f"  • Login Page: http://acidashboard.aci.local:2005/login")
    print(f"  • Backend API: http://localhost:2003")

    print("\n" + "="*80)
    print("✅ Complete database setup finished successfully!")
    print("✅ All users from USER_CREDENTIALS.md have been created/updated!")
    print("✅ All tools configured with correct URLs!")
    print("✅ ITAR role properly configured!")
    print("="*80)

def main():
    """Main execution function"""
    print("🚀 Starting complete ACI Dashboard database setup...")
    print("="*80)

    # Create database session
    db = SessionLocal()

    try:
        # Create all tables
        from app.models.base import BaseModel
        BaseModel.metadata.create_all(bind=engine)

        # Create roles, tools, and users
        roles = create_all_roles(db)
        tools = create_all_tools(db)
        created_count, updated_count = create_all_users(db, roles, tools)

        # Display summary
        display_final_summary(db)

        print(f"\n🎯 Successfully created {created_count} new users and updated {updated_count} existing users!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main()