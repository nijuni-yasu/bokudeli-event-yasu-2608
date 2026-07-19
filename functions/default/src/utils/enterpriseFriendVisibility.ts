import type { ShokujiiUser } from '../stores/user.js'
import { getEnterpriseMember } from '../stores/enterprise.js'

export type EnterpriseFriendVisibility = {
  include: boolean
  is_guest_friend?: boolean
  is_linkable?: boolean
}

/**
 * エンプラ友人一覧の表示可否（global friends doc は変更しない）。
 * 仕様 §5.3.2。
 */
export const classifyEnterpriseFriend = async (
  friendUser: ShokujiiUser,
  enterpriseId: string,
): Promise<EnterpriseFriendVisibility> => {
  if (friendUser.is_deleted) {
    return { include: false }
  }

  const friendEnterpriseId = friendUser.enterprise_id
  if (friendEnterpriseId != null && friendEnterpriseId !== '' && friendEnterpriseId !== enterpriseId) {
    return { include: false }
  }

  if (friendEnterpriseId == null || friendEnterpriseId === '') {
    return { include: true, is_guest_friend: true, is_linkable: false }
  }

  const member = await getEnterpriseMember(enterpriseId, friendUser.user_id)
  if (member == null || !member.is_active) {
    return { include: false }
  }

  return { include: true, is_guest_friend: false, is_linkable: true }
}
