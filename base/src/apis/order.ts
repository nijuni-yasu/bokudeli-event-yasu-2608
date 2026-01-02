import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import {
  AddOrderRequest,
  AddOrderResponse,
  UpdateOrderStatusRequest,
  UpdateMenuCountInCartRequest,
  DeleteMenuInCartRequest,
} from '@shokujii/common/apis/order.js'

export const addOrder = async (input: AddOrderRequest): Promise<HttpsCallableResult<AddOrderResponse>> => {
  const f = httpsCallable<AddOrderRequest, AddOrderResponse>(functions, 'add_order')
  return f(input)
}

export const updateOrderStatus = async (input: UpdateOrderStatusRequest): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<UpdateOrderStatusRequest, void>(functions, 'update_order_status')
  return f(input)
}

export const updateMenuCountInCart = async (
  input: UpdateMenuCountInCartRequest,
): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<UpdateMenuCountInCartRequest, void>(functions, 'updateMenuCountInCart')
  return f(input)
}

export const deleteMenuInCart = async (input: DeleteMenuInCartRequest): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<DeleteMenuInCartRequest, void>(functions, 'deleteMenuInCart')
  return f(input)
}
