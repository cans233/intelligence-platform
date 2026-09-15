export type BackendReferenceDto = {
  id: string
  code?: string | null
  name: string
}

export type BackendLoginDto = {
  access_token: string
  token_type: string
  user: {
    id: string
    username: string
    email: string | null
    display_name: string
    roles: string[]
  }
}

export type BackendPatentListItemDto = {
  id: string
  family_id: string
  title: string
  publication_number: string
  application_number: string
  country: string
  applicant_names?: string[] | null
  publication_date: string | null
  ipc_codes?: string[] | null
  cpc_codes?: string[] | null
  legal_status: string | null
  status: string
  source_codes?: string[] | null
  updated_at: string
}

export type BackendPatentDetailDto = BackendPatentListItemDto & {
  filing_date: string | null
  priority_date: string | null
  abstract: string | null
  description: string | null
  applicants?: Array<{ id: string; name: string; country: string | null }> | null
  inventors?: Array<{ id: string; name: string; country: string | null }> | null
  classifications?: Array<{ id: string; scheme: string; code: string; raw_code: string | null }> | null
  claims?: Array<{ id: string; claim_no: number; claim_type: string | null; text: string }> | null
  family_members?: Array<{ id: string; publication_id: string; country: string; publication_number: string; publication_date: string | null; legal_status: string | null }> | null
  citations?: {
    references?: BackendCitationDto[] | null
    cited_by?: BackendCitationDto[] | null
  } | null
  legal_events?: Array<{ id: string; event_date: string; event_code: string; event_description: string; legal_status: string | null; source_record_id: string | null }> | null
  sources?: Array<{ id: string; source_code: string; source_record_id: string; fetched_at: string; raw_data: Record<string, unknown> }> | null
  normalized_fields?: Record<string, unknown> | null
  ai_enhancements?: Record<string, unknown> | null
  human_conclusions?: Record<string, unknown> | null
  discovery_path?: string[] | null
  created_at: string
}

export type BackendCitationDto = {
  id: string
  citing_publication_id: string
  citing_publication_number: string | null
  citation_type: string
  cited_publication_number: string | null
  cited_publication_id: string | null
}

export type BackendProjectListItemDto = {
  id: string
  code: string
  name: string
  description: string | null
  status: string
  organization: BackendReferenceDto
  department: BackendReferenceDto | null
  owner: BackendReferenceDto | null
  technologies?: BackendReferenceDto[] | null
  created_at: string
  updated_at: string
}

export type BackendProjectDetailDto = BackendProjectListItemDto & {
  documents?: Array<{ id: string; name: string; file_type: string; status: string; current_version_no: number | null }> | null
  company_patents?: BackendProjectPatentDto[] | null
  external_related_patents?: BackendProjectPatentDto[] | null
}

export type BackendProjectPatentDto = {
  id: string
  publication_number: string
  title: string
  country: string
  relation_type: string
  relevance_score: number | null
  relation_reason: string | null
}
