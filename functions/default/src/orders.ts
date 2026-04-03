import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { UpdateOrderStatusRequest } from '@shokujii/common/apis/order.js'
import { getOrder, saveOrder } from './stores/order.js'
import { getEvent } from './stores/event.js'
import { getCommunity } from './stores/community.js'
import { EventOrderStatusType } from '@shokujii/common/schemas/EventOrder.js'
import { EventPaymentType } from '@shokujii/common/schemas/Event.js'
import { createModuleLogger } from './utils/logger.js'

const db = getFirestore()
const logger = createModuleLogger('orders')

const isValidStatusTransition = (
  currentStatus: EventOrderStatusType,
  newStatus: EventOrderStatusType,
  eventPayment: EventPaymentType,
): boolean => {
  if (currentStatus === 'in_cart' && newStatus === 'ordered') return true
  if (currentStatus === 'ordered' && newStatus === 'canceled' && eventPayment !== 'user_advance') return true
  return false
}

export const updateOrderStatus = onCall<UpdateOrderStatusRequest, Promise<void>>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  const { community_id, event_id, order_id, status } = request.data
  if (
    community_id == null ||
    community_id === '' ||
    event_id == null ||
    event_id === '' ||
    order_id == null ||
    order_id === '' ||
    status == null
  ) {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }

  return db.runTransaction(async (transaction) => {
    const eventData = await getEvent(event_id, transaction)
    if (eventData == null || eventData.community_id !== community_id) {
      throw new HttpsError('not-found', `イベントが見つかりません: ${event_id}`)
    }

    const order = await getOrder(community_id, event_id, order_id, transaction)
    if (order == null) {
      throw new HttpsError('not-found', `注文が見つかりません: ${order_id}`)
    }

    if (order.user_id !== uid) {
      throw new HttpsError('permission-denied', '権限がありません')
    }

    if (eventData.event_payment === 'user_advance' && status === 'ordered') {
      throw new HttpsError('permission-denied', 'user_advance ではステータスを ordered に変更できません')
    }

    if (!isValidStatusTransition(order.status, status, eventData.event_payment)) {
      logger.warn('Invalid status transition', {
        orderId: order_id,
        eventId: event_id,
        currentStatus: order.status,
        requestedStatus: status,
        eventPayment: eventData.event_payment,
      })
      throw new HttpsError('failed-precondition', `ステータス遷移が不正です: ${order.status} → ${status}`)
    }

    const previousStatus = order.status
    const community = status === 'ordered' ? await getCommunity(community_id, transaction) : null

    if (community != null) {
      await community.addMember(uid, transaction)
    }

    if (status === 'ordered') {
      order.ordered_at = Timestamp.now().toMillis()
    }
    if (status === 'canceled') {
      order.canceled_at = Timestamp.now().toMillis()
    }
    order.status = status

    await saveOrder(community_id, event_id, order, transaction)

    logger.info('Order status updated', {
      orderId: order_id,
      eventId: event_id,
      communityId: community_id,
      userId: uid,
      previousStatus,
      newStatus: status,
      eventPayment: eventData.event_payment,
    })
  })
})
