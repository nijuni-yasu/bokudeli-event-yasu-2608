import { DateTime } from 'luxon'

// Default をハードコーディングする運用は危険なので取り扱いには注意すること
// (このファイルのみに限定しておき、将来的に動的な対応が必要になった際に影響範囲が最小限になるようにする)
const DEFAULT_TIME_ZONE = 'Asia/Tokyo'
const DEFAULT_LOCALE = 'ja'

export function convertToDateWeekdayShort(millis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc)')
}

export function convertToDate(millis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd')
}

export function convertToJustDate(millis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('MM/dd')
}

export function convertToDatetimeWeekdayShort(millis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc) HH:mm')
}

export function convertToDuration(startMillis, endMillis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (startMillis == null || endMillis == null) {
    return undefined
  }
  const start = DateTime.fromMillis(startMillis, { zone, locale }).toFormat('yyyy/MM/dd (ccc) HH:mm')
  const end = DateTime.fromMillis(endMillis, { zone, locale }).toFormat('HH:mm')
  return `${start}〜${end}`
}

export function getLastDayOfNextMonth(millis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) {
  if (millis == null) {
    return undefined
  }
  return DateTime.fromMillis(millis, { zone, locale }).plus({ month: 1 }).endOf('month')
}

export const convertDateToId = (millis, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE) =>
  DateTime.fromMillis(millis, { zone, locale }).toFormat(date, 'yyyyMMddHHmmss')
