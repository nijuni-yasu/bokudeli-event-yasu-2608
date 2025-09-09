import { functions } from '@/firebase'
import { httpsCallable } from 'firebase/functions'
import { type OrderItem } from '../schemes/orderItem'

export const createStripeCheckoutSession = (order: OrderItem, isPosted: boolean) => {
  const f = httpsCallable(functions, 'createStripeCheckoutSession')
  return f({order, isPosted})
}
