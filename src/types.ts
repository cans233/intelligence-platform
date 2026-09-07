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
