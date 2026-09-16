import type { BackendLoginDto } from './contracts'

export type ApiResponse<T> = { code: number | string; data: T; message: string; trace_id: string }
export type PageResult<T> = { items: T[]; page: number; page_size: number; total: number }

export const ACCESS_TOKEN_KEY = 'access_token'
export const AUTH_STATE_EVENT = 'auth-state-change'

export class ApiError extends Error {
  constructor(message: string, public traceId?: string, public status?: number, public code?: number | string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const wait = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms))
export const getApiMode = () => import.meta.env.VITE_API_MODE === 'real' ? 'real' : 'mock'
let volatileAccessToken: string | null = null
const tokenStorage = () => {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
export const getAccessToken = () => tokenStorage()?.getItem(ACCESS_TOKEN_KEY) ?? volatileAccessToken

export function setAccessToken(token: string) {
  volatileAccessToken = token
  tokenStorage()?.setItem(ACCESS_TOKEN_KEY, token)
  window.dispatchEvent(new Event(AUTH_STATE_EVENT))
}

export function clearAccessToken() {
  volatileAccessToken = null
  tokenStorage()?.removeItem(ACCESS_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_STATE_EVENT))
}

export async function contractRequest<T>(path: string, init: RequestInit, mockHandler: () => T | Promise<T>): Promise<ApiResponse<T>> {
  init.signal?.throwIfAborted()
  await wait()
  init.signal?.throwIfAborted()
  const data = await mockHandler()
  init.signal?.throwIfAborted()
  return { code: 0, data, message: 'ok', trace_id: `mock-${path.replace(/\W+/g, '-')}` }
}

export async function apiRequest<T, TBackend = T>(path: string, init: RequestInit, mockHandler: () => T | Promise<T>, mapBackend?: (data: TBackend) => T): Promise<ApiResponse<T>> {
  if (getApiMode() === 'mock') {
    return contractRequest(path, init, mockHandler)
  }

  const token = getAccessToken()
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? '/api/v1'}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
  })
  const payload = await response.json().catch(() => null) as ApiResponse<TBackend> | null
  if (!response.ok || !payload || payload.code !== 0) {
    if (response.status === 401) {
      clearAccessToken()
      if (window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login')
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }
    throw new ApiError(payload?.message || `请求失败（${response.status}）`, payload?.trace_id, response.status, payload?.code)
  }
  return { ...payload, data: mapBackend ? mapBackend(payload.data) : payload.data as unknown as T }
}

export const authApi = {
  login(username: string, password: string) {
    return apiRequest<BackendLoginDto>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }, () => {
      if (!username || password.length < 4) throw new Error('请输入用户名和至少 4 位密码')
      return {
        access_token: 'mock-token',
        token_type: 'bearer',
        user: { id: 'mock-user', username, email: null, display_name: username === 'admin' ? '系统管理员' : '研发用户', roles: [username === 'admin' ? 'ADMIN' : 'DEVELOPER'] },
      }
    })
  },
}
