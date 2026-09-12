export type ApiResponse<T> = { code: number; data: T; message: string; trace_id: string }
export type PageResult<T> = { items: T[]; page: number; page_size: number; total: number }

export class ApiError extends Error {
  constructor(message: string, public traceId?: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms))
export const getApiMode = () => import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock'

export async function apiRequest<T>(path: string, init: RequestInit, mockHandler: () => T | Promise<T>): Promise<ApiResponse<T>> {
  if (getApiMode() === 'mock') {
    init.signal?.throwIfAborted()
    await wait()
    init.signal?.throwIfAborted()
    const data = await mockHandler()
    init.signal?.throwIfAborted()
    return { code: 0, data, message: 'ok', trace_id: `mock-${path.replace(/\W+/g, '-')}` }
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  const payload = await response.json().catch(() => null) as ApiResponse<T> | null
  if (!response.ok || !payload || payload.code !== 0) {
    throw new ApiError(payload?.message || `请求失败（${response.status}）`, payload?.trace_id, response.status)
  }
  return payload
}

export const authApi = {
  login(username: string, password: string) {
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, () => {
      if (!username || password.length < 4) throw new Error('请输入用户名和至少 4 位密码')
      return { token: 'mock-token', user: { name: username === 'admin' ? '系统管理员' : '研发用户', role: username === 'admin' ? '管理员' : '研发人员' } }
    })
  },
}
