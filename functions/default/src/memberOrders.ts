import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { AddToCartRequest, RemoveFromCartRequest, ConfirmOrderRequest } from '@shokujii/common/apis/order.js'
import { EventMember } from '@shokujii/common/schemas/EventMemberOrder.js'
import {
  createOrder,
  deleteOrder,
  getOrder,
  getOrdersByIds,
  getMember,
  saveMember,
  saveOrder,
} from './stores/memberOrder.js'
import { getEvent } from './stores/event.js'
import { getCommunity } from './stores/community.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('memberOrders')
const db = getFirestore()

export const addToCart = onCall<AddToCartRequest, Promise<void>>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  const { community_id, event_id, menus } = request.data

  if (!community_id || !event_id || !Array.isArray(menus) || menus.length === 0) {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }

  await db.runTransaction(async (transaction) => {
    const eventData = await getEvent(event_id, transaction)
    if (eventData == null || eventData.community_id !== community_id) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    const now = Timestamp.now().toMillis()
    if (eventData.event_deadline_datetime < now) {
      throw new HttpsError('failed-precondition', '注文期限を過ぎています')
    }

    if (eventData.members.length >= eventData.event_max_people) {
      throw new HttpsError('failed-precondition', '定員に達しています')
    }

    const eventMenus = await eventData.getMenus(transaction)
    for (const menu of menus) {
      const eventMenu = eventMenus.find((m) => m.id === menu.menu_id)
      if (eventMenu == null || !eventMenu.is_selected) {
        throw new HttpsError('failed-precondition', `メニューが選択されていません: ${menu.menu_id}`)
      }
    }

    const existingMember = await getMember(community_id, event_id, uid, transaction)

    if (existingMember == null) {
      const member = new EventMember(uid, {
        user_id: uid,
        event_id,
        community_id,
      })
      await saveMember(community_id, event_id, member, transaction)
    }

    for (const menu of menus) {
      const masterMenu = eventMenus.find((m) => m.id === menu.menu_id)
      if (masterMenu == null) {
        throw new HttpsError('failed-precondition', `メニューが見つかりません: ${menu.menu_id}`)
      }
      for (let i = 0; i < menu.count; i++) {
        await createOrder(
          community_id,
          event_id,
          uid,
          {
            user_id: uid,
            event_id,
            community_id,
            status: 'in_cart',
            menu_id: masterMenu.id,
            menu_name: masterMenu.menu_name,
            menu_price: masterMenu.menu_price,
          },
          transaction,
        )
      }
    }
  })

  logger.info('カートに追加', {
    eventId: event_id,
    communityId: community_id,
    userId: uid,
    menuCount: menus.reduce((sum, m) => sum + m.count, 0),
  })
})

export const removeFromCart = onCall<RemoveFromCartRequest, Promise<void>>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  const { community_id, event_id, order_id } = request.data

  if (!community_id || !event_id || !order_id) {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }

  const order = await getOrder(community_id, event_id, uid, order_id)
  if (order == null) {
    throw new HttpsError('not-found', '注文が見つかりません')
  }

  if (order.user_id !== uid) {
    throw new HttpsError('permission-denied', 'この注文にアクセスできません')
  }

  if (order.status !== 'in_cart') {
    throw new HttpsError('failed-precondition', 'カート内の注文のみ削除できます')
  }

  await deleteOrder(community_id, event_id, uid, order_id)

  logger.info('カートから削除', {
    eventId: event_id,
    communityId: community_id,
    userId: uid,
    orderId: order_id,
  })
})

export const confirmOrder = onCall<ConfirmOrderRequest, Promise<void>>(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  const { community_id, event_id, order_ids } = request.data

  if (!community_id || !event_id || !Array.isArray(order_ids) || order_ids.length === 0) {
    throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
  }

  await db.runTransaction(async (transaction) => {
    const eventData = await getEvent(event_id, transaction)
    if (eventData == null || eventData.community_id !== community_id) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    if (eventData.event_payment === 'user_advance') {
      throw new HttpsError('failed-precondition', '事前クレカ決済のイベントでは confirmOrder を使用できません')
    }

    const now = Timestamp.now().toMillis()
    if (eventData.event_deadline_datetime < now) {
      throw new HttpsError('failed-precondition', '注文期限を過ぎています')
    }

    if (eventData.members.length >= eventData.event_max_people) {
      throw new HttpsError('failed-precondition', '定員に達しています')
    }

    const orders = await getOrdersByIds(community_id, event_id, uid, order_ids, transaction)

    if (orders.length !== order_ids.length) {
      throw new HttpsError('not-found', '一部の注文が見つかりません')
    }

    for (const order of orders) {
      if (order.user_id !== uid) {
        throw new HttpsError('permission-denied', 'この注文にアクセスできません')
      }
      if (order.status !== 'in_cart') {
        throw new HttpsError('failed-precondition', 'カート内の注文のみ確定できます')
      }
    }

    const orderedAt = Timestamp.now().toMillis()
    for (const order of orders) {
      order.status = 'ordered'
      order.ordered_at = orderedAt
      saveOrder(community_id, event_id, uid, order, transaction)
    }
  })

  const community = await getCommunity(community_id)
  if (community != null) {
    await community.addMember(uid)
  }

  logger.info('注文確定', {
    eventId: event_id,
    communityId: community_id,
    userId: uid,
    orderCount: order_ids.length,
  })
})
