import { ref, watchEffect, type Ref, type ComputedRef } from 'vue'
import type { CommunityStore } from '@shokujii/base/stores/community'

/**
 * コミュニティのメンバーシップフラグを計算する composable
 * サポートアカウントのロール拡張を考慮する
 *
 * @param communityStore - コミュニティストア
 * @param currentUserId - 現在のユーザーID（computed ref）
 * @returns isMember と isManager の ref
 */
export const useCommunityMemberFlags = (
  communityStore: CommunityStore,
  currentUserId: ComputedRef<string | null>,
): { isMember: Ref<boolean>; isManager: Ref<boolean> } => {
  const isMember = ref(false)
  const isManager = ref(false)

  // リアルタイムにコミュニティのメンバー情報を更新
  // getCurrentUserRoles() を使用してサポートアカウントのロール拡張を考慮
  watchEffect(async () => {
    const uid = currentUserId.value
    const community = communityStore.community
    if (uid == null || community == null) {
      isMember.value = false
      isManager.value = false
      return
    }

    // community.members/community.managers から判定
    const isMemberFromCommunity = community.members?.some((memberRef) => memberRef.id === uid) ?? false
    const isManagerFromCommunity = community.managers?.some((managerRef) => managerRef.id === uid) ?? false

    // getCurrentUserRoles() を使用してサポートアカウントのロール拡張を考慮
    try {
      const roles = await communityStore.getCurrentUserRoles()
      if (roles != null) {
        // ロールが取得できた場合、サポートアカウントのロール拡張が考慮されている
        // サポートアカウントの場合、メンバーでなくてもロールに manager が追加される
        const hasManagerRole = roles.includes('manager')

        // isMember: community.members に含まれているかで判定
        // サポートアカウントはメンバーでなくてもマネージャーとして扱われるが、isMember は実際のメンバーシップを反映
        isMember.value = isMemberFromCommunity

        // isManager: ロールに manager が含まれているか、community.managers に含まれているか
        // サポートアカウントの場合は roles に manager が追加されるため、これが優先される
        isManager.value = hasManagerRole || isManagerFromCommunity
      } else {
        // ロールが取得できない場合、community.members/community.managers のみを使用
        isMember.value = isMemberFromCommunity
        isManager.value = isManagerFromCommunity
      }
    } catch (error) {
      // エラーが発生した場合、community.members/community.managers のみを使用
      console.error('Failed to get current user roles:', error)
      isMember.value = isMemberFromCommunity
      isManager.value = isManagerFromCommunity
    }
  })

  return {
    isMember,
    isManager,
  }
}
