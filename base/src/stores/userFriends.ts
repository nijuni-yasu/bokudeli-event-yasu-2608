import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { UserFriendListItem, UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import { getUserFriends } from '@shokujii/base/apis/userFriends.js'
import { TaskExecutor } from '@shokujii/base/utils/executors'

export type UserFriendsStore = ReturnType<typeof useUserFriendsStore>

export const useUserFriendsStore = (
  targetUserId: string,
  sortBy: UserFriendsSortBy = 'meet_count',
  pageSize: number = 10,
) => {
  const store = defineStore(`userFriends/${targetUserId}/${sortBy}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const friends = ref<UserFriendListItem[]>([])
    const hasMore = ref(true)
    const loading = ref(false)
    const error = ref<unknown>(null)
    const cursor = ref<string | null>(null)

    const next = () => {
      if (targetUserId === '') return
      if (paginationExecutor.totalTaskLength > 0 || !hasMore.value) {
        return
      }
      paginationExecutor.addTask(async () => {
        loading.value = true
        error.value = null
        try {
          const response = await getUserFriends({
            target_user_id: targetUserId,
            limit: pageSize,
            sort_by: sortBy,
            cursor: cursor.value,
          })
          const data = response.data
          friends.value.push(...data.friends)
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
      friends.value = []
      hasMore.value = true
      error.value = null
      cursor.value = null
      next()
    }

    reload()

    return {
      friends,
      hasMore,
      loading,
      error,
      next,
      reload,
    }
  })

  return store()
}
