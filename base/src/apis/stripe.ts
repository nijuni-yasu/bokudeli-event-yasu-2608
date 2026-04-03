import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import {
  CreateStripeCheckoutSessionRequest,
  CreateStripeCheckoutSessionResponse,
  StripeRefundsRequest,
} from '@shokujii/common/apis/stripe.js'

export const createStripeCheckoutSession = async (
  input: CreateStripeCheckoutSessionRequest,
): Promise<HttpsCallableResult<CreateStripeCheckoutSessionResponse>> => {
  const f = httpsCallable<CreateStripeCheckoutSessionRequest, CreateStripeCheckoutSessionResponse>(
    functions,
    'createStripeCheckoutSession',
  )
  return f(input)
}

export const stripeRefunds = async (
  input: StripeRefundsRequest,
): Promise<HttpsCallableResult<{ refund_id: string }>> => {
  const f = httpsCallable<StripeRefundsRequest, { refund_id: string }>(functions, 'stripeRefunds')
  return f(input)
}
