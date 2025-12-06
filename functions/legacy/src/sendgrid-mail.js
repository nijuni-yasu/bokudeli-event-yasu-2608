import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { DateTime } from 'luxon'
import sgMail from '@sendgrid/mail'
import { getManageEventInvoiceUrl } from './utils/urls.js'
import { DEFAULT_FROM, SUPPORT_MAIL } from './utils/mail.js'
import { createEventBillInvoice } from './eventBillInvoice.js'

const EVENT_INVOICE_TEMPLATE_ID = 'd-48e3179255834b8bb895cd995b1aac28'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const db = getFirestore()

async function getUserEmail(userId) {
  const userPersonalInformationRef = db.collection('users_personal_information').doc(userId)
  const userPersonalInformationSnapshot = await userPersonalInformationRef.get()
  return userPersonalInformationSnapshot.get('user_email')
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

export const polling = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .pubsub.schedule('*/1 * * * *') // .schedule('every 1 minutes')
  .onRun(async (event) => {
    const now = DateTime.fromISO(event.timestamp).toMillis()
    // 秒を無視しないと誤差で実行できないケースがでてきてしまう
    const end = Math.trunc(now / 60 / 1000) * 60 * 1000
    const start = end - 60 * 1000
    const promise_list = [sendInvoiceMailToOrganizers(start, end)]

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
