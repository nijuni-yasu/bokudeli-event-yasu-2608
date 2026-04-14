import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'

export {
  compareEventMemberOrdersForPartnerDetail,
  sortEventMemberOrdersForPartnerDetail,
} from '@shokujii/common/utils/eventMemberOrderSort.js'

export const ordersCount = (orders: EventMemberOrder[]) => orders.filter((o) => o.status === 'ordered').length

export const ordersTotalPrice = (orders: EventMemberOrder[]) =>
  orders.filter((o) => o.status === 'ordered').reduce((sum, o) => sum + o.menu_price, 0)

export interface SubtotalMenu {
  menu_id: string
  name: string
  price: number
  count: number
}

export const getSubtotalsOfOrders = (orders: EventMemberOrder[]): SubtotalMenu[] => {
  const map = new Map<string, SubtotalMenu>()
  for (const o of orders) {
    const existing = map.get(o.menu_id)
    if (existing) {
      existing.count++
    } else {
      map.set(o.menu_id, {
        menu_id: o.menu_id,
        name: o.menu_name,
        price: o.menu_price,
        count: 1,
      })
    }
  }
  return Array.from(map.values())
}
