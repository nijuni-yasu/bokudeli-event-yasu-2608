export type UpdateOrderMenuCountRequest = {
  community_id: string
  event_id: string
  order_id: string
  menu_id: string
  count: number // 1以上の整数（上限なし）
}

export type DeleteOrderMenuRequest = {
  community_id: string
  event_id: string
  order_id: string
  menu_id: string
}
