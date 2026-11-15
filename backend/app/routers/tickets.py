from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Ticket, TicketCategory, TicketPriority, TicketStatus, User
from app.schemas import (
    TicketCreate,
    TicketDetail,
    TicketListResponse,
    TicketRead,
    TicketStats,
    TicketUpdate,
)
from app.services import ticket_service
from app.services.ai_service import AIServiceError
from app.services.ticket_service import TicketValidationError

router = APIRouter(
    prefix="/api/tickets",
    tags=["tickets"],
    dependencies=[Depends(get_current_user)],
    responses={401: {"description": "Not authenticated"}},
)

_NOT_FOUND = {404: {"description": "Ticket not found"}}


def _get_ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = ticket_service.get_ticket(db, ticket_id)
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")
    return ticket


@router.get("", response_model=TicketListResponse, summary="List tickets with filters")
def list_tickets(
    status_filter: TicketStatus | None = Query(default=None, alias="status"),
    priority: TicketPriority | None = None,
    category: TicketCategory | None = None,
    search: str | None = Query(default=None, max_length=200),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> TicketListResponse:
    items, total = ticket_service.list_tickets(
        db,
        status=status_filter,
        priority=priority,
        category=category,
        search=search,
        skip=skip,
        limit=limit,
    )
    return TicketListResponse(
        items=[TicketRead.model_validate(t) for t in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post(
    "",
    response_model=TicketDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create a ticket (AI auto-triage is attempted best-effort)",
)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    return ticket_service.create_ticket(db, payload, current_user)


@router.get(
    "/stats",
    response_model=TicketStats,
    summary="Ticket counts grouped by status, priority, and category",
)
def ticket_stats(db: Session = Depends(get_db)) -> TicketStats:
    return ticket_service.get_ticket_stats(db)


@router.get(
    "/{ticket_id}",
    response_model=TicketDetail,
    summary="Get a ticket with its activity history",
    responses=_NOT_FOUND,
)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)) -> Ticket:
    return _get_ticket_or_404(db, ticket_id)


@router.patch(
    "/{ticket_id}",
    response_model=TicketDetail,
    summary="Update a ticket",
    responses={**_NOT_FOUND, 422: {"description": "Invalid update"}},
)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = _get_ticket_or_404(db, ticket_id)
    try:
        return ticket_service.update_ticket(db, ticket, payload, current_user)
    except TicketValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None


@router.delete(
    "/{ticket_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a ticket",
    responses=_NOT_FOUND,
)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)) -> Response:
    ticket = _get_ticket_or_404(db, ticket_id)
    ticket_service.delete_ticket(db, ticket)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{ticket_id}/triage",
    response_model=TicketDetail,
    summary="Run (or re-run) AI triage on a ticket",
    responses={**_NOT_FOUND, 502: {"description": "AI triage service failed"}},
)
def triage_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Ticket:
    ticket = _get_ticket_or_404(db, ticket_id)
    try:
        return ticket_service.triage_ticket(db, ticket, current_user)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from None
