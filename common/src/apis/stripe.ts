export type CreateStripeCheckoutSessionRequest = {
  community_id: string
  event_id: string
  order_ids: string[]
  isPosted: boolean
  /** Stripe 完了後のリダイレクト先オリジン（enterprise 等）。Functions 側でテナントホストと照合する */
  origin?: string
}

export type CreateStripeCheckoutSessionResponse = {
  url: string | null
  subsidy_recalculated?: boolean
}

export type CancelOrdersRequest = {
  community_id: string
  event_id: string
  order_ids: string[]
}

export type CancelOrdersRefundError = {
  stripe_id: string
  message: string
}

export type CancelOrdersResponse = {
  canceled_count: number
  refunds: {
    stripe_id: string
    refund_id: string
    amount: number
  }[]
  /** Stripe 返金が一部または全部失敗した stripe_id。成功分は refunds に載る */
  refund_errors?: CancelOrdersRefundError[]
  /** トースト等に表示してよい文言（返金失敗時など） */
  user_message?: string
}
