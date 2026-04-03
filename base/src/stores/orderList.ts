import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collectionGroup,
  getDocs,
  query,
  QueryDocumentSnapshot,
  startAfter,
  limit,
  QueryConstraint,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { FirestoreDataConverter, DocumentData, SnapshotOptions } from 'firebase/firestore'

export type OrderListStore = ReturnType<typeof useOrderListStore>

/**
 * 注文リストを管理する汎用的なストア
 * @param storeId ストアの一意な識別子（例: `user/${userId}` or `admin/all`）
 * @param filters Firestore のクエリ制約（where, orderBy など）
 * @param pageSize 1ページあたりの取得件数
 */
const memberOrderConverter: FirestoreDataConverter<EventMemberOrder> = {
  toFirestore(order: EventMemberOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMemberOrder {
    const data = snapshot.data(options)
    return new EventMemberOrder(snapshot.id, data)
  },
}

export const useOrderListStore = (storeId: string, filters: QueryConstraint[], pageSize: number = 6) => {
  const store = defineStore(`/orderList/${storeId}/${pageSize}`, () => {
    const paginationExecutor = new TaskExecutor(1)
    const orders = ref<{ order: EventMemberOrder; eventId: string }[] | null>(null)
    const hasMore = ref(true)

    const ordersSnapshot: QueryDocumentSnapshot<EventMemberOrder>[] = []

    const next = () => {
      if (paginationExecutor.totalTaskLength > 0) {
        return
      }
      paginationExecutor.addTask(async () => {
        try {
          const lastVisibleDocument = ordersSnapshot[ordersSnapshot.length - 1]
          const q = query(
            collectionGroup(db, 'member_orders'),
            ...filters,
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            limit(pageSize),
          ).withConverter(memberOrderConverter)
          const querySnapshot = await getDocs(q)
          if (querySnapshot.docs.length < pageSize) {
            hasMore.value = false
          }
          ordersSnapshot.push(...querySnapshot.docs)
          orders.value = ordersSnapshot.map((orderSnapshot) => {
            const order = orderSnapshot.data()
            const eventId = order.event_id
            return { order, eventId }
          })
        } catch (error) {
          console.error('Failed to fetch orders:', error)
        }
      })
    }

    const reload = () => {
      ordersSnapshot.splice(0) // clear
      orders.value = null
      hasMore.value = true
      next()
    }

    reload()

    return {
      hasMore,
      orders,
      reload,
      next,
    }
  })
  return store()
}

/**
 * ユーザーの注文リストを取得するヘルパー関数
 * @param userId ユーザーID
 * @param pageSize 1ページあたりの取得件数（デフォルト: 6）
 */
export const useOrderListByUserId = (userId: string, pageSize: number = 6) => {
  return useOrderListStore(
    `user/${userId}`,
    [where('user_id', '==', userId), where('status', '!=', 'in_cart'), orderBy('updated_at', 'desc')],
    pageSize,
  )
}

/**
 * 特定イベントの注文リストを取得するヘルパー関数
 * @param eventId イベントID
 * @param pageSize 1ページあたりの取得件数（デフォルト: 10）
 */
export const useOrderListByEventId = (eventId: string, pageSize: number = 10) => {
  return useOrderListStore(
    `event/${eventId}`,
    [where('event_id', '==', eventId), where('status', '!=', 'in_cart'), orderBy('updated_at', 'desc')],
    pageSize,
  )
}
