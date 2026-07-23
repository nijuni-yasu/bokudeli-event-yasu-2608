import { onCall, HttpsError } from 'firebase-functions/https'
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore, FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'
import { getUser, getUserRef, ShokujiiUser } from './stores/user.js'
import { getOrders } from './stores/memberOrder.js'
import { getEventInCommunity } from './stores/event.js'
import type { EventMemberOrderStatusType } from '@shokujii/common/schemas/EventMemberOrder.js'
import { normalizeTag, normalizeTagList } from '@shokujii/common/utils/normalizeTag.js'
import type { UpdateUserTagsRequest, AddTagToMyProfileRequest } from '@shokujii/common/apis/userTags.js'

const logger = createModuleLogger('userTags')
const db = getFirestore()

const MAX_TAGS = 10
const MAX_TAG_LEN = 20

const isOrderedTransition = (
  beforeStatus: EventMemberOrderStatusType | undefined,
  afterStatus: EventMemberOrderStatusType | undefined,
  beforeUserId: string | undefined,
  afterUserId: string | undefined,
): boolean => {
  if (beforeStatus !== 'ordered' && afterStatus !== 'ordered') return false
  if (beforeStatus === 'ordered' && afterStatus === 'ordered' && beforeUserId === afterUserId) return false
  return true
}

export const updateUserTags = onCall<UpdateUserTagsRequest, Promise<{ success: boolean; message: string }>>(
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const raw = request.data?.tags
    if (!Array.isArray(raw)) {
      throw new HttpsError('invalid-argument', 'tags が不正です')
    }
    const normalized = normalizeTagList(raw.map((t) => String(t)))
    if (normalized.length > MAX_TAGS) {
      throw new HttpsError('invalid-argument', `タグは最大${MAX_TAGS}個までです`)
    }
    for (const t of normalized) {
      if (t.length > MAX_TAG_LEN) {
        throw new HttpsError('invalid-argument', `各タグは最大${MAX_TAG_LEN}文字までです`)
      }
    }

    const existing = await getUser(uid, false)
    if (existing == null) {
      throw new HttpsError('not-found', 'ユーザーが見つかりません')
    }
    const updated = new ShokujiiUser(uid, { ...existing, user_tags: normalized })
    await getUserRef(uid).set(updated, { merge: true })
    logger.info('user_tags 更新', { uid, count: normalized.length })
    return { success: true, message: '' }
  },
)

export const addTagToMyProfile = onCall<AddTagToMyProfileRequest, Promise<{ success: boolean; message: string }>>(
  async (request) => {
    const uid = request.auth?.uid
    if (uid == null) {
      throw new HttpsError('unauthenticated', '認証が必要です')
    }
    const tag = normalizeTag(String(request.data?.tag ?? ''))
    if (tag.length === 0) {
      throw new HttpsError('invalid-argument', 'タグが空です')
    }
    if (tag.length > MAX_TAG_LEN) {
      throw new HttpsError('invalid-argument', `タグは最大${MAX_TAG_LEN}文字までです`)
    }

    const existing = await getUser(uid, false)
    if (existing == null) {
      throw new HttpsError('not-found', 'ユーザーが見つかりません')
    }
    const current = normalizeTagList([...(existing.user_tags ?? [])])
    if (current.includes(tag)) {
      return { success: true, message: '既に設定済みです' }
    }
    if (current.length >= MAX_TAGS) {
      throw new HttpsError('failed-precondition', `タグは最大${MAX_TAGS}個までです`)
    }
    const updated = new ShokujiiUser(uid, { ...existing, user_tags: [...current, tag] })
    await getUserRef(uid).set(updated, { merge: true })
    logger.info('user_tags 1件追加', { uid, tag })
    return { success: true, message: '' }
  },
)

export const syncMemberTagOnOrderChanged = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}',
    region: 'asia-northeast1',
  },
  async (firestoreEvent) => {
    const { communityId, eventId, userId } = firestoreEvent.params

    const beforeData = firestoreEvent.data?.before?.data()
    const afterData = firestoreEvent.data?.after?.data()
    const beforeStatus = beforeData?.status as EventMemberOrderStatusType | undefined
    const afterStatus = afterData?.status as EventMemberOrderStatusType | undefined

    if (!isOrderedTransition(beforeStatus, afterStatus, beforeData?.user_id, afterData?.user_id)) {
      return
    }

    const memberTagRef = db
      .collection('communities')
      .doc(communityId)
      .collection('events')
      .doc(eventId)
      .collection('member_tags')
      .doc(userId)

    await db.runTransaction(async (tx) => {
      const eventData = await getEventInCommunity(communityId, eventId, tx)
      if (eventData == null || eventData.community_id !== communityId) {
        logger.warn('syncMemberTagOnOrderChanged: event not found', { communityId, eventId })
        return
      }

      const orderedOrders = await getOrders(communityId, eventId, 'ordered', tx)
      const userHasOrdered = orderedOrders.some((o) => o.user_id === userId)

      if (!userHasOrdered) {
        tx.delete(memberTagRef)
        return
      }

      const u = await getUser(userId, false, tx)
      const tags = u?.user_tags ?? []
      const tagSnap = await tx.get(memberTagRef)
      const now = Timestamp.now()
      if (!tagSnap.exists) {
        tx.set(memberTagRef, {
          user_id: userId,
          user_tags: tags,
          created_at: now,
          updated_at: now,
        })
      } else {
        tx.set(
          memberTagRef,
          {
            user_id: userId,
            user_tags: tags,
            updated_at: now,
          },
          { merge: true },
        )
      }
    })
  },
)

export const updateEventMemberTags = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/member_tags/{userId}',
    region: 'asia-northeast1',
  },
  async (firestoreEvent) => {
    const { communityId, eventId } = firestoreEvent.params
    const eventRef = db.collection('communities').doc(communityId).collection('events').doc(eventId)
    const memberTagsCol = eventRef.collection('member_tags')
    const snap = await memberTagsCol.get()

    const counts: Record<string, number> = {}
    for (const doc of snap.docs) {
      const arr = (doc.data().user_tags as string[] | undefined) ?? []
      const unique = new Set(arr)
      for (const t of unique) {
        if (t.length === 0) continue
        counts[t] = (counts[t] ?? 0) + 1
      }
    }

    if (snap.docs.length === 0 || Object.keys(counts).length === 0) {
      await eventRef.update({ event_members_tags: FieldValue.delete() })
      return
    }
    await eventRef.update({ event_members_tags: counts })
  },
)

export const syncUserTagsToEvent = onDocumentWritten(
  { document: 'users/{userId}', region: 'asia-northeast1' },
  async (firestoreEvent) => {
    const userId = firestoreEvent.params.userId
    const beforeTags = firestoreEvent.data?.before?.data()?.user_tags as string[] | undefined
    const afterTags = firestoreEvent.data?.after?.data()?.user_tags as string[] | undefined
    if (JSON.stringify(beforeTags ?? []) === JSON.stringify(afterTags ?? [])) {
      return
    }

    const userDocRef = db.collection('users').doc(userId)
    const now = Timestamp.now()
    const q = db
      .collectionGroup('events')
      .where('members', 'array-contains', userDocRef)
      .where('is_deleted', '==', false)
      .where('event_end_datetime', '>', now)

    const eventsSnap = await q.get()
    const tags = afterTags ?? []
    let batch = db.batch()
    let n = 0
    const ts = Timestamp.now()
    for (const eventDoc of eventsSnap.docs) {
      const members = (eventDoc.data()?.members ?? []) as DocumentReference[]
      if (!members.some((r) => r.id === userId)) {
        continue
      }
      const mtRef = eventDoc.ref.collection('member_tags').doc(userId)
      batch.set(mtRef, { user_id: userId, user_tags: tags, updated_at: ts }, { merge: true })
      n++
      if (n >= 400) {
        await batch.commit()
        batch = db.batch()
        n = 0
      }
    }
    if (n > 0) {
      await batch.commit()
    }
    logger.info('syncUserTagsToEvent', { userId, eventCount: eventsSnap.docs.length })
  },
)
