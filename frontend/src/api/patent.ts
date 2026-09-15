import { patentListItems, patents } from '../mocks'
import type { MockPatentDetail, PatentDetailViewModel, PatentListItemViewModel, PatentListQueryDto, ProjectLink } from '../types'
import { apiRequest, type PageResult } from './client'
import type { BackendCitationDto, BackendPatentDetailDto, BackendPatentListItemDto } from './contracts'

const stringArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
const text = (value: unknown) => typeof value === 'string' ? value : ''

function mapCitation(item: BackendCitationDto, direction: '引用' | '被引用', publicationNumbersById: Map<string, string>) {
  const publicationId = direction === '引用' ? item.cited_publication_id : item.citing_publication_id
  return {
    id: item.id,
    direction,
    publication_number: text(direction === '引用' ? item.cited_publication_number : item.citing_publication_number) || publicationNumbersById.get(publicationId ?? '') || '暂无',
    title: '暂无',
  }
}

function mapNormalizedFields(value: Record<string, unknown> | null | undefined) {
  if (!value) return []
  return Object.entries(value).flatMap(([label, raw]) => {
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const field = raw as Record<string, unknown>
      const fieldValue = text(field.value)
      return fieldValue ? [{ label: text(field.label) || label, value: fieldValue, source: stringArray(field.source) }] : []
    }
    return typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean'
      ? [{ label, value: String(raw), source: [] }]
      : []
  })
}

function mapProjectLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== 'object') return []
    const item = raw as Record<string, unknown>
    const id = text(item.id)
    const name = text(item.name)
    return id && name ? [{ id, code: text(item.code), name, relation: text(item.relation) }] : []
  })
}

export function mapPatentListDtoToViewModel(item: BackendPatentListItemDto): PatentListItemViewModel {
  return {
    id: item.id,
    title: item.title,
    publication_number: item.publication_number,
    application_number: item.application_number,
    country: item.country,
    applicant_names: stringArray(item.applicant_names),
    publication_date: text(item.publication_date),
    ipc_codes: stringArray(item.ipc_codes),
    cpc_codes: stringArray(item.cpc_codes),
    legal_status: text(item.legal_status),
    status: item.status,
    source_codes: stringArray(item.source_codes),
    updated_at: item.updated_at,
  }
}

export function mapPatentDetailDtoToViewModel(item: BackendPatentDetailDto): PatentDetailViewModel {
  const listItem = mapPatentListDtoToViewModel(item)
  const applicants = Array.isArray(item.applicants) ? item.applicants.map((value) => value.name).filter(Boolean) : listItem.applicant_names
  const inventors = Array.isArray(item.inventors) ? item.inventors.map((value) => value.name).filter(Boolean) : []
  const classifications = Array.isArray(item.classifications) ? item.classifications : []
  const references = Array.isArray(item.citations?.references) ? item.citations.references : []
  const citedBy = Array.isArray(item.citations?.cited_by) ? item.citations.cited_by : []
  const familyMembers = Array.isArray(item.family_members) ? item.family_members : []
  const publicationNumbersById = new Map(familyMembers.map((member) => [member.publication_id, member.publication_number]))
  const ai = item.ai_enhancements ?? {}
  const human = item.human_conclusions ?? {}

  return {
    id: item.id,
    title: item.title,
    official_facts: {
      publication_number: item.publication_number,
      application_number: item.application_number,
      country: item.country,
      applicant_names: applicants,
      inventor_names: inventors,
      publication_date: text(item.publication_date),
      filing_date: text(item.filing_date),
      priority_date: text(item.priority_date),
      ipc_codes: stringArray(item.ipc_codes).length ? stringArray(item.ipc_codes) : classifications.filter((value) => value.scheme.toUpperCase() === 'IPC').map((value) => value.code),
      cpc_codes: stringArray(item.cpc_codes).length ? stringArray(item.cpc_codes) : classifications.filter((value) => value.scheme.toUpperCase() === 'CPC').map((value) => value.code),
      legal_status: text(item.legal_status),
      abstract: text(item.abstract),
      claims: (Array.isArray(item.claims) ? item.claims : []).map((claim) => ({
        claim_no: claim.claim_no,
        claim_type: claim.claim_type?.toUpperCase() === 'INDEPENDENT' ? '独立' : claim.claim_type?.toUpperCase() === 'DEPENDENT' ? '从属' : text(claim.claim_type) || '暂无',
        text: claim.text,
      })),
      family_members: familyMembers.map((member) => ({
        id: member.id,
        country: member.country,
        publication_number: member.publication_number,
        publication_date: text(member.publication_date),
        legal_status: text(member.legal_status),
      })),
      citations: [...references.map((citation) => mapCitation(citation, '引用', publicationNumbersById)), ...citedBy.map((citation) => mapCitation(citation, '被引用', publicationNumbersById))],
      legal_events: (Array.isArray(item.legal_events) ? item.legal_events : []).map((event) => ({
        id: event.id,
        date: event.event_date,
        event: event.event_description,
        source: [event.event_code, event.legal_status].filter(Boolean).join(' · '),
      })),
    },
    normalized_fields: mapNormalizedFields(item.normalized_fields),
    ai_enhancements: {
      keywords: stringArray(ai.keywords),
      technical_problem: text(ai.technical_problem),
      technical_effect: text(ai.technical_effect),
    },
    human_conclusions: {
      notes: stringArray(human.notes),
      project_links: mapProjectLinks(human.project_links),
    },
    sources: (Array.isArray(item.sources) ? item.sources : []).map((source) => ({ source: source.source_code, source_record_id: source.source_record_id, fetched_at: source.fetched_at })),
    discovery_path: stringArray(item.discovery_path),
    status: listItem.status,
    source_codes: listItem.source_codes,
    updated_at: listItem.updated_at,
  }
}

function mapMockPatentDetail(item: MockPatentDetail): PatentDetailViewModel {
  const listItem = patentListItems.find((value) => value.id === item.id)
  return {
    id: item.id,
    title: item.title,
    official_facts: item.official_facts,
    normalized_fields: item.normalized_fields,
    ai_enhancements: item.ai_enhancements,
    human_conclusions: item.human_conclusions,
    sources: item.sources.map(({ source, source_record_id, fetched_at }) => ({ source, source_record_id, fetched_at })),
    discovery_path: item.discovery_path,
    status: listItem?.status ?? item.record_quality,
    source_codes: listItem?.source_codes ?? [],
    updated_at: item.updated_at,
  }
}

export const patentApi = {
  list(query: PatentListQueryDto = {}) {
    const params = new URLSearchParams()
    if (query.keyword) params.set('keyword', query.keyword)
    if (query.country) params.set('country', query.country)
    if (query.page) params.set('page', String(query.page))
    if (query.page_size) params.set('page_size', String(query.page_size))
    const suffix = params.size ? `?${params}` : ''
    return apiRequest<PageResult<PatentListItemViewModel>, PageResult<BackendPatentListItemDto>>(`/patents${suffix}`, { method: 'GET' }, () => {
      const keyword = query.keyword?.toLowerCase()
      const items = patentListItems.filter((item) => (!keyword || [item.title, item.publication_number, item.application_number, ...item.applicant_names].join(' ').toLowerCase().includes(keyword)) && (!query.country || item.country === query.country))
      const page = query.page ?? 1
      const pageSize = query.page_size ?? 20
      return { items: items.slice((page - 1) * pageSize, page * pageSize), page, page_size: pageSize, total: items.length }
    }, (data) => ({ ...data, items: (Array.isArray(data.items) ? data.items : []).map(mapPatentListDtoToViewModel) }))
  },
  get(id: string) {
    return apiRequest<PatentDetailViewModel, BackendPatentDetailDto>(`/patents/${encodeURIComponent(id)}`, { method: 'GET' }, () => {
      const patent = patents.find((item) => item.id === id)
      if (!patent) throw new Error('PATENT_NOT_FOUND')
      return mapMockPatentDetail(patent)
    }, mapPatentDetailDtoToViewModel)
  },
}
