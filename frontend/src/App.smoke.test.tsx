import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './components/AppShell'

describe('route smoke test', () => {
  it('renders the projects page through the authenticated route shell', () => {
    const html = renderToString(<MemoryRouter initialEntries={['/projects']}><AppShell onLogout={() => undefined} /></MemoryRouter>)
    expect(html).toContain('汇总项目目标、技术主题以及关联的专利和内部文档')
  })
})
