import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest } from './client'
import { projectApi } from './project'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('API mode adapter', () => {
  it('uses the Contract Mock without calling fetch', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const response = await projectApi.list('毫米波')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.data.items[0].id).toBe('project-mmwave')
  })

  it('uses the /api/v1 boundary in real mode', async () => {
    vi.stubEnv('VITE_API_MODE', 'real')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 0, data: { items: [], page: 1, page_size: 20, total: 0 }, message: 'ok', trace_id: 'trace-real' }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await projectApi.list('毫米波')

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/projects?keyword=%E6%AF%AB%E7%B1%B3%E6%B3%A2', expect.objectContaining({ method: 'GET' }))
  })

  it('preserves HTTP status and trace_id on a business error', async () => {
    vi.stubEnv('VITE_API_MODE', 'real')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 403, data: null, message: '无权限访问', trace_id: 'trace-403' }), { status: 403 })))

    await expect(apiRequest('/restricted', { method: 'GET' }, () => null)).rejects.toMatchObject({ message: '无权限访问', traceId: 'trace-403', status: 403 })
  })

  it('does not resolve an aborted Mock request', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const controller = new AbortController()
    const request = apiRequest('/slow', { method: 'GET', signal: controller.signal }, () => 'stale result')
    controller.abort()
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
})
