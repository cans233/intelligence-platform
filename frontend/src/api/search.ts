import { savedInternalSearches, searchAll } from '../mocks'
import type { InternalSearchQueryDto, InternalSearchResultDto, SavedInternalSearch, SaveInternalSearchDto } from '../types'
import { contractRequest, type PageResult } from './client'

export const searchApi = {
  search(query: InternalSearchQueryDto, signal?: AbortSignal) {
    return contractRequest<PageResult<InternalSearchResultDto>>('/search', { method: 'POST', body: JSON.stringify(query), signal }, () => {
      const all = searchAll(query)
      const start = (query.page - 1) * query.page_size
      return { items: all.slice(start, start + query.page_size), page: query.page, page_size: query.page_size, total: all.length }
    })
  },
  save(input: SaveInternalSearchDto) {
    return contractRequest<SavedInternalSearch>('/saved-searches', { method: 'POST', body: JSON.stringify(input) }, () => {
      const item = { ...input, id: `SEARCH-${String(savedInternalSearches.length + 1).padStart(3, '0')}`, created_at: new Date().toISOString() }
      savedInternalSearches.push(item)
      return item
    })
  },
}
