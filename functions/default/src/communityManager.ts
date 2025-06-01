import { onCall, HttpsError } from 'firebase-functions/https'
import { getCommunity } from './stores/community.js'
import { getConfigGlobal } from './stores/config.js'

export const getInvitationUrlForCommunityManager = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  const communityId = request.data.communityId
  if (communityId == null) {
    throw new HttpsError('invalid-argument', 'The function must be called with the arguments "communityId."')
  }
  const community = await getCommunity(communityId)
  if (community === undefined) {
    throw new HttpsError('not-found', 'The community does not exist.')
  }
  const config = await getConfigGlobal()
  const isSupport = config?.isSupport(uid) ?? false
  const isManager = community.hasRole(uid, 'manager')
  if (!isSupport && !isManager) {
    throw new HttpsError('permission-denied', 'The function must be called by a manager.')
  }
  return await community.generateInvitationUrlForManager(uid)
})

export const acceptInvitationForCommunityManager = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  const communityId = request.data.communityId as string | undefined
  const token = request.data.token as string | undefined
  if (communityId == null || token == null) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with the arguments "communityId" and "token".',
    )
  }
  const community = await getCommunity(communityId)
  if (community === undefined) {
    throw new HttpsError('not-found', 'The community does not exist.')
  }
  await community.inviteAsManager(uid, token)
})
