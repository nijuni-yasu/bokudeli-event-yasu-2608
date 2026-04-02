export type CreateStripeCheckoutSessionRequest = {
  community_id: string
  event_id: string
  order_ids: string[]
  isPosted: boolean
}

export type CreateStripeCheckoutSessionResponse = {
  url?: string
}

export type StripeRefundsRequest = {
  order_id: string
  community_id: string
  event_id: string
}

export type CancelOrdersRequest = {
  community_id: string
  event_id: string
  order_ids: string[]
}

export type CancelOrdersResponse = {
  canceled_count: number
  refunds: {
    stripe_id: string
    refund_id: string
    amount: number
  }[]
}
