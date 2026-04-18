import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import {
  CreateStripeCheckoutSessionRequest,
  CreateStripeCheckoutSessionResponse,
  CancelOrdersRequest,
  CancelOrdersResponse,
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

export const cancelOrders = async (input: CancelOrdersRequest): Promise<HttpsCallableResult<CancelOrdersResponse>> => {
  const f = httpsCallable<CancelOrdersRequest, CancelOrdersResponse>(functions, 'cancelOrders')
  return f(input)
}
