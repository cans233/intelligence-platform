import { describe, expect, it } from 'vitest'
import { searchAll, searchPatents } from './mocks'

describe('Mock patent search', () => {
  it('matches title and returns empty for an unknown term', () => {
    expect(searchPatents('毫米波')[0].publication_number).toBe('CN118765432A')
    expect(searchPatents('不存在的技术')).toHaveLength(0)
  })

  it('returns all four resource types for a cross-type query', () => {
    expect(new Set(searchAll('毫米波').map((item) => item.kind))).toEqual(new Set(['patent', 'project', 'technology', 'document']))
  })
})
