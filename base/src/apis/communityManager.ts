import { functions } from '@shokujii/base/firebase'
import { httpsCallable } from 'firebase/functions'

import type {
  AcceptInvitationForCommunityManagerRequest,
  AcceptInvitationForCommunityManagerResponse,
} from '@shokujii/common/apis/communityManager.js'

export const acceptInvitationForCommunityManager = async (input: AcceptInvitationForCommunityManagerRequest) => {
  const f = httpsCallable<AcceptInvitationForCommunityManagerRequest, AcceptInvitationForCommunityManagerResponse>(
    functions,
    'acceptInvitationForCommunityManager',
  )
  return f(input)
}
