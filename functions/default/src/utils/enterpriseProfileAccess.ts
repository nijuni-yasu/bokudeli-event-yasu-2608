import { HttpsError } from 'firebase-functions/https'
import type { CallableRequest } from 'firebase-functions/https'
import { getEnterpriseMember } from '../stores/enterprise.js'
import { getUser, type ShokujiiUser } from '../stores/user.js'

export type EnterpriseProfileAccessContext = {
  viewerEnterpriseId: string
  targetUser: ShokujiiUser
  department: string | null
}

const getTokenEnterpriseId = (token: Record<string, unknown>): string | undefined => {
  const enterpriseId = token.enterprise_id
  return typeof enterpriseId === 'string' && enterpriseId !== '' ? enterpriseId : undefined
}

export const isEnterpriseViewer = (auth: CallableRequest['auth']): boolean => {
  if (auth?.token == null) {
    return false
  }
  return getTokenEnterpriseId(auth.token as Record<string, unknown>) != null
}

/**
 * エンタープライズ版マイページ・友人 Callable の入口認可（仕様 §5.2.1）。
 * PF 版 viewer（claims に enterprise_id なし）では呼ばないこと。
 */
export const assertEnterpriseProfileAccess = async (
  auth: CallableRequest['auth'],
  targetUserId: string,
): Promise<EnterpriseProfileAccessContext> => {
  if (auth?.uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  const viewerEnterpriseId = getTokenEnterpriseId(auth.token as Record<string, unknown>)
  if (viewerEnterpriseId == null) {
    throw new HttpsError('permission-denied', '閲覧権限がありません')
  }

  const targetUser = await getUser(targetUserId, false)
  if (targetUser == null || targetUser.is_deleted) {
    throw new HttpsError('not-found', '存在しないユーザーです')
  }

  const targetEnterpriseId = targetUser.enterprise_id
  if (targetEnterpriseId == null || targetEnterpriseId === '') {
    throw new HttpsError('not-found', '存在しないユーザーです')
  }

  if (viewerEnterpriseId !== targetEnterpriseId) {
    throw new HttpsError('permission-denied', '閲覧権限がありません')
  }

  const targetMember = await getEnterpriseMember(viewerEnterpriseId, targetUserId)
  if (targetMember == null || !targetMember.is_active) {
    throw new HttpsError('not-found', '存在しないユーザーです')
  }

  const department = targetMember.department ?? null

  return {
    viewerEnterpriseId,
    targetUser,
    department,
  }
}
