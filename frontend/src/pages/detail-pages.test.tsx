import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StateBlock } from '../components/StateBlock'
import { clearAccessToken } from '../api/client'
import { PatentDetailPage } from './PatentPages'
import { ProjectDetailPage } from './ProjectPages'

type MountedPage = { container: HTMLDivElement; root: Root }
const mounted: MountedPage[] = []
;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
window.matchMedia = vi.fn().mockImplementation((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }))
const getComputedStyle = window.getComputedStyle.bind(window)
window.getComputedStyle = (element) => getComputedStyle(element)

async function mount(path: string, pattern: string, element: React.ReactNode) {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  mounted.push({ container, root })
  await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Routes><Route path={pattern} element={element} /></Routes></MemoryRouter>))
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 120)) })
  return container
}

async function selectTab(container: HTMLElement, label: string) {
  const tab = [...container.querySelectorAll<HTMLElement>('[role="tab"]')].find((item) => item.textContent?.includes(label))
  expect(tab).toBeTruthy()
  await act(async () => tab?.click())
}

afterEach(async () => {
  for (const item of mounted.splice(0)) {
    await act(async () => item.root.unmount())
    item.container.remove()
  }
  clearAccessToken()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('formal detail pages', () => {
  it('shows project identity and all four relation groups', async () => {
    const page = await mount('/projects/project-mmwave', '/projects/:id', <ProjectDetailPage />)
    expect(page.textContent).toContain('研发中心')
    expect(page.textContent).toContain('射频集成电路部')
    expect(page.textContent).toContain('技术')
    expect(page.textContent).toContain('文档')
    expect(page.textContent).toContain('公司专利')
    expect(page.textContent).toContain('外部相关专利')
  })

  it('separates patent data categories, source, discovery path and company project link', async () => {
    const page = await mount('/patents/cn-001', '/patents/:id', <PatentDetailPage />)
    expect(page.textContent).toContain('官方事实')
    expect(page.textContent).toContain('系统标准化')
    expect(page.textContent).toContain('系统 / AI 增强')
    expect(page.textContent).toContain('人工结论')

    await selectTab(page, '来源与发现')
    expect(page.textContent).toContain('CNIPA')
    expect(page.textContent).toContain('外部监控：毫米波 VCO')

    await selectTab(page, '增强与人工结论')
    expect(page.textContent).toContain('系统 / AI 增强')
    expect(page.textContent).toContain('人工结论与公司项目关联')
    expect(page.textContent).toContain('PRJ-RF-024')
  })

  it('renders a real PatentDetail DTO through the adapter', async () => {
    vi.stubEnv('VITE_API_MODE', 'real')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      data: {
        id: '00000000-0000-0000-0000-000000000001', family_id: 'F-1', title: '真实 DTO 专利', publication_number: 'CN100A', application_number: 'CN100', country: 'CN', applicant_names: ['申请人甲'], publication_date: '2026-01-01', ipc_codes: ['H01L'], cpc_codes: [], legal_status: '申请中', status: 'PUBLISHED', source_codes: ['CNIPA'], updated_at: '2026-09-15T00:00:00Z', filing_date: '2025-01-01', priority_date: null, abstract: '真实摘要', description: null,
        applicants: [{ id: 'person-1', name: '申请人甲', country: 'CN' }], inventors: [], classifications: [], claims: [{ id: 'claim-1', claim_no: 1, claim_type: 'INDEPENDENT', text: '真实权利要求' }], family_members: [], citations: { references: [], cited_by: [] }, legal_events: [], sources: [{ id: 'source-1', source_code: 'CNIPA', source_record_id: 'CNIPA-CN100A', fetched_at: '2026-09-15T00:00:00Z', raw_data: { hidden: 'raw evidence' } }], normalized_fields: {}, ai_enhancements: {}, human_conclusions: {}, discovery_path: [], created_at: '2026-09-15T00:00:00Z',
      },
      message: 'ok',
      trace_id: 'trace-patent',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    const page = await mount('/patents/00000000-0000-0000-0000-000000000001', '/patents/:id', <PatentDetailPage />)
    expect(page.textContent).toContain('真实 DTO 专利')
    expect(page.textContent).toContain('申请人甲')
    await selectTab(page, '权利要求')
    expect(page.textContent).toContain('真实权利要求')
    await selectTab(page, '来源与发现')
    expect(page.textContent).toContain('CNIPA-CN100A')
    expect(page.textContent).not.toContain('raw evidence')
    await selectTab(page, '增强与人工结论')
    expect(page.textContent).toContain('暂无')
  })

  it('renders a real ProjectDetail DTO and its empty relations', async () => {
    vi.stubEnv('VITE_API_MODE', 'real')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      code: 0,
      data: {
        id: '00000000-0000-0000-0000-000000000010', code: 'PRJ-REAL', name: '真实 DTO 项目', description: null, status: 'ACTIVE', organization: { id: 'org-1', code: 'ORG', name: '真实研发中心' }, department: null, owner: null, technologies: [], documents: [], company_patents: [], external_related_patents: [], created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-15T00:00:00Z',
      },
      message: 'ok',
      trace_id: 'trace-project',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    const page = await mount('/projects/00000000-0000-0000-0000-000000000010', '/projects/:id', <ProjectDetailPage />)
    expect(page.textContent).toContain('真实 DTO 项目')
    expect(page.textContent).toContain('真实研发中心')
    expect(page.textContent).toContain('进行中')
    expect(page.textContent).toContain('暂无关联技术')
    expect(page.textContent).toContain('暂无关联文档')
    expect(page.textContent).toContain('暂无公司专利')
    expect(page.textContent).toContain('暂无外部相关专利')
  })

  it.each([
    ['/projects/missing', '/projects/:id', <ProjectDetailPage />, '找不到这个项目'],
    ['/patents/missing', '/patents/:id', <PatentDetailPage />, '找不到这件专利'],
  ])('renders a 404 state for %s', async (path, pattern, element, expected) => {
    const page = await mount(path, pattern, element)
    expect(page.textContent).toContain(expected)
  })
})

describe('shared page states', () => {
  it.each([
    ['loading', 'ant-skeleton'],
    ['empty', '没有符合条件的记录'],
    ['error', '数据暂时不可用'],
    ['forbidden', '无权限访问'],
  ])('renders the %s state', (type, expected) => {
    expect(renderToString(<MemoryRouter><StateBlock type={type} /></MemoryRouter>)).toContain(expected)
  })
})
