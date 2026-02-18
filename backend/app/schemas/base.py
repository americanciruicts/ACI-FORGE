"""
Base Pydantic schemas
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    """Base schema with common fields"""
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)