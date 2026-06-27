import {
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase-admin/firestore'
import { AuditLog } from '@shokujii/common/schemas/AuditLog.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import { EventStripe } from '@shokujii/common/schemas/EventStripe.js'
import { getAuditLogsCollectionRef } from './enterprise.js'

class EventMemberOrderConverter implements FirestoreDataConverter<EventMemberOrder> {
  toFirestore(order: EventMemberOrder): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventMemberOrder {
    return new EventMemberOrder(snapshot.id, snapshot.data())
  }
}

class EventStripeConverter implements FirestoreDataConverter<EventStripe> {
  toFirestore(stripe: EventStripe): DocumentData {
    return stripe.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventStripe {
    return new EventStripe(snapshot.id, snapshot.data())
  }
}

export const listOrderedMemberOrdersByEnterprise = async (enterpriseId: string): Promise<EventMemberOrder[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collectionGroup('member_orders')
    .where('enterprise_id', '==', enterpriseId)
    .where('status', '==', 'ordered')
    .withConverter(new EventMemberOrderConverter())
    .get()
  return snapshot.docs.map((doc) => doc.data())
}

export const listStripesByEnterprise = async (enterpriseId: string): Promise<EventStripe[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collectionGroup('stripes')
    .where('enterprise_id', '==', enterpriseId)
    .withConverter(new EventStripeConverter())
    .get()
  return snapshot.docs.map((doc) => doc.data())
}

export const listOrderCreateAuditLogs = async (enterpriseId: string): Promise<AuditLog[]> => {
  const snapshot = await getAuditLogsCollectionRef(enterpriseId)
    .where('action', '==', 'order_create')
    .where('target_type', '==', 'order_session')
    .get()
  return snapshot.docs.map((doc) => doc.data()).filter((log) => log.target_id == null || log.target_id === '')
}
