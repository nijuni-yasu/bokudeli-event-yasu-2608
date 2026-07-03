import { functions } from '@shokujii/base/firebase.js'
import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import type { RecallChatMessageRequest, RecallChatMessageResponse } from '@shokujii/common/apis/chat.js'

export const recallChatMessage = async (
  input: RecallChatMessageRequest,
): Promise<HttpsCallableResult<RecallChatMessageResponse>> => {
  const callable = httpsCallable<RecallChatMessageRequest, RecallChatMessageResponse>(functions, 'recallChatMessage')
  return callable(input)
}
