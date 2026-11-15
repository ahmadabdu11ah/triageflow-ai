from __future__ import annotations

from collections.abc import Generator, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import TicketCategory, TicketPriority
from app.schemas import AITriageResult
from app.services import ai_service
from app.services.ai_service import AIServiceError

engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def _override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def _db() -> Iterator[None]:
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


class MockAnalyzeTicket:
    """Offline mock for ``ai_service.analyze_ticket`` so tests never call Gemini."""

    def __init__(self) -> None:
        self.fail = False
        self.calls = 0

    def __call__(self, title: str, description: str) -> AITriageResult:
        self.calls += 1
        if self.fail:
            raise AIServiceError("simulated Gemini outage")
        is_security = "password" in description.lower() or "xss" in title.lower()
        return AITriageResult(
            category=TicketCategory.SECURITY if is_security else TicketCategory.BUG,
            priority=TicketPriority.CRITICAL if is_security else TicketPriority.HIGH,
            summary=f"Summary of: {title}",
            suggested_reply="Thanks for reporting! Could you share steps to reproduce?",
            confidence=0.91,
        )


@pytest.fixture(autouse=True)
def mock_analyze_ticket(monkeypatch: pytest.MonkeyPatch) -> MockAnalyzeTicket:
    mock_fn = MockAnalyzeTicket()
    monkeypatch.setattr(ai_service, "analyze_ticket", mock_fn)
    monkeypatch.setattr(ai_service, "classify_ticket", mock_fn)
    return mock_fn


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


def _register_and_auth_headers(
    client: TestClient, email: str = "alice@example.com"
) -> dict[str, str]:
    resp = client.post(
        "/api/auth/register",
        json={"email": email, "full_name": "Alice Tester", "password": "supersecret1"},
    )
    assert resp.status_code == 201, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


# ---------------------------------------------------------------------------
# 1. User Registration & Duplicate Email Rejection
# ---------------------------------------------------------------------------
def test_user_registration_and_duplicate_email_rejection(client: TestClient) -> None:
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "Alice@Example.com",
            "full_name": "Alice Tester",
            "password": "supersecret1",
        },
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and len(body["access_token"]) > 10
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["full_name"] == "Alice Tester"
    assert body["user"]["role"] == "reporter"
    assert "hashed_password" not in body["user"]

    # Duplicate email (even with different casing) is rejected with 409 Conflict
    dup = client.post(
        "/api/auth/register",
        json={
            "email": "alice@example.com",
            "full_name": "Another Alice",
            "password": "supersecret1",
        },
    )
    assert dup.status_code == 409
    assert "already registered" in dup.json()["detail"].lower()


# ---------------------------------------------------------------------------
# 2. JWT Login & Unauthorized Access Rejection (401)
# ---------------------------------------------------------------------------
def test_jwt_login_and_unauthorized_rejection(client: TestClient) -> None:
    _register_and_auth_headers(client, email="bob@example.com")

    # Valid login returns 200 OK with JWT
    login_ok = client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "supersecret1"},
    )
    assert login_ok.status_code == 200
    token = login_ok.json()["access_token"]

    # Authenticated request to /api/auth/me succeeds
    me_ok = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_ok.status_code == 200
    assert me_ok.json()["email"] == "bob@example.com"

    # Wrong password or unknown email returns 401
    wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "wrongpassword"},
    )
    assert wrong_pw.status_code == 401

    unknown_user = client.post(
        "/api/auth/login",
        json={"email": "unknown@example.com", "password": "supersecret1"},
    )
    assert unknown_user.status_code == 401

    # Protected endpoints reject missing or invalid JWTs with 401
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/tickets").status_code == 401
    assert client.get("/api/tickets/stats").status_code == 401
    assert (
        client.post(
            "/api/tickets",
            json={"title": "Unauthorized ticket", "description": "Should fail"},
        ).status_code
        == 401
    )

    invalid_token_resp = client.get(
        "/api/tickets", headers={"Authorization": "Bearer invalid.jwt.token"}
    )
    assert invalid_token_resp.status_code == 401
    assert invalid_token_resp.headers.get("www-authenticate") == "Bearer"


# ---------------------------------------------------------------------------
# 3. Ticket Creation, Status Filtering, and /api/tickets/stats Aggregation
# ---------------------------------------------------------------------------
def test_ticket_creation_with_mocked_ai(
    client: TestClient, mock_analyze_ticket: MockAnalyzeTicket
) -> None:
    headers = _register_and_auth_headers(client)
    resp = client.post(
        "/api/tickets",
        json={
            "title": "Login page XSS vulnerability",
            "description": "Script executes when entered in the password field",
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text
    ticket = resp.json()
    assert mock_analyze_ticket.calls == 1
    assert ticket["status"] == "triaged"
    assert ticket["category"] == "security"
    assert ticket["priority"] == "critical"
    assert ticket["ai_summary"] == "Summary of: Login page XSS vulnerability"
    assert ticket["ai_suggested_reply"].startswith("Thanks for reporting")
    assert ticket["ai_confidence"] == pytest.approx(0.91)
    assert [a["action"] for a in ticket["activities"]] == ["triaged", "created"]


def test_ticket_status_filtering(
    client: TestClient, mock_analyze_ticket: MockAnalyzeTicket
) -> None:
    headers = _register_and_auth_headers(client)

    # Create 2 auto-triaged tickets (status='triaged')
    t1 = client.post(
        "/api/tickets",
        json={"title": "Navbar alignment bug", "description": "Broken on mobile"},
        headers=headers,
    ).json()
    t2 = client.post(
        "/api/tickets",
        json={"title": "Search bar slow", "description": "Takes 4 seconds"},
        headers=headers,
    ).json()

    # Move t1 to 'in_progress'
    upd = client.patch(
        f"/api/tickets/{t1['id']}",
        json={"status": "in_progress"},
        headers=headers,
    )
    assert upd.status_code == 200
    assert upd.json()["status"] == "in_progress"

    # Create 1 ticket while AI is unavailable so it remains 'open'
    mock_analyze_ticket.fail = True
    t3 = client.post(
        "/api/tickets",
        json={"title": "Offline ticket", "description": "Created while AI down"},
        headers=headers,
    ).json()
    assert t3["status"] == "open"

    # Verify status filtering via GET /api/tickets?status=...
    triaged_list = client.get(
        "/api/tickets", params={"status": "triaged"}, headers=headers
    ).json()
    assert triaged_list["total"] == 1
    assert [item["id"] for item in triaged_list["items"]] == [t2["id"]]

    in_progress_list = client.get(
        "/api/tickets", params={"status": "in_progress"}, headers=headers
    ).json()
    assert in_progress_list["total"] == 1
    assert [item["id"] for item in in_progress_list["items"]] == [t1["id"]]

    open_list = client.get(
        "/api/tickets", params={"status": "open"}, headers=headers
    ).json()
    assert open_list["total"] == 1
    assert [item["id"] for item in open_list["items"]] == [t3["id"]]


def test_ticket_stats_aggregation(
    client: TestClient, mock_analyze_ticket: MockAnalyzeTicket
) -> None:
    headers = _register_and_auth_headers(client)

    empty_stats = client.get("/api/tickets/stats", headers=headers).json()
    assert empty_stats["total"] == 0
    assert set(empty_stats["by_status"]) == {
        "open",
        "triaged",
        "in_progress",
        "resolved",
        "closed",
    }

    # Create 2 bug/high tickets and 1 security/critical ticket
    client.post(
        "/api/tickets", json={"title": "Bug one", "description": "crash"}, headers=headers
    )
    client.post(
        "/api/tickets", json={"title": "Bug two", "description": "freeze"}, headers=headers
    )
    client.post(
        "/api/tickets",
        json={"title": "Password leak", "description": "password exposed in logs"},
        headers=headers,
    )

    # Create 1 untriaged ticket (status='open', category='other', priority='medium')
    mock_analyze_ticket.fail = True
    client.post(
        "/api/tickets", json={"title": "Untriaged issue", "description": "info"}, headers=headers
    )

    stats_resp = client.get("/api/tickets/stats", headers=headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()

    assert stats["total"] == 4
    assert stats["by_status"]["triaged"] == 3
    assert stats["by_status"]["open"] == 1
    assert stats["by_status"]["in_progress"] == 0
    assert stats["by_category"]["bug"] == 2
    assert stats["by_category"]["security"] == 1
    assert stats["by_category"]["other"] == 1
    assert stats["by_priority"]["high"] == 2
    assert stats["by_priority"]["critical"] == 1
    assert stats["by_priority"]["medium"] == 1
