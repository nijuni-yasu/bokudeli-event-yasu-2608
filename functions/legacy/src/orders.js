import functions from 'firebase-functions/v1'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const db = getFirestore()

export const update_order_status = functions.region('asia-northeast1').https.onCall(async (data, context) => {
  const user_id = context.auth?.uid
  if (user_id == null) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.')
  }

  return db.runTransaction(async (transaction) => {
    const eventRef = db.collection('communities').doc(data.community_id).collection('events').doc(data.event_id)
    const orderRef = eventRef.collection('orders').doc(data.order_id)
    const [orderSnapshot, eventSnapshot] = await Promise.all([transaction.get(orderRef), transaction.get(eventRef)])
    if (
      orderSnapshot == null ||
      orderSnapshot.exists === false ||
      eventSnapshot == null ||
      eventSnapshot.exists === false
    ) {
      throw new functions.https.HttpsError('not-found', `No order ${eventRef.path}, ${orderRef.path}`)
    }
    if (orderSnapshot.get('user_id') !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', `Invalid user ${context.auth?.uid}`)
    }
    if (eventSnapshot.get('event_payment') === 'user_advance' && data.status === 'ordered') {
      throw new functions.https.HttpsError(
        'permission-denied',
        `In event payment "user_advance", you cannot change the status to ${data.status}`,
      )
    }
    const now = Timestamp.now()
    const canceled_at = data.status === 'canceled' ? now : orderSnapshot.get('canceled_at')
    const ordered_at = data.status === 'ordered' ? now : orderSnapshot.get('ordered_at')
    transaction.update(orderSnapshot.ref, {
      ...(canceled_at != null && { canceled_at}),
      ...(ordered_at != null && { ordered_at }),
      updated_at: now,
      status: data.status,
    })
    if (data.status === 'ordered') {
      transaction.set(
        db.collection('communities').doc(data.community_id).collection('members').doc(user_id),
        {
          updated_at: now,
        },
        { merge: true },
      )
    }
  })
})
