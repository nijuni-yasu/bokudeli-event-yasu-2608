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
| [ ] | RC-20 | なし | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 📏 規約 | 🔧 微修正 | S | エージェント一時ファイル pr-body-2257.md がステージ済み<br>PR コミットから除外する |

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

**ステータス**: 未着手

**PRスコープ**: 📤 スコープ外

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 実装品質には無関係だが、コミット hygiene 上除外すべき。📤 スコープ外のため本 PR 必須ではない。

---
