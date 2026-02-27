import { functions } from '@shokujii/base/firebase'
import { httpsCallable, HttpsCallableResult } from 'firebase/functions'
import { UpdateEventMenusRequest } from '@shokujii/common/apis/eventMenu.js'

export const updateEventMenus = async (
  input: UpdateEventMenusRequest,
): Promise<HttpsCallableResult<{ success: boolean }>> => {
  const f = httpsCallable<UpdateEventMenusRequest, { success: boolean }>(functions, 'updateEventMenus')
  return f(input)
}
