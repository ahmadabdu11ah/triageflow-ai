from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import TicketCategory, TicketPriority, TicketStatus


# ---------------------------------------------------------------------------
# Users / Auth
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=72)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes")
        return value

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Full name must not be blank")
        return stripped


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


# ---------------------------------------------------------------------------
# Tickets
# ---------------------------------------------------------------------------
class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=1, max_length=20_000)


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=20_000)
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category: TicketCategory | None = None
    assigned_to_id: int | None = None


class TicketActivityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    ticket_id: int
    user_id: int | None
    action: str
    details: str | None
    created_at: datetime


class TicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    ai_summary: str | None
    ai_suggested_reply: str | None
    ai_confidence: float | None
    created_by_id: int
    assigned_to_id: int | None
    created_at: datetime
    updated_at: datetime
    created_by: UserRead
    assigned_to: UserRead | None


class TicketDetail(TicketRead):
    activities: list[TicketActivityRead]


class TicketListResponse(BaseModel):
    items: list[TicketRead]
    total: int
    skip: int
    limit: int


class TicketStats(BaseModel):
    total: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    by_category: dict[str, int]


# ---------------------------------------------------------------------------
# AI structured output
# ---------------------------------------------------------------------------
class AITriageResult(BaseModel):
    category: TicketCategory = Field(description="The single best-fitting ticket category.")
    priority: TicketPriority = Field(
        description="Urgency based on user impact, scope, and security/data risk."
    )
    summary: str = Field(description="A neutral 1-2 sentence summary of the issue.")
    suggested_reply: str = Field(
        description="A polite, actionable first reply to the reporter (2-5 sentences)."
    )
    confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence in the classification, from 0.0 to 1.0."
    )
