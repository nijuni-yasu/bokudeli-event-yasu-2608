import { httpsCallable } from 'firebase/functions'
import type { EventCopyRepeatRequest, EventCopyRepeatResponse } from '@shokujii/common/apis/eventCopyRepeat.js'
import { functions } from '@shokujii/base/firebase'

export const eventCopyRepeat = async (input: EventCopyRepeatRequest) => {
  const f = httpsCallable<EventCopyRepeatRequest, EventCopyRepeatResponse>(functions, 'eventCopyRepeat')
  return f(input)
}
