import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
  Timestamp,
} from 'firebase-admin/firestore'
import { EventMember, EventMemberOrder, EventMemberOrderStatusType } from '@shokujii/common/schemas/EventMemberOrder.js'
import { EventStripe } from '@shokujii/common/schemas/EventStripe.js'
import { getCommunityEventKey, getEventsInCommunities } from './event.js'

// ── Converters ──

class EventMemberConverter implements FirestoreDataConverter<EventMember> {
  toFirestore(member: EventMember): DocumentData {
    return member.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventMember {
    return new EventMember(snapshot.id, snapshot.data())
  }
}

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

// ── パスヘルパー ──

const membersCollection = (communityId: string, eventId: string) => {
  const db = getFirestore()
  return db.collection('communities').doc(communityId).collection('events').doc(eventId).collection('members')
}

const ordersCollection = (communityId: string, eventId: string, userId: string) => {
  return membersCollection(communityId, eventId).doc(userId).collection('member_orders')
}

const stripesCollection = (communityId: string, eventId: string) => {
  const db = getFirestore()
  return db.collection('communities').doc(communityId).collection('events').doc(eventId).collection('stripes')
}

// ── EventMember Store 関数 ──

export const getMember = async (
  communityId: string,
  eventId: string,
  userId: string,
  transaction?: Transaction,
): Promise<EventMember | undefined> => {
  const memberRef = membersCollection(communityId, eventId).doc(userId).withConverter(new EventMemberConverter())
  const snapshot = await (transaction === undefined ? memberRef.get() : transaction.get(memberRef))
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveMember = async (
  communityId: string,
  eventId: string,
  member: EventMember,
  transaction?: Transaction,
): Promise<void> => {
  const memberRef = membersCollection(communityId, eventId).doc(member.id).withConverter(new EventMemberConverter())
  if (transaction === undefined) {
    await memberRef.set(member, { merge: true })
  } else {
    transaction.set(memberRef, member, { merge: true })
  }
}

/**
 * members サブコレクションのドキュメント ID（= userId）一覧を取得する。
 * カート追加・注文確定・キャンセルを問わず、イベントに一度でも関与した全ユーザーが対象。
 * フィールド読み取りは不要なため .select() で最小コストに抑える。
 */
export const getMemberIds = async (communityId: string, eventId: string): Promise<string[]> => {
  const snapshot = await membersCollection(communityId, eventId).select().get()
  return snapshot.docs.map((doc) => doc.id)
}

// ── EventMemberOrder Store 関数 ──

export const getOrders = async (
  communityId: string,
  eventId: string,
  status?: EventMemberOrderStatusType,
  transaction?: Transaction,
): Promise<EventMemberOrder[]> => {
  const db = getFirestore()
  let query = db
    .collectionGroup('member_orders')
    .where('community_id', '==', communityId)
    .where('event_id', '==', eventId)
    .withConverter(new EventMemberOrderConverter())

  if (status !== undefined) {
    query = query.where('status', '==', status)
  }

  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  return snapshot.docs.map((doc) => doc.data())
}

export const getOrder = async (
  communityId: string,
  eventId: string,
  userId: string,
  orderId: string,
  transaction?: Transaction,
): Promise<EventMemberOrder | undefined> => {
  const orderRef = ordersCollection(communityId, eventId, userId)
    .doc(orderId)
    .withConverter(new EventMemberOrderConverter())

  const snapshot = await (transaction === undefined ? orderRef.get() : transaction.get(orderRef))
  return snapshot.exists ? snapshot.data() : undefined
}

export const getOrdersByIds = async (
  communityId: string,
  eventId: string,
  userId: string,
  orderIds: string[],
  transaction?: Transaction,
): Promise<EventMemberOrder[]> => {
  const refs = orderIds.map((id) =>
    ordersCollection(communityId, eventId, userId).doc(id).withConverter(new EventMemberOrderConverter()),
  )

  if (refs.length === 0) return []

  if (transaction !== undefined) {
    const snapshots = await transaction.getAll(...refs)
    return snapshots.filter((s) => s.exists).map((s) => s.data()!)
  }

  const snapshots = await Promise.all(refs.map((ref) => ref.get()))
  return snapshots.filter((s) => s.exists).map((s) => s.data()!)
}

export const getOrdersInCart = async (
  communityId: string,
  eventId: string,
  userId: string,
  transaction?: Transaction,
): Promise<EventMemberOrder[]> => {
  const query = ordersCollection(communityId, eventId, userId)
    .where('status', '==', 'in_cart')
    .withConverter(new EventMemberOrderConverter())

  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  return snapshot.docs.map((doc) => doc.data())
}

export const hasOrderedOrders = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<boolean> => {
  const db = getFirestore()
  const query = db
    .collectionGroup('member_orders')
    .where('community_id', '==', communityId)
    .where('event_id', '==', eventId)
    .where('status', '==', 'ordered')
    .limit(1)
    .withConverter(new EventMemberOrderConverter())

  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  return !snapshot.empty
}

export const saveOrder = async (
  communityId: string,
  eventId: string,
  userId: string,
  order: EventMemberOrder,
  transaction?: Transaction,
): Promise<void> => {
  const orderRef = ordersCollection(communityId, eventId, userId)
    .doc(order.id)
    .withConverter(new EventMemberOrderConverter())

  if (transaction === undefined) {
    await orderRef.set(order, { merge: true })
  } else {
    transaction.set(orderRef, order, { merge: true })
  }
}

export const deleteOrder = async (
  communityId: string,
  eventId: string,
  userId: string,
  orderId: string,
  transaction?: Transaction,
): Promise<void> => {
  const orderRef = ordersCollection(communityId, eventId, userId).doc(orderId)

  if (transaction === undefined) {
    await orderRef.delete()
  } else {
    transaction.delete(orderRef)
  }
}

// 自動生成 ID で order ドキュメントを作成（addToCart 用）
export const createOrder = async (
  communityId: string,
  eventId: string,
  userId: string,
  src: Partial<EventMemberOrder>,
  transaction?: Transaction,
): Promise<EventMemberOrder> => {
  const newRef = ordersCollection(communityId, eventId, userId).doc()
  const order = new EventMemberOrder(newRef.id, { ...src, order_id: newRef.id })
  const typedRef = newRef.withConverter(new EventMemberOrderConverter())

  if (transaction === undefined) {
    await typedRef.set(order, { merge: true })
  } else {
    transaction.set(typedRef, order, { merge: true })
  }
  return order
}

// ── EventStripe Store 関数 ──

export const getStripe = async (
  communityId: string,
  eventId: string,
  stripeId: string,
  transaction?: Transaction,
): Promise<EventStripe | undefined> => {
  const stripeRef = stripesCollection(communityId, eventId).doc(stripeId).withConverter(new EventStripeConverter())
  const snapshot = await (transaction === undefined ? stripeRef.get() : transaction.get(stripeRef))
  return snapshot.exists ? snapshot.data() : undefined
}

export const getStripeByPaymentIntent = async (
  communityId: string,
  eventId: string,
  paymentIntent: string,
  transaction?: Transaction,
): Promise<EventStripe | undefined> => {
  const query = stripesCollection(communityId, eventId)
    .where('payment_intent', '==', paymentIntent)
    .limit(1)
    .withConverter(new EventStripeConverter())
  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  return snapshot.empty ? undefined : snapshot.docs[0].data()
}

export const createStripeDoc = (communityId: string, eventId: string): string => {
  return stripesCollection(communityId, eventId).doc().id
}

export const saveStripe = async (
  communityId: string,
  eventId: string,
  stripe: EventStripe,
  transaction?: Transaction,
): Promise<void> => {
  const stripeRef = stripesCollection(communityId, eventId).doc(stripe.id).withConverter(new EventStripeConverter())
  if (transaction === undefined) {
    await stripeRef.set(stripe, { merge: true })
  } else {
    transaction.set(stripeRef, stripe, { merge: true })
  }
}

/**
 * 参加イベント数（仕様 5.1.2 / RC-57）。
 * `status === 'ordered'` の member_orders から (community_id, event_id) をユニーク化し、
 * `is_deleted == false` かつ `event_status.value !== 'event_canceled'` のイベントのみ数える。
 */
export const countParticipatedEventsForUser = async (userId: string): Promise<number> => {
  if (userId === '') {
    return 0
  }
  const db = getFirestore()
  const snapshot = await db
    .collectionGroup('member_orders')
    .where('user_id', '==', userId)
    .where('status', '==', 'ordered')
    .withConverter(new EventMemberOrderConverter())
    .get()

  const eventRefs = new Map<string, { community_id: string; event_id: string }>()
  for (const doc of snapshot.docs) {
    const order = doc.data()
    const key = getCommunityEventKey(order.community_id, order.event_id)
    if (!eventRefs.has(key)) {
      eventRefs.set(key, { community_id: order.community_id, event_id: order.event_id })
    }
  }

  if (eventRefs.size === 0) {
    return 0
  }

  const eventMap = await getEventsInCommunities([...eventRefs.values()])
  let count = 0
  for (const key of eventRefs.keys()) {
    const event = eventMap.get(key)
    if (event != null && !event.is_deleted && !event.isCanceled()) {
      count += 1
    }
  }
  return count
}

export const getInCartMemberOrdersByUpdatedTime = async (
  startTimeMillis: number,
  endTimeMillis: number,
  transaction?: Transaction,
): Promise<EventMemberOrder[]> => {
  const db = getFirestore()
  const query = db
    .collectionGroup('member_orders')
    .where('status', '==', 'in_cart')
    .where('updated_at', '>', Timestamp.fromMillis(startTimeMillis))
    .where('updated_at', '<=', Timestamp.fromMillis(endTimeMillis))
    .withConverter(new EventMemberOrderConverter())

  const snapshot = await (transaction === undefined ? query.get() : transaction.get(query))
  return snapshot.docs.map((doc) => doc.data())
}
