from __future__ import annotations

from datetime import datetime
from enum import Enum
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, Enum):
    ADMIN = "admin"
    AGENT = "agent"
    REPORTER = "reporter"


class TicketStatus(str, Enum):
    OPEN = "open"
    TRIAGED = "triaged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TicketCategory(str, Enum):
    BUG = "bug"
    FEATURE = "feature"
    SECURITY = "security"
    PERFORMANCE = "performance"
    SUPPORT = "support"
    OTHER = "other"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.REPORTER.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    created_tickets: Mapped[list[Ticket]] = relationship(
        "Ticket",
        back_populates="created_by",
        foreign_keys="Ticket.created_by_id",
        cascade="all, delete-orphan",
    )
    assigned_tickets: Mapped[list[Ticket]] = relationship(
        "Ticket",
        back_populates="assigned_to",
        foreign_keys="Ticket.assigned_to_id",
    )
    activities: Mapped[list[TicketActivity]] = relationship(
        "TicketActivity",
        back_populates="user",
    )


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default=TicketStatus.OPEN.value, nullable=False, index=True
    )
    priority: Mapped[str] = mapped_column(
        String(50), default=TicketPriority.MEDIUM.value, nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(
        String(50), default=TicketCategory.OTHER.value, nullable=False, index=True
    )
    ai_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_suggested_reply: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_by_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    assigned_to_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    created_by: Mapped[User] = relationship(
        "User", back_populates="created_tickets", foreign_keys=[created_by_id]
    )
    assigned_to: Mapped[User | None] = relationship(
        "User", back_populates="assigned_tickets", foreign_keys=[assigned_to_id]
    )
    activities: Mapped[list[TicketActivity]] = relationship(
        "TicketActivity",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketActivity.id.desc()",
    )


class TicketActivity(Base):
    __tablename__ = "ticket_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ticket_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    ticket: Mapped[Ticket] = relationship("Ticket", back_populates="activities")
    user: Mapped[User | None] = relationship("User", back_populates="activities")
