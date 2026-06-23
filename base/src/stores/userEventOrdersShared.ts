import {
  collection,
  getDocs,
  orderBy,
  query,
  type FirestoreDataConverter,
  type DocumentData,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore'
import { db } from '@shokujii/base/firebase.js'
import { EventMemberOrder } from '@shokujii/common/schemas/EventMemberOrder.js'
import type { BokudeliEvent } from './event.js'

export type UserEventListOrderEntry = {
  orders: EventMemberOrder[] | null
  loading: boolean
  error: unknown | null
}

export const memberOrderConverter: FirestoreDataConverter<EventMemberOrder> = {
  toFirestore(order: EventMemberOrder): DocumentData {
    return order.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMemberOrder {
    const data = snapshot.data(options)
    return new EventMemberOrder(snapshot.id, data)
  },
}

export const fetchMemberOrdersForUser = async (
  communityId: string,
  eventId: string,
  memberUserId: string,
): Promise<EventMemberOrder[]> => {
  const coll = collection(
    db,
    'communities',
    communityId,
    'events',
    eventId,
    'members',
    memberUserId,
    'member_orders',
  ).withConverter(memberOrderConverter)
  const q = query(coll, orderBy('updated_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data()).filter((o) => o.status !== 'in_cart')
}

export const sortEventsByStartDatetime = (events: BokudeliEvent[]): BokudeliEvent[] =>
  [...events].sort((a, b) => b.event_start_datetime - a.event_start_datetime)
