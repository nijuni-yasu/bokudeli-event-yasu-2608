# EventMemberOrder に伴うキャンセル機能

## 概要

- [05_EventOrder→EventMemberOrder.md](./05_EventOrder→EventMemberOrder.md) に伴うキャンセル機能の実装
- **1 order ドキュメント = 1 メニュー**。order 単位でキャンセルする（一部キャンセル = 特定の order ドキュメントをキャンセル）
- 注文期限前のみキャンセル可能（現行と同じ）
- フロントは `cancelOrders` API を1本呼ぶだけ。支払方式による分岐はバックエンドで判断する
- キャンセル通知メールは送信しない
- 主催者/管理者からのキャンセルは今回のスコープ外（別イシューで対応）
- DB 更新後に Stripe 返金だけ失敗し得るため、**ユーザー向け表示文言**と **運用 Runbook**（[12_cancelOrders_返金失敗時_Runbook.md](./12_cancelOrders_返金失敗時_Runbook.md)）を用意する


## 現行のキャンセルフロー

### フロント（`user/src/pages/u/[userId].vue`）

- `UserEventCard` の「キャンセル」ボタン → 確認ダイアログ → `cancel(event, order)` を呼出
- `user_advance`（事前決済）: `stripeRefunds()` → Stripe 全額返金 + order.status を `canceled` に
- `community_bill` / `user_on_day`: `updateOrderStatus(order, 'canceled')` → ステータス変更のみ（Stripe 返金なし）

### バックエンド（`stripeRefunds.ts`）

- `stripe.refunds.create({ payment_intent })` で**全額返金**（amount 指定なし）
- order.status を `canceled` に、`refund_id` を1つ保存
- べき等性: `order.refund_id != null` なら既存の refund_id を返す

### 課題

- order 全体のキャンセルしかできない（一部キャンセル不可）
- `payment_intent` が order ドキュメントに直接入っている（セキュリティリスク）
- フロント側で支払方式による分岐を行っている（不整合リスク）


## 新設計のキャンセルフロー

### UI フロー

1. マイページ → イベントカード内の注文一覧（orders を `menu_id` で groupBy して表示）
2. **キャンセルモーダル**が開く（現行の確認ダイアログを置き換え）
3. モーダルには orders を **`menu_id` ごとに groupBy** して表示
   - 例: 「唐揚げ ×3」「牛丼 ×2」
4. 各メニュー行に**チェックボックス + 個数選択**
   - チェックを入れたメニューについて「何個キャンセルするか」を選択（1〜残数）
   - **同一 `menu_id` グループ内**の並び順: 各 order を **`ordered_at` 昇順**でソートする（`ordered_at` が無い場合は `carted_at`、それも無ければ `created_at` でフォールバック）
   - 個数 N を選んだときのキャンセル対象: 上記ソート後のリストの **末尾 N 件**の `order_id`（＝同じメニューでも、注文時刻が**新しい方から** N 件をキャンセルする）
5. **「すべてキャンセル」ボタン**で全メニューを一括選択するショートカットを提供
6. 「キャンセルを実行する」ボタンで `cancelOrders` API を呼出（選定された `order_ids` を送信）

### キャンセルモーダルの UX（必須）

- **ローディング**: API 呼び出し中は実行ボタンを無効化し、進行中であることが分かる表示をする
- **二重クリック防止**: 送信中の再タップ・重複リクエストを防ぐ（厳格バリデーションのため、成功直後の再送はエラーになり得る）
- **エラー時のユーザー向け文言（例）**: 注文のキャンセルは完了しているが返金処理で問題が起きた可能性がある場合、次の趣旨を表示する  
  **「注文のキャンセルは完了しています。返金の反映にお時間がかかる場合があります。問題が続く場合はサポートへお問い合わせください。」**  
  （文言は i18n キー化してよい）

### フロントの分岐廃止

現行はフロントが `event.event_payment` を見て `stripeRefunds` / `updateOrderStatus` を呼び分けているが、新設計では **`cancelOrders` 1本を呼ぶだけ**にする。バックエンド側でイベントの `event_payment` を取得し、Stripe 返金が必要かどうかを判断する。

### キャンセル対象の表示ルール

| order の状態 | groupBy 後の表示 | 操作 |
|:--|:--|:--|
| `status: 'ordered'` | 通常表示（残数としてカウント） | チェックボックスで選択可能 |
| `status: 'canceled'` | グレーアウトで表示（キャンセル済みラベル付き） | チェック不可。残数に含まない |
| 全 order が `canceled` | - | キャンセルボタン自体を非表示（`isShowCancelButton` で制御） |

### キャンセルボタンの表示条件

```typescript
// orders: EventMemberOrder[]（同一イベント・同一ユーザーの orders）
const hasActiveOrders = computed(() =>
  orders.some(o => o.status !== 'canceled')
)
const isShowCancelButton = computed(() =>
  hasActiveOrders.value
  && event.event_deadline_datetime > Date.now()
)
```

### キャンセル後の UI 表示

| 項目 | 表示内容 |
|:--|:--|
| `totalPrice` | キャンセル分を引いた金額（`status !== 'canceled'` の orders の `menu_price` 合計） |
| 「一部キャンセル済み」ラベル | 表示しない |
| 領収書ダウンロードボタン | [08](./08_EventMemberOrderに伴う注文一覧と領収書.md) と同じ。**`ordered` が1件でも残る**ときのみ表示する。**全キャンセル**（`ordered` が0件）のときは表示しない。表示する場合の領収書上の金額は元の決済金額（`pay_amount`）のまま（一部返金後の差引金額は記載しない。返金は Stripe 側が管理） |

領収書ボタンの表示条件（`user_advance` のとき、`UserEventCard` 内）:

```typescript
// event_payment === 'user_advance' かつ、ordered が1件以上あるときだけ領収書ボタンを出す
const isShowInvoiceButton = computed(
  () =>
    event.event_payment === 'user_advance' &&
    orders.some((o) => o.status === 'ordered'),
)
```


## API

### CancelOrdersRequest

キャンセル対象の order ドキュメント ID を直接指定する。
フロントは支払方式を意識せず、この API を1本呼ぶだけ。

```typescript
type CancelOrdersRequest = {
  community_id: string
  event_id: string
  order_ids: string[]
}

type CancelOrdersResponse = {
  canceled_count: number
  refunds: {
    stripe_id: string
    refund_id: string
    amount: number
  }[]
  /** Stripe 返金が一部または全部失敗したとき。成功した stripe_id 分は refunds に載る */
  refund_errors?: { stripe_id: string; message: string }[]
  /** クライアントのトースト・ダイアログにそのまま表示してよい文言（返金失敗時など） */
  user_message?: string
}
```

- `refunds` が配列なのは、異なる決済（stripe_id）で支払われた order が同時にキャンセルされるケースに対応するため。請求書払い（`community_bill` / `user_on_day`）の場合は `refunds` は空配列。
- **`refund_errors`**: 複数 `stripe_id` があるとき **可能な限り続行**し、成功した分だけ `refunds` に載せ、失敗した分を `refund_errors` に載せる（Callable は原則成功レスポンスで返し、フロントは `refund_errors` / `user_message` を見て上記 UX を行う）。**すべて**の Stripe 返金が失敗した場合も `canceled_count` は DB 更新済み件数と一致させ、`refund_errors` と `user_message` を返す。


## バックエンド処理フロー（`cancelOrders`）

```
1. 認証チェック（request.auth.uid）

2. order ドキュメントを一括取得
   getOrdersByIds(communityId, eventId, userId, orderIds)  
   ※ 参照パスは常に **リクエストの community_id / event_id と認証 uid** に紐づく `members/{uid}/member_orders/{orderId}` のみ。別イベント・別ユーザーの order_id を混ぜても、該当パスにドキュメントが無ければ **取得件数不足**として次項でエラーになる。

3. イベントドキュメント取得（event_payment の判断に必要）

4. バリデーション（厳格。パターン A）
   - `order_ids` が **空**でないこと（空なら `invalid-argument` 等）
   - **重複 ID**: `order_ids` に同一 ID が複数含まれる場合は **`invalid-argument`**（二重カウント・不正リクエストの防止）
   - リクエストの `order_ids` の **ユニーク件数**と、取得できたドキュメント件数が一致すること（存在しない ID が1件でもあればエラー）
   - 全 order が認証ユーザーのものであること（取得パスが uid 固定のため、通常は user_id 不一致は起きにくいが、取得データの `user_id` が uid と一致することを検証してもよい）
   - 全 order の `community_id` / `event_id` がリクエストと一致すること
   - 全 order の status が **'ordered' であること**。1件でも `canceled` / `in_cart` 等が含まれていれば **`failed-precondition`（または同等）でエラー**とし、スキップはしない
   - `event.event_payment === 'user_advance'` のとき、対象 orders の **いずれかに `stripe_id` が無い**場合は **`failed-precondition`**（データ不整合。返金処理に進まない）
   - **検算（user_advance かつ Stripe 返金を行う前）**: 対象 orders の `menu_price` 合計が、紐づく `stripes` の `pay_amount`・既存 `refunds` 合計と矛盾しないことを確認する（詳細は既存の「返金累計 + 今回 ≦ pay_amount」および、checkout 時点の内訳と整合するかの観点で検算）
   - event.event_deadline_datetime > 現在時刻（期限前であること）

5. 各 order の status を 'canceled' に変更、canceled_at を設定

6. members/{userId} ドキュメントは削除しない（履歴として残す）

7. DB 更新を実行（Firestore トランザクション内）:
   - 全対象 order ドキュメントの status を 'canceled' に一括更新
   - ※ Event.members 配列の更新は Firestore トリガー（createEventMembers）が
     order の書き込みを検知して自動実行するため、ここでは行わない

8. Stripe 返金（event.event_payment === 'user_advance' の場合のみ）:
   ※ Stripe API 呼び出しは Firestore トランザクションの**外**で実行する。
     理由: トランザクション内で外部 API を呼ぶと、トランザクションのリトライ時に
     Stripe 返金が二重実行されるリスクがある。idempotencyKey で Stripe 側の
     重複は防げるが、トランザクション失敗時に「Stripe は返金済み・DB は未更新」
     という不整合が残る。そのため、DB 更新（ステップ 7）を先に確定させてから
     Stripe 返金を実行し、Stripe 失敗時はリトライやアラートで対応する。

   a. 対象 orders を stripe_id でグルーピング
   b. stripe_id ごとに **順に処理**（**ベストエフォート**）:
      - stripes ドキュメントを取得
      - キャンセル金額を算出（対象 orders の menu_price 合計）
      - 返金額バリデーション: 既存 refunds の amount 合計 + 今回の返金額 ≦ pay_amount
      - Stripe 返金期限チェック: 決済から180日以内
      - stripe.refunds.create({ payment_intent, amount, idempotencyKey })
      - 成功時: stripes ドキュメントの refunds 配列に返金履歴を追加し、レスポンスの `refunds` に追加
      - **失敗時**: 当該 `stripe_id` を `refund_errors` に記録し、**次の stripe_id の処理を続行**する（可能な限り続行）
   c. いずれかの stripe_id で失敗した場合も、Callable は原則 **成功レスポンス**で `canceled_count`・成功分 `refunds`・`refund_errors`・**`user_message`**（下記）を返す
```

### DB 更新成功後の Stripe 失敗時（ユーザー向け）

- 注文のキャンセル（DB）は完了しているが返金 API が失敗または一部失敗した場合、レスポンスに **`user_message`** を含め、フロントはトースト等で表示する。文言の例:  
  **「注文のキャンセルは完了しています。返金の反映にお時間がかかる場合があります。問題が続く場合はサポートへお問い合わせください。」**
- 運用担当者向け手順は [12_cancelOrders_返金失敗時_Runbook.md](./12_cancelOrders_返金失敗時_Runbook.md) を参照する。

### 支払方式別の分岐（バックエンドで判断）

| 支払方式 | Stripe 返金 | 処理内容 |
|:--|:--|:--|
| `user_advance`（事前決済） | あり | order status 変更 + stripe_id でグルーピングして返金 + stripes 更新 |
| `community_bill`（請求書払い） | なし | order status 変更のみ |
| `user_on_day`（当日払い） | なし | order status 変更のみ |

フロントはこの分岐を意識しない。バックエンドがイベントの `event_payment` を見て Stripe 返金の要否を判断する。

### Stripe 返金のバリデーション

| チェック項目 | エラー時の挙動 |
|:--|:--|
| 返金累計 + 今回の返金額 > pay_amount | 当該 stripe_id 分を `refund_errors` に載せる（複数 stripe_id 時は他を続行）。単一 stripe_id かつ事前決済のみのリクエストでは `failed-precondition` でもよい |
| 決済から180日超過 | 同上、または仕様どおり `failed-precondition`（「返金期限を超過しています。運営にお問い合わせください」） |
| Stripe API エラー | **ログに詳細を記録**。複数 stripe_id 時は当該分を `refund_errors` に載せて続行。レスポンスに `user_message` を付与 |
| `user_advance` なのに order に `stripe_id` 欠落 | ステップ4のバリデーションで **`failed-precondition`**（DB 更新前に弾く） |


## Firestore トリガーとの関係

### onOrderChanged（`orderCompletionMail.ts`）

- 現行の `onOrderChanged` は `status` が `ordered` に変わったときにメール送信する
- キャンセルで `ordered` → `canceled` に変わるが、`canceled` への変更ではトリガーの条件（`status === 'ordered'`）に合致しないため発火しない

### createEventMembers

- 各 order ドキュメントの status 変更時にトリガーが発火する
- 全キャンセル: そのユーザーの `ordered` な order がなくなるため、`Event.members` 配列から自動的に除外される
- 一部キャンセル: 他に `ordered` な order が残っていれば `Event.members` 配列に影響しない

### キャンセル通知メール

キャンセル実行後の通知メール（ユーザー向け・主催者向け）は送信しない。


## 全キャンセル時の member の扱い

### members/{userId} ドキュメント

全 order が `canceled` になっても、`members/{userId}` ドキュメントは**削除しない**。「一度参加した」履歴として残す。

### event ドキュメントの members 配列

`Event.members` 配列の更新は Firestore トリガー（`createEventMembers`）が自動的に行う。全キャンセルにより全 order の status が `canceled` に変わると、トリガーが発火してそのユーザーの `ordered` な order がなくなるため、`Event.members` 配列から自動的に除外される。レター送信対象は `event.members` 配列から取得しているため、全キャンセルしたユーザーにレターが届かなくなる。


## stripes ドキュメントの返金管理

### refunds 配列

返金のたびに stripes ドキュメントの `refunds` 配列に返金履歴を追加する。

```typescript
// stripes ドキュメントのフィールド
refunds: {
  refund_id: string        // Stripe の Refund ID
  amount: number           // 返金金額
  order_ids: string[]      // キャンセルした order ドキュメント ID の配列
  created_at: Timestamp
}[]
```

### pay_cancel_amount は不要

返金累計金額は `refunds` 配列の `amount` の合計で算出可能なため、`pay_cancel_amount` フィールドは持たない。

```typescript
// 返金累計金額の算出
const totalRefundAmount = stripeDoc.refunds.reduce((sum, r) => sum + r.amount, 0)
```


## べき等性とバリデーション（パターン A: リクエスト厳格）

**入力バリデーション**は厳格とする。`order_ids` に指定されたドキュメントは **すべて `status === 'ordered'` でなければならない**。既に `canceled` の ID が1件でも混ざっていれば **エラー**（クライアントの不整合・古い画面の再送などを検知しやすくする）。`order_ids` が空、または存在しない ID が含まれる場合もエラーとする。

**再送時の挙動**: 1回目の処理で対象がすべて `canceled` に更新されたあと、**同じ `order_ids` で Callable を再送**すると、上記厳格チェックにより **エラー**になる（仕様として許容する）。フロントでは二重送信防止（ボタン無効化など）を行う。

**Stripe 側のべき等性**: `stripe.refunds.create` には `idempotencyKey` を付与する。`refund_{stripe_id}_{order_id_1}_{order_id_2}` のようにキャンセル対象から決定論的に生成し、**同一 stripe_id 内の order_ids は昇順ソート**して構築する。ネットワーク再試行などで **同じキーで Stripe API が再度呼ばれた場合**、Stripe 側で重複返金を防止できる（DB 更新前後のタイミングによっては、返金 API だけが再実行されるケースへの保険）。


## スコープ外（別イシュー）

- 主催者/管理者からのキャンセル（管理画面からの操作）
- イベント中止に伴う一括キャンセル・返金


## キャンセル例

### 初期状態

```
orders = [
  { order_id: "order_1", menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", stripe_id: "stripe_A" },
  { order_id: "order_2", menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", stripe_id: "stripe_A" },
  { order_id: "order_3", menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", stripe_id: "stripe_A" },
  { order_id: "order_4", menu_id: "gyudon",  menu_name: "牛丼",   menu_price: 1000, status: "ordered", stripe_id: "stripe_A" },
  { order_id: "order_5", menu_id: "gyudon",  menu_name: "牛丼",   menu_price: 1000, status: "ordered", stripe_id: "stripe_A" },
]

groupBy 表示:
  唐揚げ ×3（¥1,500）
  牛丼   ×2（¥2,000）
  合計: ¥3,500
```

### 1回目のキャンセル: 唐揚げ1つ + 牛丼1つ

UI: キャンセルモーダルで唐揚げ「1個」、牛丼「1個」を選択  
→ 各 `menu_id` グループ内を `ordered_at` 昇順とし、末尾 1 件ずつ選定（例: 唐揚げは `order_3`、牛丼は `order_5`）: `["order_3", "order_5"]`

リクエスト:
```json
{
  "community_id": "xxx",
  "event_id": "yyy",
  "order_ids": ["order_3", "order_5"]
}
```

結果:
```
order_3: status → "canceled"
order_5: status → "canceled"

stripes (stripe_A):
  refunds: [
    { refund_id: "re_xxx1", amount: 1500, order_ids: ["order_3", "order_5"], created_at: ... }
  ]
```

Stripe 一部返金: ¥1,500（500 + 1000）

groupBy 表示:
  唐揚げ ×2（¥1,000）  ← 3→2
  牛丼   ×1（¥1,000）  ← 2→1
  合計: ¥2,000

### 2回目のキャンセル: 残り全部

UI: 「すべてキャンセル」ボタン → `["order_1", "order_2", "order_4"]`

リクエスト:
```json
{
  "community_id": "xxx",
  "event_id": "yyy",
  "order_ids": ["order_1", "order_2", "order_4"]
}
```

結果:
```
order_1, order_2, order_4: status → "canceled"

stripes (stripe_A):
  refunds: [
    { refund_id: "re_xxx1", amount: 1500, order_ids: ["order_3", "order_5"], created_at: ... },
    { refund_id: "re_xxx2", amount: 2000, order_ids: ["order_1", "order_2", "order_4"], created_at: ... }
  ]
```

Stripe 一部返金: ¥2,000（500 × 2 + 1000）
全 order が canceled → Event.members 配列は Firestore トリガーが自動更新（ユーザーが除外される）


## 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `common/src/apis/stripe.ts` | `CancelOrdersRequest` / `CancelOrdersResponse`（`refund_errors`・`user_message` 含む）。旧 `StripeRefundsRequest` は削除タイミングで廃止 |
| `functions/default/src/stripeRefunds.ts` | `cancelOrders` に全面改修。`order_ids` で指定された orders を一括キャンセル、`stripe_id` でグルーピングして返金、stripes の refunds 配列更新、event_payment による分岐、返金バリデーション |
| `functions/default/src/stores/memberOrder.ts` | `getOrdersByIds` を使用。パス `members/{userId}/member_orders/{orderId}` |
| `base/src/apis/stripe.ts` | `stripeRefunds` → `cancelOrders` にリネーム、型変更 |
| `base/src/components/UserEventCard.vue` | キャンセルモーダルをメニュー選択 UI に変更（orders を `menu_id` で groupBy 表示 + チェックボックス + 個数選択 → 選定された `order_ids` を送信）。`totalPrice` を `status !== 'canceled'` の orders の `menu_price` 合計で算出。領収書ボタンは `user_advance` かつ `orders.some(o => o.status === 'ordered')` のときのみ表示（全キャンセル時は非表示）。領収書金額は `pay_amount` のまま |
| `user/src/pages/u/[userId].vue` | `cancel()` 関数を `cancelOrders` API 1本に変更。支払方式別の分岐ロジックを削除 |
