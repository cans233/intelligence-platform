import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppShell } from './components/AppShell'

describe('route smoke test', () => {
  it.each([
    ['/dashboard', '早上好，管理员'],
    ['/search', '内部全局搜索'],
    ['/patents', '专利库'],
    ['/patents/cn-001', '加载专利详情'],
    ['/projects', '项目库'],
    ['/projects/project-mmwave', '加载项目详情'],
    ['/knowledge', '知识库'],
    ['/technologies', '技术库'],
    ['/documents', '文档中心'],
    ['/monitoring', '专利监控'],
    ['/review', '审核中心'],
    ['/data-center', '数据中心'],
    ['/admin', '系统管理'],
  ])('renders %s with its business title', (path, title) => {
    const html = renderToString(<MemoryRouter initialEntries={[path]}><AppShell onLogout={() => undefined} /></MemoryRouter>)
    expect(html).toContain(title)
  })
})
