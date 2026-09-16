import { projects } from '../mocks'
import type { MockProjectDetail, ProjectDetailViewModel, ProjectListItemViewModel } from '../types'
import { apiRequest, type PageResult } from './client'
import type { BackendProjectDetailDto, BackendProjectListItemDto, BackendProjectPatentDto } from './contracts'

const projectStatus: Record<string, string> = { ACTIVE: '进行中', OBSERVING: '观察中', ARCHIVED: '已归档' }
const text = (value: string | null | undefined) => value ?? ''

function mapProjectPatent(item: BackendProjectPatentDto) {
  return {
    id: item.id,
    publication_number: item.publication_number,
    title: item.title,
    country: item.country,
    relation_type: item.relation_type,
    relevance_score: item.relevance_score ?? undefined,
    relation_reason: item.relation_reason ?? undefined,
  }
}

export function mapProjectListDtoToViewModel(item: BackendProjectListItemDto): ProjectListItemViewModel {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    organization: item.organization.name,
    department: item.department?.name ?? '',
    owner: item.owner?.name ?? '',
    status: projectStatus[item.status] ?? item.status,
    description: text(item.description),
    technologies: (Array.isArray(item.technologies) ? item.technologies : []).map((technology) => ({ id: technology.id, code: technology.code ?? undefined, name: technology.name })),
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

export function mapProjectDetailDtoToViewModel(item: BackendProjectDetailDto): ProjectDetailViewModel {
  return {
    ...mapProjectListDtoToViewModel(item),
    documents: (Array.isArray(item.documents) ? item.documents : []).map((document) => ({
      id: document.id,
      name: document.name,
      file_type: document.file_type,
      status: document.status,
      current_version_no: document.current_version_no ?? undefined,
    })),
    company_patents: (Array.isArray(item.company_patents) ? item.company_patents : []).map(mapProjectPatent),
    external_related_patents: (Array.isArray(item.external_related_patents) ? item.external_related_patents : []).map(mapProjectPatent),
  }
}

function mapMockProject(item: MockProjectDetail): ProjectDetailViewModel {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    organization: item.organization,
    department: item.department,
    owner: item.owner,
    status: item.status,
    description: item.description,
    technologies: item.technologies.map((technology) => ({ id: technology.id, name: technology.name })),
    documents: item.documents.map((document) => ({ id: document.id, name: document.name, file_type: document.file_type, status: document.status, current_version_no: Number.parseInt(document.version.slice(1), 10) || undefined })),
    company_patents: item.company_patents.map((patent) => ({ id: patent.id, publication_number: patent.publication_number, title: patent.title, country: patent.country, relation_type: '公司专利', relevance_score: patent.relevance === '高' ? 90 : patent.relevance === '中' ? 60 : 30, relation_reason: patent.relation_reason })),
    external_related_patents: item.external_related_patents.map((patent) => ({ id: patent.id, publication_number: patent.publication_number, title: patent.title, country: patent.country, relation_type: '外部相关', relevance_score: patent.relevance === '高' ? 90 : patent.relevance === '中' ? 60 : 30, relation_reason: patent.relation_reason })),
    created_at: item.updated_at,
    updated_at: item.updated_at,
  }
}

export const projectApi = {
  list(keyword = '') {
    return apiRequest<PageResult<ProjectListItemViewModel>, PageResult<BackendProjectListItemDto>>(`/projects?keyword=${encodeURIComponent(keyword)}`, { method: 'GET' }, () => {
      const value = keyword.toLowerCase()
      const items = projects.filter((item) => !value || [item.name, item.code, item.owner].join(' ').toLowerCase().includes(value)).map(mapMockProject)
      return { items, page: 1, page_size: 20, total: items.length }
    }, (data) => ({ ...data, items: (Array.isArray(data.items) ? data.items : []).map(mapProjectListDtoToViewModel) }))
  },
  get(id: string) {
    return apiRequest<ProjectDetailViewModel, BackendProjectDetailDto>(`/projects/${encodeURIComponent(id)}`, { method: 'GET' }, () => {
      const project = projects.find((item) => item.id === id)
      if (!project) throw new Error('PROJECT_NOT_FOUND')
      return mapMockProject(project)
    }, mapProjectDetailDtoToViewModel)
  },
}
