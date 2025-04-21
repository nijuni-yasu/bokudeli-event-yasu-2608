import path from 'path'
import { onRequest, HttpsError } from 'firebase-functions/v2/https'
import { defineString } from 'firebase-functions/params'
import { makePdf } from './utils/makePdf.js'
import { db, auth } from './firebase.js'
import { convertDateToId, convertDateToString, convertNumberToYen } from './utils/converter.js'
import './options/index.js'

const CORS = defineString('CORS')

export const invoice = onRequest({ cors: [CORS] }, async (req, res) => {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('JWT ')) {
    throw new HttpsError('unauthenticated', 'JWT token is required')
  }

  const idToken = authHeader.split('JWT ')[1]
  const decodedToken = await auth.verifyIdToken(idToken)
  const uid = decodedToken.uid

  const [, eventId, orderId] = req.path.split('/')
  console.info(`uid: ${uid}, eventId: ${eventId}, orderId: ${orderId}`)

  const jsonDataForMerge = await db.runTransaction(async (transaction) => {
    const events = await transaction.get(db.collectionGroup('events').where('event_id', '==', eventId))
    if (events.size !== 1) {
      res.status(404).send('Event not found')
      return
    }

    const event = events.docs[0]
    const [order, shop] = await Promise.all([
      transaction.get(event.ref.collection('orders').doc(orderId)),
      transaction.get(
        db.collection('partners').doc(event.data().partner_id).collection('shops').doc(event.data().shop_id),
      ),
    ])

    if (order.data().user_id !== uid) {
      res.status(403).send('Forbidden')
      return
    }

    const price = order.data()?.menus?.reduce((acc, v) => acc + v.price * v.count, 0)
    const date = order.data()?.ordered_at?.toDate()
    if (price == null || Number.isNaN(price) || order.data().status !== 'ordered' || date == null) {
      res.status(404).send('Order not found')
      return
    }

    const rawPrice = Math.ceil(price / 1.08)
    const tax = price - rawPrice

    let reissue = true
    let number = order.data().receipt_number
    if (number == null) {
      reissue = false
      number = convertDateToId(date)
      transaction.update(order.ref, { receipt_number: number })
    }

    return {
      event: event.data().event_name + ' / お食事代として',
      number,
      orderDate: convertDateToString(date),
      price: convertNumberToYen(price),
      date: convertDateToString(new Date()),
      shop: shop.data().shop_name,
      invoiceId: shop.data().shop_invoice_number ?? 'なし',
      address: shop.data().shop_address,
      rawPrice: convertNumberToYen(rawPrice),
      tax: convertNumberToYen(tax),
      reissue,
    }
  })

  res.status(200).setHeader('Content-Type', 'application/pdf')
  makePdf(path.join('template', 'invoice.docx'), jsonDataForMerge, res)
})
