import { useCommunityStore, type CommunityStore, type CommunityStoreScope } from '@shokujii/base/stores/community.js'
import { useCommunityMemberFlags } from '@shokujii/base/composable/useCommunityMemberFlags'
import { useEnterpriseId } from '@/composable/useEnterpriseId'

function requireEnterpriseId(enterpriseId: string | null | undefined): string {
  if (enterpriseId == null || enterpriseId === '') {
    throw new Error('Enterprise is not resolved')
  }
  return enterpriseId
}

/** setup 内で呼ぶ。解決済み enterpriseId から community store 用スコープを組み立てる。 */
export function buildEnterpriseCommunityScope(): CommunityStoreScope {
  const { enterpriseId } = useEnterpriseId()
  return { enterpriseId: requireEnterpriseId(enterpriseId.value) }
}

export function useEnterpriseCommunityStore(communityAccount: string): CommunityStore {
  return useCommunityStore(communityAccount, buildEnterpriseCommunityScope())
}

export function useEnterpriseCommunityMemberFlags(communityAccount: string) {
  return useCommunityMemberFlags(communityAccount, buildEnterpriseCommunityScope())
}
