import {
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
  Timestamp,
  DocumentReference,
} from 'firebase-admin/firestore'
import { Event } from '@shokujii/common/schemas/Event.js'
import { EventOrder, EventOrderStatusType } from '@shokujii/common/schemas/EventOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { getUser, type ShokujiiUser } from './user.js'
import { EventLog } from '@shokujii/common/schemas/EventLog.js'

class ShokujiiEventConverter implements FirestoreDataConverter<ShokujiiEvent> {
  constructor(private readonly userId?: string) {
    // console.log('ShojukiEventConverter initialized with userId:', userId)
  }
  toFirestore(event: ShokujiiEvent): DocumentData {
    if (this.userId == null) {
      throw new Error('userId is required')
    }
    return event.toFirestore(this.userId)
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiEvent {
    return new ShokujiiEvent(snapshot.id, snapshot.data())
  }
}

class ShokujiiEventOrderConverter implements FirestoreDataConverter<EventOrder> {
  toFirestore(order: EventOrder): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventOrder {
    const eventId = snapshot.ref.parent.parent!.id
    return new EventOrder(eventId, snapshot.id, snapshot.data())
  }
}

class ShokujiiEventMenuConverter implements FirestoreDataConverter<EventMenu> {
  toFirestore(order: EventMenu): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventMenu {
    const eventId = snapshot.ref.parent.parent!.id
    return new EventMenu(eventId, snapshot.id, snapshot.data())
  }
}

class ShokujiiEventLogConverter implements FirestoreDataConverter<EventLog> {
  toFirestore(log: EventLog): DocumentData {
    return log.toFirestore()
  }

  fromFirestore(snapshot: QueryDocumentSnapshot): EventLog {
    return new EventLog(snapshot.id, snapshot.data())
  }
}

export class ShokujiiEvent extends Event {
  constructor(id: string | null, src: Partial<Event>) {
    if (id == null) {
      if (src.community_id == null) {
        throw new Error('community_id is required')
      }
      const db = getFirestore()
      id = db.collection('communities').doc(src.community_id).collection('events').doc().id
    }
    super(id, src)
  }

  async getOrders(status?: EventOrderStatusType, transaction?: Transaction): Promise<EventOrder[]> {
    const db = getFirestore()
    const ordersRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .withConverter(new ShokujiiEventOrderConverter())
    const snapshot = await (transaction === undefined ? ordersRef.get() : transaction.get(ordersRef))
    const orders = snapshot.docs.map((doc) => doc.data())
    return status === undefined ? orders : orders.filter((order) => order.status === status)
  }

  /**
   * status === 'ordered' の注文が 1 件以上存在するかを limit(1) で効率的に判定する
   */
  async hasOrderedOrders(transaction?: Transaction): Promise<boolean> {
    const db = getFirestore()
    const ordersRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .where('status', '==', 'ordered')
      .limit(1)
      .withConverter(new ShokujiiEventOrderConverter())
    const snapshot = await (transaction === undefined ? ordersRef.get() : transaction.get(ordersRef))
    return !snapshot.empty
  }

  async getOrder(orderId: string, transaction?: Transaction): Promise<EventOrder | undefined> {
    const db = getFirestore()
    const orderRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .doc(orderId)
      .withConverter(new ShokujiiEventOrderConverter())
    const snapshot = await (transaction === undefined ? orderRef.get() : transaction.get(orderRef))
    return snapshot.data()
  }

  async saveOrder(order: EventOrder, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const orderRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .doc(order.id)
      .withConverter(new ShokujiiEventOrderConverter())
    if (transaction === undefined) {
      await orderRef.set(order, { merge: true })
    } else {
      transaction.set(orderRef, order, { merge: true })
    }
  }

  async getMenus(transaction?: Transaction): Promise<EventMenu[]> {
    const db = getFirestore()
    const menusRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('menus')
      .withConverter(new ShokujiiEventMenuConverter())
    const snapshot = await (transaction === undefined ? menusRef.get() : transaction.get(menusRef))
    return snapshot.docs.map((doc) => doc.data())
  }

  async saveMenu(menu: EventMenu, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const menuRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('menus')
      .doc(menu.id)
      .withConverter(new ShokujiiEventMenuConverter())
    if (transaction === undefined) {
      await menuRef.set(menu, { merge: true })
    } else {
      transaction.set(menuRef, menu, { merge: true })
    }
  }

  async deleteMenu(menu: EventMenu, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const menuRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('menus')
      .doc(menu.id)
      .withConverter(new ShokujiiEventMenuConverter())
    if (transaction === undefined) {
      await menuRef.delete()
    } else {
      transaction.delete(menuRef)
    }
  }

  async getMembers(withPersonalInformation: boolean): Promise<ShokujiiUser[]> {
    const members = await Promise.all(this.members.map(async (id) => getUser(id, withPersonalInformation)))
    return members.filter((member): member is ShokujiiUser => member !== undefined)
  }

  addMember(user: ShokujiiUser | string) {
    const id = typeof user === 'string' ? user : user.id
    super.addMember(id)
  }

  removeMember(user: ShokujiiUser | string) {
    const id = typeof user === 'string' ? user : user.id
    super.removeMember(id)
  }

  /**
   * イベントステータスの最後の更新日時を取得
   * where + orderBy + limit(1) で 1 件のみ読み取り
   */
  async getLastUpdatedTimeByStatus(status: string): Promise<number | null> {
    const db = getFirestore()
    const logsRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('logs')
      .where('event_status.value', '==', status)
      .orderBy('updated_at', 'desc')
      .limit(1)
      .withConverter(new ShokujiiEventLogConverter())

    const logsSnapshot = await logsRef.get()
    const log = logsSnapshot.docs[0]?.data()
    return log?.updated_at ?? null
  }

  /**
   * イベントを更新
   */
  async updateEvent(data: Partial<ShokujiiEvent>, updateUserId: string, transaction?: Transaction): Promise<void> {
    // 明示的な userId チェック
    if (updateUserId === '') {
      throw new Error('Cannot update event: updateUserId must be a non-empty string')
    }

    // インスタンスを更新
    Object.assign(this, data)
    this.updated_by = updateUserId

    // ShokujiiEventConverterを使ってFirestoreに保存
    const db = getFirestore()
    const eventRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .withConverter(new ShokujiiEventConverter(updateUserId))

    if (transaction === undefined) {
      await eventRef.set(this, { merge: true })
    } else {
      transaction.set(eventRef, this, { merge: true })
    }
  }
}

export const getEvent = async (eventId: string, transaction?: Transaction): Promise<ShokujiiEvent | undefined> => {
  const db = getFirestore()
  const eventRef = db
    .collectionGroup('events')
    .where('event_id', '==', eventId)
    .limit(1)
    .withConverter(new ShokujiiEventConverter())
  const eventData = await (transaction === undefined ? eventRef.get() : transaction.get(eventRef))
  return eventData.empty ? undefined : eventData.docs[0].data()
}

export const saveEvent = async (userId: string, event: ShokujiiEvent, transaction?: Transaction): Promise<void> => {
  const db = getFirestore()
  const eventRef = db
    .collection('communities')
    .doc(event.community_id)
    .collection('events')
    .doc(event.id)
    .withConverter(new ShokujiiEventConverter(userId))
  if (transaction === undefined) {
    await eventRef.set(event, { merge: true })
  } else {
    transaction.set(eventRef, event, { merge: true })
  }
}

// 公開イベントで注文受付中のイベントを取得
export const getAllAcceptingOrderEvents = async (
  targetDateTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('is_public', '==', true)
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(targetDateTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}

// 注文受付中かつ注文期限が未来のイベントを取得（公開・非公開を問わない）
export const getAcceptingOrderEventsBeforeDeadline = async (
  nowDateTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(nowDateTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}

export const getAcceptingOrderEventsByTime = async (
  startTimeMillis: number,
  endTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(startTimeMillis))
    .where('event_deadline_datetime', '<=', Timestamp.fromMillis(endTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}

// イベント終了時間の範囲で注文受付中のイベントを取得
export const getAcceptingOrderEventsByEndTime = async (
  startTimeMillis: number,
  endTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_end_datetime', '>', Timestamp.fromMillis(startTimeMillis))
    .where('event_end_datetime', '<=', Timestamp.fromMillis(endTimeMillis))
    .where('event_status.value', '==', 'accepting_order')
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}

// 更新時間の範囲でカート内注文を取得
export const getInCartOrdersByUpdatedTime = async (
  startTimeMillis: number,
  endTimeMillis: number,
  transaction?: Transaction,
): Promise<EventOrder[]> => {
  const db = getFirestore()
  const ordersRef = db
    .collectionGroup('orders')
    .where('status', '==', 'in_cart')
    .where('updated_at', '>', Timestamp.fromMillis(startTimeMillis))
    .where('updated_at', '<=', Timestamp.fromMillis(endTimeMillis))
    .withConverter(new ShokujiiEventOrderConverter())
  const ordersSnapshot = await (transaction === undefined ? ordersRef.get() : transaction.get(ordersRef))
  return ordersSnapshot.docs.map((doc) => doc.data())
}

// 予約申請中のイベントを取得
export const getApplyingReservationEvents = async (
  nowDateTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'applying_reservation')
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(nowDateTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}

export const convertReferenceToEvent = async (
  eventRef: DocumentReference<DocumentData, DocumentData>,
): Promise<ShokujiiEvent | undefined> => {
  const eventSnapshot = await eventRef.withConverter(new ShokujiiEventConverter()).get()
  return eventSnapshot.data()
}
