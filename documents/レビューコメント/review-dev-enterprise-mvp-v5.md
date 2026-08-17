# ブランチ dev/enterprise-mvp-v5 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5302439929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | CORS Origin 解決の try-catch 冗長<br>trim 統一後に `new URL(trimmed).origin` のみで十分 |
| [ ] | RC-2 | 5302439929 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | preflight に Max-Age 未設定<br>低頻度 API のため任意だが設定検討可 |
| [x] | RC-3 | 5302439929 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 動的 CORS の http 許可の意図確認<br>RC-9（Codex インライン）で評価済み |
| [ ] | RC-4 | 5302439929 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | S | `orderIds` 引数が未使用<br>型から削除または deprecated 明示 |
| [x] | RC-5 | 5302439929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | `orders.sort` の破壊的操作を JSDoc 明記<br>公開 API の副作用を文書化 |
| [x] | RC-6 | 5302439929 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Transaction 内 read 順の ask<br>RC-11（Codex P1）で 🚨 として対応済み |
| [x] | RC-7 | 5302439929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | `carted_at` 欠損時のフォールバック未文書化<br>JSDoc に created_at → 0 を追記 |
| [ ] | RC-8 | 3789443880 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | 新規 addToCart でも replay と同じタイブレーク順<br>同一 carted_at 時 order_id 順不一致で recalculated |
| [ ] | RC-9 | 3789443883 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 動的 CORS で http Origin を拒否<br>本番テナントは https のみ、localhost は静的 CORS |
| [x] | RC-10 | 3789440623 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Origin trim 不整合で許可判定と返却 Origin がズレる<br>`trim()` を入口で一貫適用 |
| [x] | RC-11 | 3789443876 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | saveMember write 後の getOrdersInCart read<br>初回参加者の addToCart が Transaction 失敗 |
| [ ] | RC-12 | 5318372077 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | EnterpriseBillInvoiceCorsResponse 型追加は deploy 互換として妥当 |
| [ ] | RC-13 | 5318372077 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 403 時 CORS ヘッダーなしは許可外 Origin の意図どおり |
| [ ] | RC-14 | 5318372077 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Origin trim 回帰テスト追加は妥当 |
| [ ] | RC-15 | 3797691526 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 📋 仕様追加 | M | ハイフン除去後の請求書番号が enterprise_id 間で衝突しうる |

---

## 評価セッション（2026-08-17 18:22・review-comments-evaluate）

- **評価日時**: 2026-08-17 18:22 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: `dev/enterprise-mvp-v5`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2274
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文 id:5302407096、Codex 接続案内 id:5302440491）
- **手順 4a 自動修正**: RC-1, RC-5, RC-7, RC-10, RC-11（🚨 2件 / 🟡 3件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5302439929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | CORS Origin 解決の try-catch 冗長<br>trim 統一後に `new URL(trimmed).origin` のみで十分 |
| [ ] | RC-2 | 5302439929 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | preflight に Max-Age 未設定<br>低頻度 API のため任意だが設定検討可 |
| [x] | RC-3 | 5302439929 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 動的 CORS の http 許可の意図確認<br>RC-9（Codex インライン）で評価済み |
| [ ] | RC-4 | 5302439929 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | S | `orderIds` 引数が未使用<br>型から削除または deprecated 明示 |
| [x] | RC-5 | 5302439929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | `orders.sort` の破壊的操作を JSDoc 明記<br>公開 API の副作用を文書化 |
| [x] | RC-6 | 5302439929 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Transaction 内 read 順の ask<br>RC-11（Codex P1）で 🚨 として対応済み |
| [x] | RC-7 | 5302439929 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S | `carted_at` 欠損時のフォールバック未文書化<br>JSDoc に created_at → 0 を追記 |
| [ ] | RC-8 | 3789443880 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💾 データ | 📋 仕様追加 | M | 新規 addToCart でも replay と同じタイブレーク順<br>同一 carted_at 時 order_id 順不一致で recalculated |
| [ ] | RC-9 | 3789443883 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | 動的 CORS で http Origin を拒否<br>本番テナントは https のみ、localhost は静的 CORS |
| [x] | RC-10 | 3789440623 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Origin trim 不整合で許可判定と返却 Origin がズレる<br>`trim()` を入口で一貫適用 |
| [x] | RC-11 | 3789443876 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 💾 データ, 🐛 実害 | 🔧 微修正 | S | saveMember write 後の getOrdersInCart read<br>初回参加者の addToCart が Transaction 失敗 |

---

**識別子**: RC-1（GitHub id: 5302439929・PR トップレベル・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBillInvoiceCors.ts:48–53`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし・Copilot トップレベル内コード例）

**レビュワーのコメント（原文）**:

### `functions/default/src/utils/enterpriseBillInvoiceCors.ts` L48–53

**[nits]** `resolveEnterpriseBillInvoiceCorsOrigin` の末尾 try-catch が冗長です。`isOriginAllowedForEnterprise` 内で既に `new URL(origin.trim())` のパースに成功していることが保証されており、その直後に `new URL(origin).origin` を呼んでも例外は発生しません。防御的コーディングとして残すなら理解できますが、`isOriginAllowedForEnterprise` を通過した時点で `origin` は有効な URL 文字列なので try-catch は不要です。

**コメント要約**: `resolveEnterpriseBillInvoiceCorsOrigin` 末尾の try-catch は冗長。<br>trim 統一後は `new URL(trimmedOrigin).origin` の直接 return で十分。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-10 の trim 統一と同時に try-catch を除去し `return new URL(trimmedOrigin).origin` に簡略化済み。

---

**識別子**: RC-2（GitHub id: 5302439929・PR トップレベル・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBillInvoiceCors.ts:22–25`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

### `functions/default/src/utils/enterpriseBillInvoiceCors.ts` L22–25

**[imo]** preflight レスポンスに `Access-Control-Max-Age` が設定されていません。ブラウザは毎回 OPTIONS リクエストを送信するため、`Access-Control-Max-Age: 600` 程度を設定するとプリフライトを削減できます。請求書 API は利用頻度が低いので許容範囲ですが、設定を検討してください。

**コメント要約**: preflight に `Access-Control-Max-Age` が無い。<br>請求書 API は低頻度のため優先度低いが、プリフライト削減の設定を検討可。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 原文に「検討」があり必須ではない。自動修正対象外。必要なら `applyEnterpriseBillInvoiceCorsHeaders` に Max-Age 追加。

---

**識別子**: RC-3（GitHub id: 5302439929・PR トップレベル・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBaseDomain.ts:42–43`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

### `functions/default/src/utils/enterpriseBaseDomain.ts` L42–43

**[ask]** `http:` も許可対象に含まれています（`parsed.protocol !== 'https:' && parsed.protocol !== 'http:'`）。本番環境では `https:` のみが想定されると思いますが、開発環境（localhost 等）向けに意図的に `http:` を許可しているでしょうか。もし開発環境専用の配慮であれば、コメントで意図を明記するか、静的 CORS リスト（`process.env.CORS`）で対応できるため、動的テナント判定では `https:` のみに絞ることを検討してください。

**コメント要約**: 動的 CORS が http Origin も許可している意図の確認。<br>RC-9（Codex インライン）と同一論点のため本 RC では重複評価を省略。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: Codex インライン RC-9 で同一指摘を評価。ask 形式の重複のため本 RC は 👌 とし、対応判断は RC-9 に集約。

---

**識別子**: RC-4（GitHub id: 5302439929・PR トップレベル・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:125–143`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

### `functions/default/src/utils/enterpriseSubsidyOrders.ts` L125–143

**[imo]** `syncEnterpriseSubsidyOrdersBeforeConfirm` のパラメータ型に `orderIds: string[]` が残っていますが、関数内では使われていません（`orders.sort(...)` から `sortedOrderIds` を算出するようになったため）。呼び出し側が `orderIds` を渡しても無視されるため、型から削除するか、`/** @deprecated 現在は使用されていません */` などのコメントを追加して意図を明確にすることを検討してください。

**コメント要約**: `orderIds` 引数が未使用で呼び出し側を混乱させる。<br>型削除または deprecated コメントで意図を明確化すべき。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 指摘は妥当。`memberOrders.ts` / `stripe.ts` の呼び出しシグネチャ変更が必要で 📐 リファクタ。自動修正対象外（別タスクで対応可）。

---

**識別子**: RC-5（GitHub id: 5302439929・PR トップレベル・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:141`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

### `functions/default/src/utils/enterpriseSubsidyOrders.ts` L141

**[nits]** `orders.sort(...)` は引数の配列を in-place で変更します（破壊的操作）。呼び出し側でこの副作用を認識できるよう、関数先頭のコメントや JSDoc に「引数 `orders` を破壊的にソートする」旨を明記すると親切です。テストでは `ordersFirstTry.map((o) => o.order_id)` が変更後の順序を期待しているため意図的であることは分かりますが、公開 API として文書化しておく価値があります。

**コメント要約**: `syncEnterpriseSubsidyOrdersBeforeConfirm` が `orders` を in-place ソートする副作用。<br>JSDoc で破壊的操作を明記すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: `orders.sort` 直前に JSDoc コメントを追加済み。

---

**識別子**: RC-6（GitHub id: 5302439929・PR トップレベル・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:317–322`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

### `functions/default/src/utils/enterpriseSubsidyOrders.ts` L317–322（`addEnterpriseSubsidyMenusToCart`）

**[ask]** `getOrdersInCart` がトランザクション内の追加読み取りとして呼ばれています。Firestore のトランザクションでは「すべての読み取りが書き込みより先に完了する必要がある」という制約がありますが、この読み取りは既存の `getEnterpriseMemberInTransaction` 等の後に追加されています。トランザクション内の読み取り順に問題ないことを確認済みでしょうか。

**コメント要約**: Transaction 内で write 後に read していないかの確認。<br>RC-11（Codex P1）が同一箇所を 🚨 で指摘済み。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 根本原因は `memberOrders.ts` の `saveMember` write 登録後に `getOrdersInCart` が走る点。RC-11 で 🚨 対応済み。

---

**識別子**: RC-7（GitHub id: 5302439929・PR トップレvel・Copilot）

**レビュワー**: Copilot

**指摘箇所**: `common/src/utils/eventMemberOrderSort.ts:18`

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

### `common/src/utils/eventMemberOrderSort.ts` L18

**[nits]** `enterpriseSubsidyReplayCartedAt` で `carted_at ?? created_at ?? 0` とフォールバックしていますが、コメント（「carted_at 昇順」）と実装のフォールバック仕様が文書化されていません。`carted_at` がない注文が混在した場合の挙動について、JSDoc にフォールバック仕様を追記することを検討してください。

**コメント要約**: replay 順の `carted_at` フォールバック（created_at → 0）が JSDoc 未記載。<br>仕様を JSDoc に追記すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: `enterpriseSubsidyReplayCartedAt` と `compareEventMemberOrdersForEnterpriseSubsidyReplay` の JSDoc にフォールバック仕様を追記済み。

---

**識別子**: RC-8（GitHub id: 3789443880）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `common/src/utils/eventMemberOrderSort.ts:32`

**該当コード（レビュー時点の diff）**:

```diff
@@ -14,3 +14,28 @@ export const compareEventMemberOrdersForPartnerDetail = (a: EventMemberOrder, b:
 export const sortEventMemberOrdersForPartnerDetail = (orders: EventMemberOrder[]): EventMemberOrder[] => {
   return [...orders].sort(compareEventMemberOrdersForPartnerDetail)
 }
+
+const enterpriseSubsidyReplayCartedAt = (order: EventMemberOrder): number => order.carted_at ?? order.created_at ?? 0
+
+/**
+ * enterprise_subsidy の replay / addToCart / confirmOrder で共通の並び。
+ * carted_at 昇順 → order_id 昇順（updated_at は書き戻しで変わるため使わない）。
+ */
+export const compareEventMemberOrdersForEnterpriseSubsidyReplay = (
+  a: EventMemberOrder,
+  b: EventMemberOrder,
+): number => {
+  const cartedDiff = enterpriseSubsidyReplayCartedAt(a) - enterpriseSubsidyReplayCartedAt(b)
+  if (cartedDiff !== 0) {
+    return cartedDiff
+  }
+  return a.order_id.localeCompare(b.order_id)
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  新規注文にも同じタイブレーク順を適用してください**

月額残枠が複数品目の途中で尽き、同じ `addToCart` ループで作られた注文の `carted_at` が同一ミリ秒になる場合、初回の補助額はリクエストのメニュー順で割り当てられる一方、確定前 replay はこのランダムな `order_id` 順で割り当てます。ID 順が作成順と逆になると、並行更新がなくても初回確定で `subsidy_recalculated` が返り、利用者は同じ内容を再度確定しなければなりません。新規注文の ID を先に生成してこの比較順で補助額を割り当てるなど、保存時と replay 時の順序を一致させてください。

Useful? React with 👍 / 👎.

**コメント要約**: addToCart 初回割当はメニュー順、replay は order_id 順で不一致になりうる。<br>同一 carted_at 時に初回確定で recalculated が返る。addToCart 側も replay 順で割当すべき。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘は妥当。`createOrder` が Firestore doc ID を都度生成するため、addToCart ループ内の補助額割当順と replay 順を一致させるには order_id 事前生成または割当ロジック変更が必要。工数 M のため自動修正対象外。

---

**識別子**: RC-9（GitHub id: 3789443883）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `functions/default/src/utils/enterpriseBaseDomain.ts:42`

**該当コード（レビュー時点の diff）**:

```diff
@@ -31,6 +31,23 @@ export function resolveEnterpriseAppHost(
   return getEnterpriseSubdomainHost(enterprise.subdomain)
 }
 
+/** Origin が当該 enterprise の許可ホスト（subdomain.base / custom_domain）に一致するか */
+export function isOriginAllowedForEnterprise(
+  origin: string,
+  enterprise: Pick<Enterprise, 'subdomain' | 'custom_domain'>,
+): boolean {
+  const allowedHosts = getAllowedEnterpriseHosts(enterprise)
+  try {
+    const parsed = new URL(origin.trim())
+    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  動的 CORS では平文 HTTP のテナント Origin を拒否してください**

テナントのホスト名さえ一致すれば `http:` も許可されるため、利用者が平文 HTTP 側で認証した場合や信頼できないネットワーク上で HTTP ページを開いた場合、その Origin に配信・改ざんされたコードも請求書エンドポイントのレスポンスを CORS 経由で読み取れます。ホスト名の一致だけでは通信経路の信頼性を保証できないので、動的に許可する本番テナントは `https:` のみにし、エミュレータ用途の HTTP が必要なら localhost または静的な開発用 Origin だけを明示的に例外化してください。

**コメント要約**: 動的 CORS がテナント hostname 一致で http を許可し MITM リスク。<br>本番テナントは https のみ。localhost 等は静的 CORS で例外化。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: セキュリティ上妥当。🔒 ラベルのため 🟡 自動修正対象外。`isOriginAllowedForEnterprise` を https のみに絞り、開発用 http は `process.env.CORS` 静的リストに委ねる方針が自然。

---

**識別子**: RC-10（GitHub id: 3789440623）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBillInvoiceCors.ts:53`

**該当コード（レビュー時点の diff）**:

```diff
+  if (!isOriginAllowedForEnterprise(origin, enterprise)) {
+    return undefined
+  }
+
+  try {
+    return new URL(origin).origin
+  } catch {
+    return undefined
+  }
```

**レビュワーのコメント（原文）**:

[must] `isOriginAllowedForEnterprise` は `origin.trim()` を前提に判定しているのに、ここでは `new URL(origin)` / `staticOrigins.includes(origin)` で trim していないため、Origin ヘッダーに前後スペースが混入すると許可判定と最終的な Origin 解決が不整合になります。`origin` は最初に trim した値を以後の比較・URL 生成に一貫して使ってください。

**コメント要約**: Origin ヘッダーの trim 不整合で許可判定と返却 Origin がズレる。<br>入口で trim し以降一貫して trimmed 値を使用すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: CORS 許可ヘッダーと判定ロジックの不整合は実害あり。`resolveEnterpriseBillInvoiceCorsOrigin` 入口で `trim()` を適用し static / dynamic 判定・返却すべてに使用。テスト追加済み。

---

**識別子**: RC-11（GitHub id: 3789443876）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `functions/default/src/utils/enterpriseSubsidyOrders.ts:321`

**該当コード（レビュー時点の diff）**:

```diff
   const tracker = createEnterpriseSubsidyAddToCartTracker(entMember.monthly_usage[eventMonth] ?? 0)
+  const existingInCart = sortEventMemberOrdersForEnterpriseSubsidyReplay(
+    await getOrdersInCart(communityId, eventId, userId, transaction),
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  カート照会をトランザクションの write 前へ移動してください**

エンタープライズイベントへ初めて注文する場合、呼び出し元の `memberOrders.ts` は `saveMember(..., transaction)` で write を登録してからこの `getOrdersInCart(..., transaction)` を実行します。Firestore はトランザクション内の write 後の read を拒否するため、新規参加者（または既存 member の `enterprise_id` が未設定の利用者）は商品をカートへ追加できません。既存カートの取得を `saveMember` より前に移すなど、全 read を write より先に完了させてください。

**コメント要約**: `saveMember` write 後に `getOrdersInCart` read があり Transaction 制約違反。<br>初回 enterprise 参加者の addToCart が失敗する実バグ。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 💾 データ, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `memberOrders.ts` で `saveMember` 前に `getOrdersInCart` を実行し `existingInCart` として `addEnterpriseSubsidyMenusToCart` に渡すよう修正。関数側も `existingInCart` 省略時のみ read する後方互換を維持。

---

## 評価セッション（2026-08-18 03:01・review-comments-evaluate auto）

- **評価日時**: 2026-08-18 03:01 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・wait wake）
- **ブランチ名**: `dev/enterprise-mvp-v5`
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2274
- **REVIEW_REQUEST_SINCE**: 2026-08-17T17:53:26Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（依頼コメント id:5318362993、Codex 接続案内 id:5318372979）
- **重複スキップ**: Copilot `orderIds` 指摘は既存 RC-4 と同一のため新規 RC なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-12 | 5318372077 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | EnterpriseBillInvoiceCorsResponse 型追加は deploy 互換として妥当 |
| [ ] | RC-13 | 5318372077 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 403 時 CORS ヘッダーなしは許可外 Origin の意図どおり |
| [ ] | RC-14 | 5318372077 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Origin trim 回帰テスト追加は妥当 |
| [ ] | RC-15 | 3797691526 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 💰 金銭 | 📋 仕様追加 | M | ハイフン除去後の請求書番号が enterprise_id 間で衝突しうる |

---

**識別子**: RC-12（GitHub id: 5318372077・Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBillInvoiceCors.ts:4–8`

**該当コード（レビュー時点の diff）**:

```typescript
export type EnterpriseBillInvoiceCorsResponse = {
  setHeader(name: string, value: string): unknown
  status(code: number): { send(body?: unknown): unknown }
}
```

**レビュワーのコメント（原文）**:

**[fyi]** `EnterpriseBillInvoiceCorsResponse` の最小インターフェースが追加され、`express.Response` 直接依存が解消されています。`status(code).send(body?)` のチェーン型も正しく定義されており、deploy ビルドの TS2345 解消として適切な対応です。

**コメント要約**: CORS Response 最小型は deploy ビルド互換として妥当。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 意図どおりの型分離。追加対応不要。

---

**識別子**: RC-13（GitHub id: 5318372077・Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBillInvoiceCors.ts:82`

**該当コード（レビュー時点の diff）**:

（403 応答時に `allowedOrigin == null` のため CORS ヘッダー未付与）

**レビュワーのコメント（原文）**:

**[nits]** `res.status(403).send('Forbidden')` の場合、`applyEnterpriseBillInvoiceCorsHeaders` で CORS ヘッダーは付いていません（`allowedOrigin == null` なので）。許可外 Origin からの fetch では CORS エラーが先に発生するため、403 のボディがブラウザに届かないことが多いですが、意図した挙動であればこのままで問題ありません。

**コメント要約**: 許可外 Origin の 403 で CORS ヘッダーなしはブラウザ上 CORS エラーになるが意図どおり。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: セキュリティ上、許可外 Origin へ CORS を返さないのは正しい。RC-9（https 限定）と整合。

---

**識別子**: RC-14（GitHub id: 5318372077・Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/enterpriseBillInvoiceCors.test.ts:60–74`

**該当コード（レビュー時点の diff）**:

（Origin trim 許可テスト追加）

**レビュワーのコメント（原文）**:

**[fyi]** `Origin 前後スペースを trim して許可判定する` テストが追加されています。前回指摘（Origin trim 一貫性）の回帰テストとして機能しており、修正の意図が明示されています。

**コメント要約**: trim 回帰テストは RC-10 対応の妥当な補強。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: テスト追加のみ。対応不要。

---

**識別子**: RC-15（GitHub id: 3797691526）

**レビュワー**: Codex

**指摘箇所**: `common/src/utils/enterpriseInvoice.ts:75`

**該当コード（レビュー時点の diff）**:

```typescript
export function buildEnterpriseInvoiceNumber(enterpriseId: string, yearMonth: string): string {
  const prefix = enterpriseId.replace(/-/g, '').slice(0, 8)
  return `${prefix}-${yearMonth.replace('-', '')}`
}
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  ハイフン除去後も請求書番号を一意にしてください**

`enterprise_id` には `company-a` と `companya` のような値をどちらも登録できますが、この正規化では両方が同月に `companya-202607` となります。変更前は先頭8文字にハイフンが残るためこの組み合わせを区別できており、変更後は別企業の請求書に同一番号が印字されて照合や経理処理を誤るため、ハイフンを除去する場合も元IDを区別できる短縮方式にしてください。

**コメント要約**: `company-a` と `companya` が同一請求書番号 `companya-YYYYMM` に正規化され衝突しうる。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 💰 金銭

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘は妥当。ただし enterprise_id の登録制約（Firestore 上の一意性）や PDF 表示要件の確認が必要。ハッシュ短縮・Firestore doc id 利用等は仕様判断が要るため自動修正対象外。

---
