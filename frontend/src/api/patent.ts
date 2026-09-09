import { patents } from '../mocks'
import { wait, type ApiResponse } from './client'

export const patentApi = {
  async list(): Promise<ApiResponse<{ items: typeof patents; page: number; page_size: number; total: number }>> {
    await wait(200)
    return { code: 0, data: { items: patents, page: 1, page_size: 20, total: patents.length }, message: 'ok', trace_id: 'mock-patents-001' }
  },
  async get(id: string): Promise<ApiResponse<(typeof patents)[number]>> {
    await wait(180)
    const patent = patents.find((item) => item.id === id)
    if (!patent) throw new Error('PATENT_NOT_FOUND')
    return { code: 0, data: patent, message: 'ok', trace_id: `mock-detail-${id}` }
  },
}
