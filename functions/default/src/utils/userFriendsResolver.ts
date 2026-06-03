import type { UserFriendListItem, UserFriendMeetLogItem, UserFriendsSortBy } from '@shokujii/common/apis/userFriends.js'
import type { UserFriend } from '@shokujii/common/schemas/UserFriend.js'
import { listUserFriends, getUserFriend, type UserFriendsListCursor } from '../stores/userFriend.js'
import { getUser, getUsersByUserIds } from '../stores/user.js'
import { getCommunityEventKey, getEventsInCommunities, type ShokujiiEvent } from '../stores/event.js'
import { computeProfileItemLinkableToViewer, MAX_PROFILE_PREVIEW_SKIP_PAGES } from './profileItemVisibility.js'

type MeetLogHistoryEntry = { event_id: string; community_id: string; event_at: number }

type ResolveInput = {
  targetUserId: string
  sortBy: UserFriendsSortBy
  limit: number
  cursor?: UserFriendsListCursor
  viewerUid?: string | null
}

type ResolveOutput = {
  friends: UserFriendListItem[]
  hasMore: boolean
  nextCursor: UserFriendsListCursor | null
}

const normalizeHistory = (history: UserFriend['event_history']): MeetLogHistoryEntry[] =>
  history.map((entry) => ({
    event_id: entry.event_id,
    community_id: entry.community_id,
    event_at: Number(entry.event_at),
  }))

const toMeetLogItem = (
  entry: MeetLogHistoryEntry,
  event: ShokujiiEvent | undefined,
  viewerUid: string | null,
  targetUserId: string,
): UserFriendMeetLogItem => {
  if (event == null || event.is_deleted) {
    return {
      event_id: entry.event_id,
      community_id: entry.community_id,
      event_at: entry.event_at,
      event_name: null,
      community_account: null,
      is_public: false,
      is_linkable: false,
    }
  }
  const isPublic = event.is_public === true
  return {
    event_id: entry.event_id,
    community_id: entry.community_id,
    event_at: entry.event_at,
    event_name: event.event_name,
    community_account: event.community_account,
    is_public: isPublic,
    is_linkable: computeProfileItemLinkableToViewer({ isPublic, viewerUid, targetUserId }),
  }
}

const buildMeetLogItems = (
  history: MeetLogHistoryEntry[],
  eventMap: Map<string, ShokujiiEvent>,
  viewerUid: string | null,
  targetUserId: string,
  sortDesc: boolean,
): UserFriendMeetLogItem[] => {
  const sorted = [...history].sort((a, b) => (sortDesc ? b.event_at - a.event_at : a.event_at - b.event_at))
  const items: UserFriendMeetLogItem[] = []
  for (const entry of sorted) {
    const event = eventMap.get(getCommunityEventKey(entry.community_id, entry.event_id))
    items.push(toMeetLogItem(entry, event, viewerUid, targetUserId))
  }
  return items
}

const resolveUserFriendsListOnce = async (input: ResolveInput): Promise<ResolveOutput> => {
  const { targetUserId, sortBy, limit, cursor } = input

  const page = await listUserFriends(targetUserId, sortBy, limit, cursor)
  if (page.friends.length === 0) {
    return { friends: [], hasMore: page.hasMore, nextCursor: page.nextCursor }
  }

  const userMap = await getUsersByUserIds(page.friends.map((friend) => friend.id))

  const friends: UserFriendListItem[] = []
  for (const friend of page.friends) {
    const user = userMap.get(friend.id)
    if (user == null || user.is_deleted) {
      continue
    }
    friends.push({
      user_id: friend.id,
      user_name: user.user_name,
      user_image_url: user.user_image_url,
      meet_count: friend.meet_count,
      first_met_at: friend.first_met_at,
      last_met_at: friend.last_met_at,
    })
  }

  return {
    friends,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  }
}

/**
 * 友人一覧用の共通解決ロジック。
 * `getUserFriends` Callable と `getUserProfilePreview` の友人プレビューで使う。
 *
 * - 友人サブコレを `sortBy` 順に limit + 1 件読み出してページング判定
 * - 友人ユーザーを 1 回の getUsersByUserIds でまとめて解決し、退会ユーザーを除外
 * - 退会者だけのページは hasMore が続く限り読み飛ばす（RC-52）
 * - カード表示用の日付はサブコレの `first_met_at` / `last_met_at` をそのまま返す（events は読まない）
 * - 同席履歴の詳細は `resolveUserFriendMeetLog`（ダイアログ用）で取得
 */
export const resolveUserFriendsList = async (input: ResolveInput): Promise<ResolveOutput> => {
  const { limit } = input
  let cursor = input.cursor
  const collected: UserFriendListItem[] = []
  let firestoreHasMore = false
  let firestoreNextCursor: UserFriendsListCursor | null = null

  for (let pageIndex = 0; pageIndex < MAX_PROFILE_PREVIEW_SKIP_PAGES; pageIndex++) {
    const remaining = limit - collected.length
    if (remaining <= 0) {
      break
    }

    const page = await resolveUserFriendsListOnce({ ...input, limit: remaining, cursor })
    collected.push(...page.friends)
    firestoreHasMore = page.hasMore
    firestoreNextCursor = page.nextCursor

    if (collected.length >= limit) {
      break
    }
    if (!page.hasMore || page.nextCursor == null) {
      break
    }
    cursor = page.nextCursor
  }

  return {
    friends: collected,
    hasMore: firestoreHasMore && firestoreNextCursor != null,
    nextCursor: firestoreHasMore ? firestoreNextCursor : null,
  }
}

/**
 * 1 友人分の同席イベント履歴を全件返す（ダイアログ用）。
 */
export const resolveUserFriendMeetLog = async (params: {
  targetUserId: string
  friendUserId: string
  viewerUid: string | null
}): Promise<{ meet_log: UserFriendMeetLogItem[]; meet_count: number } | null> => {
  const { targetUserId, friendUserId, viewerUid } = params
  const friend = await getUserFriend(targetUserId, friendUserId)
  if (friend == null) {
    return null
  }

  const friendUser = await getUser(friendUserId, false)
  if (friendUser == null || friendUser.is_deleted) {
    return null
  }

  const history = normalizeHistory(friend.event_history)
  if (history.length === 0) {
    return { meet_log: [], meet_count: friend.meet_count }
  }

  const eventRefs = history.map((entry) => ({ community_id: entry.community_id, event_id: entry.event_id }))
  const eventMap = await getEventsInCommunities(eventRefs)
  const meetLog = buildMeetLogItems(history, eventMap, viewerUid, targetUserId, true)

  return { meet_log: meetLog, meet_count: friend.meet_count }
}
