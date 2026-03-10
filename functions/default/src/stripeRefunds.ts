import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { Timestamp } from 'firebase-admin/firestore'
import Stripe from 'stripe'
import { StripeRefundsRequest } from '@shokujii/common/apis/stripe.js'
import { getOrder, saveOrder } from './stores/order.js'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('stripeRefunds')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

export const stripeRefunds = onCall<StripeRefundsRequest, Promise<{ refund_id: string }>>(
  {
    secrets: ['STRIPE_API_KEY'],
  },
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }

    const { order_id, community_id, event_id } = request.data
    if (
      order_id == null ||
      order_id === '' ||
      community_id == null ||
      community_id === '' ||
      event_id == null ||
      event_id === ''
    ) {
      throw new HttpsError('invalid-argument', '必須パラメータが不足しています')
    }

    const order = await getOrder(community_id, event_id, order_id)
    if (order == null) {
      throw new HttpsError('not-found', '注文が見つかりません')
    }

    if (order.user_id !== uid) {
      throw new HttpsError('permission-denied', '権限がありません')
    }

    if (order.refund_id != null) {
      logger.info('Refund already processed (idempotent)', { orderId: order_id, refundId: order.refund_id })
      return { refund_id: order.refund_id }
    }

    if (order.status !== 'ordered') {
      throw new HttpsError('failed-precondition', '返金可能なステータスではありません')
    }

    if (order.payment_intent == null) {
      throw new HttpsError('failed-precondition', '返金対象の payment_intent がありません')
    }

    const stripe = new Stripe(STRIPE_API_KEY.value(), { apiVersion: '2022-11-15', maxNetworkRetries: 3 })
    const idempotencyKey = `refund_${community_id}_${event_id}_${order_id}`

    let refund: Stripe.Refund
    try {
      refund = await stripe.refunds.create({ payment_intent: order.payment_intent }, { idempotencyKey })
    } catch (error) {
      logger.error('Stripe refund API failed', {
        orderId: order_id,
        paymentIntent: order.payment_intent,
        error: String(error),
      })
      throw new HttpsError('unknown', error instanceof Error ? error.message : 'Stripe API error')
    }

    order.status = 'canceled'
    order.canceled_at = Timestamp.now().toMillis()
    order.refund_id = refund.id

    await saveOrder(community_id, event_id, order)

    logger.info('Refund completed', {
      orderId: order_id,
      refundId: refund.id,
      communityId: community_id,
      eventId: event_id,
    })
    return { refund_id: refund.id }
  },
)
