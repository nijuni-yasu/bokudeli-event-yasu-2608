import { onRequest } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import Stripe from 'stripe'
import { EventStripe, StripeMenuType } from '@shokujii/common/schemas/EventStripe.js'
import {
  getOrdersByIds,
  saveOrder,
  getStripeByPaymentIntent,
  createStripeDoc,
  saveStripe,
} from './stores/memberOrder.js'
import { getCommunity } from './stores/community.js'
import { getEvent } from './stores/event.js'
import { sendOrderCompletionMails } from './orderCompletionMail.js'

const logger = createModuleLogger('stripeWebhook')
const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')
const STRIPE_WEBHOOK_ENDPOINT_SECRET = defineSecret('STRIPE_WEBHOOK_ENDPOINT_SECRET')
const db = getFirestore()

/** トランザクション結果に応じてハンドラが返す HTTP を分岐する（throw による 5xx と Stripe の無限再送を避ける） */
type StripeWebhookTransactionResult =
  | { kind: 'processed' }
  | { kind: 'noop' }
  | { kind: 'client_error'; message: string }
  | { kind: 'unrecoverable_ack'; message: string }

export const stripeWebhook = onRequest(
  {
    secrets: ['STRIPE_API_KEY', 'STRIPE_WEBHOOK_ENDPOINT_SECRET', 'SENDGRID_API_KEY'],
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
    const { orderIds: orderIdsStr, eventId, communityId, userId } = session.metadata ?? {}

    if (orderIdsStr == null || eventId == null || communityId == null || userId == null) {
      logger.error('Missing metadata in checkout session', { metadata: session.metadata })
      res.status(400).send('Missing metadata')
      return
    }

    if (typeof session.payment_intent !== 'string') {
      logger.error('payment_intent is not a string', { payment_intent: session.payment_intent })
      res.status(400).send('Invalid payment_intent')
      return
    }

    const paymentIntent = session.payment_intent
    const rawOrderIds = orderIdsStr.split(',').filter((id) => id.length > 0)

    if (rawOrderIds.length === 0) {
      logger.error('orderIds is empty', { orderIdsStr })
      res.status(400).send('orderIds is empty')
      return
    }

    if (new Set(rawOrderIds).size !== rawOrderIds.length) {
      logger.warn('Duplicate order IDs in checkout session metadata', {
        orderIdsStr,
        eventId,
        communityId,
        userId,
        paymentIntent,
      })
      res.status(400).send('Duplicate order IDs')
      return
    }

    const orderIds = rawOrderIds

    const existingStripe = await getStripeByPaymentIntent(communityId, eventId, paymentIntent)
    if (existingStripe != null) {
      // stripes は既にあるが、前回が addMember 前に失敗した場合はここで冪等に補完する（R04）
      logger.info('Stripe document already exists, skipping transaction', { paymentIntent })
      const community = await getCommunity(communityId)
      if (community != null) {
        await community.addMember(userId)
      }
      res.status(200).json({ received: true })
      return
    }

    const stripeDocId = createStripeDoc(communityId, eventId)

    const txResult = await db.runTransaction(async (transaction): Promise<StripeWebhookTransactionResult> => {
      const existingInTx = await getStripeByPaymentIntent(communityId, eventId, paymentIntent, transaction)
      if (existingInTx != null) {
        logger.info('Stripe document created by concurrent request, skipping', { paymentIntent })
        return { kind: 'noop' }
      }

      const orders = await getOrdersByIds(communityId, eventId, userId, orderIds, transaction)

      if (orders.length !== orderIds.length) {
        logger.error('Some orders not found in transaction', {
          expected: orderIds.length,
          found: orders.length,
          paymentIntent,
        })
        return { kind: 'client_error', message: 'Orders not found' }
      }

      const allAlreadyOrdered = orders.every((o) => o.status === 'ordered')
      if (allAlreadyOrdered) {
        logger.info('All orders already ordered', { paymentIntent })
        return { kind: 'noop' }
      }

      for (const order of orders) {
        if (order.status !== 'in_cart' && order.status !== 'ordered') {
          logger.error('Unexpected order status for webhook', {
            orderId: order.order_id,
            status: order.status,
            paymentIntent,
          })
          return {
            kind: 'unrecoverable_ack',
            message: `Order ${order.order_id} has unexpected status: ${order.status}`,
          }
        }
      }

      const orderedAt = Timestamp.now().toMillis()
      const payAmount = orders.reduce((sum, o) => sum + o.menu_price, 0)

      const menusMap = new Map<string, StripeMenuType>()
      for (const order of orders) {
        const existing = menusMap.get(order.menu_id)
        if (existing) {
          existing.count++
        } else {
          menusMap.set(order.menu_id, {
            menu_name: order.menu_name,
            menu_price: order.menu_price,
            count: 1,
          })
        }
      }

      for (const order of orders) {
        if (order.status === 'ordered') continue
        order.status = 'ordered'
        order.ordered_at = orderedAt
        order.stripe_id = stripeDocId
        saveOrder(communityId, eventId, userId, order, transaction)
      }

      const stripeDoc = new EventStripe(stripeDocId, {
        stripe_id: stripeDocId,
        order_ids: orderIds,
        user_id: userId,
        event_id: eventId,
        community_id: communityId,
        payment_intent: paymentIntent,
        pay_amount: payAmount,
        menus: Array.from(menusMap.values()),
        refunds: [],
      })
      saveStripe(communityId, eventId, stripeDoc, transaction)
      return { kind: 'processed' }
    })

    if (txResult.kind === 'client_error') {
      res.status(400).send(txResult.message)
      return
    }
    if (txResult.kind === 'unrecoverable_ack') {
      logger.error('Webhook skipped: unrecoverable order state', {
        message: txResult.message,
        paymentIntent,
        eventId,
        communityId,
        userId,
      })
      res.status(200).json({ received: true })
      return
    }

    const shouldSendOrderCompletionMails = txResult.kind === 'processed'

    const community = await getCommunity(communityId)
    if (community != null) {
      await community.addMember(userId)
    }

    if (shouldSendOrderCompletionMails) {
      const eventForMail = await getEvent(eventId)
      if (eventForMail != null) {
        try {
          await sendOrderCompletionMails(eventForMail, userId)
        } catch (error) {
          logger.error('Failed to send order completion mails', {
            error,
            eventId,
            userId,
            paymentIntent,
          })
        }
      } else {
        logger.warn('Skipping order completion mails: event not found', {
          eventId,
          userId,
          paymentIntent,
        })
      }
    }

    logger.info('Webhook 処理完了', {
      paymentIntent,
      eventId,
      communityId,
      userId,
      orderCount: orderIds.length,
    })
    res.status(200).json({ received: true })
  },
)
