# EventMemberOrder 移行 PR に対するレビュー指摘のタスク管理

## 目的

PR 1880 および関連レビューで挙がったうち、対応を検討すべき項目をタスク化し、精査した内容と想定対応を記録する。

参照: GitHub PR nijuniinc/bokudeli-event-new の 1880 番、Copilot / Codex の未返信スレッドを中心に整理。

## 凡例

- 状態: 未着手 / 進行中 / 保留 / 完了
- 優先度: P0 最優先 / P1 早め / P2 計画

---

## タスク一覧

| ID | 優先度 | 状態 | 概要 |
|----|--------|------|------|
| R01 | P1 | 未着手 | Firestore ルール末尾の広い read 許可と stripes の本人 read の関係を整理する |
→ イシュー：https://github.com/nijuniinc/bokudeli-event-new/issues/1882

| R02 | P1 | 未着手 | createStripeCheckoutSession のログから決済・PII に繋がるオブジェクト全体を除外する |
→ ログ表示について、現状ままでよしとする

| R03 | P1 | 未着手 | カート画面の ConfirmDialog を非推奨から移行する |
→ 現状ままでよしとする

| R04 | P1 | 未着手 | stripeWebhook の冪等早期 return でも community.addMember を補完できるようにする |
→ 現状ままでよしとする
→ 設計検討（addMember を member_orders トリガー系に寄せる統一案）: https://github.com/nijuniinc/bokudeli-event-new/issues/1906

| R05 | P2 | 保留 | stripes ドキュメントの payment_intent 一意性と並行作成の設計を見直す |
→ Payment Intent をドキュメント ID にはしない方針。上記の具体対応は保留（下記「対応方針」）

| R06 | P1 | 完了 | stripeWebhook で想定外ステータス時の HTTP 応答と Stripe 再送の関係を整理する |
→ 注文欠損は 400、想定外ステータスはログのうえ 200（`stripeWebhook.ts`）

| R07 | P1 | 完了 | createStripeCheckoutSession で order_ids の重複を拒否または正規化する |
→ Callable で重複時は `invalid-argument`（`stripe.ts`）

| R08 | P1 | 完了 | stripeWebhook でメタデータの orderIds を重複排除してから処理する |
→ メタデータに重複があればログのうえ 400（`stripeWebhook.ts`）

| R09 | P1 | 完了 | stripes 更新の read-modify-write をトランザクション等で競合安全にする |
→ `cancelOrders` は返金 API 成功後に `runTransaction` で refunds 追記。`eventReceipt` は採番を `runTransaction` 内で実施

| R10 | P1 | 完了 | createEventMembers：イベント取得と community 整合（`getEventInCommunity`・`community_id` 検証） |
→ `functions/default/src/stores/event.ts` / `eventMembers.ts`（詳細は「### R10」）

| R11 | P1 | 未着手 | createEventMembers：トリガー過剰実行の抑制（`before`/`after` ガードや差分更新） |
→ イシュー：https://github.com/nijuniinc/bokudeli-event-new/issues/1904

| R12 | P1 | 未着手 | createEventMembers：`updated_by` の意味の整理（システム更新 ID 等） |
→ イシュー：https://github.com/nijuniinc/bokudeli-event-new/issues/1905

| R13 | P1 | 完了 | createEventMembers：`event.members` 更新のトランザクション化（並行競合対策） |
→ `runTransaction` 内で `getEventInCommunity`→`getOrders`→`updateEvent`（詳細は「### R13」）

| R14 | P2 | 保留 | Checkout metadata の orderIds 連結長と Stripe のメタデータ上限への対策 |
→ 実装工数のため対応しない（下記「対応方針」）


---

## 各タスクの精査内容

### R01 Firestore ルールと stripes の read

- **対象**: firestore.rules 末尾の match document=** での read 許可、および communities 配下 events stripes の本人 read。
- **指摘の要旨**: ワイルドカード側で広く read が許可されるため、stripes に書いた本人限定 read の効果がクライアント向けにどう見えるかが論点。
- **精査**: 現状ルールではクライアントが任意パスを読める前提の設計になっている。stripes のフィールドを秘匿したい場合は、クライアント read の範囲自体を狭める大きな変更になる。
- **想定対応**: セキュリティ要件を文章化したうえで、ワイルドカード read の縮小可否、または stripes をクライアントから読まない方針にするかを決める。単純に stripes だけ厳しくしても末尾ルールで打ち消される点をレビューに返信で明示する。
- **依存**: プロダクトと Firebase ルール担当の合意。

#### 元のレビューコメント

PR 1880 上の該当インラインコメント原文。行番号は当時のもの。

**copilot-pull-request-reviewer**（firestore.rules）

> [must] `match /stripes/{stripeId}` で「本人のみ read」としていても、ファイル末尾の `match /{document=**} { allow read: if true }` によって全ドキュメントが read 許可されているため、この制限が実質効きません。決済情報（payment_intent 等）を秘匿したいなら、グローバル read 許可をやめて必要なコレクションだけ明示的に allow するか、少なくとも `stripes` を含むパスを read 不許可にするルール設計に変更してください。

**chatgpt-codex-connector**（firestore.rules）

> **<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  stripes の本人限定 read ルールを実効化する**
>
> `stripes` に「本人のみ read」を追加していますが、下位に `match /{document=**} { allow read: if true }` が残っているため、この条件は実質無効です。結果として `payment_intent` や返金履歴を含む `stripes` ドキュメントが未認証ユーザーにも読めてしまい、今回移行した決済情報の秘匿が達成できていません。
>
> Useful? React with 👍 / 👎.

---

### R02 createStripeCheckoutSession のログ

- **対象**: functions/default/src/stripe.ts の logger.info に渡す stripeRequest。現状は sessionParams 全体を載せている。
- **指摘の要旨**: success_url や orderIds などがログに残り、PII や決済文脈の過剰保持になる。
- **精査**: デバッグに必要なのは sessionId と件数、イベント ID 程度で足りることが多い。
- **想定対応**: ログには session.id と eventId、communityId、userId、orderCount のみにする。必要なら redact した要約フィールドのみ追加。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/stripe.ts）

> [must] `stripeRequest: sessionParams` をそのまま構造化ログに出すと、`success_url`（ユーザー識別子を含む可能性）や `orderIds` などの情報がログに永続化され、PII/決済関連情報の過剰ログになります。トラブルシュート目的なら必要最小限（sessionId / eventId / orderCount 等）のみに絞るか、`NODE_ENV` 等でデバッグ時のみ出力するようにしてください。

---

### R03 カート画面の ConfirmDialog

- **対象**: base/src/components/pages/cart.vue の ConfirmDialog 利用。
- **指摘の要旨**: ConfirmDialog.vue が Deprecated とされており、新規や改修では v-dialog パターンへ寄せたい。
- **精査**: 同ファイル内の確認ダイアログを Materio Vuetify のダイアログ実装に置き換える工数は画面単位で完結しうる。
- **想定対応**: ConfirmDialog をやめ、既存の v-dialog 利用箇所に合わせて文言とイベントハンドラを移植する。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（base/src/components/pages/cart.vue）

> [must] ConfirmDialog はコンポーネント側で Deprecated と明記されているため、新規/改修コードでの利用は避けたいです（`base/src/components/ConfirmDialog.vue` 冒頭コメント参照）。この画面は `v-dialog` へ置き換えるか、既存の `v-dialog` 実装パターンに合わせて移行してください。
> ```suggestion
>
> ```

---

### R04 stripeWebhook の早期 return と community.addMember

- **設計検討（関連イシュー）**: https://github.com/nijuniinc/bokudeli-event-new/issues/1906 — Webhook での addMember 補完以外に、createEventMembers と同系のトリガーへ寄せて統一する案
- **対象**: functions/default/src/stripeWebhook.ts。getStripeByPaymentIntent が既に非 null のとき 200 で return する分岐。
- **指摘の要旨**: 前回実行が Stripe ドキュメント作成後に失敗し addMember が未実行のままだと、再送でも早期 return で補完されない。
- **精査**: 成功経路ではトランザクション後に addMember している。重複時のみ早期 return なので、冪等に addMember を毎回試すか、existingStripe 分岐でも addMember のみ実行するかが選択肢。
- **想定対応**: community.addMember が冪等なら、existingStripe 時も addMember を呼んでから 200 を返す。コストと整合性のトレードオフをコメントで残す。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/stripeWebhook.ts）

> [must] Stripe Webhook の冪等性ファストパスで `existingStripe != null` の場合にそのまま return しているため、前回実行が「Stripe doc 作成後〜`community.addMember` 実行前」に失敗したケースだと、以後のリトライでコミュニティ参加が補完されず不整合が残り得ます。`existingStripe` の場合でも `community.addMember(userId)` は必ず実行する（idempotent なはずなので常に実行）か、参加処理もトランザクション側／別の確実な経路で担保してください。

---

### R05 stripes の payment_intent 一意性

- **対象**: memberOrder ストアの createStripeDoc と getStripeByPaymentIntent、stripeWebhook トランザクション。
- **指摘の要旨**: クエリ存在確認とランダム ID 作成の組み合わせでは、極端な並行で二重作成の理論リスクが残る。ドキュメント ID を payment_intent に寄せる案。
- **精査**: 既にトランザクション内で再チェックしているが、レビューは読み取りロックの観点から追加の堅牢化を求めている。
- **想定対応（当初）**: ID を決定論的にする、または mapping コレクションを transaction で先に取る、のいずれかを設計レビューで決める。データ移行の影響が大きい場合は P2 で別 Issue に分離可。
- **対応方針（決定）**: `payment_intent` を Firestore のドキュメント ID として用いる案は採用しない（パス上に決済識別子を主キーとして載せることへの配慮）。並行時の二重作成抑止や一意性担保のための mapping コレクション・`transaction.create` による衝突検知など、別手段での堅牢化は必要になったタイミングで再検討する。現時点では **対応保留** とする。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/stripeWebhook.ts）

> [must] `getStripeByPaymentIntent` による冪等性チェックがトランザクション外にあるため、Webhook が並行実行された場合に双方が「未作成」と判断して別々の Stripe ドキュメントを作成しうる（重複作成）状態です。`payment_intent` の存在確認〜作成を同一トランザクション内で行う（read を先に済ませる）か、`payment_intent` を一意キーにしたドキュメント（例: mapping doc / `transaction.create`）で重複を防止してください。

**copilot-pull-request-reviewer**（functions/default/src/stripeWebhook.ts）

> [must] `payment_intent` の一意性担保が「queryで存在確認→ランダムIDで作成」のままなので、並行実行で両トランザクションが空結果を読んだ場合に Stripe ドキュメントが二重作成される可能性が残ります（クエリが空だと読み取りロック対象が無くなり得るため）。`payment_intent` をドキュメントIDにする（または mapping doc を `transaction.create` で作って一意制約にする）など、作成時に衝突を検出できる形に変更してください。

---

### R06 stripeWebhook の例外と HTTP ステータス

- **対象**: stripeWebhook 内で想定外 order status のとき throw している箇所。
- **指摘の要旨**: 5xx だと Stripe が再送し続け、状態が変わらない限り終わらない。回復不能なら 2xx で止める等の方針。
- **精査**: 不正データは 400 系で切る、一時障害は 5xx、など Stripe の推奨に沿って整理する。
- **想定対応**: ステータス別に res のコードを分岐し、ログは残して再送を止めるケースを明示する。
- **対応内容**: トランザクション内で `throw` せず結果型で返す。`getOrdersByIds` の件数不一致は `400`（`Orders not found`）。`in_cart` / `ordered` 以外（例: `canceled`）は既存のエラーログに加え `Webhook skipped: unrecoverable order state` を記録し **`200`** で応答して再送を止める（`addMember`・確定メールは実行しない）。Firestore 等の従来どおりの失敗はトランザクション例外のまま 5xx となり再送対象。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/stripeWebhook.ts）

> [must] `in_cart/ordered` 以外のステータス検出時に例外を投げると、この webhook は 5xx になり Stripe 側の自動リトライが継続し続けます（状態が変わらない限り解消しない）。回復不能なケース（例: canceled）はアラート用にエラー記録はしつつ 2xx を返してリトライを止める、または補償トランザクション（手動対応用の記録作成など）に切り替える設計にしてください。

---

### R07 createStripeCheckoutSession の order_ids 重複

- **対象**: functions/default/src/stripe.ts。order_ids 配列の検証。
- **指摘の要旨**: 同一 order_id が複数回含まれると line_items の数量が実注文とずれる可能性。
- **精査**: getOrdersByIds は重複 ID をそのまま返し得るため、サーバでユニーク化または重複を invalid-argument にするのが安全。
- **想定対応**: new Set で長さ比較、またはソート済みユニーク配列に置き換えてから以降の処理に渡す。
- **対応内容**: `order_ids` に重複がある場合は `HttpsError('invalid-argument', 'order_ids に重複があります')` を返す（`new Set(order_ids).size !== order_ids.length`）。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/stripe.ts）

> [must] `order_ids` の重複チェックが無いので、同一 `order_id` を複数回含めたリクエストで Stripe の `line_items.quantity` を水増しでき、実際の注文数以上に課金される可能性があります。Callable 側で `order_ids` の重複排除（Set で件数比較）を行い、重複があれば `invalid-argument` を返してください。

---

### R08 stripeWebhook の orderIds 重複

- **対象**: stripeWebhook の orderIdsStr split 後の配列。
- **指摘の要旨**: メタデータに重複が含まれると pay_amount や menus 集計が水増しに。
- **精査**: R07 とセットでサーバ正規化。Webhook は改ざんされうる前提で防御する。
- **想定対応**: split 後にユニーク化し、元の件数と不一致ならログを出して 400 または拒否方針を決める。
- **対応内容**: split 後の ID について `Set` の件数と比較し、重複があれば `logger.warn` のうえ HTTP 400（`Duplicate order IDs`）で終了。改ざん・不整合時は再計算せず拒否する方針。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/stripeWebhook.ts）

> [must] `orderIdsStr` を `split(',')` した結果に重複が含まれていてもそのまま処理されます。`createStripeCheckoutSession` 側のバリデーションをすり抜けた場合に、(1) `pay_amount`/`menus` の集計が水増しされる、(2) 同一 order を複数回参照して整合性が崩れる、等が起き得るため、Webhook 側でも `orderIds` を重複排除し、重複があれば 400 で落とす（またはユニーク化して継続）などの防御を入れてください。

---

### R09 stripes ドキュメント更新の競合

- **対象**: functions/default/src/cancelOrders.ts の getStripe と saveStripe、functions/default/src/eventReceipt.ts の receipt_number 採番時の saveStripe。
- **指摘の要旨**: merge true の全体書き戻しにより、並行で refunds や receipt_number が潰れる可能性。
- **精査**: cancelOrders 内コメントでは同一ユーザーのみとしつつ、レビューは将来の並行を指摘。eventReceipt は receipt_number 初回採番で stripe 全体を保存。
- **想定対応**: Firestore トランザクションで stripes を read してから更新する、またはフィールド単位の更新 API に寄せる。影響範囲が広いため段階実装を検討。
- **対応内容**: **cancelOrders** — Stripe `refunds.create` は従来どおりトランザクション外。成功後に `runTransaction` で `getStripe`→累計再検証→`refunds` 追記→`saveStripe`（同一 `refund_id` は二重記録しない）。**eventReceipt** — `receipt_number` の初回採番と `saveStripe` を `runTransaction` 内に集約し、最新ドキュメント上で採番する。パートナー・店舗取得はトランザクション外のまま。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/cancelOrders.ts）

> [must] 返金結果の `stripeDoc.refunds.push(...)` → `saveStripe(...)` がトランザクション外の read-modify-write で、`saveStripe` は `set(..., { merge: true })` なので refunds 配列は全体上書きになります。同一ユーザーが二重送信/複数端末で同時に cancel した場合、後勝ちで refunds エントリが欠落する（返金履歴が失われる）競合が起き得ます。`refunds` の追記はトランザクション化するか、`FieldValue.arrayUnion` 等で競合しない更新方法にしてください。

**copilot-pull-request-reviewer**（functions/default/src/cancelOrders.ts）

> [must] stripes ドキュメントの更新が `getStripe` → `refunds.push` → `saveStripe` のトランザクション外 read-modify-write になっており、同一 stripeId に対して別の更新（例: eventReceipt で receipt_number を保存、将来的な管理者キャンセル/再実行など）が並行すると `refunds` 配列の更新が消える（ロストアップデート）可能性があります。stripeRef をトランザクションで読み直して更新するか、`refunds` だけを原子的に更新（FieldValue.arrayUnion 等）して他フィールドを書き戻さない形にしてください。

**copilot-pull-request-reviewer**（functions/default/src/eventReceipt.ts）

> [must] `receipt_number` 未採番時に `stripe` オブジェクト全体を `saveStripe(..., merge:true)` で保存しているため、同じ stripes ドキュメントに対する別更新（例: cancelOrders の refunds 追加）が並行した場合に配列フィールド等を古い状態で上書きしてしまう可能性があります。receipt_number だけを `update`（または mergeFields）で更新する／もしくはトランザクションで最新を読み直して条件付きで採番する形に寄せるのが安全です。

---

### R10 createEventMembers：イベント取得と community 整合

元 PR では createEventMembers 関連のレビューが一塊だったが、本ドキュメントでは **独立したイシューとして R10〜R13** に分割して扱う（**旧 R11 Checkout metadata は R14** に繰り下げ）。

- **対象**: functions/default/src/eventMembers.ts、functions/default/src/stores/event.ts。
- **指摘の要旨**: `getEvent(eventId)` の collectionGroup 依存によるコスト増、および eventId 衝突時に別コミュニティのイベントを参照し得るリスク。
- **想定対応**: `communities/{communityId}/events/{eventId}` 直参照のストアを使う。取得後に `eventData.community_id === communityId` を検証し、不一致なら warn + return。
- **対応内容**: `getEventInCommunity(communityId, eventId)` を追加し `eventMembers` で使用。`community_id` 不一致時は `warn` して return。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/eventMembers.ts）

> [must] `getEvent(eventId)` は `collectionGroup('events').where('event_id'=='...')` なので、この Trigger では既に `communityId`/`eventId` が分かっているにもかかわらず、毎回 collectionGroup 検索になります（コスト増）。また eventId が万一衝突した場合に別コミュニティのイベントを更新するリスクもあります。Trigger 内では `communities/{communityId}/events/{eventId}` を直接参照して取得するストア関数を使う（または専用関数を追加する）形にしてください。

**copilot-pull-request-reviewer**（functions/default/src/eventMembers.ts）

> [must] `getEvent(eventId)` は collectionGroup + `event_id` で 1件取得のため、理論上 eventId が衝突した場合に別コミュニティの event を拾い得ます。この関数は trigger で `communityId` が確定しているので、`eventData.community_id === communityId` を検証して一致しない場合は warn + return するなど、誤更新を防いでください。

---

### R11 createEventMembers：トリガー過剰実行の抑制

- **GitHub**: https://github.com/nijuniinc/bokudeli-event-new/issues/1904
- **対象**: functions/default/src/eventMembers.ts。
- **指摘の要旨**: 全 `member_orders` の write のたびに `ordered` 全件スキャンと `event` 更新が走り、カート操作で read/write が急増する。
- **想定対応**: `before` / `after` で **ordered メンバーに影響する遷移のときだけ**再集計する、または差分更新。Copilot の「フルスキャン」関連コメントは内容が重なるため **同一イシュー（本 R11）にまとめてよい**。
- **依存の目安**: R10（正しいイベント参照）完了後に着手しやすい。R13（`event` 書き込みのトランザクション）と設計はあわせて検討しやすい。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/eventMembers.ts）

> [must] `onDocumentWritten` のたびに `getOrders(..., 'ordered')` でイベント全件の ordered 注文を読み直して members を再計算しているため、カート更新など（ステータスが ordered に関係しない書き込み）でも毎回フルスキャンが走ります。`before/after` を見て「status が ordered に変わった/ordered から外れた」など members に影響する場合のみ処理するガードを入れて、不要な read/書き込みを抑えてください。

**copilot-pull-request-reviewer**（functions/default/src/eventMembers.ts）

> [must] `createEventMembers` が orders ドキュメントのあらゆる write（in_cart の追加/更新を含む）で発火し、そのたびに collectionGroup で ordered 全件を再走査して event を update しています。カート操作（特に addToCart が複数 order を作る）で関数呼び出し回数と read/write が急増するため、`after.status` の遷移（ordered になった/ordered から外れた等）のときだけ処理するガードを入れるか、差分更新（before/after を見て members セットを更新）に変更してください。

---

### R12 createEventMembers：`updated_by` の意味

- **GitHub**: https://github.com/nijuniinc/bokudeli-event-new/issues/1905
- **対象**: functions/default/src/eventMembers.ts（`updateEvent` の第 2 引数）。
- **指摘の要旨**: `updateUserId` にトリガーの `params.userId` を渡すため、`updated_by` が「最後にカート操作したユーザー」に書き換わり監査上の意味が崩れる。
- **想定対応**: Functions のシステム更新として固定 ID を使う、`updated_by` を変えない更新手段にする、などプロダクト判断。

#### 元のレビューコメント

**copilot-pull-request-reviewer**（functions/default/src/eventMembers.ts）

> [must] 受付側で `updateUserId` に `params.userId`（エンドユーザーID）を渡して event を更新しているため、`updated_by` が「最後にカート操作したユーザー」に書き換わります。監査/運用上の意味合いが崩れるので、Functions のシステム更新として固定ID（例: `system` / `createEventMembers`）を使うか、updated_by を変えない更新手段（members のみ更新）にしてください。

---

### R13 createEventMembers：`event.members` 更新の競合

- **対象**: functions/default/src/eventMembers.ts。
- **指摘の要旨**: `ordered` 再集計結果の `event.members` 書き戻しがトランザクション外で、並行トリガーにより後勝ち欠落が起き得る。
- **想定対応**: `event` の read-modify-write をトランザクションで保護する等（R11 の「いつ処理するか」とは別軸）。
- **対応内容**: `getFirestore().runTransaction` 内で `getEventInCommunity(..., transaction)` → `getOrders(..., 'ordered', transaction)` → `updateEvent(..., transaction)`。イベント未取得・`community_id` 不一致時はトランザクション内で return し書き込まない。成功時のみ `Event members 更新` を `logger.info`。

#### 元のレビューコメント

**chatgpt-codex-connector**（functions/default/src/eventMembers.ts）

> **<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  イベントメンバー集計をトランザクションで更新する**
>
> `ordered` 注文の再集計結果をそのまま `event.members` に書き戻していますが、読み取りと更新がトランザクションで保護されていないため、同一イベントでトリガーが並行実行されると後勝ちで古い集合に上書きされます。結果として `event.members` が一時的ではなく恒久的に欠落し、定員判定や参加者表示が誤る可能性があります。
>
> Useful? React with 👍 / 👎.

---

### R14 Checkout metadata の文字数

- **対象**: stripe.ts の metadata.orderIds に order_id をカンマ連結している部分。
- **指摘の要旨**: Stripe のメタデータ上限を超えるカートでは失敗や切り詰めリスク。
- **精査**: 件数上限を決め、超える場合は別の参照方法にするか、Webhook 側は session 再取得で補う等。
- **想定対応（当初）**: メタデータ長の上限チェック、または件数が多い場合は別ドキュメントに保存してメタデータには参照キーのみ載せる。
- **対応方針（決定）**: 実装工数が高いため、本件はコード・データモデル変更による対応は行わない。現行どおり `order_ids` をカンマ連結して Checkout Session の metadata に載せる。Stripe のメタデータ 1 値あたりの文字数制限（レビューでは 500 文字）を超えた場合は `checkout.sessions.create` が失敗しうるリスクは残る。発生頻度が低い想定とし、運用上問題が顕在化した場合は件数上限の事前バリデーション、Firestore に注文一覧を退避して metadata には参照キーのみ載せる、などを別タスク・イシューで再検討する。

#### 元のレビューコメント

**chatgpt-codex-connector**（functions/default/src/stripe.ts）

> **<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Stripe metadata の orderIds 長を事前に制御する**
>
> `order_ids` をそのまま `orderIds` メタデータに連結しており長さチェックがないため、カート件数が増えると Stripe の metadata 上限（1値500文字）を超えて `checkout.sessions.create` が失敗します。`addToCart` 側で件数上限がないため、数量の多い注文で決済導線が止まる不具合になります。
>
> Useful? React with 👍 / 👎.

**chatgpt-codex-connector**（functions/default/src/stripe.ts）

> **<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Stripe metadata に全 orderIds を連結しない**
>
> `order_ids` をカンマ連結して 1 つの metadata 値に入れているため、注文数が多いカートでは metadata の文字数制限を超えて Checkout Session 作成が失敗します。特に新モデルでは注文数がメニュー個数に比例して増えるため再現しやすく、ユーザーが決済画面に進めない障害になります。
>
> Useful? React with 👍 / 👎.

---

## メモ

- レビューで修正不要と判断した項目（インデックスの nits 等）は本ドキュメントの必須タスクからは外している。createEventMembers 関連は **R10〜R13** の各イシューで追う。
- R01 と R09 はルールとアプリの両面に触れるため、リリース前のセキュリティレビューで優先順位を再確認すること。
- 元のレビューコメントは PR 1880 の当時のインラインコメントを転記している。マージ後の追コミットで行番号や本文が変わっている場合がある。
