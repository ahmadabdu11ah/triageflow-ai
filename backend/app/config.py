from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TriageFlow AI"
    environment: str = "development"
    debug: bool = True

    database_url: str
    
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    gemini_api_key: str
    gemini_model: str

    cors_origins: list[str] = ["http://localhost:5173"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
