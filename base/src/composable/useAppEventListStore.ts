import { inject } from 'vue'
import { where, orderBy } from 'firebase/firestore'
import { useEventListStore, type EventListStore, type EventListStoreOptions } from '@shokujii/base/stores/eventList.js'
import { injectionKeyCommunityStoreScope } from '@shokujii/base/stores/communityInjectionKeys.js'

/**
 * 管理画面のコミュニティイベント一覧用。inject スコープを都度解決して collectionGroup フィルタを組み立てる。
 */
export function useCreateAppCommunityEventListStore(): (
  communityAccount: string,
  pageSize: number,
  options?: EventListStoreOptions,
) => EventListStore {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return (communityAccount: string, pageSize: number, options: EventListStoreOptions = {}) => {
    const enterpriseId = scopeFromApp?.()?.enterpriseId ?? null
    return useEventListStore(
      [
        where('enterprise_id', '==', enterpriseId),
        where('community_account', '==', communityAccount),
        orderBy('event_start_datetime', 'desc'),
      ],
      pageSize,
      options,
    )
  }
}
