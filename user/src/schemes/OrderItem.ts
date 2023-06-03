import { Timestamp } from 'firebase/firestore'
import OrderMenu from './orderMenu'

type OrderItem = {
  user_id: string
  status: 'in_cart' | 'ordered' | 'completed'
  menus: OrderMenu[]
  created_at: Timestamp
  updated_at: Timestamp
}

export default OrderItem
