import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collectionGroup,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { eventConverter, type BokudeliEvent } from './event.js'
import { profileListFilterKey, profileListFilterToConstraints, type ProfileListFilter } from './profileListFilter.js'

export type UserEventListStore = ReturnType<typeof useUserEventListByUserId>

export type UserEventListStoreOptions = {
  /** PF 露出 / エンプラテナント等。`collectionGroup('events')` の base 条件に追加する */
  profileFilter?: ProfileListFilter
  /** false のとき store 生成時は fetch しない（呼び出し元が reload/next する）。`userOrderHistoryList` と同様 */
  autoLoad?: boolean
}

/**
 * プロフィールの参加イベント一覧用。`userId` は `fetchUser` 解決後の Shokujii `user_id` を渡すこと。
 */
export const useUserEventListByUserId = (
  userId: string,
  pageSize: number = 6,
  options: UserEventListStoreOptions = {},
) => {
  const profileFilter = options.profileFilter ?? { kind: 'none' }
  const autoLoad = options.autoLoad ?? true
  const additionalFilters = profileListFilterToConstraints(profileFilter)
  const storeId = userId !== '' ? userId : '_empty'
  const filtersKey = `/${profileListFilterKey(profileFilter)}`
  const store = defineStore(`/userEventList/${storeId}/${pageSize}${filtersKey}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const events = ref<BokudeliEvent[]>([])
    const totalCount = ref<number | null>(null)

    const eventsSnapshot: QueryDocumentSnapshot<BokudeliEvent>[] = []

    const userMemberRef = doc(db, 'users', userId !== '' ? userId : '__none__')

    const next = () => {
      if (storeId === '_empty') {
        return
      }
      if (paginationExecutor.totalTaskLength > 0) {
        return
      }
      paginationExecutor.addTask(async () => {
        try {
          if (totalCount.value == null) {
            const countQ = query(
              collectionGroup(db, 'events'),
              where('is_deleted', '==', false),
              where('members', 'array-contains', userMemberRef),
              ...additionalFilters,
            )
            totalCount.value = (await getCountFromServer(countQ)).data().count
          }
          const lastVisible = eventsSnapshot[eventsSnapshot.length - 1]
          const q = query(
            collectionGroup(db, 'events'),
            where('is_deleted', '==', false),
            where('members', 'array-contains', userMemberRef),
            ...additionalFilters,
            orderBy('event_start_datetime', 'desc'),
            ...(lastVisible == null ? [] : [startAfter(lastVisible)]),
            limit(pageSize),
          ).withConverter(eventConverter)
          const querySnapshot = await getDocs(q)
          const newEvents = querySnapshot.docs.map((d) => d.data())
          eventsSnapshot.push(...querySnapshot.docs)
          events.value = [...events.value, ...newEvents]
        } catch (error) {
          console.error('Failed to fetch user events:', error)
        }
      })
    }

    const reload = () => {
      eventsSnapshot.splice(0)
      events.value = []
      totalCount.value = null
      if (storeId !== '_empty') {
        next()
      }
    }

    if (storeId !== '_empty' && autoLoad) {
      reload()
    }

    return {
      events,
      totalCount,
      next,
      reload,
    }
  })
  return store()
}
