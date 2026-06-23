import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collectionGroup,
  doc,
  getDoc,
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
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import {
  fetchMemberOrdersForUser,
  memberOrderConverter,
  sortEventsByStartDatetime,
  type UserEventListOrderEntry,
} from './userEventOrdersShared.js'

export type UserOrderHistoryListStore = ReturnType<typeof useUserOrderHistoryByUserId>

const ORDERS_SCAN_BATCH = 24
const MAX_SCAN_BATCHES_PER_NEXT = 50

/**
 * プロフィールの注文履歴タブ用。`userId` は `fetchUser` 解決後の Shokujii `user_id` を渡すこと。
 * `member_orders` collectionGroup 起点でイベントを列挙する（全キャンセル後も表示）。
 * 初回取得は呼び出し元が `reload()` を実行すること（本人閲覧時のみ）。
 */
export const useUserOrderHistoryByUserId = (userId: string, pageSize: number = 6) => {
  const storeId = userId !== '' ? userId : '_empty'
  const store = defineStore(`/userOrderHistory/${storeId}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const events = ref<BokudeliEvent[]>([])
    const hasMore = ref(true)
    const initialLoaded = ref(false)
    const orderStateByEventId = ref<Record<string, UserEventListOrderEntry>>({})

    let lastOrderSnapshot: QueryDocumentSnapshot<EventMemberOrder> | null = null
    const loadedEventIds = new Set<string>()
    /** reload 後に完了した古い next の結果を反映しない（本人判定 watch 等の連続 reload 対策） */
    let loadGeneration = 0

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

    const loadOrdersForEvent = async (event: BokudeliEvent, generation: number) => {
      const id = event.event_id
      if (userId === '') return
      if (generation !== loadGeneration) return
      try {
        patchOrderState(id, { loading: true, error: null })
        const list = await fetchMemberOrdersForUser(event.community_id, event.event_id, userId)
        if (generation !== loadGeneration) return
        patchOrderState(id, { orders: list, loading: false, error: null })
      } catch (e) {
        if (generation !== loadGeneration) return
        console.error('Failed to fetch member_orders:', e)
        patchOrderState(id, { orders: null, loading: false, error: e })
      }
    }

    const loadOrdersForEventsParallel = async (newEvents: BokudeliEvent[], generation: number) => {
      await Promise.all(newEvents.map((ev) => loadOrdersForEvent(ev, generation)))
    }

    const fetchEvent = async (communityId: string, eventId: string): Promise<BokudeliEvent | null> => {
      const eventRef = doc(db, 'communities', communityId, 'events', eventId).withConverter(eventConverter)
      const snap = await getDoc(eventRef)
      if (!snap.exists()) {
        return null
      }
      const event = snap.data()
      if (event.is_deleted) {
        return null
      }
      return event
    }

    const scanOrdersBatch = async (
      maxNewEvents: number,
    ): Promise<{
      newEvents: BokudeliEvent[]
      ordersHasMore: boolean
    }> => {
      const q = query(
        collectionGroup(db, 'member_orders'),
        where('user_id', '==', userId),
        orderBy('updated_at', 'desc'),
        ...(lastOrderSnapshot == null ? [] : [startAfter(lastOrderSnapshot)]),
        limit(ORDERS_SCAN_BATCH),
      ).withConverter(memberOrderConverter)

      const querySnapshot = await getDocs(q)
      const docs = querySnapshot.docs
      const batchHasMore = docs.length === ORDERS_SCAN_BATCH

      if (docs.length === 0) {
        return { newEvents: [], ordersHasMore: false }
      }

      const batchEntries = docs.map((d) => ({ order: d.data(), doc: d }))
      const newEvents: BokudeliEvent[] = []
      const seenInBatch = new Set<string>()
      let lastProcessedDoc: QueryDocumentSnapshot<EventMemberOrder> = docs[docs.length - 1]

      for (const { order, doc: orderDoc } of batchEntries) {
        lastProcessedDoc = orderDoc

        if (order.status === 'in_cart') {
          continue
        }

        const eventId = order.event_id
        if (eventId === '' || order.community_id === '') {
          continue
        }

        if (loadedEventIds.has(eventId) || seenInBatch.has(eventId)) {
          continue
        }

        seenInBatch.add(eventId)

        const event = await fetchEvent(order.community_id, eventId)
        if (event == null) {
          continue
        }

        loadedEventIds.add(eventId)
        newEvents.push(event)

        if (newEvents.length >= maxNewEvents) {
          lastOrderSnapshot = orderDoc
          return { newEvents, ordersHasMore: true }
        }
      }

      lastOrderSnapshot = lastProcessedDoc
      return { newEvents, ordersHasMore: batchHasMore }
    }

    const next = () => {
      if (storeId === '_empty') {
        return
      }
      if (paginationExecutor.totalTaskLength > 0 || !hasMore.value) {
        return
      }
      const generation = loadGeneration
      paginationExecutor.addTask(async () => {
        try {
          const collectedNewEvents: BokudeliEvent[] = []
          let ordersHasMore = true
          let scanBatches = 0

          while (ordersHasMore && collectedNewEvents.length < pageSize && scanBatches < MAX_SCAN_BATCHES_PER_NEXT) {
            scanBatches++
            const remaining = pageSize - collectedNewEvents.length
            const { newEvents, ordersHasMore: batchHasMore } = await scanOrdersBatch(remaining)
            if (generation !== loadGeneration) return
            ordersHasMore = batchHasMore
            collectedNewEvents.push(...newEvents)
          }

          if (generation !== loadGeneration) return

          if (scanBatches >= MAX_SCAN_BATCHES_PER_NEXT && ordersHasMore && collectedNewEvents.length < pageSize) {
            console.warn('Order history scan reached MAX_SCAN_BATCHES_PER_NEXT; more orders may exist.')
          }

          if (collectedNewEvents.length > 0) {
            events.value = sortEventsByStartDatetime([...events.value, ...collectedNewEvents])
            for (const ev of collectedNewEvents) {
              patchOrderState(ev.event_id, { orders: null, loading: true, error: null })
            }
            await loadOrdersForEventsParallel(collectedNewEvents, generation)
            if (generation !== loadGeneration) return
          }

          if (!ordersHasMore) {
            hasMore.value = false
          }
        } catch (error) {
          if (generation !== loadGeneration) return
          console.error('Failed to fetch order history:', error)
          hasMore.value = false
        } finally {
          if (generation === loadGeneration) {
            initialLoaded.value = true
          }
        }
      })
    }

    const reload = () => {
      loadGeneration += 1
      paginationExecutor.clear()
      events.value = []
      hasMore.value = true
      initialLoaded.value = false
      orderStateByEventId.value = {}
      lastOrderSnapshot = null
      loadedEventIds.clear()
      if (storeId !== '_empty') {
        next()
      }
    }

    const reloadOrdersForEvent = async (eventId: string) => {
      const event = events.value.find((e) => e.event_id === eventId)
      if (event == null || userId === '') {
        return
      }
      await loadOrdersForEvent(event, loadGeneration)
    }

    return {
      events,
      hasMore,
      initialLoaded,
      orderStateByEventId,
      next,
      reload,
      reloadOrdersForEvent,
    }
  })
  return store()
}
