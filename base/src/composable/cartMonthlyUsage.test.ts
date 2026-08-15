import { describe, expect, it, vi } from 'vitest'
import {
  fetchCartEnterpriseSubsidyBudget,
  normalizeCartEnterpriseSubsidyBudget,
  normalizeCartMonthlyUsage,
} from './cartMonthlyUsage.js'

const defaultSubsidyHistory = [
  { effective_from_month: '2026-01', type: 'fixed' as const, value: 500, monthly_limit_per_user: 7500 },
]

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
  it('returns null when subsidySettingsHistory is missing or empty', () => {
    expect(normalizeCartEnterpriseSubsidyBudget({ monthlyUsage: { '2026-01': 100 } })).toBeNull()
    expect(
      normalizeCartEnterpriseSubsidyBudget({
        monthlyUsage: { '2026-01': 100 },
        subsidySettingsHistory: [],
      }),
    ).toBeNull()
  })

  it('returns null when monthlyUsage values are not numbers', () => {
    expect(
      normalizeCartEnterpriseSubsidyBudget({
        monthlyUsage: { '2026-01': '100' },
        subsidySettingsHistory: defaultSubsidyHistory,
      }),
    ).toBeNull()
    expect(
      normalizeCartEnterpriseSubsidyBudget({
        monthlyUsage: { '2026-01': NaN },
        subsidySettingsHistory: defaultSubsidyHistory,
      }),
    ).toBeNull()
  })

  it('returns normalized budget when monthlyUsage and history are valid', () => {
    expect(
      normalizeCartEnterpriseSubsidyBudget({
        monthlyUsage: { '2026-01': 100, '2026-02': 0 },
        subsidySettingsHistory: defaultSubsidyHistory,
      }),
    ).toEqual({
      monthlyUsage: { '2026-01': 100, '2026-02': 0 },
      subsidySettingsHistory: defaultSubsidyHistory,
    })
  })
})

describe('fetchCartEnterpriseSubsidyBudget', () => {
  it('returns normalized budget when loader succeeds', async () => {
    const loader = vi.fn().mockResolvedValue({
      monthlyUsage: { '2026-01': 100 },
      subsidySettingsHistory: defaultSubsidyHistory,
    })
    await expect(fetchCartEnterpriseSubsidyBudget('user1', loader)).resolves.toEqual({
      monthlyUsage: { '2026-01': 100 },
      subsidySettingsHistory: defaultSubsidyHistory,
    })
    expect(loader).toHaveBeenCalledWith('user1')
  })

  it('returns null when userId is empty', async () => {
    const loader = vi.fn()
    await expect(fetchCartEnterpriseSubsidyBudget('', loader)).resolves.toBeNull()
    expect(loader).not.toHaveBeenCalled()
  })

  it('returns null when loader throws', async () => {
    const loader = vi.fn().mockRejectedValue(new Error('network'))
    await expect(fetchCartEnterpriseSubsidyBudget('user1', loader)).resolves.toBeNull()
  })
})
