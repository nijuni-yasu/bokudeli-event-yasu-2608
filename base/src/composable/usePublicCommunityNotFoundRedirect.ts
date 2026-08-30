import { storeToRefs } from 'pinia'

import { usePublicResourceNotFoundRedirect } from '@shokujii/base/composable/usePublicResourceNotFoundRedirect.js'
import { useCommunityStore, type CommunityStore, type CommunityStoreScope } from '@shokujii/base/stores/community.js'

export const usePublicCommunityNotFoundRedirect = (communityAccount: string, scope?: CommunityStoreScope): void => {
  const communityStore = useCommunityStore(communityAccount, scope) as CommunityStore
  const { exists } = storeToRefs(communityStore)
  usePublicResourceNotFoundRedirect(exists)
}
