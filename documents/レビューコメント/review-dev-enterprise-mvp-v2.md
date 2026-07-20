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
| [x] | RC-49 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | UserSuccessJoinEventDialog のハッシュタグ X リンクが hideShareSns 未ガード |
| [x] | RC-50 | なし | 👌 修正不要 | — | 📌 スコープ内 | — | ➖ 該当なし | — | OrdersEnterpriseIdQueryFilter の 'none' センチネルが enterprise_id 値域と重なる |
| [x] | RC-51 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | event store updateEvent が削除済み scopedEnterpriseId を参照（型・実行時エラー） |
| [x] | RC-52 | なし | 👌 修正不要 | — | 📌 スコープ内 | — | ➖ 該当なし | — | eventDraft の enterprise 取得失敗時に strict 検証をスキップして下書き保存 |
| [ ] | RC-53 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | S | eventWrite の pfEnterpriseFieldGuard superRefine が到達不能（デッドコード） |
| [x] | RC-54 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 却下方式 B スキーマが本番 eventWrite.ts に同居（poc/ へ移動） |
| [ ] | RC-55 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | auditLogCursor が共有パッケージ common で Node 専用 Buffer を使用 |
| [x] | RC-56 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 07_デプロイ・運用の Identity Platform 節が §9 重複・順序逆転 |
| [x] | RC-57 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | AdminInvoicesTable の window.open に noopener なし |
| [x] | RC-58 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | audit-logs flattenDetails の as Record キャスト |
| [x] | RC-59 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | admin ダッシュボード onMounted に try/catch なし（RC-35/47 同型の残り） |
| [x] | RC-60 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | invoices 一覧が読込失敗時に旧 rows を残す（ダッシュボードと不整合） |
| [x] | RC-61 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | router テナントガードの claims.enterprise_id as キャスト（2 箇所） |
| [x] | RC-62 | なし | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | ➖ 該当なし | — | member_orders enterprise_id+status+updated_at インデックスに対応クエリなし |
| [ ] | RC-63 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | canCreateCommunity が read 側の tenant 検証強化に未追随 |
| [ ] | RC-64 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | 月次スナップショット cron が全 enterprise を逐次 await |
| [ ] | RC-65 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | recapture callable が enterprise 不在時に success: true を返す |
| [ ] | RC-66 | なし | 🟡 修正提案 | 未着手 | ❓ 要確認 | — | 👀 確認のみ | — | enterpriseBillInvoice の CORS 静的リストがテナント動的オリジンに未対応の懸念 |
| [ ] | RC-67 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | M | recapture 後も旧請求書 PDF が旧 ?id= URL で取得可能なまま残る |
| [x] | RC-68 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterpriseInvoiceFile converter の as Pick キャスト |
| [x] | RC-69 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | getUserFriends が認可戻り値を使わず token を as で再抽出 |
| [ ] | RC-70 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | getUserProfilePreview のエンプラ counts 都度全再計算（友人数ぶん逐次 read） |
| [x] | RC-71 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterpriseAuthHelpers の token as キャスト |
| [ ] | RC-72 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | プロフィール系 Callable が viewer 自身の is_active を未検証（revoke 後最大 1h 閲覧可） |
| [x] | RC-73 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | create-enterprise README のアンカーリンク切れ 2 箇所 |

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

## 評価セッション（2026-07-20 20:15・shokujii-code-review）

- **評価日時**: 2026-07-20 20:15 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: dev/enterprise-mvp-v2
- **PR**: #2120
- **対象**: `origin/development...HEAD` ブランチ全体 216 ファイル（ユーザー明示依頼・領域別並列レビュー）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0（RC-1〜48 対応済み事項は再指摘から除外）
- **手順 3a/3b 自動修正**: RC-49 / RC-51 / RC-54 / RC-56〜61 / RC-68 / RC-69 / RC-71 / RC-73（🚨 2件 / 🟡 11件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-49 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | UserSuccessJoinEventDialog のハッシュタグ X リンクが hideShareSns 未ガード |
| [x] | RC-50 | なし | 👌 修正不要 | — | 📌 スコープ内 | — | ➖ 該当なし | — | OrdersEnterpriseIdQueryFilter の 'none' センチネルが enterprise_id 値域と重なる |
| [x] | RC-51 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | event store updateEvent が削除済み scopedEnterpriseId を参照（型・実行時エラー） |
| [x] | RC-52 | なし | 👌 修正不要 | — | 📌 スコープ内 | — | ➖ 該当なし | — | eventDraft の enterprise 取得失敗時に strict 検証をスキップして下書き保存 |
| [ ] | RC-53 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | S | eventWrite の pfEnterpriseFieldGuard superRefine が到達不能（デッドコード） |
| [x] | RC-54 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 却下方式 B スキーマが本番 eventWrite.ts に同居（poc/ へ移動） |
| [ ] | RC-55 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | auditLogCursor が共有パッケージ common で Node 専用 Buffer を使用 |
| [x] | RC-56 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | 07_デプロイ・運用の Identity Platform 節が §9 重複・順序逆転 |
| [x] | RC-57 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | AdminInvoicesTable の window.open に noopener なし |
| [x] | RC-58 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | audit-logs flattenDetails の as Record キャスト |
| [x] | RC-59 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | admin ダッシュボード onMounted に try/catch なし（RC-35/47 同型の残り） |
| [x] | RC-60 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | invoices 一覧が読込失敗時に旧 rows を残す（ダッシュボードと不整合） |
| [x] | RC-61 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | router テナントガードの claims.enterprise_id as キャスト（2 箇所） |
| [x] | RC-62 | なし | 👌 修正不要 | — | 📌 スコープ内 | 💾 データ | ➖ 該当なし | — | member_orders enterprise_id+status+updated_at インデックスに対応クエリなし |
| [ ] | RC-63 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | canCreateCommunity が read 側の tenant 検証強化に未追随 |
| [ ] | RC-64 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | 月次スナップショット cron が全 enterprise を逐次 await |
| [ ] | RC-65 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | recapture callable が enterprise 不在時に success: true を返す |
| [ ] | RC-66 | なし | 🟡 修正提案 | 未着手 | ❓ 要確認 | — | 👀 確認のみ | — | enterpriseBillInvoice の CORS 静的リストがテナント動的オリジンに未対応の懸念 |
| [ ] | RC-67 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 🔧 微修正 | M | recapture 後も旧請求書 PDF が旧 ?id= URL で取得可能なまま残る |
| [x] | RC-68 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterpriseInvoiceFile converter の as Pick キャスト |
| [x] | RC-69 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | getUserFriends が認可戻り値を使わず token を as で再抽出 |
| [ ] | RC-70 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | getUserProfilePreview のエンプラ counts 都度全再計算（友人数ぶん逐次 read） |
| [x] | RC-71 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | enterpriseAuthHelpers の token as キャスト |
| [ ] | RC-72 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 📋 仕様追加 | M | プロフィール系 Callable が viewer 自身の is_active を未検証（revoke 後最大 1h 閲覧可） |
| [x] | RC-73 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | create-enterprise README のアンカーリンク切れ 2 箇所 |

---

**識別子**: RC-49（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/UserSuccessJoinEventDialog.vue:221`

**該当コード（レビュー時点の diff）**:

```diff
                 <template v-if="typeof event.event_sns_hash_tag === 'string' && event.event_sns_hash_tag.trim() !== ''">
                   <dt class="text-description">{{ $t('success_join_event_dialog.hashtag') }}</dt>
                   <dd class="text-description">
                     <a :href="`https://x.com/search?q=%23${event.event_sns_hash_tag}`" target="_blank">
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 本 PR で `hideShareSns` prop を追加しシェアボタン・誘導ダイアログは非表示化したが、イベント詳細 dl 内のハッシュタグ行（X 検索への外部リンク）は `hideShareSns` でガードされていない。`EventDetailsCard.vue` は同 diff 内で SNS ハッシュタグ行を `v-if="!hideShareSns"` で隠しており、EP-9「エンプラでは SNS 露出を出さない」と不整合 → `v-if` に `!hideShareSns &&` を追加する。

**コメント要約**:

ハッシュタグ行の `v-if` に `!hideShareSns` を追加し、`EventDetailsCard` と挙動を統一した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: EP-9（#2173）で確定済みの SNS 非表示仕様に対するガード漏れ。修正方針一意。

---

**識別子**: RC-50（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/event.ts:184`

**該当コード（レビュー時点の diff）**:

```diff
+/** PF / enterprise の cart CG 等で使用。partner（default 空）は `'none'` */
+export type OrdersEnterpriseIdQueryFilter = string | null | 'none'
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: `'none'` センチネルは enterprise_id の値域（string）と重なるため、enterprise_id が文字通り `"none"` だとフィルタが脱落する → 実運用の ID（Firestore 自動 ID / 管理命名）では衝突しないため対応不要。判別型（`{ kind: 'filter' } | { kind: 'none' }`）の方が安全だった点は将来の改修時に考慮。

**コメント要約**:

理論上の値域衝突のみで実害なし。対応不要。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: ➖ 該当なし

**想定工数**: —

**判断理由**: 実運用 ID と衝突する現実的経路がない。

---

**識別子**: RC-51（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/event.ts:339`

**該当コード（レビュー時点の diff）**:

```diff
     const updateEvent = async (data: BokudeliEvent) => {
-      await draftPreparer(data, scopedEnterpriseId)
+      await draftPreparer(data, mergedOptions.eventsEnterpriseId ?? mergedOptions.ordersEnterpriseId ?? null)
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: リファクタで `scopedEnterpriseId` の定義が `mergedOptions` ベースに置き換えられて削除されたのに、`updateEvent` 内の参照だけが残っている。`tsc --noEmit` で `TS2304: Cannot find name 'scopedEnterpriseId'` を確認。Vite dev / ビルドではイベント更新保存が ReferenceError で必ず落ちる実行時バグ → マージ後オプションから解決する。

**コメント要約**:

`mergedOptions.eventsEnterpriseId ?? mergedOptions.ordersEnterpriseId ?? null` を渡す形に修正し、`tsc` でエラー消滅を確認。なおローカルの `vue-tsc --noEmit`（build:types）はこのエラーを検出せず即時 exit 0 する状態だったため、型チェックすり抜けの原因調査は別途推奨。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 未定義変数参照による確定バグ（イベント更新保存が不能）。修正方針一意。

---

**識別子**: RC-52（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/stores/eventDraft.ts:36`

**該当コード（レビュー時点の diff）**:

```diff
+  if (event.enterprise_subsidy_settings == null) {
+    try {
+      const enterprise = await getEnterpriseById(enterpriseId)
+      if (enterprise == null) {
+        return
+      }
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: `getEnterpriseById` 失敗・enterprise 不在時に early return し、`assertEnterpriseEventDraftStrict` を通さず subsidy スナップショットなしの `enterprise_subsidy` 下書きが保存されうる → 旧実装（warn して続行）踏襲 + RC-48 で `reportClientError` 追加済みのため観測可能。strict 検証を保存ゲートとして厳格化するなら throw に変える判断もあるが、下書き段階の graceful degradation として許容。

**コメント要約**:

旧実装踏襲 + 観測可能のため対応不要。厳格化は将来判断。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: ➖ 該当なし

**想定工数**: —

**判断理由**: 下書き保存の劣化許容は既存挙動と同等で、失敗は reportClientError で観測できる。

---

**識別子**: RC-53（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/eventWrite.ts:42-92`

**該当コード（レビュー時点の diff）**:

```diff
+export const PfEventWriteAppSchema = PfEventWriteBaseSchema.superRefine(pfEnterpriseFieldGuard)
+
+export const EventWriteAppSchema = z
+  .discriminatedUnion('event_payment', [PfEventWriteBaseSchema, EnterpriseEventWriteAppSchema])
+  .superRefine((data, ctx) => {
+    if (data.event_payment !== 'enterprise_subsidy') {
+      pfEnterpriseFieldGuard(data, ctx)
+    }
+  })
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `PfEventWriteBaseSchema` が既に `enterprise_id: z.null().optional()` / `enterprise_subsidy_settings: z.undefined().optional()` を宣言しているため、`superRefine` 実行時点（parse 成功後）にはガード内の 2 条件は真になり得ず到達不能。カスタムメッセージが出力されるパスは存在せず、「ここで弾いている」ように見えるデッドコードが読み手を誤解させる → `pfEnterpriseFieldGuard` と両 `superRefine` を削除して単純化するか、意図的な多層防御なら旨をコメント明記する。

**コメント要約**:

H1 write strict 設計の意図（将来ベーススキーマが緩んだ場合の防波堤の可能性）に関わるため自動修正対象外。削除 or コメント明記を人間判断待ち。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 変更種別リファクタ（自動修正対象外）。設計意図（多層防御として残すか）の確認が必要。

---

**識別子**: RC-54（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/eventWrite.ts:125`

**該当コード（レビュー時点の diff）**:

```diff
-/** PoC 方式 B 比較用（optional 汚染が残る extend のみ） */
-export const EventWriteExtendOnlySchemaB = EventWriteCoreAppSchema.extend({
-  event_payment: z.enum(EVENT_PAYMENT_VALUES),
-  enterprise_id: z.string().optional(),
-  enterprise_subsidy_settings: EnterpriseSubsidySettingsAppSchema.optional(),
-})
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `EventWriteExtendOnlySchemaB` は PoC で却下された方式 B の比較用スキーマだが、`poc/` ではなく本番 write スキーマ正本 `eventWrite.ts` から export されている。schemas README の「poc/ は比較のみ・export 対象外」と矛盾し、optional に緩んだスキーマが誤 import されると write strict 保証が崩れる → `poc/eventSchemaPoC.ts` へ移動する。

**コメント要約**:

`EventWriteExtendOnlySchemaB` を `poc/eventSchemaPoC.ts` へ移動し、テストの import も poc 側へ変更。`eventWrite.ts` の不要 import（EVENT_PAYMENT_VALUES）も削除した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: README の配置規約との矛盾 + 誤用リスク。使用箇所は poc テストのみで移動方針一意。

---

**識別子**: RC-55（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/auditLogCursor.ts:13`

**該当コード（レビュー時点の diff）**:

```diff
+  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `encodeAuditLogCursor` / `decodeAuditLogCursor` が Node 専用の `Buffer` を使用している。common は user / partner / enterprise のブラウザアプリからも import される共有パッケージであり、Vite はデフォルトで polyfill しないため、将来フロントから import された時点でランタイムエラーになる（現状の使用箇所は functions のみで実害なし） → (a) functions 側へ移動、(b) JSDoc に「Node 環境専用」を明記、(c) Web 互換 base64url 実装への置換のいずれか。

**コメント要約**:

修正方針が複数（移動 / 明記 / 置換）のため自動修正対象外。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 現状実害なし。配置方針（common に残すか functions へ移すか）の判断が必要で方針が一意でない。

---

**識別子**: RC-56（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/10_仕様/07_デプロイ・運用.md:648`

**該当コード（レビュー時点の diff）**:

```diff
+## 9. Identity Platform（IdP Phase 1 / WS-B）
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 本ブランチで追加された Identity Platform 節が `## 9.` として §11 の後ろに挿入されており、既存の `## 9. 環境別作業メモ` と番号が重複。章構成が「…9 → 10 → 11 → 9 → 変更履歴」となり §9.1 等の参照が曖昧 → 新節を `## 12.` に改番し、配下・参照も更新する。

**コメント要約**:

§9 → §12（12.1〜12.3）に改番。節内参照と、参照元 4 ドキュメント（04_オンボーディング / 04_WS-B / 02_実装計画 / 01_MVP全体計画）の §9 / §9.1 リンクを §12 / §12.1 へ更新し、07 変更履歴に改番を追記した（過去の変更履歴行は当時の番号のまま維持）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 章番号重複は参照の曖昧化を招く。改番方針一意。

---

**識別子**: RC-57（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/admin/AdminInvoicesTable.vue:18`

**該当コード（レビュー時点の diff）**:

```diff
 const openPdf = (yearMonth: string) => {
-  window.open(getAdminInvoicePdfPath(yearMonth), '_blank')
+  window.open(getAdminInvoicePdfPath(yearMonth), '_blank', 'noopener,noreferrer')
 }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: チェックリストで `window.open` にも `noopener noreferrer` 必須。開く先は自アプリ内の請求 PDF ページで実害は小さいが規約違反 → 第 3 引数に `'noopener,noreferrer'` を付与する。

**コメント要約**:

`window.open` に `'noopener,noreferrer'` を追加した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: チェックリスト「target=_blank / window.open に rel=noopener noreferrer」の機械的適用。方針一意。

---

**識別子**: RC-58（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/audit-logs.vue:95`

**該当コード（レビュー時点の diff）**:

```diff
     if (typeof value === 'object' && !Array.isArray(value)) {
-      for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
+      for (const [nestedKey, nestedValue] of Object.entries(value)) {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `typeof value === 'object'` で絞り込み済みなのに `as Record<string, unknown>` でキャストしている。`Object.entries` は `object` 型をそのまま受け取れる → キャストを除去する。

**コメント要約**:

キャストを除去（`Object.entries(value)` のまま型が通ることを確認）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約。キャスト不要が確認でき方針一意。

---

**識別子**: RC-59（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/index.vue:57`

**該当コード（レビュー時点の diff）**:

```diff
 onMounted(async () => {
-  enterpriseId.value = await getEnterpriseIdFromToken()
+  try {
+    enterpriseId.value = await getEnterpriseIdFromToken()
+  } catch {
+    notification.show(t('admin.dashboard.load_failed'), 'error')
+  }
   await loadDashboard()
 })
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `getEnterpriseIdFromToken()` は `getIdTokenResult()` を await しておりネットワーク断等で reject しうるが、onMounted に try/catch がなく失敗時は unhandled rejection + 空ダッシュボード（通知なし）になる。RC-35（audit-logs）/ RC-47（invoices/index）で同型を対応済みだが本ページのみ漏れ → invoices/index と同様に try/catch + エラー通知を追加する。

**コメント要約**:

RC-47 と同型の try/catch + `admin.dashboard.load_failed` 通知を追加した。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-35 / RC-47 と同一根拠（初回ロード不能 + unhandled rejection）・同一修正方針の残存箇所。

---

**識別子**: RC-60（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/invoices/index.vue:34`

**該当コード（レビュー時点の diff）**:

```diff
   } catch {
     if (seq !== loadSeq) return
+    rows.value = []
     notification.show(t('admin.invoices.load_failed'), 'error')
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: ダッシュボード（admin/index.vue）は読込失敗時に rows をクリアするが、請求書一覧は通知のみで `rows` を残す。期間変更後の読込失敗でピッカーの期間と表の内容（旧期間データ）が食い違う → catch 内で `rows.value = []` を追加しダッシュボードと挙動を揃える。

**コメント要約**:

catch 内で `rows.value = []` を追加し、ダッシュボード（RC 対応済み挙動）と統一した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 同一 PR 内で確立済みの失敗時クリア方針への追随。方針一意。

---

**識別子**: RC-61（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/router/index.ts:96` `enterprise/src/router/index.ts:247`

**該当コード（レビュー時点の diff）**:

```diff
-        const tokenEnterpriseId = tokenResult.claims.enterprise_id as string | undefined
+        const rawEnterpriseId = tokenResult.claims.enterprise_id
+        const tokenEnterpriseId = typeof rawEnterpriseId === 'string' ? rawEnterpriseId : undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 本差分で新規追加されたテナント整合ガードに `claims.enterprise_id as string | undefined` が再導入されている（RC-33 で同種を型ガード化済み）。246 行目にも同型の既存キャストあり → typeof ガードに置き換える（既存行も同時修正）。

**コメント要約**:

新規ガード（96 行）と既存の同型箇所（246 行）の両方を typeof 型ガードに置き換えた。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約 + RC-33 で確立済みの型ガード方針への追随。方針一意。

---

**識別子**: RC-62（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.indexes.json:1294`

**該当コード（レビュー時点の diff）**:

```json
{ "collectionGroup": "member_orders", "fields": ["enterprise_id ASC", "status ASC", "updated_at ASC"] }
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: この 3 フィールドインデックスに対応するクエリが現行コードに見当たらない（ダッシュボード集計 `listOrderedMemberOrdersByEnterprise` は等価フィルタのみで 2 フィールド版で足りる）。RC-38〜40 のインデックス整理を通過しており意図的に残している可能性もあるため対応不要とするが、未使用なら削除候補。

**コメント要約**:

未使用の可能性があるが実害なし（ビルド時間・保守コストのみ）。削除は別途判断。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: ➖ 該当なし

**想定工数**: —

**判断理由**: 未使用インデックスは動作影響がなく、意図確認なしの削除はリスクが上回る。

---

**識別子**: RC-63（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `firestore.rules:186`

**該当コード（レビュー時点の diff）**:

```
        function canCreateCommunity() {
            return request.auth != null
                && (
                    (request.auth.token.get('enterprise_id', null) == null
                     && docEnterpriseId(request.resource.data) == null)
                    || (request.auth.token.get('enterprise_id', null) != null
                        && docEnterpriseId(request.resource.data) == request.auth.token.enterprise_id)
                )
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 本差分で read 側（`isSameEnterprise` / `isEnterpriseTenantFor`）は「user_type == 'enterprise' + firebase.tenant と enterprises/{id}.tenant_id の一致」まで検証するよう強化されたが、書き込み側 `canCreateCommunity` の enterprise 分岐は claims の enterprise_id 等値チェックのみ。tenant 未設定のレガシートークンでも自社 enterprise_id 付き community を create でき、read 側の不変条件と非対称 → enterprise 分岐を `isSameEnterprise(request.resource.data)` に置き換え、tenant 不一致 create 拒否の rules テストを 1 件追加する。

**コメント要約**:

Security Rules の権限変更 + rules テスト追加を伴うため自動修正対象外（セキュリティ影響確認が必要）。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: claims はシステム発行のため即時の昇格経路ではないが、tenant 検証の非対称は本差分起因。Rules 変更はセキュリティ影響確認（自動修正対象外）。

---

**識別子**: RC-64（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/billingSnapshots.ts:83`

**該当コード（レビュー時点の diff）**:

```diff
+    for (const enterpriseId of enterpriseIds) {
+      try {
+        await captureBillingSnapshotForEnterprise(enterpriseId, yearMonth)
+      } catch (error) {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: 月次 cron が 1 enterprise ごとに `fetchDashboardData`（テナント全体の全件取得）という重い集計を直列実行している（チェックリスト「ループ内逐次 await 禁止」）。timeoutSeconds 540 は確保済みだが enterprise 数 × データ量の増加で上限に達しうる → `members.ts` の `runWithConcurrency` と同型の並列度制限（3〜5）で実行するか、メモリ対策で意図的に直列なら旨をコメント明記する。

**コメント要約**:

課金 cron の実行特性（メモリ・Firestore 負荷）に関わるため自動修正対象外。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: MVP のテナント数では実害なし。並列化はメモリ・負荷特性の確認を要し自動修正対象外。

---

**識別子**: RC-65（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/billingSnapshots.ts:130`

**該当コード（レビュー時点の diff）**:

```diff
+export async function captureBillingSnapshotForEnterprise(enterpriseId: string, yearMonth: string): Promise<void> {
+  const enterprise = await getEnterpriseById(enterpriseId)
+  if (enterprise == null) {
+    logger.warn('Enterprise not found for billing snapshot', { enterpriseId, yearMonth })
+    return
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `captureBillingSnapshotForEnterprise` は enterprise 不在時に warn して黙って return する（scheduled 用スキップ設計）。callable `recaptureEnterpriseBillingSnapshot` から呼ぶと、サポートユーザーが enterprise_id を打ち間違えても何も実行されず `{ success: true }` が返る → callable 側で事前に `getEnterpriseById` を確認して不在なら `HttpsError('not-found')` を throw する。または capture 関数が処理有無を返して callable で判定する。

**コメント要約**:

修正方針が複数（事前チェック / 戻り値判定）のため自動修正対象外。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: サポート運用時の誤操作が silent success になる。実装方針 2 案あり自動修正対象外。

---

**識別子**: RC-66（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterpriseBillInvoice.ts:17`

**該当コード（レビュー時点の diff）**:

```diff
+const CORS_ORIGINS = JSON.parse(process.env.CORS ?? '[]') as string[]
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👀確認のみ]: クライアントは cloudfunctions.net へ Authorization ヘッダー付き fetch を行いプリフライトが発生するが、CORS 許可オリジンは env `CORS` の静的完全一致リスト。エンタープライズのオリジンは企業ごとのサブドメイン + カスタムドメインで動的であり、新規 enterprise 追加のたびに env 更新 + 再デプロイが必要になる（漏れると請求書ダウンロードがブラウザで失敗）。eventBillInvoice（固定オリジン）のコピーによるミスマッチ → ベースドメインの正規表現許可・オリジン検証関数・Firestore custom_domain 照合等を検討。少なくとも現行 env で全テナントオリジンをカバーできるか確認する。

**コメント要約**:

デプロイ設定・ドメイン運用の確認事項。実装変更の要否は運用方針（サブドメイン集約か custom_domain 拡大か）に依存するため未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: ❓ 要確認

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 現行 env の設定値と運用方針の確認が先。コード変更が必要かは確認結果次第。

---

**識別子**: RC-67（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterpriseBillInvoice.ts:100` `functions/default/src/enterprise/billingSnapshots.ts:68`

**該当コード（レビュー時点の diff）**:

```diff
+  const file = getInvoiceFile(enterpriseId, yearMonth, invoiceId)
+  const [exists] = await file.exists()
+  if (!exists) {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/M]: recapture 時に `deleteInvoiceFileMeta`（Firestore メタのみ削除）を行うが GCS 上の旧 PDF オブジェクトは削除されず、`?id=` 付きアクセス（認証不要）は「ファイル存在」しか確認しないため、再取得前に共有された旧 URL から金額が古い請求書が引き続き取得できる。GCS の孤児オブジェクトも蓄積 → `deleteInvoiceFileMeta` 時に該当プレフィックスの GCS オブジェクトも削除する、または id 付きアクセス時にメタの `gcs_id === invoiceId` を検証して不一致なら 404 にする。

**コメント要約**:

金銭文書の無効化仕様（旧 URL の失効ポリシー）に関わり、修正方針も 2 案あるため自動修正対象外。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 請求書の正しさに直結するが、失効ポリシーの仕様判断 + 方針 2 案のため人間判断待ち。

---

**識別子**: RC-68（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/enterpriseInvoiceFile.ts:12`

**該当コード（レビュー時点の diff）**:

```diff
   fromFirestore(doc: QueryDocumentSnapshot): EnterpriseInvoiceFile {
-    return new EnterpriseInvoiceFile(doc.id, doc.data() as Pick<EnterpriseInvoiceFile, 'gcs_id'>)
+    return new EnterpriseInvoiceFile(doc.id, doc.data())
   },
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: converter の `as Pick<...>` キャスト。兄弟クラス `EnterpriseBillingSnapshot` は constructor が `Partial<...>` を受けるためキャスト不要。`EnterpriseInvoiceFile` だけ `Pick & Partial` を要求している。ランタイムは Zod parse（gcs_id 必須・default なし）が守る → constructor 引数を `Partial<EnterpriseInvoiceFile>` にしてキャストを除去する。

**コメント要約**:

constructor を `Partial<EnterpriseInvoiceFile>` に変更（Zod が gcs_id 必須を実行時担保する旨をコメント明記）し、converter の `as` を除去した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約 + 兄弟クラスとの一貫性。方針一意。

---

**識別子**: RC-69（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/userFriends.ts:90`

**該当コード（レビュー時点の diff）**:

```diff
+    let enterpriseScope: { enterpriseId: string } | undefined
     if (isEnterprise) {
-      await assertEnterpriseProfileAccess(request.auth, input.target_user_id)
+      const access = await assertEnterpriseProfileAccess(request.auth, input.target_user_id)
+      enterpriseScope = { enterpriseId: access.viewerEnterpriseId }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `getUserFriendMeetLog` / `getUserProfilePreview` は `assertEnterpriseProfileAccess` の戻り値 `viewerEnterpriseId` を使うのに、`getUserFriends` だけ戻り値を捨てて `request.auth.token as Record<string, unknown>` で enterprise_id を再抽出している（`as` 禁止 + 実装不統一）→ `getUserFriendMeetLog` と同型に揃える。

**コメント要約**:

`getUserFriendMeetLog` と同型に統一し、`as` キャストと再判定を除去した。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約 + 同一ファイル内の兄弟 Callable と同型化で方針一意。

---

**識別子**: RC-70（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/userProfile.ts:410` `functions/default/src/utils/recountUserProfileCounts.ts:47`

**該当コード（レビュー時点の diff）**:

```diff
+    const counts =
+      isEnterprise && enterpriseId != null
+        ? {
+            ...(await computeUserProfileCounts(targetUserId, { enterpriseId })),
+            counts_updated_at: targetUser.counts_updated_at ?? null,
+          }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: エンプラ閲覧時に `computeUserProfileCounts` を Callable 内で都度実行しており、内部の `computeActiveFriendCount` が全友人を逐次 `await classifyEnterpriseFriend`（1 友人 = 1 read）する N+1。previews の Promise.all の後に直列で走りレイテンシ加算。EP-11 で保存時フィルタ済み counts が `users/{uid}` にあり、EP-27 の「都度再計算しない」方針とも不整合 → stored counts をそのまま返す（PF 分岐と統一）か、live 計算を意図的に残すなら仕様追記 + classify の並列化 + previews との並列化を行う。`counts_updated_at`（stored）と counts 本体（live）の組み合わせ不整合も見直し。

**コメント要約**:

stored counts へ寄せるか live 継続かの仕様判断が必要なため自動修正対象外。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 友人数の鮮度要件（停止直後の反映）に関わる仕様判断を含み自動修正対象外。

---

**識別子**: RC-71（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseAuthHelpers.ts:23`

**該当コード（レビュー時点の diff）**:

```diff
-  const tokenEnterpriseId = token.enterprise_id as string | undefined
+  const rawEnterpriseId = token.enterprise_id
+  const tokenEnterpriseId = typeof rawEnterpriseId === 'string' ? rawEnterpriseId : undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `assertEnterpriseAdminFromUid` の `token.enterprise_id as string | undefined` は unknown からの `as` で規約違反。同ファイルの `getTokenTenantId` や `enterpriseProfileAccess.ts` は typeof ガードで書かれており混在。`auth.token as Record<string, unknown>`（52 行）は `DecodedIdToken` が index signature を持つためキャスト不要 → typeof ガード化 + 不要キャスト除去（`enterpriseProfileAccess.ts` の同型 2 箇所も同時除去）。

**コメント要約**:

typeof ガード化し、`enterpriseAuthHelpers.ts` / `enterpriseProfileAccess.ts` の不要な `as Record<string, unknown>` を除去した（tsc / vitest で確認）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `as` 禁止規約 + 同ファイル内の既存 typeof ガードパターンへの統一。方針一意。

---

**識別子**: RC-72（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseProfileAccess.ts:28`

**該当コード（レビュー時点の diff）**:

```diff
+  const targetMember = await getEnterpriseMember(viewerEnterpriseId, targetUserId)
+  if (targetMember == null || !targetMember.is_active) {
+    throw new HttpsError('not-found', '存在しないユーザーです')
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📋仕様追加/M]: `assertEnterpriseProfileAccess` は target 側の `is_active` は検証する一方、viewer 自身の member doc を確認しない。`disableEnterpriseMember` は `revokeRefreshTokens` を呼ぶが Callable のトークン検証は失効チェックを行わないため、停止された従業員が既発行 ID トークンの有効期間（最大約 1 時間）同僚のプロフィール・友人一覧を閲覧できる。管理者系 `assertEnterpriseAdminFromUid` や注文系 `assertActiveEnterpriseMember` は呼び出し元の `is_active` を毎回確認しており非対称 → viewer の `getEnterpriseMember` を追加検証する（target と Promise.all 可）か、「revoke 後 1h は許容」を仕様書 §5.2.1 に明記して確定させる。

**コメント要約**:

仕様書 §5.2.1 に viewer active 検証の明記がなく、仕様判断（検証追加 or 許容の明文化）が必要なため自動修正対象外。未着手。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 認可の厳格さの非対称。セキュリティ影響確認 + 仕様判断を要し自動修正対象外。

---

**識別子**: RC-73（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `tools/enterprise/create-enterprise/README.md:6` `tools/enterprise/create-enterprise/README.md:52`

**該当コード（レビュー時点の diff）**:

```diff
-- 手順・確認項目: [07_デプロイ・運用.md §11](...07_デプロイ・運用.md#11-テスト企業の作成-createenterprise)
+- 手順・確認項目: [07_デプロイ・運用.md §11](...07_デプロイ・運用.md#11-テスト企業の作成createenterprise)
-手動で行う場合は [07 §11.3](...07_デプロイ・運用.md#113-実行方法client-sdk) の Client SDK + support ログインでも可。
+手動で行う場合は [07 §11.3b](...07_デプロイ・運用.md#113b-実行方法client-sdk手動) の Client SDK + support ログインでも可。
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 新規 README のアンカー 2 箇所がリンク先見出しと不一致（github-slugger で検証）。`#113-実行方法client-sdk` は本ブランチの改番で `### 11.3b 実行方法（Client SDK・手動）` になっており正しくは `#113b-実行方法client-sdk手動`。`#11-テスト企業の作成-createenterprise` は全角括弧の除去仕様によりハイフンが入らない → 両アンカーとラベル（§11.3 → §11.3b）を修正する。

**コメント要約**:

両アンカーとラベルを修正した。07 内の同形の既存切れアンカーは本 RC の対象外（既存）。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 運用手順書のリンク切れは実行時の迷いに直結。アンカー修正のみで方針一意。

---
