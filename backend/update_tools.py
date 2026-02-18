"""
Update tools in the database - Remove Excel Migration and Add SuiteMaster/NEXUS
"""

import os
import sys
from sqlalchemy.orm import Session

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Tool, User

def update_tools():
    """Remove Excel Migration and add SuiteMaster/NEXUS tools"""
    print("Updating tools in database...")

    db = SessionLocal()

    try:
        # Remove Excel Migration tool
        excel_tool = db.query(Tool).filter(Tool.name == 'aci_excel_migration').first()
        if excel_tool:
            print(f"Removing tool: {excel_tool.display_name}")
            db.delete(excel_tool)
            db.commit()
            print("✅ Excel Migration tool removed")
        else:
            print("ℹ️  Excel Migration tool not found in database")

        # Add SuiteMaster tool
        suitemaster_tool = db.query(Tool).filter(Tool.name == 'suitemaster').first()
        if not suitemaster_tool:
            suitemaster_tool = Tool(
                name="suitemaster",
                display_name="SuiteMaster",
                description="Suite management and control system",
                route="/dashboard/tools/suitemaster",
                icon="layout",
                is_active=True
            )
            db.add(suitemaster_tool)
            db.commit()
            print("✅ SuiteMaster tool added")
        else:
            print("ℹ️  SuiteMaster tool already exists")

        # Add NEXUS tool
        nexus_tool = db.query(Tool).filter(Tool.name == 'nexus').first()
        if not nexus_tool:
            nexus_tool = Tool(
                name="nexus",
                display_name="NEXUS",
                description="Traveler Management System",
                route="/dashboard/tools/nexus",
                icon="hexagon",
                is_active=True
            )
            db.add(nexus_tool)
            db.commit()
            print("✅ NEXUS tool added")
        else:
            print("ℹ️  NEXUS tool already exists")

        print("\n✅ Tools update completed successfully!")

    except Exception as e:
        print(f"❌ Error during update: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_tools()
