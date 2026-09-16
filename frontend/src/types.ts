export type RecordQuality = 'VERIFIED' | 'NORMALIZED' | 'CONFLICT' | 'PENDING'
export type DataCategory = 'OFFICIAL' | 'NORMALIZED' | 'AI' | 'HUMAN'

export type SearchEntityType = 'patent' | 'project' | 'technology' | 'document'
export type SearchSort = 'relevance' | 'updated_desc' | 'updated_asc'

export type InternalSearchQueryDto = {
  keyword: string
  types: SearchEntityType[]
  date_from?: string
  date_to?: string
  applicant?: string
  ipc_codes: string[]
  cpc_codes: string[]
  countries: string[]
  project_ids: string[]
  technology_tags: string[]
  sort: SearchSort
  page: number
  page_size: number
}

export type SearchHighlightDto = {
  field: string
  segments: Array<{ text: string; highlighted: boolean }>
}

export type InternalSearchResultDto = {
  id: string
  type: SearchEntityType
  title: string
  snippet: string
  highlights: SearchHighlightDto[]
  hit_reasons: string[]
  source: string[]
  updated_at: string
  publication_number?: string
  applicant?: string
  publication_date?: string
  ipc_codes?: string[]
  cpc_codes?: string[]
}

export type SaveInternalSearchDto = {
  name: string
  query: InternalSearchQueryDto
}

export type SavedInternalSearch = SaveInternalSearchDto & {
  id: string
  created_at: string
}

export type PatentClaim = { claim_no: number; claim_type: string; text: string }
export type PatentFamilyMember = { id: string; country: string; publication_number: string; publication_date: string; legal_status: string }
export type PatentCitation = { id: string; direction: '引用' | '被引用'; publication_number: string; title: string }
export type PatentLegalEvent = { id: string; date: string; event: string; source: string }
export type PatentSourceRecord = { source: string; source_record_id: string; fetched_at: string; status: string }
export type ProjectLink = { id: string; code: string; name: string; relation: string }

export type PatentOfficialFacts = {
  publication_number: string
  application_number: string
  country: string
  applicant_names: string[]
  inventor_names: string[]
  publication_date: string
  filing_date: string
  priority_date: string
  ipc_codes: string[]
  cpc_codes: string[]
  legal_status: string
  abstract: string
  claims: PatentClaim[]
  family_members: PatentFamilyMember[]
  citations: PatentCitation[]
  legal_events: PatentLegalEvent[]
}

export type MockPatentDetail = {
  id: string
  title: string
  ownership: 'COMPANY' | 'EXTERNAL'
  record_quality: RecordQuality
  official_facts: PatentOfficialFacts
  normalized_fields: Array<{ label: string; value: string; source: string[] }>
  ai_enhancements: { keywords: string[]; technical_problem: string; technical_effect: string }
  human_conclusions: { notes: string[]; project_links: ProjectLink[] }
  sources: PatentSourceRecord[]
  discovery_path: string[]
  updated_at: string
}

export type MockPatentListItem = PatentListItemViewModel & {
  applicant: string
  record_quality: RecordQuality
  ownership: MockPatentDetail['ownership']
}

export type PatentListItemViewModel = {
  id: string
  title: string
  publication_number: string
  application_number: string
  country: string
  applicant_names: string[]
  publication_date: string
  ipc_codes: string[]
  cpc_codes: string[]
  legal_status: string
  status: string
  source_codes: string[]
  updated_at: string
}

export type PatentDetailViewModel = {
  id: string
  title: string
  official_facts: PatentOfficialFacts
  normalized_fields: Array<{ label: string; value: string; source: string[] }>
  ai_enhancements: { keywords: string[]; technical_problem: string; technical_effect: string }
  human_conclusions: { notes: string[]; project_links: ProjectLink[] }
  sources: Array<{ source: string; source_record_id: string; fetched_at: string }>
  discovery_path: string[]
  status: string
  source_codes: string[]
  updated_at: string
}

export type PatentListQueryDto = {
  keyword?: string
  country?: string
  page?: number
  page_size?: number
}

export type TechnologyDto = {
  id: string
  name: string
  domain: string
  stage: string
  owner: string
  description: string
  keywords: string[]
  project_ids: string[]
  updated_at: string
}

export type DocumentDto = {
  id: string
  name: string
  file_type: 'DOCX' | 'PDF' | 'XLSX'
  project_id: string
  project_name: string
  version: string
  owner: string
  updated_at: string
  status: '已解析' | '解析中' | '解析失败'
  summary: string
}

export type MockProjectPatentRelation = MockPatentListItem & { relevance: '高' | '中' | '低'; relation_reason: string }

export type ProjectTechnologyViewModel = { id: string; code?: string; name: string }
export type ProjectDocumentViewModel = { id: string; name: string; file_type: string; status: string; current_version_no?: number }
export type ProjectPatentRelationViewModel = { id: string; publication_number: string; title: string; country: string; relation_type: string; relevance_score?: number; relation_reason?: string }

export type ProjectListItemViewModel = {
  id: string
  code: string
  name: string
  organization: string
  department: string
  owner: string
  status: string
  description: string
  technologies: ProjectTechnologyViewModel[]
  created_at: string
  updated_at: string
}

export type ProjectDetailViewModel = ProjectListItemViewModel & {
  documents: ProjectDocumentViewModel[]
  company_patents: ProjectPatentRelationViewModel[]
  external_related_patents: ProjectPatentRelationViewModel[]
}

export type MockProjectDetail = {
  id: string
  code: string
  name: string
  organization: string
  department: string
  owner: string
  stage: string
  status: '进行中' | '观察中' | '已归档'
  updated_at: string
  description: string
  technologies: TechnologyDto[]
  documents: DocumentDto[]
  company_patents: MockProjectPatentRelation[]
  external_related_patents: MockProjectPatentRelation[]
  member_count: number
  risk: '低' | '中' | '高'
}

export type MonitoringStatus = 'ACTIVE' | 'PAUSED' | 'RUNNING' | 'FAILED'

export type MonitoringProfileDto = {
  id: string
  name: string
  status: MonitoringStatus
  query: string
  countries: string[]
  sources: string[]
  schedule: string
  last_run_at: string
  next_run_at: string
  candidate_count: number
  new_record_count: number
  duplicate_count: number
  failure_count: number
}

export type CreateMonitoringProfileDto = Pick<MonitoringProfileDto, 'name' | 'query' | 'countries' | 'sources' | 'schedule'>
export type MonitoringRunDto = { id: string; profile_id: string; status: 'SUCCEEDED' | 'RUNNING' | 'FAILED'; started_at: string; finished_at?: string; candidate_count: number; new_record_count: number; duplicate_count: number; failure_count: number }
export type ReviewItemDto = { id: string; type: string; target: string; detail: string; priority: '高' | '中' | '低'; owner: string; status: '待处理' | '处理中'; created_at: string }
export type DataSourceStatusDto = { code: string; label: string; status: '正常' | '限流' | '异常'; last_sync_at: string; success_rate: number }
export type JobRecordDto = { id: string; type: string; source: string; status: '成功' | '运行中' | '失败'; started_at: string; summary: string }
export type AdminUserDto = { id: string; name: string; role: string; data_scope: string; status: '启用' | '停用' }
