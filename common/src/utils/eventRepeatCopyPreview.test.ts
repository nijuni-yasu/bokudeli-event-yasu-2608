import { describe, expect, it } from 'vitest'
import { DateTime } from 'luxon'
import {
  DEFAULT_TIME_ZONE,
  advanceRepeatCursorMillis,
  computeEventRepeatCopyPreviewStartTimes,
  getNthWeekdayOfMonthDateTime,
  getWeekNumberInMonthFromMillis,
} from './datetime.js'

function jst(y: number, m: number, d: number, h: number, min: number): number {
  return DateTime.fromObject(
    { year: y, month: m, day: d, hour: h, minute: min },
    { zone: DEFAULT_TIME_ZONE },
  ).toMillis()
}

function ymdh(millis: number): string {
  return DateTime.fromMillis(millis, { zone: DEFAULT_TIME_ZONE }).toFormat('yyyy-MM-dd HH:mm')
}

describe('getNthWeekdayOfMonthDateTime', () => {
  it('第5週が存在しない月は null を返す', () => {
    expect(getNthWeekdayOfMonthDateTime(2026, 2, 5, 2, DEFAULT_TIME_ZONE)).toBeNull()
  })

  it('第5週が存在する月は DateTime を返す', () => {
    const dt = getNthWeekdayOfMonthDateTime(2026, 3, 5, 2, DEFAULT_TIME_ZONE)
    expect(dt).not.toBeNull()
    expect(dt!.year).toBe(2026)
    expect(dt!.month).toBe(3)
    expect(dt!.weekday % 7).toBe(2)
  })
})

describe('getWeekNumberInMonthFromMillis', () => {
  it('月初付近は第1週になる', () => {
    const ms = jst(2026, 3, 1, 12, 0)
    expect(getWeekNumberInMonthFromMillis(ms)).toBe(1)
  })

  it('月末が第5週の曜日でも 6 にならない（getNthWeekdayOfMonthDateTime と同じ週番号）', () => {
    // 2022-01: 1日が土曜 → 31日(月) はその月の第5月曜。旧 Math.ceil 式だと 6 になる。
    const ms = jst(2022, 1, 31, 12, 0)
    expect(getWeekNumberInMonthFromMillis(ms)).toBe(5)
  })
})

describe('advanceRepeatCursorMillis', () => {
  it('月次同じ日付で31日から進めるとうるう年では2月29日になる', () => {
    const jan31 = jst(2024, 1, 31, 18, 30)
    const next = advanceRepeatCursorMillis(jan31, 1, 'month', 'date', 1, 0, DEFAULT_TIME_ZONE)
    expect(next).not.toBeNull()
    expect(ymdh(next!)).toBe('2024-02-29 18:30')
  })

  it('月次同じ日付で31日から進めると平年では2月28日になる', () => {
    const jan31 = jst(2026, 1, 31, 10, 0)
    const next = advanceRepeatCursorMillis(jan31, 1, 'month', 'date', 1, 0, DEFAULT_TIME_ZONE)
    expect(next).not.toBeNull()
    expect(ymdh(next!)).toBe('2026-02-28 10:00')
  })

  it('月次同じ日付で2月28日から進め、基準日31なら3月は31日になる', () => {
    const feb28 = jst(2026, 2, 28, 10, 0)
    const next = advanceRepeatCursorMillis(feb28, 1, 'month', 'date', 1, 0, DEFAULT_TIME_ZONE, 'ja', 31)
    expect(next).not.toBeNull()
    expect(ymdh(next!)).toBe('2026-03-31 10:00')
  })

  it('月次同じ日付で 1/31 起点の系列は 2/28 の次が 3/31 になる', () => {
    const jan31 = jst(2026, 1, 31, 10, 0)
    const feb = advanceRepeatCursorMillis(jan31, 1, 'month', 'date', 1, 0, DEFAULT_TIME_ZONE, 'ja', 31)
    expect(feb).not.toBeNull()
    expect(ymdh(feb!)).toBe('2026-02-28 10:00')
    const mar = advanceRepeatCursorMillis(feb!, 1, 'month', 'date', 1, 0, DEFAULT_TIME_ZONE, 'ja', 31)
    expect(mar).not.toBeNull()
    expect(ymdh(mar!)).toBe('2026-03-31 10:00')
  })

  it('日次は指定日数進む', () => {
    const t0 = jst(2026, 5, 1, 19, 0)
    const t1 = advanceRepeatCursorMillis(t0, 3, 'day', 'date', 1, 0, DEFAULT_TIME_ZONE)
    expect(t1).not.toBeNull()
    expect(ymdh(t1!)).toBe('2026-05-04 19:00')
  })

  it('月次同じ曜日は秒・ミリ秒を維持する', () => {
    const fifthTueMar = getNthWeekdayOfMonthDateTime(2026, 3, 5, 2, DEFAULT_TIME_ZONE)
    expect(fifthTueMar).not.toBeNull()
    const start = fifthTueMar!.set({ hour: 18, minute: 0, second: 45, millisecond: 123 }).toMillis()
    const next = advanceRepeatCursorMillis(start, 1, 'month', 'weekday', 5, 2, DEFAULT_TIME_ZONE)
    expect(next).not.toBeNull()
    const dt = DateTime.fromMillis(next!, { zone: DEFAULT_TIME_ZONE })
    expect(dt.second).toBe(45)
    expect(dt.millisecond).toBe(123)
  })
})

describe('computeEventRepeatCopyPreviewStartTimes', () => {
  it('isShopOpen が常に true のとき repeatCount 件で打ち切り repeatCount 理由になる', () => {
    const start = jst(2026, 6, 1, 12, 0)
    const r = computeEventRepeatCopyPreviewStartTimes({
      startMs: start,
      repeatCount: 3,
      repeatInterval: 1,
      repeatUnit: 'day',
      monthlyPattern: 'date',
      isShopOpen: () => true,
      zone: DEFAULT_TIME_ZONE,
    })
    expect(r.startTimes).toHaveLength(3)
    expect(r.startTimes[0]).toBe(start)
    expect(r.stoppedBecause).toBe('repeatCount')
    expect(ymdh(r.startTimes[1]!)).toBe('2026-06-02 12:00')
    expect(ymdh(r.startTimes[2]!)).toBe('2026-06-03 12:00')
  })

  it('isShopOpen が常に false のとき0件で maxSteps 理由になる', () => {
    const start = jst(2026, 6, 10, 12, 0)
    const r = computeEventRepeatCopyPreviewStartTimes({
      startMs: start,
      repeatCount: 4,
      repeatInterval: 1,
      repeatUnit: 'day',
      monthlyPattern: 'date',
      isShopOpen: () => false,
      zone: DEFAULT_TIME_ZONE,
    })
    expect(r.startTimes).toHaveLength(0)
    expect(r.stoppedBecause).toBe('maxSteps')
  })

  it('営業時間外は採用にカウントせずステップだけ進む', () => {
    const start = jst(2026, 6, 1, 12, 0)
    const r = computeEventRepeatCopyPreviewStartTimes({
      startMs: start,
      repeatCount: 2,
      repeatInterval: 1,
      repeatUnit: 'day',
      monthlyPattern: 'date',
      isShopOpen: (ms) => {
        const d = DateTime.fromMillis(ms, { zone: DEFAULT_TIME_ZONE }).day
        return d === 1 || d === 3
      },
      zone: DEFAULT_TIME_ZONE,
    })
    expect(r.startTimes).toHaveLength(2)
    expect(ymdh(r.startTimes[0]!)).toBe('2026-06-01 12:00')
    expect(ymdh(r.startTimes[1]!)).toBe('2026-06-03 12:00')
    expect(r.stoppedBecause).toBe('repeatCount')
  })

  it('採用が repeatCount に届かず探索上限で打ち切れる', () => {
    const start = jst(2026, 6, 1, 12, 0)
    const r = computeEventRepeatCopyPreviewStartTimes({
      startMs: start,
      repeatCount: 12,
      repeatInterval: 1,
      repeatUnit: 'day',
      monthlyPattern: 'date',
      isShopOpen: (ms) => DateTime.fromMillis(ms, { zone: DEFAULT_TIME_ZONE }).day === 1,
      zone: DEFAULT_TIME_ZONE,
    })
    expect(r.startTimes.length).toBeLessThan(12)
    expect(r.stoppedBecause).toBe('maxSteps')
  })

  it('月次曜日で第5週がない月はスキップされ採用件数が増える', () => {
    const fifthTueMar = getNthWeekdayOfMonthDateTime(2026, 3, 5, 2, DEFAULT_TIME_ZONE)
    expect(fifthTueMar).not.toBeNull()
    const start = fifthTueMar!.set({ hour: 18, minute: 0, second: 0, millisecond: 0 }).toMillis()
    const r = computeEventRepeatCopyPreviewStartTimes({
      startMs: start,
      repeatCount: 2,
      repeatInterval: 1,
      repeatUnit: 'month',
      monthlyPattern: 'weekday',
      isShopOpen: () => true,
      zone: DEFAULT_TIME_ZONE,
    })
    expect(r.startTimes).toHaveLength(2)
    expect(DateTime.fromMillis(r.startTimes[0]!, { zone: DEFAULT_TIME_ZONE }).month).toBe(3)
    expect(DateTime.fromMillis(r.startTimes[1]!, { zone: DEFAULT_TIME_ZONE }).month).toBeGreaterThan(3)
    expect(r.stoppedBecause).toBe('repeatCount')
  })
})
