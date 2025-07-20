import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import sgMail from '@sendgrid/mail'
import {
  getCommunityUrl,
  getEventUrl,
  getOrderUrl,
  getManageEventMemberUrl,
  getManageEventInvoiceUrl,
} from './utils/urls.js'
import { DEFAULT_FROM, DEFAULT_TO, SUPPORT_MAIL } from './utils/mail.js'
import { convertToDateWeekdayShort, convertToDatetimeWeekdayShort, convertToDuration } from './utils/datetime.js'
import { createEventBillInvoice } from './eventBillInvoice.js'

const ORDER_REMIND_FOR_ORGANIZER_TEMPLATE_ID = 'd-89612eeb2f1f42a98c92b543b870616c'
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b' // 開発バージョンに変更
const REJECT_ORDER_TEMPLATE_ID = 'd-f968252a99864a1a9e126b9863944832'
const DELIVERY_DURATION = 30 // minutes

const EVENT_INVOICE_TEMPLATE_ID = 'd-48e3179255834b8bb895cd995b1aac28'

const EVENT_STATUS_APPLYING_RESERVATION_ID = 'd-238517a9044c441598d1d0d7d4a7d0b7'
const EVENT_STATUS_IN_DRAFT_ID = 'd-4f62892bece349e494cc0d545143f145'
const EVENT_STATUS_ACCEPTING_ORDER_ID = 'd-badaf130bf664cf3badb1ef2aab9f60c'
const LETTER_ID = 'd-e1ca1ca620374bfeaf0697495dbacb20'

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
      sendInvoiceMailToOrganizers(start, end),
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
    throw new functions.https.HttpsError('invalid-argument', 'user_email is required.')
  }

  if (!user_pass_code) {
    throw new functions.https.HttpsError('invalid-argument', 'user_pass_code is required.')
  }

  try {
    await sgMail.send({
      to: user_email,
      from: DEFAULT_FROM,
      templateId: USER_PASS_CODE,
      dynamic_template_data: {
        user_pass_code: user_pass_code,
      },
    })

    return { message: 'Pass code sent and saved successfully!' }
  } catch (error) {
    console.error('Error in send_pass_code:', error)
    throw new functions.https.HttpsError('internal', 'Failed to send pass code.')
  }
})
