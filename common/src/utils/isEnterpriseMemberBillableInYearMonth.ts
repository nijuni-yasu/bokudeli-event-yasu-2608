import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from './datetime.js'

export type BillableMemberTimestamps = {
  is_active: boolean
  last_activated_at: number | null
  last_deactivated_at: number | null
}

/** YM 文字列（YYYY-MM）の形式チェック */
export function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  if (match == null) {
    throw new Error(`Invalid yearMonth: ${yearMonth}`)
  }
  const year = Number(match[1])
  const month = Number(match[2])
  if (month < 1 || month > 12) {
    throw new Error(`Invalid yearMonth: ${yearMonth}`)
  }
  return { year, month }
}

/** 暦月 YM の JST 範囲 [monthStart, monthEnd]（monthEnd = 当該月 23:59:59.999 JST） */
export function getYearMonthRangeMillis(
  yearMonth: string,
  zone = DEFAULT_TIME_ZONE,
): { monthStart: number; monthEnd: number } {
  const { year, month } = parseYearMonth(yearMonth)
  const monthStart = DateTime.fromObject({ year, month, day: 1 }, { zone }).startOf('day').toMillis()
  const monthEnd = DateTime.fromObject({ year, month, day: 1 }, { zone }).endOf('month').toMillis()
  return { monthStart, monthEnd }
}

function isInYearMonth(millis: number | null, yearMonth: string, zone = DEFAULT_TIME_ZONE): boolean {
  if (millis == null) return false
  const { monthStart, monthEnd } = getYearMonthRangeMillis(yearMonth, zone)
  return millis >= monthStart && millis <= monthEnd
}

/**
 * 02_課金設計 §2.3 billable_in(YM) 判定（4 条件版）。
 */
export function isEnterpriseMemberBillableInYearMonth(
  member: BillableMemberTimestamps,
  yearMonth: string,
  zone = DEFAULT_TIME_ZONE,
): boolean {
  const { monthEnd } = getYearMonthRangeMillis(yearMonth, zone)
  const { last_activated_at, last_deactivated_at, is_active } = member

  if (last_activated_at != null && isInYearMonth(last_activated_at, yearMonth, zone)) {
    return true
  }
  if (last_deactivated_at != null && isInYearMonth(last_deactivated_at, yearMonth, zone)) {
    return true
  }
  if (
    last_activated_at != null &&
    last_activated_at <= monthEnd &&
    (last_deactivated_at == null || last_deactivated_at > monthEnd)
  ) {
    return true
  }
  if (
    is_active &&
    last_activated_at != null &&
    last_activated_at <= monthEnd &&
    (last_deactivated_at == null || last_deactivated_at < last_activated_at)
  ) {
    return true
  }
  return false
}

/**
 * createEnterprise 時の billing_trial_ends_at（お試し 3 ヶ月目の末日 23:59:59.999 JST）。
 */
export function computeBillingTrialEndsAtMillis(createdAtMillis: number, zone = DEFAULT_TIME_ZONE): number {
  const created = DateTime.fromMillis(createdAtMillis, { zone })
  // 起点月を 1 ヶ月目とした 3 暦月無料 → 3 ヶ月目の末日 23:59:59.999 JST
  return created.startOf('month').plus({ months: 2 }).endOf('month').toMillis()
}
