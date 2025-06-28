import { httpsCallable } from 'firebase/functions'
import { EventReceiptRequest, EventReceiptResponse } from '@shokujii/common/apis/eventReceipt.js'
import { functions } from '@shokujii/base/firebase'

export const eventReceipt = async (input: EventReceiptRequest) => {
  const f = httpsCallable<EventReceiptRequest, EventReceiptResponse>(functions, 'eventReceipt')
  return f(input)
}
