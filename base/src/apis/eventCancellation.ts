import { httpsCallable } from 'firebase/functions'
import type { CancelEventRequest, CancelEventResponse } from '@shokujii/common/apis/eventCancellation.js'
import { functions } from '@shokujii/base/firebase'

export const cancelEvent = async (input: CancelEventRequest) => {
  const f = httpsCallable<CancelEventRequest, CancelEventResponse>(functions, 'cancelEvent')
  return f(input)
}
