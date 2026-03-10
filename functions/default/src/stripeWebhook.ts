import { onRequest } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { Timestamp } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import Stripe from 'stripe'
import { getOrder, saveOrder } from './stores/order.js'
import { getCommunity } from './stores/community.js'

const logger = createModuleLogger('stripeWebhook')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')
const STRIPE_WEBHOOK_ENDPOINT_SECRET = defineSecret('STRIPE_WEBHOOK_ENDPOINT_SECRET')

export const stripeWebhook = onRequest(
  {
    secrets: ['STRIPE_API_KEY', 'STRIPE_WEBHOOK_ENDPOINT_SECRET'],
  },
  async (req, res) => {
    const stripe = new Stripe(STRIPE_API_KEY.value(), { apiVersion: '2022-11-15', maxNetworkRetries: 3 })

    let event: Stripe.Event
    try {
      const sig = req.headers['stripe-signature']
      if (sig == null) {
        res.status(400).send('Missing stripe-signature header')
        return
      }
      event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_ENDPOINT_SECRET.value())
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: String(err) })
      res.status(400).send('Webhook signature verification failed')
      return
    }

    if (event.type !== 'checkout.session.completed') {
      logger.info('Unhandled event type, ignoring', { type: event.type })
      res.status(200).json({ received: true })
      return
    }

    const session = event.data.object as Stripe.Checkout.Session
    const { orderId, eventId, communityId, userId } = session.metadata ?? {}

    if (orderId == null || eventId == null || communityId == null || userId == null) {
      logger.error('Missing metadata in checkout session', { metadata: session.metadata })
      res.status(400).send('Missing metadata')
      return
    }

    const order = await getOrder(communityId, eventId, orderId)
    if (order == null) {
      logger.error('Order not found', { communityId, eventId, orderId })
      res.status(400).send('Order not found')
      return
    }

    // 冪等性チェック: 既に ordered なら正常終了
    if (order.status === 'ordered') {
      logger.info('Order already ordered (idempotent)', { orderId })
      res.status(200).json({ received: true })
      return
    }

    // ステータス遷移チェック: in_cart からのみ ordered に遷移可能
    if (order.status !== 'in_cart') {
      logger.warn('Unexpected order status for webhook', { orderId, status: order.status })
      res.status(200).json({ received: true })
      return
    }

    if (typeof session.payment_intent !== 'string') {
      logger.error('payment_intent is not a string', { payment_intent: session.payment_intent })
      res.status(400).send('Invalid payment_intent')
      return
    }

    order.status = 'ordered'
    order.ordered_at = Timestamp.now().toMillis()
    order.payment_intent = session.payment_intent

    await saveOrder(communityId, eventId, order)

    const community = await getCommunity(communityId)
    if (community != null) {
      await community.addMember(userId)
    }

    logger.info('Order completed via webhook', { orderId, eventId, communityId, userId })
    res.status(200).json({ received: true })
  },
)
