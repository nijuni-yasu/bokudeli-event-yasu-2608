import { onCall, HttpsError } from 'firebase-functions/https'
import { defineSecret } from 'firebase-functions/params'
import Stripe from 'stripe'
import { CreateStripeCheckoutSessionRequest } from '@shokujii/common/apis/stripe.js'
import { getUserUrl, getMainUrl } from './utils/urls.js'
import { getEvent } from './stores/event.js'

const STRIPE_API_KEY = defineSecret('STRIPE_API_KEY')

export const createStripeCheckoutSession = onCall<CreateStripeCheckoutSessionRequest>(
  {
    secrets: [STRIPE_API_KEY],
  },
  async (request) => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Login required to use this feature.')
    }
    const { order, isPosted } = request.data
    const event = await getEvent(order.event_id)
    if (event == null) {
      throw new HttpsError('invalid-argument', 'Event does not exist.')
    }

    const uid = request.auth.uid
    const lineItems = order.menus.map((menu) => {
      return {
        price_data: {
          currency: 'jpy',
          tax_behavior: 'inclusive',
          product_data: {
            name: menu.name,
            images: [menu.imageUrl],
            metadata: {
              partner_id: menu.partner_id,
            },
          },
          unit_amount: menu.price,
        },
        quantity: menu.count,
      } as Stripe.Checkout.SessionCreateParams.LineItem
    })

    const stripe = new Stripe(STRIPE_API_KEY.value(), { apiVersion: '2022-11-15', maxNetworkRetries: 3 })
    const session = await stripe.checkout.sessions.create({
      success_url: `${getUserUrl(uid)}?eventId=${order.event_id}&communityAccount=${order.community_account}&isPosted=${isPosted}`,
      cancel_url: getMainUrl(),
      customer_creation: 'if_required',
      line_items: lineItems,
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        eventId: order.event_id,
        eventPayment: event.event_payment,
        communityId: order.community_id,
        communityAccount: order.community_account,
        orderId: order.order_id,
        userId: uid,
      },
    })
    return session
  },
)
