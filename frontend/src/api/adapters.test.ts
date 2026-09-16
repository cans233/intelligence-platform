import { describe, expect, it } from 'vitest'
import { mapPatentDetailDtoToViewModel, mapPatentListDtoToViewModel } from './patent'
import { mapProjectDetailDtoToViewModel, mapProjectListDtoToViewModel } from './project'
import type { BackendPatentDetailDto, BackendPatentListItemDto, BackendProjectDetailDto } from './contracts'

const patentListDto: BackendPatentListItemDto = {
  id: 'patent-1',
  family_id: 'family-1',
  title: '测试专利',
  publication_number: 'CN100A',
  application_number: 'CN100',
  country: 'CN',
  applicant_names: null,
  publication_date: null,
  ipc_codes: undefined,
  cpc_codes: null,
  legal_status: null,
  status: 'PUBLISHED',
  source_codes: undefined,
  updated_at: '2026-09-15T00:00:00Z',
}

const patentDetailDto: BackendPatentDetailDto = {
  ...patentListDto,
  applicant_names: ['申请人甲'],
  ipc_codes: ['H01L'],
  cpc_codes: ['H01L1/00'],
  source_codes: ['CNIPA'],
  filing_date: '2025-01-01',
  priority_date: '2024-12-01',
  abstract: '摘要',
  description: null,
  applicants: [{ id: 'person-1', name: '申请人甲', country: 'CN' }],
  inventors: [{ id: 'person-2', name: '发明人乙', country: 'CN' }],
  classifications: [],
  claims: [{ id: 'claim-1', claim_no: 1, claim_type: 'INDEPENDENT', text: '权利要求一' }],
  family_members: [{ id: 'family-member-1', publication_id: 'patent-2', country: 'US', publication_number: 'US100A', publication_date: null, legal_status: null }],
  citations: {
    references: [{ id: 'citation-1', citing_publication_id: 'patent-1', citing_publication_number: 'CN100A', citation_type: 'APPLICANT', cited_publication_number: null, cited_publication_id: 'patent-2' }],
    cited_by: [{ id: 'citation-2', citing_publication_id: 'patent-3', citing_publication_number: 'CN101A', citation_type: 'EXAMINER', cited_publication_number: 'CN100A', cited_publication_id: 'patent-1' }],
  },
  legal_events: [{ id: 'event-1', event_date: '2026-01-01', event_code: 'PUB', event_description: '公开', legal_status: 'PENDING', source_record_id: null }],
  sources: [{ id: 'source-1', source_code: 'CNIPA', source_record_id: 'CNIPA-CN100A', fetched_at: '2026-09-15T00:00:00Z', raw_data: { secret_fact: true } }],
  normalized_fields: {},
  ai_enhancements: {},
  human_conclusions: {},
  discovery_path: ['外部监控'],
  created_at: '2026-09-15T00:00:00Z',
}

const projectDetailDto: BackendProjectDetailDto = {
  id: 'project-1',
  code: 'PRJ-1',
  name: '测试项目',
  description: null,
  status: 'ACTIVE',
  organization: { id: 'org-1', code: 'ORG', name: '研发中心' },
  department: null,
  owner: null,
  technologies: null,
  documents: [],
  company_patents: [],
  external_related_patents: [],
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
}

describe('Phase 2 API adapters', () => {
  it('normalizes nullable patent list arrays', () => {
    expect(mapPatentListDtoToViewModel(patentListDto)).toMatchObject({
      applicant_names: [],
      ipc_codes: [],
      cpc_codes: [],
      source_codes: [],
      publication_date: '',
      legal_status: '',
    })
  })

  it('maps patent facts without exposing raw source evidence', () => {
    const patent = mapPatentDetailDtoToViewModel(patentDetailDto)

    expect(patent.official_facts.claims[0].claim_type).toBe('独立')
    expect(patent.official_facts.citations.map((item) => item.direction)).toEqual(['引用', '被引用'])
    expect(patent.official_facts.citations[0].publication_number).toBe('US100A')
    expect(patent.official_facts.family_members[0].publication_date).toBe('')
    expect(patent.sources[0]).toEqual({ source: 'CNIPA', source_record_id: 'CNIPA-CN100A', fetched_at: '2026-09-15T00:00:00Z' })
    expect(patent.sources[0]).not.toHaveProperty('raw_data')
    expect(patent.normalized_fields).toEqual([])
    expect(patent.ai_enhancements.keywords).toEqual([])
    expect(patent.human_conclusions.notes).toEqual([])
    expect(patent.discovery_path).toEqual(['外部监控'])
  })

  it('localizes project references and preserves empty relation arrays', () => {
    expect(mapProjectListDtoToViewModel(projectDetailDto)).toMatchObject({ organization: '研发中心', department: '', owner: '', status: '进行中', technologies: [] })
    expect(mapProjectDetailDtoToViewModel(projectDetailDto)).toMatchObject({ documents: [], company_patents: [], external_related_patents: [] })
  })

  it('keeps unknown project statuses unchanged', () => {
    expect(mapProjectListDtoToViewModel({ ...projectDetailDto, status: 'ON_HOLD' }).status).toBe('ON_HOLD')
  })
})
