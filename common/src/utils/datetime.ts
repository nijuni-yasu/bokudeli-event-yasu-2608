import { DateTime } from 'luxon'
import { PartnerShop } from '../schemas/PartnerShop.js'

// Default をハードコーディングする運用は危険なので取り扱いには注意すること
// (このファイルのみに限定しておき、将来的に動的な対応が必要になった際に影響範囲が最小限になるようにする)
const DEFAULT_TIME_ZONE = 'Asia/Tokyo'
const DEFAULT_LOCALE = 'ja'

export const hourList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
export const minutesList = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

export function convertToDateWeekdayShort(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc)')
}

export function convertToDate(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd')
}

export function convertToJustDate(millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('MM/dd')
}

export function convertToDatetimeWeekdayShort(
  millis: number,
  zone = DEFAULT_TIME_ZONE,
  locale = DEFAULT_LOCALE,
): string {
  return DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyy/MM/dd (ccc) HH:mm')
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

export const convertDateToId = (millis: number, zone = DEFAULT_TIME_ZONE, locale = DEFAULT_LOCALE): string =>
  DateTime.fromMillis(millis, { zone, locale }).toFormat('yyyyMMddHHmmss')
