import functions from 'firebase-functions/v1'
import { getFirestore } from 'firebase-admin/firestore'
const db = getFirestore()

const update_event_members = (_, context) =>
  // user の store/event.ts 内でも同様の処理を書いているので注意
  // TODO: 処理を共通化する
  db.runTransaction(async (transaction) => {
    const eventRef = db
      .collection('communities')
      .doc(context.params.communityId)
      .collection('events')
      .doc(context.params.eventId)
    const ordersRef = eventRef.collection('orders')
    const ordersSnapshot = await transaction.get(ordersRef)
    const userIds = ordersSnapshot.docs.reduce((set, orderSnapshot) => {
      const userId = orderSnapshot.get('user_id')
      const status = orderSnapshot.get('status')
      if (status === 'ordered') {
        set.add(userId)
      }
      return set
    }, new Set())
    transaction.update(eventRef, {
      members: Array.from(userIds).map((userId) => db.doc(`/users/${userId}`)),
      event_num_members: userIds.size,
    })
  })

export const create_event_members = functions
  .region('asia-northeast1')
  .firestore.document('communities/{communityId}/events/{eventId}/orders/{orderId}')
  .onWrite(update_event_members)
