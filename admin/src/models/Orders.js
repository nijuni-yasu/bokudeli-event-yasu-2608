export class Orders {
  constructor (ordersSnapshot) {
    this.orders = Array.from(ordersSnapshot.docs).flatMap((orderSnapshot) => {
      const order = orderSnapshot.data()
      return order.menus.flatMap((menu) => {
        const o = { ...order, ...menu }
        delete o.menus
        delete o.count
        o.created_at = o.created_at?.toMillis()
        o.updated_at = o.updated_at?.toMillis()
        return Array(menu.count).fill(o)
      })
    })
  }

  [Symbol.iterator] () {
    return this.orders[Symbol.iterator]()
  }

  get length () {
    return this.orders.length
  }

  get totalPrice () {
    return this.orders.reduce((sum, order) => sum + order.price, 0)
  }

  getSubtotalOrders () {
    const subtotals = new Map()
    this.orders.forEach((order) => {
      order.count = (subtotals.get(order.menu_id)?.count ?? 0) + 1
      subtotals.set(order.menu_id, order)
    })
    return Array.from(subtotals.values())
  }
}
