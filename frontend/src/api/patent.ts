import { patentListItems, patents } from '../mocks'
import type { PatentDetailDto, PatentListItemDto, PatentListQueryDto } from '../types'
import { apiRequest, type PageResult } from './client'

export const patentApi = {
  list(query: PatentListQueryDto = {}) {
    const params = new URLSearchParams()
    if (query.keyword) params.set('keyword', query.keyword)
    query.countries?.forEach((country) => params.append('country', country))
    query.qualities?.forEach((quality) => params.append('quality', quality))
    if (query.page) params.set('page', String(query.page))
    if (query.page_size) params.set('page_size', String(query.page_size))
    const suffix = params.size ? `?${params}` : ''
    return apiRequest<PageResult<PatentListItemDto>>(`/patents${suffix}`, { method: 'GET' }, () => {
      const keyword = query.keyword?.toLowerCase()
      const items = patentListItems.filter((item) => (!keyword || [item.title, item.publication_number, item.applicant].join(' ').toLowerCase().includes(keyword)) && (!query.countries?.length || query.countries.includes(item.country)) && (!query.qualities?.length || query.qualities.includes(item.record_quality)))
      const page = query.page ?? 1
      const pageSize = query.page_size ?? 20
      return { items: items.slice((page - 1) * pageSize, page * pageSize), page, page_size: pageSize, total: items.length }
    })
  },
  get(id: string) {
    return apiRequest<PatentDetailDto>(`/patents/${encodeURIComponent(id)}`, { method: 'GET' }, () => {
      const patent = patents.find((item) => item.id === id)
      if (!patent) throw new Error('PATENT_NOT_FOUND')
      return patent
    })
  },
}
