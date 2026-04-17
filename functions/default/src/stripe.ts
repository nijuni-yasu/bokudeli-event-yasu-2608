import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { Timestamp } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import { CreateStripeCheckoutSessionRequest } from '@shokujii/common/apis/stripe.js'
import { getUserUrl, getMainUrl } from './utils/urls.js'
import { getEvent } from './stores/event.js'
import { getOrdersByIds } from './stores/memberOrder.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('stripe')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')
const CHECKOUT_SESSION_EXPIRES_SECONDS = 31 * 60
const ORDER_IDS_CHUNK_SIZE = 20

export const createStripeCheckoutSession = onCall<CreateStripeCheckoutSessionRequest>(
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

    const event = await getEvent(event_id)
    if (event == null || event.community_id !== community_id) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    if (event.event_payment !== 'user_advance') {
      throw new HttpsError('failed-precondition', 'Stripe 決済は事前クレカ決済のイベントのみ使用できます')
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
    }

    const eventMenus = await event.getMenus()
    const menuImageMap = new Map<string, string>()
    for (const m of eventMenus) {
      menuImageMap.set(m.id, m.menu_image_url)
    }

    const grouped = new Map<string, { menuName: string; unitAmount: number; quantity: number; imageUrl: string }>()
    for (const order of orders) {
      const existing = grouped.get(order.menu_id)
      if (existing) {
        existing.quantity++
      } else {
        grouped.set(order.menu_id, {
          menuName: order.menu_name,
          unitAmount: order.menu_price,
          quantity: 1,
          imageUrl: menuImageMap.get(order.menu_id) ?? '',
        })
      }
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = Array.from(grouped.values()).map((item) => ({
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

    const stripe = new Stripe(STRIPE_API_KEY.value(), { apiVersion: '2022-11-15', maxNetworkRetries: 3 })
    const communityAccount = event.community_account
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      success_url: `${getUserUrl(uid)}?eventId=${event_id}&communityAccount=${communityAccount}&isPosted=${isPosted}`,
      cancel_url: getMainUrl(),
      customer_creation: 'if_required',
      line_items: lineItems,
      mode: 'payment',
      payment_method_types: ['card'],
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

    return session
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
