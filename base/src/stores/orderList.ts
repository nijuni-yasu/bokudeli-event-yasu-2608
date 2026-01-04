import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  collectionGroup,
  getDocs,
  query,
  getCountFromServer,
  QueryDocumentSnapshot,
  startAfter,
  limit,
  QueryConstraint,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { TaskExecutor } from '@shokujii/base/utils/executors.js'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'
import { orderConverter } from '@shokujii/base/stores/event.js'

export type OrderListStore = ReturnType<typeof useOrderListStore>

/**
 * 注文リストを管理する汎用的なストア
 * @param storeId ストアの一意な識別子（例: `user/${userId}` or `admin/all`）
 * @param filters Firestore のクエリ制約（where, orderBy など）
 * @param pageSize 1ページあたりの取得件数
 */
export const useOrderListStore = (storeId: string, filters: QueryConstraint[], pageSize: number = 6) => {
  const store = defineStore(`/orderList/${storeId}/${pageSize}`, () => {
    const pagenationExecutor = new TaskExecutor(1)
    const orders = ref<{ order: EventOrder; eventId: string }[] | null>(null)
    const totalCount = ref<number | null>(null)

    const ordersSnapshot: QueryDocumentSnapshot<EventOrder>[] = []

    const next = () => {
      // 既にタスクが実行中またはキューにある場合は、新しいタスクを追加しない
      if (pagenationExecutor.totalTaskLength > 0) {
        return
      }
      pagenationExecutor.addTask(async () => {
        try {
          if (totalCount.value == null) {
            const q = query(collectionGroup(db, 'orders'), ...filters)
            totalCount.value = (await getCountFromServer(q)).data().count
          }
          const lastVisibleDocument = ordersSnapshot[ordersSnapshot.length - 1]
          const q = query(
            collectionGroup(db, 'orders'),
            ...filters,
            ...(lastVisibleDocument == null ? [] : [startAfter(lastVisibleDocument)]),
            limit(pageSize),
          ).withConverter(orderConverter)
          const querySnapshot = await getDocs(q)
          ordersSnapshot.push(...querySnapshot.docs)
          orders.value = ordersSnapshot.flatMap((orderSnapshot) => {
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
      totalCount.value = null
      next()
    }

    reload()

    return {
      totalCount,
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
