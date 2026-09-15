import { documents } from '../mocks'
import type { DocumentDto } from '../types'
import { contractRequest, type PageResult } from './client'

export const documentApi = {
  list(keyword = '') {
    return contractRequest<PageResult<DocumentDto>>(`/documents?keyword=${encodeURIComponent(keyword)}`, { method: 'GET' }, () => {
      const value = keyword.toLowerCase()
      const items = documents.filter((item) => !value || [item.name, item.project_name, item.owner, item.summary].join(' ').toLowerCase().includes(value))
      return { items, page: 1, page_size: 50, total: items.length }
    })
  },
}
