import path from 'path'
import { getAuth } from 'firebase-admin/auth'
import { DocumentSnapshot, getFirestore } from 'firebase-admin/firestore'
import { onRequest, HttpsError } from 'firebase-functions/v2/https'
import { defineList } from 'firebase-functions/params'
import { makePdf } from './utils/makePdf.js'
import { convertNumberToYen } from './utils/converter.js'
import { convertToDate, convertToDuration, convertDateToId, getLastDayOfNextMonth } from './utils/datetime.js'
import { getEventUrl } from './utils/urls.js'
import { Storage } from '@google-cloud/storage'
import { combineStream } from './utils/stream.js'
import { generateRandomBase64UrlSafeString } from './utils/misc.js'
import './options/index.js'

const CORS = defineList('CORS')
const INVOICE_BUCKET_NAME = `gs://${process.env.GCLOUD_PROJECT}-invoice`

const getInvoiceFile = async (eventId, invoiceId) => {
  const storage = new Storage()
  const bucket = storage.bucket(INVOICE_BUCKET_NAME)
  return bucket.file(`${eventId}/${invoiceId}`)
}

const getInvoiceId = async (eventId) => {
  const storage = new Storage()
  const bucket = storage.bucket(INVOICE_BUCKET_NAME)
  const [files] = await bucket.getFiles({ prefix: eventId })
  if (files.length === 1) {
    return files[0].name.replace(`${eventId}/`, '')
  } else {
    return null
  }
}

export const getEventBillInvoice = async (eventId, invoiceId, writableStream) => {
  const file = await getInvoiceFile(eventId, invoiceId)

  // Check if the file exists
  const [exists] = await file.exists()
  if (!exists) {
    throw new Error(`File not found in bucket: ${file.name}`)
  }

  // Create a readable stream and pipe it to the writable stream
  file
    .createReadStream({ encoding: null }) // Ensure no encoding is applied (binary mode)
    .on('error', (err) => {
      console.error('Error reading file from bucket:', err)
      writableStream.end() // Ensure the writable stream is closed
      throw err
    })
    .pipe(writableStream)
}

/**
 *
 * @param {DocumentSnapshot} communitySnapshot
 * @param {DocumentSnapshot} eventSnapshot
 * @param {WritableStream} writableStream
 * @returns {Promise<string | null>} invoiceId
 */
export const createEventBillInvoice = async (communitySnapshot, eventSnapshot, writableStream) => {
  const invoiceId = await getInvoiceId(eventSnapshot.id)
  if (invoiceId != null) {
    if (writableStream != null) {
      await getEventBillInvoice(eventSnapshot.id, invoiceId, writableStream)
    } else {
      console.warn('Invoice already exists, skipping')
    }
    return invoiceId
  }

  let tax08Inclusive = 0
  let tax10Inclusive = 0
  const _items = (await eventSnapshot.ref.collection('orders').where('status', '==', 'ordered').get()).docs.reduce(
    (acc, order) => {
      const menus = order.get('menus')
      menus?.forEach((menu) => {
        const totalPrice = menu.price * menu.count
        tax08Inclusive += totalPrice

        const m = acc.get(menu.menu_id)
        if (m == null) {
          acc.set(menu.menu_id, {
            name: menu.name.substring(0, 21) + '(※)',
            price: menu.price,
            count: menu.count,
            totalPrice,
          })
        } else {
          m.count += menu.count
          m.totalPrice += totalPrice
        }
      })
      return acc
    },
    new Map(),
  )
  const items = Array.from(_items.values())
  // 今のところは請求手数料は含めない
  // if (items.length !== 0) {
  //   const price = Math.floor(tax08Inclusive * 0.1)
  //   tax10Inclusive += price
  //   items.push({
  //     name: '請求手数料',
  //     count: 1,
  //     price: price,
  //     totalPrice: price * 1,
  //   })
  // }
  items.forEach((item) => {
    item.totalPrice = convertNumberToYen(item.totalPrice)
    item.price = convertNumberToYen(item.price)
  })
  // 12行に満たない場合は空行を追加
  for (let i = items.length; i < 12; i++) {
    items.push({
      name: '',
      count: '',
      price: '',
      totalPrice: '',
    })
  }
  const eventEndDatetime = eventSnapshot.get('event_end_datetime').toMillis()
  const number = convertDateToId(eventEndDatetime)
  const total = tax08Inclusive + tax10Inclusive
  const tax8SubTotal = Math.floor(tax08Inclusive / 1.08)
  const tax8 = tax08Inclusive - tax8SubTotal
  const tax10SubTotal = Math.floor(tax10Inclusive / 1.1)
  const tax10 = tax10Inclusive - tax10SubTotal
  const tax = tax8 + tax10
  const subTotal = tax8SubTotal + tax10SubTotal

  const jsonDataForMerge = {
    number,
    date: convertToDate(eventEndDatetime),
    companyName: eventSnapshot.get('organizer_company'),
    companyPersonName: eventSnapshot.get('bill_fullname'),
    companyPostalCode: communitySnapshot.get('community_postalcode'),
    companyAddress: communitySnapshot.get('community_address'),
    companyPhoneNumber: communitySnapshot.get('community_phone'),
    title: eventSnapshot.get('event_name').substring(0, 18),
    items,
    subTotal: convertNumberToYen(subTotal),
    tax: convertNumberToYen(tax),
    total: convertNumberToYen(total),
    tax10SubTotal: convertNumberToYen(tax10SubTotal),
    tax10: convertNumberToYen(tax10),
    tax8SubTotal: convertNumberToYen(tax8SubTotal),
    tax8: convertNumberToYen(tax8),
    deadline: convertToDate(getLastDayOfNextMonth(eventEndDatetime).toMillis()),
    eventName: eventSnapshot.get('event_name'),
    eventDate: convertToDuration(
      eventSnapshot.get('event_start_datetime').toMillis(),
      eventSnapshot.get('event_end_datetime').toMillis(),
    ),
    shopName: eventSnapshot.get('shop_name'),
    eventUrl: getEventUrl(eventSnapshot.get('community_account'), eventSnapshot.id),
  }

  const generatedInvoiceId = generateRandomBase64UrlSafeString()
  const storageFileStream = (await getInvoiceFile(eventSnapshot.id, generatedInvoiceId)).createWriteStream()
  const outStream = writableStream == null ? storageFileStream : combineStream(storageFileStream, writableStream)
  await makePdf(path.join('template', 'eventBillInvoice.docx'), jsonDataForMerge, outStream)
  return generatedInvoiceId
}

export const eventBillInvoice = onRequest({ cors: CORS, timeoutSeconds: 120 }, async (req, res) => {
  const [, eventId] = req.path.split('/')
  const invoiceId = req.query.id
  if (invoiceId != null) {
    res.status(200).setHeader('Content-Type', 'application/pdf')
    await getEventBillInvoice(eventId, invoiceId, res)
    return
  }

  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('JWT ')) {
    throw new HttpsError('unauthenticated', 'JWT token is required')
  }

  const idToken = authHeader.split('JWT ')[1]
  const decodedToken = await getAuth().verifyIdToken(idToken)
  const uid = decodedToken.uid
  const db = getFirestore()
  const events = await db.collectionGroup('events').where('event_id', '==', eventId).get()
  if (events.size !== 1) {
    res.status(404).send('Event not found')
    return null
  }

  const event = events.docs[0]
  if (event.get('event_payment') !== 'community_bill' || event.get('event_start_datetime').toMillis() > Date.now()) {
    res.status(404).send('Event not found')
    return null
  }

  const community = await db.collection('communities').doc(event.get('community_id')).get()
  const isManager = community.get('managers').some((manager) => manager.isEqual(db.collection('users').doc(uid)))
  if (!isManager) {
    res.status(403).send('Forbidden')
    return null
  }

  res.status(200).setHeader('Content-Type', 'application/pdf')
  await createEventBillInvoice(community, event, res)
})
