import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildYearMonthOptions,
  clampEndYearMonth,
  clampStartYearMonth,
  countInclusiveMonths,
  DASHBOARD_YEAR_MONTH_OPTION_PAST_MONTHS,
  filterEndYearMonthOptions,
  filterStartYearMonthOptions,
  getDefaultDashboardPeriod,
  MAX_DASHBOARD_PERIOD_MONTHS,
  validateDashboardPeriod,
} from './adminDashboardPeriod.js'

const JST_2026_06_15 = new Date('2026-06-15T12:00:00+09:00')

describe('getDefaultDashboardPeriod', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns previous, current, and next month', () => {
    expect(getDefaultDashboardPeriod(JST_2026_06_15.getTime())).toEqual({
      start_year_month: '2026-05',
      end_year_month: '2026-07',
    })
  })
})

describe('buildYearMonthOptions', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('includes up to next month and 12 months of past including current', () => {
    const options = buildYearMonthOptions(DASHBOARD_YEAR_MONTH_OPTION_PAST_MONTHS, JST_2026_06_15.getTime())
    expect(options[0]?.value).toBe('2026-07')
    expect(options[options.length - 1]?.value).toBe('2025-07')
    expect(options).toHaveLength(13)
  })
})

describe('filterStartYearMonthOptions', () => {
  const options = buildYearMonthOptions(DASHBOARD_YEAR_MONTH_OPTION_PAST_MONTHS, JST_2026_06_15.getTime())

  it('includes only months on or before end and within 12 months', () => {
    const filtered = filterStartYearMonthOptions(options, '2026-07')
    expect(filtered[0]?.value).toBe('2026-07')
    expect(filtered[filtered.length - 1]?.value).toBe('2025-08')
    expect(filtered).toHaveLength(12)
    expect(filtered.every((opt) => opt.value <= '2026-07')).toBe(true)
    expect(filtered.every((opt) => countInclusiveMonths(opt.value, '2026-07') <= MAX_DASHBOARD_PERIOD_MONTHS)).toBe(
      true,
    )
  })
})

describe('filterEndYearMonthOptions', () => {
  const options = buildYearMonthOptions(DASHBOARD_YEAR_MONTH_OPTION_PAST_MONTHS, JST_2026_06_15.getTime())

  it('includes only months on or after start and within 12 months', () => {
    const filtered = filterEndYearMonthOptions(options, '2025-07')
    expect(filtered[0]?.value).toBe('2026-06')
    expect(filtered[filtered.length - 1]?.value).toBe('2025-07')
    expect(filtered).toHaveLength(12)
    expect(filtered.every((opt) => opt.value >= '2025-07')).toBe(true)
    expect(filtered.every((opt) => countInclusiveMonths('2025-07', opt.value) <= MAX_DASHBOARD_PERIOD_MONTHS)).toBe(
      true,
    )
  })
})

describe('clampStartYearMonth', () => {
  it('returns end when start is after end', () => {
    expect(clampStartYearMonth('2026-07', '2026-04')).toBe('2026-04')
  })

  it('returns earliest valid start when range exceeds 12 months', () => {
    expect(clampStartYearMonth('2024-01', '2026-07')).toBe('2025-08')
  })
})

describe('clampEndYearMonth', () => {
  it('returns start when end is before start', () => {
    expect(clampEndYearMonth('2026-07', '2026-04')).toBe('2026-07')
  })

  it('returns latest valid end when range exceeds 12 months', () => {
    expect(clampEndYearMonth('2024-01', '2026-07')).toBe('2024-12')
  })
})

describe('validateDashboardPeriod', () => {
  it('returns undefined for valid 12-month range', () => {
    expect(
      validateDashboardPeriod({
        start_year_month: '2025-07',
        end_year_month: '2026-06',
      }),
    ).toBeUndefined()
  })

  it('returns undefined for exactly 12 months', () => {
    expect(
      validateDashboardPeriod({
        start_year_month: '2025-08',
        end_year_month: '2026-07',
      }),
    ).toBeUndefined()
    expect(countInclusiveMonths('2025-08', '2026-07')).toBe(MAX_DASHBOARD_PERIOD_MONTHS)
  })

  it('returns invalid_order when start is after end', () => {
    expect(
      validateDashboardPeriod({
        start_year_month: '2026-06',
        end_year_month: '2026-01',
      }),
    ).toBe('invalid_order')
  })

  it('returns invalid_max when range exceeds 12 months', () => {
    expect(
      validateDashboardPeriod({
        start_year_month: '2025-01',
        end_year_month: '2026-02',
      }),
    ).toBe('invalid_max')
  })
})
