/**
 * partner / PF 互換 parse テスト（PA-11e / C-5）専用のダミーデータ。
 *
 * - Firestore に保存するデータではない（本番・バッチ・seed では使わない）
 * - アプリ（user / partner / enterprise）から import しない
 * - `partnerCompat.test.ts` が `Event` / `Community` 等のコンストラクタに渡す
 *   「Firestore から読んだ plain object」の最小サンプル
 *
 * PF 形（base 形）と Enterprise 拡張形（enterprise_subsidy 等）の 2 系統を定義し、
 * 同一 Firestore 上で混在する doc を partner が parse できることを検証する。
 */

const eventStart = Date.now() + 14 * 24 * 60 * 60 * 1000

// --- Event（PF 形 / Enterprise 福利厚生形）---

/** PF イベント相当。`enterprise_id: null`（T1 materialize 後の形） */
export const minimalPfEventFields = {
  community_id: 'community-1',
  community_name: 'Test Community',
  community_account: 'test-account',
  created_by: 'user-1',
  event_postalcode: '1000005',
  event_address_base: '東京都千代田区丸の内',
  event_start_datetime: eventStart,
  event_end_datetime: eventStart + 60 * 60 * 1000,
  event_deadline_datetime: eventStart - 24 * 60 * 60 * 1000,
  partner_id: 'partner-1',
  shop_id: 'shop-1',
  shop_name: 'Test Shop',
  event_name: 'Test Event',
  event_payment: 'user_advance' as const,
  event_max_people: 25,
  organizer_fullname: '主催者 太郎',
  organizer_company: 'テスト株式会社',
  organizer_email: 'organizer@example.com',
  organizer_phone_personal: '090-1234-5678',
  organizer_memo: '受取場所: 1F ロビー',
  is_public: true,
  is_deleted: false,
  members: [] as string[],
  created_at: Date.now(),
  enterprise_id: null,
}

/** Enterprise イベント相当。partner が読んでも parse だけ成功すればよい拡張フィールド一式 */
export const enterpriseSubsidyEventFields = {
  ...minimalPfEventFields,
  event_payment: 'enterprise_subsidy' as const,
  enterprise_id: 'ent-a',
  enterprise_subsidy_settings: {
    type: 'fixed' as const,
    value: 500,
    monthly_limit_per_user: 7500,
  },
}

// --- Community ---

/** PF コミュニティ相当 */
export const minimalPfCommunityFields = {
  community_name: 'PF Community',
}

/** Enterprise コミュニティ相当 */
export const enterpriseCommunityFields = {
  community_name: 'Enterprise Community',
  enterprise_id: 'ent-a',
}

// --- EventMemberOrder（PF / Enterprise 補助額付き）---

/** PF 注文相当 */
export const minimalMemberOrderFields = {
  order_id: 'order-pf',
  user_id: 'user-1',
  event_id: 'event-1',
  community_id: 'community-1',
  menu_id: 'menu-1',
  menu_name: 'Test Menu',
  menu_price: 1000,
  status: 'ordered' as const,
}

/** Enterprise 注文相当（`pay_enterprise_subsidy_amount` 含む） */
export const enterpriseMemberOrderFields = {
  ...minimalMemberOrderFields,
  order_id: 'order-ent',
  enterprise_id: 'ent-a',
  pay_enterprise_subsidy_amount: 500,
}

// --- User（PF / Enterprise 所属）---

/** PF ユーザー相当 */
export const pfUserFields = {
  user_name: 'PF User',
  created_at: Date.now(),
}

/** Enterprise ユーザー相当 */
export const enterpriseUserFields = {
  ...pfUserFields,
  user_type: 'enterprise' as const,
  enterprise_id: 'ent-a',
}

// --- EventMember ---

export const minimalEventMemberFields = {
  user_id: 'user-1',
  event_id: 'event-1',
  community_id: 'community-1',
}

/** Enterprise メンバー相当 */
export const enterpriseEventMemberFields = {
  ...minimalEventMemberFields,
  enterprise_id: 'ent-a',
}
