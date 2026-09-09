export type Confidence = 'OFFICIAL' | 'NORMALIZED' | 'CONFLICT' | 'PENDING' | 'AI'

export type Patent = {
  id: string
  title: string
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
  source_codes: string[]
  confidence: Confidence
  hit_reasons: string[]
  discovery_path: string
  relevance: '高' | '中' | '低'
  claims: { claim_no: number; claim_type: '独立' | '从属'; text: string }[]
}

export type Project = {
  id: string
  code: string
  name: string
  owner: string
  stage: string
  status: '进行中' | '观察中' | '已归档'
  updated_at: string
  description: string
  technologies: string[]
  patent_ids: string[]
  document_ids: string[]
  member_count: number
  risk: '低' | '中' | '高'
}

export type KnowledgeDocument = {
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

export type Technology = {
  id: string
  name: string
  domain: string
  stage: string
  owner: string
  description: string
  keywords: string[]
  updated_at: string
}

export type SearchKind = 'patent' | 'project' | 'technology' | 'document'

export type SearchResult = {
  id: string
  kind: SearchKind
  title: string
  subtitle: string
  excerpt: string
  href: string
  updated_at: string
  tags: string[]
  hit_reasons: string[]
  confidence?: Confidence
  discovery_path?: string
}
