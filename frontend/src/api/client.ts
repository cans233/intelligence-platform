import { searchPatents, patents } from '../mocks'

export const apiClient = {
  async login(username: string, password: string) {
    await new Promise((resolve) => setTimeout(resolve, 350))
    if (!username || password.length < 4) throw new Error('请输入用户名和至少4位密码')
    return { code: 0, data: { token: 'mock-token', user: { name: username === 'admin' ? '系统管理员' : '研发用户', role: username === 'admin' ? '管理员' : '研发人员' } }, message: 'ok', trace_id: 'mock-login-001' }
  },
  async search(query: string) { await new Promise((resolve) => setTimeout(resolve, 250)); return { code: 0, data: { items: searchPatents(query), page: 1, page_size: 20, total: searchPatents(query).length }, message: 'ok', trace_id: 'mock-search-001' } },
  async listPatents() { await new Promise((resolve) => setTimeout(resolve, 200)); return { code: 0, data: { items: patents, page: 1, page_size: 20, total: patents.length }, message: 'ok', trace_id: 'mock-patents-001' } },
  async getPatent(id: string) { await new Promise((resolve) => setTimeout(resolve, 180)); const patent = patents.find((item) => item.id === id); if (!patent) throw new Error('PATENT_NOT_FOUND'); return { code: 0, data: patent, message: 'ok', trace_id: `mock-detail-${id}` } },
}
