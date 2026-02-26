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

        # Rename compare_tool to bom_tool_suite (matches dashboard homepage)
        compare_tool = db.query(Tool).filter(Tool.name == 'compare_tool').first()
        if compare_tool:
            compare_tool.name = "bom_tool_suite"
            compare_tool.display_name = "BOM Tool Suite"
            compare_tool.description = "BOM Tool Suite for Bill of Materials management"
            compare_tool.icon = "arrow-left-right"
            db.commit()
            print("✅ compare_tool renamed to bom_tool_suite")
        else:
            # Check if bom_tool_suite already exists
            bom_tool = db.query(Tool).filter(Tool.name == 'bom_tool_suite').first()
            if not bom_tool:
                bom_tool = Tool(
                    name="bom_tool_suite",
                    display_name="BOM Tool Suite",
                    description="BOM Tool Suite for Bill of Materials management",
                    route="/dashboard/tools/compare",
                    icon="arrow-left-right",
                    is_active=True
                )
                db.add(bom_tool)
                db.commit()
                print("✅ BOM Tool Suite added")
            else:
                print("ℹ️  bom_tool_suite already exists")

        # Remove any leftover tools that aren't in the homepage 5
        allowed = ['bom_tool_suite', 'aci_inventory', 'aci_chat', 'suitemaster', 'nexus']
        leftover_tools = db.query(Tool).filter(~Tool.name.in_(allowed)).all()
        for t in leftover_tools:
            print(f"Removing leftover tool: {t.name} ({t.display_name})")
            db.delete(t)
        if leftover_tools:
            db.commit()

        print("\n✅ Tools update completed successfully!")

    except Exception as e:
        print(f"❌ Error during update: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    update_tools()
