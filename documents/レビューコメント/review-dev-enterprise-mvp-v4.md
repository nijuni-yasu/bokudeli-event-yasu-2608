# ブランチ dev/enterprise-mvp-v4 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5301079804 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | recalculatedAudit を返し commit 後に監査ログ記録<br>writeEnterpriseSubsidyRecalculatedAudit で confirmOrder/stripe から呼び出し |
| [ ] | RC-2 | 3788825683 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 適用開始月変更時にフォームへ当該月の設定を反映<br>save 後に effectiveFromMonth と v-model が不整合 |
| [ ] | RC-3 | 3788825678 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | subsidy_settings_history 更新を Transaction 化<br>同時保存で read-modify-write 競合 |
| [x] | RC-4 | 3788825680 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | S | saveMember 前に Enterprise 読み取りが必要<br>Firestore Transaction の read-after-write 違反を解消 |
| [ ] | RC-5 | 3788825688 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | M | Stripe 再同期で event を Transaction 内で再読<br>トランザクション外 snapshot の陳腐化リスク |
| [x] | RC-6 | 3788806446 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | 監査ログ stored が再計算後値<br>更新前スナップショットを記録するよう修正 |
| [x] | RC-7 | 3788825667 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | expected undefined 時 merge ではフィールド削除不可<br>FieldValue.delete() で明示削除 |
| [x] | RC-8 | 3788806470 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | RC-7 と同一（Copilot [must]）<br>clearOrderPayEnterpriseSubsidyAmount で対応 |
| [x] | RC-9 | 3788825673 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | RC-1 と同一。sync から writeAuditLog 削除<br>Transaction 成功後に 1 回だけ記録 |
| [x] | RC-10 | 3788825676 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | RC-6 と同一（Codex P2）<br>storedBeforeRecalc で対応 |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `let settings` に型注釈がなく暗黙 any（evolving any）<br>`EnterpriseSubsidySettingsType \| null` を明示 |
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 📑 仕様書 | 📄 ドキュメントのみ | S | 既存 Enterprise ドキュメントの backfill 手順が未記載<br>§3.5「既存データ移行」で移行不要を明文化 |
| [ ] | RC-13 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | OrNull 追加・usage タブは移行済み<br>残: cart / history / loadResolvedSubsidySettings |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | 「翌暦月」計算が front 手計算 / functions luxon で二重実装<br>common getMinimumEffectiveFromMonth で共有 |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | resolve の戻り値を捨てて例外有無だけで eligible 判定<br>OrNull + loadEnterpriseForCurrentUser で共通化 |
| [x] | RC-16 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | admin 設定の loadSettings に catch がなく unhandled rejection<br>当月 resolve 不可で割引 0 表示・エラー通知なし |
| [x] | RC-17 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `Awaited<ReturnType<typeof ...>>` で型を間接参照<br>`EnterpriseSubsidySettingsType` を直接使用 |
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | settings 未解決でも「enterprise_id is required」と表示<br>調査を誤らせるためメッセージを実態に合わせる |
| [x] | RC-19 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | M | 同一注文を Tx 外 / Tx 内 / Tx 後の 3 回読んでいる<br>Tx から ordersInTx を返し 3 回目 read 削除 |
| [x] | RC-20 | なし | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📏 規約 | 🔧 微修正 | S | エージェント一時ファイル pr-body-2257.md<br>分割コミット時にコミット対象から除外済み |
| [x] | RC-21 | 3788956013 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 👤 UX | 🔧 微修正 | M | subsidy_recalculated 後 budget 再取得（#2261）<br>fetchCartEnterpriseSubsidyBudget + cart.vue reload |
| [x] | RC-22 | 3788956016 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | M | Stripe Tx 内 in_cart 再検証（#2262）<br>memberOrders と同等の status チェック |
| [ ] | RC-23 | 3789079913 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🚀 デプロイ, 💾 データ | 📋 仕様追加 | M | enterprise/functions 独立デプロイ時の旧管理画面互換<br>effective_from_month 省略時の移行契約が未整備 |
| [x] | RC-24 | 5301624458 | 👌 修正不要 | — | 📌 スコープ内 | 💰 金銭 | ❓ 要確認 | S | recalculated 後も月額上限 check は sync 内で実行済み<br>早期 return は caller 側の UI 更新用 |
| [ ] | RC-25 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | budget 取得失敗が完全に無言（console.warn も削除）<br>割引非表示の原因が追跡不能。reportClientError を追加 |
| [ ] | RC-26 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | チャットのイベント遷移失敗が無反応<br>エラー報告もユーザー通知もない |
| [x] | RC-27 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `z.infer<typeof ...DbSchema>[]` で型を間接参照<br>`EnterpriseSubsidySettingsEntryType` を直接使用 |
| [ ] | RC-28 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 監査ログ old 値の解決に throw 版を使用<br>解決不能時に設定保存自体が internal で失敗する |
| [x] | RC-29 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | 監査ログ `expected` 配列に undefined が混入<br>Firestore 書き込み失敗で再計算ログが欠落 |
| [ ] | RC-30 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭, 💾 データ | 📐 リファクタ | M | 月額上限超過時に再計算の書き戻しが rollback<br>監査ログも残らず stored のズレが解消されない |
| [x] | RC-31 | 3789190552 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 🐛 実害 | 🔧 微修正 | M | replay 順を carted_at+order_id に固定<br>sync / cart / addToCart で subsidy_recalculated ループ解消 |

---

## 評価セッション（2026-08-15 16:16・review-comments-evaluate）

- **評価日時**: 2026-08-15 16:16 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **REVIEW_REQUEST_SINCE**: 2026-08-15T06:59:53Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（Codex 接続案内 5301080118）
- **手順 4a 自動修正**: RC-4, RC-6, RC-7, RC-8, RC-10（🚨 5 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5301079804 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | recalculatedAudit を返し commit 後に監査ログ記録<br>writeEnterpriseSubsidyRecalculatedAudit で confirmOrder/stripe から呼び出し |
| [ ] | RC-2 | 3788825683 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 適用開始月変更時にフォームへ当該月の設定を反映<br>save 後に effectiveFromMonth と v-model が不整合 |
| [ ] | RC-3 | 3788825678 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | subsidy_settings_history 更新を Transaction 化<br>同時保存で read-modify-write 競合 |
| [x] | RC-4 | 3788825680 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | S | saveMember 前に Enterprise 読み取りが必要<br>Firestore Transaction の read-after-write 違反を解消 |
| [ ] | RC-5 | 3788825688 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | M | Stripe 再同期で event を Transaction 内で再読<br>トランザクション外 snapshot の陳腐化リスク |
| [x] | RC-6 | 3788806446 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | 監査ログ stored が再計算後値<br>更新前スナップショットを記録するよう修正 |
| [x] | RC-7 | 3788825667 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | expected undefined 時 merge ではフィールド削除不可<br>FieldValue.delete() で明示削除 |
| [x] | RC-8 | 3788806470 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | RC-7 と同一（Copilot [must]）<br>clearOrderPayEnterpriseSubsidyAmount で対応 |
| [x] | RC-9 | 3788825673 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | RC-1 と同一。sync から writeAuditLog 削除<br>Transaction 成功後に 1 回だけ記録 |
| [x] | RC-10 | 3788825676 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | RC-6 と同一（Codex P2）<br>storedBeforeRecalc で対応 |

---

**識別子**: RC-1（GitHub id: 5301079804）

**レビュワー**: Copilot

**指摘箇所**: PR トップレベル（`functions/default/src/utils/enterpriseSubsidyOrders.ts` 127, 135-136 付近）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

shokujii-code-review チェックリストに沿って Files changed を確認し、以下 2 点を指摘します。

[must] `functions/default/src/utils/enterpriseSubsidyOrders.ts:127` 付近  
`syncEnterpriseSubsidyOrdersBeforeConfirm` が `db.runTransaction` 内から `writeAuditLog()` を実行しています。Firestore Transaction はリトライされるため、トランザクション外の副作用（監査ログ書き込み）が重複・不整合化するリスクがあります。監査ログは transaction 成功後に 1 回だけ実行する構成へ分離してください。

[must] `functions/default/src/utils/enterpriseSubsidyOrders.ts:135-136` 付近  
監査ログの `stored` が、再計算後に更新済みの `orders` から作られており、`expected` と同値になって差分監査ができません。更新前の補助額スナップショットを先に退避し、`stored` には更新前値を記録するようにしてください。

**コメント要約**: トランザクション内の監査ログ書き込みと stored 記録の 2 点。<br>stored は RC-6/10、監査ログ分離は RC-9 と同一対応で ✅。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: `syncEnterpriseSubsidyOrdersBeforeConfirm` は `recalculatedAudit` のみ返却。`confirmOrder` / `createStripeCheckoutSession` が Transaction commit 成功後に `writeEnterpriseSubsidyRecalculatedAudit` で 1 回記録。stored 退避は `storedBeforeRecalc` で解消済み。

---

**識別子**: RC-4（GitHub id: 3788825680）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/memberOrders.ts:105`

**該当コード（レビュー時点の diff）**:

```diff
@@ -94,12 +101,15 @@ export const addToCart = onCall<AddToCartRequest, Promise<void>>(async (request"
       if (enterpriseId == null || enterpriseMember == null) {
         throw new HttpsError('failed-precondition', 'enterprise_id is required for enterprise_subsidy')
       }
       const eventMonth = formatYearMonth(eventData.event_start_datetime)
       const settings = await loadResolvedSubsidySettings(enterpriseId, eventMonth, transaction)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Enterprise の読み取りを member 書き込み前へ移してください**

Enterprise イベントへ初めてカート追加するユーザーでは、直前の `saveMember(..., transaction)` が Transaction 内の最初の write になり、その後 `loadResolvedSubsidySettings` が Enterprise ドキュメントを read するため Firestore の「read-after-write」制約に違反します。

**コメント要約**: addToCart で saveMember の後に Enterprise を read している。<br>初回参加時に Transaction が失敗する。Enterprise read を member write 前へ移動。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Firestore Transaction ルール違反は実害あり。`loadResolvedSubsidySettings` を `saveMember` 前に移動して解消。

---

**識別子**: RC-6（GitHub id: 3788806446）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:137`

**該当コード（レビュー時点の diff）**:

```diff
         stored: orders.map((o) => o.pay_enterprise_subsidy_amount ?? null),
```

**レビュワーのコメント（原文）**:

[must] `enterprise_subsidy_recalculated` の監査ログで `stored` に渡している値が、書き戻し（`orders[i].pay_enterprise_subsidy_amount = expected`）後の配列から作られており、元の不整合値が記録されません。書き戻し前の値を退避して監査ログに使うようにしてください。

**コメント要約**: 監査ログ stored が再計算後の値になる。<br>更新前スナップショットを記録すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 監査の目的上 stored は更新前値が必要。`storedBeforeRecalc` をループ前に取得して記録。

---

**識別子**: RC-7（GitHub id: 3788825667）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:122`

**該当コード（レビュー時点の diff）**:

```diff
       orders[i].pay_enterprise_subsidy_amount = expected
       saveOrder(communityId, eventId, userId, orders[i], transaction)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  補助なしへの再計算ではフィールドを削除してください**

他の注文で月額上限を使い切った場合など、再計算結果の `expected` が `undefined` になると、既存の正数を代入で `undefined` にして `saveOrder(..., { merge: true })` では Firestore 上のフィールドが残ります。

**コメント要約**: expected が undefined のとき merge set ではフィールド削除できない。<br>FieldValue.delete() が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 補助額 0 と「フィールドなし」の整合。`clearOrderPayEnterpriseSubsidyAmount` を store に追加し Transaction update で delete。

---

**識別子**: RC-2（GitHub id: 3788825683）

**レビュワー**: Codex

**指摘箇所**: `enterprise/src/components/admin/AdminDiscountSettingsSection.vue:44`

**該当コード（レビュー時点の diff）**:

（diff 末尾抜粋）

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  選択月の設定値をフォームへ反映してください**

翌月の設定を一度保存すると、親の `loadSettings` は入力値を当月適用中の設定へ戻しますが、`effectiveFromMonth` は翌月のままで、選択月変更時に履歴からフォームへ反映する処理がありません。

**コメント要約**: effectiveFromMonth と v-model の不整合。<br>月選択変更時に履歴からフォームへ反映が必要。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 管理画面 UX の問題。👤 UX ラベルのため自動修正対象外。watch effectiveFromMonth で履歴解決を反映する方針が一意。

---

**識別子**: RC-3（GitHub id: 3788825678）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/enterprise/subsidySettings.ts:57`

**該当コード（レビュー時点の diff）**:

（diff 末尾抜粋）

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  設定履歴の追加をトランザクション化してください**

同じ企業の複数管理者が異なる適用開始月をほぼ同時に保存すると、両方が同じ古い履歴を読み、各リクエストが配列全体を `saveEnterprise` で書き戻すため、後から保存した方だけが残る競合があります。

**コメント要約**: subsidy_settings_history の read-modify-write 競合。<br>Transaction 化または arrayUnion 相当が必要。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 妥当な指摘だが store 横断の Transaction 設計が必要。工数 M のため自動修正対象外。

---

**識別子**: RC-5（GitHub id: 3788825688）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/stripe.ts:121`

**該当コード（レビュー時点の diff）**:

（diff 末尾抜粋）

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Stripe 再同期では Event もトランザクション内で読んでください**

このトランザクションへ渡す `event` は 60 行目でトランザクション外から取得したものです。Checkout 処理と同時に主催者がイベントを更新すると、再同期が古い event 前提で走る可能性があります。

**コメント要約**: sync 用 event が Transaction 外 snapshot。<br>Transaction 内で event を再取得すべき。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 💰 金銭

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 競合レースの可能性はあるが stripe.ts 全体の read 順整理が必要。工数 M。

---

**識別子**: RC-8（GitHub id: 3788806470）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:123`

**該当コード（レビュー時点の diff）**: RC-7 と同一 hunk

**レビュワーのコメント（原文）**:

[must] `replay.expectedAmounts[i]` が `undefined` になるケース（上限超過で補助なし等）でも `saveOrder(..., { merge: true })` では既存の `pay_enterprise_subsidy_amount` フィールドを削除できず、Firestore 上の値が残って「書き戻し」にならない可能性があります。

**コメント要約**: RC-7 と同一。merge では undefined フィールド削除不可。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-7 と同一修正で解消。

---

**識別子**: RC-9（GitHub id: 3788825673）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:127`

**該当コード（レビュー時点の diff）**: RC-1 と同一論点

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  トランザクションの完了後に監査ログを書いてください**

`syncEnterpriseSubsidyOrdersBeforeConfirm` は `confirmOrder` と `createStripeCheckoutSession` の Transaction 内から呼ばれ、`writeAuditLog` が Transaction 外副作用としてリトライ時に重複する可能性があります。

**コメント要約**: Transaction 内 writeAuditLog は副作用重複リスク。<br>commit 成功後に 1 回だけ書く。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: RC-1 と同一対応。`writeEnterpriseSubsidyRecalculatedAudit` を commit 後に呼び出し。Transaction リトライ時の監査ログ重複と rollback 後の orphan ログを防止。

---

**識別子**: RC-10（GitHub id: 3788825676）

**レビュワー**: Codex

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:136`

**該当コード（レビュー時点の diff）**: RC-6 と同一

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  変更前の補助額を監査ログへ保存してください**

補助額が不一致だった注文は直前のループで `expected` に上書き済みなので、ここで生成する `stored` は再計算対象の要素について常に `expected` と同値になります。

**コメント要約**: RC-6 と同一。stored に更新前値が必要。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-6 と同一修正で解消。

---

## 対応セッション（2026-08-15 16:25・RC-1/RC-9 実装）

- **対応日時**: 2026-08-15 16:25 JST
- **対象 RC**: RC-1, RC-9
- **変更ファイル**:
  - `functions/default/src/utils/enterpriseSubsidyOrders.ts` — `EnterpriseSubsidyRecalculatedAudit` / `writeEnterpriseSubsidyRecalculatedAudit` 追加、`sync` から `writeAuditLog` 削除
  - `functions/default/src/stripe.ts` — Transaction 成功後に監査ログ記録
  - `functions/default/src/memberOrders.ts` — `confirmOrder` の recalculated 経路で commit 後に記録
  - `functions/default/src/utils/enterpriseSubsidyOrders.test.ts` — payload 返却・ヘルパのテスト追加

---

## 評価セッション（2026-08-15 16:52・shokujii-code-review）

- **評価日時**: 2026-08-15 16:52 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **レビュー範囲**: `git diff origin/development...HEAD`（11 コミット / 61 ファイル）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a / 3b 自動修正**: RC-16（🚨 1 件）、RC-11 / RC-17 / RC-18（🟡 3 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `let settings` に型注釈がなく暗黙 any（evolving any）<br>`EnterpriseSubsidySettingsType \| null` を明示 |
| [x] | RC-12 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 📑 仕様書 | 📄 ドキュメントのみ | S | 既存 Enterprise ドキュメントの backfill 手順が未記載<br>§3.5「既存データ移行」で移行不要を明文化 |
| [ ] | RC-13 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | OrNull 追加・usage タブは移行済み<br>残: cart / history / loadResolvedSubsidySettings |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | 「翌暦月」計算が front 手計算 / functions luxon で二重実装<br>common getMinimumEffectiveFromMonth で共有 |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | resolve の戻り値を捨てて例外有無だけで eligible 判定<br>OrNull + loadEnterpriseForCurrentUser で共通化 |
| [x] | RC-16 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX, 🐛 実害 | 🔧 微修正 | S | admin 設定の loadSettings に catch がなく unhandled rejection<br>当月 resolve 不可で割引 0 表示・エラー通知なし |
| [x] | RC-17 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `Awaited<ReturnType<typeof ...>>` で型を間接参照<br>`EnterpriseSubsidySettingsType` を直接使用 |
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | settings 未解決でも「enterprise_id is required」と表示<br>調査を誤らせるためメッセージを実態に合わせる |
| [x] | RC-19 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | M | 同一注文を Tx 外 / Tx 内 / Tx 後の 3 回読んでいる<br>Tx から ordersInTx を返し 3 回目 read 削除 |

---

**識別子**: RC-11（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/components/pages/cart.vue:183`

**該当コード（レビュー時点の diff）**:

```diff
+  let settings
+  try {
+    settings =
+      budget == null ? null : resolveEnterpriseSubsidySettingsForMonth(budget.subsidySettingsHistory, eventMonth)
+  } catch {
+    settings = null
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `let settings` が型注釈なしの宣言のため、TypeScript の evolving any（暗黙 any）になっています。`any` 禁止の方針からも型を明示すべきです → `let settings: EnterpriseSubsidySettingsType | null` とし、`@shokujii/common/schemas/EnterpriseSubsidySettings.js` から型を import してください。

**コメント要約**: `let settings` が型注釈なしで暗黙 any。<br>`EnterpriseSubsidySettingsType | null` を明示。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: AGENTS.md の `any` 禁止方針に沿う。型注釈追加のみで方針が一意のため手順 3b で自動修正。

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/Enterprise.ts:63`

**該当コード（レビュー時点の diff）**:

```diff
-  discount_type: z.enum(ENTERPRISE_DISCOUNT_TYPE_VALUES),
-  discount_value: z.number().int().nonnegative(),
-  monthly_limit_per_user: z.number().int().nonnegative(),
+  subsidy_settings_history: z.array(EnterpriseSubsidySettingsEntryDbSchema).min(1),
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📄ドキュメントのみ/S]: `EnterpriseDbSchema` からフラットな `discount_*` を削除し `subsidy_settings_history`（`min(1)`）を必須化していますが、既存の `/enterprises/{id}` ドキュメントには当該フィールドがないため、converter の Zod parse が失敗して **admin 設定・カート budget・利用状況タブ・Functions の `getEnterpriseById` がすべて読めなくなります**。`documents/` に backfill 手順（`bokudeli-event-batch` 側で `discount_*` → `subsidy_settings_history[0]`（`effective_from_month` = 企業作成月）へ移行）と、デプロイとの実行順序を明記してください → 既存テナントが無く移行不要であればその判断も併記してください。

**コメント要約**: `subsidy_settings_history` 必須化で既存 Enterprise doc が parse 不能。<br>backfill 手順・実行順序（または移行不要の判断）を documents に明記。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: ユーザー判断「既存テナントなし・移行不要」を `02_アーキテクチャ` §3.5「既存データ移行」小節と `04_詳細_割引・決済` §5.0 クロスリファで明文化。backfill 不要。

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/utils/paymentEnterpriseSubsidyAmount.ts:13`

**該当コード（レビュー時点の diff）**:

```diff
+  if (resolved == null) {
+    throw new Error(`No subsidy settings found for event month ${eventMonth}`)
+  }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: `resolveEnterpriseSubsidySettingsForMonth` が「該当月なし」を例外で表現しているため、呼び出し側 4 箇所（`base/src/components/pages/cart.vue`、`enterprise/src/composable/enterpriseMemberMonthlyUsageHistory.ts`、`enterprise/src/composable/enterpriseMemberMonthlyUsage.ts`、`functions/default/src/utils/enterpriseSubsidyOrders.ts`）が try/catch を制御フローとして使っています。特に `cart.vue` の catch は `computed` 内評価のため `reportClientError` も呼べず、設定不備が**無言で保存済み補助額表示にフォールバック**して調査できません → common に `resolveEnterpriseSubsidySettingsForMonthOrNull` 相当（null 返し）を追加し、例外は Functions 側の HttpsError 変換だけに限定してください。あわせて `subsidySettings.ts` の `previousSettings` 取得も plain `Error` が `internal` になるため同時に整理できます。

**コメント要約**: resolve 失敗が例外のため 4 箇所で try/catch 制御フロー。<br>null 返し版を追加し、カートの無言フォールバックを可観測にする。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 妥当だが common の API 追加 + 呼び出し側 4 箇所の整理が必要。📐 リファクタ / 工数 M のため自動修正対象外。

---

**識別子**: RC-14（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/components/admin/AdminDiscountSettingsSection.vue:34`

**該当コード（レビュー時点の diff）**:

```diff
+function getMinimumEffectiveFromMonth(): string {
+  const current = formatYearMonth(Date.now())
+  const [yearText, monthText] = current.split('-')
+  const year = Number(yearText)
+  const month = Number(monthText)
+  const nextMonth = month === 12 ? 1 : month + 1
+  const nextYear = month === 12 ? year + 1 : year
+  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: 「適用開始月は翌暦月以降」という同一ルールが、ここでは文字列の手計算、`functions/default/src/enterprise/subsidyValidation.ts:12` では `DateTime.now().setZone(DEFAULT_TIME_ZONE).plus({ months: 1 })` と二重実装されています。shokujii-code-review の「タイムゾーン依存の計算ロジックを call site で組み立てない」「`DEFAULT_TIME_ZONE` の新規参照は common 側に閉じた util を追加して呼び出す」に反します → `common/src/utils/datetime.ts` に `getNextYearMonth()` 相当を追加し、フロント・Functions 双方から呼んでください。

**コメント要約**: 翌暦月計算が front 手計算 / functions luxon で二重実装。<br>common に zone を閉じた util を追加して共有する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: `common/src/utils/datetime.ts` に `getMinimumEffectiveFromMonth` を追加。`AdminDiscountSettingsSection.vue` と `subsidyValidation.ts` から二重実装を削除。

---

**識別子**: RC-15（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/composable/enterpriseMemberMonthlyUsage.ts:24`

**該当コード（レビュー時点の diff）**:

```diff
+    const enterprise = await getEnterpriseById(enterpriseId)
+    if (enterprise == null || enterprise.subsidy_settings_history.length === 0) {
+      return false
+    }
+    resolveEnterpriseSubsidySettingsForMonth(enterprise.subsidy_settings_history, formatYearMonth(Date.now()))
+    return true
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `resolveEnterpriseSubsidySettingsForMonth(...)` の戻り値を捨て、**例外が飛ぶかどうか**だけで当月 resolve 可否を判定しています。意図が読み取れず、将来 resolve が例外を投げなくなると判定が壊れます。また同ファイルの `fetchEnterpriseMemberMonthlyUsage` と ID トークン取得〜`getEnterpriseById` が重複しており、タブ表示判定と本体取得で Enterprise を 2 回読んでいます → RC-13 の null 返し版で明示判定し、取得処理は共通化してください。

**コメント要約**: 戻り値を捨てた throw 判定で意図が不明。<br>Enterprise 読み取りも隣接関数と重複。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: `resolveEnterpriseSubsidySettingsForMonthOrNull` を common に追加。`fetchEnterpriseUsageTabEligible` は throw 判定を廃止し `loadEnterpriseForCurrentUser`（member 非取得）で明示判定。`fetchEnterpriseMemberMonthlyUsage` は `loadEnterpriseMemberContext` に集約。

---

**識別子**: RC-16（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `enterprise/src/pages/admin/settings.vue:63`

**該当コード（レビュー時点の diff）**:

```diff
+    subsidySettingsHistory.value = doc.subsidy_settings_history
+    const currentSettings = resolveEnterpriseSubsidySettingsForMonth(
+      doc.subsidy_settings_history,
+      formatYearMonth(Date.now()),
+    )
+    discountType.value = currentSettings.type
   } finally {
     loading.value = false
   }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `loadSettings` は `try` / `finally` のみで `catch` がありません。`resolveEnterpriseSubsidySettingsForMonth` は当月に適用中のエントリが無い場合（履歴が未来月のみ、backfill 直後等）に throw するため、`onMounted(loadSettings)` および `@saved="loadSettings"` で **unhandled rejection** となり、画面には割引値 0 のフォームがエラー表示なしで残ります。そのまま保存すると 0 円設定を書き込むリスクもあります → 他の管理画面（`admin/members` 等）と同じく `catch { notification.show(t('admin.settings.load_failed'), 'error') }` を追加してください。

**コメント要約**: loadSettings に catch がなく unhandled rejection。<br>当月 resolve 不可時に割引 0 表示・エラー通知なし。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 「イベントハンドラ・ライフサイクルフックから呼ぶ非同期処理に try/catch があるか」に該当。修正は既存 admin 画面の `load_failed` 通知パターンに揃えるだけで方針が一意のため手順 3a で自動修正（`enterprise/src/locales/messages/ja.ts` に `admin.settings.load_failed` を追加）。

---

**識別子**: RC-17（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/memberOrders.ts:87`

**該当コード（レビュー時点の diff）**:

```diff
+    let resolvedSubsidySettings: Awaited<ReturnType<typeof loadResolvedSubsidySettings>> | undefined
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 型を `Awaited<ReturnType<typeof loadResolvedSubsidySettings>>` で間接参照しています。実体は `EnterpriseSubsidySettingsType` であり、common の型を直接 import した方が読みやすく、ヘルパの戻り値変更時の意図しない追随も避けられます → `import type { EnterpriseSubsidySettingsType } from '@shokujii/common/schemas/EnterpriseSubsidySettings.js'` を使ってください。

**コメント要約**: `Awaited<ReturnType<typeof ...>>` で型を間接参照。<br>common の `EnterpriseSubsidySettingsType` を直接使う。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 可読性の改善で方針が一意。手順 3b で自動修正。

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/memberOrders.ts:112`

**該当コード（レビュー時点の diff）**:

```diff
     if (eventData.event_payment === 'enterprise_subsidy') {
-      if (enterpriseId == null || enterpriseMember == null) {
+      if (resolvedSubsidySettings == null || enterpriseId == null || enterpriseMember == null) {
         throw new HttpsError('failed-precondition', 'enterprise_id is required for enterprise_subsidy')
       }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-4 対応で read を前倒しした結果、この guard は `resolvedSubsidySettings == null` も判定するようになりましたが、エラーメッセージが `enterprise_id is required` のままです。補助設定を解決できなかった場合でも `enterprise_id` 起因のように見え、障害調査を誤らせます → メッセージを実態（enterprise_id と解決済み補助設定の両方が必要）に合わせてください。

**コメント要約**: settings 未解決でも「enterprise_id is required」と出る。<br>調査を誤らせるためメッセージを実態に合わせる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: メッセージ修正のみで方針が一意。手順 3b で自動修正。

---

**識別子**: RC-19（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stripe.ts:143`

**該当コード（レビュー時点の diff）**:

```diff
+    const syncedOrders =
+      event.event_payment === 'enterprise_subsidy'
+        ? await getOrdersByIds(community_id, event_id, uid, order_ids)
+        : orders
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/M]: `enterprise_subsidy` 経路では同じ注文ドキュメントを **Transaction 外（90 行）→ Transaction 内（113 行）→ Transaction 後（145 行）** の 3 回読んでいます。再計算が発生した場合は 129 行で早期 return するため、145 行に到達するのは**書き戻しが無かった場合のみ**で、この再取得は常に同じ内容になります（注文数 × 1 read の無駄）。shokujii-code-review の「Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか」にも該当します → Transaction のクロージャから `ordersInTx` を返して以降の集計に使い、Tx 外の先行読み取りと合わせて read 経路を整理してください。

**コメント要約**: 同一注文を Tx 外 / Tx 内 / Tx 後の 3 回読んでいる。<br>Tx から orders を返して 3 回目の再取得を削除する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: Transaction が `{ syncResult, ordersInTx }` を返却。recalc なし時は `checkoutOrders = ordersInTx` とし Tx 後の 3 回目 `getOrdersByIds` を削除。RC-5（Tx 内 event 再読）は別途未着手。

---

## 対応セッション（2026-08-15 17:10・RC-12/RC-14/RC-15/RC-19 実装）

- **対応日時**: 2026-08-15 17:10 JST
- **対象 RC**: RC-12, RC-14, RC-15, RC-19
- **変更ファイル**:
  - `documents/08_エンタープライズ/10_仕様/02_アーキテクチャ.md` — §3.5「既存データ移行」小節追加（RC-12）
  - `documents/08_エンタープライズ/10_仕様/04_詳細_割引・決済.md` — §5.0 移行クロスリファ（RC-12）
  - `common/src/utils/datetime.ts` + `.test.ts` — `getMinimumEffectiveFromMonth`（RC-14）
  - `enterprise/src/components/admin/AdminDiscountSettingsSection.vue` — common util 利用（RC-14）
  - `functions/default/src/enterprise/subsidyValidation.ts` — common util 利用（RC-14）
  - `common/src/utils/paymentEnterpriseSubsidyAmount.ts` + `.test.ts` — `OrNull` 追加（RC-15）
  - `enterprise/src/composable/enterpriseMemberMonthlyUsage.ts` — 取得共通化（RC-15）
  - `functions/default/src/stripe.ts` — 冗長 order read 削除（RC-19）

---

## 対応セッション（2026-08-15 16:52・RC-11/RC-16/RC-17/RC-18 実装）

- **対応日時**: 2026-08-15 16:52 JST
- **対象 RC**: RC-11, RC-16, RC-17, RC-18
- **変更ファイル**:
  - `base/src/components/pages/cart.vue` — `settings` に `EnterpriseSubsidySettingsType | null` を明示（RC-11）
  - `enterprise/src/pages/admin/settings.vue` — `loadSettings` に `catch` を追加しエラー通知（RC-16）
  - `enterprise/src/locales/messages/ja.ts` — `admin.settings.load_failed` 追加（RC-16）
  - `functions/default/src/memberOrders.ts` — 型注釈を `EnterpriseSubsidySettingsType` へ、guard のエラーメッセージ修正（RC-17, RC-18）

---

## 評価セッション（2026-08-15 17:08・shokujii-code-review）

- **評価日時**: 2026-08-15 17:08 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **レビュー範囲**: ステージ済み差分（18 ファイル）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a / 3b 自動修正**: 該当なし（新規 🚨 0 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-20 | なし | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 📏 規約 | 🔧 微修正 | S | エージェント一時ファイル pr-body-2257.md がステージ済み<br>PR コミットから除外する |

---

**識別子**: RC-20（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/tmp/pr-body-2257.md:1`

**該当コード（レビュー時点の diff）**:

```diff
+## 📝 タイトル
+
+[base][common][enterprise][functions][doc] エンタープライズ福利厚生設定の開催月解決と MVP v4 関連修正
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `.agents/tmp/pr-body-2257.md` は PR 本文生成用のエージェント一時ファイルであり、プロダクトコード・仕様・レビュー記録のいずれにも該当しません。ステージ済みのままコミットするとリポジトリに作業メモが残り、PR diff がノイズになります → コミット対象から除外してください（必要なら `.gitignore` に `.agents/tmp/` を追加）。

**コメント要約**: エージェント一時ファイルがステージ済み。<br>PR コミットから除外する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📤 スコープ外

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 分割コミット実行時に `.agents/tmp/pr-body-2257.md` をステージから除外し、リポジトリへコミットしていない。

---

## 評価セッション（2026-08-15 17:27・review-comments-evaluate・auto）

- **評価日時**: 2026-08-15 17:27 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **REVIEW_REQUEST_SINCE**: 2026-08-15T08:20:00Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼コメント 5301344461、Codex 接続案内 5301353269、RC-3 重複 Copilot 3788952400 / 5301352495）
- **手順 4a 自動修正**: 該当なし（🚨 2 件は 💰 金銭ラベル・工数 M のため対象外）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-20 | なし | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📏 規約 | 🔧 微修正 | S | pr-body 一時ファイルをコミット対象から除外済み |
| [x] | RC-21 | 3788956013 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 👤 UX | 🔧 微修正 | M | subsidy_recalculated 後 budget 再取得（#2261） |
| [x] | RC-22 | 3788956016 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | M | Stripe Tx 内 in_cart 再検証（#2262） |

---

**識別子**: RC-21（GitHub id: 3788956013・Codex）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `base/src/components/pages/cart.vue:387`

**レビュワーのコメント（原文）**:

P1 再計算後に月次利用額も再取得してください。別注文の確定で monthly_usage が増え、自己負担 0 円だったカートをサーバーが自己負担ありへ再計算した場合、この分岐はアラートを出して戻るだけで、enterpriseSubsidyBudget は userId が変わらない限り再取得されません。注文の Firestore 更新が届いても、表示額は古い usage を使って再 replay されるため needsStripeCheckoutForItem は引き続き false となり、再試行でも confirmOrder を呼んで Stripe 決済が必要ですで失敗し続けます。Stripe 側の同じ分岐も含め、再計算応答後に月次利用額を再取得して決済経路を更新してください。

**コメント要約**: subsidy_recalculated 後に monthly_usage が stale のまま。<br>Stripe 決済が必要なのに confirmOrder へ進み失敗ループ。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: #2261 で追跡。`fetchCartEnterpriseSubsidyBudget` 追加、`subsidy_recalculated` 後に `reloadEnterpriseSubsidyBudget` を Stripe / confirmOrder 両経路で呼び出し。

---

**識別子**: RC-22（GitHub id: 3788956016・Codex）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `functions/default/src/stripe.ts:119`

**レビュワーのコメント（原文）**:

P1 トランザクション内で注文状態を再検証してください。既存 Checkout 完了直前に同じ注文で新 Checkout を開始すると、Tx 外検証後に Webhook が ordered にし usage を加算、この再読では確定済み注文が返るが件数しか確認せず再計算へ渡す。再計算は当該注文自身を含む最新 usage を起点にするため補助額を減額・削除し、既に決済確定した注文を書き換えうる。ordersInTx の全件が引き続き in_cart であることを、書き戻し前に Tx 内で検証すること。

**コメント要約**: Tx 内で order status を再検証していない。<br>ordered 化後の再計算で確定済み注文を書き換えうる。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: #2262 で追跡。`stripe.ts` Tx 内で `ordersInTx` の `user_id` / `in_cart` を memberOrders と同等に再検証。

---

## 評価セッション（2026-08-15 18:38・review-comments-evaluate）

- **評価日時**: 2026-08-15 18:38 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **REVIEW_REQUEST_SINCE**: 2026-08-15T09:28:21Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（依頼コメント 5301598970、Codex 接続案内 5301624877、Copilot [must] は RC-3 重複、Copilot [確認済み] は既対応確認のみ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-23 | 3789079913 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🚀 デプロイ, 💾 データ | 📋 仕様追加 | M | 旧管理画面互換の移行契約<br>effective_from_month 省略時の Callable 互換 |
| [x] | RC-24 | 5301624458 | 👌 修正不要 | — | 📌 スコープ内 | 💰 金銭 | ❓ 要確認 | S | recalculated 後も sync 内で月額上限 check 実行<br>caller の早期 return は UI 更新用 |

---

**識別子**: RC-23（GitHub id: 3789079913・Codex）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `common/src/apis/enterprise.ts:172`

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  旧管理画面を受け付ける移行契約を追加してください**

`deploy_enterprise.yml` と `deploy_functions.yml` はそれぞれ `common/**` の変更で独立して起動されるため、Functions が先に更新された場合、旧バンドルや更新前から開かれている管理画面は `effective_from_month` を送信せず、新しい Callable の 27 行目で一律 `invalid-argument` になります。逆に Hosting が先なら旧 Callable は追加フィールドを無視して廃止予定のフラット設定だけを更新し得るため、保存成功後も履歴へ反映されません。省略時を翌月として受理する互換版 Functions を先行配備するなど、ロールアウト中も旧・新クライアントの双方を扱える契約にしてください。確認範囲は `.github/workflows/deploy_enterprise.yml:3-12` と `.github/workflows/deploy_functions.yml:3-12` です。

AGENTS.md reference: [AGENTS.md:L242-L244](https://github.com/nijuniinc/bokudeli-event-new/blob/f3bd18e05c5588cc47b9063a3c48ba11f421e821/AGENTS.md#L242-L244)

Useful? React with 👍 / 👎.

**該当コード（レビュー時点の diff）**:

```diff
@@ -169,6 +169,7 @@ export type UpdateEnterpriseSettingsResponse = {
 
 export type UpdateEnterpriseSubsidySettingsRequest = {
   enterprise_id: string
+  effective_from_month: string
```

**コメント要約**: enterprise/functions 独立デプロイ時、旧 UI が effective_from_month 未送信で Callable が reject する。<br>Hosting 先行時は旧 Callable が履歴を更新しないリスク。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🚀 デプロイ, 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 本番ロールアウト時のデプロイ順序問題として妥当。MVP 初回デプロイでは旧 UI 不在だが、Functions/Hosting 独立 CI では再発しうる。省略時デフォルト受理またはデプロイ順序の仕様化が必要。

---

**識別子**: RC-24（GitHub id: 5301624458・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:syncEnterpriseSubsidyOrdersBeforeConfirm`

**レビュワーのコメント（原文）**:

**[ask] `functions/default/src/utils/enterpriseSubsidyOrders.ts:syncEnterpriseSubsidyOrdersBeforeConfirm`**
`used + replay.subsidyTotal > settings.monthly_limit_per_user` のチェックが `recalculated` 判定後に行われているため、再計算で補助額が変更された場合はこの check に到達する前に早期 return します。再計算後に補助額が変わった場合の月額上限チェックは行われていますか？設計意図の確認をお願いします。

**コメント要約**: recalculated 時に月額上限 check がスキップされるのでは。<br>sync 内の check 順序に対する設計確認。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: ❓ 要確認

**想定工数**: S

**判断理由**: `syncEnterpriseSubsidyOrdersBeforeConfirm` は recalculated フラグ設定後も L176-179 で月額上限を検証してから return する。caller（stripe/memberOrders）が `recalculated: true` で早期 return するのは §5.2 の UI 更新用。上限超過時は `failed-precondition` で reject される。

---

## 評価セッション（2026-08-15 19:15・shokujii-code-review）

- **評価日時**: 2026-08-15 19:15 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **レビュー範囲**: `git diff origin/development...HEAD`（24 コミット / 72 ファイル・ブランチ全体）
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a / 3b 自動修正**: RC-29（🚨 1 件）、RC-27（🟡 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-25 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | budget 取得失敗が完全に無言（console.warn も削除）<br>割引非表示の原因が追跡不能。reportClientError を追加 |
| [ ] | RC-26 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | チャットのイベント遷移失敗が無反応<br>エラー報告もユーザー通知もない |
| [x] | RC-27 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `z.infer<typeof ...DbSchema>[]` で型を間接参照<br>`EnterpriseSubsidySettingsEntryType` を直接使用 |
| [ ] | RC-28 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 監査ログ old 値の解決に throw 版を使用<br>解決不能時に設定保存自体が internal で失敗する |
| [x] | RC-29 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | 監査ログ `expected` 配列に undefined が混入<br>Firestore 書き込み失敗で再計算ログが欠落 |
| [ ] | RC-30 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭, 💾 データ | 📐 リファクタ | M | 月額上限超過時に再計算の書き戻しが rollback<br>監査ログも残らず stored のズレが解消されない |
| [x] | RC-31 | 3789190552 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 🐛 実害 | 🔧 微修正 | M | replay 順を carted_at+order_id に固定<br>sync / cart / addToCart で subsidy_recalculated ループ解消 |

---

**識別子**: RC-25（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/cartMonthlyUsage.ts:81`

**該当コード（レビュー時点の diff）**:

```diff
+export async function fetchCartEnterpriseSubsidyBudget(
+  userId: string,
+  loader: CartEnterpriseSubsidyBudgetLoader,
+): Promise<CartEnterpriseSubsidyBudget | null> {
+  try {
+    const result = await loader(userId)
+    return normalizeCartEnterpriseSubsidyBudget(result)
+  } catch {
+    return null
+  }
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `cart.vue` にあった `console.warn('[cart] enterpriseSubsidyBudgetLoader failed', error)` が本関数への集約時に失われ、例外も `normalizeCartEnterpriseSubsidyBudget` の null 返却（loader は値を返したがスキーマ不一致）もログなしで握りつぶされます。budget が null になるとカートの補助額表示が replay なしにフォールバックするため、ユーザーからは「割引が出ない」としか見えず原因を追跡できません → catch 節で `reportClientError(error, { componentInfo: 'cartMonthlyUsage.fetchCartEnterpriseSubsidyBudget', severity: 'warn' })` を呼び、loader が非 null を返したのに normalize が null になったケースも報告してください。

**コメント要約**: budget 取得・正規化の失敗が完全に無言。<br>`reportClientError` で調査可能にする。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 自動修正の対象外とした。`reportClientError` を import すると `@shokujii/base/firebase` / `firebase/auth` が評価され、現状モックを持たない `cartMonthlyUsage.test.ts` の実行に影響しうる（`event.test.ts` は両者を `vi.mock` している）。報告を composable 側で行うか呼び出し側の `cart.vue` に戻すかで方針が一意に定まらないため、テスト追補とあわせて別途対応する。

---

**識別子**: RC-26（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/useChatOpenEvent.ts:18`

**該当コード（レビュー時点の diff）**:

```diff
+    try {
+      const event = await fetchEventInCommunityDocument(payload.communityId, payload.eventId)
+      if (event == null) {
+        return
+      }
+      void router.push(options.getEventPath(event.community_account, payload.eventId))
+    } catch {
+      // getDoc 失敗時（ネットワーク / 権限）: イベントハンドラからの unhandled rejection を防ぐ
+    }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 各 app から base composable へ集約した際に、失敗時の挙動（無反応）もそのまま持ち込まれています。チャットからイベントを開こうとして `getDoc` が権限エラー・ネットワークエラーになった場合、ユーザーには何も起きず、`reportClientError` も呼ばれないため発生自体を検知できません → catch 節で `reportClientError(err, { componentInfo: 'useChatOpenEvent', severity: 'warn' })` を呼び、あわせて `event == null`（削除済みイベント）との切り分けができるようにしてください。

**コメント要約**: チャットのイベント遷移失敗が無反応かつ無記録。<br>エラー報告と原因の切り分けを追加。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 自動修正の対象外とした。挙動自体は移設前から変わっておらず本 PR の新規欠陥ではない。ユーザーへ通知するか記録のみに留めるかは UX 仕様の判断を含む。

---

**識別子**: RC-27（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `common/src/schemas/Enterprise.ts:110`

**該当コード（レビュー時点の diff）**:

```diff
-  discount_type!: EnterpriseDiscountType
-  discount_value!: number
-  monthly_limit_per_user!: number
+  subsidy_settings_history!: z.infer<typeof EnterpriseSubsidySettingsEntryDbSchema>[]
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `EnterpriseSubsidySettings.ts` が `EnterpriseSubsidySettingsEntryType` を export しているのに、`z.infer<typeof EnterpriseSubsidySettingsEntryDbSchema>` で型を間接参照しています。RC-17 と同じく、公開済みの型エイリアスを直接使ってください → `subsidy_settings_history!: EnterpriseSubsidySettingsEntryType[]`。

**コメント要約**: `z.infer<typeof ...DbSchema>[]` で型を間接参照。<br>`EnterpriseSubsidySettingsEntryType` を直接使用。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-17 と同一方針で修正方法が一意のため手順 3b で自動修正。

---

**識別子**: RC-28（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/enterprise/subsidySettings.ts:39`

**該当コード（レビュー時点の diff）**:

```diff
+  const previousSettings = resolveEnterpriseSubsidySettingsForMonth(
+    enterprise.subsidy_settings_history,
+    effectiveFromMonth,
+  )
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `previousSettings` は監査ログの `old` 値を作るためだけに使われますが、`resolveEnterpriseSubsidySettingsForMonth` は素の `Error` を throw するため、該当月以前のエントリが 1 件も無い履歴では Callable が `internal` で失敗し、**設定の保存そのものができなくなります**（`createEnterprise` が作成月のエントリを必ず入れるため通常は到達しませんが、監査ログの都合で本処理を落とすのは過剰です）。→ RC-13 の OrNull 移行対象に含め、`resolveEnterpriseSubsidySettingsForMonthOrNull` を使って `old` を `null` にするか、`HttpsError` へ変換してください。

**コメント要約**: 監査ログ old 値の解決に throw 版を使用。<br>解決不能時に設定保存自体が internal で失敗する。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 自動修正の対象外とした。`old` を null にするか `HttpsError` へ変換するかで監査ログの表現が変わり、方針が一意に定まらない。RC-13（OrNull 移行）の残タスクとあわせて判断する。

---

**識別子**: RC-29（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:33`

**該当コード（レビュー時点の diff）**:

```diff
+export type EnterpriseSubsidyRecalculatedAudit = {
+  details: {
+    expected: (number | undefined)[]
+    stored: (number | null)[]
+  }
+}
...
+        details: {
+          expected: replay.expectedAmounts,
+          stored: storedBeforeRecalc,
+        },
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `replay.expectedAmounts` は補助対象外の注文で `undefined` を含む `(number | undefined)[]` です。本プロジェクトは `ignoreUndefinedProperties` を設定していないため、配列要素の `undefined` は Firestore Admin SDK が `Cannot use "undefined" as a Firestore value` で拒否します。`writeAuditLog` はベストエフォートで例外を握るため、**`enterprise_subsidy_recalculated` の監査ログだけが無言で欠落**します。しかも再計算が起きるのは上限到達・設定変更の直後、すなわち `undefined` が入りやすい局面です（同種の欠落は pr-2071 でも指摘済み）。`stored` は `?? null` 済みなので `expected` だけ漏れています → `expected: replay.expectedAmounts.map((amount) => amount ?? null)` とし、型も `(number | null)[]` に揃えてください。

**コメント要約**: 監査ログ `expected` 配列に undefined が混入。<br>Firestore 書き込み失敗で再計算ログが欠落する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 仕様判断を伴わず `stored` と同じ正規化を揃えるだけのため手順 3a で自動修正。`expected undefined 時に補助額フィールドを削除する` テストに `expected: [100, null]` の検証を追加した。

---

**識別子**: RC-30（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:178`

**該当コード（レビュー時点の diff）**:

```diff
+  for (let i = 0; i < orders.length; i++) {
+    ...
+        saveOrder(communityId, eventId, userId, orders[i], transaction)
+  }
   const used = member.monthly_usage[eventMonth] ?? 0
-  if (used + replay.subsidyTotal > event.enterprise_subsidy_settings.monthly_limit_per_user) {
+  if (used + replay.subsidyTotal > settings.monthly_limit_per_user) {
     throw new HttpsError('failed-precondition', '月額上限を超過しました。')
   }
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: 再計算した `pay_enterprise_subsidy_amount` を Transaction 内で書き戻した**後**に月額上限チェックで throw するため、上限超過時は Transaction が rollback され、再計算の書き戻しが破棄されます。`recalculatedAudit` も Transaction 成功後に記録する設計（RC-1）なので監査ログも残りません。結果として「月額上限を超過しました」だけが表示され、stored と replay のズレは次回確定時まで解消されないまま残ります → 上限チェックを replay 直後（書き戻し前）に移すか、再計算の書き戻しと上限判定を別 Transaction に分けることを検討してください。

**コメント要約**: 上限超過時に再計算の書き戻しが rollback される。<br>監査ログも残らず stored のズレが解消されない。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 自動修正の対象外とした。チェック順序の変更は「上限超過時にも再計算を確定させるか」という仕様判断を含み、RC-24 で確認済みの check 順序の設計意図にも触れる。

---

## 評価セッション（2026-08-15 19:34・review-comments-evaluate・auto）

- **評価日時**: 2026-08-15 19:34 JST
- **ブランチ名**: dev/enterprise-mvp-v4
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2257
- **REVIEW_REQUEST_SINCE**: 2026-08-15T10:24:43Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼コメント 5301805718、Codex 接続案内 5301809461）
- **手順 4a 自動修正**: なし（RC-31 は全 replay 経路への順序固定が必要で工数 M）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-31 | 3789190552 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 🐛 実害 | 🔧 微修正 | M | replay 順を carted_at+order_id に固定<br>sync / cart / addToCart で subsidy_recalculated ループ解消 |

---

**識別子**: RC-31（GitHub id: 3789190552・Codex）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:139`

**該当コード（レビュー時点の diff）**:

```diff
+  const replay = replayEnterpriseSubsidyAmountsForOrders(
+    event.event_payment,
+    settings,
+    orders,
+    member.monthly_usage[eventMonth] ?? 0,
+  )
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/M]: 月額上限の残枠が複数品目の途中で尽きる場合、補助額は配列順に依存しますが、ここへ渡る `orders` はカートの `updated_at desc` 順です。不一致時の `saveOrder` は保存のたびに `updated_at` を更新するため、例えば A=500円・B=100円だった補助を `[B, A]` で再計算すると両方を書き換えて次の購読順が `[A, B]` になり、再試行では再び逆の金額へ書き換わります。その結果 `subsidy_recalculated` が毎回返り、confirmOrder と Stripe Checkout のどちらにも永続的に進めません。`carted_at` と `order_id` など書き戻しで変化しないキーに全経路の replay 順を固定してください。

**コメント要約**: replay 順が updated_at desc で不安定。<br>再計算の書き戻しで順序が反転し subsidy_recalculated がループする。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 月額残枠の按分は replay 配列順に依存するため、順序がリクエスト／購読ごとに変わると補助額が反転しうる。Codex が示す subsidy_recalculated ループは実害あり。`carted_at` + `order_id` で全 replay 経路（sync / カート UI / addToCart）を固定する必要がある。Copilot は RC-29/27 の対応確認と RC-3/30 の再掲のみ（新規 RC なし）。

**対応内容**: `common/src/utils/eventMemberOrderSort.ts` に `compareEventMemberOrdersForEnterpriseSubsidyReplay` / `sortOrderIdsForEnterpriseSubsidyReplay` を追加。`syncEnterpriseSubsidyOrdersBeforeConfirm` で in-place sort、`cart.vue` の replay 表示・checkout `order_ids`、`addEnterpriseSubsidyMenusToCart` の既存カート usage 加算に適用。収束テストを `enterpriseSubsidyOrders.test.ts` に追加。

---
