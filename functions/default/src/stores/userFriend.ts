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

export const userFriendRef = (uid: string, friendUid: string): DocumentReference<UserFriend> => {
  return friendsCollection(uid).doc(friendUid).withConverter(userFriendConverter)
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
): Promise<{ friends: UserFriend[]; hasMore: boolean; nextCursor: UserFriendsListCursor | null }> => {
  let query = friendsCollection(uid)
    .withConverter(userFriendConverter)
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
  const hasMore = docs.length > limit
  const pageDocs = hasMore ? docs.slice(0, limit) : docs
  const friends = pageDocs.map((doc) => doc.data())

  if (pageDocs.length === 0) {
    return { friends, hasMore: false, nextCursor: null }
  }

  const lastDoc = pageDocs[pageDocs.length - 1]
  const nextCursor = hasMore
    ? {
        value: (lastDoc.data() as UserFriend)[sortBy],
        friend_user_id: lastDoc.id,
      }
    : null

  return { friends, hasMore, nextCursor }
}
