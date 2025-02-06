import { type Ref } from 'vue'
import { db } from '@/firebase'
import BokudeliEvent from '@/schemes/bokudeliEvent'
import {
  doc,
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  setDoc,
  query,
  limit,
  startAfter,
  Timestamp,
  getCountFromServer,
  type QueryDocumentSnapshot,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { convertDocumentDataToEvent } from '@/schemes/converter'
import type { Store, StateTree } from 'pinia'
import { TaskExecutor } from '@/utils/executors'
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

      const eventsSnapsthot: QueryDocumentSnapshot[] = []

      const next = () => {
        if (pagenationExecutor.totalTaskLength > 0 || filters == null) {
          return
        }
        pagenationExecutor.addTask(async () => {
          if (totalCount.value == null) {
            const q = query(collectionGroup(db, 'events'), ...filters)
            totalCount.value = (await getCountFromServer(q)).data().count
          }
          const lastVisibleDocument = eventsSnapsthot[eventsSnapsthot.length - 1]
          const q = query(
            collectionGroup(db, 'events'),
            ...filters,
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            limit(pageSize),
          )
          const querySnapshot = await getDocs(q)
          eventsSnapsthot.push(...querySnapshot.docs)
          window.setTimeout(() => {
            eventStores.value = eventsSnapsthot.map((doc) => useEventStore(doc) as EventStore)
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
        const newEventRef = doc(collection(communityRef, 'events'))
        await setDoc(newEventRef, {
          ...event,
          event_id: newEventRef.id,
          community_name: community.get('community_name'),
          community_account: community.get('community_account'),
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
        if (coverImage != null) {
          const eventStore = useEventStore(newEventRef.id) as EventStore
          await eventStore.updateCoverImage(coverImage)
        }
        return convertDocumentDataToEvent((await getDoc(newEventRef)).data() as DocumentData)
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
