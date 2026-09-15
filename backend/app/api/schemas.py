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
    access_token: str
    token_type: str = "bearer"
    user: UserDto
    token: str | None = None


class ClaimDto(OrmDto):
    id: UUID
    claim_no: int
    claim_type: str | None
    text: str


class PersonDto(BaseModel):
    id: UUID
    name: str
    country: str | None = None


class ClassificationDto(OrmDto):
    id: UUID
    scheme: str
    code: str
    raw_code: str | None


class SourceRecordDto(OrmDto):
    id: UUID
    source_code: str
    source_record_id: str
    fetched_at: datetime
    raw_data: dict


class FamilyMemberDto(OrmDto):
    id: UUID
    publication_id: UUID
    country: str
    publication_number: str
    publication_date: date | None
    legal_status: str | None


class CitationDto(OrmDto):
    id: UUID
    citing_publication_id: UUID
    citing_publication_number: str | None = None
    citation_type: str
    cited_publication_number: str | None
    cited_publication_id: UUID | None


class CitationDirectionsDto(BaseModel):
    references: list[CitationDto] = Field(default_factory=list)
    cited_by: list[CitationDto] = Field(default_factory=list)


class LegalEventDto(OrmDto):
    id: UUID
    event_date: date
    event_code: str
    event_description: str
    legal_status: str | None
    source_record_id: UUID | None


class PatentListItemDto(BaseModel):
    id: UUID
    family_id: str
    title: str
    publication_number: str
    application_number: str
    country: str
    applicant_names: list[str] = Field(default_factory=list)
    publication_date: date | None
    ipc_codes: list[str] = Field(default_factory=list)
    cpc_codes: list[str] = Field(default_factory=list)
    legal_status: str | None
    status: str
    source_codes: list[str] = Field(default_factory=list)
    updated_at: datetime


class PatentDetailDto(PatentListItemDto):
    filing_date: date | None
    priority_date: date | None
    abstract: str | None
    description: str | None
    applicants: list[PersonDto] = Field(default_factory=list)
    inventors: list[PersonDto] = Field(default_factory=list)
    classifications: list[ClassificationDto] = Field(default_factory=list)
    claims: list[ClaimDto] = Field(default_factory=list)
    family_members: list[FamilyMemberDto] = Field(default_factory=list)
    citations: CitationDirectionsDto = Field(default_factory=CitationDirectionsDto)
    legal_events: list[LegalEventDto] = Field(default_factory=list)
    sources: list[SourceRecordDto] = Field(default_factory=list)
    normalized_fields: dict = Field(default_factory=dict)
    ai_enhancements: dict = Field(default_factory=dict)
    human_conclusions: dict = Field(default_factory=dict)
    discovery_path: list[str] = Field(default_factory=list)
    created_at: datetime


class PageDto(BaseModel):
    items: list
    page: int
    page_size: int
    total: int


class ReferenceDto(BaseModel):
    id: UUID
    code: str | None = None
    name: str


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


class ProjectListItemDto(BaseModel):
    id: UUID
    code: str
    name: str
    description: str | None
    status: str
    organization: ReferenceDto
    department: ReferenceDto | None
    owner: ReferenceDto | None
    technologies: list[ReferenceDto] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ProjectPatentDto(BaseModel):
    id: UUID
    publication_number: str
    title: str
    country: str
    relation_type: str
    relevance_score: int | None = None
    relation_reason: str | None = None


class ProjectDocumentDto(BaseModel):
    id: UUID
    name: str
    file_type: str
    status: str
    current_version_no: int | None


class ProjectDetailDto(ProjectListItemDto):
    documents: list[ProjectDocumentDto] = Field(default_factory=list)
    company_patents: list[ProjectPatentDto] = Field(default_factory=list)
    external_related_patents: list[ProjectPatentDto] = Field(default_factory=list)


class TechnologyListItemDto(BaseModel):
    id: UUID
    name: str
    domain: str | None
    description: str | None
    lifecycle_stage: str | None
    keywords: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class TechnologyDetailDto(TechnologyListItemDto):
    projects: list[ReferenceDto] = Field(default_factory=list)
    patents: list[ProjectPatentDto] = Field(default_factory=list)


class DocumentCreate(BaseModel):
    name: str
    project_id: UUID | None = None
    file_type: str
    storage_location: str
    confidentiality: str = "INTERNAL"


class DocumentListItemDto(BaseModel):
    id: UUID
    name: str
    project: ReferenceDto | None
    uploaded_by: ReferenceDto
    file_type: str
    storage_location: str
    status: str
    confidentiality: str
    current_version_no: int | None
    created_at: datetime
    updated_at: datetime


class DocumentVersionDto(BaseModel):
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
    created_at: datetime


class DocumentDetailDto(DocumentListItemDto):
    versions: list[DocumentVersionDto] = Field(default_factory=list)


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
