import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { AddToCartRequest, RemoveFromCartRequest, ConfirmOrderRequest } from '@shokujii/common/apis/order.js'
import { EventMember } from '@shokujii/common/schemas/EventMemberOrder.js'
import { formatYearMonth } from '@shokujii/common/utils/datetime.js'
import {
  computePaymentCommunityBillOffAmount,
  computeTotalPayment,
  isPaymentCommunityBillOffAmountConsistent,
} from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'
import { writeAuditLog } from './utils/auditLog.js'
import {
  createOrder,
  deleteOrder,
  getOrder,
  getOrdersByIds,
  getMember,
  saveMember,
  saveOrder,
} from './stores/memberOrder.js'
import { getEventInCommunity } from './stores/event.js'
import { createModuleLogger } from './utils/logger.js'
import { applyOrderConfirmedSideEffects } from './orderConfirmedSideEffects.js'
import {
  assertActiveEnterpriseMember,
  assertEnterpriseEventPaymentAllowed,
  applyEnterpriseSubsidyPayFieldToCartTracker,
  buildEnterpriseSubsidyUsageExceededDetails,
  createEnterpriseSubsidyAddToCartTracker,
  finalizeEnterpriseSubsidyZeroPaymentOrder,
  getEventEnterpriseId,
  loadEnterpriseMemberForSubsidy,
} from './utils/enterpriseSubsidyOrders.js'

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

  const usageExceededDetails = await db.runTransaction(async (transaction) => {
    const eventData = await getEventInCommunity(community_id, event_id, transaction)
    if (eventData == null) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    assertEnterpriseEventPaymentAllowed(eventData)
    const enterpriseId = getEventEnterpriseId(eventData)
    await assertActiveEnterpriseMember(enterpriseId, request.auth, transaction)

    if (eventData.isCanceled()) {
      throw new HttpsError('failed-precondition', 'イベントがキャンセルされたため、カートに追加できません')
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

    let subsidyTracker: ReturnType<typeof createEnterpriseSubsidyAddToCartTracker> | null = null
    let eventMonth = ''

    if (eventData.event_payment === 'enterprise_subsidy') {
      if (eventData.enterprise_subsidy_settings == null) {
        throw new HttpsError('failed-precondition', 'enterprise_subsidy_settings is required')
      }
      if (enterpriseId == null) {
        throw new HttpsError('failed-precondition', 'enterprise_id is required for enterprise_subsidy')
      }
      eventMonth = formatYearMonth(eventData.event_start_datetime)
      const entMember = await loadEnterpriseMemberForSubsidy(enterpriseId, uid, transaction)
      if (entMember == null) {
        throw new HttpsError('failed-precondition', '企業メンバー情報が見つかりません')
      }
      subsidyTracker = createEnterpriseSubsidyAddToCartTracker(entMember.monthly_usage[eventMonth] ?? 0)
    }

    if (existingMember == null) {
      const member = new EventMember(uid, {
        user_id: uid,
        event_id,
        community_id,
        ...(enterpriseId != null ? { enterprise_id: enterpriseId } : {}),
      })
      await saveMember(community_id, event_id, member, transaction)
    } else if (enterpriseId != null && existingMember.enterprise_id == null) {
      existingMember.enterprise_id = enterpriseId
      await saveMember(community_id, event_id, existingMember, transaction)
    }

    for (const menu of menus) {
      const masterMenu = eventMenus.find((m) => m.id === menu.menu_id)
      if (masterMenu == null) {
        throw new HttpsError('failed-precondition', `メニューが見つかりません: ${menu.menu_id}`)
      }

      if (eventData.event_payment === 'enterprise_subsidy') {
        for (let i = 0; i < menu.count; i++) {
          const payField = applyEnterpriseSubsidyPayFieldToCartTracker({
            event: eventData,
            menuPrice: masterMenu.menu_price,
            tracker: subsidyTracker!,
          })
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
              enterprise_id: enterpriseId,
              ...(payField !== undefined ? { pay_enterprise_subsidy_amount: payField } : {}),
            },
            transaction,
          )
        }
      } else {
        const discount = computePaymentCommunityBillOffAmount(
          eventData.event_payment,
          eventData.community_bill_settings,
          masterMenu.menu_price,
        )
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
              ...(enterpriseId != null ? { enterprise_id: enterpriseId } : {}),
              ...(discount !== undefined ? { pay_community_bill_off_amount: discount } : {}),
            },
            transaction,
          )
        }
      }
    }

    if (subsidyTracker != null && enterpriseId != null) {
      return buildEnterpriseSubsidyUsageExceededDetails({
        enterpriseId,
        eventMonth,
        tracker: subsidyTracker,
      })
    }
    return null
  })

  if (usageExceededDetails != null) {
    await writeAuditLog({
      enterpriseId: usageExceededDetails.enterpriseId,
      userId: uid,
      action: 'monthly_usage_exceeded',
      targetType: 'order_session',
      details: {
        event_id,
        year_month: usageExceededDetails.eventMonth,
        requested_amount: usageExceededDetails.requestedTotal,
        granted_amount: usageExceededDetails.grantedTotal,
        unfilled_count: usageExceededDetails.unfilledCount,
      },
    })
  }

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

export const confirmOrder = onCall(
  {
    secrets: ['SENDGRID_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }

    const { community_id, event_id, order_ids } = request.data as ConfirmOrderRequest

    if (!community_id || !event_id || !Array.isArray(order_ids) || order_ids.length === 0) {
      throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
    }

    const enterpriseOrderCreateLog = await db.runTransaction(async (transaction) => {
      const eventData = await getEventInCommunity(community_id, event_id, transaction)
      if (eventData == null) {
        throw new HttpsError('not-found', 'イベントが見つかりません')
      }

      assertEnterpriseEventPaymentAllowed(eventData)
      const enterpriseId = getEventEnterpriseId(eventData)
      await assertActiveEnterpriseMember(enterpriseId, request.auth, transaction)

      if (eventData.isCanceled()) {
        throw new HttpsError('failed-precondition', 'イベントがキャンセルされたため、注文を確定できません')
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

      if (eventData.event_payment === 'enterprise_subsidy') {
        if (enterpriseId == null) {
          throw new HttpsError('failed-precondition', 'enterprise_id is required for enterprise_subsidy')
        }
        const entMember = await loadEnterpriseMemberForSubsidy(enterpriseId, uid, transaction)
        if (entMember == null) {
          throw new HttpsError('failed-precondition', '企業メンバー情報が見つかりません')
        }
        const orderedAt = Timestamp.now().toMillis()
        return finalizeEnterpriseSubsidyZeroPaymentOrder({
          enterpriseId,
          userId: uid,
          communityId: community_id,
          eventId: event_id,
          event: eventData,
          orders,
          orderIds: order_ids,
          member: entMember,
          transaction,
          orderedAt,
        })
      }

      for (const order of orders) {
        if (
          !isPaymentCommunityBillOffAmountConsistent(eventData.event_payment, eventData.community_bill_settings, order)
        ) {
          throw new HttpsError('failed-precondition', '割引金額が一致しません')
        }
      }

      const totalPayment = computeTotalPayment(orders, eventData.event_payment, eventData.community_bill_settings)
      if (totalPayment < 0) {
        throw new HttpsError('internal', '支払額が負になっています')
      }
      if (eventData.event_payment === 'community_bill' && totalPayment > 0) {
        throw new HttpsError('failed-precondition', '差額のある割引参加は Stripe Checkout で決済してください')
      }

      const orderedAt = Timestamp.now().toMillis()
      for (const order of orders) {
        order.status = 'ordered'
        order.ordered_at = orderedAt
        saveOrder(community_id, event_id, uid, order, transaction)
      }
      return null
    })

    if (enterpriseOrderCreateLog != null) {
      await writeAuditLog({
        enterpriseId: enterpriseOrderCreateLog.enterpriseId,
        userId: uid,
        action: 'order_create',
        targetType: 'order_session',
        details: {
          order_ids,
          total_payment: 0,
          pay_enterprise_subsidy_amount: enterpriseOrderCreateLog.subsidyTotal,
        },
      })
    }

    const eventForSideEffects = await getEventInCommunity(community_id, event_id)
    if (eventForSideEffects != null) {
      await applyOrderConfirmedSideEffects({ event: eventForSideEffects, userId: uid })
    } else {
      logger.warn('Skipping side effects: event not found', {
        eventId: event_id,
        userId: uid,
      })
    }

    logger.info('注文確定', {
      eventId: event_id,
      communityId: community_id,
      userId: uid,
      orderCount: order_ids.length,
    })
  },
)
