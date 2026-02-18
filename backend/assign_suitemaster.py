"""
Assign SuiteMaster tool to all super users
"""

import os
import sys
from sqlalchemy.orm import Session

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Tool, User, Role

def assign_suitemaster():
    """Assign SuiteMaster to all super users"""
    print("Assigning SuiteMaster to super users...")

    db = SessionLocal()

    try:
        # Get SuiteMaster tool
        suitemaster = db.query(Tool).filter(Tool.name == 'suitemaster').first()
        if not suitemaster:
            print("❌ SuiteMaster tool not found!")
            return

        # Get all super users
        superuser_role = db.query(Role).filter(Role.name == 'superuser').first()
        if not superuser_role:
            print("❌ Superuser role not found!")
            return

        # Assign SuiteMaster to each super user
        for user in superuser_role.users:
            if suitemaster not in user.tools:
                user.tools.append(suitemaster)
                print(f"✅ Added SuiteMaster to {user.username}")
            else:
                print(f"ℹ️  {user.username} already has SuiteMaster")

        db.commit()
        print("\n✅ SuiteMaster assignment completed successfully!")

    except Exception as e:
        print(f"❌ Error during assignment: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    assign_suitemaster()
