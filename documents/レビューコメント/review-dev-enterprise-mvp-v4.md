# ブランチ dev/enterprise-mvp-v4 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-1 | 5301079804 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | トランザクション内 writeAuditLog はリトライで重複リスク<br>成功後に 1 回だけ書く構成へ分離が必要 |
| [ ] | RC-2 | 3788825683 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 適用開始月変更時にフォームへ当該月の設定を反映<br>save 後に effectiveFromMonth と v-model が不整合 |
| [ ] | RC-3 | 3788825678 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | subsidy_settings_history 更新を Transaction 化<br>同時保存で read-modify-write 競合 |
| [x] | RC-4 | 3788825680 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | S | saveMember 前に Enterprise 読み取りが必要<br>Firestore Transaction の read-after-write 違反を解消 |
| [ ] | RC-5 | 3788825688 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | M | Stripe 再同期で event を Transaction 内で再読<br>トランザクション外 snapshot の陳腐化リスク |
| [x] | RC-6 | 3788806446 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | 監査ログ stored が再計算後値<br>更新前スナップショットを記録するよう修正 |
| [x] | RC-7 | 3788825667 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | expected undefined 時 merge ではフィールド削除不可<br>FieldValue.delete() で明示削除 |
| [x] | RC-8 | 3788806470 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | RC-7 と同一（Copilot [must]）<br>clearOrderPayEnterpriseSubsidyAmount で対応 |
| [ ] | RC-9 | 3788825673 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | sync 内 writeAuditLog は Transaction 外へ<br>RC-1 と同一論点 |
| [x] | RC-10 | 3788825676 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | RC-6 と同一（Codex P2）<br>storedBeforeRecalc で対応 |

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
| [ ] | RC-1 | 5301079804 | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | トランザクション内 writeAuditLog はリトライで重複リスク<br>成功後に 1 回だけ書く構成へ分離が必要 |
| [ ] | RC-2 | 3788825683 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | 適用開始月変更時にフォームへ当該月の設定を反映<br>save 後に effectiveFromMonth と v-model が不整合 |
| [ ] | RC-3 | 3788825678 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | subsidy_settings_history 更新を Transaction 化<br>同時保存で read-modify-write 競合 |
| [x] | RC-4 | 3788825680 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | S | saveMember 前に Enterprise 読み取りが必要<br>Firestore Transaction の read-after-write 違反を解消 |
| [ ] | RC-5 | 3788825688 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ, 💰 金銭 | 🔧 微修正 | M | Stripe 再同期で event を Transaction 内で再読<br>トランザクション外 snapshot の陳腐化リスク |
| [x] | RC-6 | 3788806446 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ | 🔧 微修正 | S | 監査ログ stored が再計算後値<br>更新前スナップショットを記録するよう修正 |
| [x] | RC-7 | 3788825667 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | expected undefined 時 merge ではフィールド削除不可<br>FieldValue.delete() で明示削除 |
| [x] | RC-8 | 3788806470 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💰 金銭, 💾 データ | 🔧 微修正 | S | RC-7 と同一（Copilot [must]）<br>clearOrderPayEnterpriseSubsidyAmount で対応 |
| [ ] | RC-9 | 3788825673 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📐 リファクタ | M | sync 内 writeAuditLog は Transaction 外へ<br>RC-1 と同一論点 |
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

**コメント要約**: トランザクション内の監査ログ書き込みと stored 記録の 2 点。<br>stored は RC-6/10 で自動修正済み。監査ログの Transaction 外移動は RC-9 と同一で未着手。

**評価**: 🚨 必須修正

**ステータス**: 未着手（stored 部分は RC-6 で ✅。監査ログ Transaction 分離は RC-9 と同一論点）

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: Firestore Transaction リトライ時の副作用は shokujii-code-review の Transaction 節に反する。stored 退避は妥当で `storedBeforeRecalc` により解消済み。監査ログ分離は呼び出し側 API 変更が必要。

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

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: RC-1 と同一。recalculated フラグと audit payload を返し呼び出し側で post-commit 書き込みが必要。工数 M。

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
