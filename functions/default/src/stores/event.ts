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
import { EventMemberOrder, EventMemberOrderStatusType } from '@shokujii/common/schemas/EventMemberOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'
import { getUser, getUserRef, type ShokujiiUser } from './user.js'
import { EventLog } from '@shokujii/common/schemas/EventLog.js'
import { getRefFromPath } from '@shokujii/common/schemas/firebase/index.js'
import {
  getOrders as getOrdersFromStore,
  getOrder as getOrderFromStore,
  saveOrder as saveOrderFromStore,
  getOrdersByIds as getOrdersByIdsFromStore,
  hasOrderedOrders as hasOrderedOrdersFromStore,
} from './memberOrder.js'

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

  async getOrders(status?: EventMemberOrderStatusType, transaction?: Transaction): Promise<EventMemberOrder[]> {
    return getOrdersFromStore(this.community_id, this.id, status, transaction)
  }

  async hasOrderedOrders(transaction?: Transaction): Promise<boolean> {
    return hasOrderedOrdersFromStore(this.community_id, this.id, transaction)
  }

  async getOrder(userId: string, orderId: string, transaction?: Transaction): Promise<EventMemberOrder | undefined> {
    return getOrderFromStore(this.community_id, this.id, userId, orderId, transaction)
  }

  async saveOrder(userId: string, order: EventMemberOrder, transaction?: Transaction): Promise<void> {
    return saveOrderFromStore(this.community_id, this.id, userId, order, transaction)
  }

  async getOrdersByIds(userId: string, orderIds: string[], transaction?: Transaction): Promise<EventMemberOrder[]> {
    return getOrdersByIdsFromStore(this.community_id, this.id, userId, orderIds, transaction)
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
   * `members` / `event_num_members` のみを書き換える（`updated_by`・`updated_at` は変更しない）。
   * `utils/recalcEventMembers.ts` が ordered を集計してイベントに反映するときに使う。
   * `withConverter` 付き ref ではなく生の `eventRef` で `transaction.update` するのは、上記の監査フィールドを変えずに部分更新するための意図的な例外（`set` + `toFirestore` 経路だと `updated_by` 等まで書き換わる）。
   */
  async updateMembersFieldOnly(memberUserIds: string[], transaction: Transaction): Promise<void> {
    const members = memberUserIds.map((id) => getRefFromPath(`users/${id}`))
    const db = getFirestore()
    const eventRef = db.collection('communities').doc(this.community_id).collection('events').doc(this.id)
    transaction.update(eventRef, {
      members,
      event_num_members: memberUserIds.length,
    })
    this.members = memberUserIds
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

/**
 * eventId のみが分かる場合に collectionGroup で横断検索して単一イベントを取得する。
 * communityId が分かる場合は getEventInCommunity を使うこと。
 *
 * eventCopy / eventReceipt / ogpRequest 等、リクエストや URL に communityId が含まれない
 * Tier C 向け。getAllAcceptingOrderEvents 等の全コミュニティ横断一覧取得とは用途が異なる。
 */
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

/**
 * communities/{communityId}/events/{eventId} を直接参照して取得する。
 *
 * Callable・Webhook・Scheduled で communityId と eventId の両方が分かる場合はこちらを優先する。
 * collectionGroup より読み取りコストが低く、パスでコミュニティを固定できる。
 * 第3引数 transaction で Transaction 内 read にも対応する。
 */
export const getEventInCommunity = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<ShokujiiEvent | undefined> => {
  const db = getFirestore()
  const eventRef = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .withConverter(new ShokujiiEventConverter())
  const snapshot = await (transaction === undefined ? eventRef.get() : transaction.get(eventRef))
  return snapshot.exists ? snapshot.data() : undefined
}

/** `getEventsInCommunities` の結果キー: `community_id\tevent_id` */
const buildCommunityEventKey = (communityId: string, eventId: string): string => `${communityId}\t${eventId}`

export const getCommunityEventKey = buildCommunityEventKey

/**
 * マイページプロフィール用の参加イベントプレビュー（§4.2.0）。
 * 限定公開も含め参加実績から limit する（リンク可否は Callable が `is_linkable` で付与）。
 */
export const listEventsForProfilePreview = async (params: {
  targetUserId: string
  limit: number
}): Promise<ShokujiiEvent[]> => {
  const { targetUserId, limit } = params
  const db = getFirestore()
  const userRef = getUserRef(targetUserId)
  const eventsQuery = db
    .collectionGroup('events')
    .where('members', 'array-contains', userRef)
    .where('is_deleted', '==', false)
  const snapshot = await eventsQuery
    .orderBy('event_start_datetime', 'desc')
    .limit(limit)
    .withConverter(new ShokujiiEventConverter(targetUserId))
    .get()
  return snapshot.docs.map((doc) => doc.data())
}

/**
 * `communities/{communityId}/events/{eventId}` を一括取得する。
 * 大量参照時は Firestore の getAll の上限を考慮して 100 件単位でチャンクする。
 * 戻り値のキーは `getCommunityEventKey(communityId, eventId)`。存在しないものは含めない。
 */
export const getEventsInCommunities = async (
  refs: readonly { community_id: string; event_id: string }[],
): Promise<Map<string, ShokujiiEvent>> => {
  const result = new Map<string, ShokujiiEvent>()
  if (refs.length === 0) {
    return result
  }
  const db = getFirestore()
  const converter = new ShokujiiEventConverter()
  const uniqueRefs = Array.from(
    new Map(refs.map((r) => [buildCommunityEventKey(r.community_id, r.event_id), r])).values(),
  )

  const CHUNK_SIZE = 100
  for (let i = 0; i < uniqueRefs.length; i += CHUNK_SIZE) {
    const chunk = uniqueRefs.slice(i, i + CHUNK_SIZE)
    const docRefs = chunk.map((r) =>
      db.collection('communities').doc(r.community_id).collection('events').doc(r.event_id).withConverter(converter),
    )
    const snapshots = await db.getAll(...docRefs)
    snapshots.forEach((snapshot) => {
      if (!snapshot.exists) {
        return
      }
      const data = snapshot.data() as ShokujiiEvent | undefined
      if (data == null) {
        return
      }
      result.set(buildCommunityEventKey(data.community_id, data.id), data)
    })
  }
  return result
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

/** イベント開始時刻の範囲で注文受付中のイベントを取得（Slack slackEventNotification 用） */
export const getAcceptingOrderEventsByStartTime = async (
  startTimeMillis: number,
  endTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('event_start_datetime', '>', Timestamp.fromMillis(startTimeMillis))
    .where('event_start_datetime', '<=', Timestamp.fromMillis(endTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
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

/**
 * イベント変更差分を `events/{eventId}/logs` に追加する。
 * legacy `log_event_status` の write_log 相当。withConverter 付き ref 経由で書き込む。
 */
export const addEventChangeLog = async (
  communityId: string,
  eventId: string,
  differences: Record<string, unknown>,
  updatedBy: string,
): Promise<void> => {
  const db = getFirestore()
  const logsCollection = db
    .collection('communities')
    .doc(communityId)
    .collection('events')
    .doc(eventId)
    .collection('logs')

  const logRef = logsCollection.doc().withConverter(new ShokujiiEventLogConverter())
  const updatedAt =
    differences.updated_at instanceof Timestamp
      ? differences.updated_at.toMillis()
      : typeof differences.updated_at === 'number'
        ? differences.updated_at
        : Date.now()

  const log = new EventLog(logRef.id, {
    ...differences,
    updated_by: updatedBy,
    updated_at: updatedAt,
  })
  await logRef.set(log)
}
