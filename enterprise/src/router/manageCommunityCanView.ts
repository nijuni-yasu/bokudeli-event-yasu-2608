import type { BokudeliCommunity } from '@shokujii/base/stores/community.js'
import { FIRESTORE_LOADING } from '@shokujii/base/utils/const.js'
import type { ConfigGlobal } from '@shokujii/common/schemas/Config.js'

/** 管理コミュニティガード: subscribe 打ち切り後も community が null のとき pending が解消されない問題対策 */
export const MANAGE_COMMUNITY_GUARD_TIMEOUT_MS = 8000

export type ManageCommunityGuardSnapshot = {
  config: ConfigGlobal | typeof FIRESTORE_LOADING | null | undefined
  community: BokudeliCommunity | null | undefined
  currentUserId: string | undefined
  enterpriseId: string | undefined
  isSupport: boolean
}

/** 判定完了なら boolean、community 確定待ちなら null */
export function evaluateManageCommunityCanView(snapshot: ManageCommunityGuardSnapshot): boolean | null {
  if (snapshot.config !== FIRESTORE_LOADING && snapshot.isSupport) {
    return true
  }

  const community = snapshot.community ?? null
  const currentUserId = snapshot.currentUserId
  const enterpriseId = snapshot.enterpriseId

  if (enterpriseId == null || enterpriseId === '') {
    return null
  }

  if (community != null && community.enterprise_id !== enterpriseId) {
    return false
  }

  if (community != null && currentUserId != null) {
    return community.managers.some((managerRef) => managerRef.id === currentUserId)
  }

  return null
}
