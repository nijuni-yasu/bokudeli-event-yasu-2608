import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * プロフィール画像 upload 後の Storage サムネイル URL キャッシュ bust 用。
 * Firestore 非依存。UserAvatar 表示時に useUserStore を起動しないためここで管理する。
 */
export const useUserImageCacheStore = defineStore('userImageCache', () => {
  const cacheBusters = ref(new Map<string, number>())

  const bump = (userId: string) => {
    cacheBusters.value = new Map(cacheBusters.value).set(userId, Date.now())
  }

  const getCacheBuster = (userId: string): number => {
    return cacheBusters.value.get(userId) ?? 0
  }

  return {
    cacheBusters,
    bump,
    getCacheBuster,
  }
})
