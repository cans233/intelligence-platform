import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StateBlock } from '../components/StateBlock'
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
