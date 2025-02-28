import functions from 'firebase-functions'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as dateFns from 'date-fns'
import ja from 'date-fns/locale/ja'
import sgMail from '@sendgrid/mail'
import { convertTruncateText } from './utils/converter.js'
import { makeIcs } from './make-ics.js'

// 環境変数の方がよいかもしれない
const DEFAULT_FROM = '食事でつながる「shokujii」<shokujii@nijuni.jp>'
const DEFAULT_TO = 'support+to@nijuni.jp'
const SUPPORT_MAIL = 'shokujiiサポート<support+cc@nijuni.jp>'

const ORDER_DEADLINE_TEMPLATE_ID = 'd-8609b6a7b1514595ae68d18532331e0e'
const ORDER_DEADLINE_FOR_ORGANIZER_TEMPLATE_ID = 'd-1099d87af79f4d898012db3b8024715f'
const APPLYING_ORDER_TEMPLATE_ID = 'd-6e4b246cc4ef418993a1304b45b48d7b' // 開発バージョンに変更
const REJECT_ORDER_TEMPLATE_ID = 'd-f968252a99864a1a9e126b9863944832'
const DELIVERY_DURATION = 30 // minutes

const EVENT_INFORMATION_TEMPLATE_ID = 'd-797deb1c54984007baadd1926ee974a2'
const EVENT_CONFIRMATION_TEMPLATE_ID = 'd-2fea06c315a240d2becd864b54f38098'
const EVENT_SURVEY_TEMPLATE_ID = 'd-6ad8131506164c2f864155182c63de2d'
const ORDER_COMPLETION_TEMPLATE_ID = 'd-b94849438f2642a29973670f3d79809f'
const ORDER_COMPLETION_FOR_ORGANIZER_TEMPLATE_ID = 'd-38e33bff82d740d88b33b56347f63df7'
// 環境変数の方がよいかもしれない
const EVENT_INFORMATION_UNSUBSCRIBE_GROUP = 25345

const EVENT_STATUS_APPLYING_RESERVATION_ID = 'd-238517a9044c441598d1d0d7d4a7d0b7'
const EVENT_STATUS_IN_DRAFT_ID = 'd-4f62892bece349e494cc0d545143f145'
const EVENT_STATUS_ACCEPTING_ORDER_ID = 'd-badaf130bf664cf3badb1ef2aab9f60c'
const COMMUNITY_CONTACT_ID = 'd-940c5bd81040475e8c9522c80e361433'

const IN_CART_NOTIFICATION_ID = 'd-148ab4d0aef644de815cc684c92a87de'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const db = getFirestore()

/**
 *
 * @param {number} millis UNIX Time （ミリ秒）
 * @returns 日本時間を表示するためのミリ秒
 */
function convertToJapan(millis) {
  if (millis == null) {
    return undefined
  }
  // date-fns-tz は単純にタイムゾーンのオフセットを追加した Date を作成するだけなので、今回は単純加算で対応する
  // TODO サマータイムがあるような地域に進出した場合は、何らかの措置を考えなければいけない
  // https://qiita.com/suin/items/296740d22624b530f93a#utc%E3%81%AAdate%E3%82%92asiatokyo%E3%81%AE%E6%97%A5%E6%99%82%E3%81%AB%E3%83%95%E3%82%A9%E3%83%BC%E3%83%9E%E3%83%83%E3%83%88%E3%81%99%E3%82%8B
  return millis + 9 * 60 * 60 * 1000
}

function convertToDate(millis) {
  if (millis == null) {
    return undefined
  }
  return dateFns.format(millis, 'yyyy/MM/dd (eee)', { locale: ja })
}

function convertToDateTime(millis) {
  if (millis == null) {
    return undefined
  }
  return dateFns.format(millis, 'yyyy/MM/dd (eee) HH:mm', { locale: ja })
}

function convertToDuration(startMillis, endMillis) {
  if (startMillis == null || endMillis == null) {
    return undefined
  }
  const start = dateFns.format(startMillis, 'yyyy/MM/dd (eee) HH:mm', {
    locale: ja,
  })
  const end = dateFns.format(endMillis, 'HH:mm')
  return `${start}〜${end}`
}

function getCommunityUrl(communityAccount) {
  return `https://${process.env.EVENT_HOST}/c/${communityAccount}`
}

function getEventUrl(communityAccount, eventId) {
  return `https://${process.env.EVENT_HOST}/c/${communityAccount}/e/${eventId}`
}

function getOrderUrl(eventId) {
  return `https://${process.env.ADMIN_HOST}/order/${eventId}`
}

function getUserUrl(userId) {
  return `https://${process.env.EVENT_HOST}/u/${userId}`
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

async function getCommunityMemberEmailsSet(communityId) {
  // 重複するメールアドレスは追加しない
  const emails = new Set()
  const membersRef = db.collection('communities').doc(communityId).collection('members')
  const membersSnapshot = await membersRef.get()
  await Promise.all(
    membersSnapshot.docs.map(async (member) => {
      const userRef = db.collection('users').doc(member.id)
      const userSnapshot = await userRef.get()
      const userEmail = userSnapshot.get('user_email')
      if (userEmail != null && userEmail !== '') {
        emails.add(userEmail)
      }
    }),
  )
  return emails
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
        const userRef = db.collection('users').doc(member.id)
        const userSnapshot = await userRef.get()
        const userEmail = userSnapshot.get('user_email')
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
  const emails = await Promise.all(
    Array.from(usersSet).map(async (userId) => {
      const userRef = db.collection('users').doc(userId)
      const userSnapshot = await userRef.get()
      return userSnapshot.get('user_email')
    }),
  )
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
  const event_start_datetime_japan = convertToJapan(eventData.event_start_datetime?.toMillis())
  const date = convertToDate(event_start_datetime_japan)
  const deliveryDuration = convertToDuration(
    event_start_datetime_japan - DELIVERY_DURATION * 60 * 1000,
    event_start_datetime_japan,
  )
  const delivery_date = `${deliveryDuration} （※${DELIVERY_DURATION}分の配達時間をいただいています）`
  const event_deadline_datetime = convertToDateTime(convertToJapan(eventData.event_deadline_datetime?.toMillis()))

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

async function createTemplateDataForOrganizersOrderDeadline(eventSnapshot) {
  const ordersRef = eventSnapshot.ref.collection('orders')
  const [order_count, _, orders] = await createOrdersForOrderDeadline(ordersRef)
  const eventData = eventSnapshot.data()
  const event_start_datetime_japan = convertToJapan(eventData.event_start_datetime?.toMillis())
  const date = convertToDate(event_start_datetime_japan)
  const event_deadline_datetime = convertToDateTime(convertToJapan(eventData.event_deadline_datetime?.toMillis()))
  const deliveryDuration = convertToDuration(
    event_start_datetime_japan - DELIVERY_DURATION * 60 * 1000,
    event_start_datetime_japan,
  )
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

async function sendOrderDeadlineMailToOrganizers(start, end, is_reminder) {
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
      dynamic_template_data.is_reminder = is_reminder
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
        date: convertToDate(convertToJapan(eventData.event_start_datetime?.toMillis())),
        event_datetime: convertToDuration(
          convertToJapan(eventData.event_start_datetime?.toMillis()),
          convertToJapan(eventData.event_end_datetime?.toMillis()),
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
        date: convertToDate(convertToJapan(eventData.event_start_datetime?.toMillis())),
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
    approve_deadline_datetime: convertToDate(convertToJapan(limitTimeMills)),
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
  const date = dateFns.format(convertToJapan(targetDateTimeMillis), 'MM/dd', {
    locale: ja,
  })
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
        convertToJapan(eventData.event_start_datetime?.toMillis()),
        convertToJapan(eventData.event_end_datetime?.toMillis()),
      )
      const event_deadline_datetime = convertToDateTime(convertToJapan(eventData.event_deadline_datetime?.toMillis()))
      _dynamic_template_data.events.push({
        event_name: eventData.event_name,
        event_address: eventData.event_address,
        event_datetime,
        event_deadline_datetime,
        event_desc: convertTruncateText(eventData.event_desc, 250),
        event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
        event_cover_url: eventData.event_cover_url,
        shop_name: eventData.shop_name,
        community_name: eventData.community_name,
      })
      if (_dynamic_template_data.events.length === 5) {
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
    const userEmail = userSnapshot.get('user_email')
    if (!userEmail) {
      continue
    }
    promises.push(
      sgMail
        .send({
          to: userEmail,
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

async function sendNewCommunityRequestMailToSupport(communitySnapshot) {
  const communityId = communitySnapshot.id
  const communityName = communitySnapshot.get('community_name')
  const communityAccount = communitySnapshot.get('community_account')
  // TODO これ以上複雑になるようなら、テンプレートを使う
  const subject = `「${communityName}」コミュニティが新規申請されました`
  const text =
    `【ID】 ${communityId}\n` +
    `【コミュニティ名】 ${communityName}\n` +
    `【コミュニティID】 ${communityAccount}\n` +
    `【コミュニティページURL】 ${getCommunityUrl(communityAccount)}`
  return sgMail.send({
    to: DEFAULT_TO,
    from: DEFAULT_FROM,
    subject,
    text,
  })
}

async function sendCommunityContactMailToOrganizers(templateId, data) {
  const emails = await getCommunityEmails(data.community_id)
  const dynamic_template_data = data
  if (!emails.includes(SUPPORT_MAIL)) {
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

async function sendOrderCompletionMailToMember(eventRef, userId) {
  const [eventSnapshot, userSnapshot] = await Promise.all([eventRef.get(), db.collection('users').doc(userId).get()])
  const eventData = eventSnapshot.data()
  const dynamic_template_data = {
    date: convertToDate(convertToJapan(eventData.event_start_datetime?.toMillis())),
    event_datetime: convertToDuration(
      convertToJapan(eventData.event_start_datetime?.toMillis()),
      convertToJapan(eventData.event_end_datetime?.toMillis()),
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
  return sgMail.send({
    to: userSnapshot.get('user_email'),
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
    date: convertToDate(convertToJapan(eventData.event_start_datetime?.toMillis())),
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

  const notificationDataList = await Promise.all(
    orderSnapshot.docs.map(async (orderDoc) => {
      const order = orderDoc.data()
      const userId = order.user_id
      const [eventSnapshot, userSnapshot] = await Promise.all([
        orderDoc.ref.parent.parent.get(),
        db.collection('users').doc(userId).get(),
      ])
      const userData = userSnapshot.data()
      return { eventSnapshot, userData }
    }),
  )

  const filteredNotificationDataList = notificationDataList.filter((notificationData) => {
    const deadlineTimestamp = notificationData.eventSnapshot.get('event_deadline_datetime')
    return start < deadlineTimestamp.toMillis()
  })

  Promise.all(
    filteredNotificationDataList.map(async (notificationData) => {
      const { eventSnapshot, userData } = notificationData
      return sgMail.send(buildInCartNotificationMail(eventSnapshot, userData))
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
            const userSnapshot = await db.collection('users').doc(orderData.user_id).get()
            const userData = userSnapshot.data()
            if (userData.user_email == null || userData.user_email === '') {
              return
            }
            mailContentList.push(buildInCartNotificationMail(eventSnapshot, userData))
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

async function sendLetter(start, end) {
  return db.runTransaction(async (transaction) => {
    const letters = await transaction.get(
      db
        .collectionGroup('letters')
        .where('status', '==', 'timed')
        .where('scheduled_at', '>', Timestamp.fromMillis(start))
        .where('scheduled_at', '<=', Timestamp.fromMillis(end)),
    )
    await Promise.all(
      letters.docs.map(async (letterDoc) => {
        const communityAccount = letterDoc.get('community_account')
        const type = letterDoc.get('letter_type')
        let emails = []
        switch (type) {
          case 'community':
            emails = Array.from(await getCommunityMemberEmailsSet(communityAccount))
            break
          case 'event_participant':
            const eventId = letterDoc.get('event_id')
            emails = await getEventMemberEmails(eventId)
            break
          case 'event_non_participant':
            emails = await getCommunityMemberEmailsSet(communityAccount)
            for (const email of await getEventMemberEmails(eventId)) {
              emails.delete(email)
            }
            break
        }
        for (const email of emails) {
          await sgMail.send({
            to: email,
            from: DEFAULT_FROM,
            subject: letterDoc.get('letter_title'),
            text: letterDoc.get('letter_content'),
          })
        }
        transaction.update(letterDoc.ref, { status: 'sent', sent_at: Timestamp.now() })
      }),
    )
  })
}

function buildInCartNotificationMail(eventSnapshot, userData) {
  const eventData = eventSnapshot.data()
  return {
    to: userData.user_email,
    from: DEFAULT_FROM,
    templateId: IN_CART_NOTIFICATION_ID,
    dynamic_template_data: {
      date: convertToDate(convertToJapan(eventData.event_start_datetime?.toMillis())),
      event_datetime: convertToDuration(
        convertToJapan(eventData.event_start_datetime?.toMillis()),
        convertToJapan(eventData.event_end_datetime?.toMillis()),
      ),
      event_name: eventData.event_name,
      event_cover_url: eventData.event_cover_url,
      community_name: eventData.community_name,
      event_address: eventData.event_address,
      shop_name: eventData.shop_name,
      event_url: getEventUrl(eventData.community_account, eventSnapshot.id),
      event_deadline_datetime: convertToDateTime(convertToJapan(eventData.event_deadline_datetime?.toMillis())),
    },
  }
}

export const polling = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule('*/1 * * * *') // .schedule('every 1 minutes')
  .onRun(async (event) => {
    const now = dateFns.parseISO(event.timestamp).getTime()
    // 秒を無視しないと誤差で実行できないケースがでてきてしまう
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000
    const start = end - 60 * 1000
    const one_day_millis = 24 * 60 * 60 * 1000
    return Promise.all([
      sendOrderDeadlineMailToShop(start, end, false),
      sendOrderDeadlineMailToShop(start + one_day_millis, end + one_day_millis, true), // 1日前告知
      sendOrderDeadlineMailToOrganizers(start, end, false),
      sendOrderDeadlineMailToOrganizers(start + 3 * one_day_millis, end + 3 * one_day_millis, true), // 3日前告知
      sendOrderDeadlineMailToMembers(start, end),
      sendEventConcludedMailToMembers(start, end),
      sendInCartNotificationToMember(start, end),
      sendInCartEventDeadlineNotificationToMember(start, end),
      sendApplyingOrderRemindMailToShop(start - one_day_millis, end - one_day_millis, false), // 1日後通知
      sendApplyingOrderRemindMailToShop(start - 2 * one_day_millis, end - 2 * one_day_millis, false), // 2日後通知
      sendRejectOrderMailToShop(start - 3 * one_day_millis, end - 3 * one_day_millis, true), // 3日後却下通知
      sendLetter(start, end),
    ])
  })

export const event_information = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('0 18 * * 0') // 日曜日の18時
  .timeZone('Asia/Tokyo') // 世界展開時には注意が必要
  .onRun(() => {
    return sendEventInformationMail()
  })

export const event_information_preview = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('0 18 * * 6') // 土曜日の18時
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

export const community_added = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}')
  .onCreate(async (snapshot) => {
    return sendNewCommunityRequestMailToSupport(snapshot)
  })

export const community_contact = functions.region('asia-northeast1').https.onCall((data, context) => {
  if (context.auth) {
    return sendCommunityContactMailToOrganizers(COMMUNITY_CONTACT_ID, data)
  } else {
    console.log('community_contact Auth Error')
    console.log(data)
    console.log(context)
    throw new functions.https.HttpsError('permission-denied', 'community_contact Auth Error')
  }
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
  const [fromUser, toUser] = await Promise.all([
    db.collection('users').doc(context.auth.uid).get(),
    db.collection('users').doc(toUid).get(),
  ])
  const from = fromUser.get('user_email')
  const to = toUser.get('user_email')
  if (from == null || to == null) {
    console.warn(`send_email user_email is null\nfrom: ${from}\nto: ${to}`)
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address')
  }
  return sgMail.send({
    to,
    from,
    subject,
    text,
  })
})
