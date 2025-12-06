import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'
import { CreateStripeCheckoutSessionRequest } from '@shokujii/common/apis/stripe.js'

export const createStripeCheckoutSession = (input: CreateStripeCheckoutSessionRequest) => {
  const f = httpsCallable(functions, 'createStripeCheckoutSession')
  return f(input)
}
