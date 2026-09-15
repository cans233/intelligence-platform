from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""


def import_models() -> None:
    """Import model modules so Alembic sees the complete metadata."""
    from backend.app import models  # noqa: F401
