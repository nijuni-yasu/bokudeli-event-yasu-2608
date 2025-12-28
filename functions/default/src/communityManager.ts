import { onCall, HttpsError } from 'firebase-functions/https'
import { getCommunity, getCommunityByAccount } from './stores/community.js'
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
  const communityAccount = request.data.communityAccount as string | undefined
  const token = request.data.token as string | undefined
  if (communityAccount == null || token == null) {
    throw new HttpsError(
      'invalid-argument',
      'The function must be called with the arguments "communityAccount" and "token".',
    )
  }
  const community = await getCommunityByAccount(communityAccount)
  if (community === undefined) {
    throw new HttpsError('not-found', 'The community does not exist.')
  }
  await community.inviteAsManager(uid, token)
})
