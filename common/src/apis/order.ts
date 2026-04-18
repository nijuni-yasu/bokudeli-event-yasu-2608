export type AddToCartRequest = {
  community_id: string
  event_id: string
  menus: { menu_id: string; count: number }[]
}
export type AddToCartResponse = void

export type RemoveFromCartRequest = {
  community_id: string
  event_id: string
  order_id: string
}

export type ConfirmOrderRequest = {
  community_id: string
  event_id: string
  order_ids: string[]
}
