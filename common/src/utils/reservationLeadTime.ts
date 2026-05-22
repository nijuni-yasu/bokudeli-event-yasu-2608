import { DateTime } from 'luxon'
import { EVENT_RESERVATION_LEAD_TIME_DAYS } from '../constants/eventReservation.js'
import { convertToDateString, DEFAULT_TIME_ZONE } from './datetime.js'

/**
 * 予約申請・イベント開催日時の下限（ミリ秒）。
 * JST 当日 0:00 に {@link EVENT_RESERVATION_LEAD_TIME_DAYS} 日を加えた時刻。
 */
export function getReservationLeadTimeMinMillis(nowMillis: number): number {
  return DateTime.fromMillis(nowMillis, { zone: DEFAULT_TIME_ZONE })
    .startOf('day')
    .plus({ days: EVENT_RESERVATION_LEAD_TIME_DAYS })
    .toMillis()
}

/**
 * 予約申請・イベント開催日時の下限を `yyyy-MM-dd`（JST）で返す。
 * v-date-picker 等の min 制約に使う。
 */
export function getReservationLeadTimeMinDateString(nowMillis: number): string {
  return convertToDateString(getReservationLeadTimeMinMillis(nowMillis))
}
