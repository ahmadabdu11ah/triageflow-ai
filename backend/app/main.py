from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers ORM models on Base.metadata)
from app.config import settings
from app.database import Base, engine
from app.routers import auth, tickets


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Development bootstrap until Alembic migrations are introduced.
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="AI-assisted issue triage API (FastAPI + PostgreSQL + Gemini).",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(tickets.router)

    @app.get("/api/health", tags=["health"], summary="Health check")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
