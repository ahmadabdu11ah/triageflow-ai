# TriageFlow AI

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://triageflow-ai.vercel.app/)
[![Live API Docs](https://img.shields.io/badge/API_Docs-Swagger_UI-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://triageflow-ai-hgns.onrender.com/docs)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

A full-stack **AI-Assisted Engineering Issue Triage Application** built with **FastAPI**, **PostgreSQL**, **Google Gemini**, and **React (Vite + Tailwind CSS v4)**. TriageFlow AI streamlines engineering operations by capturing incoming bug reports and feature requests, automatically classifying category and priority with structured LLM outputs, generating executive summaries and responder replies, and tracking full ticket lifecycle history.

---

## Live Deployment & Demo Access

| Resource | URL |
| :--- | :--- |
| **Live Web App (Vercel)** | [**https://triageflow-ai.vercel.app/**](https://triageflow-ai.vercel.app/) |
| **Live Interactive API Docs (Render)** | [**https://triageflow-ai-hgns.onrender.com/docs**](https://triageflow-ai-hgns.onrender.com/docs) |
| **Health Check Endpoint** | [**https://triageflow-ai-hgns.onrender.com/api/health**](https://triageflow-ai-hgns.onrender.com/api/health) |

### Instant Demo Login Instructions

You can explore the live application immediately without manual registration:

1. Open the [**Live Demo**](https://triageflow-ai.vercel.app/).
2. Click the **1-Click Demo User Login** button on the sign-in screen (it automatically provisions and authenticates the sandbox account if needed), **or** sign in manually with:
   - **Email:** `demo@triageflow.ai`
   - **Password:** `DemoPassword123!`
3. Create a new ticket (or pick one of the built-in **1-Click Sample Scenario Templates** in the *New Ticket* modal) to watch Google Gemini classify priority/category, compute a confidence score, and draft a responder reply in real time.

> **Note (Render Free Tier Cold Start):** The backend API runs on Render's free tier, which spins down after 15 minutes of inactivity. Your first login or API request after an idle period may take **30–50 seconds** while the container wakes up; subsequent requests respond immediately.

---

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                React 18 + Vite 6 + Tailwind v4 (Vercel)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │   AuthPage   │  │  StatsCards  │  │  FilterBar & │  │TicketDetail │  │
│  │ (JWT + Demo) │  │ (Live KPIs)  │  │  TicketList  │  │   Drawer    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘  │
│         └─────────────────┴────────┬────────┴─────────────────┘         │
│                                    ▼                                    │
│                   Axios API Client (`src/api/client.js`)                │
│             (Bearer JWT Request Interceptor & 401 Handler)              │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / JSON (`VITE_API_URL`)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FastAPI Application (Render)                        │
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

### Key Architectural Highlights

1. **Structured LLM Triage Engine (`backend/app/services/ai_service.py`)**
   - Uses the official `google-genai` SDK with `response_schema=AITriageResult` and `response_mime_type="application/json"` to guarantee schema-valid classifications (`category`, `priority`, `summary`, `suggested_reply`, and `confidence` score between `0.0` and `1.0`).
   - **Graceful Degradation**: If the AI provider is temporarily unreachable or rate-limited during ticket creation, `ticket_service.py` still persists the ticket in `open` status so user submissions are never lost, allowing engineers to trigger **Re-run AI Triage** on demand.

2. **Clean Layered Backend (`backend/app/`)**
   - **Configuration (`config.py`)**: Centralized `pydantic-settings` loader supporting `ALLOWED_ORIGINS` (comma-separated or JSON array) and automatic normalization of Render `postgres://` / `postgresql://` URLs to `postgresql+psycopg2://`.
   - **Data Layer (`database.py`, `models.py`, `schemas.py`)**: SQLAlchemy 2.0 declarative ORM models (`Mapped` / `mapped_column`) with connection health checks (`pool_pre_ping=True`) across three relational tables: `users`, `tickets`, and immutable `ticket_activities` audit logs.
   - **Security (`auth_service.py`, `dependencies.py`)**: Bcrypt password hashing with timing-attack equalization (`_DUMMY_BCRYPT_HASH`) and stateless `HS256` JWT Bearer authentication.
   - **SQL KPI Aggregation (`ticket_service.py`)**: Computes real-time counts by status, priority, and category via SQL `GROUP BY` queries and wildcard-safe `ILIKE` search.

3. **Responsive React 18 + Tailwind v4 Frontend (`frontend/src/`)**
   - **Centralized API Layer (`src/api/client.js`)**: Configured via `import.meta.env.VITE_API_URL`, automatically attaching JWT Bearer tokens from `sessionStorage` and dispatching a `triageflow:unauthorized` event on `401` responses.
   - **Interactive Triage Workspace (`App.jsx`, `StatsCards.jsx`, `FilterBar.jsx`, `TicketList.jsx`, `TicketDetailDrawer.jsx`)**: Live KPI cards, instant filter pills, slide-over detail drawer with inline status/priority/category editing, AI confidence meter, one-click reply copy, and full activity timeline.
   - **Cloud-Ready SPA Routing (`frontend/vercel.json`)**: Configured with catch-all rewrites to `/index.html` for seamless page refreshes on Vercel.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn / Gunicorn, Pydantic v2, `pydantic-settings`, SQLAlchemy 2.0 |
| **Authentication** | PyJWT (`HS256`), `bcrypt` |
| **AI Engine** | Google Gemini SDK (`google-genai`), Structured Outputs (`AITriageResult`) |
| **Database** | PostgreSQL 14+ (`psycopg2-binary`), SQLite in-memory (for offline unit tests) |
| **Frontend UI** | React 18, Vite 6, Tailwind CSS v4, Axios, Lucide React |
| **Cloud Hosting** | Vercel (Frontend SPA), Render (FastAPI Web Service & Managed PostgreSQL) |
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
│   ├── .env.example                 # Template for frontend VITE_API_URL variable
│   ├── index.html                   # HTML shell
│   ├── package.json                 # Node dependencies and Vite scripts
│   ├── vercel.json                  # Vercel SPA rewrite configuration
│   └── vite.config.js               # Vite dev server & /api proxy configuration
├── .gitignore                       # Git ignore rules (.env, venv/, node_modules/, etc.)
├── render.yaml                      # Render Blueprint for backend & PostgreSQL
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

ALLOWED_ORIGINS="http://localhost:5173,https://triageflow-ai.vercel.app"
```

Start the FastAPI development server (database tables are created automatically on startup via `Base.metadata.create_all`):

```powershell
uvicorn app.main:app --reload --port 8000
```

Interactive local API documentation:
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

# 2. (Optional) Configure custom API URL
Copy-Item .env.example .env

# 3. Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser and click **1-Click Demo User Login** to sign in with the sandbox account (`demo@triageflow.ai`).

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
