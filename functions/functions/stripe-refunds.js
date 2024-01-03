const functions = require("firebase-functions")
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

const db = getFirestore()

const stripe = require('stripe')(process.env.STRIPE_API_SECRET_KEY)

exports.stripe_refunds = functions
    .region('asia-northeast1')
    .https
    .onCall(async(data, context) => {
        console.log(data)
        console.log(context)
        // 認証情報のチェック
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.')
        }
        try {
            const paymentId = data.paymentId
            const orderId = data.orderId
            const refund = await stripe.refunds.create({ payment_intent: paymentId })
            const updated_at = Timestamp.now()
            const orderRef = db.collectionGroup('orders').where('order_id', '==', orderId)
            const orderSnapshot = await orderRef.get()
            const orderDocument = orderSnapshot.docs[0]
            if (orderDocument?.ref == null) {
                throw new Error('orderDocument or orderDocument.ref is undefined.')
            }
            await orderDocument.ref.set({ status: 'ordered', updated_at, refundId: refund.id }, { merge: true })
            return { refundId: refund.id }
        } catch (error) {
            throw new functions.https.HttpsError('unknown', error.message)
        }
    })
