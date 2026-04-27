import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import type { CopyCommunityCoverToEventRequest } from '@shokujii/common/apis/copyCommunityCoverToEvent.js'
import { functions } from '@shokujii/base/firebase'

export const copyCommunityCoverToEvent = async (
  input: CopyCommunityCoverToEventRequest,
): Promise<HttpsCallableResult<void>> => {
  const f = httpsCallable<CopyCommunityCoverToEventRequest, void>(functions, 'copyCommunityCoverToEvent')
  return f(input)
}
