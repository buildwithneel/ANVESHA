import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "RailGuard AI Backend"
    API_V1_PREFIX: str = "/api"
    DATABASE_URL: str = "sqlite:///./railguard.db"
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()

if settings.FRONTEND_URL and settings.FRONTEND_URL not in settings.ALLOWED_ORIGINS:
    settings.ALLOWED_ORIGINS.append(settings.FRONTEND_URL)
