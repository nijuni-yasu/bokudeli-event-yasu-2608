import { getFirestore, Timestamp, type Query, type Transaction } from 'firebase-admin/firestore'
import { UserFriend } from '@shokujii/common/schemas/UserFriend.js'
import type { BackfillUserFriendsRequest, BackfillUserFriendsResponse } from '@shokujii/common/apis/userFriends.js'
import { getOrders } from '../stores/memberOrder.js'
import { deleteUserFriend, getUserFriend, saveUserFriend } from '../stores/userFriend.js'
import { createModuleLogger } from './logger.js'
import { recountUserProfileCountsForUsers } from './recountUserProfileCounts.js'
import { buildPairs, buildPairsWithAnchor, dedupeUserIdsForFriends } from './friendsPairUtils.js'

const logger = createModuleLogger('friendsService')

const MAX_EVENTS_PER_RUN = 10

/** 友人ペア更新の transaction 並列度（RC-21 / RC-49） */
export const PAIR_TX_CONCURRENCY = 8

const chunkPairs = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const runPairsWithConcurrency = async (
  pairs: [string, string][],
  updater: (history: EventHistoryEntry[]) => EventHistoryEntry[],
  logContext: { operation: string; event_id: string },
): Promise<number> => {
  let updatedDocs = 0
  for (const group of chunkPairs(pairs, PAIR_TX_CONCURRENCY)) {
    const results = await Promise.allSettled(group.map(([userA, userB]) => applyForPair(userA, userB, updater)))
    for (const result of results) {
      if (result.status === 'fulfilled') {
        updatedDocs += result.value
      } else {
        logger.error('applyForPair failed', {
          ...logContext,
          error: result.reason,
        })
      }
    }
  }
  return updatedDocs
}

export type EventHistoryEntry = {
  event_id: string
  community_id: string
  event_at: number
}

type DerivedFields = {
  first_met_at: number
  last_met_at: number
  meet_count: number
}

type AddEventToFriendHistoryInput = {
  event_id: string
  community_id: string
  event_at: number
  user_ids: string[]
}

type AddEventToFriendHistoryForAnchorInput = {
  event_id: string
  community_id: string
  event_at: number
  /** 新規確定したユーザー */
  anchor_user_id: string
  /** anchor とのペアを更新する相手一覧（anchor 自身は含めない） */
  counterpart_user_ids: string[]
}

type RemoveEventFromFriendHistoryInput = {
  event_id: string
  /** キャンセルしたユーザー（このユーザーと各相手のペアのみ履歴から除去する） */
  anchor_user_id: string
  /** anchor とのペアを更新する相手一覧 */
  counterpart_user_ids: string[]
}

const dedupeUserIds = dedupeUserIdsForFriends

const upsertHistoryEntry = (history: EventHistoryEntry[], entry: EventHistoryEntry): EventHistoryEntry[] => {
  if (history.some((item) => item.event_id === entry.event_id)) {
    return history
  }
  return [...history, entry]
}

const removeHistoryEntry = (history: EventHistoryEntry[], eventId: string): EventHistoryEntry[] => {
  return history.filter((item) => item.event_id !== eventId)
}

export const recomputeDerived = (eventHistory: EventHistoryEntry[]): DerivedFields | undefined => {
  if (eventHistory.length === 0) {
    return undefined
  }
  const sorted = [...eventHistory].sort((a, b) => a.event_at - b.event_at)
  return {
    first_met_at: sorted[0].event_at,
    last_met_at: sorted[sorted.length - 1].event_at,
    meet_count: new Set(eventHistory.map((item) => item.event_id)).size,
  }
}

const saveOrDeleteFriend = async (
  uid: string,
  friendUid: string,
  history: EventHistoryEntry[],
  createdAtMillis: number,
  transaction: Transaction,
) => {
  const derived = recomputeDerived(history)
  if (derived == null) {
    await deleteUserFriend(uid, friendUid, transaction)
    return false
  }

  await saveUserFriend(
    uid,
    new UserFriend(friendUid, {
      first_met_at: derived.first_met_at,
      last_met_at: derived.last_met_at,
      meet_count: derived.meet_count,
      event_history: history,
      created_at: createdAtMillis,
    }),
    transaction,
  )
  return true
}

const applyForPair = async (
  userA: string,
  userB: string,
  updater: (history: EventHistoryEntry[]) => EventHistoryEntry[],
): Promise<number> => {
  const db = getFirestore()
  return db.runTransaction(async (transaction) => {
    const friendAB = await getUserFriend(userA, userB, transaction)
    const friendBA = await getUserFriend(userB, userA, transaction)

    const nextAB = updater((friendAB?.event_history as EventHistoryEntry[] | undefined) ?? [])
    const nextBA = updater((friendBA?.event_history as EventHistoryEntry[] | undefined) ?? [])

    const savedAB = await saveOrDeleteFriend(userA, userB, nextAB, friendAB?.created_at ?? Date.now(), transaction)
    const savedBA = await saveOrDeleteFriend(userB, userA, nextBA, friendBA?.created_at ?? Date.now(), transaction)
    return (savedAB ? 1 : 0) + (savedBA ? 1 : 0)
  })
}

/**
 * イベント参加者全員の組み合わせで友人履歴を追加する（backfill 専用）。
 * 注文確定の通常経路では {@link addEventToFriendHistoryForAnchor} を使うこと。
 */
export const addEventToFriendHistory = async ({
  event_id,
  community_id,
  event_at,
  user_ids,
}: AddEventToFriendHistoryInput): Promise<number> => {
  const pairs = buildPairs(user_ids)
  const entry = { event_id, community_id, event_at }

  const updatedDocs = await runPairsWithConcurrency(pairs, (history) => upsertHistoryEntry(history, entry), {
    operation: 'addEventToFriendHistory',
    event_id,
  })

  // 友人関係のペアトランザクション完了後に、関係する全ユーザーの friend_count を再集計する。
  // ペアトランザクション内で再集計すると、双方向の更新を通じてトランザクションが膨らみ過ぎるため外側で行う。
  try {
    await recountUserProfileCountsForUsers(dedupeUserIds(user_ids))
  } catch (error) {
    logger.error('recountUserProfileCountsForUsers failed after addEventToFriendHistory', { error, event_id })
  }

  return updatedDocs
}

/**
 * 新規確定ユーザーと既存参加者のペアのみ友人履歴を追加する（注文確定経路）。
 */
export const addEventToFriendHistoryForAnchor = async ({
  event_id,
  community_id,
  event_at,
  anchor_user_id,
  counterpart_user_ids,
}: AddEventToFriendHistoryForAnchorInput): Promise<number> => {
  const pairs = buildPairsWithAnchor(anchor_user_id, counterpart_user_ids)
  const entry = { event_id, community_id, event_at }

  const updatedDocs = await runPairsWithConcurrency(pairs, (history) => upsertHistoryEntry(history, entry), {
    operation: 'addEventToFriendHistoryForAnchor',
    event_id,
  })

  try {
    await recountUserProfileCountsForUsers(dedupeUserIds([anchor_user_id, ...counterpart_user_ids]))
  } catch (error) {
    logger.error('recountUserProfileCountsForUsers failed after addEventToFriendHistoryForAnchor', {
      error,
      event_id,
    })
  }

  return updatedDocs
}

export const removeEventFromFriendHistory = async ({
  event_id,
  anchor_user_id,
  counterpart_user_ids,
}: RemoveEventFromFriendHistoryInput): Promise<number> => {
  const pairs = buildPairsWithAnchor(anchor_user_id, counterpart_user_ids)
  const updatedDocs = await runPairsWithConcurrency(pairs, (history) => removeHistoryEntry(history, event_id), {
    operation: 'removeEventFromFriendHistory',
    event_id,
  })
  // 友人関係のペアトランザクション完了後に、関係する全ユーザーの friend_count を再集計する。
  const usersToRecount = dedupeUserIds([anchor_user_id, ...counterpart_user_ids])
  try {
    await recountUserProfileCountsForUsers(usersToRecount)
  } catch (error) {
    logger.error('recountUserProfileCountsForUsers failed after removeEventFromFriendHistory', { error, event_id })
  }
  return updatedDocs
}

type EventCursor = {
  event_id: string
}

const encodeCursor = (cursor: EventCursor): string => Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64')

const decodeCursor = (token?: string): EventCursor | undefined => {
  if (token == null || token === '') {
    return undefined
  }
  try {
    const parsed = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as EventCursor
    return typeof parsed.event_id === 'string' ? parsed : undefined
  } catch {
    return undefined
  }
}

export const runBackfill = async (input: BackfillUserFriendsRequest): Promise<BackfillUserFriendsResponse> => {
  const db = getFirestore()
  const dryRun = input.dry_run ?? true
  const cursor = decodeCursor(input.resume_token)
  const scanFrom = input.event_id_from ?? cursor?.event_id

  let query: Query = db.collectionGroup('events').orderBy('event_id').limit(MAX_EVENTS_PER_RUN)
  if (input.community_id != null && input.community_id !== '') {
    query = query.where('community_id', '==', input.community_id)
  }
  if (scanFrom != null && scanFrom !== '') {
    query = query.startAfter(scanFrom)
  }

  const eventsSnapshot = await query.get()
  if (eventsSnapshot.empty) {
    return {
      dry_run: dryRun,
      scanned_events_count: 0,
      processed_pairs_count: 0,
      updated_docs_count: 0,
      resume_token: null,
    }
  }

  let scannedEventsCount = 0
  let processedPairsCount = 0
  let updatedDocsCount = 0
  let lastEventId: string | null = null

  for (const eventDoc of eventsSnapshot.docs) {
    const eventData = eventDoc.data()
    const eventId = String(eventData.event_id ?? '')
    if (eventId === '') continue
    if (input.event_id_to != null && input.event_id_to !== '' && eventId > input.event_id_to) {
      break
    }

    const communityId = String(eventData.community_id ?? '')
    if (communityId === '') continue

    const eventAtRaw = eventData.event_start_datetime
    const eventAt =
      eventAtRaw instanceof Timestamp
        ? eventAtRaw.toMillis()
        : typeof eventAtRaw?.toMillis === 'function'
          ? eventAtRaw.toMillis()
          : Date.now()

    const orderedOrders = await getOrders(communityId, eventId, 'ordered')
    const userIds = dedupeUserIds(orderedOrders.map((order) => order.user_id))
    const pairs = buildPairs(userIds)

    scannedEventsCount += 1
    processedPairsCount += pairs.length
    if (!dryRun && pairs.length > 0) {
      updatedDocsCount += await addEventToFriendHistory({
        event_id: eventId,
        community_id: communityId,
        event_at: eventAt,
        user_ids: userIds,
      })
    }
    lastEventId = eventId
  }

  const hasMore = eventsSnapshot.size >= MAX_EVENTS_PER_RUN && lastEventId != null
  const resumeToken = hasMore && lastEventId != null ? encodeCursor({ event_id: lastEventId }) : null

  logger.info('Backfill user friends completed', {
    dry_run: dryRun,
    scanned_events_count: scannedEventsCount,
    processed_pairs_count: processedPairsCount,
    updated_docs_count: updatedDocsCount,
    resume_token: resumeToken,
  })

  return {
    dry_run: dryRun,
    scanned_events_count: scannedEventsCount,
    processed_pairs_count: processedPairsCount,
    updated_docs_count: updatedDocsCount,
    resume_token: resumeToken,
  }
}
