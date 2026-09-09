import { searchAll } from '../mocks'
import { wait, type ApiResponse } from './client'

export const searchApi = {
  async search(query: string): Promise<ApiResponse<{ items: ReturnType<typeof searchAll>; page: number; page_size: number; total: number }>> {
    await wait(250)
    const items = searchAll(query)
    return { code: 0, data: { items, page: 1, page_size: 20, total: items.length }, message: 'ok', trace_id: 'mock-search-001' }
  },
}
