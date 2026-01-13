"""
Core configuration for the ACI FORGE API
Handles environment variables and application settings
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/acidashboard")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "aSK1LtZz7jqianX3Xz1AEcSjHQRbnY30tNlDptwu6T2DOxDuKyzcjOriZYWNNCoM")
    JWT_REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET_KEY", "SxYjdAjtiJo4jDC1CW8zZ/0NFV55Qeje4WevX5yDOcn9dwujUoQ6EMeWYvfLzNEb")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ACI FORGE API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Enterprise-grade dashboard with role-based access control"
    
    # Security
    BCRYPT_ROUNDS: int = 12
    
    # CORS - Allow all origins for now
    ALLOWED_ORIGINS: list = ["*"]
    
    # Email Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://acidashboard.aci.local:2005")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

# Global settings instance
settings = Settings()