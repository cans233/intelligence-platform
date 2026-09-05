from fastapi import FastAPI
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.db.session import engine


app = FastAPI(title=settings.app_name, version="0.1.0")


@app.get("/api/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/ready", tags=["system"])
def ready() -> dict[str, str]:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ready"}
