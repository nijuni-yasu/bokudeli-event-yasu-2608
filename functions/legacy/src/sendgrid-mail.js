import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import sgMail from '@sendgrid/mail'
import { convertTruncateText } from './utils/converter.js'
import { makeIcs } from './make-ics.js'
import {
  getCommunityUrl,
  getEventUrl,
  getOrderUrl,
  getUserUrl,
  getManageEventMemberUrl,
  getManageEventInvoiceUrl,
} from './utils/urls.js'
import { DEFAULT_FROM, DEFAULT_TO, SUPPORT_MAIL } from './utils/mail.js'
import {
  convertToDateWeekdayShort,
  convertToDatetimeWeekdayShort,
  convertToDuration,
  convertToJustDate,
} from './utils/datetime.js'
import { createEventBillInvoice } from './eventBillInvoice.js'

const ORDER_DEADLINE_TEMPLATE_ID = 'd-8609b6a7b1514595ae68d18532331e0e'
const ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID = 'd-1099d87af79f4d898012db3b8024715f'
const ORDER_REMIND_FOR_ORGANIZER_TEMPLATE_ID = 'd-89612eeb2f1f42a98c92b543b870616c'
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b' // 開発バージョンに変更
const REJECT_ORDER_TEMPLATE_ID = 'd-f968252a99864a1a9e126b9863944832'
const DELIVERY_DURATION = 30 // minutes

const EVENT_INFORMATION_TEMPLATE_ID = 'd-797deb1c54984007baadd1926ee974a2'
const EVENT_CONFIRMATION_TEMPLATE_ID = 'd-2fea06c315a240d2becd864b54f38098'
const EVENT_SURVEY_TEMPLATE_ID = 'd-6ad8131506164c2f864155182c63de2d'
const EVENT_INVOICE_TEMPLATE_ID = 'd-48e3179255834b8bb895cd995b1aac28'
const ORDER_COMPLETION_TEMPLATE_ID = 'd-b94849438f2642a29973670f3d79809f'
const ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID = 'd-38e33bff82d740d88b33b56347f63df7'
// 環境変数の方がよいかもしれない
const EVENT_INFORMATION_UNSUBSCRIBE_GROUP = 25345

const EVENT_STATUS_APPLYING_RESERVATION_ID = 'd-238517a9044c441598d1d0d7d4a7d0b7'
const EVENT_STATUS_IN_DRAFT_ID = 'd-4f62892bece349e494cc0d545143f145'
const EVENT_STATUS_ACCEPTING_ORDER_ID = 'd-badaf130bf664cf3badb1ef2aab9f60c'
const LETTER_ID = 'd-e1ca1ca620374bfeaf0697495dbacb20'

const IN_CART_NOTIFICATION_ID = 'd-148ab4d0aef644de815cc684c92a87de'
const USER_PASS_CODE = 'd-84540f5feaf8422484b65bdc2be739fe'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const db = getFirestore()

async function getUserEmail(userId) {
  const userPersonalInformationRef = db.collection('users_personal_information').doc(userId)
  const userPersonalInformationSnapshot = await userPersonalInformationRef.get()
  return userPersonalInformationSnapshot.get('user_email')
}

async function getUserEmailWithName(userId) {
  const [userPersonalInformationRef, userRef] = await Promise.all([
    db.collection('users_personal_information').doc(userId).get(),
    db.collection('users').doc(userId).get(),
  ])
  return {
    email: userPersonalInformationRef.get('user_email'),
    name: userRef.get('user_name'),
  }
}

async function getShopForEvent(eventSnapshot) {
  const shopId = eventSnapshot.get('shop_id')
  const partnerId = eventSnapshot.get('partner_id')
  const shopRef = db.collection('partners').doc(partnerId).collection('shops').doc(shopId)
  return await shopRef.get()
}

function getShopEmails(shopSnapshot) {
  const emails = new Set()
  for (const field of ['shop_email', 'shop_email_sub1', 'shop_email_sub2', 'shop_email_sub3']) {
    const mail = shopSnapshot.get(field)
    if (mail != null && mail !== '') {
      emails.add(mail)
    }
  }
  return Array.from(emails)
}

async function getCommunityManagerEmailsSet(communityId) {
  // 重複するメールアドレスは追加しない
  const emails = new Set()
  const membersRef = db.collection('communities').doc(communityId).collection('members')
  const membersSnapshot = await membersRef.get()
  await Promise.all(
    membersSnapshot.docs.map(async (member) => {
      const roles = member.get('roles')
      if (roles instanceof Array && roles.includes('manager')) {
        const userEmail = await getUserEmail(member.id)
        if (userEmail != null && userEmail !== '') {
          emails.add(userEmail)
        }
      }
    }),
  )
  return emails
}

async function getCommunityEmailsForEvent(eventSnapshot) {
  const communityId = eventSnapshot.ref.parent.parent.id
  const emails = await getCommunityManagerEmailsSet(communityId)

  const organizerEmail = eventSnapshot.get('organizer_email')
  if (organizerEmail != null && organizerEmail !== '') {
    emails.add(organizerEmail)
  }
  return Array.from(emails)
}

async function getEventMemberEmails(eventSnapshotOrId) {
  let eventSnapshot
  if (typeof eventSnapshotOrId === 'string') {
    eventSnapshot = (await db.collectionGroup('events').where('event_id', '==', eventSnapshotOrId).get()).docs[0]
  } else {
    eventSnapshot = eventSnapshotOrId
  }
  const usersSet = await getUsersFromOrders(eventSnapshot.ref.collection('orders'))
  const emails = await Promise.all(Array.from(usersSet).map(getUserEmail))
  return emails.filter((email) => email != null && email !== '')
}

async function getCommunityEmails(communityId) {
  const emails = await getCommunityManagerEmailsSet(communityId)
  if (emails.size === 0) {
    // コミュマネがいない場合はsupport+to@nijuni.jpに送信
    emails.add(SUPPORT_MAIL)
  }
  return Array.from(emails)
}

//コミュニティユーザーのIDを取得
async function getCommunityMemberIds(communityId) {
  try {
    const communityMembersRef = db.collection('communities').doc(communityId).collection('members')
    const communityMembersSnapshot = await communityMembersRef.get()

    if (communityMembersSnapshot.empty) {
      console.warn(`No members found for community: ${communityId}`)
      return []
    }
    return communityMembersSnapshot.docs.map((member) => member.id)
  } catch (error) {
    console.error(`Error fetching community members: ${error}`)
    throw error
  }
}
// イベント参加者のユーザーIDを取得
async function getParticipantIds(eventId) {
  try {
    if (!eventId) {
      console.warn('No event_id provided')
      return []
    }
    const ordersRef = db.collectionGroup('orders').where('event_id', '==', eventId)
    const ordersSnapshot = await ordersRef.get()
    if (ordersSnapshot.empty) {
      console.warn(`No orders found for event: ${eventId}`)
      return []
    }
    return ordersSnapshot.docs.filter((order) => order.get('status') === 'ordered').map((order) => order.get('user_id'))
  } catch (error) {
    console.error(`Error fetching event participants: ${error}`)
    throw error
  }
}

async function createOrdersForOrderRemind(ordersRef) {
  const promises = []
  const orders_by_status = {}
  for (const orderRef of await ordersRef.listDocuments()) {
    const orderSnapshot = await orderRef.get()
    const status = orderSnapshot.get('status')
    const userRef = db.collection('users').doc(orderSnapshot.get('user_id'))
    for (const menu of orderSnapshot.get('menus') ?? []) {
      const promise = userRef.get().then((userSnapshot) => {
        for (let i = 0; i < menu.count; i++) {
          if (!orders_by_status[status]) {
            orders_by_status[status] = []
          }
          orders_by_status[status].push({
            name: userSnapshot.get('user_name'),
            order: menu.name,
            price: `¥${menu.price}`,
            status,
          })
        }
      })
      promises.push(promise)
    }
  }
  await Promise.all(promises)

  for (const orders of Object.values(orders_by_status)) {
    orders.sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
    orders.forEach((order, i) => (order.number = i + 1))
  }
  return orders_by_status
}

async function createOrdersForOrderDeadline(ordersRef) {
  const promises = []
  const orders = []
  let count = 0
  let price = 0
  for (const orderRef of await ordersRef.listDocuments()) {
    const orderSnapshot = await orderRef.get()
    if (orderSnapshot.get('status') !== 'ordered') {
      continue
    }
    const userRef = db.collection('users').doc(orderSnapshot.get('user_id'))
    for (const menu of orderSnapshot.get('menus') ?? []) {
      const promise = userRef.get().then((userSnapshot) => {
        for (let i = 0; i < menu.count; i++) {
          orders.push({
            name: userSnapshot.get('user_name'),
            order: menu.name,
            price: `¥${menu.price}`,
          })
          count++
          price += menu.price
        }
      })
      promises.push(promise)
    }
  }
  await Promise.all(promises)
  orders
    .sort((a, b) => (a.order > b.order ? 1 : a.order < b.order ? -1 : 0))
    .forEach((order, i) => (order.number = i + 1))
  return [count, price, orders]
}

async function createTemplateDataForOrderDeadline(eventSnapshot) {
  const ordersRef = eventSnapshot.ref.collection('orders')
  const [order_count, order_total_price, orders] = await createOrdersForOrderDeadline(ordersRef)
  const eventData = eventSnapshot.data()
  const event_start_datetime = eventData.event_start_datetime?.toMillis()
  const date = convertToDateWeekdayShort(event_start_datetime)
  const deliveryDuration = convertToDuration(event_start_datetime - DELIVERY_DURATION * 60 * 1000, event_start_datetime)
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`
  const event_deadline_datetime = convertToDatetimeWeekdayShort(eventData.event_deadline_datetime?.toMillis())

  return {
    ...eventData,
    date,
    delivery_date,
    event_deadline_datetime,
    order_count,
    order_total_price,
    event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
    orders,
    order_url: getOrderUrl(eventSnapshot.id),
  }
}

async function sendOrderDeadlineMailToShop(start, end, is_reminder) {
  const events = await db
    .collectionGroup('events')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(start))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .get()
  return Promise.all(
    events.docs.map(async (eventSnapshot) => {
      try {
        const [dynamic_template_data, shopSnapShot] = await Promise.all([
          createTemplateDataForOrderDeadline(eventSnapshot),
          getShopForEvent(eventSnapshot),
        ])
        dynamic_template_data.is_reminder = is_reminder
        await sgMail.send({
          to: getShopEmails(shopSnapShot),
          from: DEFAULT_FROM,
          cc: SUPPORT_MAIL,
          templateId: ORDER_DEADLINE_TEMPLATE_ID,
          dynamic_template_data,
        })
      } catch (err) {
        console.warn(err)
      }
    }),
  )
}

async function createTemplateDataForOrganizersOrderRemind(eventSnapshot, event_days_ago) {
  const ordersRef = eventSnapshot.ref.collection('orders')
  const orders = await createOrdersForOrderRemind(ordersRef)
  const eventData = eventSnapshot.data()
  const event_datetime = convertToDuration(
    eventData.event_start_datetime?.toMillis(),
    eventData.event_end_datetime?.toMillis(),
  )
  const event_deadline_datetime = convertToDatetimeWeekdayShort(eventData.event_deadline_datetime?.toMillis())

  return {
    ...eventData,
    event_days_ago,
    event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
    manage_event_member_url: getManageEventMemberUrl(eventSnapshot.id),
    event_deadline_datetime,
    event_datetime,
    orders,
  }
}

async function sendOrderRemindMailToOrganizer(start, end, event_days_ago) {
  const events = await db
    .collectionGroup('events')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(start))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .get()

  const promises = []
  await events.docs.forEach(async (eventSnapshot) => {
    try {
      const dynamic_template_data = await createTemplateDataForOrganizersOrderRemind(eventSnapshot, event_days_ago)
      const communityEmails = await getCommunityEmailsForEvent(eventSnapshot)
      communityEmails
        .map(async (to) => {
          await sgMail.send({
            to,
            from: DEFAULT_FROM,
            templateId: ORDER_REMIND_FOR_ORGANIZER_TEMPLATE_ID,
            dynamic_template_data,
          })
        })
        .forEach((promise) => promises.push(promise))
    } catch (err) {
      console.warn(err)
    }
  })

  return Promise.all(promises)
}

async function createTemplateDataForOrganizersOrderDeadline(eventSnapshot) {
  const ordersRef = eventSnapshot.ref.collection('orders')
  const [order_count, _, orders] = await createOrdersForOrderDeadline(ordersRef)
  const eventData = eventSnapshot.data()
  const event_start_datetime = eventData.event_start_datetime?.toMillis()
  const date = convertToDateWeekdayShort(event_start_datetime)
  const event_deadline_datetime = convertToDatetimeWeekdayShort(eventData.event_deadline_datetime?.toMillis())
  const deliveryDuration = convertToDuration(event_start_datetime - DELIVERY_DURATION * 60 * 1000, event_start_datetime)
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`

  const shopSnapshot = await getShopForEvent(eventSnapshot)
  const shopData = shopSnapshot.data()

  return {
    ...shopData,
    ...eventData,
    date,
    event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
    event_deadline_datetime,
    order_count,
    orders,
    delivery_date,
  }
}

async function sendOrderDeadlineMailToOrganizers(start, end) {
  const events = await db
    .collectionGroup('events')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(start))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .get()

  const promises = []
  await events.docs.forEach(async (eventSnapshot) => {
    try {
      const dynamic_template_data = await createTemplateDataForOrganizersOrderDeadline(eventSnapshot)
      const communityEmails = await getCommunityEmailsForEvent(eventSnapshot)
      communityEmails
        .map(async (to) => {
          await sgMail.send({
            to,
            from: DEFAULT_FROM,
            templateId: ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID,
            dynamic_template_data,
          })
        })
        .forEach((promise) => promises.push(promise))
    } catch (err) {
      console.warn(err)
    }
  })

  return Promise.all(promises)
}

async function sendOrderDeadlineMailToMembers(start, end) {
  const events = await db
    .collectionGroup('events')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(start))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .get()
  return Promise.all(
    events.docs.map(async (eventSnapshot) => {
      const eventData = eventSnapshot.data()
      const dynamic_template_data = {
        date: convertToDateWeekdayShort(eventData.event_start_datetime?.toMillis()),
        event_datetime: convertToDuration(
          eventData.event_start_datetime?.toMillis(),
          eventData.event_end_datetime?.toMillis(),
        ),
        event_name: eventData.event_name,
        event_cover_url: eventData.event_cover_url,
        community_name: eventData.community_name,
        event_address: eventData.event_address,
        shop_name: eventData.shop_name,
        event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
      }
      try {
        await Promise.all(
          (await getEventMemberEmails(eventSnapshot)).map(async (to) => {
            await sgMail.send({
              to,
              from: DEFAULT_FROM,
              templateId: EVENT_CONFIRMATION_TEMPLATE_ID,
              dynamic_template_data,
            })
          }),
        )
      } catch (err) {
        console.warn(err)
      }
    }),
  )
}

async function sendEventConcludedMailToMembers(start, end) {
  const events = await db
    .collectionGroup('events')
    .where('event_end_datetime', '>', Timestamp.fromMillis(start))
    .where('event_end_datetime', '<=', Timestamp.fromMillis(end))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .get()
  return Promise.all(
    events.docs.map(async (eventSnapshot) => {
      const eventData = eventSnapshot.data()
      const dynamic_template_data = {
        date: convertToDateWeekdayShort(eventData.event_start_datetime?.toMillis()),
        event_name: eventData.event_name,
        event_cover_url: eventData.event_cover_url,
        event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
        is_public: eventData.is_public,
      }
      try {
        await Promise.all(
          (await getEventMemberEmails(eventSnapshot)).map(async (to) => {
            await sgMail.send({
              to,
              from: DEFAULT_FROM,
              templateId: EVENT_SURVEY_TEMPLATE_ID,
              dynamic_template_data,
            })
          }),
        )
      } catch (err) {
        console.warn(err)
      }
    }),
  )
}

async function sendInvoiceMailToOrganizers(start, end) {
  // sendEventConcludedMailToMembers と同じイベントを取得トライを毎分行うことになるので、無駄は多い
  // TODO polling のロジックの最適化
  const events = await db
    .collectionGroup('events')
    .where('event_end_datetime', '>', Timestamp.fromMillis(start))
    .where('event_end_datetime', '<=', Timestamp.fromMillis(end))
    .where('event_status.value', '==', 'accepting_order')
    // 全く同じ時間に終了するイベントはほぼ存在し得ないので、index を張るのではなく、取得後の filter で絞り込む
    // .where('event_payment', '==', 'community_bill')
    .where('is_deleted', '==', false)
    .get()
  return Promise.all(
    events.docs
      .filter((eventSnapshot) => eventSnapshot.get('event_payment') === 'community_bill')
      .map(async (eventSnapshot) => {
        try {
          const communitySnapshot = await db.collection('communities').doc(eventSnapshot.get('community_id')).get()
          const invoiceId = await createEventBillInvoice(communitySnapshot, eventSnapshot)
          const dynamic_template_data = {
            company: eventSnapshot.get('organizer_company'),
            person: eventSnapshot.get('bill_fullname'),
            event_name: eventSnapshot.get('event_name'),
            event_invoice_url: getManageEventInvoiceUrl(eventSnapshot.id, invoiceId),
          }
          const to = eventSnapshot.get('bill_email')
          const cc = eventSnapshot.get('organizer_email')
          await sgMail.send({
            to,
            from: DEFAULT_FROM,
            cc: to !== cc ? cc : [],
            bcc: SUPPORT_MAIL,
            templateId: EVENT_INVOICE_TEMPLATE_ID,
            dynamic_template_data,
          })
        } catch (err) {
          console.warn(JSON.stringify(err))
        }
      }),
  )
}

async function getLastUpdatedEventStatus(eventSnapshot, status) {
  const logsSnapshot = await eventSnapshot.ref.collection('logs').orderBy('updated_at', 'desc').get()
  for (const logSnapshot of logsSnapshot.docs) {
    if (logSnapshot.get('event_status.value') === status) {
      return logSnapshot.get('updated_at')
    }
  }
  return null
}

async function createTemplateDataForApplyingOrder(eventSnapshot, updatedAt) {
  const limitTimeMills = updatedAt.toMillis() + 3 * 24 * 60 * 60 * 1000

  const dynamic_template_data = await createTemplateDataForOrderDeadline(eventSnapshot)
  return {
    ...dynamic_template_data,
    approve_deadline_datetime: convertToDateWeekdayShort(limitTimeMills),
  }
}

async function sendApplyingOrderMailToShop(eventSnapshot) {
  const updatedAt = await getLastUpdatedEventStatus(eventSnapshot, 'applying_reservation')

  const [dynamic_template_data, shopSnapShot] = await Promise.all([
    // ログ機能導入前のイベントには updatedAt がないため、その場合は現在時刻を使用する
    createTemplateDataForApplyingOrder(eventSnapshot, updatedAt ? updatedAt : Timestamp.now()),
    getShopForEvent(eventSnapshot),
  ])
  return sgMail.send({
    to: getShopEmails(shopSnapShot),
    from: DEFAULT_FROM,
    cc: SUPPORT_MAIL,
    templateId: APPLYING_ORDER_TEMPLATE_ID,
    dynamic_template_data,
  })
}

async function sendApplyingOrderRemindMailToShop(start, end) {
  const nowDateTimeMillis = Date.now()
  const events = await db
    .collectionGroup('events')
    .where('event_status.value', '==', 'applying_reservation')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(nowDateTimeMillis))
    .where('is_deleted', '==', false)
    .get()

  const sendMailPromises = events.docs
    .map(async (eventSnapshot) => {
      // applying_reservation に変更したログで一番新しいものを取得
      const updatedAt = await getLastUpdatedEventStatus(eventSnapshot, 'applying_reservation')
      if (updatedAt != null && updatedAt.toMillis() > start && updatedAt.toMillis() <= end) {
        const [dynamic_template_data, shopSnapShot] = await Promise.all([
          createTemplateDataForApplyingOrder(eventSnapshot, updatedAt),
          getShopForEvent(eventSnapshot),
        ])
        dynamic_template_data.is_reminder = true
        return sgMail.send({
          to: getShopEmails(shopSnapShot),
          from: DEFAULT_FROM,
          cc: SUPPORT_MAIL,
          templateId: APPLYING_ORDER_TEMPLATE_ID,
          dynamic_template_data,
        })
      }
      return null
    })
    .filter((promise) => promise != null)
  return Promise.all(sendMailPromises)
}

async function sendRejectOrderMailToShop(start, end) {
  const nowDateTimeMillis = Date.now()
  const events = await db
    .collectionGroup('events')
    .where('event_status.value', '==', 'applying_reservation')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(nowDateTimeMillis))
    .where('is_deleted', '==', false)
    .get()

  const sendMailPromises = events.docs
    .map(async (eventSnapshot) => {
      // applying_reservation に変更したログで一番新しいものを取得
      const updatedAt = await getLastUpdatedEventStatus(eventSnapshot, 'applying_reservation')
      if (updatedAt == null || updatedAt.toMillis() <= start || updatedAt.toMillis() > end) {
        return null
      }
      eventSnapshot.ref.update({ 'event_status.value': 'in_draft' })

      const [dynamic_template_data, shopSnapShot] = await Promise.all([
        createTemplateDataForOrderDeadline(eventSnapshot),
        getShopForEvent(eventSnapshot),
      ])
      return sgMail.send({
        to: getShopEmails(shopSnapShot),
        from: DEFAULT_FROM,
        cc: SUPPORT_MAIL,
        templateId: REJECT_ORDER_TEMPLATE_ID,
        dynamic_template_data,
      })
    })
    .filter((promise) => promise != null)

  return Promise.all(sendMailPromises)
}

async function sendApplyingMailToAdmin(eventSnapshot) {
  // TODO これ以上複雑になるようなら、テンプレートを使う
  const subject = `店舗「${eventSnapshot.get('shop_name')}」主催のイベントが申請されました`
  const text =
    `【ID】 ${eventSnapshot.ref.id}\n` +
    `【イベント名】 ${eventSnapshot.get('event_name')}\n` +
    `【イベントURL】 ${getEventUrl(eventSnapshot.get('community_account'), eventSnapshot.id)}\n`
  return sgMail.send({
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    subject,
    text,
  })
}

async function getUsersFromOrders(ordersRef) {
  const users = new Set()
  for (const orderRef of await ordersRef.listDocuments()) {
    const orderSnapshot = await orderRef.get()
    if (orderSnapshot.get('status') !== 'ordered') {
      continue
    }
    users.add(orderSnapshot.get('user_id'))
  }
  return users
}

async function createTemplateDataForEventInformation(targetDateTimeMillis) {
  const date = convertToJustDate(targetDateTimeMillis)
  const _dynamic_template_data = {
    date,
    events: [],
  }
  const events = await db
    .collectionGroup('events')
    .where('is_public', '==', true)
    .where('event_status.value', '==', 'accepting_order')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(targetDateTimeMillis))
    .where('is_deleted', '==', false)
    .get()
  // 不等号を含む where がある場合、他のフィールドでソートできない
  // https://firebase.google.com/docs/firestore/query-data/order-limit-data#limitations
  // .orderBy('event_start_datetime')
  const eventsSnapshot = events.docs.sort((a, b) => {
    const aTime = a.get('event_start_datetime')
    const bTime = b.get('event_start_datetime')
    return aTime > bTime ? 1 : aTime < bTime ? -1 : 0
  })
  for (const eventSnapshot of eventsSnapshot) {
    const ordersRef = eventSnapshot.ref.collection('orders')
    const users = await getUsersFromOrders(ordersRef)
    if (users.size < eventSnapshot.get('event_max_people')) {
      const eventData = eventSnapshot.data()
      const event_datetime = convertToDuration(
        eventData.event_start_datetime?.toMillis(),
        eventData.event_end_datetime?.toMillis(),
      )
      const event_deadline_datetime = convertToDatetimeWeekdayShort(eventData.event_deadline_datetime?.toMillis())
      _dynamic_template_data.events.push({
        event_name: eventData.event_name,
        event_address: eventData.event_address,
        event_place: eventData.event_place,
        event_datetime,
        event_deadline_datetime,
        event_desc: convertTruncateText(eventData.event_desc, 250),
        event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
        event_cover_url: eventData.event_cover_url,
        shop_name: eventData.shop_name,
        community_name: eventData.community_name,
      })
      if (_dynamic_template_data.events.length === 12) {
        break
      }
    }
  }
  return _dynamic_template_data
}

async function sendEventInformationMail() {
  const nowDateTimeMillis = Date.now()
  const _dynamic_template_data = await createTemplateDataForEventInformation(nowDateTimeMillis)
  if (_dynamic_template_data.events.length === 0) {
    return
  }
  const promises = []
  for (const userRef of await db.collection('users').listDocuments()) {
    const userSnapshot = await userRef.get()
    const dynamic_template_data = {
      ..._dynamic_template_data,
      user_name: userSnapshot.get('user_name'),
    }
    const to = await getUserEmail(userRef.id)
    if (to == null || to === '') {
      continue
    }
    promises.push(
      sgMail
        .send({
          to,
          from: DEFAULT_FROM,
          templateId: EVENT_INFORMATION_TEMPLATE_ID,
          dynamic_template_data,
          asm: {
            groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
          },
        })
        .catch((err) => {
          console.warn(err)
        }),
    )
  }
  return Promise.all(promises)
  // エミュレータからのテストメール
  // const dynamic_template_data = {
  //     ..._dynamic_template_data,
  //     user_name: 'テストユーザー'
  //   };
  // sgMail.send({
  //     to: 'yasukawa.naohiro+test@nijuni.jp',
  //     from: DEFAULT_FROM,
  //     templateId: EVENT_INFORMATION_TEMPLATE_ID,
  //     dynamic_template_data,
  //     asm: {
  //         groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
  //     }
  // });
}

async function sendEventInformationMailPreview() {
  const tomorrowDateTimeMillis = Date.now() + 24 * 60 * 60 * 1000
  const _dynamic_template_data = await createTemplateDataForEventInformation(tomorrowDateTimeMillis)
  if (_dynamic_template_data.events.length === 0) {
    return sgMail.send({
      to: DEFAULT_TO,
      from: DEFAULT_FROM,
      subject: '【プレビュー】明日のイベント情報について',
      text: '明日送信予定のイベント予定はありません',
    })
  }
  const dynamic_template_data = {
    ..._dynamic_template_data,
    user_name: 'テストユーザー',
  }
  return sgMail.send({
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    templateId: EVENT_INFORMATION_TEMPLATE_ID,
    dynamic_template_data,
    asm: {
      groupId: EVENT_INFORMATION_UNSUBSCRIBE_GROUP,
    },
  })
}

async function sendEventStatusMailToOrganizers(templateId, addSupport, eventSnapshot) {
  const [templateData, shopSnapShot, emails] = await Promise.all([
    createTemplateDataForOrderDeadline(eventSnapshot),
    getShopForEvent(eventSnapshot),
    getCommunityEmailsForEvent(eventSnapshot),
  ])
  const dynamic_template_data = { ...templateData, ...shopSnapShot.data() }

  if (addSupport && !emails.includes(SUPPORT_MAIL)) {
    emails.push(SUPPORT_MAIL)
  }

  return Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId,
        dynamic_template_data,
      })
    }),
  )
}

async function sendShopOpenMailToSupport(shopSnapshot) {
  const shopName = shopSnapshot.get('shop_name')
  const isOpen = shopSnapshot.get('is_open') ? '開店（OPEN）' : '閉店（CLOSE）'
  const subject = `${shopName}の開店設定が変更されました`
  // TODO これ以上複雑になるようなら、テンプレートを使う
  const text =
    `${shopName}の開店設定が『${isOpen}』になりました\n\n` +
    `【店舗名】${shopName}\n` +
    `【店舗住所】${shopSnapshot.get('shop_address')}\n` +
    `【PartnerID】${shopSnapshot.get('partner_id')}\n` +
    `【開店設定】${isOpen}`
  return sgMail.send({
    to: SUPPORT_MAIL,
    from: DEFAULT_FROM,
    subject,
    text,
  })
}

async function sendOrderCompletionMailToMember(eventRef, userId) {
  const [eventSnapshot, userSnapshot] = await Promise.all([eventRef.get(), db.collection('users').doc(userId).get()])
  const eventData = eventSnapshot.data()
  const dynamic_template_data = {
    date: convertToDateWeekdayShort(eventData.event_start_datetime?.toMillis()),
    event_datetime: convertToDuration(
      eventData.event_start_datetime?.toMillis(),
      eventData.event_end_datetime?.toMillis(),
    ),
    event_name: eventData.event_name,
    event_cover_url: eventData.event_cover_url,
    community_name: eventData.community_name,
    event_address: eventData.event_address,
    shop_name: eventData.shop_name,
    event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
    is_public: eventData.is_public,
  }
  const icsContent = await makeIcs(eventData)
  const to = await getUserEmail(userId)
  if (to == null || to === '') {
    return
  }
  return sgMail.send({
    to,
    from: DEFAULT_FROM,
    templateId: ORDER_COMPLETION_TEMPLATE_ID,
    dynamic_template_data,
    attachments: [
      {
        content: Buffer.from(icsContent, 'utf-8').toString('base64'),
        filename: 'invite.ics',
        type: 'text/calendar',
        disposition: 'attachment',
      },
    ],
  })
}

async function sendOrderCompletionMailToOrganizers(orderSnapshot, userId) {
  const eventRef = orderSnapshot.ref.parent.parent
  const [eventSnapshot, userSnapshot] = await Promise.all([eventRef.get(), db.collection('users').doc(userId).get()])
  const eventData = eventSnapshot.data()
  const userData = userSnapshot.data()

  const emails = await getCommunityEmailsForEvent(eventSnapshot)

  const dynamic_template_data = {
    date: convertToDateWeekdayShort(eventData.event_start_datetime?.toMillis()),
    event_name: eventData.event_name,
    event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
    user_name: userData.user_name,
    user_url: getUserUrl(userData.user_id),
  }
  return Promise.all(
    emails.map(async (to) => {
      await sgMail.send({
        to,
        from: DEFAULT_FROM,
        templateId: ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID,
        dynamic_template_data,
      })
    }),
  )
}

async function sendInCartNotificationToMember(start, end) {
  const notifyTime = 24 * 60 * 60 * 1000 // 1日
  const orderSnapshot = await db
    .collectionGroup('orders')
    .where('status', '==', 'in_cart')
    .where('updated_at', '>', Timestamp.fromMillis(start - notifyTime))
    .where('updated_at', '<=', Timestamp.fromMillis(end - notifyTime))
    .get()

  // TODO map と filter をかける時は flatMap を使う
  const notificationDataList = await Promise.all(
    orderSnapshot.docs.map(async (orderDoc) => {
      const order = orderDoc.data()
      const userId = order.user_id
      const [eventSnapshot, userEmail] = await Promise.all([orderDoc.ref.parent.parent.get(), getUserEmail(userId)])
      return { eventSnapshot, userEmail }
    }),
  )

  const filteredNotificationDataList = notificationDataList.filter((notificationData) => {
    const deadlineTimestamp = notificationData.eventSnapshot.get('event_deadline_datetime')
    return start < deadlineTimestamp.toMillis()
  })

  Promise.all(
    filteredNotificationDataList.map(async (notificationData) => {
      const { eventSnapshot, userEmail } = notificationData
      return sgMail.send(buildInCartNotificationMail(eventSnapshot, userEmail))
    }),
  )
}

async function sendInCartEventDeadlineNotificationToMember(start, end) {
  const notifyTime = 24 * 60 * 60 * 1000 // 1日
  const events = await db
    .collectionGroup('events')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(start + notifyTime))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(end + notifyTime))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .get()

  // user_email が設定されている場合のみメールコンテンツを生成する
  const mailContentList = []
  await Promise.all(
    events.docs.map(async (eventSnapshot) => {
      const ordersSnapshot = await eventSnapshot.ref.collection('orders').get()
      return await Promise.all(
        ordersSnapshot.docs
          .filter((orderSnapshot) => orderSnapshot.get('status') === 'in_cart')
          .map(async (orderSnapshot) => {
            const orderData = orderSnapshot.data()
            const userEmail = await getUserEmail(orderData.user_id)
            if (userEmail == null || userEmail === '') {
              return
            }
            mailContentList.push(buildInCartNotificationMail(eventSnapshot, userEmail))
          }),
      )
    }),
  )

  return Promise.all(
    mailContentList.map(async (mailContent) => {
      sgMail.send(mailContent)
    }),
  )
}

async function sendLetter(_, end) {
  return db.runTransaction(async (transaction) => {
    const letters = await transaction.get(
      db
        .collectionGroup('letters')
        .where('status', '==', 'timed')
        .where('scheduled_at', '<=', Timestamp.fromMillis(end)),
    )
    await Promise.all(
      letters.docs.map(async (letterDoc) => {
        const type = letterDoc.get('letter_type')
        const communityAccount = letterDoc.get('community_account')
        const communitySnapshot = (
          await db.collection('communities').where('community_account', '==', communityAccount).get()
        ).docs[0]
        const communityId = communitySnapshot.id
        const communityName = communitySnapshot.get('community_name')
        const communityUrl = getCommunityUrl(communityAccount)
        const communityEmail = communitySnapshot.get('community_email') || DEFAULT_FROM
        let userIds = []

        // イベントが存在する場合は、イベントの情報を取得
        let eventName = null
        let eventUrl = null
        let eventDate = null
        if (letterDoc.get('event_id')) {
          const eventSnapshot = (
            await db.collectionGroup('events').where('event_id', '==', letterDoc.get('event_id')).get()
          ).docs[0]
          if (eventSnapshot.exists) {
            eventName = eventSnapshot.get('event_name')
            eventUrl = getEventUrl(communityAccount, letterDoc.get('event_id'))
            eventDate = convertToDateWeekdayShort(eventSnapshot.get('event_start_datetime').toMillis())
          }
        }

        switch (type) {
          case 'community':
            userIds = await getCommunityMemberIds(communityId)
            break
          case 'event_participant':
            userIds = await getParticipantIds(letterDoc.get('event_id'))
            break
          case 'event_non_participant': {
            const [participantIds, communityMemberIds] = await Promise.all([
              getParticipantIds(letterDoc.get('event_id')),
              getCommunityMemberIds(communityId),
            ])
            userIds = communityMemberIds.filter((id) => !participantIds.includes(id))
            break
          }
          default:
            console.warn(`Unknown letter type: ${type}`)
            userIds = []
        }

        const userInfos = await Promise.all(userIds.map(getUserEmailWithName))
        const validUserInfos = userInfos.filter((info) => info.email != null && info.email !== '')
        // 送信先にサポートアカウントを追加
        validUserInfos.push({
          email: SUPPORT_MAIL,
          name: 'サポートアカウント',
        })

        for (const userInfo of validUserInfos) {
          const dynamic_template_data = {
            community_name: communityName,
            community_url: communityUrl,
            event_name: eventName,
            event_url: eventUrl,
            event_date: eventDate,
            letter_title: letterDoc.get('letter_title'),
            letter_content: letterDoc.get('letter_content'),
            letter_type: type,
            user_name: userInfo.name || 'ユーザー',
          }
          console.log(dynamic_template_data)
          await sgMail.send({
            to: userInfo.email,
            from: DEFAULT_FROM,
            replyTo: communityEmail,
            subject: letterDoc.get('letter_title'),
            templateId: LETTER_ID,
            dynamic_template_data,
          })
        }
        transaction.update(letterDoc.ref, { status: 'sent', sent_at: Timestamp.now() })
      }),
    )
  })
}

function buildInCartNotificationMail(eventSnapshot, to) {
  const eventData = eventSnapshot.data()
  return {
    to,
    from: DEFAULT_FROM,
    templateId: IN_CART_NOTIFICATION_ID,
    dynamic_template_data: {
      date: convertToDateWeekdayShort(eventData.event_start_datetime?.toMillis()),
      event_datetime: convertToDuration(
        eventData.event_start_datetime?.toMillis(),
        eventData.event_end_datetime?.toMillis(),
      ),
      event_name: eventData.event_name,
      event_cover_url: eventData.event_cover_url,
      community_name: eventData.community_name,
      event_address: eventData.event_address,
      shop_name: eventData.shop_name,
      event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
      event_deadline_datetime: convertToDatetimeWeekdayShort(eventData.event_deadline_datetime?.toMillis()),
    },
  }
}

export const polling = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule('*/1 * * * *') // .schedule('every 1 minutes')
  .onRun(async (event) => {
    const now = DateTime.fromISO(event.timestamp).toMillis()
    // 秒を無視しないと誤差で実行できないケースがでてきてしまう
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000
    const start = end - 60 * 1000
    const one_day_millis = 24 * 60 * 60 * 1000

    const promise_list = [
      sendOrderDeadlineMailToShop(start, end, false),
      sendOrderDeadlineMailToShop(start + one_day_millis, end + one_day_millis, true), // 1日前告知
      sendOrderDeadlineMailToOrganizers(start, end),
      sendOrderDeadlineMailToMembers(start, end),
      sendEventConcludedMailToMembers(start, end),
      sendInvoiceMailToOrganizers(start, end),
      sendInCartNotificationToMember(start, end),
      sendInCartEventDeadlineNotificationToMember(start, end),
      sendApplyingOrderRemindMailToShop(start - one_day_millis, end - one_day_millis, false), // 1日後通知
      sendApplyingOrderRemindMailToShop(start - 2 * one_day_millis, end - 2 * one_day_millis, false), // 2日後通知
      sendRejectOrderMailToShop(start - 3 * one_day_millis, end - 3 * one_day_millis, true), // 3日後却下通知
      sendLetter(start, end),
    ]

    // 3, 5, 10, 20, 30, 40, 50, 60日後にリマインドメールを送信
    const orderRemindToOrganizerDays = [1, 5, 10, 20, 30, 40, 50, 60]
    orderRemindToOrganizerDays.forEach((day) => {
      promise_list.push(sendOrderRemindMailToOrganizer(start + day * one_day_millis, end + day * one_day_millis, day))
    })

    return Promise.all(promise_list)
  })

export const event_information = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('15 10 * * 2') // 火曜日の10時15分
  .timeZone('Asia/Tokyo') // 世界展開時には注意が必要
  .onRun(() => {
    return sendEventInformationMail()
  })

export const event_information_preview = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('15 10 * * 1') // 月曜日の10時15分
  .timeZone('Asia/Tokyo') // 世界展開時には注意が必要
  .onRun(() => {
    return sendEventInformationMailPreview()
  })

export const on_event_changed = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}/events/{eventId}')
  .onWrite(async (change) => {
    const conditions = [
      ['in_draft', 'applying_to_admin', sendApplyingMailToAdmin],
      [undefined, 'applying_to_admin', sendApplyingMailToAdmin],
      ['in_draft', 'applying_reservation', sendApplyingOrderMailToShop],
      [
        'in_draft',
        'applying_reservation',
        sendEventStatusMailToOrganizers.bind(null, EVENT_STATUS_APPLYING_RESERVATION_ID, false),
      ],
      ['applying_reservation', 'in_draft', sendEventStatusMailToOrganizers.bind(null, EVENT_STATUS_IN_DRAFT_ID, true)],
      [
        'applying_reservation',
        'accepting_order',
        sendEventStatusMailToOrganizers.bind(null, EVENT_STATUS_ACCEPTING_ORDER_ID, true),
      ],
    ]
    const before = change.before
    const after = change.after
    const promises = []
    for (const c of conditions) {
      if (before.get('event_status')?.value === c[0] && after.get('event_status')?.value === c[1]) {
        promises.push(c[2](after))
      }
    }
    return Promise.all(promises)
  })

export const on_shop_changed = functions
  .region('asia-northeast1')
  .firestore.document('partners/{partnerId}/shops/{shopId}')
  .onWrite(async (change) => {
    const before = change.before
    const after = change.after
    const promises = []
    if (after.get('is_open') != null && before.get('is_open') !== after.get('is_open')) {
      promises.push(sendShopOpenMailToSupport(after))
    }
    return Promise.all(promises)
  })

export const on_order_changed = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}/events/{eventId}/orders/{orderId}')
  .onWrite(async (change) => {
    const before = change.before
    const after = change.after
    const promises = []
    if (before.get('status') !== after.get('status') && after.get('status') === 'ordered') {
      const userId = after.get('user_id')
      promises.push(sendOrderCompletionMailToMember(after.ref.parent.parent, userId))
      promises.push(sendOrderCompletionMailToOrganizers(after, userId))
    }
    return Promise.all(promises)
  })

export const send_email = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  if (!context.auth) {
    console.warn('send_email Auth Error', data, context)
    throw new functions.https.HttpsError('permission-denied', 'AuthError')
  }
  const { toUid, subject, text } = data
  if (toUid == null || subject == null || text == null) {
    console.warn('send_email Invalid Argument Error', data, context)
    throw new functions.https.HttpsError('invalid-argument', 'Required data is missing')
  }
  const [from, to] = await Promise.all([getUserEmail(context.auth.uid), getUserEmail(toUid)])
  if (from == null || from === '' || to == null || to === '') {
    console.warn(`send_email user_email is null or empty\nfrom: ${from}\nto: ${to}`)
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address')
  }
  return sgMail.send({
    to,
    from,
    subject,
    text,
  })
})

export const send_pass_code = functions.region('asia-northeast1').https.onCall(async (data) => {
  const { user_email, user_pass_code } = data

  if (!user_email) {
    throw new functions.https.HttpsError("invalid-argument", "user_email is required.")
  }

  if (!user_pass_code) {
    throw new functions.https.HttpsError("invalid-argument", "user_pass_code is required.")
  }

  try {
    await sgMail.send({
      to: user_email,
      from: DEFAULT_FROM,
      templateId: USER_PASS_CODE,
      dynamic_template_data : {
        user_pass_code: user_pass_code,
      }
    })

    return { message: "Pass code sent and saved successfully!" }
  } catch (error) {
    console.error("Error in send_pass_code:", error)
    throw new functions.https.HttpsError("internal", "Failed to send pass code.")
  }
})
