import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aci_dashboard")
DATABASE_URL_LOCAL = os.getenv("DATABASE_URL_LOCAL", "")

# Create primary engine (Neon cloud)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create fallback engine (local) if configured
fallback_engine = None
FallbackSessionLocal = None
if DATABASE_URL_LOCAL:
    fallback_engine = create_engine(DATABASE_URL_LOCAL, pool_pre_ping=True, pool_size=5, max_overflow=10)
    FallbackSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=fallback_engine)

def get_db():
    """Get database session with automatic failover to local DB"""
    # Try primary database first
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except Exception as e:
        try:
            db.close()
        except Exception:
            pass
        if FallbackSessionLocal:
            logger.warning(f"Primary DB unreachable, falling back to local: {e}")
            db = FallbackSessionLocal()
        else:
            raise
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables in the database"""
    Base.metadata.create_all(bind=engine)