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

const mapDocToUserFriendListRow = (doc: QueryDocumentSnapshot): UserFriendListRow | null => {
  const data = doc.data()
  const meetCount = toNonNegativeInt(data.meet_count)
  const firstMetAt = toMillis(data.first_met_at)
  const lastMetAt = toMillis(data.last_met_at)
  if (meetCount == null || firstMetAt == null || lastMetAt == null) {
    logger.warn('listUserFriends skipped invalid friend doc', { friendUserId: doc.id })
    return null
  }
  return {
    id: doc.id,
    meet_count: meetCount,
    first_met_at: firstMetAt,
    last_met_at: lastMetAt,
  }
}

const cursorValueFromDoc = (doc: QueryDocumentSnapshot, sortBy: UserFriendsSortBy): number | null => {
  const raw = doc.data()[sortBy]
  if (sortBy === 'meet_count') {
    return toNonNegativeInt(raw)
  }
  return toMillis(raw)
}

/** 一覧に返せる doc か（表示用マップと cursor 用ソートキーの両方が有効） */
const canReturnFriendDoc = (doc: QueryDocumentSnapshot, sortBy: UserFriendsSortBy): boolean =>
  mapDocToUserFriendListRow(doc) != null && cursorValueFromDoc(doc, sortBy) != null

const mapReturnedDocsToFriends = (returnedDocs: QueryDocumentSnapshot[]): UserFriendListRow[] =>
  returnedDocs
    .map((doc) => mapDocToUserFriendListRow(doc))
    .filter((friend): friend is UserFriendListRow => friend != null)

/** このページで返す doc を決める（RC-4: sentinel は返却に含めてから cursor に使う） */
const collectReturnedDocs = (
  pageDocs: QueryDocumentSnapshot[],
  docs: QueryDocumentSnapshot[],
  limit: number,
  firestoreHasMore: boolean,
  sortBy: UserFriendsSortBy,
): QueryDocumentSnapshot[] => {
  const returned = pageDocs.filter((doc) => canReturnFriendDoc(doc, sortBy))

  if (returned.length === 0 && firestoreHasMore && docs.length > limit) {
    const sentinelDoc = docs[limit]
    if (canReturnFriendDoc(sentinelDoc, sortBy)) {
      returned.push(sentinelDoc)
    }
  }

  return returned
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

export type UserFriendsListCursor = {
  value: number
  friend_user_id: string
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
    // DB 上の last_met_at は Timestamp。number のまま startAfter するとページングが不安定になることがある
    const cursorValue = sortBy === 'last_met_at' ? Timestamp.fromMillis(cursor.value) : cursor.value
    query = query.startAfter(cursorValue, cursor.friend_user_id)
  }

  const snapshot = await query.get()
  const docs = snapshot.docs
  const firestoreHasMore = docs.length > limit
  const pageDocs = firestoreHasMore ? docs.slice(0, limit) : docs
  const returnedDocs = collectReturnedDocs(pageDocs, docs, limit, firestoreHasMore, sortBy)
  const friends = mapReturnedDocsToFriends(returnedDocs)

  if (pageDocs.length === 0) {
    return { friends, hasMore: false, nextCursor: null }
  }

  const lastReturnedDoc = returnedDocs[returnedDocs.length - 1]
  const cursorValue = lastReturnedDoc != null ? cursorValueFromDoc(lastReturnedDoc, sortBy) : null
  const nextCursor =
    firestoreHasMore && lastReturnedDoc != null && cursorValue != null
      ? {
          value: cursorValue,
          friend_user_id: lastReturnedDoc.id,
        }
      : null

  return {
    friends,
    hasMore: nextCursor != null,
    nextCursor,
  }
}
