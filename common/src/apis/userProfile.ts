/**
 * `getUserProfilePreview` Callable のリクエスト・レスポンス型。
 * 仕様書 5.2.1 / 03_参加者獲得/02_友人一覧_マイページ.md を参照。
 *
 * - フィールド名は DB の物理名（`snake_case`）と一致させる
 * - 各プレビューの件数 `limit(N)` はサーバ既定とし、Phase 1 ではクライアントから渡さない
 */
export type GetUserProfilePreviewRequest = {
  /** 表示対象のユーザー ID */
  target_user_id: string
}

/** Callable レスポンス内のプロフィール表示用フィールド */
export type UserProfilePublicProfile = {
  user_id: string
  user_name: string
  user_description: string
  user_image_url: string
  user_sns_facebook: string
  user_sns_facebook_name: string
  user_sns_twitter: string
  user_sns_instagram: string
  user_sns_website: string
  is_deleted: boolean
}

/** Callable レスポンス内のカウント（`users` の冗長カウントをそのまま返す） */
export type UserProfileCounts = {
  participated_event_count: number
  friend_count: number
  joined_community_count: number
  managed_community_count: number
  ordered_food_count: number
  /** 最終再集計時刻（未集計のときは null） */
  counts_updated_at: number | null
}

/**
 * イベントプレビュー 1 件分（§4.2.0）。
 * カバー画像は `community_id` / `event_id` からクライアントで `getEventCoverStoragePath` により解決する。
 */
export type UserProfileEventPreviewItem = {
  event_id: string
  community_id: string
  community_account: string
  event_name: string
  event_start_datetime: number
  event_end_datetime: number
  is_public: boolean
  /** 閲覧者のプロフィールに表示するか（返却時は常に true） */
  is_visible_to_viewer: boolean
  /** イベント詳細へリンクしてよいか */
  is_linkable: boolean
}

/** 友人プレビュー 1 件分。`getUserFriends` の `UserFriendListItem` と同形（meet_log は省略） */
export type UserProfileFriendPreviewItem = {
  user_id: string
  user_name: string
  user_image_url: string
  meet_count: number
  first_met_at: number
  last_met_at: number
}

/** コミュニティプレビュー 1 件分（§4.2.0） */
export type UserProfileCommunityPreviewItem = {
  community_id: string
  community_account: string
  community_name: string
  community_desc: string
  is_public: boolean
  is_visible_to_viewer: boolean
  /** コミュニティ詳細へリンクしてよいか */
  is_linkable: boolean
}

/**
 * フードプレビュー 1 件分（4.2.4 の最小キー）。
 * - クライアントが `getEventMenuImageStoragePath` を再現できるよう必要なフィールドを揃える
 * - `event_status_value === 'accepting_order'` のときは event のメニュー画像、
 *   それ以外は partner のメニュー画像を参照する
 */
export type UserProfileFoodPreviewItem = {
  order_id: string
  community_id: string
  event_id: string
  menu_id: string
  menu_name: string
  menu_price: number
  /** `ordered_at` または `updated_at`（時系列ソート用） */
  ordered_at: number
  event_status_value: string
  partner_id: string
  event_name: string
  community_account: string
  is_public: boolean
  /** 閲覧者のプロフィールに表示するか（返却時は常に true） */
  is_visible_to_viewer: boolean
  /** イベント詳細へリンクしてよいか */
  is_linkable: boolean
}

/** 注文履歴プレビュー 1 件分。本人のみ返す */
export type UserProfileOrderPreviewItem = {
  order_id: string
  community_id: string
  event_id: string
  event_name: string
  event_start_datetime: number
  ordered_at: number
}

export type GetUserProfilePreviewResponse = {
  user_profile: UserProfilePublicProfile
  counts: UserProfileCounts
  previews: {
    events: UserProfileEventPreviewItem[]
    friends: UserProfileFriendPreviewItem[]
    joined_communities: UserProfileCommunityPreviewItem[]
    managed_communities: UserProfileCommunityPreviewItem[]
    foods: UserProfileFoodPreviewItem[]
    /** 本人のみ。それ以外は null */
    orders: UserProfileOrderPreviewItem[] | null
  }
}

/**
 * フードタブ一覧のページング取得（プロフィールのプレビューとは別 Callable）。
 * - `target_user_id`: 一覧対象ユーザー
 * - `limit`: 1 ページ件数（未指定時はサーバ既定）
 * - `cursor`: 前回レスポンスの `next_cursor` を再投入
 */
export type GetUserFoodsRequest = {
  target_user_id: string
  limit?: number
  cursor?: string | null
}

export type GetUserFoodsResponse = {
  foods: UserProfileFoodPreviewItem[]
  next_cursor: string | null
  has_more: boolean
}

/**
 * `backfillUserProfileCounts` Callable のリクエスト・レスポンス型。
 * 仕様書 5.2.2 / 03_参加者獲得/02_友人一覧_マイページ.md を参照。
 */
export type BackfillUserProfileCountsRequest = {
  /** true のときは集計のみ実行し書き込みはしない（差分件数のみ返す） */
  dry_run?: boolean
  /**
   * スキャン再開位置の下限（`user_id` 昇順）。**当該 UID 自身は `startAfter` のため含まれない**（exclusive）。
   * 継続時は `resume_token` を渡し、通常は本フィールドは付けない（`user_id_from` が優先されトークン由来の位置が上書きされる）。
   */
  user_id_from?: string
  /** スキャン終了ユーザー ID（含む） */
  user_id_to?: string
  /** 前回応答の `resume_token` を再投入する場合に使用（`{ user_id }` の JSON を base64 したトークン） */
  resume_token?: string
}

export type BackfillUserProfileCountsResponse = {
  dry_run: boolean
  /** スキャン対象になったユーザー数 */
  scanned_users_count: number
  /** カウントが変わった（または初回登録された）ユーザー数 */
  updated_users_count: number
  /** カウントに変化がなかったユーザー数 */
  no_change_users_count: number
  /** 退会済みなどでスキップされたユーザー数 */
  skipped_users_count: number
  /** 続きがある場合の継続トークン。null のときは全スキャン完了 */
  resume_token: string | null
}
