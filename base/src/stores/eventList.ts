import { ref } from 'vue'
import { defineStore } from 'pinia'
import { db } from '@shokujii/base/firebase'
import { eventConverter, type BokudeliEvent } from '@shokujii/base/stores/event.js'
import {
  collectionGroup,
  getDocs,
  query,
  where,
  limit,
  startAfter,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore'
import { TaskExecutor } from '@shokujii/base/utils/executors'
import { reportClientError } from '@shokujii/base/utils/reportClientError.js'
import { useEventStore, type EventStore } from './event'

export type EventListStore = ReturnType<typeof useEventListStore>

export type EventListStoreOptions = {
  /**
   * true のとき、1ページ取得後に loadedCount < totalCount なら store 側で next() を連鎖する。
   * manage イベント一覧グリッドなど、IncrementalLoader のビューポート判定に依存しない全件読み込み向け。
   */
  autoContinue?: boolean
}

export const useEventListStore = (
  filters: QueryConstraint[] | null = null,
  pageSize: number = 3,
  options: EventListStoreOptions = {},
) => {
  const store = defineStore(filters == null ? 'eventList' : `eventList/${JSON.stringify(filters)}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const eventStores = ref<EventStore[] | null>(null)
    const totalCount = ref<number | null>(null)
    let currentRequestId = 0

    const eventsSnapsthot: QueryDocumentSnapshot<BokudeliEvent>[] = []

    const next = () => {
      if (filters == null) {
        return
      }
      if (options.autoContinue !== true && paginationExecutor.totalTaskLength > 0) {
        return
      }
      const requestId = currentRequestId
      // autoContinue 時は TaskExecutor が直列実行するため、実行中でも addTask でキューに積む（早期 return すると連鎖が途切れる）
      paginationExecutor.addTask(async () => {
        if (totalCount.value == null) {
          const q = query(collectionGroup(db, 'events'), where('is_deleted', '==', false), ...filters)
          const count = (await getCountFromServer(q)).data().count
          if (requestId !== currentRequestId) {
            return
          }
          totalCount.value = count
        }
        const lastVisibleDocument = eventsSnapsthot[eventsSnapsthot.length - 1]
        const q = query(
          collectionGroup(db, 'events'),
          where('is_deleted', '==', false),
          ...filters,
          ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
          limit(pageSize),
        ).withConverter(eventConverter)
        const querySnapshot = await getDocs(q)
        if (requestId !== currentRequestId) {
          return
        }
        eventsSnapsthot.push(...querySnapshot.docs)
        eventStores.value = eventsSnapsthot.flatMap((doc) => {
          try {
            return useEventStore(doc.data())
          } catch (err) {
            console.error(err)
            reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
            return []
          }
        })
        if (
          options.autoContinue === true &&
          querySnapshot.docs.length > 0 &&
          totalCount.value != null &&
          eventsSnapsthot.length < totalCount.value
        ) {
          next()
        }
      })
    }

    const reload = () => {
      currentRequestId += 1
      paginationExecutor.clear()
      eventsSnapsthot.splice(0) // clear
      eventStores.value = null
      totalCount.value = null
      next()
    }

    reload()

    return {
      totalCount,
      eventStores,
      reload,
      next,
    }
  })
  return store()
}
