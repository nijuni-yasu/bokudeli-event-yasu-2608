import { Timestamp } from 'firebase/firestore'
import { type OrderMenu } from './orderMenu'

export type OrderItem = {
  user_id: string
  community_id: string
  community_account: string
  event_id: string
  event_payment: string
  order_id: string
  status: 'in_cart' | 'ordered' | 'canceled'
  menus: OrderMenu[]
  created_at: Timestamp
  updated_at: Timestamp
  carted_at: Timestamp
  payment_intent?: ''
  canceled_at?: Timestamp
}

export const createEmptyOrderItem = (): OrderItem => ({
  user_id: '',
  community_id: '',
  community_account: '',
  event_id: '',
  event_payment: '',
  order_id: '',
  status: 'in_cart',
  menus: [],
  created_at: Timestamp.now(),
  updated_at: Timestamp.now(),
  carted_at: Timestamp.now(),
})
