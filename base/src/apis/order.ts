import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import { AddToCartRequest, RemoveFromCartRequest, ConfirmOrderRequest } from '@shokujii/common/apis/order.js'

export const addToCart = async (input: AddToCartRequest): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<AddToCartRequest, void>(functions, 'addToCart')
  return f(input)
}

export const removeFromCart = async (input: RemoveFromCartRequest): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<RemoveFromCartRequest, void>(functions, 'removeFromCart')
  return f(input)
}

export const confirmOrder = async (input: ConfirmOrderRequest): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<ConfirmOrderRequest, void>(functions, 'confirmOrder')
  return f(input)
}
