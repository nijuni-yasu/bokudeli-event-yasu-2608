import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { Store, StateTree } from 'pinia'
import { db } from '@shokujii/base/firebase'
import { eventConverter, type BokudeliEvent } from '@shokujii/base/stores/event.js'
import {
  doc,
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  limit,
  startAfter,
  Timestamp,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from 'firebase/firestore'
import { TaskExecutor } from '@shokujii/base/utils/executors'
import { useEventStore, type EventStore } from './event'

type EventListStoreState = {
  totalCount: Ref<number | null>
} & StateTree

type EventListStoreGetters = {
  eventStores: Ref<EventStore[] | null>
}

type EventListStoreAction = {
  reload: () => void
  next: () => void
  createNewEvent: (event: BokudeliEvent, coverImage?: File | null) => Promise<BokudeliEvent>
}

export type EventListStore = Store<string, EventListStoreState, EventListStoreGetters, EventListStoreAction>

export const useEventListStore = (filters: QueryConstraint[] | null = null, pageSize: number = 3): EventListStore => {
  const store = defineStore<string, EventListStoreState & EventListStoreGetters & EventListStoreAction>(
    filters == null ? 'eventList' : `eventList/${JSON.stringify(filters)}/${pageSize}`,
    () => {
      const pagenationExecutor = new TaskExecutor(1)
      const eventStores = ref<EventStore[] | null>(null)
      const totalCount = ref<number | null>(null)

      const eventsSnapsthot: QueryDocumentSnapshot<BokudeliEvent>[] = []

      const next = () => {
        if (pagenationExecutor.totalTaskLength > 0 || filters == null) {
          return
        }
        pagenationExecutor.addTask(async () => {
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

      const createNewEvent = async (event: BokudeliEvent, coverImage?: File | null): Promise<BokudeliEvent> => {
        const communityRef = doc(db, 'communities', event.community_id)
        const community = await getDoc(communityRef)
        if (!community.exists()) {
          throw new Error(`community ${event.community_id} does not exists`)
        }
        const newEventRef = doc(collection(communityRef, 'events')).withConverter(eventConverter)
        await setDoc(
          newEventRef,
          {
            ...event,
            event_id: newEventRef.id,
            community_name: community.get('community_name'),
            community_account: community.get('community_account'),
            created_at: Timestamp.now(),
            updated_at: Timestamp.now(),
          },
          { merge: true },
        )
        if (coverImage != null) {
          const eventStore = useEventStore(newEventRef.id) as EventStore
          await eventStore.updateCoverImage(coverImage)
        }
        return (await getDoc(newEventRef)).data()!
      }

      reload()

      return {
        totalCount,
        eventStores,
        reload,
        next,
        createNewEvent,
      }
    },
  )
  return store() as EventListStore
}
