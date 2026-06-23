# EventMemberOrder に伴う注文一覧と領収書

## 概要

- [05_EventOrder→EventMemberOrder.md](./05_EventOrder→EventMemberOrder.md) のデータ構造変更に伴い、マイページの注文一覧表示と領収書機能の変更を整理する
- **注文一覧の表示単位**: order ドキュメント単位（現行）→ **イベント単位** に変更する
- **領収書の発行単位**: order ドキュメント単位（現行）→ **stripe_id 単位** に変更する
- **データ取得（改訂）**: **イベントタブ**は Event ドキュメントの `members` にユーザーが含まれる参加イベントを **`base/src/stores/userEventList.ts`** で取得する。**注文履歴タブ**は **`collectionGroup('member_orders')` を `user_id` で検索**し、`in_cart` を除外した注文からイベントを列挙する **`base/src/stores/userOrderHistoryList.ts`** を用いる（全キャンセルで `members` から外れても履歴として表示）。各イベントの注文詳細は **`member_orders` サブコレクションを遅延取得**し、表示ページ内は並列取得する。

### `members` と注文一覧の前提（仕様）

- **カートのみ（`in_cart`）のユーザーは Event の `members` 配列には含まれない**。したがって「参加しているが `member_orders` が無い／`in_cart` だけのイベントが一覧に載る」ケースは、**`members` 起点のイベントタブでは想定しなくてよい**。
- **イベントタブ**: キャンセル等で参加者から外れたユーザーは `members` から外れるため、**参加イベント一覧には載らない**（現行維持）。
- **注文履歴タブ**: `member_orders` collectionGroup 起点のため、**全キャンセルで `members` から外れてもイベントカードを表示**する。全注文が `canceled` のときは `UserEventCard` で「キャンセル済み」と表示する（v2.9 以前の挙動に合わせる）。
- カード内の注文表示では、サブコレクション上に **`in_cart` ドキュメントが存在し得る場合は従来どおり一覧用に除外**する（`status !== 'in_cart'`）。


## 現行の仕組み

### マイページ注文一覧（`user/src/pages/u/[userId].vue`）

- `useOrderListByUserId` で `collectionGroup('member_orders')` からユーザーの注文を取得（`status !== 'in_cart'`）
- 1 order ドキュメント = 1 カード（`UserEventCard`）として表示
- 各カード内で `order.menus` 配列をループしてメニュー名と個数を表示
- カードに「キャンセル」ボタンと「領収書」ボタンを配置

### UserEventCard（`base/src/components/UserEventCard.vue`）

- props: `order: EventOrder`, `event: BokudeliEvent`, `isOwner: boolean`
- `totalPrice`: `order.menus.reduce((acc, menu) => acc + menu.price * menu.count, 0)`
- キャンセルボタン: `order.status === 'ordered'` かつ期限前のとき表示
- 領収書ボタン: `order.status === 'ordered'` かつ `event_payment !== 'community_bill'` のとき表示

### 領収書（`functions/default/src/eventReceipt.ts`）

- リクエスト: `{ eventId, orderId }`（order ドキュメント単位）
- `event.getOrder(orderId)` で注文を取得
- `order.totalPrice`（`menus` 配列の price × count 合計）を領収書金額として使用
- 初回発行時に `order.receipt_number` を `convertDateToId(order.ordered_at)` で採番し、order ドキュメントに保存
- 2回目以降は既存の `receipt_number` を再利用（再発行マーク付き）
- PDF テンプレート（`receipt.docx`）にマージして PDF を生成、URL を返す

### 領収書ページ（`user/src/pages/receipt.vue`）

- クエリパラメータ `eventId` と `orderId` を受け取り、`eventReceipt` API を呼出
- 返された PDF URL を `<iframe>` で全画面表示

### 現行の課題

- 新設計（1 order = 1 メニュー）では、order 単位のカード表示だと唐揚げ3つ注文で3枚のカードが表示される
- `order.totalPrice` の getter は `menus` 配列に依存しており、新スキーマにはそのまま使えない
- 領収書が order 単位で発行されるが、新設計では 1 order = 1 メニューなのでメニュー単位の領収書になってしまう


## 新設計: 注文一覧

### 表示単位の変更

**イベント単位（1 カード = 1 イベント）** に変更する。

理由:
- ユーザーの mental model は「このイベントに参加して何を注文したか」であり、「何回決済したか」ではない
- **Event ドキュメントの `members` 配列**が参加者有無のソースであり、**`communities/.../members/{userId}/member_orders`** で注文を取る二段構えがデータモデルと対応しやすい
- キャンセルモーダルの仕様もイベント単位の orders を前提にしている

### データ取得の変更

**実装の決定事項（一覧）**

- **`userEventList.ts` の責務**: 参加イベントのページングに加え、**イベントごとの `member_orders` の状態**（取得結果・loading・error 等）を **Map 等で一元管理**する。
- **`member_orders` の読み方**: ストアのページングで**画面上のイベント数に上限がある**ため、**表示中のイベント分の `member_orders` は並列でまとめて取得**してよい（追加の同時実行数制限は必須としない）。
- **注文 0 件時**: 通常は `members` にいない前提。万が一、一覧用条件で **`in_cart` 以外が 0 件**のときは **「注文なし」文言は出さず、注文ブロック自体を表示しない**。
- **取得失敗時**: **当該カードの注文エリアのみ**エラー表示し、**再試行**でそのイベントの `member_orders` 取得だけやり直す。**再試行の配線**: `UserEventCard` はストアを持たず、**`@retry-orders`（または同等）で `eventId` を emit**し、**親（`[userId].vue`）が `userEventListStore.reloadOrdersForEvent(eventId)` を呼ぶ**。
- **イベント本体の更新**: まずは **一覧取得時の `BokudeliEvent` をそのまま表示**する（`useEventStore` の `onSnapshot` は必須としない）。
- **キャンセル成功後**: **`userEventList.ts` に `reloadOrdersForEvent(eventId)` を用意**し、**`[userId].vue` が `cancelOrders` 成功後に呼ぶ**。**`event_id` はプロダクト内で一意**のため、**引数は `eventId` のみでよい**（`community_id` をキーに含める必要はない）。**`UserEventCard` からストアを直接 import しない**。
- **参加イベント一覧のページネーション**: **`eventList.ts` 等と同様、`getCountFromServer` による `totalCount` と、累積取得件数を `IncrementalLoader` の `loadedCount` に渡す**パターンとする。
- **インデックス**: 参加イベント用の composite に加え、**`member_orders` で `status != 'in_cart'` と `orderBy` を併用する場合は別 composite インデックスが必要**になる想定で `firestore.indexes.json` に追加する。
- **プロフィールのユーザー識別子**: **`fetchUser` で解決した `user_id`（実装上は `userIdRef`）を唯一の正**とする。`useUserEventListByUserId`・**`members` の `array-contains` は `getUserRef(解決済み userId)`**（`base/src/stores/user.ts`）を使う。**ルートパラメータの生値と混在させない**。**オーナー判定は可能ならログインユーザーの Shokujii `user_id` と `userIdRef` の一致**で行う（URL が常に Firebase UID である前提だけに依存しないことを推奨）。**`useUserStore(...)` の引数も `userIdRef` に揃える**（現状のルート生値との混在は**実装時にまとめて修正**する）。
- **文言（i18n）**: 注文エリアのエラー表示・再試行ボタンなどの文言は**実装時に**、既存のロケール定義（例: `base/src/locales/messages/ja.ts`）のパターンに合わせて**キーを追加**する。
- **Firestore セキュリティルール**: 注文内容は**イベントページ上でも表示される**前提であり、**該当データは誰でも閲覧可能**とする（プロフィール閲覧時の `member_orders` 読み取りのため、**本仕様だけを理由としたルール変更は不要**とみなす。既存ルールと矛盾する場合は別途確認する）。

#### 1. 参加イベント一覧

- Firestore 上のイベントパスは `communities/{communityId}/events/{eventId}`。**`collectionGroup('events')`** を使い、次の条件で **当該ユーザーの参加イベント** を取得する。
  - `is_deleted == false`
  - `members` に **`getUserRef(解決済み userId)`** を **`array-contains`** する（DB 上は `users/{userId}` への `DocumentReference` の配列。**`base/src/stores/user.ts` の `getUserRef` を用い、ルートの未解決文字列をそのまま使わない**）
- **並び順**: **`event_start_datetime` 降順**（新しいイベントが先頭）。
- **ページネーション**: **`base/src/stores/eventList.ts` と同趣旨**とする。`getCountFromServer` で **`totalCount`** を取得し、`startAfter` + `limit` で累積読み込み。**`IncrementalLoader` には `totalCount` と `loadedCount`** を渡す。
- **実装ファイル**: **`base/src/stores/userEventList.ts` を新規作成**する。イベント一覧部分は **`TaskExecutor`、`startAfter` 累積、ユーザー単位の `storeId`** 等、`eventList.ts` / `orderList.ts` と整合しやすい形とする。

#### 2. 各イベントの `member_orders`（遅延取得）

- パス: **`communities/{communityId}/events/{eventId}/members/{userId}/member_orders`**
- **イベント一覧の取得後**、**現在ページに載っている各イベント**について `member_orders` を読み込む。**注文内容は `member_orders` を読まないと表示できない**ため、**取得が終わったイベントから注文ブロックを表示**する。
- **同一ページ内の複数イベント**: **並列で一括取得**してよい（ページングにより件数に上限があるため、追加の同時実行スロットルは仕様上必須としない）。
- 一覧用クエリでは **`status != 'in_cart'`** 等、従来どおりカート行を除外する。**このクエリには参加イベント用とは別の複合インデックスが必要**になる想定である。

#### 3. 読み込み中・失敗時の UI

- イベント名・日時など **イベント本体で分かる情報は先に表示**する。
- **`member_orders` 待ちの間は、注文ブロックのみ小さなローディング**を表示する。
- **取得失敗時は当該カードの注文エリアのみ**エラー表示し、**再試行**で同イベントの `member_orders` 取得のみ再実行する。**再試行は** `@retry-orders` 等で親に委ね、親が **`reloadOrdersForEvent(eventId)`** を呼ぶ（カードはストアを参照しない）。

#### 4. キャンセル成功後の更新

- **該当イベントの `member_orders` だけ再取得**する（ページ全体や参加イベント一覧のフルリロードを必ずしなくてよい）。
- **`userEventList.ts` に `reloadOrdersForEvent(eventId)` を定義**する（**`event_id` はプロダクト内一意のため `eventId` のみでよい**）。**`[userId].vue` のキャンセル成功ハンドラからのみ呼ぶ**。`UserEventCard` は引き続き **`cancel` を emit** し、ストアを知らない。

#### 5. 他人プロフィール閲覧時の公開範囲

- **現行どおり**: **閲覧者がオーナーでない**かつ **イベントが非公開**のときは、**カードごと非表示**（または一覧段階で除外）とする。

#### 6. Firestore インデックス

- **参加イベントクエリ**用に、次のような **複合インデックス**が必要になる想定である。`firestore.indexes.json` に追加するか、コンソール提案に従い用意する。
  - `collectionGroup`: `events`
  - フィールド例: `is_deleted`（昇順）, `members`（`array-contains`）, `event_start_datetime`（降順）
  - 実際のフィールド名・順序はエラー出力に合わせて調整する。
- **`member_orders` サブコレクション**で **`where('status', '!=', 'in_cart')` と `orderBy` を併用する**場合は、**上記とは別の複合インデックス**が必要になる想定である（コンソールのリンクに従い定義する）。

#### 7. プロフィール URL と Firestore のユーザー ID

- **`fetchUser` が成功したときの `user_id`（実装では `userIdRef`）を、当ページの Firestore 操作の唯一の識別子とする**（空のときは参加イベント一覧・`member_orders` を開始しない）。
- **`useUserEventListByUserId(解決済み userId)`**、**`useUserStore(解決済み userId)`**、**コミュニティ一覧の `array-contains`**、**`getUserRef`** をすべてこの値に揃える（現状 `[userId].vue` でルート値と `userIdRef` が混在し得る箇所は**実装時にまとめて統一**する）。

### UserEventCard の props 変更

```typescript
// 現行
defineProps<{
  event: BokudeliEvent
  order: EventOrder
  isOwner: boolean
}>()

// 新設計
defineProps<{
  event: BokudeliEvent
  orders: EventMemberOrder[]  // 同一イベントの全 orders
  isOwner: boolean
}>()
```

### カード内の表示

カード内では orders を `menu_id` で groupBy してメニュー一覧を表示する。

```typescript
// カード内のメニュー集計
const groupedMenus = computed(() => {
  const map = new Map<string, { menu_name: string; menu_price: number; count: number }>()
  for (const o of props.orders.filter(o => o.status !== 'canceled')) {
    const existing = map.get(o.menu_id)
    if (existing) {
      existing.count++
    } else {
      map.set(o.menu_id, { menu_name: o.menu_name, menu_price: o.menu_price, count: 1 })
    }
  }
  return Array.from(map.values())
})

// 合計金額
const totalPrice = computed(() =>
  props.orders.filter(o => o.status !== 'canceled').reduce((sum, o) => sum + o.menu_price, 0)
)
```

テンプレート例:
```html
<div class="ml-3">
  <div v-for="menu in groupedMenus" :key="menu.menu_name">
    {{ menu.menu_name }} ×{{ menu.count }}（{{ $n(menu.menu_price * menu.count, 'currency') }}）
  </div>
</div>
<div>合計: {{ $n(totalPrice, 'currency') }}</div>
```

### キャンセルボタンの表示条件

```typescript
// 有効な注文が1つ以上あるか
const hasActiveOrders = computed(() => props.orders.some(o => o.status !== 'canceled'))

// キャンセルボタンの表示
const isShowCancelButton = computed(() =>
  hasActiveOrders.value && props.event.event_deadline_datetime > Date.now()
)

// 全キャンセル済みかどうか
const isAllCanceled = computed(() => props.orders.every(o => o.status === 'canceled'))
```

### カードの状態表示

| orders の状態 | カードの表示 |
|:--|:--|
| 全て `ordered` | 通常表示。キャンセルボタン表示（期限前のみ） |
| 一部 `canceled` | 有効なメニューのみ表示。キャンセルボタン表示（期限前のみ） |
| 全て `canceled` | 「キャンセル済み」表示。キャンセルボタン非表示 |
| 一覧用条件で **`in_cart` 以外が 0 件**（通常は想定しない） | **注文ブロックを表示しない**（「注文なし」文言は出さない） |
| 一部 `in_cart` が混在 | `in_cart` は注文一覧の表示から除外（クエリまたはクライアント側フィルタ）※ `members` 起点ではカートのみ参加者は一覧に出ないが、サブコレクション上のドキュメントは除外する |


## 新設計: 領収書

### 発行単位の変更

**stripe_id 単位** で発行する。

理由:
- 新設計では 1 order = 1 メニューなので、order 単位の領収書は不適切（メニュー1品ごとに領収書が出てしまう）
- stripes ドキュメントが決済の全情報（`pay_amount`、`menus`、`receipt_number`）を持つため、領収書のデータソースとして適切
- 1回の Stripe 決済に対して1枚の領収書が自然

### API の変更

```typescript
// 現行
type EventReceiptRequest = {
  eventId: string
  orderId: string
}

// 新設計
type EventReceiptRequest = {
  eventId: string
  stripeId: string    // orderId → stripeId に変更
}
```

### バックエンド処理の変更（`eventReceipt.ts`）

```
1. 認証チェック（request.auth.uid）
2. stripes ドキュメントを取得（stripeId で指定）
3. バリデーション
   - stripes ドキュメントが存在すること
   - stripes.user_id が認証ユーザーであること
4. receipt_number の採番
   - stripes.receipt_number が未設定の場合: convertDateToId() で採番し、stripes ドキュメントに保存
   - 設定済みの場合: 既存の receipt_number を使用（再発行フラグを立てる）
5. PDF テンプレートにマージするデータを組み立て
   - 金額: stripes.pay_amount（一部キャンセル済みの場合は返金後の金額ではなく、元の決済金額）
   - メニュー一覧: stripes.menus（StripeMenu[]）
   - 税計算: pay_amount から算出
6. PDF 生成・URL 返却
```

**金額の扱い**: 領収書には元の決済金額（`pay_amount`）を記載する。一部返金が発生している場合でも、領収書の金額は変わらない。返金は別途 Stripe が返金通知を出すため、領収書と返金は別の文書として扱う。

### フロント側の変更

#### 領収書ボタン（UserEventCard 内）

1カード = 1イベントに変更するため、同一イベント内に複数の stripe 決済がある場合（追加注文など）は、stripe_id ごとに領収書ボタンを表示する。

```typescript
// 決済ごとの領収書ボタン用データ
const stripeGroups = computed(() => {
  const map = new Map<string, { stripeId: string; amount: number }>()
  for (const o of props.orders.filter(o => o.status !== 'canceled' && o.stripe_id != null)) {
    if (!map.has(o.stripe_id!)) {
      map.set(o.stripe_id!, { stripeId: o.stripe_id!, amount: 0 })
    }
    map.get(o.stripe_id!)!.amount += o.menu_price
  }
  return Array.from(map.values())
})
```

```html
<!-- stripe_id が1つの場合: 従来通り「領収書」ボタン1つ -->
<!-- stripe_id が複数の場合: 各決済ごとにボタンを表示 -->
<template v-if="isShowInvoiceButton">
  <v-btn
    v-for="sg in stripeGroups"
    :key="sg.stripeId"
    variant="outlined"
    rounded="pill"
    color="secondary"
    size="small"
    @click.prevent="$emit('downloadInvoice', event.event_id, sg.stripeId)"
  >
    {{ stripeGroups.length === 1 ? '領収書' : `領収書（${$n(sg.amount, 'currency')}）` }}
  </v-btn>
</template>
```

#### emit シグネチャ

```typescript
defineEmits<{
  downloadInvoice: [eventId: string, stripeId: string]
  cancel: [orders: EventMemberOrder[]]
}>()
```

#### 領収書ボタンの表示条件

```typescript
const isShowInvoiceButton = computed(() =>
  props.orders.some(o => o.status === 'ordered')
  && props.event.event_payment === 'user_advance'
)
```

`user_advance`（事前決済）のときのみ領収書ボタンを表示する。`community_bill`（請求書払い）と `user_on_day`（当日払い）はユーザーが Stripe 決済していないため、領収書ボタンは表示しない。

#### 領収書ページ（`receipt.vue`）

```typescript
// 現行
const eventId = route.query.eventId as string
const orderId = route.query.orderId as string
const response = await eventReceipt({ eventId, orderId })

// 新設計
const eventId = route.query.eventId as string
const stripeId = route.query.stripeId as string
const response = await eventReceipt({ eventId, stripeId })
```

#### getReceiptPath の変更

```typescript
// 現行
export const getReceiptPath = (eventId: string, orderId: string) =>
  `/receipt?eventId=${eventId}&orderId=${orderId}`

// 新設計
export const getReceiptPath = (eventId: string, stripeId: string) =>
  `/receipt?eventId=${eventId}&stripeId=${stripeId}`
```

### PDF テンプレートのデータ

| フィールド | 現行のデータソース | 新設計のデータソース |
|:--|:--|:--|
| event（但し書き） | `event.event_name + ' / お食事代として'` | 変更なし |
| number（領収書番号） | `order.receipt_number` | `stripes.receipt_number` |
| orderDate（注文日） | `order.ordered_at` | `stripes.created_at` |
| price（金額） | `order.totalPrice`（menus 合計） | `stripes.pay_amount` |
| date（発行日） | `Date.now()` | 変更なし |
| shop（店舗名） | `shop.shop_name` | 変更なし |
| invoiceId（適格番号） | `shop.shop_invoice_number` | 変更なし |
| address（住所） | `shop.shop_address` | 変更なし |
| rawPrice（税抜金額） | `order.ExTaxPrice` | `Math.ceil(pay_amount / 1.08)` |
| tax（消費税） | `order.TaxPrice` | `pay_amount - rawPrice` |
| reissue（再発行） | `receipt_number` の有無で判定 | 変更なし（`stripes.receipt_number` の有無で判定） |

### 一部キャンセル時の領収書

- 領収書に記載する金額は**元の決済金額（`pay_amount`）のまま**。一部返金後の差引金額は記載しない
- 返金の証跡は Stripe 側が管理する（Stripe の返金レシートが別途発行される）
- **全キャンセルの場合は領収書ボタンを表示しない**（`isShowInvoiceButton` が `orders.some(o => o.status === 'ordered')` で判定するため、全キャンセルだと false になる）


## 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `user/src/pages/u/[userId].vue` | **`fetchUser` 解決後の `userIdRef` を Firestore・ストアの正とする**（`getUserRef` / `useUserEventListByUserId` / **`useUserStore`** と一致させ、実装時にルート生値との混在を解消）。**`userEventList.ts`** で参加イベントを **`totalCount` / `loadedCount` 付き**で取得し、各イベントの **`member_orders` を遅延・ページ内並列取得**。`UserEventCard` へ `event` と注文状態を渡す。**`@retry-orders`** で **`reloadOrdersForEvent(eventId)`** を呼ぶ。`downloadReceipt` の引数を `(eventId, stripeId)` に変更。`cancelOrders` 成功後に **`reloadOrdersForEvent(eventId)`** を呼ぶ（カードは emit のみ） |
| `base/src/components/UserEventCard.vue` | props の型変更（`orders: EventMemberOrder[]` 等、loading / error 用 props も可）。メニュー表示を `menu_id` で groupBy。`totalPrice` を orders の `menu_price` 合計に変更。領収書ボタンを `stripe_id` 単位で表示。領収書表示条件は `event_payment === 'user_advance'`。キャンセルボタンは有効 order の有無で判定。**注文ブロックのみ小さなローディング**。**失敗時は当該エリアのみエラー＋再試行**（例: **`retry-orders` emit で `eventId` を渡す**）。ストアは直接参照しない |
| `base/src/stores/userEventList.ts`（新規） | **参加イベント**の `collectionGroup('events')` クエリ、**`getCountFromServer` による `totalCount`**、`startAfter` + `limit` の累積取得。併せて **イベントごとの `member_orders` を Map で保持**（キーは **`event_id` のみ**でよい。結果・loading・error）。**`reloadOrdersForEvent(eventId)`** を提供。エクスポート例: `useUserEventListByUserId(解決済み userId)` |
| `base/src/locales/messages/ja.ts` 等 | 注文エリアの**エラー・再試行**など、**実装時に**必要な i18n キーを追加 |
| `base/src/stores/orderList.ts` | マイページ注文タブが **`useOrderListByUserId`（`member_orders` collectionGroup）に依存しなくなる**場合は、当該利用をやめる／ヘルパーを整理する（他画面で利用している場合は残す） |
| `base/src/components/IncrementalLoader.vue` | 参加イベントタブは **`totalCount` / `loadedCount` パターン**で統一する。既に `eventList` 等で満たしていれば**変更不要** |
| `firestore.indexes.json` | **参加イベント**用と **`member_orders`（`status != 'in_cart'` + `orderBy`）**用の **複合インデックス**を追加（コンソール／ビルドエラーに合わせて定義） |
| `user/src/router/utils.ts` | `getReceiptPath` の引数を `orderId` → `stripeId` に変更 |
| `user/src/pages/receipt.vue` | クエリパラメータを `orderId` → `stripeId` に変更 |
| `common/src/apis/eventReceipt.ts` | `EventReceiptRequest` の `orderId` → `stripeId` に変更 |
| `functions/default/src/eventReceipt.ts` | `event.getOrder(orderId)` → stripes ドキュメントを取得。`receipt_number` を stripes に保存。`pay_amount` を領収書金額に使用。税計算ロジックの変更 |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `functions/default/src/utils/PdfGenerator.ts` | PDF 生成エンジンはデータソースに依存しない |
| `templates/receipt.docx` | テンプレートのフィールド名は同じ（`price`、`number` 等）。データソースが変わるだけ |
