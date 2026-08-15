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

const enterpriseSubsidyReplayCartedAt = (order: EventMemberOrder): number => order.carted_at ?? order.created_at ?? 0

/**
 * enterprise_subsidy の replay / addToCart / confirmOrder で共通の並び。
 * carted_at 昇順 → order_id 昇順（updated_at は書き戻しで変わるため使わない）。
 */
export const compareEventMemberOrdersForEnterpriseSubsidyReplay = (
  a: EventMemberOrder,
  b: EventMemberOrder,
): number => {
  const cartedDiff = enterpriseSubsidyReplayCartedAt(a) - enterpriseSubsidyReplayCartedAt(b)
  if (cartedDiff !== 0) {
    return cartedDiff
  }
  return a.order_id.localeCompare(b.order_id)
}

export const sortEventMemberOrdersForEnterpriseSubsidyReplay = (orders: EventMemberOrder[]): EventMemberOrder[] => {
  return [...orders].sort(compareEventMemberOrdersForEnterpriseSubsidyReplay)
}

export const sortOrderIdsForEnterpriseSubsidyReplay = (orders: EventMemberOrder[]): string[] => {
  return sortEventMemberOrdersForEnterpriseSubsidyReplay(orders).map((order) => order.order_id)
}
