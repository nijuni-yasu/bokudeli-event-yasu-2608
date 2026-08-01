import { ref, watchEffect, computed, type Ref } from 'vue'
import { useCommunityStore, type CommunityStore, type CommunityStoreScope } from '@shokujii/base/stores/community'
import { useCurrentUserStore } from '@shokujii/base/stores/currentUser'

/**
 * コミュニティのメンバーシップフラグを計算する composable
 * サポートアカウントのロール拡張を考慮する
 *
 * @param communityAccount - コミュニティアカウント（URL スラッグ）。useCommunityStore に渡す値
 * @returns isMember と isManager の ref
 */
export const useCommunityMemberFlags = (
  communityAccount: string,
  scope?: CommunityStoreScope,
): { isMember: Ref<boolean>; isManager: Ref<boolean> } => {
  const communityStore = useCommunityStore(communityAccount, scope) as CommunityStore
  const currentUserStore = useCurrentUserStore()
  const currentUserId = computed(() => currentUserStore.firebaseUser?.uid ?? null)

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
