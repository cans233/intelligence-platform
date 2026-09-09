import { projects } from '../mocks'
import { wait, type ApiResponse } from './client'

export const projectApi = {
  async list(): Promise<ApiResponse<{ items: typeof projects; page: number; page_size: number; total: number }>> {
    await wait(180)
    return { code: 0, data: { items: projects, page: 1, page_size: 20, total: projects.length }, message: 'ok', trace_id: 'mock-projects-001' }
  },
  async get(id: string): Promise<ApiResponse<(typeof projects)[number]>> {
    await wait(160)
    const project = projects.find((item) => item.id === id)
    if (!project) throw new Error('PROJECT_NOT_FOUND')
    return { code: 0, data: project, message: 'ok', trace_id: `mock-project-${id}` }
  },
}
