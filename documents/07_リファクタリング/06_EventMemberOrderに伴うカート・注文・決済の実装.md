# EventMemberOrder に伴うカート・注文・決済の実装

## 概要

- [05_EventOrder→EventMemberOrder.md](./05_EventOrder→EventMemberOrder.md) のデータ構造変更・API 設計・Store 関数インターフェースに基づく実装仕様
- 対象: カート追加（`addToCart`）、カート削除（`removeFromCart`）、注文確定（`confirmOrder`）、Stripe 決済（`createStripeCheckoutSession` / `stripeWebhook`）、キャンセル（`cancelOrders`）、カート画面（`cart.vue`）、eventStore ラッパー関数
- **1 order ドキュメント = 1 メニュー**。menus 配列は持たない
- `Event.members` の自動更新は Firestore トリガー `createEventMembers` が行う。実装タイミング・タスク一覧は [11_EventMemberOrderのタスク計画.md](./11_EventMemberOrderのタスク計画.md) の **Phase 2**（[07](./07_EventMemberOrderに伴う既存機能の修正.md) セクション 8.5）。フロントは **Phase 3** と同一 PR・同時デプロイとし、Phase 2 と並行して進めてよい

## Callable 共通のバリデーション（現行 `addOrder` からの継承）

イベントの `event_payment` は `user_advance` | `user_on_day` | `community_bill`（`common/src/schemas/Event.ts` の `EVENT_PAYMENT_VALUES`）。カート画面では `user_advance` のみ Stripe、それ以外は `confirmOrder` 相当の確定となる。

### 注文期限（`event_deadline_datetime`）

| 処理 | 期限超過時 |
|:--|:--|
| `addToCart` | 拒否（現行 `addOrder` と同様） |
| `createStripeCheckoutSession` | 拒否 |
| `confirmOrder` | 拒否 |
| `removeFromCart` | **検証しない**（カート整理のため。期限後も削除は許可） |

### メニュー検証（サーバ必須）

| 処理 | 内容 |
|:--|:--|
| `addToCart` | イベントの menus サブコレクション（メニューマスタ）に `menu_id` が存在し `is_selected` であること。書き込む **`menu_name` / `menu_price` はマスタの値を用いる**（クライアント送信値は信頼しない）。`partner_id` は `Event.partner_id` を参照するため order には含めない。 |
| `createStripeCheckoutSession` / `confirmOrder` | 対象 order ドキュメントは既に上記ルールで作成済みである前提。必要に応じてイベント取得後に `community_id` / `event_id` の整合を再確認する。 |

### 定員（`event_max_people` と `event.members`）

- 現行 `addOrder` と同様、**確定済み参加者**は `Event.members` の長さで表される（カートのみのユーザーは含まれない）。
- **`addToCart`**: `event.members.length >= event.event_max_people` のときは拒否。
- **`createStripeCheckoutSession` / `confirmOrder`**: 同条件を**直前に再チェック**する（同時にカートへ入る操作との競合を緩和）。
- **`removeFromCart`**: 定員チェックは不要。

### イベント・コミュニティの整合

- リクエストの `community_id` / `event_id` と、取得したイベントの `community_id` が一致することを検証する（なりすまし防止）。

### 支払種別による排他（`confirmOrder` と Stripe）

| `event_payment` | `createStripeCheckoutSession` | `confirmOrder` |
|:--|:--|:--|
| `user_advance`（事前クレカ） | **許可** | **拒否**（クレカ決済で確定すること） |
| `user_on_day`（当日払い） | 拒否 | 許可 |
| `community_bill`（主催者請求書） | 拒否 | 許可 |

- UI 側のボタン出し分けに加え、**Callable 側で必ず上表どおり拒否**する（`failed-precondition` 等）。
- `user_on_day` / `community_bill` はいずれも Stripe Checkout を経由しない注文確定パスとする（現行カート画面の分岐と一致）。

## Stripe Functions 変更

### createStripeCheckoutSession

現行は `order: EventOrder` をリクエストから受け取っているが、新設計では `order_ids` 配列で受け取り Functions 側で読み取る。

**変更点**:
- リクエストから `order_ids`, `event_id`, `community_id` を受け取り、Functions 内で `getOrdersByIds` を使って複数 order ドキュメントを一括取得（`userId` は `request.auth.uid` から取得）
- 各 order ドキュメントの `menu_id` / `menu_name` / `menu_price` を `menu_id` ごとに groupBy して `line_items` を構築
- `community_account` はイベントデータから取得（`event.community_account`）。success_url の構築に使用
- `imageUrl` は order ドキュメントに含まれないため、イベントの menus サブコレクション（メニューマスタ）から `menu_id` で突き合わせて取得する。Checkout ページにメニュー画像を表示するために必要だが、Firestore の orders / stripes には保存しない
- Stripe の metadata に `orderIds`（カンマ区切り）を格納する。`communityAccount` は metadata から削除する（不要。`community_id` があればイベントデータ経由で取得可能）
- バリデーション: 全 order_ids が存在し、全て `in_cart` であり、全て認証ユーザーのものであること
- 上記「Callable 共通のバリデーション」のとおり、**注文期限・定員・`event_payment === 'user_advance'`・`community_id` 整合**を満たすこと

#### Checkout の line_items と Firestore の対応

- Firestore は **1 order ドキュメント = 1 品**（同一 `menu_id` が複数 doc）。Checkout の `line_items` は **`menu_id` ごとに groupBy し `quantity` で集約**してよい。
- 決済とドキュメントの対応は metadata の **`orderIds`（全 order ドキュメント ID の列挙）** で取る。Stripe 上の「1 行・quantity N」は表示・金額計算用の集約ビューであり、Firestore の正規形と矛盾しない。
- 金額は **各 order の `menu_price` の合計**と Checkout 合計が一致するよう、単価は order 上（＝マスタ由来で `addToCart` 時に固定）の値を用いる。
- Stripe の metadata 値は **1 キーあたり 500 文字まで**。`orderIds` が長くなりすぎる場合は、別手段（例: metadata は `session.id` のみにし、order_ids は Functions 内の別ストアに一時保持する等）を別途検討する。

### stripeWebhook

現行は `checkout.session.completed` で order の status を `ordered` に更新。

**変更点**:
1. metadata から `orderIds`（カンマ区切り）, `eventId`, `communityId`, `userId` を取得
2. `orderIds` を分割し、`getOrdersByIds` で複数 order ドキュメントを一括取得
3. 全 order の status を `ordered` に一括更新。`ordered_at` を設定
4. **stripes ドキュメントを新規作成**（`order_ids` 配列, payment_intent, pay_amount, menus）
5. 各 order に `stripe_id` を設定
6. コミュニティにメンバー追加（`community.addMember`）
7. 上記をトランザクション内で実行
8. ※ `Event.members` 配列の更新は Firestore トリガー（`createEventMembers`）が order の書き込みを検知して自動実行するため、ここでは行わない

#### べき等性・`stripes` の重複防止

- Stripe からの **再送・重複イベント**を想定する。
- **`payment_intent`（文字列）を `stripes` の一意キーとして扱う**（ドキュメント ID を `payment_intent` にする、または先に `payment_intent` で取得して存在すれば更新スキップ）。
- 次のいずれかを満たす場合は **HTTP 200 で正常終了**（処理済みとして再入可）とする:
  - 対象の全 order がすでに `ordered` で、**同一 `payment_intent`** に紐づく `stripes` が存在し、metadata の `orderIds` と `order_ids` が整合している
  - または `Checkout.Session.id` を補助キーとして同様に照合する
- 初回のみ: トランザクション内で orders 更新・`stripes` 作成・各 order の `stripe_id` 設定・`community.addMember` を実行する。
- **1 トランザクションあたりの書き込み数**: カート内 order 数が通常 **10〜20 程度**の想定であれば、Firestore の上限に対して問題にならない見込み。

### stripeRefunds → cancelOrders

現行は全額返金のみ（`refunds.create({ payment_intent })`）。
詳細は [09_EventMemberOrderに伴うキャンセル機能.md](./09_EventMemberOrderに伴うキャンセル機能.md) を参照。

**変更点**:
- リクエストが `order_ids: string[]` 形式に変更。キャンセル対象の order ドキュメント ID を直接指定
- 対象 order ドキュメントの status を `canceled` に変更
- `stripe_id` でグルーピングし、stripe ごとにキャンセル金額を算出して `stripe.refunds.create({ payment_intent, amount })` で一部返金を実行
- stripes ドキュメントの `refunds` 配列に返金履歴を追加（refund_id, amount, order_ids, created_at）
- 全 ordered order が canceled になった場合、全額返金


## データ操作の実装

- **カート追加（`addToCart`）**
  - 上記「Callable 共通のバリデーション」のとおり、**注文期限・メニュー（マスタ・`is_selected`）・定員・`community_id` / `event_id` 整合**を検証する
  - フロントからカート追加時に、members ドキュメントを upsert（初回のみ作成）
  - リクエストの `menus[].count` を元に、Functions 側で **count 分の order ドキュメントを新規作成** する（1 order = 1 メニュー）
    - 例: `{ menu_id: "karaage", count: 3 }` → 3つの order ドキュメントを作成（各 doc に `menu_id: "karaage"`, `menu_price: 500`, `status: "in_cart"` 等）
  - +ボタン: `addToCart({ menus: [{ menu_id, count: 1, ... }] })` で1つの order ドキュメントを新規作成
  - この時点では `event.members` 配列への追加や `community.addMember` は実行しない
  - 各 order ドキュメントは独立しているため、既存カートへの追加操作（menus 配列のマージ）は不要。**トランザクションは不要**（ドキュメント作成のみで読み取り・更新の競合がないため）

- **カートからメニュー削除（`removeFromCart`）**
  - -ボタン: 指定 `order_id` の order ドキュメントを**直接削除**する
  - バリデーション: 対象 order の `status` が `in_cart` であること。`ordered` や `canceled` の order を削除すると決済・返金・集計の整合性が崩れるため、`in_cart` 以外はエラーを返す
  - **注文期限・定員の検証は行わない**（共通バリデーション節のとおり）
  - 1 order = 1 メニューなので、ドキュメント削除 = 1品削除
  - ゴミ箱ボタン（一括全削除）は存在しない。個数が1の時に-ボタンを押すと全削除と同じ状態になる
  - **トランザクション不要**（単一ドキュメントの削除のみ）

- **stripe 決済（`createStripeCheckoutSession` + `stripeWebhook`）**
  - CheckoutSession 作成時: `order_ids` で指定された複数 order ドキュメントを取得し、`menu_id` で groupBy して line_items を構築。imageUrl はイベントの menus サブコレクション（メニューマスタ）から取得。metadata に `orderIds`（カンマ区切り）を格納（line_items の集約との関係・metadata 長さは上記「Checkout の line_items と Firestore の対応」を参照）
  - Webhook（`checkout.session.completed`）で以下をトランザクション内で実行（**べき等性・`stripes` 重複防止**は上記 `stripeWebhook` 節を参照）:
    - metadata の `orderIds` から各 order ドキュメントを取得
    - 全 order の status を `ordered` に一括更新
    - stripes ドキュメントを新規作成（`order_ids` 配列, payment_intent, pay_amount, menus）
    - 各 order に `stripe_id` を設定
    - `community.addMember(userId)` を実行
    - ※ `Event.members` 配列の更新は Firestore トリガーが自動実行

- **注文確定（請求書払い `confirmOrder`）**
  - **`event_payment` が `user_on_day` または `community_bill` のときのみ許可**。`user_advance` のときは **拒否**（Stripe 決済で確定すること）。上記「支払種別による排他」を参照
  - 上記「Callable 共通のバリデーション」のとおり、**注文期限・定員**を満たすこと
  - stripe 決済しない（主催者請求書・当日払いフロー）注文確定時に、`order_ids` で指定された全 order の status を `ordered` に一括更新
  - stripe_id は設定しない
  - `community.addMember(userId)` を実行
  - ※ `Event.members` 配列の更新は Firestore トリガーが自動実行
  - バリデーション: 全 order_ids が存在し、全て `in_cart` であり、全て認証ユーザーのものであること

- **一部キャンセル（`cancelOrders`）**
  - マイページから order 単位でキャンセルが可能
  - `order_ids` で指定された order ドキュメントの status を `canceled` に変更
  - stripe 決済済みの場合、対象 orders を `stripe_id` でグルーピングし、stripe ごとに返金を実行
  - stripes ドキュメントの refunds 配列に返金履歴を追加（`order_ids` を含む）
  - ※ `Event.members` 配列の更新は Firestore トリガーが自動実行

- **全キャンセル（`cancelOrders` でユーザーの全 ordered order をキャンセルした場合）**
  - ユーザーの全 `ordered` order_ids を指定して `cancelOrders` を呼ぶ
  - stripe 決済済みの場合、全額返金を実行
  - `members/{userId}` ドキュメントは削除しない（履歴として残す）
  - ※ `Event.members` 配列の更新は Firestore トリガーが自動実行（ordered ユーザーが0になればトリガーがユーザーを除外する）


## カート画面の実装

イベントページのカート追加ダイアログ（`EventCartDialog.vue`）とカート画面（`cart.vue`）は API 呼び出し名の変更だけでなく、ロジック・テンプレート両面で大幅な変更が必要。

### EventCartDialog.vue（イベントページのカート追加ダイアログ）

| 現行 | 新設計 |
|:--|:--|
| `eventStore.addOrder(orderItem)` | `eventStore.addToCart(orderItem)` |
| リクエストの menus に `imageUrl` を含む | `imageUrl` を削除 |
| リクエストの menus に `count` を含む | `count` はそのまま（Functions 側で order ドキュメントを count 分作成） |
| クライアント独自のフィールド名 | `common` の `AddToCartRequest` と矛盾しないようフィールド名を揃える |

変更は API 名・型・`menus` 形状の整理が中心。`imageUrl` 削除と `AddToCartRequest` 準拠を満たすこと。

### cart.vue（カート画面）

**1. 数量操作のロジック変更**

現行は `updateMenuCountInCart(order, menuId, newCount)` で count を直接セットする方式。新設計では +1（新 doc 作成）/-1（doc 削除）の個別操作に変更。

```typescript
// 現行
const incrementMenuCount = async (event, order, menu) => {
  await updateMenuCount(event, order, menu, menu.count + 1)
}
const decrementMenuCount = async (event, order, menu) => {
  if (menu.count > 1) {
    await updateMenuCount(event, order, menu, menu.count - 1)
  }
}

// 新設計
const incrementMenuCount = async (event, menu) => {
  await addToCart({
    community_id: event.community_id,
    event_id: event.event_id,
    menus: [{ menu_id: menu.menu_id, count: 1 }]
  })
}
const decrementMenuCount = async (event, order) => {
  // order = 削除対象の order ドキュメント（1 order = 1 メニューなので order_id で直接指定）
  await removeFromCart({
    community_id: event.community_id,
    event_id: event.event_id,
    order_id: order.order_id,
  })
}
```

**2. 削除ロジックの変更**

現行は `deleteMenuInCart(order, menuId)` でメニューごと削除。新設計では `removeFromCart` で order ドキュメントを直接削除する。

- 現行: 個数が1の場合にゴミ箱アイコン → 確認ダイアログ → `deleteMenuInCart`
- 新設計: 個数が1の場合に-ボタン → 確認ダイアログ → `removeFromCart`（order ドキュメントが削除される）

```typescript
// 新設計: decrementMenuCount で removeFromCart を呼ぶ
// 1 order = 1 メニューなので、ドキュメント削除 = 1品削除
// groupBy で表示上の個数が1の場合（同一 menu_id の order が最後の1つ）は確認ダイアログを表示
```

**3. 注文確定（請求書払い）の変更**

```typescript
// 現行
await eventStore.updateOrderStatus(order, 'ordered')
router.push(`${getUserPath(userId)}?eventId=${order.event_id}&communityAccount=${order.community_account}`)

// 新設計
// cartOrders = ユーザーの in_cart orders 全件（subscribe で取得済み）
const orderIds = cartOrders.map(o => o.order_id)
await eventStore.confirmOrder({
  community_id: event.community_id,
  event_id: event.event_id,
  order_ids: orderIds,
})
// community_account は order から取得できなくなるため event から取得
router.push(`${getUserPath(userId)}?eventId=${event.event_id}&communityAccount=${event.community_account}`)
```

**4. Stripe 決済の変更**

```typescript
// 現行
const response = await createStripeCheckoutSession({ order, isPosted: false })
window.location.href = response.data.url || getEventPath(order.community_account, order.event_id)

// 新設計
const orderIds = cartOrders.map(o => o.order_id)
const response = await createStripeCheckoutSession({
  community_id: event.community_id,
  event_id: event.event_id,
  order_ids: orderIds,
  isPosted: false,
})
window.location.href = response.data.url || getEventPath(event.community_account, event.event_id)
```

**5. テンプレートの表示変更**

現行の `cartItem.order.menus` は `OrderMenuType[]`（menu_id ごとに集計済みで `count` フィールドを持つ）。
新設計では `members/{userId}/member_orders` サブコレクションの各ドキュメントが 1 メニュー粒度のため、取得した order ドキュメントの配列を `menu_id` で groupBy して表示用の配列を作る。

```typescript
// orders を menu_id ごとに集計（computed で算出）
// cartOrders = ユーザーの in_cart orders 全件
const groupedMenus = computed(() => {
  const map = new Map<string, { menu_id: string; menu_name: string; menu_price: number; count: number; order_ids: string[] }>()
  for (const order of cartOrders) {
    const existing = map.get(order.menu_id)
    if (existing) {
      existing.count++
      existing.order_ids.push(order.order_id)
    } else {
      map.set(order.menu_id, {
        menu_id: order.menu_id,
        menu_name: order.menu_name,
        menu_price: order.menu_price,
        count: 1,
        order_ids: [order.order_id],
      })
    }
  }
  return Array.from(map.values())
})
```

テンプレートの `menu.menu_price * menu.count` で小計を表示。-ボタン押下時は `menu.order_ids` の末尾の ID を `removeFromCart` に渡す。

**6. community_account の取得方法**

現行は `order.community_account` から取得しているが、新設計では order から `community_account` が削除される。
`cartItem.event.community_account` から取得する（`CartItem` が `event: BokudeliEvent` を持っているため問題なし）。

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/apis/order.ts` | 新 Callable 名で `httpsCallable` を定義。旧 `addOrder` 等を削除し `updateOrderStatus` はマイページ用に残す |
| `base/src/components/EventCartDialog.vue` | `addOrder` → `addToCart`、`imageUrl` 削除、`AddToCartRequest` の `menus` 形に合わせる（`count` 維持） |
| `base/src/components/pages/cart.vue` | 上記1〜6の全面改修。数量操作・削除・注文確定（order_ids 配列）・Stripe決済（order_ids 配列）・テンプレート表示（orders を groupBy）・community_account 取得を変更。型は `EventMemberOrder` 前提に整理 |
| `base/src/stores/currentUser.ts` | `collectionGroup('member_orders')` で取得する `in_cart` 注文の converter を新スキーマ（1 order = 1 メニュー）に変更 |
| `base/src/stores/event.ts` | 上記 eventStore 節のとおり `confirmOrder` を追加し `updateOrderStatus` は残す |


## eventStore の API ラッパー関数（base/src/stores/event.ts）

`eventStore` は `base/src/apis/order.ts` の Callable ラッパーを薄くラップして公開している。`EventCartDialog.vue` や `cart.vue` はこのラッパー経由で API を呼び出しているため、ラッパー関数自体のリネーム・シグネチャ変更も必要。

**カート確定とマイページキャンセルの分離**: `updateOrderStatus(order, 'ordered')` の代替は **`confirmOrder`** に限る。`user/src/pages/u/[userId].vue` のキャンセルは Phase 7 で `cancelOrders` に移行するまで、**`updateOrderStatus(order, 'canceled')` と既存 Callable を eventStore 経由で残す**。Phase 2〜3 の同一 PR では `confirmOrder` を追加・利用しつつ `updateOrderStatus` を削除しない。

**cancelOrders と stripeRefunds**: マイページは当面 `base/src/apis/stripe.ts` の `stripeRefunds` を直接呼ぶ実装のままでよい。`eventStore` に `cancelOrders` を載せるのは **Phase 7** でよい。

`base/src/apis/order.ts` の `httpsCallable` の第2引数は、Firebase にデプロイした関数名と **文字列どおり一致**させる。Phase 2 と Phase 3 を並行する場合はこの契約を先に固定する。

```typescript
// 現行
import { addOrder, updateOrderStatus, updateMenuCountInCart, deleteMenuInCart } from '@shokujii/base/apis/order.js'

const addOrder = async (data: AddOrderRequest): Promise<string> => { ... }
const updateMenuCountInCart = async (order, menu_id, count): Promise<void> => { ... }
const deleteMenuInCart = async (order, menu_id): Promise<void> => { ... }
const updateOrderStatus = async (order, status): Promise<void> => { ... }

// Phase 2〜3 終了時点の目安（カート用の新 API を追加し、マイページ用は残す）
import { addToCart, removeFromCart, confirmOrder, updateOrderStatus as _updateOrderStatus } from '@shokujii/base/apis/order.js'

const addToCart = async (data: AddToCartRequest): Promise<void> => { ... }
const removeFromCart = async (data: RemoveFromCartRequest): Promise<void> => { ... }
const confirmOrder = async (data: ConfirmOrderRequest): Promise<void> => { ... }
const updateOrderStatus = async (order, status): Promise<void> => { ... } // userId.vue 用。Phase 7 まで存続
```

| 現行 | 新設計 | 備考 |
|:--|:--|:--|
| `addOrder(data)` | `addToCart(data)` | リネーム + リクエスト型変更。レスポンスは void |
| `updateMenuCountInCart(order, menuId, count)` | **廃止** | `addToCart`（count: 1）/ `removeFromCart` に分割 |
| `deleteMenuInCart(order, menuId)` | `removeFromCart(data)` | リネーム + リクエスト型変更（order_id のみ） |
| `updateOrderStatus(order, 'ordered')` | `confirmOrder(data)` | カートの請求書・当日払い確定のみ。`order_ids` 配列 |
| `updateOrderStatus(order, 'canceled')` | 当面 **`updateOrderStatus` のまま** | Phase 7 で `cancelOrders` に移行 |
| マイページの `stripeRefunds` 直叩き | Phase 7 までそのまま | その後 `cancelOrders` と eventStore 載せを検討 |

store の return オブジェクトも、`addToCart` / `removeFromCart` / `confirmOrder` の追加と `updateOrderStatus` の維持に合わせて更新する。
