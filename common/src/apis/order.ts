import type { EventOrderStatusType, OrderMenuType } from '../schemas/EventOrder.js'

export type UpdateMenuCountInCartRequest = {
  community_id: string
  event_id: string
  order_id: string
  menu_id: string
  count: number // 1以上の整数（上限なし）
}

export type DeleteMenuInCartRequest = {
  community_id: string
  event_id: string
  order_id: string
  menu_id: string
}

export type AddOrderRequest = {
  community_id: string
  event_id: string
  menus: OrderMenuType[]
}

export type AddOrderResponse = {
  order_id: string
}

export type UpdateOrderStatusRequest = {
  community_id: string
  event_id: string
  order_id: string
  status: EventOrderStatusType
}
