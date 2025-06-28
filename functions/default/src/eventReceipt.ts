import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { onCall, HttpsError } from 'firebase-functions/https'
import path from 'path'
import { EventReceiptRequest, EventReceiptResponse } from '@shokujii/common/apis/eventReceipt.js'
import { convertNumberToYen } from '@shokujii/common/utils/converter.js'
import { convertToDate, convertDateToId } from '@shokujii/common/utils/datetime.js'
import { getEvent } from './stores/event.js'
import { getPartner } from './stores/partner.js'
import { PdfGenerator } from './utils/PdfGenerator.js'

export const eventReceipt = onCall<EventReceiptRequest, Promise<EventReceiptResponse>>(
  {
    secrets: ['PDF_SERVICES_CLIENT_ID', 'PDF_SERVICES_CLIENT_SECRET'],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be logged in')
    }

    const { uid } = request.auth
    const { eventId, orderId } = request.data
    logger.info(`uid: ${uid}, eventId: ${eventId}, orderId: ${orderId}`)

    const db = getFirestore()
    const jsonDataForMerge = await db.runTransaction(async (transaction) => {
      const event = await getEvent(eventId, transaction)
      if (event === undefined) {
        throw new HttpsError('not-found', 'Event not found')
      }
      const partner = await getPartner(event.partner_id)
      if (partner == null) {
        throw new HttpsError('not-found', 'Partner not found')
      }

      const [order, shop] = await Promise.all([
        event.getOrder(orderId, transaction),
        partner.getShop(event.shop_id, transaction),
      ])
      if (shop === undefined) {
        throw new HttpsError('not-found', 'Shop not found')
      }

      if (order === undefined || order.status !== 'ordered' || order.ordered_at === undefined) {
        throw new HttpsError('not-found', 'Order not found')
      }
      if (order.user_id !== uid) {
        throw new HttpsError('permission-denied', 'Forbidden')
      }

      let reissue = true
      if (order.receipt_number == null) {
        reissue = false
        order.receipt_number = convertDateToId(order.ordered_at)
        event.saveOrder(order, transaction)
      }

      return {
        event: event.event_name + ' / お食事代として',
        number: order.receipt_number,
        orderDate: convertToDate(order.ordered_at),
        price: convertNumberToYen(order.totalPrice),
        date: convertToDate(Date.now()),
        shop: shop.shop_name,
        invoiceId: shop.shop_invoice_number ?? 'なし',
        address: shop.shop_address,
        rawPrice: convertNumberToYen(order.ExTaxPrice),
        tax: convertNumberToYen(order.TaxPrice),
        reissue,
      }
    })

    const pdfGenerator = new PdfGenerator()
    const url = await pdfGenerator.executeDocumentMergeForUrl(path.join('templates', 'receipt.docx'), jsonDataForMerge)
    if (url === undefined) {
      throw new HttpsError('internal', 'Failed to generate PDF')
    }
    return { url }
  },
)
