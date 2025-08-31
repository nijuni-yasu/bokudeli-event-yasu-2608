import { DateTime } from 'luxon'

// Default をハードコーディングする運用は危険なので取り扱いには注意すること
// (このファイルのみに限定しておき、将来的に動的な対応が必要になった際に影響範囲が最小限になるようにする)
const DEFAULT_TIME_ZONE = 'Asia/Tokyo'
const DEFAULT_LOCALE = 'ja'

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

export function convertToDateWeekdayShort(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc)')
}

export function convertToDate(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd')
}

export function convertToJustDate(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('MM/dd')
}

export function convertToDatetimeWeekdayShort(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc) HH:mm')
}

export function convertToDateString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy-MM-dd')
}

export function convertToHourString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('HH')
}

export function convertToMinuteString(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('mm')
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
) {
  if (startMillis == null || endMillis == null) {
    return undefined
  }
  const start = DateTime.fromMillis(startMillis, { zone, locale }).toFormat('yyyy/MM/dd (ccc) HH:mm')
  const end = DateTime.fromMillis(endMillis, { zone, locale }).toFormat('HH:mm')
  return `${start}〜${end}`
}

export function getLastDayOfNextMonth(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).plus({ month: 1 }).endOf('month')
}

export const convertDateToId = (millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) =>
  DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyyMMddHHmmss')
