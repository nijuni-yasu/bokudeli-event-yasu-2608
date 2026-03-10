import { EventOrder } from '../schemas/EventOrder.js'

export type CreateStripeCheckoutSessionRequest = {
  order: EventOrder
  isPosted: boolean
}

export type StripeRefundsRequest = {
  order_id: string
  community_id: string
  event_id: string
}
