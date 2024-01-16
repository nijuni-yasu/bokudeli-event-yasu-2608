import OrderItem from './orderItem'
import { FirestoredUser } from './storedUser'

export type EventMember = FirestoredUser & {
  orders: OrderItem[]
}
