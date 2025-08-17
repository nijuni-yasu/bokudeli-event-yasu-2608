import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import sgMail from '@sendgrid/mail'
import { getCommunityUrl, getEventUrl, getManageEventInvoiceUrl } from './utils/urls.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { convertToDateWeekdayShort } from './utils/datetime.js'
import { createEventBillInvoice } from './eventBillInvoice.js'

const EVENT_INVOICE_TEMPLATE_ID = 'd-48e3179255834b8bb895cd995b1aac28'

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
    const promise_list = [sendInvoiceMailToOrganizers(start, end), sendLetter(start, end)]

    return Promise.all(promise_list)
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
