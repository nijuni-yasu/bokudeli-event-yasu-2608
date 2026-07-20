# ブランチ dev/enterprise-mvp-v2 レビュー記録

### RC 一覧（サマリ）

> RC-1〜RC-21 は各評価セッション内のサマリ表を参照。本表は 2026-07-20 16:56 セッション以降の通し表。

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-22 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | S | currentUser subscribeOrders の不要 async IIFE と reportClientError 欠落 |
| [x] | RC-23 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | event store の where(enterprise_id, undefined) 実行時エラー防御 |
| [x] | RC-24 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventDraft が enterprises を withConverter なし直読み |
| [x] | RC-25 | なし | 👌 修正不要 | — | — | — | ➖ 該当なし | — | EnterpriseMember user_email / tenant_id 必須化の backfill 言及なし<br>新規コレクションのため既存データなし |
| [x] | RC-26 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | EventMemberOrder / EventStripe の enterprise_id が空文字を許容 |
| [x] | RC-27 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | isEnterpriseEvent 型ガードが enterprise_subsidy_settings 未検証 |
| [x] | RC-28 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | auditLogCursor decode の as キャスト 4 箇所 |
| [x] | RC-29 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 01_MVP全体計画の進捗サマリ表が実タスク数と不一致 |
| [x] | RC-30 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 04_詳細_割引・決済の 30_リファクタ計画リンク切れ |
| [x] | RC-31 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 07_デプロイ・運用の相対リンク切れ 28 箇所 |
| [x] | RC-32 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | 割引種別切替時の初期値 50 がマジックナンバー |
| [x] | RC-33 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | claims.enterprise_id の as キャストと reportClientError 欠落 |
| [x] | RC-34 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | refreshAdminMenu の unhandled rejection 防止 |
| [x] | RC-35 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | audit-logs onMounted に try/catch なし・初回ロード不能 |
| [x] | RC-36 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | invoices.vue とフォルダ共存で [yearMonth] が描画不能 |
| [x] | RC-37 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | route.params / query の as キャスト |
| [x] | RC-38 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | audit_logs cursor クエリの __name__ ASC インデックス欠落 |
| [x] | RC-39 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | member_orders foods クエリの 5 フィールドインデックス欠落 |
| [x] | RC-40 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | events / member_orders の等価重複インデックス削除 |
| [x] | RC-41 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 請求スナップショット cron が失敗を握りつぶしリトライ不能 |
| [x] | RC-42 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | dashboardData の details.order_ids as string[] キャスト |
| [x] | RC-43 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | createEnterpriseMembers の authForEnterprise N+1 |
| [x] | RC-44 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | createEnterprise ロールバックが member / user doc を残す |
| [x] | RC-45 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | listAuditLogsGuest の hasNext / nextCursor がページ取り漏らし |
| [x] | RC-46 | なし | 👌 修正不要 | — | 📌 スコープ内 | 📑 仕様書 | 📋 仕様追加 | M | meet_count は denormalized 値のまま表示と仕様確定（EP-27） |
| [x] | RC-47 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | invoices/index onMounted に try/catch なし・初回ロード不能 |
| [x] | RC-48 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventDraft の catch が reportClientError 未呼び出し |

## 評価セッション（2026-07-19 18:05・shokujii-code-review）

- **評価日時**: 2026-07-19 18:05 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: 未作成
- **指摘なし**（チェックリスト照合のみ。stripes 0047 本リポ差分）

**確認要点（👌）**:

- `EventStripe`: `enterprise_id` nullable + `convertToDb` で `?? null` materialize（`EventMemberOrder` 同型）
- `EventStripe.test.ts`: 未設定/null/string の 3 ケース
- `stripeWebhook`: PF 決済で `enterprise_id: enterpriseId ?? null` 明示保存
- doc: 02 §2.3.1 に 0047 節、01 F-1 メモに 0046/0047 整理
- batch 0047 実装は `bokudeli-event-batch` 別リポ（本 diff 外）

---

## 評価セッション（2026-07-19 15:40・shokujii-code-review）

- **評価日時**: 2026-07-19 15:40 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | 02 §1 共有カート行が旧 `cart.vue` options 空の記述のまま<br>F-1 実装（main.ts default options）に合わせて更新 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/00_計画/02_developmentマージ.md:24`

**該当コード（レビュー時点の diff）**:

```diff
-| 共有カート | `base/src/components/pages/cart.vue` は token の `enterprise_id` を `buildEventStoreOptions` 経由で `useEventStore` に渡し、PF ユーザー（claims なし）は options 空のまま既存 PF 動線を維持 |
+| 共有カート | `user` / `enterprise` は `main.ts` で `setDefaultEventStoreOptions(buildEventStoreOptions(...))` を注入。`cart.vue` は token から `buildEventStoreOptions` を解決。partner は default `{}`（CG 無フィルタ） |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄 ドキュメントのみ/S]: §1 共有カート行が F-1 実装前の「PF は options 空」記述のまま。`user/main.ts` の default options 注入と矛盾する → 現行実装に合わせて更新する。

**コメント要約**:

02_developmentマージ §1 の共有カート説明が旧仕様のまま残っていた。
F-1 で `setDefaultEventStoreOptions` を導入したため、ドキュメントを現行動線に同期した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 実装と計画書の乖離はデプロイ手順の誤解を招く。文言更新のみで一意。

---

## 評価セッション（2026-07-19 15:38・shokujii-code-review）

- **評価日時**: 2026-07-19 15:38 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: 未作成
- **指摘なし**（チェックリスト照合のみ。F-1/F-2 実装差分）

**確認要点（👌）**:

- F-1: `EventMemberOrder` nullable materialize、`buildEventStoreOptions` 三値、partner 無フィルタ分離、CG index 追加
- F-2: `authGuards.ts` 公開ルート除外型、`/pass-code` 含む
- デプロイゲート: batch **`0046`**（member_orders backfill）task 追加済み・**実行は CG 本番切替前**（[`bokudeli-event-batch` docs/0046](https://github.com/nijuniinc/bokudeli-event-batch/blob/main/docs/0046_member_orders_enterprise_id_backfill.md)）

---

## 評価セッション（2026-07-19 18:45・review-comments-evaluate）

- **評価日時**: 2026-07-19 18:45 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **REVIEW_REQUEST_SINCE**: 2026-07-19T09:32:07Z
- **partial**: true（Codex limits / connect のみ）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼 5015214142、Codex limits 5015214668、Codex connect 5015235106、Copilot overview のみ 5015234853 冒頭）
- **手順 4a 自動修正**: RC-3 / RC-4 / RC-10（🚨 2件 / 🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-3 | 3610307757 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | deleteUserDocuments の allSettled 失敗を reject |
| [x] | RC-4 | 3610307766 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | enterpriseBillInvoicePdf の currentUser 明示チェック |
| [x] | RC-10 | 5015234853 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | useSessionTimeout の unhandled rejection 防止 |
| [x] | RC-2 | 3610307742 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | userOrderHistoryList storeId の JSON.stringify |
| [x] | RC-5 | 3610307771 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | M | admin ダッシュボード loadDashboard 競合ガード |
| [x] | RC-6 | 3610307781 | 🟡 修正提案 | 📤 #2198 別Issue化 | 📤 スコープ外 | 📑 仕様書 | 📋 仕様追加 | M | PF プロフィール null フィルタと backfill ゲート<br>https://github.com/nijuniinc/bokudeli-event-new/issues/2198 |
| [x] | RC-7 | 3610307784 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | materio NavLink onClick 追加の規約違反 |
| [x] | RC-8 | 5015234853 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | VerticalNavLink materio 直修正 |
| [x] | RC-9 | 5015234853 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | M | HorizontalNavLink materio 直修正 |
| [x] | RC-11 | 5015234853 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | invoices console.error → reportClientError |

---

## 評価セッション（2026-07-19 18:54・shokujii-code-review）

- **評価日時**: 2026-07-19 18:54 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **対象**: RC-3 / RC-4 / RC-10 自動修正の未コミット差分（review スコープ更新分）

**指摘なし**（チェックリスト照合 + Copilot 自動修正の実装確認）

**確認要点（👌）**:

- RC-3 `deleteUserDocuments`: `Promise.allSettled` の `rejected` を検出し先頭 `reason` を throw。`rollbackCreatedEnterpriseMember` 経由で失敗が握りつぶされなくなる
- RC-4 `getEnterpriseBillInvoicePdf`: `currentUser!` を廃止し `user == null` で `Not authenticated` を throw。呼び出し側で catch 可能
- RC-10 `useSessionTimeout`: `runCheckTimeout` で `void checkTimeout().catch(...)` により interval / visibilitychange からの unhandled rejection を防止
- evaluate セッション追記（review doc）のみの変更は記録用でコード影響なし

---

## 評価セッション（2026-07-19 18:58・shokujii-code-review）

- **評価日時**: 2026-07-19 18:58 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **指摘なし**（RC-2/5/7-9/11 実装 + RC-3/4/10 含む全差分のチェックリスト照合）

**確認要点（👌）**:

- RC-2: `profileListFilter` 型で storeId キー安定化、`user` / `enterprise` ProfilePage から `profileFilter` 指定
- RC-5: `admin/index.vue` に `loadSeq` ガード（`invoices.vue` 同型）
- RC-6: Issue #2198 起票、review doc を別 Issue 化
- RC-7〜9: materio 3 ファイルを `origin/development` へ revert
- RC-11: `invoices/[yearMonth].vue` で `reportClientError` 使用

---

## 評価セッション（2026-07-19 22:16・shokujii-code-review）

- **評価日時**: 2026-07-19 22:16 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **指摘なし**（D-5 認可レイヤ実装差分のチェックリスト照合）

**確認要点（👌）**:

- `assertEnterpriseProfileAccess` が仕様 §5.2.1 の 6 パターンを HttpsError で返却
- PF 版は `isEnterpriseViewer` 分岐で既存ロジック維持、エンプラのみ store / resolver フィルタ
- `UserProfilePage` が Callable 成功前に bio を表示しない RC-44 ゲート
- Vitest（enterpriseProfileAccess / enterpriseFriendVisibility / userFriendsResolver / recountUserProfileCounts）追加済み

---

## 評価セッション（2026-07-19 22:26・shokujii-code-review）

- **評価日時**: 2026-07-19 22:26 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **手順 3a/3b 自動修正**: RC-12 / RC-13

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | assertEnterpriseProfileAccess のテナント不一致判定が member 取得より後で EP-4 違反 |
| [x] | RC-13 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | profileDisplayUser が Firestore user にフォールバックし RC-44 を弱める |

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseProfileAccess.ts:51`

**該当コード（レビュー時点の diff）**:

```diff
+  const targetMember = await getEnterpriseMember(viewerEnterpriseId, targetUserId)
+  if (targetMember == null || !targetMember.is_active) {
+    throw new HttpsError('not-found', '存在しないユーザーです')
+  }
+
+  if (viewerEnterpriseId !== targetEnterpriseId) {
+    throw new HttpsError('permission-denied', '閲覧権限がありません')
+  }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `getEnterpriseMember` が null の他社 uid に `not-found` を返し、仕様 §5.2.1 手順 5（EP-4）の `permission-denied` にならない → テナント不一致を member 取得前に判定する

**判断理由**: EP-4 は他社閲覧を `permission-denied` と明記。member 不在を先に `not-found` にすると UI が「存在しないユーザー」になり誤表示。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/profile/UserProfilePage.vue:113`

**該当コード（レビュー時点の diff）**:

```diff
+const profileDisplayUser = computed(() => {
+  const profile = previewData.value?.user_profile
+  if (profile != null) {
+    return new User(profile.user_id, profile)
+  }
+  return user.value
+})
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `profileDisplayUser` が Callable 失敗前の Firestore `user` にフォールバックし、RC-44 の情報漏洩防御が弱くなる → Callable の `user_profile` のみを正本にし、未使用の `useUserStore` を削除

**判断理由**: ゲート通過後も computed 経由で Firestore 読み取り結果が表示に使える経路が残る。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**未着手の 🟡（本セッション）**:

- Callable 結合テスト（`getUserProfilePreview` / `getUserFriends` の enterprise 分岐）が計画 §8 にあるが未追加
- `previewError` 時の UI 分岐がなく、ネットワークエラー等で空白画面になりうる
- `classifyEnterpriseFriend` の友人ループ内 `getEnterpriseMember` が N+1（大量友人時のレイテンシ）

---

## 評価セッション（2026-07-20 13:05・review-comments-evaluate）

- **評価日時**: 2026-07-20 13:05 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **REVIEW_REQUEST_SINCE**: 2026-07-19T13:32:10Z（手動 evaluate・当該時刻以降の新規コメント）
- **partial**: true（Codex limits / connect のみ。新規 substantive インラインなし）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 5（レビュー依頼 5015908916、Codex limits 5015906178 / 5015909346、Codex connect 5015941083、5015940812 内 user ProfilePage null フィルタ指摘は RC-6 と重複）
- **手順 4a 自動修正**: RC-14 / RC-16 / RC-17（🚨 2件 / 🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-14 | 5015940812 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | enterpriseMemberMonthlyUsage が getDoc 直呼び出し<br>base store 経由 + withConverter に修正済み |
| [ ] | RC-15 | 5015940812 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 💾 データ | 📐 リファクタ | M | dashboard store の CG 全件スキャン<br>期間フィルタ移行は別 PR / Issue 推奨 |
| [x] | RC-16 | 3610651349 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | invoice_files create 失敗 code 6 がマジックナンバー<br>`FIRESTORE_ALREADY_EXISTS_CODE` 定数化 |
| [x] | RC-17 | 3610651329 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | enterpriseMail の空文字 enterprise_id を true 扱い<br>`!== ''` 条件を追加 |

---

**識別子**: RC-14（GitHub id: 5015940812・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsage.ts:38`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし・トップレベル #5015940812 より）

```diff
+    const [memberSnap, enterpriseSnap] = await Promise.all([
+      getDoc(doc(db, 'enterprises', enterpriseId, 'members', userId)),
+      getDoc(doc(db, 'enterprises', enterpriseId)),
+    ])
```

**レビュワーのコメント（原文）**:

**`enterprise/src/composable/enterpriseMemberMonthlyUsage.ts`** [must]

`getDoc(doc(db, 'enterprises', ...))` を withConverter なしで直接呼んでおり、shokujii-firestore の「DB 操作は必ず store 経由、xxxRef は必ず withConverter 付き」ルールに違反しています。隣の `useEnterpriseAdmin.ts` が `getEnterpriseById()`（base store）を使うのと不整合です。

**コメント要約**:

月次 usage composable が Firestore を withConverter なしで直接読んでいた。
base store に `getEnterpriseMemberById` を追加し、`getEnterpriseById` と併用する形に揃えた。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: AGENTS.md / shokujii-firestore の store 経由・withConverter 必須に反する。Zod バリデーションをバイパスしうる。base に member ref を追加して composable を store 経由に変更するのが一意。

---

**識別子**: RC-15（GitHub id: 5015940812・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/dashboard.ts:38`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし・トップレベル #5015940812 より）

**レビュワーのコメント（原文）**:

- **`functions/default/src/stores/dashboard.ts`**: `listOrderedMemberOrdersByEnterprise` / `listStripesByEnterprise` / `listOrderCreateAuditLogs` が期間フィルタなしの collectionGroup 全件スキャンです。データが増えると読み取りコストが線形増加するため、既存インデックス（`enterprise_id` + `updated_at`）を使った `updated_at` 範囲フィルタへの移行を将来的に推奨します。

**コメント要約**:

ダッシュボード集計 store が期間条件なし CG 全件取得のため、データ増加時に読み取りコストが線形増加する。
`updated_at` 範囲フィルタへの移行は本 PR（D-5 認可）のスコープ外。別 PR / Issue で対応推奨。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📤 スコープ外

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 指摘は妥当だがパフォーマンス改善であり、本 PR の D-5 認可レイヤとは独立。インデックス・集計仕様の確認が必要なため別 Issue 化が自然。

---

**識別子**: RC-16（GitHub id: 3610651349）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/enterpriseInvoiceFile.ts:45`

**該当コード（レビュー時点の diff）**:

```diff
+    const code = (error as { code?: number }).code
+    if (code === 6) {
+      return 'already_exists'
+    }
```

**レビュワーのコメント（原文）**:

[nits] Firestore の `ref.create()` 失敗時の `code === 6` は意図（ALREADY_EXISTS）が読み取りづらいので、マジックナンバーにならないようコメントか定数化をお願いします。

**コメント要約**:

請求書メタ create の ALREADY_EXISTS 判定が gRPC code `6` のマジックナンバーだった。
`FIRESTORE_ALREADY_EXISTS_CODE` 定数とコメントで意図を明示した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 可読性改善。定数化で一意に解消可能。

---

**識別子**: RC-17（GitHub id: 3610651329）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseMail.ts:9`

**該当コード（レビュー時点の diff）**:

```diff
+export function isEnterpriseUser(user: { enterprise_id?: string | null }): boolean {
+  return user.enterprise_id != null
+}
```

**レビュワーのコメント（原文）**:

[must] `enterprise_id` が空文字（""）のケースでも true になってしまい、PF 扱いしたいデータまでエンプラ判定される可能性があります（他箇所では `enterprise_id != null && enterprise_id !== ''` としているため整合しません）。空文字は未設定として扱う条件に揃えてください。

**コメント要約**:

D-1 メール制御の `isEnterpriseEvent` / `isEnterpriseUser` が空文字 `""` をエンプラ扱いしていた。
`eventDraft.ts` 等と同様 `!== ''` を追加し PF メール skip 誤判定を防止。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 空文字 enterprise_id は materialize 過渡期に存在しうる。エンプラ判定が true だと PF 向けメールが skip され実害になりうる。

---

## 評価セッション（2026-07-20 13:05・shokujii-code-review）

- **評価日時**: 2026-07-20 13:05 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **対象**: RC-14〜17 自動修正差分（evaluate 手順 4a）+ `enterpriseMail.test.ts` 追補
- **手順 3b 自動修正**: RC-18

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | RC-17 の空文字判定に空文字 false テストが未追加<br>両関数に it を追加済み |

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseMail.test.ts:17`

**該当コード（レビュー時点の diff）**:

```diff
   it('enterprise_id が undefined なら false', () => {
     expect(isEnterpriseEvent({})).toBe(false)
     expect(isEnterpriseEvent({ enterprise_id: undefined })).toBe(false)
   })
 })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-17 で `isEnterpriseEvent` / `isEnterpriseUser` に空文字除外を追加したが、回帰防止の vitest が null/undefined のみで `''` ケースが無い → 空文字 false の it を両 describe に追加する。

**コメント要約**:

RC-17 修正の回帰テストとして空文字 `''` が false になる it を追加した。
`enterpriseMail.test.ts` 8 件すべて pass。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: テスト方針上、バグ修正に対応する境界値テストは S 工数で追加が妥当。修正方針は一意。

**確認要点（👌）**:

- `base/src/stores/enterprise.ts`: `enterpriseMemberConverter` + `getEnterpriseMemberById` が withConverter 付き ref 経由
- `enterpriseMemberMonthlyUsage.ts`: Firestore 直呼び出し削除、`getEnterpriseById` / `getEnterpriseMemberById` 利用
- `enterpriseInvoiceFile.ts`: `FIRESTORE_ALREADY_EXISTS_CODE` 定数化
- `enterpriseMail.ts`: `!== ''` が `eventDraft.ts` と整合

---

## 評価セッション（2026-07-20 15:32・review-comments-evaluate auto）

- **評価日時**: 2026-07-20 15:32 JST
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **REVIEW_REQUEST_SINCE**: 2026-07-20T06:17:11Z
- **partial**: true（Codex usage limits / connect のみ。Copilot 実質レビューあり）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼 5019377264 内 @ 行、Codex limits 5015906178、Codex connect 5015941083）
- **手順 4a 自動修正**: RC-19 / RC-20

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-19 | 5019377264 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | admin ダッシュボードが不正期間・load 失敗後も旧行を表示<br>periodError / catch で rows をクリア |
| [x] | RC-20 | 5019377264 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | enterpriseProfileCallables に成功系 3 ケース追加<br>getUserFriends / getUserFriendMeetLog / getUserFoods |
| [x] | RC-21 | 5019377264 | 👌 修正不要 | — | 📤 スコープ外 | 📑 仕様書 | 📋 仕様追加 | M | user ProfilePage の null フィルタ指摘は RC-6 と重複<br>別 Issue #2198 で追跡済み |

---

**識別子**: RC-19（GitHub id: 5019377264・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `enterprise/src/pages/admin/index.vue:25`

**該当コード（レビュー時点の diff）**:

```diff
   if (enterpriseId.value == null) return
-  if (periodError.value != null) return
+  if (periodError.value != null) {
+    monthlyRows.value = []
+    memberRows.value = []
+    return
+  }
```

**レビュワーのコメント（原文）**:

[must] `periodError.value != null` の早期 return と `catch` ブロックは `monthlyRows` / `memberRows` をクリアしないため、無効期間を選んだあとも直前の期間の行が表示されたままになります（既存スレッドで指摘済み）。エラー・不正期間時に行を空配列に戻してください。

**コメント要約**:

無効期間選択時および load 失敗時に `monthlyRows` / `memberRows` を空配列にクリアし、古い集計行が残らないようにした。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 表示と期間バリデーションが不整合だと誤った数値を見せる UX バグ。修正方針は Copilot 提示どおりで一意。

---

**識別子**: RC-20（GitHub id: 5019377264・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/enterpriseProfileCallables.test.ts:228`

**該当コード（レビュー時点の diff）**:

```diff
+    it('同社 active メンバーは友人一覧を返す', async () => { ... })
+    it('同社 active メンバーは meet log を返す', async () => { ... })
+    it('同社 active メンバーはフード一覧を返す', async () => { ... })
```

**レビュワーのコメント（原文）**:

[nits] `getUserFriends` / `getUserFriendMeetLog` / `getUserFoods` の 3 Callable に成功ケースのテストがなく、認可が通った後の返却値（`department` の有無、`omitSns` の動作等）が検証されていません。`getUserProfilePreview` と同様に、同社 active メンバーで正常応答になることを 1 ケース追加すると、store や resolver の mock が正しく機能していることを保証できます。

**コメント要約**:

3 Callable それぞれに同社 active メンバー成功系 1 ケースを追加。resolver / store mock 呼び出しと返却値を検証。計 21 テスト pass。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: テスト網羅の改善。getUserProfilePreview と対称で追加方針が一意。

---

**識別子**: RC-21（GitHub id: 5019377264・Copilot トップレベル内指摘）

**レビュワー**: Copilot

**指摘箇所**: `user/src/components/profile/UserProfilePage.vue:311`

**該当コード（レビュー時点の diff）**:

該当なし（本セッション diff 外。前サイクルからの継続指摘）

**レビュワーのコメント（原文）**:

[imo] `where('enterprise_id', '==', null)` は `enterprise_id` フィールドが存在しない既存コミュニティドキュメントをヒットしません（前サイクルから継続）。backfill 完了前にデプロイすると PF ユーザーのコミュニティ一覧が空になります。`bokudeli-event-batch` 側の backfill 完了を確認してからデプロイするか、UI 側フィルタに切り替えることを推奨します。

**コメント要約**:

RC-6 で別 Issue #2198 化済み。本 PR スコープ外として対応不要。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📤 スコープ外

**ラベル**: 📑 仕様書

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: RC-6 / #2198 と同一論点。重複 RC として新規実装は行わない。

---

## 評価セッション（2026-07-20 16:56・shokujii-code-review）

- **評価日時**: 2026-07-20 16:56 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **対象**: `origin/development...HEAD` ブランチ全体（ユーザー明示依頼）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **手順 3a/3b 自動修正**: RC-22〜24 / RC-26〜45（🚨 10件 / 🟡 14件）。RC-46 は仕様確定（👌 修正不要・EP-27 追記）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-22 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📐 リファクタ | S | currentUser subscribeOrders の不要 async IIFE と reportClientError 欠落 |
| [x] | RC-23 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | event store の where(enterprise_id, undefined) 実行時エラー防御 |
| [x] | RC-24 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventDraft が enterprises を withConverter なし直読み |
| [x] | RC-25 | なし | 👌 修正不要 | — | — | — | ➖ 該当なし | — | EnterpriseMember user_email / tenant_id 必須化の backfill 言及なし |
| [x] | RC-26 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | EventMemberOrder / EventStripe の enterprise_id が空文字を許容 |
| [x] | RC-27 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | isEnterpriseEvent 型ガードが enterprise_subsidy_settings 未検証 |
| [x] | RC-28 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | auditLogCursor decode の as キャスト 4 箇所 |
| [x] | RC-29 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 01_MVP全体計画の進捗サマリ表が実タスク数と不一致 |
| [x] | RC-30 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 04_詳細_割引・決済の 30_リファクタ計画リンク切れ |
| [x] | RC-31 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 07_デプロイ・運用の相対リンク切れ 28 箇所 |
| [x] | RC-32 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | 割引種別切替時の初期値 50 がマジックナンバー |
| [x] | RC-33 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | claims.enterprise_id の as キャストと reportClientError 欠落 |
| [x] | RC-34 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | refreshAdminMenu の unhandled rejection 防止 |
| [x] | RC-35 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | audit-logs onMounted に try/catch なし・初回ロード不能 |
| [x] | RC-36 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | invoices.vue とフォルダ共存で [yearMonth] が描画不能 |
| [x] | RC-37 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | route.params / query の as キャスト |
| [x] | RC-38 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | audit_logs cursor クエリの __name__ ASC インデックス欠落 |
| [x] | RC-39 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | member_orders foods クエリの 5 フィールドインデックス欠落 |
| [x] | RC-40 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | events / member_orders の等価重複インデックス削除 |
| [x] | RC-41 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 請求スナップショット cron が失敗を握りつぶしリトライ不能 |
| [x] | RC-42 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | dashboardData の details.order_ids as string[] キャスト |
| [x] | RC-43 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | createEnterpriseMembers の authForEnterprise N+1 |
| [x] | RC-44 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | M | createEnterprise ロールバックが member / user doc を残す |
| [x] | RC-45 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | M | listAuditLogsGuest の hasNext / nextCursor がページ取り漏らし |
| [x] | RC-46 | なし | 👌 修正不要 | — | 📌 スコープ内 | 📑 仕様書 | 📋 仕様追加 | M | meet_count は denormalized 値のまま表示と仕様確定（EP-27） |
| [x] | RC-47 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | invoices/index onMounted に try/catch なし・初回ロード不能 |
| [x] | RC-48 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventDraft の catch が reportClientError 未呼び出し |

---

**識別子**: RC-22（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/currentUser.ts:104`

**該当コード（レビュー時点の diff）**:

```diff
+    subscribeOrdersStarted = true
+    void (async () => {
+      try {
+        // ... 本体に await なし（onSnapshot 登録は同期）
+      } catch (err) {
+        console.error(err)
+        subscribeOrdersStarted = false
+      }
+    })()
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `subscribeOrders` の async IIFE は本体に await がなく（`onSnapshot` 登録は同期）、`subscribeOrdersStarted` フラグも不要。内側 onSnapshot コールバックの catch が `console.error` のみで `reportClientError` を呼んでいない → `event.ts` の `subscribeOrders` と同型の同期実装に簡素化し、catch に `reportClientError` を追加する。

**コメント要約**:

async IIFE と `subscribeOrdersStarted` フラグを削除して同期実装に簡素化。catch に `reportClientError(err, { severity: 'warn' })` を追加した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: チェックリスト「握りつぶすと調査不能になる catch 節で reportClientError」違反 + 不要な複雑さ。既存 `event.ts` と同型化で方針一意。

---

**識別子**: RC-23（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/event.ts:422` `base/src/stores/event.ts:559`

**該当コード（レビュー時点の diff）**:

```diff
+        if ('ordersEnterpriseId' in mergedOptions) {
+          orderConstraints.push(where('enterprise_id', '==', mergedOptions.ordersEnterpriseId))
+        }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `'ordersEnterpriseId' in mergedOptions` はキーが存在して値が `undefined` の場合も true になり、`where('enterprise_id', '==', undefined)` は Firestore SDK の実行時エラーになる → `?? null` で正規化する。

**コメント要約**:

`where()` に渡す値を `?? null` で正規化し、明示的に `undefined` を渡された場合の実行時エラーを防止（orders / events 両方）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型上 `ordersEnterpriseId?: string | null` のため `undefined` 明示渡しが可能。防御は 1 行で一意。

---

**識別子**: RC-24（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/eventDraft.ts:31`

**該当コード（レビュー時点の diff）**:

```diff
+    const enterpriseRef = doc(db, 'enterprises', enterpriseId)
+    const enterpriseSnap = await getDoc(enterpriseRef)
+    ...
+    const enterprise = new Enterprise(enterpriseId, raw)
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `prepareEnterpriseEventDraft` が `doc(db, 'enterprises', ...)` を withConverter なしで直接 `getDoc` している。RC-14 で `enterpriseMemberMonthlyUsage` を store 経由に修正したのと同じ規約違反 → `base/src/stores/enterprise.ts` の `getEnterpriseById` を使う。

**コメント要約**:

`getEnterpriseById`（withConverter 付き）経由に変更し、`Enterprise` の手動 new と snap 判定を削除した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: AGENTS.md「DB 操作は必ず store 経由・xxxRef は必ず withConverter 付き」違反。RC-14 と同型で修正方針一意。

---

**識別子**: RC-25（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/Enterprise.ts:150`

**該当コード（レビュー時点の diff）**:

```diff
+const EnterpriseMemberDbSchema = z.object({
+  user_id: z.string().nonempty(),
+  user_email: z.string().email(),
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: `EnterpriseMember` の `user_email` / `Enterprise` の `tenant_id` が必須（required）だが既存データへの backfill 言及がない → `enterprises` / `members` は本ブランチで新設されるコレクションであり、production に既存データが存在しないため backfill 不要。

**コメント要約**:

新規コレクションのため migration / backfill は不要と確認。対応なし。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: ➖ 該当なし

**想定工数**: —

**判断理由**: チェックリスト「既存データに影響する変更」に該当しない。

---

**識別子**: RC-26（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/EventMemberOrder.ts:18` `common/src/schemas/EventStripe.ts:46`

**該当コード（レビュー時点の diff）**:

```diff
+  enterprise_id: z.string().nullable().optional(),
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `enterprise_id` が空文字 `''` を許容する。RC-17 で空文字 enterprise_id の誤判定が実害になったとおり、空文字はスキーマ入口で弾くべき → `z.string().nonempty().nullable().optional()` にする。

**コメント要約**:

`EventMemberOrder`（member / order の Db・App）と `EventStripe`（Db・App）の計 6 箇所に `.nonempty()` を追加した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-17（enterpriseMail 空文字誤判定）の根本原因を入口で防ぐ。既存データは null materialize 済みで空文字は書き込まれていない。

---

**識別子**: RC-27（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/eventWrite.ts:104`

**該当コード（レビュー時点の diff）**:

```diff
+export function isEnterpriseEvent(e: Event): e is EnterpriseEvent {
+  return e.event_payment === 'enterprise_subsidy' && e.enterprise_id != null
+}
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `isEnterpriseEvent` は `EnterpriseEvent`（`enterprise_subsidy_settings: EnterpriseSubsidySettingsType` 必須）へ narrowing するのに `enterprise_subsidy_settings` を検証していない。スナップショット未設定の draft を通すと下流で `undefined` 参照になる → `e.enterprise_subsidy_settings != null` を追加する。

**コメント要約**:

型ガードに `enterprise_subsidy_settings != null` を追加し、narrowing 結果と実行時値を一致させた。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 型が保証すると宣言したフィールドを検証しない型ガードは `as` キャストと同等の型安全性違反。

---

**識別子**: RC-28（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/auditLogCursor.ts:30`

**該当コード（レビュー時点の diff）**:

```diff
+      typeof (parsed as AuditLogCursor).timestamp === 'number' &&
+      typeof (parsed as AuditLogCursor).log_id === 'string' &&
+      (parsed as AuditLogCursor).log_id !== ''
+    ) {
+      return parsed as AuditLogCursor
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `decodeAuditLogCursor` が `as AuditLogCursor` を 4 回使用。プロジェクト規約（`as` 禁止・型ガードで回避）違反 → `in` 演算子で narrowing した後に分割代入し、検証済みの値からオブジェクトを再構築して返す。

**コメント要約**:

`in` narrowing + 分割代入に書き換え、`as` キャストを全廃した。既存テストは全件 pass。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: AGENTS.md「`as` 回避は型ガードで行う」違反。余分なプロパティの混入も防げる。

---

**識別子**: RC-29（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/00_計画/01_MVP全体計画.md:32`

**該当コード（レビュー時点の diff）**:

```diff
-| WS-D（v0.1 残） | 6 | 1 | 7 |
-| **WS-A〜F 全タスク** | **25** | **4** | **29** |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 進捗サマリ表が本文タスク表と不一致。最終更新行は「D-1 ✅」なのに WS-D 行は 6/1/7 のまま。WS-A〜F 合計も per-WS 行の合算（30）と合わない → 本文タスク表を集計して WS-D 7/0/7、WS-A〜F 28/2/30 に更新する。

**コメント要約**:

本文タスク表をスクリプト集計し、WS-D と WS-A〜F 全タスク行を実数（7/0/7、28/2/30）へ更新した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 進捗サマリはリリース判断の参照元。集計値の同期のみで一意。

---

**識別子**: RC-30（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/04_詳細_割引・決済.md:98`

**該当コード（レビュー時点の diff）**:

```diff
-（[05_WS-C_C-1_PoC設計](../../30_リファクタ計画/05_WS-C_C-1_PoC設計.md) を参照）
+（[05_WS-C_C-1_PoC設計](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md) を参照）
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: `../../30_リファクタ計画/...` は `documents/30_リファクタ計画/`（存在しない）を指すリンク切れ → `../30_リファクタ計画/...` に修正する。

**コメント要約**:

相対パスを 1 階層修正しリンク切れを解消した（機械検証で broken 0 件）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: リンク切れは仕様参照を阻害。パス解決は機械的に一意。

---

**識別子**: RC-31（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/07_デプロイ・運用.md:6`

**該当コード（レビュー時点の diff）**:

```diff
-[`.github/workflows/deploy_enterprise.yml`](../../../../.github/workflows/deploy_enterprise.yml)
-[terraform/README.md](../../terraform/README.md)
-[03_デプロイ手順.md](../00_計画/03_デプロイ手順.md)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 相対リンク切れが 28 箇所（`../../terraform/`→`../../../terraform/`、`../../../../tools/`→`../../../tools/`、`../00_計画/03_デプロイ手順.md`→`03_developmentデプロイ手順.md`、`../テスト/`→`../../テスト方針・テスト項目書/v2.10/`、`../07_リファクタリング/`→`../../07_リファクタリング/` 等）→ 実在パスへ一括修正する。

**コメント要約**:

スクリプトで 28 箇所の相対リンクを実在パスへ一括修正し、再検証で broken 0 件を確認した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 07 はデプロイ手順の正本でリンク切れの実害が大きい。パス解決は機械的に一意。

---

**識別子**: RC-32（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/admin/AdminDiscountSettingsSection.vue:51`

**該当コード（レビュー時点の diff）**:

```diff
+  if (newType === 'percentage' && oldType != null && oldType !== 'percentage') {
+    discountValue.value = 50
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 割引種別を percentage に切り替えた際の初期値 `50` がマジックナンバー → `DEFAULT_PERCENTAGE_DISCOUNT` 定数に切り出し意図をコメントで明示する。

**コメント要約**:

`DEFAULT_PERCENTAGE_DISCOUNT = 50` 定数に切り出し、リセット意図のコメントを追加した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「マジックナンバーは定数に切り出す」。定数化のみで一意。

---

**識別子**: RC-33（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/useEnterpriseAdmin.ts:21` `enterprise/src/composable/enterpriseMemberMonthlyUsage.ts:32`

**該当コード（レビュー時点の diff）**:

```diff
+  return token.claims.enterprise_id as string | undefined
...
+    const enterpriseId = token.claims.enterprise_id as string | undefined
...
+    console.warn('Failed to load enterprise member monthly usage', error)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `token.claims.enterprise_id` の `as string | undefined` キャスト 2 箇所（規約違反）と、`fetchEnterpriseMemberMonthlyUsage` の catch が `console.warn` のみで `reportClientError` を呼んでいない → `typeof === 'string' && !== ''` の型ガードに置き換え、catch に `reportClientError` を追加する。

**コメント要約**:

claims を `typeof` 型ガードで narrowing（空文字も除外）し、catch に `reportClientError(..., { severity: 'warn' })` を追加した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約 + 調査不能 catch。claims は実行時に unknown のため型ガードが正道。

---

**識別子**: RC-34（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/navigation/index.ts:13`

**該当コード（レビュー時点の diff）**:

```diff
+  const refreshAdminMenu = async () => {
+    showAdminMenu.value = await isEnterpriseAdmin()
+  }
+
+  onMounted(() => {
+    void refreshAdminMenu()
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `refreshAdminMenu`（`getIdTokenResult` はオフライン時等に reject しうる）が `void` 呼びで try/catch がなく unhandled rejection になる → 関数内で try/catch し、失敗時は `showAdminMenu = false` に倒す。

**コメント要約**:

`refreshAdminMenu` 内に try/catch を追加。失敗時は管理メニュー非表示に倒し、ナビ全体の描画は継続する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「ライフサイクルフックから呼ぶ非同期処理に try/catch」。フォールバック（非表示）が安全側で一意。

---

**識別子**: RC-35（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/audit-logs.vue:188`

**該当コード（レビュー時点の diff）**:

```diff
+onMounted(async () => {
+  enterpriseId.value = await getEnterpriseIdFromToken()
+  if (enterpriseId.value != null) {
+    const membersResult = await getEnterpriseMembers({ ... })
+    memberOptions.value = membersResult.data.members
+  }
+  await loadAuditLogs()
+})
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `onMounted` 内の `getEnterpriseIdFromToken()` と `getEnterpriseMembers()`（Callable）が try/catch で保護されていない。throw すると unhandled rejection になるうえ後続の `await loadAuditLogs()` が実行されず、「表示するログがありません」と誤表示される → onMounted を try/catch で囲み、メンバー取得失敗時も `loadAuditLogs()` は実行する。

**コメント要約**:

メンバー一覧取得を try/catch で保護し、失敗時は通知を出しつつ `loadAuditLogs()` を継続実行する形に修正した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: フィルタ選択肢の取得失敗でログ一覧まで見えなくなるのは監査ログ画面として実害。

---

**識別子**: RC-36（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/invoices.vue:1`

**該当コード（レビュー時点の diff）**:

```diff
+enterprise/src/pages/admin/invoices.vue          （<RouterView> なし）
+enterprise/src/pages/admin/invoices/[yearMonth].vue
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `invoices.vue`（ファイル）と `invoices/`（フォルダ）の共存により unplugin-vue-router が `[yearMonth]` を `invoices.vue` の子ルートとして生成するが、`invoices.vue` に `<RouterView>` がないため `/admin/invoices/:yearMonth` が描画されない → `invoices.vue` を `invoices/index.vue` にリネームして兄弟ルート化する。

**コメント要約**:

`invoices/index.vue` へリネームし、`[yearMonth]` と兄弟ルート化。パス（`/admin/invoices`）は不変で参照側の修正は不要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 請求書 PDF 画面（D-7）が開けない機能バグ。リネームで一意に解消。

---

**識別子**: RC-37（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/invoices/[yearMonth].vue:11`

**該当コード（レビュー時点の diff）**:

```diff
+const yearMonth = route.params.yearMonth as string
+const invoiceId = route.query.id as string | undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `route.params` / `route.query` の `as` キャスト（`query.id` は `string[]` にもなりうる）→ `typeof === 'string'` の型ガードで解決する。

**コメント要約**:

`typeof` 判定で narrowing し `as` を全廃。`yearMonth` 非 string 時は空文字で API 側の invalid-argument に倒す。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約。`query.id` の配列ケースの誤動作も防げる。

---

**識別子**: RC-38（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.indexes.json:1355`

**該当コード（レビュー時点の diff）**:

```diff
+        { "fieldPath": "timestamp", "order": "DESCENDING" },
+        { "fieldPath": "__name__", "order": "ASCENDING" }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `listAuditLogs` は `orderBy('timestamp', 'desc')` + `startAfter(doc)` の cursor ページングだが、`audit_logs` の (action, timestamp DESC)・(user_id, timestamp DESC) インデックスに `__name__ ASC` の明示がない。デフォルトは末尾フィールドと同方向（DESC）になり、store のタイブレーク前提と食い違う → `__name__ ASC` を明示し、action + user_id 複合も追加する。

**コメント要約**:

既存 2 インデックスに `__name__ ASC` を明示し、(action, user_id, timestamp DESC, __name__ ASC) を追加した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: cursor ページングの順序保証に直結。インデックス定義のみで解消。

---

**識別子**: RC-39（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.indexes.json:1438`

**該当コード（レビュー時点の diff）**:

```diff
+        { "fieldPath": "user_id", "order": "ASCENDING" },
+        { "fieldPath": "status", "order": "ASCENDING" },
+        { "fieldPath": "enterprise_id", "order": "ASCENDING" },
+        { "fieldPath": "updated_at", "order": "DESCENDING" },
+        { "fieldPath": "order_id", "order": "DESCENDING" }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `userFoods` / 注文履歴の enterprise フィルタ付きクエリ（user_id ==, status ==, enterprise_id ==, orderBy updated_at desc, order_id desc）に対応する 5 フィールド複合インデックスが未定義。デプロイ後にクエリが failed-precondition になる → インデックスを追加する。

**コメント要約**:

member_orders CG に 5 フィールド複合インデックスを追加した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: インデックス欠落は本番でクエリ即死。チェックリスト「複合クエリのインデックス追加漏れ」。

---

**識別子**: RC-40（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.indexes.json:1401`

**該当コード（レビュー時点の diff）**:

```diff
-      { "collectionGroup": "events", ... (event_id ASC, enterprise_id ASC) }
-      { "collectionGroup": "member_orders", ... (enterprise_id ASC, user_id ASC, updated_at ASC) }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `events` の (event_id, enterprise_id) は既存 (enterprise_id, event_id) と等価（等価フィルタのみの複合はフィールド順不問）、`member_orders` の (enterprise_id, user_id, updated_at ASC) も (user_id, enterprise_id, updated_at DESC) で代替可能（単一 orderBy は逆順走査可）→ 重複を削除しインデックス数を節約する。

**コメント要約**:

等価な重複インデックス 2 件を削除。差分検証スクリプトで消失インデックスが既存の等価インデックスでカバーされることを確認した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「インデックスの重複がないか」。Firestore の複合インデックス上限（200）節約。

---

**識別子**: RC-41（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/billingSnapshots.ts:81`

**該当コード（レビュー時点の diff）**:

```diff
+    for (const enterpriseId of enterpriseIds) {
+      try {
+        await captureBillingSnapshotForEnterprise(enterpriseId, yearMonth)
+      } catch (error) {
+        logger.error('Failed to capture billing snapshot', { enterpriseId, yearMonth, error })
+      }
+    }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: 月次請求スナップショット cron が enterprise 単位の失敗をログのみで握りつぶし、Scheduled Function は成功終了するため Cloud Functions の自動リトライに乗らない（請求データ欠落がサイレント化）。また企業数増加時のタイムアウト設定もない → 失敗 enterprise を集計してループ後に throw（upsert なのでべき等）し、`timeoutSeconds: 540` を設定する。

**コメント要約**:

失敗 enterprise を集計しループ後に throw して自動リトライに乗せた（upsert のため再実行はべき等）。`timeoutSeconds: 540` を追加。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「catch した例外をログのみにせず再 throw し自動リトライに乗せる」。請求データ欠落は実害大。

---

**識別子**: RC-42（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/dashboardData.ts:54`

**該当コード（レビュー時点の diff）**:

```diff
+    const orderIds = (log.details?.order_ids as string[] | undefined) ?? []
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `details` は `Record<string, unknown>` なのに `as string[]` でキャストしており、非配列・非 string 混入時に下流が壊れる → `Array.isArray` + `typeof === 'string'` フィルタの型ガードに置き換える。

**コメント要約**:

`Array.isArray` + string フィルタで narrowing し `as` を排除した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約 + `details` は自由形式でスキーマ保証がない。

---

**識別子**: RC-43（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/members.ts:149`

**該当コード（レビュー時点の diff）**:

```diff
+  try {
+    const now = Date.now()
+    const tenantAuth = await authForEnterprise(enterpriseId)
+    const authUser = await tenantAuth.createUser({
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `createSingleEnterpriseMember` が行ごとに `authForEnterprise`（enterprise doc の Firestore read を内包）を呼ぶ N+1。最大 500 行の CSV 一括作成で不要な read が 500 回発生する → Callable 側で 1 回解決して引数で渡す。

**コメント要約**:

`createEnterpriseMembers` 側で `tenantAuth` を 1 回解決し、`createSingleEnterpriseMember` に引数で渡す形に変更した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「ループ内で Firestore read を逐次実行しない」。引数化のみで一意。

---

**識別子**: RC-44（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/onboarding.ts:211`

**該当コード（レビュー時点の diff）**:

```diff
+    if (authUserId != null && tenantId != null) {
+      try {
+        await authForEnterpriseTenant(tenantId).deleteUser(authUserId)
+      } catch ...
+    }
+    try {
+      await deleteEnterprise(enterpriseId)
+    } catch ...
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: `createEnterprise` のロールバックが Auth ユーザー・enterprise doc・tenant のみ削除し、`saveEnterpriseMember`（サブコレクションは親 delete で消えない）と `saveUser` で作成した doc を残す。`writeAuditLog` 失敗時等に孤児 member / user doc が残り、メール一意判定や再登録に影響する → `deleteEnterpriseMember` / `deleteNewUserDocuments` をロールバックに追加する（`createEnterpriseMembers` の `rollbackCreatedEnterpriseMember` と同型）。

**コメント要約**:

ロールバックに `deleteEnterpriseMember` + `deleteNewUserDocuments` を追加し、member / user doc の孤児化を防止した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: チェックリスト「複数ステップ作成処理の補償削除」。既存 `rollbackCreatedEnterpriseMember` と同型で方針一意。

---

**識別子**: RC-45（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/auditLog.ts:110`

**該当コード（レビュー時点の diff）**:

```diff
+  const logs = matched.slice(0, pageSize)
+  const hasNext = logs.length === pageSize && !exhausted
+  return {
+    logs,
+    hasNext,
+    nextCursor: logs.length > 0 ? toNextCursorFromLogs(logs) : null,
+  }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: `listAuditLogsGuest` の hasNext / nextCursor に取り漏らしが 2 系統ある。(1) スキャン上限（`maxScan`）到達で `matched < pageSize` のとき `hasNext = false` になり、以降の guest ログへ到達不能。(2) 最終バッチ途中で pageSize が埋まると `exhausted = true` により `hasNext = false` になり、同バッチ残りの guest ログが欠落する → cursor を「最後に判定済みの doc」基準に変えて再開可能にし、`hasNext = 未判定残あり || !exhausted` にする。

**コメント要約**:

スキャン cursor を doc 単位で更新する形にループを書き換え、`hasNext = hasUnscannedInBatch || !exhausted`、`nextCursor = scanCursor` とした。auditLogs.test.ts は全件 pass。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 監査ログの一部がページングで永久に到達不能になるのは監査要件上の実害。

---

**識別子**: RC-46（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/userFriendsResolver.ts:117`

**該当コード（レビュー時点の diff）**:

```diff
+      friends.push({
+        user_id: friend.id,
+        ...
+        meet_count: friend.meet_count,
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: `enterpriseScope` 指定時、`resolveUserFriendMeetLog` は enterprise イベントでフィルタした後の `meet_count` を返すのに、friends 一覧の `meet_count` は全イベント込みの `friend.meet_count` のまま。一覧とダイアログで回数が食い違う → 一覧側も enterprise イベントのみで再計算するか、仕様書（04_詳細_マイページ・友人）に「一覧は全体回数」の旨を明記する。

**コメント要約**:

一覧の meet_count 再計算は友人ごとの event_history 参照（N+1）が必要で性能影響があり、表示仕様の判断が必要。自動修正対象外として未着手。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 一覧の enterprise フィルタ再計算は Callable 性能コストが大きい。テナント分離によりエンプラ従業員の PF イベント混在はない。友人一覧は `friend.meet_count`（denormalized）のまま、ゲスト同席を含む当該 enterprise イベント上の同席回数として表示する旨を `04_詳細_マイページ・友人` EP-27 / §4.2.6 および `04_詳細_ゲスト参加` §2.2 に追記して確定。

---

## 評価セッション（2026-07-20 17:36・shokujii-code-review）

- **評価日時**: 2026-07-20 17:36 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **対象**: ステージング済み差分（24 ファイル）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **手順 3a/3b 自動修正**: RC-47 / RC-48

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-47 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | invoices/index onMounted に try/catch なし・初回ロード不能 |
| [x] | RC-48 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | eventDraft の catch が reportClientError 未呼び出し |

---

**識別子**: RC-47（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/invoices/index.vue:44`

**該当コード（レビュー時点の diff）**:

```diff
 onMounted(async () => {
   enterpriseId.value = await getEnterpriseIdFromToken()
   await loadInvoices()
 })
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `invoices/index.vue` の `onMounted` が `getEnterpriseIdFromToken()` を try/catch なしで await している。トークン取得失敗時は unhandled rejection となり `loadInvoices()` も実行されず一覧が空のままになる（RC-35 audit-logs と同型）。同ページの `[yearMonth].vue` は try/catch 済み → `getEnterpriseIdFromToken` を try/catch で囲み、失敗時は通知を出したうえで `loadInvoices()` を続行する。

**コメント要約**:

RC-35 と同型の try/catch を追加。トークン取得失敗時も `loadInvoices()` は呼び出し、エラー通知を表示する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 初回ロード不能 + unhandled rejection。修正方針は audit-logs / `[yearMonth].vue` と一意。

---

**識別子**: RC-48（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/eventDraft.ts:42`

**該当コード（レビュー時点の diff）**:

```diff
     } catch (err) {
       console.warn('Failed to snapshot enterprise_subsidy_settings', err)
       return
     }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `prepareEnterpriseEventDraft` の catch が `console.warn` のみで `reportClientError` を呼んでいない。RC-22 / RC-33 で store 系 catch に `reportClientError` を追加したのと同型 → `reportClientError(err, { componentInfo: 'eventDraft.prepareEnterpriseEventDraft', severity: 'warn' })` を追加する。

**コメント要約**:

`reportClientError` を追加し、スナップショット取得失敗を調査可能にした。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「store の zod パースエラー等、握りつぶすと調査不能になる catch 節で reportClientError」違反。修正方針一意。

---
