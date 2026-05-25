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

export const useEventListStore = (filters: QueryConstraint[] | null = null, pageSize: number = 3) => {
  const store = defineStore(filters == null ? 'eventList' : `eventList/${JSON.stringify(filters)}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const eventStores = ref<EventStore[] | null>(null)
    const totalCount = ref<number | null>(null)

    const eventsSnapsthot: QueryDocumentSnapshot<BokudeliEvent>[] = []

    const next = () => {
      if (paginationExecutor.totalTaskLength > 0 || filters == null) {
        return
      }
      paginationExecutor.addTask(async () => {
        if (totalCount.value == null) {
          const q = query(collectionGroup(db, 'events'), where('is_deleted', '==', false), ...filters)
          totalCount.value = (await getCountFromServer(q)).data().count
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
        eventsSnapsthot.push(...querySnapshot.docs)
        window.setTimeout(() => {
          eventStores.value = eventsSnapsthot.flatMap((doc) => {
            try {
              return useEventStore(doc.data())
            } catch (err) {
              console.error(err)
              reportClientError(err, { documentPath: doc.ref.path, severity: 'warn' })
              return []
            }
          })
        })
      })
    }

    const reload = () => {
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
