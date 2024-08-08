import functions from 'firebase-functions'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import _stripe from 'stripe'

const db = getFirestore()

const stripe = _stripe(process.env.STRIPE_API_SECRET_KEY)

export const stripe_refunds = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  console.log(data)
  // 認証情報のチェック
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }
  try {
    const refund = await stripe.refunds.create({
      payment_intent: data.paymentIntent,
    })
    const canceled_at = Timestamp.now()
    const updated_at = Timestamp.now()
    const orderRef = db.collectionGroup('orders').where('order_id', '==', data.orderId)
    const orderSnapshot = await orderRef.get()
    const orderDocument = orderSnapshot.docs[0]
    if (orderDocument?.ref == null) {
      throw new Error('orderDocument or orderDocument.ref is undefined.')
    }
    await orderDocument.ref.set({ status: 'canceled', updated_at, canceled_at, refund_id: refund.id }, { merge: true })
    return { refund_id: refund.id }
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error.message)
  }
})
