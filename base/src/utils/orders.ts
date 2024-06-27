import type { OrderItem } from '@/schemes/orderItem'
import type { OrderMenu } from '@/schemes/orderMenu'

export const ordersCount = (orders: OrderItem[]) =>
  orders.reduce((acc: number, order) => {
    if (order.status === 'ordered') {
      const count = order.menus.reduce((acc: number, menu) => acc + menu.count, 0)
      return acc + count
    } else {
      return acc
    }
  }, 0)

export const ordersTotalPrice = (orders: OrderItem[]) =>
  orders.reduce((acc: number, order) => {
    if (order.status === 'ordered') {
      const price = order.menus.reduce((acc: number, menu) => acc + menu.price * menu.count, 0)
      return acc + price
    } else {
      return acc
    }
  }, 0)

export const getSubtotalsOfOrders = (orders: OrderItem[]): OrderMenu[] => {
  const subtotals = new Map()
  orders.forEach((order) => {
    order.menus.forEach((menu: OrderMenu) => {
      const m = { ...menu }
      m.count = (subtotals.get(menu.menu_id)?.count ?? 0) + menu.count
      subtotals.set(menu.menu_id, m)
    })
  })
  return Array.from(subtotals.values())
}
