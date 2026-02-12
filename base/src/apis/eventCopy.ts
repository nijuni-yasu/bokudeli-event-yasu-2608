import { httpsCallable } from 'firebase/functions'
import { EventCopyRequest, EventCopyResponse } from '@shokujii/common/apis/eventCopy.js'
import { functions } from '@shokujii/base/firebase'

export const eventCopy = async (input: EventCopyRequest) => {
  const f = httpsCallable<EventCopyRequest, EventCopyResponse>(functions, 'eventCopy')
  return f(input)
}
