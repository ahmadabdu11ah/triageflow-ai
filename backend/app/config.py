from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
from typing import Annotated

from pydantic import AliasChoices, BeforeValidator, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def parse_allowed_origins(value: str | list[str] | None) -> list[str]:
    """Parse ALLOWED_ORIGINS from a comma-separated string, JSON array, or list."""
    if isinstance(value, list):
        cleaned = [str(origin).strip().rstrip("/") for origin in value if str(origin).strip()]
        return cleaned or ["http://localhost:5173"]
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return ["http://localhost:5173"]
        if raw.startswith("[") and raw.endswith("]"):
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                cleaned = [str(o).strip().rstrip("/") for o in parsed if str(o).strip()]
                return cleaned or ["http://localhost:5173"]
        cleaned = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
        return cleaned or ["http://localhost:5173"]
    return ["http://localhost:5173"]


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

    allowed_origins: Annotated[
        list[str],
        NoDecode,
        BeforeValidator(parse_allowed_origins),
    ] = Field(
        default=["http://localhost:5173"],
        validation_alias=AliasChoices("ALLOWED_ORIGINS", "CORS_ORIGINS", "allowed_origins", "cors_origins"),
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        """Convert Render's postgres:// or postgresql:// URLs to postgresql+psycopg2://."""
        if isinstance(value, str):
            trimmed = value.strip()
            if trimmed.startswith("postgres://"):
                return "postgresql+psycopg2://" + trimmed[len("postgres://") :]
            if trimmed.startswith("postgresql://"):
                return "postgresql+psycopg2://" + trimmed[len("postgresql://") :]
        return value

    @property
    def cors_origins(self) -> list[str]:
        """Backwards-compatible alias for allowed_origins."""
        return self.allowed_origins

    model_config = SettingsConfigDict(
        env_file=(Path(__file__).resolve().parent.parent / ".env", ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
