#!/usr/bin/env python3
"""
Add rob and juliar users to ACI Forge as superusers
"""

import os
import sys
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db.base import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.tool import Tool
from app.core.security import get_password_hash

def add_users():
    """Add rob and juliar as superusers"""

    db = SessionLocal()

    try:
        # Get or create superuser role
        superuser_role = db.query(Role).filter(Role.name == "superuser").first()
        if not superuser_role:
            superuser_role = Role(name="superuser", description="Super User with full access to all features")
            db.add(superuser_role)
            db.commit()

        # Get all tools
        all_tools = db.query(Tool).all()

        # Define users to add
        users_data = [
            {
                "full_name": "Rob",
                "username": "rob",
                "email": "rob@americancircuits.com",
                "password": "NxpqZUujacrX",
                "roles": ["superuser"]
            },
            {
                "full_name": "Julia R",
                "username": "juliar",
                "email": "juliar@americancircuits.com",
                "password": "CfG&ip#Afc62",
                "roles": ["superuser"]
            }
        ]

        for user_data in users_data:
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()

            if existing_user:
                # Update existing user
                existing_user.password_hash = get_password_hash(user_data["password"])
                existing_user.is_active = True

                # Clear existing roles and tools
                existing_user.roles.clear()
                existing_user.tools.clear()

                # Add superuser role
                existing_user.roles.append(superuser_role)

                # Add all tools
                for tool in all_tools:
                    existing_user.tools.append(tool)

                print(f"Updated {user_data['username']} - Now a SUPERUSER with all tools")
            else:
                # Create new user
                password_hash = get_password_hash(user_data["password"])

                user = User(
                    full_name=user_data["full_name"],
                    username=user_data["username"].lower(),
                    email=user_data["email"].lower(),
                    password_hash=password_hash,
                    is_active=True
                )

                # Add superuser role
                user.roles.append(superuser_role)

                # Add all tools
                for tool in all_tools:
                    user.tools.append(tool)

                db.add(user)
                print(f"Created {user_data['username']} - SUPERUSER with all tools")

        db.commit()
        print("\nUsers added successfully!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_users()
