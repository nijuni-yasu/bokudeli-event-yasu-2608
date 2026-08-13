import { describe, expect, it } from 'vitest'
import { normalizeCartEnterpriseSubsidyBudget, normalizeCartMonthlyUsage } from './cartMonthlyUsage.js'

describe('normalizeCartMonthlyUsage', () => {
  it('returns null for null/undefined/primitive', () => {
    expect(normalizeCartMonthlyUsage(null)).toBeNull()
    expect(normalizeCartMonthlyUsage(undefined)).toBeNull()
    expect(normalizeCartMonthlyUsage(0)).toBeNull()
    expect(normalizeCartMonthlyUsage('')).toBeNull()
  })

  it('returns null when used or limit is missing or not a number', () => {
    expect(normalizeCartMonthlyUsage({})).toBeNull()
    expect(normalizeCartMonthlyUsage({ used: 100 })).toBeNull()
    expect(normalizeCartMonthlyUsage({ limit: 1000 })).toBeNull()
    expect(normalizeCartMonthlyUsage({ used: '100', limit: 1000 })).toBeNull()
  })

  it('returns normalized object when used and limit are numbers', () => {
    expect(normalizeCartMonthlyUsage({ used: 100, limit: 1000 })).toEqual({ used: 100, limit: 1000 })
    expect(normalizeCartMonthlyUsage({ used: 0, limit: 0 })).toEqual({ used: 0, limit: 0 })
  })
})

describe('normalizeCartEnterpriseSubsidyBudget', () => {
  it('returns null when monthlyUsage values are not numbers', () => {
    expect(normalizeCartEnterpriseSubsidyBudget({ monthlyUsage: { '2026-01': '100' } })).toBeNull()
    expect(normalizeCartEnterpriseSubsidyBudget({ monthlyUsage: { '2026-01': NaN } })).toBeNull()
  })

  it('returns normalized monthlyUsage when all values are numbers', () => {
    expect(normalizeCartEnterpriseSubsidyBudget({ monthlyUsage: { '2026-01': 100, '2026-02': 0 } })).toEqual({
      monthlyUsage: { '2026-01': 100, '2026-02': 0 },
    })
  })
})
