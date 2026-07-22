# WS-A 実装設計（コード衛生・リリース独立）

[01_MVP全体計画.md](../00_計画/01_MVP全体計画.md) WS-A（A-1〜A-6）の**実装者向け正本**。タスク索引は [01_Project分離なし_タスク.md](./01_Project分離なし_タスク.md)、実行順は [02_Project分離なし_実装計画.md](./02_Project分離なし_実装計画.md) を参照。

---

## 実装順

| 順 | ID | 理由 |
|:--|:--|:--|
| 1 | A-3 | 小・即効・可視課題 |
| 2 | A-4 | 認証バグ是正（IdP 独立） |
| 3 | A-6 | リリース独立の獲得 |
| 4 | A-5 | CI 安全網 |
| 5 | A-2 | base DI（A-1 と並行可） |
| 6 | A-1 | 最大・本丸 |

---

## A-1: subsidy 分岐抽出

### 責務境界

| 層 | 配置 | 責務 |
|:--|:--|:--|
| 純粋計算 | `common/src/utils/paymentEnterpriseSubsidyAmount.ts` | 1 品目の補助額・replay・合計支払額 |
| 検証・認可 | `functions/default/src/utils/enterpriseSubsidyOrders.ts` | enterprise イベント判定・メンバー検証・replay 一致・Webhook スナップショット |
| トランザクション | 同上（`buildEnterpriseSubsidyCartOrders` 等） | カート追加・確定・usage 更新の orchestration |
| Callable 薄層 | `memberOrders.ts` / `stripe.ts` / `stripeWebhook.ts` / `cancelOrders.ts` | 共通前処理 + 分岐先呼び出し |

### 完了条件

- `enterprise_subsidy` の replay / 上限 / usage 加減算が `enterpriseSubsidyOrders.test.ts` でカバー — **✅**
- Callable 本体に 20 行超の `enterprise_subsidy` インラインブロックが残らない — **✅**（`addEnterpriseSubsidyMenusToCart` 委譲。#2119）
- PF の `user_advance` / `community_bill` 回帰テストが通る — **✅**
- **RC-35**（補助計算なし確定の拒否）— **✅**（`finalizeEnterpriseSubsidyZeroPaymentOrder` / Stripe 差額路径。01_MVP §WS-A メモ参照）

> **2026-06-27 進捗**: Callable 薄層化完了（#2119）。`addToCart` は `addEnterpriseSubsidyMenusToCart` へ委譲。

---

## A-2: base DI 化

### 注入 I/F

**EventPaymentUiStrategy**（`base/src/composable/eventPaymentUiStrategy.ts`）

- `isEnterpriseMode: boolean` — payment UI の enterprise / PF 切替
- `forbiddenPayments: EventPayment[]` — 選択禁止（enterprise は `community_bill`, `user_on_day`）
- `defaultPaymentWhenDraft?: EventPayment` — 下書き時の既定（enterprise は `enterprise_subsidy`）

**EventDraftPreparer**（`base/src/stores/eventDraft.ts`）

- `prepareEventDraft(event, communityEnterpriseId?)` — 新規/下書き保存前の enterprise スナップショット
- PF: no-op / enterprise: `applyEnterpriseSubsidySnapshotForDraft` 相当

**CartMonthlyUsageLoader**（`base/src/composable/cartMonthlyUsage.ts`）

- `loadMonthlyUsage(uid): Promise<{ used, limit } | null>`
- PF: 常に `null` / enterprise: Firestore 読み取り

### 完了条件

- `EventDetailCard.vue` に `isEnterpriseCommunity` computed が無い
- `cart.vue` が `enterprises` を直接 read しない（loader 経由）
- `createNewEvent` / `updateEvent` が `prepareEventDraft` 経由

---

## A-3: PF 越境ログインガード

### 判定

ログイン済みかつ ID token claims で次のいずれか:

- `user_type === 'enterprise'`
- `enterprise_id` が非空 string

### 動作

- 対象: PF `user` アプリの全ルート（`/maintenance` 除く）
- リダイレクト: `/` + `?enterprise_blocked=1`
- トップ等で `$t('auth.enterprise_user_on_pf')` を表示
- **ログアウトはしない**（enterprise 側へ URL 誘導は Phase 1 IdP までスコープ外）

---

## A-4: PF ログイン / 新規登録分離

> **実装済み（#2090）**: 2026-06-30 に別 Callable 方式で実装。

### API 契約（採用: 別 Callable）

| Callable | 用途 | 未登録メール | 登録済みメール |
|:--|:--|:--|:--|
| `requestEmailLogin` | ログイン OTP | `not-found` | OTP 送信 |
| `confirmEmailLogin` | ログイン確定 | —（passCode に user_id 必須） | custom token |
| `requestEmailRegistration` | 新規登録 OTP | OTP 送信 | `already-exists` |
| `confirmEmailRegistration` | 新規登録確定 | `createUser` + users doc | — |

### UI

- `/login` — ログイン専用（メールは既存ユーザーのみ）
- `/register` — 新規登録専用（メール未登録のみ）
- `/pass-code` — `history.state.mode: 'login' | 'register'` で Callable を切替

---

## A-5: CI paths + Rules 必須化

### pr-verify

- `dorny/paths-filter` で変更パッケージ検出
- `common` / ルート lockfile 変更時は全パッケージ verify
- `base` 変更時は `user` + `partner` + `enterprise` も test/lint

### Rules CI

- 既存 `test_firestore_rules.yml` を維持（paths: `firestore.rules`, `tests/firestore-rules/**`）
- branch protection の required check: **`Test Firestore Rules / test`**（[03_branch_protection.md](../../AIエージェント/03_branch_protection.md) 参照）
- `pr-verify` とは別 workflow のため、Rules 変更 PR では両方 green が必要

---

## A-6: Functions 選択的デプロイ

### 分類

| 区分 | 関数例 | デプロイ job |
|:--|:--|:--|
| **hybrid** | `addToCart`, `removeFromCart`, `confirmOrder`, `createStripeCheckoutSession`, `stripeWebhook`, `cancelOrders` | `deploy_functions_hybrid` |
| **enterprise** | `createEnterprise`, `requestEnterpriseEmailLogin`, … | `deploy_functions_enterprise` |
| **pf** | 上記以外（user/community/stripe 以外の PF 機能） | `deploy_functions_pf` |

### 運用

- `functions/**` push 時: 3 job 並列（同一 codebase・選択 `--only functions:a,functions:b`）
- `workflow_dispatch` で個別 job も手動発火可
- PA-24c（マルチ codebase）は Phase 2

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-20 | 初版（WS-A 実装設計・A-1〜A-6 の責務境界と完了条件） |
| 2026-06-20 | A-1 進捗: RC-35 ✅・テスト ✅。Callable 薄層化のみ残 |
| 2026-06-27 | A-1 Callable 薄層化完了（#2119）。`addEnterpriseSubsidyMenusToCart` 追加 |
| 2026-06-30 | A-4 実装完了（#2090）: login / registration Callable 分離、`/login` と `/register` UI 分離 |
