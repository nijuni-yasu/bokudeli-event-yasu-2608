import type { EventMemberOrder } from '../schemas/EventMemberOrder.js'

/**
 * パートナー向けオーダー詳細（partner order [eventId]）の明細テーブルと同一の並び。
 * menu_name を `>` 比較で昇順、同一メニュー内は ordered_at 昇順（欠損は 0）。
 */
export const compareEventMemberOrdersForPartnerDetail = (a: EventMemberOrder, b: EventMemberOrder): number => {
  if (a.menu_name === b.menu_name) {
    return (a.ordered_at ?? 0) - (b.ordered_at ?? 0)
  }
  return a.menu_name > b.menu_name ? 1 : -1
}

export const sortEventMemberOrdersForPartnerDetail = (orders: EventMemberOrder[]): EventMemberOrder[] => {
  return [...orders].sort(compareEventMemberOrdersForPartnerDetail)
}
