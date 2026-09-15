from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Protocol


@dataclass(frozen=True)
class SearchPage:
    items: list[dict[str, Any]]
    next_cursor: str | None = None
    total: int | None = None


@dataclass(frozen=True)
class RawPatentRecord:
    source_code: str
    external_id: str
    payload: dict[str, Any]
    fetched_at: datetime


@dataclass(frozen=True)
class RawPatentContent:
    source_code: str
    external_id: str
    content_type: str
    location: str
    checksum: str | None = None


@dataclass(frozen=True)
class FamilyData:
    source_code: str
    external_id: str
    members: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class LegalEventData:
    event_date: datetime
    event_code: str
    event_description: str
    legal_status: str | None = None


@dataclass(frozen=True)
class SourceHealth:
    source_code: str
    healthy: bool
    checked_at: datetime
    message: str | None = None


class PatentSourceAdapter(Protocol):
    source_code: str

    def search(self, query: dict[str, Any], cursor: str | None = None) -> SearchPage:
        ...

    def fetch_record(self, external_id: str) -> RawPatentRecord:
        ...

    def fetch_fulltext(self, external_id: str) -> RawPatentContent | None:
        ...

    def fetch_family(self, external_id: str) -> FamilyData:
        ...

    def fetch_legal_events(self, external_id: str) -> list[LegalEventData]:
        ...

    def health_check(self) -> SourceHealth:
        ...
