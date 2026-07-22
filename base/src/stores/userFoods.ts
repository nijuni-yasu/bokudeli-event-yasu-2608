import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfileFoodPreviewItem } from '@shokujii/common/apis/userProfile.js'
import { getUserFoods } from '@shokujii/base/apis/userProfile.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'

export type UserFoodsStore = ReturnType<typeof useUserFoodsStore>

export type UserFoodsStoreOptions = {
  /** false のとき store 生成時は fetch しない（呼び出し元が reload/next する）。`userOrderHistoryList` と同様 */
  autoLoad?: boolean
}

export const useUserFoodsStore = (targetUserId: string, pageSize: number = 12, options: UserFoodsStoreOptions = {}) => {
  const autoLoad = options.autoLoad ?? true
  const store = defineStore(`userFoods/${targetUserId}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const foods = ref<UserProfileFoodPreviewItem[]>([])
    const hasMore = ref(true)
    const loading = ref(false)
    const error = ref<unknown>(null)
    const cursor = ref<string | null>(null)
    /** reload 後に完了した古い fetch の結果を push しない（認証確定時の二重 reload 対策） */
    let loadGeneration = 0

    const next = () => {
      if (targetUserId === '') return
      if (paginationExecutor.totalTaskLength > 0 || !hasMore.value) return

      const generation = loadGeneration
      paginationExecutor.addTask(async () => {
        loading.value = true
        error.value = null
        try {
          const response = await getUserFoods({
            target_user_id: targetUserId,
            limit: pageSize,
            cursor: cursor.value,
          })
          if (generation !== loadGeneration) return
          const data = response.data
          foods.value.push(...data.foods)
          hasMore.value = data.has_more
          cursor.value = data.next_cursor
        } catch (err: unknown) {
          if (generation !== loadGeneration) return
          error.value = err
        } finally {
          if (generation === loadGeneration) {
            loading.value = false
          }
        }
      })
    }

    const reload = () => {
      loadGeneration += 1
      paginationExecutor.clear()
      foods.value = []
      hasMore.value = true
      error.value = null
      cursor.value = null
      next()
    }

    if (targetUserId !== '' && autoLoad) {
      reload()
    }

    return {
      foods,
      hasMore,
      loading,
      error,
      next,
      reload,
    }
  })

  return store()
}
