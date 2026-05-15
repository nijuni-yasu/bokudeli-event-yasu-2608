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
  /** 取得する友だちの上限。指定時はそれ以上 `next` しない（ページングは `IncrementalLoader` 等のまま） */
  maxTotal?: number,
) => {
  const storeKeySuffix = maxTotal === undefined ? 'all' : String(maxTotal)
  const store = defineStore(`userFriends/${targetUserId}/${sortBy}/${pageSize}/${storeKeySuffix}`, () => {
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
      if (maxTotal !== undefined && friends.value.length >= maxTotal) {
        hasMore.value = false
        return
      }
      paginationExecutor.addTask(async () => {
        loading.value = true
        error.value = null
        try {
          const remainingSlots = maxTotal === undefined ? undefined : maxTotal - friends.value.length
          if (remainingSlots !== undefined && remainingSlots <= 0) {
            hasMore.value = false
            return
          }
          const requestLimit = remainingSlots === undefined ? pageSize : Math.min(pageSize, remainingSlots)

          const response = await getUserFriends({
            target_user_id: targetUserId,
            limit: requestLimit,
            sort_by: sortBy,
            cursor: cursor.value,
          })
          const data = response.data
          friends.value.push(...data.friends)
          if (maxTotal !== undefined && friends.value.length > maxTotal) {
            friends.value = friends.value.slice(0, maxTotal)
          }
          const underCap = maxTotal === undefined || friends.value.length < maxTotal
          hasMore.value = Boolean(underCap && data.has_more)
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
