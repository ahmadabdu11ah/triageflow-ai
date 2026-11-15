# TriageFlow AI

A full-stack **AI-Assisted Engineering Issue Triage Application** built with **FastAPI**, **PostgreSQL**, **Google Gemini (`google-genai`)**, and **React (Vite + Tailwind CSS v4)**. TriageFlow AI streamlines engineering operations by capturing incoming bug reports and feature requests, automatically classifying category and priority with structured LLM outputs, generating executive summaries and responder replies, and tracking full ticket lifecycle history.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        React 18 + Vite + Tailwind v4                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   AuthPage   │  │  StatsCards  │  │  FilterBar & │  │TicketDetail │  │
│  │ (JWT + Demo) │  │ (Live KPIs)  │  │  TicketList  │  │   Drawer    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         └─────────────────┴────────┬────────┴─────────────────┘         │
│                                    ▼                                    │
│                   Axios API Client (`src/api/client.js`)                │
│             (Bearer JWT Request Interceptor & 401 Handler)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / JSON (`/api/*`)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Application                            │
│  ┌─────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │   Auth Router (`/api/auth/*`)   │ │Tickets Router (`/api/tickets`) │ │
│  └────────────────┬────────────────┘ └───────────────┬────────────────┘ │
│                   ▼                                  ▼                  │
│  ┌─────────────────────────────────┐ ┌────────────────────────────────┐ │
│  │  `auth_service.py` (bcrypt/JWT) │ │      `ticket_service.py`       │ │
│  └────────────────┬────────────────┘ └───────┬───────────────┬────────┘ │
│                   │                          │               │          │
│                   ▼                          ▼               ▼          │
│        ┌─────────────────────────────────────────┐  ┌─────────────────┐ │
│        │   SQLAlchemy 2.0 ORM (`models.py`)      │  │ `ai_service.py` │ │
│        │ `User` · `Ticket` · `TicketActivity`    │  │  Google Gemini  │ │
│        └────────────────────┬────────────────────┘  │Structured Output│ │
│                             │                       └─────────────────┘ │
└─────────────────────────────┼───────────────────────────────────────────┘
                              ▼
                   ┌─────────────────────┐
                   │  PostgreSQL 14+ DB  │
                   └─────────────────────┘
```

### Key Architectural Layers

1. **Backend API (`backend/app/`)**
   - **Configuration (`config.py`)**: Centralized environment configuration powered by `pydantic-settings` (`Settings`), loading database credentials, JWT secrets, CORS origins, and Gemini settings from `backend/.env` with zero hardcoded secrets.
   - **Data Layer (`database.py`, `models.py`, `schemas.py`)**:
     - SQLAlchemy 2.0 declarative ORM models (`Mapped` / `mapped_column`) with connection pooling (`pool_pre_ping=True`).
     - Three core relational tables:
       - `users`: Accounts with `email`, `full_name`, `hashed_password` (bcrypt), and `role` (`admin`, `agent`, `reporter`).
       - `tickets`: Engineering issues with `status` (`open`, `triaged`, `in_progress`, `resolved`, `closed`), `priority` (`low`, `medium`, `high`, `critical`), `category` (`bug`, `feature`, `security`, `performance`, `support`, `other`), and AI metadata (`ai_summary`, `ai_suggested_reply`, `ai_confidence`).
       - `ticket_activities`: Immutable audit log recording every ticket creation, field transition, and AI triage event.
     - Strict Pydantic v2 request/response validation (`UserCreate`, `TicketCreate`, `TicketUpdate`, `TicketDetail`, `TicketStats`, `AITriageResult`).
   - **Service Layer (`services/`)**:
     - `auth_service.py`: Bcrypt password hashing with timing-attack equalization and PyJWT (`HS256`) access token issuance/verification.
     - `ai_service.py`: Calls Google Gemini (`google-genai` SDK) using `response_schema=AITriageResult` and `response_mime_type="application/json"` to guarantee schema-valid triage classifications, summaries, suggested replies, and confidence scores.
     - `ticket_service.py`: Encapsulates CRUD operations, wildcard-safe `ILIKE` search, SQL `GROUP BY` KPI aggregation (`/api/tickets/stats`), activity timeline logging, and best-effort auto-triage on ticket creation (gracefully falling back to `open` status if the AI service is unreachable).
   - **API Routers (`routers/auth.py`, `routers/tickets.py`)**: Thin HTTP controllers handling dependency injection (`Depends(get_db)`, `Depends(get_current_user)`) and status codes.

2. **Frontend SPA (`frontend/src/`)**
   - **API Client (`src/api/`)**: Centralized Axios client (`client.js`) that attaches `Authorization: Bearer <token>` headers from `localStorage` and broadcasts a `triageflow:unauthorized` event on `401` responses to reset expired sessions cleanly.
   - **Authentication (`components/AuthPage.jsx`)**: Supports account registration, email/password sign-in, and a **1-Click Demo User Login** (`demo@triageflow.ai`) that automatically provisions the demo account on first use.
   - **Triage Dashboard (`App.jsx`, `StatsCards.jsx`, `FilterBar.jsx`, `TicketList.jsx`)**: Real-time KPI summary cards, interactive status/priority filter pills, custom category selector with live counts, and instant keyword search.
   - **Creation & Inspection (`NewTicketModal.jsx`, `TicketDetailDrawer.jsx`)**: One-click sample scenario templates for testing AI triage, slide-over detail drawer with inline `status`/`priority`/`category` updates, AI confidence meter, one-click copy for suggested responder replies, on-demand **Re-run AI Triage**, and chronological activity audit log.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend API** | Python 3.10+, FastAPI, Pydantic v2, `pydantic-settings`, SQLAlchemy 2.0 |
| **Authentication** | PyJWT (`HS256`), `bcrypt` |
| **AI Engine** | Google Gemini SDK (`google-genai`), Structured Outputs (`AITriageResult`) |
| **Database** | PostgreSQL 14+ (`psycopg2-binary`), SQLite in-memory (for offline unit tests) |
| **Frontend UI** | React 18, Vite 6, Tailwind CSS v4, Axios, Lucide React |
| **Testing** | Pytest, FastAPI `TestClient` |

---

## Project Structure

```text
triageflow-ai/
├── .agent/
│   ├── rules/stack-standards.md     # Engineering standards for backend & frontend
│   └── workflows/add-endpoint.md    # Workflow guide for scaffolding API endpoints
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py              # /api/auth/register, /login, /me
│   │   │   └── tickets.py           # /api/tickets CRUD, /stats, /{id}/triage
│   │   ├── services/
│   │   │   ├── ai_service.py        # Gemini structured output triage client
│   │   │   ├── auth_service.py      # Bcrypt hashing & JWT token management
│   │   │   └── ticket_service.py    # Ticket queries, mutations, and audit logs
│   │   ├── config.py                # Pydantic BaseSettings environment loader
│   │   ├── database.py              # SQLAlchemy 2.0 engine, SessionLocal, Base
│   │   ├── dependencies.py          # HTTPBearer JWT auth dependency
│   │   ├── main.py                  # FastAPI app factory, CORS, lifespan bootstrap
│   │   ├── models.py                # User, Ticket, and TicketActivity ORM models
│   │   └── schemas.py               # Pydantic v2 request/response & AI schemas
│   ├── tests/
│   │   └── test_api.py              # Offline Pytest suite (SQLite + mocked Gemini)
│   ├── .env.example                 # Template for backend environment variables
│   ├── pytest.ini                   # Pytest configuration
│   ├── requirements.txt             # Production & runtime Python dependencies
│   └── requirements-dev.txt         # Development & testing dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                     # Axios instance (client.js), auth.js, tickets.js
│   │   ├── components/              # AuthPage, StatsCards, FilterBar, TicketList,
│   │   │                            # NewTicketModal, TicketDetailDrawer
│   │   ├── constants/ticketMeta.js  # Badge themes, metadata maps, sample templates
│   │   ├── App.jsx                  # Main dashboard container & state orchestration
│   │   ├── index.css                # Tailwind CSS v4 entry stylesheet
│   │   └── main.jsx                 # React DOM root mount
│   ├── index.html                   # HTML shell
│   ├── package.json                 # Node dependencies and Vite scripts
│   └── vite.config.js               # Vite dev server & /api proxy configuration
├── .gitignore                       # Git ignore rules (.env, venv/, node_modules/, etc.)
└── README.md                        # Project documentation
```

---

## Local Setup & Development

### Prerequisites

- **Python** 3.10+ (3.11+ recommended)
- **Node.js** 18+ and **npm**
- **PostgreSQL** 14+ running locally (default database: `triageflow_db`)
- **Google Gemini API Key** (for live AI triage; ticket creation still works offline via graceful fallback)

---

### 1. Backend Setup (`backend/`)

```powershell
cd backend

# 1. Create and activate a Python virtual environment
python -m venv venv
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS / Linux
# source venv/bin/activate

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure environment variables
Copy-Item .env.example .env
# (macOS / Linux: cp .env.example .env)
```

Update `backend/.env` with your local PostgreSQL connection string, a strong JWT secret, and your Gemini API key:

```env
APP_NAME="TriageFlow AI"
ENVIRONMENT="development"
DEBUG=true

DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/triageflow_db"

SECRET_KEY="change-me-in-production-use-a-strong-random-secret"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60

GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-3.5-flash-lite"

CORS_ORIGINS=["http://localhost:5173"]
```

Start the FastAPI development server (database tables are created automatically on startup via `Base.metadata.create_all`):

```powershell
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation is available once the server is running:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/api/health`

---

### 2. Frontend Setup (`frontend/`)

Open a new terminal in the `frontend/` directory:

```powershell
cd frontend

# 1. Install Node.js dependencies
npm install

# 2. Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser. Click **1-Click Demo User Login** on the sign-in screen to automatically provision and sign in with the sandbox account (`demo@triageflow.ai`).

---

### 3. Running Backend Tests

The backend test suite (`backend/tests/test_api.py`) uses an isolated in-memory SQLite database and mocks `ai_service.analyze_ticket` so tests execute fast and completely offline:

```powershell
cd backend
.\venv\Scripts\pytest.exe -v
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check (`{"status": "ok"}`) |
| `POST` | `/api/auth/register` | Public | Register a new user and return a JWT `Token` |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password and return a JWT `Token` |
| `GET` | `/api/auth/me` | Bearer JWT | Return the currently authenticated `UserRead` profile |
| `GET` | `/api/tickets` | Bearer JWT | List tickets with `status`, `priority`, `category`, `search`, `skip`, `limit` |
| `POST` | `/api/tickets` | Bearer JWT | Create a ticket and run best-effort Gemini AI auto-triage |
| `GET` | `/api/tickets/stats` | Bearer JWT | Aggregated counts grouped by `status`, `priority`, and `category` |
| `GET` | `/api/tickets/{id}` | Bearer JWT | Get full ticket details including `activities` audit history |
| `PATCH` | `/api/tickets/{id}` | Bearer JWT | Update ticket fields (`status`, `priority`, `category`, `title`, `description`, `assigned_to_id`) |
| `DELETE` | `/api/tickets/{id}` | Bearer JWT | Permanently delete a ticket (`204 No Content`) |
| `POST` | `/api/tickets/{id}/triage` | Bearer JWT | Run or re-run Gemini AI triage classification on an existing ticket |
