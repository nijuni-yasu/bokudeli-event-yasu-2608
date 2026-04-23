import { describe, expect, it } from 'vitest'
import { isEligibleForPopularEventMailSend, parsePopularEventMailThreshold } from './popularEventMailThreshold.js'

describe('parsePopularEventMailThreshold', () => {
  it('returns missing when undefined', () => {
    expect(parsePopularEventMailThreshold(undefined)).toEqual({ ok: false, reason: 'missing' })
  })

  it('returns invalid for non-positive or non-integer', () => {
    expect(parsePopularEventMailThreshold(0)).toEqual({ ok: false, reason: 'invalid' })
    expect(parsePopularEventMailThreshold(-1)).toEqual({ ok: false, reason: 'invalid' })
    expect(parsePopularEventMailThreshold(1.5)).toEqual({ ok: false, reason: 'invalid' })
    expect(parsePopularEventMailThreshold(Number.NaN)).toEqual({ ok: false, reason: 'invalid' })
  })

  it('returns ok for positive integers', () => {
    expect(parsePopularEventMailThreshold(1)).toEqual({ ok: true, value: 1 })
    expect(parsePopularEventMailThreshold(10)).toEqual({ ok: true, value: 10 })
  })
})

describe('isEligibleForPopularEventMailSend', () => {
  const base = {
    isPublic: true,
    eventStatusValue: 'accepting_order',
    sentPopularEventMailAt: undefined as number | undefined,
    memberCount: 10,
    eventMaxPeople: 25,
    threshold: 10,
  }

  it('returns true at threshold and at capacity', () => {
    expect(isEligibleForPopularEventMailSend(base)).toBe(true)
    expect(isEligibleForPopularEventMailSend({ ...base, memberCount: 25 })).toBe(true)
  })

  it('returns false when below threshold', () => {
    expect(isEligibleForPopularEventMailSend({ ...base, memberCount: 9 })).toBe(false)
  })

  it('returns false when over capacity', () => {
    expect(isEligibleForPopularEventMailSend({ ...base, memberCount: 26 })).toBe(false)
  })

  it('returns false when not public, wrong status, or already sent', () => {
    expect(isEligibleForPopularEventMailSend({ ...base, isPublic: false })).toBe(false)
    expect(isEligibleForPopularEventMailSend({ ...base, eventStatusValue: 'in_draft' })).toBe(false)
    expect(isEligibleForPopularEventMailSend({ ...base, sentPopularEventMailAt: 1 })).toBe(false)
  })
})
