import { describe, expect, it } from 'vitest'
import {
  applyOptimisticReactionSummary,
  buildReactionSummary,
  buildReactionSummaryAriaLabel,
  formatReactionSummaryText,
  isSameReactionSummary,
  normalizeReactionSummary,
} from './chatReactionSummary.js'

describe('chatReactionSummary utils', () => {
  it('buildReactionSummary aggregates counts', () => {
    expect(buildReactionSummary([{ emoji: '👍' }, { emoji: '👍' }])).toEqual({ '👍': 2 })
  })

  it('normalizeReactionSummary drops non-positive counts', () => {
    expect(normalizeReactionSummary({ '👍': 1 })).toEqual({ '👍': 1 })
    expect(normalizeReactionSummary({})).toBeUndefined()
  })

  it('applyOptimisticReactionSummary adds emoji', () => {
    expect(applyOptimisticReactionSummary(undefined, undefined, '❤️')).toEqual({ '❤️': 1 })
    expect(applyOptimisticReactionSummary({ '❤️': 1 }, undefined, '❤️')).toEqual({ '❤️': 2 })
  })

  it('applyOptimisticReactionSummary removes emoji', () => {
    expect(applyOptimisticReactionSummary({ '❤️': 2 }, '❤️', undefined)).toEqual({ '❤️': 1 })
    expect(applyOptimisticReactionSummary({ '❤️': 1 }, '❤️', undefined)).toBeUndefined()
  })

  it('applyOptimisticReactionSummary changes emoji', () => {
    expect(applyOptimisticReactionSummary({ '❤️': 1, '😆': 1 }, '❤️', '😆')).toEqual({ '😆': 2 })
  })

  it('formatReactionSummaryText repeats emojis in fixed order', () => {
    expect(formatReactionSummaryText({ '😆': 2, '❤️': 1 })).toBe('❤️😆😆')
    expect(formatReactionSummaryText(undefined)).toBe('')
  })

  it('buildReactionSummaryAriaLabel joins formatted entries', () => {
    const label = buildReactionSummaryAriaLabel({ '❤️': 2, '😆': 1 }, (emoji, count) => `${emoji} ${count}件`)
    expect(label).toBe('❤️ 2件、😆 1件')
  })

  it('isSameReactionSummary compares counts', () => {
    expect(isSameReactionSummary(undefined, undefined)).toBe(true)
    expect(isSameReactionSummary({ '❤️': 1 }, undefined)).toBe(false)
    expect(isSameReactionSummary({ '❤️': 1 }, { '❤️': 1 })).toBe(true)
    expect(isSameReactionSummary({ '❤️': 1 }, { '❤️': 2 })).toBe(false)
  })
})
