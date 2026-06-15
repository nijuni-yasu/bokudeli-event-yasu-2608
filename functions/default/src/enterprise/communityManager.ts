import { defineString } from 'firebase-functions/params'
import { onCall, HttpsError } from 'firebase-functions/https'
import { getCommunityInvitationUrl } from '@shokujii/common/utils/urls.js'
import type { Enterprise } from '@shokujii/common/schemas/Enterprise.js'
import type {
  AcceptInvitationForEnterpriseCommunityManagerRequest,
  AcceptInvitationForEnterpriseCommunityManagerResponse,
  GetInvitationUrlForEnterpriseCommunityManagerRequest,
  GetInvitationUrlForEnterpriseCommunityManagerResponse,
} from '@shokujii/common/apis/enterprise.js'
import { getCommunity, getCommunityByAccount } from '../stores/community.js'
import { getConfigGlobal } from '../stores/config.js'
import { getEnterpriseById, getEnterpriseMember } from '../stores/enterprise.js'

const ENTERPRISE_BASE_DOMAIN = defineString('ENTERPRISE_BASE_DOMAIN', { default: '' })

export function resolveEnterpriseHost(enterprise: Enterprise): string {
  const customDomain = enterprise.custom_domain?.trim().toLowerCase()
  if (customDomain != null && customDomain !== '') {
    return customDomain
  }
  const baseDomain = ENTERPRISE_BASE_DOMAIN.value().trim().toLowerCase()
  const subdomain = enterprise.subdomain?.trim().toLowerCase()
  if (baseDomain !== '' && subdomain != null && subdomain !== '') {
    return `${subdomain}.${baseDomain}`
  }
  throw new HttpsError('failed-precondition', 'enterprise host is not configured')
}

async function assertActiveEnterpriseMember(enterpriseId: string, userId: string): Promise<void> {
  const member = await getEnterpriseMember(enterpriseId, userId)
  if (member == null || !member.is_active) {
    throw new HttpsError('permission-denied', 'active enterprise member required')
  }
}

export const getInvitationUrlForEnterpriseCommunityManager = onCall<
  GetInvitationUrlForEnterpriseCommunityManagerRequest,
  Promise<GetInvitationUrlForEnterpriseCommunityManagerResponse>
>(async (request) => {
  const auth = request.auth
  if (auth?.uid == null) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  const uid = auth.uid
  const communityId = request.data.communityId
  if (communityId == null) {
    throw new HttpsError('invalid-argument', 'The function must be called with the arguments "communityId."')
  }

  const community = await getCommunity(communityId)
  if (community === undefined) {
    throw new HttpsError('not-found', 'The community does not exist.')
  }
  const enterpriseId = community.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    throw new HttpsError('failed-precondition', 'The community is not an enterprise community.')
  }

  const config = await getConfigGlobal()
  const isSupport = config?.isSupport(uid) ?? false
  const isManager = await community.hasRole(uid, 'manager')
  if (!isSupport && !isManager) {
    throw new HttpsError('permission-denied', 'The function must be called by a manager.')
  }

  const tokenEnterpriseId = auth.token.enterprise_id as string | undefined
  if (!isSupport && tokenEnterpriseId !== enterpriseId) {
    throw new HttpsError('permission-denied', 'enterprise mismatch')
  }
  if (!isSupport) {
    await assertActiveEnterpriseMember(enterpriseId, uid)
  }

  const enterprise = await getEnterpriseById(enterpriseId)
  if (enterprise == null) {
    throw new HttpsError('not-found', 'enterprise not found')
  }

  const tokenId = await community.createManagerInviteToken(uid)
  const host = resolveEnterpriseHost(enterprise)
  return getCommunityInvitationUrl(host, community.community_account, tokenId)
})

export const acceptInvitationForEnterpriseCommunityManager = onCall<
  AcceptInvitationForEnterpriseCommunityManagerRequest,
  Promise<AcceptInvitationForEnterpriseCommunityManagerResponse>
>(async (request) => {
  const auth = request.auth
  if (auth?.uid == null) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  const uid = auth.uid
  const communityAccount = request.data.communityAccount
  const token = request.data.token
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
  const enterpriseId = community.enterprise_id
  if (enterpriseId == null || enterpriseId === '') {
    throw new HttpsError('failed-precondition', 'The community is not an enterprise community.')
  }

  const tokenEnterpriseId = auth.token.enterprise_id as string | undefined
  if (tokenEnterpriseId !== enterpriseId) {
    throw new HttpsError('permission-denied', 'enterprise mismatch')
  }
  await assertActiveEnterpriseMember(enterpriseId, uid)

  await community.inviteAsManager(uid, token)
})
