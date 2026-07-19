# ブランチ dev/enterprise-mvp-v2 レビュー記録

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
