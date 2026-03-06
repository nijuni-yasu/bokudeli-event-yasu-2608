import functions from 'firebase-functions/v1'
import { getFirestore } from 'firebase-admin/firestore'
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const db = getFirestore()

async function getUserEmail(userId) {
  const userPersonalInformationRef = db.collection('users_personal_information').doc(userId)
  const userPersonalInformationSnapshot = await userPersonalInformationRef.get()
  return userPersonalInformationSnapshot.get('user_email')
}

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
