import {
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
} from 'firebase-admin/firestore'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'

class ShokujiiEventOrderConverter implements FirestoreDataConverter<EventOrder> {
  toFirestore(order: EventOrder): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventOrder {
    const eventId = snapshot.ref.parent.parent!.id
    return new EventOrder(eventId, snapshot.id, snapshot.data())
  }
}

export const getOrder = async (
  communityId: string,
  eventId: string,
  orderId: string,
  transaction?: Transaction,
): Promise<EventOrder | undefined> => {
  const db = getFirestore()
  const orderRef = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('orders')
    .doc(orderId)
    .withConverter(new ShokujiiEventOrderConverter())

  const snapshot = await (transaction === undefined ? orderRef.get() : transaction.get(orderRef))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveOrder = async (
  communityId: string,
  eventId: string,
  order: EventOrder,
  transaction?: Transaction,
): Promise<void> => {
  const db = getFirestore()
  const orderRef = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('orders')
    .doc(order.id)
    .withConverter(new ShokujiiEventOrderConverter())

  if (transaction === undefined) {
    await orderRef.set(order, { merge: true })
  } else {
    transaction.set(orderRef, order, { merge: true })
  }
}

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
