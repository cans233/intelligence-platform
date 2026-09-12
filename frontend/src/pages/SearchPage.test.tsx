import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { SearchResultCard } from '../components/SearchResultCard'
import type { InternalSearchQueryDto, InternalSearchResultDto } from '../types'
import { searchQueryFromParams, searchQueryToParams } from './SearchPage'

describe('Internal Search page contract', () => {
  it('round-trips filters, sorting and pagination through the URL', () => {
    const query: InternalSearchQueryDto = { keyword: '毫米波 VCO', types: ['patent', 'document'], date_from: '2025-01-01', date_to: '2026-09-11', applicant: '星河', ipc_codes: ['H03B'], cpc_codes: ['H03B5/12'], countries: ['CN'], project_ids: ['project-mmwave'], technology_tags: ['毫米波'], sort: 'updated_desc', page: 2, page_size: 5 }
    expect(searchQueryFromParams(searchQueryToParams(query))).toEqual(query)
  })

  it('renders server text segments as escaped text', () => {
    const item: InternalSearchResultDto = { id: 'safe', type: 'document', title: '<img src=x onerror=alert(1)>', snippet: '<script>alert(1)</script>', highlights: [{ field: 'title', segments: [{ text: '<img src=x onerror=alert(1)>', highlighted: true }] }, { field: 'snippet', segments: [{ text: '<script>alert(1)</script>', highlighted: false }] }], hit_reasons: ['文档标题命中'], source: ['内部文档库'], updated_at: '2026-09-11' }
    const html = renderToString(<MemoryRouter><SearchResultCard item={item} /></MemoryRouter>)
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('discovery_path')
  })
})
