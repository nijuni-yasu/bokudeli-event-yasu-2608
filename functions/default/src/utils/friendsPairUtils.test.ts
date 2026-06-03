import { describe, expect, it } from 'vitest'
import { buildPairsWithAnchor } from './friendsPairUtils.js'

describe('buildPairsWithAnchor', () => {
  it('returns only anchor-to-counterpart pairs, not among counterparts', () => {
    const pairs = buildPairsWithAnchor('C', ['A', 'B'])
    expect(pairs).toEqual([
      ['C', 'A'],
      ['C', 'B'],
    ])
    expect(pairs.some(([a, b]) => (a === 'A' && b === 'B') || (a === 'B' && b === 'A'))).toBe(false)
  })

  it('excludes anchor from counterpart list and dedupes', () => {
    const pairs = buildPairsWithAnchor('C', ['C', 'A', 'A', ''])
    expect(pairs).toEqual([['C', 'A']])
  })

  it('returns empty when no valid counterparts', () => {
    expect(buildPairsWithAnchor('C', [])).toEqual([])
    expect(buildPairsWithAnchor('C', ['C', ''])).toEqual([])
  })
})
