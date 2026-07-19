import { ref } from 'vue'
import { defineStore } from 'pinia'
import { FirebaseError } from 'firebase/app'
import type { GetUserProfilePreviewResponse } from '@shokujii/common/apis/userProfile.js'
import { getUserProfilePreview } from '@shokujii/base/apis/userProfile.js'

export type UserProfilePreviewStore = ReturnType<typeof useUserProfilePreviewStore>

/**
 * `getUserProfilePreview` Callable で取得したプロフィールタブの初期データを保持する Pinia ストア。
 * ユーザーごとに 1 インスタンスを生成し、プロフィールタブの「プレビュー」とカウント表示に使う。
 */
export const useUserProfilePreviewStore = (targetUserId: string) => {
  const store = defineStore(`userProfilePreview/${targetUserId}`, () => {
    const data = ref<GetUserProfilePreviewResponse | null>(null)
    const loading = ref(false)
    const error = ref<unknown>(null)
    /** target ユーザー存在しない・退会済みのとき true（Callable が `not-found` を返した） */
    const notFound = ref(false)
    /** エンプラ: 他社・権限なしのとき true（Callable が `permission-denied` を返した） */
    const accessDenied = ref(false)

    const load = async () => {
      loading.value = true
      error.value = null
      notFound.value = false
      accessDenied.value = false
      try {
        const response = await getUserProfilePreview({ target_user_id: targetUserId })
        data.value = response.data
      } catch (err: unknown) {
        if (err instanceof FirebaseError && err.code === 'functions/not-found') {
          notFound.value = true
          data.value = null
        } else if (err instanceof FirebaseError && err.code === 'functions/permission-denied') {
          accessDenied.value = true
          data.value = null
        } else {
          error.value = err
        }
      } finally {
        loading.value = false
      }
    }

    const reload = () => {
      data.value = null
      load()
    }

    load()

    return {
      data,
      loading,
      error,
      notFound,
      accessDenied,
      load,
      reload,
    }
  })
  return store()
}
