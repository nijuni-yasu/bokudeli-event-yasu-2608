import path from 'path'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { onRequest, HttpsError } from 'firebase-functions/v2/https'
import { defineList } from 'firebase-functions/params'
import { makePdf } from './utils/makePdf.js'
import { convertNumberToYen } from './utils/converter.js'
import { convertToDate, convertToDuration, convertDateToId, getLastDayOfNextMonth } from './utils/datetime.js'
import './options/index.js'
import { getEventUrl } from './utils/urls.js'

const CORS = defineList('CORS')

export const eventBillInvoice = onRequest({ cors: CORS, timeoutSeconds: 120 }, async (req, res) => {
  const authHeader = req.headers.authorization ?? ''
  if (!authHeader.startsWith('JWT ')) {
    throw new HttpsError('unauthenticated', 'JWT token is required')
  }

  const idToken = authHeader.split('JWT ')[1]
  const decodedToken = await getAuth().verifyIdToken(idToken)
  const uid = decodedToken.uid

  const [, eventId] = req.path.split('/')

  const db = getFirestore()
  const jsonDataForMerge = await db.runTransaction(async (transaction) => {
    const events = await transaction.get(db.collectionGroup('events').where('event_id', '==', eventId))
    if (events.size !== 1) {
      res.status(404).send('Event not found')
      return null
    }

    const event = events.docs[0]
    if (event.get('event_payment') !== 'community_bill' || event.get('event_start_datetime').toMillis() > Date.now()) {
      res.status(404).send('Event not found')
      return null
    }

    const community = await transaction.get(db.collection('communities').doc(event.get('community_id')))

    const isManager = community.get('managers').some((manager) => manager.isEqual(db.collection('users').doc(uid)))
    if (!isManager) {
      res.status(403).send('Forbidden')
      return null
    }

    let tax08Inclusive = 0
    let tax10Inclusive = 0
    const _items = (await transaction.get(event.ref.collection('orders').where('status', '==', 'ordered'))).docs.reduce(
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

    let number = event.get('invoice_number')
    const eventEndDatetime = event.get('event_end_datetime').toMillis()
    if (number == null) {
      number = convertDateToId(eventEndDatetime)
      transaction.update(event.ref, { invoice_number: number })
    }

    const total = tax08Inclusive + tax10Inclusive
    const tax8SubTotal = Math.floor(tax08Inclusive / 1.08)
    const tax8 = tax08Inclusive - tax8SubTotal
    const tax10SubTotal = Math.floor(tax10Inclusive / 1.1)
    const tax10 = tax10Inclusive - tax10SubTotal
    const tax = tax8 + tax10
    const subTotal = tax8SubTotal + tax10SubTotal

    return {
      number,
      date: convertToDate(eventEndDatetime),
      companyName: event.get('organizer_company'),
      companyPersonName: event.get('bill_fullname'),
      companyPostalCode: community.get('community_postalcode'),
      companyAddress: community.get('community_address'),
      companyPhoneNumber: community.get('community_phone'),
      title: event.get('event_name').substring(0, 18),
      items,
      subTotal: convertNumberToYen(subTotal),
      tax: convertNumberToYen(tax),
      total: convertNumberToYen(total),
      tax10SubTotal: convertNumberToYen(tax10SubTotal),
      tax10: convertNumberToYen(tax10),
      tax8SubTotal: convertNumberToYen(tax8SubTotal),
      tax8: convertNumberToYen(tax8),
      deadline: convertToDate(getLastDayOfNextMonth(eventEndDatetime).toMillis()),
      eventName: event.get('event_name'),
      eventDate: convertToDuration(
        event.get('event_start_datetime').toMillis(),
        event.get('event_end_datetime').toMillis(),
      ),
      shopName: event.get('shop_name'),
      eventUrl: getEventUrl(event.get('community_account'), eventId),
    }
  })

  if (jsonDataForMerge != null) {
    res.status(200).setHeader('Content-Type', 'application/pdf')
    makePdf(path.join('template', 'eventBillInvoice.docx'), jsonDataForMerge, res)
  }
})
