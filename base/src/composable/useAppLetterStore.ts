import { inject } from 'vue'
import { useLetterListStore, type LetterListStore } from '@shokujii/base/stores/letterList.js'
import { useLetterStore, type BokudeliLetter, type LetterStore } from '@shokujii/base/stores/letter.js'
import { injectionKeyCommunityStoreScope } from '@shokujii/base/stores/communityInjectionKeys.js'

/**
 * setup 内で一度だけ呼び、返却関数から inject スコープを都度解決する。
 */
export function useCreateAppLetterListStore(): (communityAccount: string, pageSize?: number) => LetterListStore {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return (communityAccount: string, pageSize: number = 3) => {
    const scope = scopeFromApp?.()
    return useLetterListStore(communityAccount, pageSize, scope)
  }
}

export function useCreateAppLetterStore(): (communityAccount: string, target: string | BokudeliLetter) => LetterStore {
  const scopeFromApp = inject(injectionKeyCommunityStoreScope, undefined)
  return (communityAccount: string, target: string | BokudeliLetter) => {
    const scope = scopeFromApp?.()
    return useLetterStore(communityAccount, target, scope)
  }
}
