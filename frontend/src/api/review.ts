import { reviewItems } from '../mocks'
import type { ReviewItemDto } from '../types'
import { apiRequest, type PageResult } from './client'

export const reviewApi = {
  list() {
    return apiRequest<PageResult<ReviewItemDto>>('/reviews', { method: 'GET' }, () => ({ items: reviewItems, page: 1, page_size: 20, total: reviewItems.length }))
  },
}
