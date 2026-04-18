import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collection,
  collectionGroup,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { eventConverter, type BokudeliEvent } from './event.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'

const memberOrderConverter: FirestoreDataConverter<EventMemberOrder> = {
  toFirestore(order: EventMemberOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMemberOrder {
    const data = snapshot.data(options)
    return new EventMemberOrder(snapshot.id, data)
  },
}

export type UserEventListOrderEntry = {
  orders: EventMemberOrder[] | null
  loading: boolean
  error: unknown | null
}

export type UserEventListStore = ReturnType<typeof useUserEventListByUserId>

/**
 * プロフィールの注文一覧用。`userId` は `fetchUser` 解決後の Shokujii `user_id` を渡すこと。
 */
export const useUserEventListByUserId = (userId: string, pageSize: number = 6) => {
  const storeId = userId !== '' ? userId : '_empty'
  const store = defineStore(`/userEventList/${storeId}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const events = ref<BokudeliEvent[]>([])
    const totalCount = ref<number | null>(null)
    const orderStateByEventId = ref<Record<string, UserEventListOrderEntry>>({})

    const eventsSnapshot: QueryDocumentSnapshot<BokudeliEvent>[] = []

    const userMemberRef = doc(db, 'users', userId !== '' ? userId : '__none__')

    const patchOrderState = (eventId: string, patch: Partial<UserEventListOrderEntry>) => {
      const prev = orderStateByEventId.value[eventId] ?? {
        orders: null,
        loading: false,
        error: null,
      }
      orderStateByEventId.value = {
        ...orderStateByEventId.value,
        [eventId]: { ...prev, ...patch },
      }
    }

    const fetchMemberOrders = async (
      communityId: string,
      eventId: string,
      memberUserId: string,
    ): Promise<EventMemberOrder[]> => {
      const coll = collection(
        db,
        'communities',
        communityId,
        'events',
        eventId,
        'members',
        memberUserId,
        'member_orders',
      ).withConverter(memberOrderConverter)
      const q = query(coll, orderBy('updated_at', 'desc'))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data()).filter((o) => o.status !== 'in_cart')
    }

    const loadOrdersForEvent = async (event: BokudeliEvent) => {
      const id = event.event_id
      if (userId === '') return
      try {
        patchOrderState(id, { loading: true, error: null })
        const list = await fetchMemberOrders(event.community_id, event.event_id, userId)
        patchOrderState(id, { orders: list, loading: false, error: null })
      } catch (e) {
        console.error('Failed to fetch member_orders:', e)
        patchOrderState(id, { orders: null, loading: false, error: e })
      }
    }

    const loadOrdersForEventsParallel = async (newEvents: BokudeliEvent[]) => {
      await Promise.all(newEvents.map((ev) => loadOrdersForEvent(ev)))
    }

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
            )
            totalCount.value = (await getCountFromServer(countQ)).data().count
          }
          const lastVisible = eventsSnapshot[eventsSnapshot.length - 1]
          const q = query(
            collectionGroup(db, 'events'),
            where('is_deleted', '==', false),
            where('members', 'array-contains', userMemberRef),
            orderBy('event_start_datetime', 'desc'),
            ...(lastVisible == null ? [] : [startAfter(lastVisible)]),
            limit(pageSize),
          ).withConverter(eventConverter)
          const querySnapshot = await getDocs(q)
          const newEvents = querySnapshot.docs.map((d) => d.data())
          eventsSnapshot.push(...querySnapshot.docs)
          events.value = [...events.value, ...newEvents]
          for (const ev of newEvents) {
            patchOrderState(ev.event_id, { orders: null, loading: true, error: null })
          }
          await loadOrdersForEventsParallel(newEvents)
        } catch (error) {
          console.error('Failed to fetch user events:', error)
        }
      })
    }

    const reload = () => {
      eventsSnapshot.splice(0)
      events.value = []
      totalCount.value = null
      orderStateByEventId.value = {}
      if (storeId !== '_empty') {
        next()
      }
    }

    const reloadOrdersForEvent = async (eventId: string) => {
      const event = events.value.find((e) => e.event_id === eventId)
      if (event == null || userId === '') {
        return
      }
      await loadOrdersForEvent(event)
    }

    if (storeId !== '_empty') {
      reload()
    }

    return {
      events,
      totalCount,
      orderStateByEventId,
      next,
      reload,
      reloadOrdersForEvent,
    }
  })
  return store()
}
