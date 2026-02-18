"""
Setup script for Maintenance Request System
Creates maintenance role and maintenance_requests table
"""
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.base import engine, SessionLocal
from app.models import Role, User, MaintenanceRequest
from app.models.base import BaseModel


def create_maintenance_role(db: Session):
    """Create maintenance role if it doesn't exist"""
    existing_role = db.query(Role).filter(Role.name == "maintenance").first()

    if existing_role:
        print("✓ Maintenance role already exists")
        return existing_role

    maintenance_role = Role(
        name="maintenance",
        description="Can view and manage all maintenance requests"
    )
    db.add(maintenance_role)
    db.commit()
    db.refresh(maintenance_role)
    print("✓ Created maintenance role")
    return maintenance_role


def create_tables():
    """Create all tables including maintenance_requests"""
    print("Creating database tables...")
    BaseModel.metadata.create_all(bind=engine)
    print("✓ All tables created successfully")


def main():
    """Main setup function"""
    print("=" * 60)
    print("Maintenance Request System Setup")
    print("=" * 60)

    # Create tables
    create_tables()

    # Create maintenance role
    db = SessionLocal()
    try:
        create_maintenance_role(db)
        print("\n" + "=" * 60)
        print("Setup completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Assign 'maintenance' role to users who should manage requests")
        print("2. Restart the backend server")
        print("3. Access the Maintenance Requests page from the navbar")
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
