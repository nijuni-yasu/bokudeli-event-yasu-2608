import type { EventOrder, OrderMenuType } from '@shokujii/common/schemas/EventOrder.js'

export const ordersCount = (orders: EventOrder[]) =>
  orders.reduce((acc: number, order) => {
    if (order.status === 'ordered') {
      const count = order.menus.reduce((acc: number, menu) => acc + menu.count, 0)
      return acc + count
    } else {
      return acc
    }
  }, 0)

export const ordersTotalPrice = (orders: EventOrder[]) =>
  orders.reduce((acc: number, order) => {
    if (order.status === 'ordered') {
      const price = order.menus.reduce((acc: number, menu) => acc + menu.price * menu.count, 0)
      return acc + price
    } else {
      return acc
    }
  }, 0)

export const getSubtotalsOfOrders = (orders: EventOrder[]): OrderMenuType[] => {
  const subtotals = new Map()
  orders.forEach((order) => {
    order.menus.forEach((menu: OrderMenuType) => {
      const m = { ...menu }
      m.count = (subtotals.get(menu.menu_id)?.count ?? 0) + menu.count
      subtotals.set(menu.menu_id, m)
    })
  })
  return Array.from(subtotals.values())
}
