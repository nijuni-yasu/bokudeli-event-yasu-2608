export type UserFriendsSortBy = 'meet_count' | 'last_met_at'

export type GetUserFriendsRequest = {
  /** 一覧の対象ユーザー（`users/{target_user_id}/friends` を読む） */
  target_user_id: string
  limit?: number
  sort_by?: UserFriendsSortBy
  cursor?: string | null
}

/**
 * 友人カードの「いっしょに参加した食事会」1 件分。
 * `event_name` / `community_account` は events ドキュメントから都度解決した値。
 * イベントが取得できない（削除済み等）場合は `event_name` / `community_account` が `null` になる。
 */
export type UserFriendMeetLogItem = {
  event_id: string
  community_id: string
  event_at: number
  event_name: string | null
  community_account: string | null
  is_public: boolean
  /** イベント詳細へリンクしてよいか（プロフィール所有者本人閲覧時のみ true） */
  is_linkable: boolean
}

/** 友人一覧・プロフィール友人プレビュー 1 件分。日付はサブコレの冗長フィールドをそのまま返す。 */
export type UserFriendListItem = {
  user_id: string
  user_name: string
  user_image_url: string
  meet_count: number
  first_met_at: number
  last_met_at: number
}

export type GetUserFriendMeetLogRequest = {
  /** プロフィール所有者（`users/{target_user_id}/friends` を読む） */
  target_user_id: string
  friend_user_id: string
}

export type GetUserFriendMeetLogResponse = {
  meet_log: UserFriendMeetLogItem[]
  meet_count: number
}

export type GetUserFriendsResponse = {
  friends: UserFriendListItem[]
  next_cursor: string | null
  has_more: boolean
}

export type BackfillUserFriendsRequest = {
  dry_run?: boolean
  community_id?: string
  event_id_from?: string
  event_id_to?: string
  resume_token?: string
}

export type BackfillUserFriendsResponse = {
  dry_run: boolean
  scanned_events_count: number
  processed_pairs_count: number
  updated_docs_count: number
  resume_token: string | null
}
