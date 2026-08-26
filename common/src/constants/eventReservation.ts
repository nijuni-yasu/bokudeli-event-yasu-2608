/**
 * 予約申請から開催開始までに必要な最短リードタイム（日数）。
 * JST の申請日 0:00 を起点として N 日後の 0:00 以降の開催開始のみ許可する。
 */
export const EVENT_RESERVATION_LEAD_TIME_DAYS = 3

/** 店舗が予約申請に回答するまでの期限（日数）。48 時間 = 2 日。 */
export const SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS = 2

/**
 * 店舗向け予約申請リマインド送信タイミング（申請から N 日後）。
 * 期限日（{@link SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS}）と同じ日は送らない。
 */
export const SHOP_RESERVATION_REMIND_DAY_OFFSETS = [1] as const

const ONE_DAY_MILLIS = 24 * 60 * 60 * 1000

/** applying_reservation 起点の店舗承認期限（epoch millis） */
export function getShopReservationApprovalDeadlineMillis(updatedAtMillis: number): number {
  return updatedAtMillis + SHOP_RESERVATION_APPROVAL_DEADLINE_DAYS * ONE_DAY_MILLIS
}
