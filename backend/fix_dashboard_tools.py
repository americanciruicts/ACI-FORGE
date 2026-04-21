"""
Fix dashboard tools to show the correct ones:
- Kosh (Inventory Management)
- ACI Excel Migration
- BOM Compare
"""

import os
import sys
from sqlalchemy.orm import Session

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.db.base import SessionLocal
from app.models.tool import Tool
from app.models.user import User

def fix_dashboard_tools(db: Session):
    """Fix the dashboard tools to show correct ones"""

    print("🔧 Fixing dashboard tools...")

    # Clear existing tools and relationships
    from sqlalchemy import text
    db.execute(text("DELETE FROM user_tools"))
    db.execute(text("DELETE FROM tools"))
    db.commit()

    # Add correct tools
    correct_tools = [
        {
            "name": "aci_inventory",
            "display_name": "Kosh",
            "description": "Inventory management system",
            "route": "/dashboard/tools/inventory",
            "icon": "package",
            "is_active": True
        },
        {
            "name": "aci_excel_migration",
            "display_name": "ACI Excel Migration",
            "description": "Excel data migration and processing tool",
            "route": "/dashboard/tools/excel-migration",
            "icon": "file-spreadsheet",
            "is_active": True
        },
        {
            "name": "compare_tool",
            "display_name": "BOM Compare",
            "description": "Tool for comparing Bill of Materials",
            "route": "/dashboard/tools/compare",
            "icon": "git-compare",
            "is_active": True
        }
    ]

    created_tools = []
    for tool_data in correct_tools:
        tool = Tool(**tool_data)
        db.add(tool)
        created_tools.append(tool)
        print(f"  ✓ Created tool: {tool_data['display_name']}")

    db.commit()

    # Assign tools to all users
    print("👥 Assigning tools to all users...")
    users = db.query(User).all()

    for user in users:
        user.tools = created_tools
        print(f"  ✓ Assigned all tools to: {user.username}")

    db.commit()

    print(f"✅ Fixed dashboard tools successfully!")
    return created_tools

def main():
    """Main function"""
    print("🔧 FIXING DASHBOARD TOOLS TO CORRECT ONES")
    print("=" * 50)

    # Create database session
    db = SessionLocal()

    try:
        tools = fix_dashboard_tools(db)

        print("=" * 50)
        print("📊 DASHBOARD TOOLS SUMMARY")
        print("=" * 50)
        print(f"Total tools created: {len(tools)}")

        for tool in tools:
            print(f"  🔧 {tool.display_name} - {tool.description}")

        print("\n✅ Dashboard now shows the correct tools!")
        print("🌐 Tools accessible at: http://192.168.1.95:2005")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()