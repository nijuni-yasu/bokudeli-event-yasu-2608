import { DateTime } from 'luxon'
import { PartnerShop } from '../schemas/PartnerShop.js'

// Default をハードコーディングする運用は危険なので取り扱いには注意すること
// (このファイルのみに限定しておき、将来的に動的な対応が必要になった際に影響範囲が最小限になるようにする)
export const DEFAULT_TIME_ZONE = 'Asia/Tokyo'
const DEFAULT_LOCALE = 'ja'

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

export function convertToDateWeekdayShort(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc)')
}

/** スラッシュ区切りの日付。月・日は先頭ゼロなし。例 2026/3/30 */
export function convertToDate(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/M/d')
}

/** スラッシュ区切りの日付 + 24h 時刻。月日は先頭ゼロなし。例 2026/3/30 23:52 */
export function convertToDatetime(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/M/d HH:mm')
}

/** イベントコピー時の名前サフィックス用（開催開始の暦日・曜日）。例 → 2026/6/28(日) */
export function formatCopyEventDateSuffix(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  const dt = DateTime.fromMillis(millis, { zone, locale })
  return `${dt.toFormat('yyyy/M/d')}(${dt.toFormat('ccc')})`
}

export function convertToJustDate(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('MM/dd')
}

export function convertToDatetimeWeekdayShort(
  millis: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/M/d(ccc) HH:mm')
}

/**
 * Vuetify v-date-picker 準拠の文字列に変換する
 * @param millis
 * @param zone
 * @param locale
 * @returns
 */
export function convertToDateString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy-MM-dd')
}

export function convertToHourString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('HH')
}

export function convertToMinuteString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('mm')
}

export function convertToTimeString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('HH:mm')
}

/**
 * 店舗締切時刻など、epoch millis から JST の時分だけを取り出して使う値を生成する。
 * ブラウザのローカル TZ に依存しない。
 */
export function timeOfDayToMillis(
  hours: number,
  minutes: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): number {
  return DateTime.fromObject(
    { year: 1970, month: 1, day: 1, hour: hours, minute: minutes },
    { zone, locale },
  ).toMillis()
}

export function parseDatetimeStrings(
  dateString: string,
  hourString: string | null,
  minutesString: string | null,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): number {
  let result = DateTime.fromFormat(dateString, 'yyyy-MM-dd', { zone, locale })
  if (hourString !== null) {
    result = result.set({ hour: Number(hourString) })
  }
  if (minutesString !== null) {
    result = result.set({ minute: Number(minutesString) })
  }
  return result.toMillis()
}

export function convertToDuration(
  startMillis: number,
  endMillis: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): string {
  const start = DateTime.fromMillis(startMillis, { zone, locale }).toFormat('yyyy/MM/dd (ccc) HH:mm')
  const end = DateTime.fromMillis(endMillis, { zone, locale }).toFormat('HH:mm')
  return `${start}〜${end}`
}

/**
 * 開催終了と開始の差分（ミリ秒）。コピープレビューで「別の開始日時に同じ長さのイベント」を組み立てる用途。
 * 両方が有限かつ終了 > 開始のときのみ正の値を返し、未設定・非有限・0 以下は null。
 */
export function getEventDateTimeRangeDurationMs(
  eventStartMillis: number | null | undefined,
  eventEndMillis: number | null | undefined,
): number | null {
  if (
    eventStartMillis == null ||
    eventEndMillis == null ||
    !Number.isFinite(eventStartMillis) ||
    !Number.isFinite(eventEndMillis)
  ) {
    return null
  }
  const d = eventEndMillis - eventStartMillis
  return d > 0 ? d : null
}

export function getLastDayOfNextMonth(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): number {
  return DateTime.fromMillis(millis, { zone, locale }).plus({ month: 1 }).endOf('month').toMillis()
}

export function getStartOfDay(millis: number, zone = DEFAULT_TIME_ZONE): number {
  return DateTime.fromMillis(millis, { zone }).startOf('day').toMillis()
}

/**
 * Luxon の weekday ではなく、Date の getDay() の値と一致する
 * 0:日曜日, 1:月曜日, 2:火曜日, 3:水曜日, 4:木曜日, 5:金曜日, 6:土曜日
 * @param millis
 * @param zone
 * @param locale
 * @returns
 */
export function getDayOfWeek(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  return DateTime.fromMillis(millis, { zone, locale }).weekday % 7
}

/** 月内何日目か 1〜31 */
export function getDayOfMonth(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): number {
  return DateTime.fromMillis(millis, { zone, locale }).day
}

/**
 * 指定された日時が店舗の営業時間内かどうかを判定する
 * datetime.ts に入れるべきかは微妙なところだが、 locale が絡むのでここにおいておく
 * @param targetTime 指定された日時
 * @param shop 店舗情報
 * @param zone タイムゾーン
 * @param locale ロケール
 * @returns
 */
export function isInShopTime(targetTime: number, shop: PartnerShop, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  const targetDayOfWeek = getDayOfWeek(targetTime, zone, locale)
  const targetDayMidnight = getStartOfDay(targetTime, zone)
  return shop.shop_time.some((shopTime, dayOfWeek) => {
    if (!shopTime.is_open || dayOfWeek !== targetDayOfWeek) {
      return false
    }
    const timeStart = targetDayMidnight + shopTime.time_start
    const timeEnd = targetDayMidnight + shopTime.time_end
    const timeStart2 = targetDayMidnight + (shopTime.time_start2 ?? Infinity)
    const timeEnd2 = targetDayMidnight + (shopTime.time_end2 ?? 0)
    return (timeStart <= targetTime && targetTime <= timeEnd) || (timeStart2 <= targetTime && targetTime <= timeEnd2)
  })
}

// --- イベント繰り返しコピープレビュー用日時計算 documents/02_主催者獲得と継続/05_イベント繰り返し作成.md 5.3 ---

/** 月内で何週目か 1〜5（{@link getNthWeekdayOfMonthDateTime} の weekNumber と同じ定義） */
export function getWeekNumberInMonthFromMillis(
  millis: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): number {
  const dt = DateTime.fromMillis(millis, { zone, locale })
  const first = dt.startOf('month')
  const dayOfWeek = dt.weekday % 7
  const firstDow = first.weekday % 7
  const firstOccurrence = 1 + ((dayOfWeek - firstDow + 7) % 7)
  return Math.floor((dt.day - firstOccurrence) / 7) + 1
}

/** 指定月の第 N 週の曜日に相当する日。存在しない場合は null */
export function getNthWeekdayOfMonthDateTime(
  year: number,
  month: number,
  weekNumber: number,
  dayOfWeek: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): DateTime | null {
  const firstDay = DateTime.fromObject({ year, month, day: 1 }, { zone, locale })
  const firstDow = firstDay.weekday % 7
  const firstOccurrence = 1 + ((dayOfWeek - firstDow + 7) % 7)
  const targetDay = firstOccurrence + (weekNumber - 1) * 7
  const lastDay = firstDay.endOf('month').day
  if (targetDay > lastDay) {
    return null
  }
  return DateTime.fromObject({ year, month, day: targetDay }, { zone, locale })
}

export function advanceRepeatCursorMillis(
  cursor: number,
  interval: number,
  unit: 'day' | 'week' | 'month' | 'year',
  pattern: 'date' | 'weekday',
  fixedWeekNumber: number,
  fixedDayOfWeek: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
  /** 月次「同じ日付」のとき、繰り返し系列の基準となる日（未指定なら cursor の日） */
  fixedDayOfMonth?: number,
): number | null {
  const base = DateTime.fromMillis(cursor, { zone, locale })
  if (unit === 'day') {
    return base.plus({ days: interval }).toMillis()
  }
  if (unit === 'week') {
    return base.plus({ weeks: interval }).toMillis()
  }
  if (unit === 'year') {
    return base.plus({ years: interval }).toMillis()
  }
  if (pattern === 'date') {
    const dom = fixedDayOfMonth ?? base.day
    let n = base.plus({ months: interval })
    const last = n.endOf('month').day
    n = n.set({ day: Math.min(dom, last) })
    return n.toMillis()
  }
  const h = base.hour
  const minute = base.minute
  const second = base.second
  const millisecond = base.millisecond
  let m = base.startOf('month').plus({ months: interval })
  for (let i = 0; i < 24; i++) {
    const cand = getNthWeekdayOfMonthDateTime(m.year, m.month, fixedWeekNumber, fixedDayOfWeek, zone, locale)
    if (cand != null) {
      return cand.set({ hour: h, minute, second, millisecond }).toMillis()
    }
    m = m.plus({ months: interval })
  }
  return null
}

export type EventRepeatCopyPreviewStoppedBecause = 'repeatCount' | 'maxSteps'

export type ComputeEventRepeatCopyPreviewStartTimesResult = {
  startTimes: number[]
  stoppedBecause: EventRepeatCopyPreviewStoppedBecause
}

export type ComputeEventRepeatCopyPreviewStartTimesInput = {
  startMs: number
  /** 希望採用件数 1〜12。非有限のときは 4 として扱う */
  repeatCount: number
  repeatInterval: number
  repeatUnit: 'day' | 'week' | 'month' | 'year'
  monthlyPattern: 'date' | 'weekday'
  /** 探索ステップ上限は repeatCountClamped に乗算 既定 12 */
  maxStepMultiplier?: number
  zone?: string
  locale?: string
  /** 店舗営業時間内の候補のみ採用にカウントする */
  isShopOpen: (epochMs: number) => boolean
}

export function computeEventRepeatCopyPreviewStartTimes(
  input: ComputeEventRepeatCopyPreviewStartTimesInput,
): ComputeEventRepeatCopyPreviewStartTimesResult {
  const zone = input.zone ?? DEFAULT_TIME_ZONE
  const locale = input.locale ?? DEFAULT_LOCALE
  const maxStepMultiplier = input.maxStepMultiplier ?? 12

  let count = Math.floor(Number(input.repeatCount))
  if (!Number.isFinite(count)) {
    count = 4
  }
  count = Math.min(12, Math.max(1, count))

  const interval = Math.min(365, Math.max(1, Math.floor(Number(input.repeatInterval)) || 1))

  const maxSteps = count * maxStepMultiplier
  const fixedWeekNumber = getWeekNumberInMonthFromMillis(input.startMs, zone, locale)
  const fixedDayOfWeek = getDayOfWeek(input.startMs, zone, locale)
  const fixedDayOfMonth = DateTime.fromMillis(input.startMs, { zone, locale }).day

  const startTimes: number[] = []
  let steps = 0
  let cursor = input.startMs

  while (steps < maxSteps && startTimes.length < count) {
    if (input.isShopOpen(cursor)) {
      startTimes.push(cursor)
    }
    const nextCursor = advanceRepeatCursorMillis(
      cursor,
      interval,
      input.repeatUnit,
      input.monthlyPattern,
      fixedWeekNumber,
      fixedDayOfWeek,
      zone,
      locale,
      fixedDayOfMonth,
    )
    if (nextCursor === null) {
      break
    }
    cursor = nextCursor
    steps++
  }

  const stoppedBecause: EventRepeatCopyPreviewStoppedBecause = startTimes.length >= count ? 'repeatCount' : 'maxSteps'

  return { startTimes, stoppedBecause }
}

export const convertDateToId = (millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string =>
  DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyyMMddHHmmss')
