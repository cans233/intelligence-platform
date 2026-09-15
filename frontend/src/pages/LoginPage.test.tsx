import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearAccessToken, getAccessToken } from '../api/client'
import { LoginPage } from './LoginPage'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))

afterEach(() => {
  clearAccessToken()
  vi.unstubAllEnvs()
})

describe('login', () => {
  it('stores the access_token returned by the login API', async () => {
    vi.stubEnv('VITE_API_MODE', 'mock')
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)
    const onSuccess = vi.fn()

    await act(async () => root.render(<MemoryRouter><LoginPage onSuccess={onSuccess} /></MemoryRouter>))
    await act(async () => {
      container.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
      await new Promise((resolve) => setTimeout(resolve, 120))
    })

    expect(getAccessToken()).toBe('mock-token')
    expect(onSuccess).toHaveBeenCalledOnce()
    await act(async () => root.unmount())
    container.remove()
  })
})
