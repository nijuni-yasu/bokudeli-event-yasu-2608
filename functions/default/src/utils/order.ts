import { ShokujiiEvent } from '../stores/event.js'
import { getUser } from '../stores/user.js'

export interface OrderData {
  name: string
  order: string
  price: string
  number?: number
}

/**
 * 注文締切用の注文データを作成
 */
export async function createOrdersForOrderDeadline(event: ShokujiiEvent): Promise<[number, number, OrderData[]]> {
  const orders = await event.getOrders('ordered')
  const orderDataList: OrderData[] = []
  let count = 0
  let price = 0

  const promises = orders.map(async (order) => {
    const user = await getUser(order.user_id, false)
    const userName = user?.user_name || ''

    orderDataList.push({
      name: userName,
      order: order.menu_name,
      price: `¥${order.menu_price}`,
    })
    count++
    price += order.menu_price
  })

  await Promise.all(promises)

  orderDataList
    .sort((a, b) => (a.order > b.order ? 1 : a.order < b.order ? -1 : 0))
    .forEach((order, i) => (order.number = i + 1))

  return [count, price, orderDataList]
}
