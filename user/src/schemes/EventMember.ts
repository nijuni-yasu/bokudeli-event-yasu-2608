import OrderItem from './orderItem'
import { UserStore } from '@/stores/user'

export type EventMember = {
  userId: string,
  orders: OrderItem[]
  userStore: UserStore
}
