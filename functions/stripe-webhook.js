import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import _stripe from 'stripe'

const db = getFirestore()

// Webhook の検証に使用する場合、Secret key は必要ない様子（ただし、公式にかいてあるわけではない）
const stripe = _stripe()

const loadUser = async (userId) => {
  const userRef = db.collection('users').doc(userId)
  const userDocSnap = await userRef.get()

  return userDocSnap.exists ? userDocSnap.data() : null
}

const addCommunityUser = async (communityId, userId) => {
  const userDoc = await loadUser(userId)

  if (!userDoc) {
    return
  }

  const membersUserDoc = db.doc(`communities/${communityId}/members/${userDoc.user_id}`)
  await membersUserDoc.set({ updated_at: Timestamp.now() }, { merge: true })
}

export const stripe_webhook = functions.region('asia-northeast1').https.onRequest(async (req, res) => {
  try {
    const sig = req.headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET)
    switch (event.type) {
      case 'checkout.session.completed': {
        const updated_at = Timestamp.now()
        const ordered_at = Timestamp.now()
        const orderRef = db.collectionGroup('orders').where('order_id', '==', event.data.object.metadata.orderId)
        const orderSnapshot = await orderRef.get()
        const orderDocument = orderSnapshot.docs[0]
        const paymentIntent = event.data.object
        if (orderDocument?.ref == null) {
          throw new Error('orderDocument or orderDocument.ref is undefined.')
        }
        await orderDocument.ref.set(
          {
            status: 'ordered',
            updated_at,
            ordered_at,
            payment_intent: paymentIntent.payment_intent,
          },
          { merge: true },
        )
        await addCommunityUser(paymentIntent.metadata.communityId, paymentIntent.metadata.userId)
        return res.json({ paymentIntent })
      }
      default:
        return res.status(400).end()
    }
  } catch (err) {
    console.error(err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
})
