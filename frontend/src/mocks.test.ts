import { afterEach, describe, expect, it } from 'vitest'
import { monitoringApi } from './api/monitoring'
import { searchApi } from './api/search'
import { monitoringProfiles, monitoringRuns, savedInternalSearches, searchAll } from './mocks'
import type { InternalSearchQueryDto } from './types'

const query = (keyword: string): InternalSearchQueryDto => ({
  keyword,
  types: ['patent', 'project', 'technology', 'document'],
  ipc_codes: [],
  cpc_codes: [],
  countries: [],
  project_ids: [],
  technology_tags: [],
  sort: 'relevance',
  page: 1,
  page_size: 20,
})

describe('Contract Mock search', () => {
  it('matches title and returns empty for an unknown term', () => {
    expect(searchAll(query('毫米波')).find((item) => item.type === 'patent')?.publication_number).toBe('CN118765432A')
    expect(searchAll(query('不存在的技术'))).toHaveLength(0)
  })

  it('returns all four resource types for a cross-type query', () => {
    expect(new Set(searchAll(query('毫米波')).map((item) => item.type))).toEqual(new Set(['patent', 'project', 'technology', 'document']))
  })

  it('applies DTO filters, sorting and pagination without exposing discovery paths', async () => {
    const filtered = await searchApi.search({ ...query(''), types: ['patent'], countries: ['CN'], sort: 'updated_asc', page_size: 1 })
    expect(filtered.data.items).toHaveLength(1)
    expect(filtered.data.total).toBe(2)
    expect(filtered.data.items[0].publication_number).toBe('CN117654321A')
    expect('discovery_path' in filtered.data.items[0]).toBe(false)
    expect(filtered.data.items[0].highlights[0].segments.every((segment) => typeof segment.text === 'string')).toBe(true)
  })

  it('saves an internal search without creating a monitoring profile', async () => {
    const profileCount = monitoringProfiles.length
    await searchApi.save({ name: '毫米波内部检索', query: query('毫米波') })
    expect(savedInternalSearches.at(-1)?.name).toBe('毫米波内部检索')
    expect(monitoringProfiles).toHaveLength(profileCount)
  })
})

describe('Monitoring Contract Mock', () => {
  const createdIds: string[] = []

  afterEach(() => {
    createdIds.forEach((id) => {
      const index = monitoringProfiles.findIndex((profile) => profile.id === id)
      if (index >= 0) monitoringProfiles.splice(index, 1)
      delete monitoringRuns[id]
    })
    createdIds.length = 0
  })

  it('creates a profile, records an immediate run and returns its history', async () => {
    const created = await monitoringApi.createProfile({ name: '测试监控', query: 'test query', countries: ['CN'], sources: ['CNIPA'], schedule: '手动' })
    createdIds.push(created.data.id)
    expect(created.data.status).toBe('ACTIVE')

    const run = await monitoringApi.runNow(created.data.id)
    const history = await monitoringApi.listRuns(created.data.id)

    expect(run.data.status).toBe('RUNNING')
    expect(history.data.items[0].id).toBe(run.data.id)
    expect(savedInternalSearches.some((item) => item.name === '测试监控')).toBe(false)
  })
})
