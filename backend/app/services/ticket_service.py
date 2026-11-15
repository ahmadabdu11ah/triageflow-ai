from __future__ import annotations

import logging
from enum import Enum

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import InstrumentedAttribute, Session, selectinload

from app.models import (
    Ticket,
    TicketActivity,
    TicketCategory,
    TicketPriority,
    TicketStatus,
    User,
)
from app.schemas import TicketCreate, TicketStats, TicketUpdate
from app.services import ai_service
from app.services.ai_service import AIServiceError

logger = logging.getLogger(__name__)


class TicketValidationError(Exception):
    """Raised when a ticket update references invalid data."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _log_activity(
    db: Session, ticket_id: int, user: User | None, action: str, details: str | None = None
) -> None:
    db.add(
        TicketActivity(
            ticket_id=ticket_id,
            user_id=user.id if user is not None else None,
            action=action,
            details=details,
        )
    )


def _ticket_query() -> Select[tuple[Ticket]]:
    return select(Ticket).options(
        selectinload(Ticket.created_by),
        selectinload(Ticket.assigned_to),
    )


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _to_db_value(value: object) -> object:
    return value.value if isinstance(value, Enum) else value


# ---------------------------------------------------------------------------
# Queries
# ---------------------------------------------------------------------------
def get_ticket(db: Session, ticket_id: int) -> Ticket | None:
    stmt = _ticket_query().options(selectinload(Ticket.activities)).where(Ticket.id == ticket_id)
    return db.scalar(stmt)


def list_tickets(
    db: Session,
    *,
    status: TicketStatus | None = None,
    priority: TicketPriority | None = None,
    category: TicketCategory | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> tuple[list[Ticket], int]:
    filters = []
    if status is not None:
        filters.append(Ticket.status == status.value)
    if priority is not None:
        filters.append(Ticket.priority == priority.value)
    if category is not None:
        filters.append(Ticket.category == category.value)
    if search:
        pattern = f"%{_escape_like(search.strip())}%"
        filters.append(
            or_(
                Ticket.title.ilike(pattern, escape="\\"),
                Ticket.description.ilike(pattern, escape="\\"),
            )
        )

    total = db.scalar(select(func.count(Ticket.id)).where(*filters)) or 0
    stmt = (
        _ticket_query()
        .where(*filters)
        .order_by(Ticket.created_at.desc(), Ticket.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt).all()), total


def _group_counts(
    db: Session, column: InstrumentedAttribute[str], values: type[Enum]
) -> dict[str, int]:
    counts: dict[str, int] = {member.value: 0 for member in values}
    rows = db.execute(select(column, func.count(Ticket.id)).group_by(column)).all()
    for value, count in rows:
        counts[value] = count
    return counts


def get_ticket_stats(db: Session) -> TicketStats:
    total = db.scalar(select(func.count(Ticket.id))) or 0
    return TicketStats(
        total=total,
        by_status=_group_counts(db, Ticket.status, TicketStatus),
        by_priority=_group_counts(db, Ticket.priority, TicketPriority),
        by_category=_group_counts(db, Ticket.category, TicketCategory),
    )


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------
def create_ticket(db: Session, data: TicketCreate, user: User, *, auto_triage: bool = True) -> Ticket:
    ticket = Ticket(
        title=data.title.strip(),
        description=data.description.strip(),
        created_by_id=user.id,
    )
    db.add(ticket)
    db.flush()
    _log_activity(db, ticket.id, user, "created", f"Ticket created: {ticket.title}")
    db.commit()
    ticket_id = ticket.id

    if auto_triage:
        try:
            triage_ticket(db, ticket, user)
        except AIServiceError:
            logger.info("Auto-triage failed for ticket %s; left as open", ticket_id)

    result = get_ticket(db, ticket_id)
    assert result is not None
    return result


def update_ticket(db: Session, ticket: Ticket, data: TicketUpdate, user: User) -> Ticket:
    changes = data.model_dump(exclude_unset=True)

    if "assigned_to_id" in changes and changes["assigned_to_id"] is not None:
        if db.get(User, changes["assigned_to_id"]) is None:
            raise TicketValidationError("assigned_to_id does not reference an existing user")

    for field in ("title", "status", "priority", "category"):
        if field in changes and changes[field] is None:
            raise TicketValidationError(f"{field} cannot be null")
    if "description" in changes and changes["description"] is None:
        raise TicketValidationError("description cannot be null")

    diffs: list[str] = []
    for field, raw_value in changes.items():
        new_value = _to_db_value(raw_value)
        if isinstance(new_value, str):
            new_value = new_value.strip()
        old_value = getattr(ticket, field)
        if old_value != new_value:
            setattr(ticket, field, new_value)
            if field == "description":
                diffs.append("description updated")
            else:
                diffs.append(f"{field}: {old_value} -> {new_value}")

    if diffs:
        _log_activity(db, ticket.id, user, "updated", "; ".join(diffs))
        db.commit()

    result = get_ticket(db, ticket.id)
    assert result is not None
    return result


def delete_ticket(db: Session, ticket: Ticket) -> None:
    db.delete(ticket)
    db.commit()


def triage_ticket(db: Session, ticket: Ticket, user: User | None) -> Ticket:
    """Run AI classification and persist the results. Raises ``AIServiceError`` on failure."""
    ticket_id = ticket.id
    try:
        result = ai_service.analyze_ticket(ticket.title, ticket.description)
    except AIServiceError as exc:
        _log_activity(db, ticket_id, user, "triage_failed", str(exc)[:1000])
        db.commit()
        raise

    ticket.category = result.category.value
    ticket.priority = result.priority.value
    ticket.ai_summary = result.summary
    ticket.ai_suggested_reply = result.suggested_reply
    ticket.ai_confidence = result.confidence
    if ticket.status == TicketStatus.OPEN.value:
        ticket.status = TicketStatus.TRIAGED.value

    _log_activity(
        db,
        ticket_id,
        user,
        "triaged",
        f"AI triage: category={result.category.value}, priority={result.priority.value}, "
        f"confidence={result.confidence:.2f}",
    )
    db.commit()

    refreshed = get_ticket(db, ticket_id)
    assert refreshed is not None
    return refreshed
