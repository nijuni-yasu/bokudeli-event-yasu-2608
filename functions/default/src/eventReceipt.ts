import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore } from 'firebase-admin/firestore'
import path from 'path'
import { DateTime } from 'luxon'
import { EventReceiptRequest, EventReceiptResponse } from '@shokujii/common/apis/eventReceipt.js'
import { convertNumberToYen } from '@shokujii/common/utils/converter.js'
import { convertToDate, convertDateToId } from '@shokujii/common/utils/datetime.js'
import { createModuleLogger } from './utils/logger.js'
import { getEvent } from './stores/event.js'
import { getPartner } from './stores/partner.js'
import { getStripe, saveStripe } from './stores/memberOrder.js'
import { PdfGenerator } from './utils/PdfGenerator.js'

const logger = createModuleLogger('eventReceipt')

export const eventReceipt = onCall<EventReceiptRequest, Promise<EventReceiptResponse>>(
  {
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in')
    }

    const { uid } = request.auth
    const { eventId, stripeId } = request.data
    logger.info(`uid: ${uid}, eventId: ${eventId}, stripeId: ${stripeId}`)

    const event = await getEvent(eventId)
    if (event === undefined) {
      throw new HttpsError('not-found', 'Event not found')
    }

    const partner = await getPartner(event.partner_id)
    if (partner == null) {
      throw new HttpsError('not-found', 'Partner not found')
    }

    const shop = await partner.getShop(event.shop_id)
    if (shop === undefined) {
      throw new HttpsError('not-found', 'Shop not found')
    }

    const db = getFirestore()
    const { receiptNumber, reissue, stripe } = await db.runTransaction(async (transaction) => {
      const stripeRow = await getStripe(event.community_id, eventId, stripeId, transaction)
      if (stripeRow === undefined) {
        throw new HttpsError('not-found', 'Stripe not found')
      }
      if (stripeRow.user_id !== uid) {
        throw new HttpsError('permission-denied', 'Forbidden')
      }

      if (stripeRow.receipt_number != null) {
        return {
          receiptNumber: stripeRow.receipt_number,
          reissue: true,
          stripe: stripeRow,
        }
      }
      const num = convertDateToId(stripeRow.created_at)
      stripeRow.receipt_number = num
      await saveStripe(event.community_id, eventId, stripeRow, transaction)
      return { receiptNumber: num, reissue: false, stripe: stripeRow }
    })

    const refundedTotal = stripe.refunds.reduce((sum, r) => sum + r.amount, 0)
    // 個別キャンセル後は返金分を差し引いた残額を領収書に記載（番号は初回採番のまま、再発行時は金額のみ更新）
    const totalPrice = Math.max(0, stripe.pay_amount - refundedTotal)
    const exTaxPrice = Math.ceil(totalPrice / 1.08)
    const taxPrice = totalPrice - exTaxPrice

    const jsonDataForMerge = {
      event: event.event_name + ' / お食事代として',
      number: receiptNumber,
      orderDate: convertToDate(stripe.created_at),
      price: convertNumberToYen(totalPrice),
      date: convertToDate(DateTime.now().toMillis()),
      shop: shop.shop_name,
      invoiceId: shop.shop_invoice_number ?? 'なし',
      address: shop.fullAddress,
      rawPrice: convertNumberToYen(exTaxPrice),
      tax: convertNumberToYen(taxPrice),
      reissue,
    }

    const pdfGenerator = new PdfGenerator()
    const url = await pdfGenerator.executeDocumentMergeForUrl(path.join('templates', 'receipt.docx'), jsonDataForMerge)
    if (url === undefined) {
      throw new HttpsError('internal', 'Failed to generate PDF')
    }
    return { url }
  },
)
