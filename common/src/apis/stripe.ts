import { EventOrder } from '../schemas/EventOrder.js'

export type CreateStripeCheckoutSessionRequest = {
  order: EventOrder
  isPosted: boolean
}
