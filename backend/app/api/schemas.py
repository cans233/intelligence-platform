from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrmDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserDto(OrmDto):
    id: UUID
    username: str
    email: str | None
    display_name: str
    roles: list[str] = Field(default_factory=list)


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginDto(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserDto


class ClaimDto(OrmDto):
    id: UUID
    claim_no: int
    claim_type: str | None
    text: str


class SourceRecordDto(OrmDto):
    id: UUID
    source_code: str
    source_record_id: str
    fetched_at: datetime
    raw_data: dict


class FamilyMemberDto(OrmDto):
    id: UUID
    country: str
    publication_number: str
    publication_date: date | None
    legal_status: str | None


class CitationDto(OrmDto):
    id: UUID
    citation_type: str
    cited_publication_number: str | None
    cited_publication_id: UUID | None


class LegalEventDto(OrmDto):
    id: UUID
    event_date: date
    event_code: str
    event_description: str
    legal_status: str | None
    source_record_id: UUID | None


class PatentListItemDto(OrmDto):
    id: UUID
    family_id: str
    application_number: str
    publication_number: str
    country: str
    title: str
    publication_date: date | None
    legal_status: str | None
    status: str


class PatentDetailDto(PatentListItemDto):
    abstract: str | None
    description: str | None
    applicants: list[str]
    inventors: list[str]
    classifications: list[dict]
    claims: list[ClaimDto]
    family: list[FamilyMemberDto]
    citations: list[CitationDto]
    legal_events: list[LegalEventDto]
    sources: list[SourceRecordDto]


class PageDto(BaseModel):
    items: list
    page: int
    page_size: int
    total: int


class ProjectCreate(BaseModel):
    organization_id: UUID
    department_id: UUID | None = None
    owner_id: UUID | None = None
    code: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=256)
    description: str | None = None
    status: str = "ACTIVE"
    classification: str | None = None


class ProjectPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=256)
    description: str | None = None
    status: str | None = None
    department_id: UUID | None = None
    owner_id: UUID | None = None
    classification: str | None = None


class ProjectDto(OrmDto):
    id: UUID
    organization_id: UUID
    department_id: UUID | None
    owner_id: UUID | None
    code: str
    name: str
    description: str | None
    status: str
    classification: str | None


class TechnologyDto(OrmDto):
    id: UUID
    name: str
    domain: str | None
    description: str | None
    lifecycle_stage: str | None
    keywords: str | None


class DocumentCreate(BaseModel):
    name: str
    project_id: UUID | None = None
    file_type: str
    storage_location: str
    confidentiality: str = "INTERNAL"


class DocumentDto(OrmDto):
    id: UUID
    project_id: UUID | None
    uploaded_by: UUID
    name: str
    file_type: str
    storage_location: str
    status: str
    confidentiality: str
    current_version_no: int | None


class DocumentVersionDto(OrmDto):
    id: UUID
    document_id: UUID
    version_no: int
    file_type: str
    storage_location: str
    checksum: str | None
    file_size_bytes: int | None
    uploaded_by: UUID
    parse_status: str
    parse_error: str | None


class JobDto(OrmDto):
    id: UUID
    job_type: str
    entity_type: str | None
    entity_id: str | None
    source_code: str | None
    status: str
    attempt: int
    max_attempts: int
    trace_id: UUID
    error_code: str | None
    error_message: str | None
