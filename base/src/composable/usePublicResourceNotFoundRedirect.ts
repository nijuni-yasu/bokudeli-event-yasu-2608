import { watch, type Ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Firestore で存在が確定した（exists === false）公開リソースのみ /404 へ遷移する。
 * getLoadedEvent のタイムアウトとは別経路（P2.5-2: 誤 404 → noindex を防ぐ）。
 */
export const usePublicResourceNotFoundRedirect = (exists: Ref<boolean | null>): void => {
  const router = useRouter()

  watch(
    exists,
    (value) => {
      if (value === false) {
        void router.replace('/404')
      }
    },
    { immediate: true },
  )
}
