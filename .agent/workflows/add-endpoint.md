---
description: Scaffold a new FastAPI router endpoint with Pydantic schema, service logic, and OpenAPI docs
---
1. Inspect `@backend/app/models.py` and `@backend/app/schemas.py` to match existing conventions.
2. Create or update the Pydantic request/response schemas in `backend/app/schemas.py`.
3. Implement the database/service logic in `backend/app/services/`.
4. Add the FastAPI route handler with proper HTTP status codes and dependency injection (`Depends(get_db)`).
5. Verify there are no syntax or import errors by running a quick Python import check in the terminal.
