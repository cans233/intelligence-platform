import { technologies } from '../mocks'
import type { TechnologyDto } from '../types'
import { contractRequest, type PageResult } from './client'

export const technologyApi = {
  list(keyword = '') {
    return contractRequest<PageResult<TechnologyDto>>(`/technologies?keyword=${encodeURIComponent(keyword)}`, { method: 'GET' }, () => {
      const value = keyword.toLowerCase()
      const items = technologies.filter((item) => !value || [item.name, item.domain, item.description, ...item.keywords].join(' ').toLowerCase().includes(value))
      return { items, page: 1, page_size: 50, total: items.length }
    })
  },
}
