import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { Timestamp } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import {
  CreateStripeCheckoutSessionRequest,
  CreateStripeCheckoutSessionResponse,
} from '@shokujii/common/apis/stripe.js'
import { getEventMenuImageStoragePath } from '@shokujii/common/utils/storagePaths.js'
import { getUserUrl, getMainUrl, convertStoragePathToURL } from './utils/urls.js'
import { getEventInCommunity } from './stores/event.js'
import { getOrdersByIds } from './stores/memberOrder.js'
import { createModuleLogger } from './utils/logger.js'
import {
  isPaymentCommunityBillOffAmountConsistent,
  computeTotalPayment,
} from '@shokujii/common/utils/paymentCommunityBillOffAmount.js'

const logger = createModuleLogger('stripe')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')
const CHECKOUT_SESSION_EXPIRES_SECONDS = 31 * 60
const ORDER_IDS_CHUNK_SIZE = 20

export const createStripeCheckoutSession = onCall<
  CreateStripeCheckoutSessionRequest,
  Promise<CreateStripeCheckoutSessionResponse>
>(
  {
    secrets: ['STRIPE_API_KEY'],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const { community_id, event_id, order_ids, isPosted } = request.data

    if (!community_id || !event_id || !Array.isArray(order_ids) || order_ids.length === 0) {
      throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
    }

    if (new Set(order_ids).size !== order_ids.length) {
      throw new HttpsError('invalid-argument', 'order_ids に重複があります')
    }

    const uid = request.auth.uid

    const event = await getEventInCommunity(community_id, event_id)
    if (event == null) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    if (event.event_payment !== 'user_advance' && event.event_payment !== 'community_bill') {
      throw new HttpsError(
        'failed-precondition',
        'Stripe 決済は事前クレカ決済または主催者負担割引のイベントのみ使用できます',
      )
    }

    const now = Timestamp.now().toMillis()
    if (event.event_deadline_datetime < now) {
      throw new HttpsError('failed-precondition', '注文期限を過ぎています')
    }

    if (event.members.length >= event.event_max_people) {
      throw new HttpsError('failed-precondition', '定員に達しています')
    }

    const orders = await getOrdersByIds(community_id, event_id, uid, order_ids)
    if (orders.length !== order_ids.length) {
      throw new HttpsError('not-found', '一部の注文が見つかりません')
    }

    for (const order of orders) {
      if (order.user_id !== uid) {
        throw new HttpsError('permission-denied', 'この注文にアクセスできません')
      }
      if (order.status !== 'in_cart') {
        throw new HttpsError('failed-precondition', 'カート内の注文のみ決済できます')
      }
      if (!isPaymentCommunityBillOffAmountConsistent(event.event_payment, event.community_bill_settings, order)) {
        throw new HttpsError('failed-precondition', '割引金額が一致しません')
      }
    }

    const totalPayment = computeTotalPayment(orders, event.event_payment, event.community_bill_settings)
    if (totalPayment <= 0) {
      throw new HttpsError('failed-precondition', '支払額が ¥0 の場合は Stripe 決済は不要です')
    }
    if (event.event_payment === 'community_bill' && event.community_bill_settings?.type !== 'discount') {
      throw new HttpsError(
        'failed-precondition',
        '主催者負担イベントで Stripe 決済できるのは割引参加（差額あり）のみです',
      )
    }

    const eventMenus = await event.getMenus()
    const menuImageMap = new Map<string, string>()
    for (const m of eventMenus) {
      menuImageMap.set(m.id, convertStoragePathToURL(getEventMenuImageStoragePath(community_id, event_id, m.menu_id)))
    }

    const grouped = new Map<string, { menuName: string; unitAmount: number; quantity: number; imageUrl: string }>()
    for (const order of orders) {
      const existing = grouped.get(order.menu_id)
      if (existing) {
        existing.quantity++
      } else {
        const unitAmount = order.menu_price - (order.pay_community_bill_off_amount ?? 0)
        grouped.set(order.menu_id, {
          menuName: order.menu_name,
          unitAmount,
          quantity: 1,
          imageUrl: menuImageMap.get(order.menu_id) ?? '',
        })
      }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = Array.from(grouped.values())
      .filter((item) => item.unitAmount > 0)
      .map((item) => ({
        price_data: {
          currency: 'jpy',
          tax_behavior: 'inclusive',
          product_data: {
            name: item.menuName,
            ...(item.imageUrl ? { images: [item.imageUrl] } : {}),
            metadata: { partner_id: event.partner_id },
          },
          unit_amount: item.unitAmount,
        },
        quantity: item.quantity,
      }))

    if (lineItems.length === 0 && totalPayment > 0) {
      logger.error('Checkout line items empty despite positive totalPayment', {
        eventId: event_id,
        communityId: community_id,
        userId: uid,
        totalPayment,
      })
      throw new HttpsError('internal', '決済明細の生成に失敗しました')
    }

    const stripe = new Stripe(STRIPE_API_KEY.value(), {
      apiVersion: '2026-02-25.clover',
      maxNetworkRetries: 3,
    })
    const communityAccount = event.community_account
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      success_url: `${getUserUrl(uid)}?eventId=${event_id}&communityAccount=${communityAccount}&isPosted=${isPosted}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: getMainUrl(),
      customer_creation: 'if_required',
      line_items: lineItems,
      mode: 'payment',
      expires_at: Math.floor(now / 1000) + CHECKOUT_SESSION_EXPIRES_SECONDS,
      metadata: {
        eventId: event_id,
        eventPayment: event.event_payment,
        communityId: community_id,
        userId: uid,
        ...buildOrderIdChunks(order_ids),
      },
    }
    const session = await stripe.checkout.sessions.create(sessionParams)

    logger.info('Checkout セッション作成', {
      sessionId: session.id,
      eventId: event_id,
      communityId: community_id,
      userId: uid,
      orderCount: order_ids.length,
      stripeRequest: sessionParams,
    })

    return { url: session.url }
  },
)

/**
 * order_ids を Stripe metadata の value 上限（500文字）に収まるよう分割する。
 * Stripe metadata のキー上限（50個）のうち固定キー分（4個）を除いた 46 チャンクが最大。
 */
function buildOrderIdChunks(orderIds: string[]): Record<string, string> {
  const maxChunks = 46
  const maxOrders = maxChunks * ORDER_IDS_CHUNK_SIZE
  if (orderIds.length > maxOrders) {
    throw new HttpsError('invalid-argument', `一度にチェックアウトできる注文数の上限（${maxOrders}件）を超えています`)
  }
  const chunks: Record<string, string> = {}
  for (let i = 0; i < orderIds.length; i += ORDER_IDS_CHUNK_SIZE) {
    const chunk = orderIds.slice(i, i + ORDER_IDS_CHUNK_SIZE)
    chunks[`orderIds_${i / ORDER_IDS_CHUNK_SIZE}`] = chunk.join(',')
  }
  return chunks
}
