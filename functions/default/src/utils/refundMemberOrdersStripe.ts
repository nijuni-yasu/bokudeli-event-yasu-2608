import { createHash } from 'crypto'
import { getFirestore } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import type { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { getMemberOrderDiscountAmount } from '@shokujii/common/utils/paymentEnterpriseSubsidyAmount.js'
import { getStripe, saveStripe } from '../stores/memberOrder.js'
import { createModuleLogger } from './logger.js'

const logger = createModuleLogger('refundMemberOrdersStripe')

export const STRIPE_REFUND_WINDOW_DAYS = 180

export type StripeRefundRecord = {
  stripe_id: string
  refund_id: string
  amount: number
}

export type StripeRefundErrorRecord = {
  stripe_id: string
  message: string
}

export type RefundMemberOrdersStripeResult = {
  refunds: StripeRefundRecord[]
  refundErrors: StripeRefundErrorRecord[]
}

/**
 * cancelOrders / cancelEventBulkCore 共通の Stripe 返金（stripe_id 単位）。
 */
export async function refundMemberOrdersStripe(params: {
  communityId: string
  eventId: string
  orders: EventMemberOrder[]
  stripe: Stripe
  nowMillis: number
}): Promise<RefundMemberOrdersStripeResult> {
  const { communityId, eventId, orders, stripe, nowMillis } = params
  const refunds: StripeRefundRecord[] = []
  const refundErrors: StripeRefundErrorRecord[] = []

  const stripeIdGroups = new Map<string, EventMemberOrder[]>()
  for (const order of orders) {
    const sid = order.stripe_id ?? ''
    const group = stripeIdGroups.get(sid)
    if (group != null) {
      group.push(order)
    } else {
      stripeIdGroups.set(sid, [order])
    }
  }

  const db = getFirestore()

  for (const [stripeId, groupOrders] of stripeIdGroups) {
    try {
      if (stripeId === '') {
        continue
      }

      const stripeDocPre = await getStripe(communityId, eventId, stripeId)
      if (stripeDocPre == null) {
        throw new Error(`stripes ドキュメントが見つかりません: ${stripeId}`)
      }

      const refundAmount = groupOrders.reduce((sum, o) => sum + o.menu_price - getMemberOrderDiscountAmount(o), 0)
      if (refundAmount <= 0) {
        logger.info('Skip Stripe refund (zero or negative amount)', {
          stripeId,
          orderIds: groupOrders.map((o) => o.id),
          refundAmount,
        })
        continue
      }
      const existingRefundTotalPre = stripeDocPre.refunds.reduce((sum, r) => sum + r.amount, 0)
      if (existingRefundTotalPre + refundAmount > stripeDocPre.pay_amount) {
        throw new Error(
          `返金累計額が決済額を超えます: existing=${existingRefundTotalPre} + new=${refundAmount} > pay_amount=${stripeDocPre.pay_amount}`,
        )
      }

      const daysSincePayment = DateTime.fromMillis(nowMillis).diff(
        DateTime.fromMillis(stripeDocPre.created_at),
        'days',
      ).days
      if (daysSincePayment > STRIPE_REFUND_WINDOW_DAYS) {
        throw new Error('返金期限を超過しています。運営にお問い合わせください')
      }

      const sortedOrderIds = groupOrders.map((o) => o.id).sort()
      const orderIdsHash = createHash('sha256').update(sortedOrderIds.join('_')).digest('hex')
      const idempotencyKey = `refund_${stripeId}_${orderIdsHash}`

      const refund = await stripe.refunds.create(
        {
          payment_intent: stripeDocPre.payment_intent,
          amount: refundAmount,
          reason: 'requested_by_customer',
        },
        { idempotencyKey },
      )

      await db.runTransaction(async (transaction) => {
        const stripeDoc = await getStripe(communityId, eventId, stripeId, transaction)
        if (stripeDoc == null) {
          throw new Error(`stripes ドキュメントが見つかりません: ${stripeId}`)
        }
        if (stripeDoc.refunds.some((r) => r.refund_id != null && r.refund_id === refund.id)) {
          return
        }
        const existingRefundTotal = stripeDoc.refunds.reduce((sum, r) => sum + r.amount, 0)
        if (existingRefundTotal + refundAmount > stripeDoc.pay_amount) {
          throw new Error(
            `返金累計額が決済額を超えます: existing=${existingRefundTotal} + new=${refundAmount} > pay_amount=${stripeDoc.pay_amount}`,
          )
        }
        stripeDoc.refunds.push({
          refund_id: refund.id,
          amount: refundAmount,
          order_ids: sortedOrderIds,
          created_at: nowMillis,
        })
        await saveStripe(communityId, eventId, stripeDoc, transaction)
      })

      refunds.push({
        stripe_id: stripeId,
        refund_id: refund.id,
        amount: refundAmount,
      })

      logger.info('Stripe refund succeeded', {
        stripeId,
        refundId: refund.id,
        amount: refundAmount,
        orderIds: sortedOrderIds,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const errorContext: Record<string, unknown> = {
        stripeId,
        orderIds: groupOrders.map((o) => o.id),
        error: message,
      }
      if (error instanceof Stripe.errors.StripeError) {
        errorContext.stripeErrorType = error.type
        errorContext.stripeErrorCode = error.code
        errorContext.stripeRequestId = error.requestId
      }
      logger.error('Stripe refund failed', errorContext)
      refundErrors.push({ stripe_id: stripeId, message })
    }
  }

  return { refunds, refundErrors }
}
