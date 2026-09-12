import { projects } from '../mocks'
import type { ProjectDetailDto } from '../types'
import { apiRequest, type PageResult } from './client'

export const projectApi = {
  list(keyword = '') {
    return apiRequest<PageResult<ProjectDetailDto>>(`/projects?keyword=${encodeURIComponent(keyword)}`, { method: 'GET' }, () => {
      const value = keyword.toLowerCase()
      const items = projects.filter((item) => !value || [item.name, item.code, item.owner].join(' ').toLowerCase().includes(value))
      return { items, page: 1, page_size: 20, total: items.length }
    })
  },
  get(id: string) {
    return apiRequest<ProjectDetailDto>(`/projects/${encodeURIComponent(id)}`, { method: 'GET' }, () => {
      const project = projects.find((item) => item.id === id)
      if (!project) throw new Error('PROJECT_NOT_FOUND')
      return project
    })
  },
}
