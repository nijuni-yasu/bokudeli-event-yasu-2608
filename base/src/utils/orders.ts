import type OrderItem from '@/schemes/orderItem'

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
