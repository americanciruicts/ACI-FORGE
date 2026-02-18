"""
Core configuration for the ACI FORGE API
Handles environment variables and application settings
"""

import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import field_validator

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/acidashboard")

    # JWT Configuration - MUST be set in environment variables for security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_REFRESH_SECRET_KEY: str = os.getenv("JWT_REFRESH_SECRET_KEY", "")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: float = float(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "ACI FORGE API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Enterprise-grade dashboard with role-based access control"

    # Security
    BCRYPT_ROUNDS: int = 12

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS - Specify allowed origins explicitly (use comma-separated list in env)
    # Example: ALLOWED_ORIGINS="http://localhost:3000,http://localhost:2005"
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:2005")

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string into a list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
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

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate critical security settings
        if not self.JWT_SECRET_KEY:
            raise ValueError(
                "JWT_SECRET_KEY must be set in environment variables. "
                "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        if not self.JWT_REFRESH_SECRET_KEY:
            raise ValueError(
                "JWT_REFRESH_SECRET_KEY must be set in environment variables. "
                "Generate a secure key with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )
        if len(self.JWT_SECRET_KEY) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters long")
        if len(self.JWT_REFRESH_SECRET_KEY) < 32:
            raise ValueError("JWT_REFRESH_SECRET_KEY must be at least 32 characters long")

# Global settings instance
settings = Settings()