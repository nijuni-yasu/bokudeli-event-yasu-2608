import {
  DocumentData,
  DocumentReference,
  FieldPath,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Timestamp,
  Transaction,
} from 'firebase-admin/firestore'
import { UserFriend } from '@shokujii/common/schemas/UserFriend.js'
import type { UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import { createModuleLogger } from '../utils/logger.js'

const logger = createModuleLogger('userFriend')

/** 友人一覧・プレビュー用の最小フィールド（`event_history` は読まない） */
export type UserFriendListRow = {
  id: string
  meet_count: number
  first_met_at: number
  last_met_at: number
}

const LIST_FIELDS = ['meet_count', 'first_met_at', 'last_met_at'] as const

class UserFriendConverter implements FirestoreDataConverter<UserFriend> {
  toFirestore(friend: UserFriend): DocumentData {
    return friend.toFirestore()
  }

  fromFirestore(snapshot: QueryDocumentSnapshot): UserFriend {
    return new UserFriend(snapshot.id, snapshot.data())
  }
}

const userFriendConverter = new UserFriendConverter()

const friendsCollection = (uid: string) => {
  const db = getFirestore()
  return db.collection('users').doc(uid).collection('friends')
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const toMillis = (value: unknown): number | null => {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (!isRecord(value)) return null

  const toMillisFn = value['toMillis']
  if (typeof toMillisFn !== 'function') return null

  const result = toMillisFn.call(value)
  return typeof result === 'number' && Number.isFinite(result) ? result : null
}

const toNonNegativeInt = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    return null
  }
  return value
}

const sortValueFromDoc = (doc: QueryDocumentSnapshot, sortBy: UserFriendsSortBy): number | null => {
  const raw = doc.data()[sortBy]
  if (sortBy === 'meet_count') {
    return toNonNegativeInt(raw)
  }
  return toMillis(raw)
}

export type UserFriendsListCursor = {
  value: number
  friend_user_id: string
  /** sortBy フィールド欠損時は `startAfter(null, friend_user_id)` でスキャンを進める */
  sort_value_null?: boolean
}

type ParsedFriendDoc = {
  doc: QueryDocumentSnapshot
  row: UserFriendListRow | null
  pagingCursor: UserFriendsListCursor
}

const buildPagingCursorFromDoc = (doc: QueryDocumentSnapshot, sortBy: UserFriendsSortBy): UserFriendsListCursor => {
  const sortValue = sortValueFromDoc(doc, sortBy)
  if (sortValue != null) {
    return {
      value: sortValue,
      friend_user_id: doc.id,
    }
  }
  return {
    value: 0,
    friend_user_id: doc.id,
    sort_value_null: true,
  }
}

const parseFriendDoc = (
  doc: QueryDocumentSnapshot,
  sortBy: UserFriendsSortBy,
  ownerUserId: string,
): ParsedFriendDoc => {
  const data = doc.data()
  const meetCount = toNonNegativeInt(data.meet_count)
  const firstMetAt = toMillis(data.first_met_at)
  const lastMetAt = toMillis(data.last_met_at)
  const pagingCursor = buildPagingCursorFromDoc(doc, sortBy)

  if (meetCount == null || firstMetAt == null || lastMetAt == null) {
    logger.warn('listUserFriends skipped invalid friend doc', {
      ownerUserId,
      friendUserId: doc.id,
    })
    return { doc, row: null, pagingCursor }
  }

  return {
    doc,
    row: {
      id: doc.id,
      meet_count: meetCount,
      first_met_at: firstMetAt,
      last_met_at: lastMetAt,
    },
    pagingCursor,
  }
}

/** このページで返す doc を決める（RC-4: sentinel は返却に含めてから cursor に使う） */
const collectReturnedParsed = (
  pageParsed: ParsedFriendDoc[],
  sentinelParsed: ParsedFriendDoc | undefined,
  firestoreHasMore: boolean,
): ParsedFriendDoc[] => {
  const returned = pageParsed.filter((parsed) => parsed.row != null)

  if (returned.length === 0 && firestoreHasMore && sentinelParsed?.row != null) {
    returned.push(sentinelParsed)
  }

  return returned
}

const applyStartAfter = (
  query: ReturnType<ReturnType<typeof friendsCollection>['select']>,
  cursor: UserFriendsListCursor,
  sortBy: UserFriendsSortBy,
) => {
  if (cursor.sort_value_null === true) {
    return query.startAfter(null, cursor.friend_user_id)
  }
  const cursorValue = sortBy === 'last_met_at' ? Timestamp.fromMillis(cursor.value) : cursor.value
  return query.startAfter(cursorValue, cursor.friend_user_id)
}

export const userFriendRef = (uid: string, friendUid: string): DocumentReference<UserFriend> => {
  return friendsCollection(uid).doc(friendUid).withConverter(userFriendConverter)
}

/**
 * `users/{uid}/friends` のドキュメント ID（相手 user_id）をすべて返す。
 * 退会後の相手側 recount（RC-50）など、ページング不要の列挙用。
 */
export const listFriendUserIds = async (uid: string): Promise<string[]> => {
  const snapshot = await friendsCollection(uid).select().get()
  return snapshot.docs.map((doc) => doc.id)
}

export const getUserFriend = async (
  uid: string,
  friendUid: string,
  transaction?: Transaction,
): Promise<UserFriend | undefined> => {
  const ref = userFriendRef(uid, friendUid)
  const snapshot = transaction === undefined ? await ref.get() : await transaction.get(ref)
  return snapshot.exists ? snapshot.data() : undefined
}

export const saveUserFriend = async (uid: string, friend: UserFriend, transaction?: Transaction): Promise<void> => {
  const ref = userFriendRef(uid, friend.id)
  if (transaction === undefined) {
    await ref.set(friend, { merge: true })
  } else {
    transaction.set(ref, friend, { merge: true })
  }
}

export const deleteUserFriend = async (uid: string, friendUid: string, transaction?: Transaction): Promise<void> => {
  const ref = userFriendRef(uid, friendUid)
  if (transaction === undefined) {
    await ref.delete()
  } else {
    transaction.delete(ref)
  }
}

export const listUserFriends = async (
  uid: string,
  sortBy: UserFriendsSortBy,
  limit: number,
  cursor?: UserFriendsListCursor,
): Promise<{ friends: UserFriendListRow[]; hasMore: boolean; nextCursor: UserFriendsListCursor | null }> => {
  let query = friendsCollection(uid)
    .select(...LIST_FIELDS)
    .orderBy(sortBy, 'desc')
    .orderBy(FieldPath.documentId(), 'asc')
    .limit(limit + 1)

  if (cursor != null) {
    query = applyStartAfter(query, cursor, sortBy)
  }

  const snapshot = await query.get()
  const docs = snapshot.docs
  const firestoreHasMore = docs.length > limit
  const pageDocs = firestoreHasMore ? docs.slice(0, limit) : docs

  if (pageDocs.length === 0) {
    return { friends: [], hasMore: false, nextCursor: null }
  }

  const pageParsed = pageDocs.map((doc) => parseFriendDoc(doc, sortBy, uid))
  const sentinelParsed = firestoreHasMore ? parseFriendDoc(docs[limit], sortBy, uid) : undefined
  const returnedParsed = collectReturnedParsed(pageParsed, sentinelParsed, firestoreHasMore)
  const friends = returnedParsed.flatMap((parsed) => (parsed.row != null ? [parsed.row] : []))

  if (returnedParsed.length === 0) {
    if (!firestoreHasMore) {
      return { friends: [], hasMore: false, nextCursor: null }
    }
    const lastScanned = sentinelParsed ?? pageParsed[pageParsed.length - 1]
    const nextCursor = lastScanned.pagingCursor
    return {
      friends: [],
      hasMore: true,
      nextCursor,
    }
  }

  const lastReturned = returnedParsed[returnedParsed.length - 1]
  const nextCursor = firestoreHasMore ? lastReturned.pagingCursor : null

  return {
    friends,
    hasMore: nextCursor != null,
    nextCursor,
  }
}
