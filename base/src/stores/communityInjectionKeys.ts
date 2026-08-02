import type { InjectionKey } from 'vue'
import type { CommunityStoreScope } from '@shokujii/base/stores/community.js'

/**
 * Enterprise 等が provide するコミュニティ store スコープ。
 * 未 provide 時は PF（`enterprise_id == null`）として扱う。
 */
export const injectionKeyCommunityStoreScope: InjectionKey<() => CommunityStoreScope | undefined> =
  Symbol('communityStoreScope')
