import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserProfileFoodPreviewItem } from '@shokujii/common/apis/userProfile.js'
import { getUserFoods } from '@shokujii/base/apis/userProfile.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'

export type UserFoodsStore = ReturnType<typeof useUserFoodsStore>

export const useUserFoodsStore = (targetUserId: string, pageSize: number = 12) => {
  const store = defineStore(`userFoods/${targetUserId}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const foods = ref<UserProfileFoodPreviewItem[]>([])
    const hasMore = ref(true)
    const loading = ref(false)
    const error = ref<unknown>(null)
    const cursor = ref<string | null>(null)

    const next = () => {
      if (targetUserId === '') return
      if (paginationExecutor.totalTaskLength > 0 || !hasMore.value) return

      paginationExecutor.addTask(async () => {
        loading.value = true
        error.value = null
        try {
          const response = await getUserFoods({
            target_user_id: targetUserId,
            limit: pageSize,
            cursor: cursor.value,
          })
          const data = response.data
          foods.value.push(...data.foods)
          hasMore.value = data.has_more
          cursor.value = data.next_cursor
        } catch (err: unknown) {
          error.value = err
        } finally {
          loading.value = false
        }
      })
    }

    const reload = () => {
      paginationExecutor.clear()
      foods.value = []
      hasMore.value = true
      error.value = null
      cursor.value = null
      next()
    }

    reload()

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
