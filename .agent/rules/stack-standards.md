# TriageFlow AI Engineering Standards

## Backend (Python / FastAPI / PostgreSQL)
- Always use Python 3.11+ type hints on all functions and route handlers.
- Use SQLAlchemy 2.0 style (`Mapped`, `mapped_column`) and PostgreSQL-compatible types.
- Validate all request payloads and LLM outputs with Pydantic v2 `BaseModel`.
- Keep business logic and Gemini AI calls inside `app/services/`, never directly inside route handlers.
- Never hardcode secrets; always load from environment variables via `pydantic-settings`.

## Frontend (React / Tailwind)
- Use functional React components with hooks and Tailwind CSS utility classes only.
- Centralize all API requests in `src/api/` using an Axios instance with JWT interceptors.
- Always handle loading, empty, and error states cleanly in the UI.
