import {
  getFirestore,
  Transaction,
} from 'firebase-admin/firestore'

export const deleteOrder = async (
  communityId: string,
  eventId: string,
  orderId: string,
  transaction?: Transaction,
): Promise<void> => {
  const db = getFirestore()
  const orderRef = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('orders')
    .doc(orderId)

  if (transaction === undefined) {
    await orderRef.delete()
  } else {
    transaction.delete(orderRef)
  }
}
