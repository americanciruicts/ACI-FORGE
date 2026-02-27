"""
One-time script to sync NEXUS users that are missing from FORGE.
Creates them in FORGE with role=operator, tool=nexus, and a default password.
Run inside the backend container: python sync_nexus_users.py
"""

import psycopg2
import os
import sys

# Add app to path
sys.path.insert(0, "/app")

from app.core.security import get_password_hash
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role
from app.models.tool import Tool

# Default password for synced users
DEFAULT_PASSWORD = "AciForge2026!"

# NEXUS DB connection
NEXUS_DB_URL = os.getenv(
    "NEXUS_DATABASE_URL",
    "postgresql://nexus_user:postgres@aci-database:5432/nexus",
)


def get_nexus_users():
    """Fetch all active NEXUS users."""
    conn = psycopg2.connect(NEXUS_DB_URL)
    cur = conn.cursor()
    cur.execute(
        "SELECT username, email, first_name, last_name, role FROM users WHERE is_active = true"
    )
    rows = cur.fetchall()
    conn.close()
    return rows


def get_forge_usernames(db):
    """Get set of existing FORGE usernames."""
    users = db.query(User.username).all()
    return {u[0].lower() for u in users}


def main():
    db = next(get_db())

    # Get existing FORGE usernames
    forge_usernames = get_forge_usernames(db)
    print(f"Existing FORGE users: {len(forge_usernames)}")

    # Get NEXUS users
    nexus_users = get_nexus_users()
    print(f"Total NEXUS users: {len(nexus_users)}")

    # Skip system accounts
    skip_usernames = {"admin", "admin1", "system"}

    # Get operator role and nexus tool
    operator_role = db.query(Role).filter(Role.name == "operator").first()
    user_role = db.query(Role).filter(Role.name == "user").first()
    nexus_tool = db.query(Tool).filter(Tool.name == "nexus").first()

    if not operator_role or not nexus_tool:
        print("ERROR: Could not find operator role or nexus tool in FORGE DB")
        return

    password_hash = get_password_hash(DEFAULT_PASSWORD)
    created = []
    skipped = []

    for username, email, first_name, last_name, role in nexus_users:
        uname = username.lower()

        if uname in skip_usernames:
            skipped.append(f"{uname} (system account)")
            continue

        if uname in forge_usernames:
            skipped.append(f"{uname} (already exists)")
            continue

        full_name = f"{first_name} {last_name}".strip() if last_name else first_name
        # Fix known email typo
        if email == "maria@americancircuits.comq":
            email = "maria@americancircuits.com"

        new_user = User(
            full_name=full_name,
            username=uname,
            email=email.lower(),
            password_hash=password_hash,
            is_active=True,
        )
        new_user.roles = [operator_role, user_role]
        new_user.tools = [nexus_tool]

        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            created.append(f"{uname} ({full_name}, {email})")
            forge_usernames.add(uname)
            print(f"  CREATED: {uname} - {full_name} ({email})")
        except Exception as e:
            db.rollback()
            print(f"  ERROR: {uname} - {e}")

    print(f"\n--- Summary ---")
    print(f"Created: {len(created)}")
    print(f"Skipped: {len(skipped)}")
    for s in skipped:
        print(f"  - {s}")
    print(f"\nDefault password for all new users: {DEFAULT_PASSWORD}")
    print("These users have been assigned: role=operator+user, tool=NEXUS")


if __name__ == "__main__":
    main()
