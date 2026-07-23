import { describe, expect, it } from 'vitest'
import { buildReactionSummary, normalizeReactionSummary } from './chatReactionSummary.js'

describe('chatReactionSummary utils', () => {
  it('buildReactionSummary aggregates counts', () => {
    expect(buildReactionSummary([{ emoji: '👍' }, { emoji: '👍' }])).toEqual({ '👍': 2 })
  })

  it('normalizeReactionSummary drops non-positive counts', () => {
    expect(normalizeReactionSummary({ '👍': 1 })).toEqual({ '👍': 1 })
    expect(normalizeReactionSummary({})).toBeUndefined()
  })
})
