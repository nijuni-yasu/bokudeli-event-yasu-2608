import { inject } from 'vue'
import {
  resolveEventStoreOptionsFromInjectedEnterpriseId,
  useEventStore,
  type BokudeliEvent,
  type EventStore,
} from '@shokujii/base/stores/event.js'
import { injectionKeyCommunityStoreScope } from '@shokujii/base/stores/communityInjectionKeys.js'
import { resolveInjectedCommunityScope } from '@shokujii/base/composable/useAppCommunityStore.js'

/**
 * setup 内で一度だけ呼び、返却関数を computed / 非同期処理から使う。
 * （computed 等から `useAppEventStore` を直接呼ぶと inject コンテキスト外になる）
 */
export function useCreateAppEventStore(): (target: string | BokudeliEvent) => EventStore {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return (target: string | BokudeliEvent) => {
    const enterpriseId = scopeFromApp?.()?.enterpriseId
    return useEventStore(target, resolveEventStoreOptionsFromInjectedEnterpriseId(enterpriseId))
  }
}

/**
 * アプリ注入の enterpriseId で event store オプションを組み立てる。
 * - user/partner: provide なし → `{}`（main の default merge）
 * - enterprise: App.vue の provide 経由
 */
export function useAppEventStore(target: string | BokudeliEvent): EventStore {
  const enterpriseId = resolveInjectedCommunityScope()?.enterpriseId
  return useEventStore(target, resolveEventStoreOptionsFromInjectedEnterpriseId(enterpriseId))
}
