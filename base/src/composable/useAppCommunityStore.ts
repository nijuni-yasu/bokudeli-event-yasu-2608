import { inject } from 'vue'
import {
  useCommunityStore,
  type BokudeliCommunity,
  type CommunityStore,
  type CommunityStoreScope,
} from '@shokujii/base/stores/community.js'
import { injectionKeyCommunityStoreScope } from '@shokujii/base/stores/communityInjectionKeys.js'

/** setup 内でのみ呼ぶ。Enterprise は App.vue の provide、user は provide なし（PF）。 */
export function resolveInjectedCommunityScope(): CommunityStoreScope | undefined {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return scopeFromApp?.()
}

/**
 * アプリ注入スコープ付きでコミュニティ store を取得する。
 * - user: provide なし → PF（`enterprise_id == null`）
 * - enterprise: App.vue が `injectionKeyCommunityStoreScope` を provide
 * - shell で明示 tenant を渡す場合は `useEnterpriseCommunityStore` も可
 */
export function useAppCommunityStore(target: string | BokudeliCommunity): CommunityStore {
  return useCommunityStore(target, resolveInjectedCommunityScope())
}

/**
 * setup 内で一度だけ呼び、返却関数から inject スコープを都度解決する。
 * （computed / 非同期ハンドラから `resolveInjectedCommunityScope` を直接呼ぶと setup 時点のスナップショットになる）
 */
export function useCreateAppCommunityScope(): () => CommunityStoreScope | undefined {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return () => scopeFromApp?.()
}

/**
 * setup 内で一度だけ呼び、返却関数を computed / 非同期処理から使う。
 * （computed 等から `useAppCommunityStore` を直接呼ぶと inject コンテキスト外になる）
 */
export function useCreateAppCommunityStore(): (target: string | BokudeliCommunity) => CommunityStore {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return (target: string | BokudeliCommunity) => {
    const scope = scopeFromApp?.()
    return useCommunityStore(target, scope)
  }
}
