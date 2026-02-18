#!/usr/bin/env python3
"""
Migration script to update aci_chatgpt to aci_chat
This updates the tool name, display name, route, and description
"""

import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db.base import SessionLocal
from app.models.tool import Tool

def migrate_chatgpt_to_chat(db: Session):
    """Update aci_chatgpt tool to aci_chat"""

    print("🔄 Migrating aci_chatgpt to aci_chat...")

    # Check if aci_chatgpt exists
    old_tool = db.query(Tool).filter(Tool.name == "aci_chatgpt").first()

    if old_tool:
        print(f"  ✓ Found existing tool: {old_tool.display_name} (ID: {old_tool.id})")

        # Update the tool
        old_tool.name = "aci_chat"
        old_tool.display_name = "ACI Chat"
        old_tool.description = "AI-powered chat using OLLAMA (Local LLM)"
        old_tool.route = "http://acidashboard.aci.local:4000/"

        db.commit()
        print(f"  ✓ Updated tool to: {old_tool.display_name}")
        print(f"    - New name: {old_tool.name}")
        print(f"    - New route: {old_tool.route}")
        print(f"    - New description: {old_tool.description}")
    else:
        print("  ℹ️  aci_chatgpt tool not found")

        # Check if aci_chat already exists
        new_tool = db.query(Tool).filter(Tool.name == "aci_chat").first()
        if new_tool:
            print(f"  ✓ aci_chat tool already exists: {new_tool.display_name}")
        else:
            # Create new aci_chat tool
            print("  ➕ Creating new aci_chat tool...")
            new_tool = Tool(
                name="aci_chat",
                display_name="ACI Chat",
                description="AI-powered chat using OLLAMA (Local LLM)",
                route="http://acidashboard.aci.local:4000/",
                icon="message-circle",
                is_active=True
            )
            db.add(new_tool)
            db.commit()
            print(f"  ✓ Created new tool: {new_tool.display_name}")

    print("\n✅ Migration complete!")

    # Show all tools
    print("\n📋 Current tools in database:")
    all_tools = db.query(Tool).all()
    for tool in all_tools:
        print(f"  - {tool.display_name} ({tool.name}): {tool.route}")

def main():
    print("=" * 60)
    print("  ACI ChatGPT to ACI Chat Migration")
    print("=" * 60)
    print()

    db = SessionLocal()
    try:
        migrate_chatgpt_to_chat(db)
    except Exception as e:
        print(f"\n❌ Error during migration: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

    print("\n" + "=" * 60)
    print("  Next Steps:")
    print("=" * 60)
    print()
    print("1. Restart the backend:")
    print("   cd ~/ACI-DASHBOARD")
    print("   docker-compose restart backend")
    print()
    print("2. Clear browser cache and refresh the dashboard")
    print()
    print("3. ACI Chat tool should now point to:")
    print("   http://acidashboard.aci.local:4000")
    print()

if __name__ == "__main__":
    main()
