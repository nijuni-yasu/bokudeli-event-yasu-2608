# EventMemberOrder に伴う既存機能の修正

## 概要

- [05_EventOrder→EventMemberOrder.md](./05_EventOrder→EventMemberOrder.md) のデータ構造変更に伴い、既存コードで修正が必要な箇所を整理する
- 対象: フロント表示、メール送信 Functions、Firestore トリガー、API ラッパー、ユーティリティ
- **1 order ドキュメント = 1 メニュー**。menus 配列は持たない

## 共通の変更点

新設計では **1 order ドキュメント = 1 メニュー** になるため、表示時に `menu_id` ごとに groupBy して個数を算出する必要がある。
現行の `order.menus` 配列 + `menu.count` による個数表示・合計計算は、すべて以下のようなロジックに置き換わる。

```typescript
// 表示用の集計（orders を menu_id ごとにまとめる）
// orders: EventMemberOrder[]（同一ユーザー・同一イベントの orders 配列）
const groupedMenus = orders
  .filter(o => o.status !== 'canceled')
  .reduce((map, o) => {
    const existing = map.get(o.menu_id)
    if (existing) {
      existing.count++
      existing.order_ids.push(o.order_id)
    } else {
      map.set(o.menu_id, { ...o, count: 1, order_ids: [o.order_id] })
    }
    return map
  }, new Map())

// 合計金額
const totalPrice = orders
  .filter(o => o.status !== 'canceled')
  .reduce((sum, o) => sum + o.menu_price, 0)
```


## 1. イベントページの表示

### 現行の仕組み

- `base/src/stores/event.ts` の `subscribeOrders` が `collection(eventRef, 'orders')` を購読
- `members` computed で `event.members`（ID 配列）と `_orders` を `user_id` で結合して `BokudeliEventMember[]` を構築
- `EventDetailsCard.vue` → `EventMemberList.vue` で参加者ごとの注文メニューを表示

### 購読方式の変更

新パスでは orders が `members/{userId}/member_orders` の下に移動するため、イベント配下の全 orders を直接購読できなくなる。
**`collectionGroup('member_orders')` + `event_id` フィルタ** 方式に変更する。

```typescript
// 現行
const ordersRef = collection(eventRef, 'orders').withConverter(orderConverter)
onSnapshot(ordersRef, ...)

// 新設計
const q = query(
  collectionGroup(db, 'member_orders'),
  where('event_id', '==', eventId),
).withConverter(newOrderConverter)
onSnapshot(q, ...)
```

**depth フィルタは不要**: 旧データは `events/{eventId}/orders`、新データは `members/{userId}/member_orders` とサブコレクション ID が異なるため、`collectionGroup('member_orders')` の結果には旧パスのドキュメントは含まれない。converter でパス深さによる除外は行わない。

### `orderConverter` の変更

現行の `orderConverter` は `snapshot.ref.parent.parent!.id` で `event_id` を取得しているが、新パスでは `parent.parent` が `members/{userId}` になるため壊れる。`event_id` はドキュメント内のフィールドから取得する方式に変更する。

### `members` computed のデータソース

現行は `Event.members`（ID 配列）をメンバー一覧のソースとし、`_orders` を `user_id` で突き合わせている。新設計でも **`Event.members` 配列を引き続きメンバー一覧のソースとする**（注文確定済みのユーザーのみが表示される。カートに入れただけのユーザーは表示されない）。`_orders` との結合方式は同じ。

### `BokudeliEventMember` のデータ構造変更

現行の `BokudeliEventMember` は `orders: EventOrder[]` を持ち、`EventOrder` が `menus` 配列を持つ構造。新設計では `orders: EventMemberOrder[]` となり、各 order は 1 メニューの情報を直接持つ。表示時は `orders` を `menu_id` で groupBy して集計する。

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/stores/event.ts` の `subscribeOrders` | `collection(eventRef, 'orders')` → `collectionGroup('member_orders')` + `where('event_id', '==', eventId)` に変更 |
| `base/src/stores/event.ts` の `orderConverter` | `snapshot.ref.parent.parent!.id` での `event_id` 取得 → ドキュメント内の `event_id` フィールドから取得に変更。converter 自体を新スキーマ（EventMemberOrder）に変更 |
| `base/src/stores/event.ts` の `BokudeliEventMember` | `orders: EventOrder[]` → `orders: EventMemberOrder[]` に型変更 |
| `base/src/stores/event.ts` の API ラッパー関数 | `addOrder` → `addToCart`、`updateMenuCountInCart` → 廃止、`deleteMenuInCart` → `removeFromCart`、`updateOrderStatus` → `confirmOrder` にリネーム |
| `base/src/components/EventMemberList.vue` | `member.orders` の走査ロジック変更。`order.menus` ループ + `menu.count` → `member.orders` を `menu_id` で groupBy して個数を算出。表示フィールドも `menu.name` → `order.menu_name`、`menu.count` → groupBy 後の count に変更（`EventMemberOrder` のフィールド名はアンダースコア区切りであることに注意） |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `base/src/components/EventDetailsCard.vue` | `eventStore.members` を使う構造は同じ。スキーマ変更に伴う型変更のみ |
| `base/src/components/EventMenuList.vue` | メニューマスタの表示のみ。orders に依存しない |
| `base/src/components/EventCartDialog.vue` | 06「カート・注文・決済の実装」で対応 |


## 2. 管理者画面の参加者一覧と注文一覧の表示

### 現行の仕組み

- `user/src/components/manage/event/member.vue` が `eventStore.orders` を使用
- `ordered` / `in_cart` / `canceled` ごとに分けてテーブル表示
- 各 order の `menus` を展開してメニュー名・個数・小計を表示。CSV 出力機能あり

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `user/src/components/manage/event/member.vue` | `eventStore.orders` の型変更（`EventMemberOrder[]`）。`order.menus` の走査ロジック変更 → orders を `user_id` + `menu_id` で groupBy して集計。CSV 出力も同様 |
| `user/src/components/manage/event/overview.vue` | `eventStore.confirmedOrders` を使用。型変更の影響を受ける |


## 3. ADMIN 画面の注文一覧表示

### 現行の仕組み

- `admin/src/pages/order/index.vue` と `[eventId].vue` が `eventStore.confirmedOrders` を使用
- `ordersCount` / `ordersTotalPrice` / `getSubtotalsOfOrders`（`base/src/utils/orders.ts`）で集計
- `[eventId].vue` では注文を flatMap でメニュー行に展開して表示

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/utils/orders.ts` | `ordersCount`: `order.menus` の `count` 合計 → `status !== 'canceled'` の order ドキュメント数に変更。`ordersTotalPrice`: `menu.price * menu.count` → `order.menu_price` の合計に変更。`getSubtotalsOfOrders`: orders を `menu_id` で groupBy して小計を算出するロジックに変更。**戻り値の `name` / `price` フィールドはそのまま維持し、変換時に `order.menu_name` → `name`、`order.menu_price` → `price` にマップすること**（呼び出し側 `admin/src/pages/order/[eventId].vue` が `subtotalOrder.name` / `subtotalOrder.price` を参照しているため互換性を維持する） |
| `admin/src/pages/order/[eventId].vue` | `confirmedOrders` の flatMap（`order.menus` を展開）→ orders 配列をそのまま表示（1 order = 1 メニューなので展開不要）。表示上は `menu_id` で groupBy して集計。注文日時の表示を `order.created_at` → `order.ordered_at` に変更 |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `admin/src/pages/order/index.vue` | 集計ユーティリティを呼んでいるだけ。`base/src/utils/orders.ts` 側の変更で対応（型の変更は発生） |


## 4. マイページの注文一覧・領収書

詳細は [08_EventMemberOrderに伴う注文一覧と領収書.md](./08_EventMemberOrderに伴う注文一覧と領収書.md) を参照。

主な変更点:
- **注文一覧の表示単位**: order ドキュメント単位 → **イベント単位**（1カード = 1イベント）に変更。orders を `event_id` で groupBy してカードを生成
- **`UserEventCard` の props**: `order: EventOrder` → `orders: EventMemberOrder[]` に変更。カード内で `menu_id` で groupBy してメニュー一覧を表示
- **領収書の発行単位**: order ドキュメント単位 → **stripe_id 単位** に変更。stripes ドキュメントをデータソースに使用

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/stores/orderList.ts` | converter を新スキーマ（EventMemberOrder）に変更 |
| `user/src/pages/u/[userId].vue` | orders を `event_id` で groupBy してイベント単位のカード表示に変更。キャンセル処理を `cancelOrders` API に変更。領収書ダウンロードの引数を `stripeId` に変更 |
| `base/src/components/UserEventCard.vue` | props の型変更（`orders: EventMemberOrder[]`）。orders を `menu_id` で groupBy して表示。`totalPrice` は orders の `menu_price` 合計。領収書ボタンを `stripe_id` 単位で表示。キャンセルボタンの条件を有効 order の有無で判定 |
| `user/src/router/utils.ts` | `getReceiptPath` の引数を `orderId` → `stripeId` に変更 |
| `user/src/pages/receipt.vue` | クエリパラメータを `orderId` → `stripeId` に変更 |
| `common/src/apis/eventReceipt.ts` | `EventReceiptRequest` の `orderId` → `stripeId` に変更 |
| `functions/default/src/eventReceipt.ts` | stripes ドキュメントをデータソースに変更。`receipt_number` を stripes に保存。`pay_amount` を領収書金額に使用 |


## 5. 請求書

### 現行の仕組み

- **請求書**（`functions/default/src/eventBillInvoice.ts`）: `event.getOrders('ordered')` で全注文取得 → `common/src/utils/invoice.ts` で集計・税計算
- **フロント**（`user/src/components/manage/community/invoice.vue`）: `calculateInvoiceTotal` を呼出

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `functions/default/src/eventBillInvoice.ts` | `event.getOrders('ordered')` のパス変更（store 側修正で対応）。orders を `menu_id` で groupBy して集計 |
| `common/src/utils/invoice.ts` | `calculateOrdersTotal` / `calculateInvoiceTotal`: 引数型を `EventOrder[]` → `EventMemberOrder[]` に変更。`order.totalPrice` getter（`EventOrder` クラス固有）の代わりに `order.menu_price` を直接使用（`EventMemberOrder` には `totalPrice` getter を追加しない）。`aggregateOrderMenus`: 引数型を `EventMemberOrder[]` に変更し、`order.menu_name` / `order.menu_price` を使用して `menu_id` で groupBy するロジックに変更 |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `user/src/components/manage/community/invoice.vue` | `calculateInvoiceTotal` を呼ぶだけ。ユーティリティ側の変更で対応（渡す `orders` の型が `EventMemberOrder[]` になるため TypeScript の型は変わるが、実行時ロジックの変更は不要） |

### 備考: totalPrice 算出の変更

現行の `EventOrder` クラスの getter は `menu.count` に依存している。新設計ではクラスではなく関数で算出する。**`EventMemberOrder` クラスには `totalPrice` getter を追加しない**（1 order = 1 メニューなので `menu_price` そのものであり、getter として追加する意味がない）。

```typescript
// 現行（EventOrder クラスの getter）
get totalPrice() {
  return this.menus.reduce((acc, menu) => acc + menu.price * menu.count, 0)
}

// 新設計（common/src/utils/invoice.ts の calculateOrdersTotal を使う）
// orders: EventMemberOrder[]
export function calculateOrdersTotal(orders: EventMemberOrder[]): number {
  return orders
    .filter(order => order.status === 'ordered')
    .reduce((sum, order) => sum + order.menu_price, 0)
}

// aggregateOrderMenus の新設計
export function aggregateOrderMenus(orders: EventMemberOrder[]): InvoiceMenuItem[] {
  const menuMap = new Map<string, InvoiceMenuItem>()
  for (const order of orders.filter(o => o.status === 'ordered')) {
    const existing = menuMap.get(order.menu_id)
    if (existing != null) {
      existing.count++
      existing.totalPrice += order.menu_price
    } else {
      menuMap.set(order.menu_id, {
        menu_id: order.menu_id,
        name: order.menu_name,
        price: order.menu_price,
        count: 1,
        totalPrice: order.menu_price,
      })
    }
  }
  return Array.from(menuMap.values())
}

// マイページ・カート等での合計金額算出（canceled を除外）
const calcTotalPrice = (orders: EventMemberOrder[]) =>
  orders
    .filter(o => o.status !== 'canceled')
    .reduce((sum, o) => sum + o.menu_price, 0)
```

`ExTaxPrice`・`TaxPrice` は `calculateInvoiceTaxBreakdown` が `calculateOrdersTotal` の結果（`tax08Inclusive`）を受け取って計算するため、getter の廃止による追加変更は不要。


## 6. イベントメンバーのリスト取得

### 現行の仕組み

- `base/src/stores/event.ts` の `members` computed が主要なデータソース
- `base/src/composable/loadEventMembers.ts` / `countEventMembers.ts` は現在どこからも使われていない（Deprecated）

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/stores/event.ts` の `members` | members サブコレクションからの取得に変更（前述） |

### 廃止するファイル

| ファイル | 理由 |
|:--|:--|
| `base/src/composable/loadEventMembers.ts` | 未使用（Deprecated）。廃止して削除 |
| `base/src/composable/countEventMembers.ts` | 未使用。廃止して削除 |


## 7. レターのユーザリスト取得

### 現行の仕組み

- `functions/default/src/letter.ts` の `getParticipantIds` が `event.getOrders('ordered')` で注文取得 → `user_id` を抽出
- `getEventMemberIds` が `event.getOrders()` で全注文取得 → `user_id` を重複排除
- base 側の UI（`LetterEdit.vue`、`LetterTable.vue`）は `event.members`（ID 配列）を参照しており、orders には直接依存しない

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `functions/default/src/letter.ts` の `getParticipantIds` | `event.getOrders('ordered')` → store 側修正で対応（内部パス変更）。orders から `user_id` を抽出するロジックは同じ |
| `functions/default/src/letter.ts` の `getEventMemberIds` | members サブコレクションのドキュメント一覧がそのままメンバー ID 一覧になるため、シンプル化 |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `base/src/components/LetterEdit.vue` | `event.members`（イベントドキュメントのフィールド）を参照。orders に依存しない |
| `base/src/components/LetterTable.vue` | 同上 |


## 8. Firestore トリガー（onOrderChanged）

### 現行の仕組み

- `functions/default/src/orderCompletionMail.ts` の `onOrderChanged` が `communities/{communityId}/events/{eventId}/orders/{orderId}` を監視
- `status` が `ordered` に変わったときに以下を実行:
  - 注文完了メールをユーザーに送信（`sendOrderCompletionMailToMember`）
  - 注文完了メールを主催者に送信（`sendOrderCompletionMailToOrganizers`）
  - 新着イベント通知メールをコミュニティメンバーに送信（`sendNewEventNotificationToMembers`、初回のみ）
- `eventRef` の取得に `after.ref.parent.parent` を使用（orders → events の2階層上）

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `functions/default/src/orderCompletionMail.ts` の `onOrderChanged` | `document` パスを `communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}` に変更 |
| 同上 | `eventRef` の取得を `after.ref.parent.parent.parent.parent` に変更（member_orders → members/{userId} → members → events の4階層上） |
| 同上 | メールテンプレート用のメニュー情報: `order.menus` 配列が存在しないため、同一ユーザー・同一イベントの全 orders を取得して `menu_id` で groupBy して集計する。もしくは当該 order の `menu_name` / `menu_price` を直接使用する |
| 同上 | `userId` の取得を `after.get('user_id')` またはパスパラメータ `event.params.userId` から取得 |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `functions/default/src/eventStatusChangeMail.ts` の `onEventChanged` | イベントドキュメントの変更をトリガーとしており、orders のパスには依存しない |


## 8.5. Firestore トリガー（createEventMembers）— legacy からの移行

**開発フェーズ**: [11_EventMemberOrderのタスク計画.md](./11_EventMemberOrderのタスク計画.md) の **Phase 2** で実装する（Callable / Webhook / カート API と同時デプロイ。`confirmOrder` 完了時点で `Event.members` が更新されるようにするため）。

### 現行の仕組み

- `functions/legacy/src/event-members.js` の `create_event_members` が `communities/{communityId}/events/{eventId}/orders/{orderId}` の **onWrite** を監視
- order の書き込み（作成・更新・削除）が発生するたびに、同じイベント配下の全 orders を走査し、`status === 'ordered'` のユーザーを集約
- `event.members` 配列（DocumentReference の配列）と `event_num_members` を更新
- この仕組みにより、注文確定・キャンセル時の `Event.members` 配列の整合性が自動的に保たれている

### 変更方針

1. [01_legacy_to_default移行](./01_legacy_to_default移行.md) に従い、`functions/legacy/src/event-members.js` を **`functions/default/src/eventMembers.ts`** に移行する（v1 `onWrite` → v2 `onDocumentWritten`、JavaScript → TypeScript）
2. 移行と同時に、新パス + `collectionGroup` 方式に対応する
3. `confirmOrder` / `stripeWebhook` / `cancelOrders` では `Event.members` 配列を直接更新せず、order ドキュメントへの書き込みをトリガーに `createEventMembers` が自動更新する

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `functions/default/src/eventMembers.ts`（新規作成） | legacy の `event-members.js` を TypeScript に移行。以下の変更を含む |
| 同上 | (1) v1 `onWrite` → v2 `onDocumentWritten` に変更 |
| 同上 | (2) トリガーの `document` パスを `communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}` に変更 |
| 同上 | (3) 内部の orders 走査を `eventRef.collection('orders')` → `collectionGroup('member_orders')` + `where('event_id', '==', eventId)` に変更（`members` サブコレクション配下の member_orders を横断取得するため） |
| 同上 | (4) `db.runTransaction` を廃止し通常の read + update に変更する（`collectionGroup` はトランザクション内で使用できないため。毎回全集約し直すべき等な設計のためトランザクションなしでも整合性は保たれる） |
| `functions/legacy/src/event-members.js` | 廃止・削除 |

### 変更後のコードイメージ

```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { createModuleLogger } from './utils/logger.js'

const logger = createModuleLogger('eventMembers')

export const createEventMembers = onDocumentWritten(
  {
    document: 'communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}',
    region: 'asia-northeast1',
  },
  async (event) => {
    const db = getFirestore()
    const { communityId, eventId } = event.params

    const eventRef = db
      .collection('communities').doc(communityId)
      .collection('events').doc(eventId)

    // collectionGroup で event 配下の全 member_orders を取得
    const ordersSnapshot = await db
      .collectionGroup('member_orders')
      .where('event_id', '==', eventId)
      .get()

    const userIds = new Set<string>()
    ordersSnapshot.docs.forEach((doc) => {
      if (doc.get('status') === 'ordered') {
        userIds.add(doc.get('user_id'))
      }
    })

    await eventRef.update({
      members: Array.from(userIds).map((userId) => db.doc(`/users/${userId}`)),
      event_num_members: userIds.size,
    })

    logger.info('Updated event members', { eventId, memberCount: userIds.size })
  },
)
```

### 備考

- v2 `onDocumentWritten` はイベントオブジェクト経由でパラメータを取得する（`event.params`）
- べき等性: 毎回 `status === 'ordered'` の全ユーザーを集約し直すため、トランザクションなしでも最終的な整合性は保たれる
- 一部キャンセル（一部の order.status が `canceled` に変更）ではトリガーが発火するが、他に `ordered` な order が残っていれば `Event.members` 配列に影響しない
- 全キャンセル（ユーザーの全 order.status が `canceled` に変更）ではトリガーが発火し、そのユーザーの `ordered` な order がなくなるため、`Event.members` 配列から自動的に除外される
- legacy の `create_event_members` と default の `createEventMembers` が同時にデプロイされると二重発火するため、default のデプロイと同時に legacy を削除すること


## 9. メール送信 Functions（注文データの読み取り・集計）

### 概要

以下の Functions が `event.getOrders()` 経由で注文データを読み取り、メールテンプレート用のデータを組み立てている。
新設計では `event.getOrders()` の内部パスが `members/{userId}/member_orders` に変わるため、store メソッド側の修正で一括対応する。
ただし `menu.count` を使ったループは個別に変更が必要。1 order = 1 メニューなので、orders を `menu_id` で groupBy して集計するか、orders をそのまま1行1品で使用する。

### 変更が必要なファイル

| ファイル | 用途 | 変更内容 |
|:--|:--|:--|
| `functions/default/src/eventStatusChangeMail.ts` | イベントステータス変更時メール | `createTemplateDataForOrderDeadline` 内の `menu.count` ループ → orders を `menu_id` で groupBy して算出 |
| `functions/default/src/orderDeadlineMail.ts` | 注文期限メール（店舗・主催者・メンバー向け） | `createOrdersForOrderDeadline`（`utils/order.ts`）を使用。ユーティリティ側の修正で対応 |
| `functions/default/src/orderRemindMail.ts` | 主催者向け注文リマインド | `createOrdersForOrganizerRemind` 内の `menu.count` ループ → orders を groupBy に変更。全ステータスの注文を status 別に分類する処理も型変更の影響を受ける |
| `functions/default/src/inCartNotification.ts` | カート放置通知 | ① `sendInCartNotificationToMember` 内の `getInCartOrdersByUpdatedTime`（`stores/event.ts`）→ `getInCartMemberOrdersByUpdatedTime`（`stores/memberOrder.ts`）に切り替え。② `sendInCartEventDeadlineNotificationToMember` 内の `event.getOrders('in_cart')` → `ShokujiiEvent.getOrders('in_cart')` 委譲後の呼び出しに変更（`getOrders` 委譲対応で新パスに切り替わる。この関数も変更対象であることを明示する） |
| `functions/default/src/remindUnorderedMail.ts` | 未注文リマインド | `event.hasOrderedOrders()` のパス変更（store 側修正で対応）。メールテンプレートデータにメニュー情報は含まないため、groupBy 変更は不要 |
| `functions/default/src/eventInformationMail.ts` | イベント情報メール | `event.getOrders()` で参加人数をチェック。パス変更のみで、メニュー情報は使用していない |

### store 側の変更（一括対応箇所）

**方針**: `ShokujiiEvent` のメソッドを維持し、内部実装を `functions/default/src/stores/order.ts` の独立 store 関数への委譲に変更する。詳細は [05_EventOrder→EventMemberOrder.md の Store 関数インターフェース](./05_EventOrder→EventMemberOrder.md) を参照。

- パス構築・Firestore アクセスのロジックは独立 store 関数に一元化する
- `ShokujiiEvent` のメソッドは薄いラッパーとして残す（メール送信系 11 ファイルの呼び出し側の変更を最小化）

| メソッド | 現行 | 新設計 | 呼び出し側への影響 |
|:--|:--|:--|:--|
| `ShokujiiEvent.getOrders(status?)` | `events/{eventId}/orders` を直接参照 | 内部で `getOrders()` に委譲。`collectionGroup('member_orders')` + `where('event_id', '==', eventId)` 等 | 呼び出し側の変更なし（戻り値の型は `EventMemberOrder[]` に変更） |
| `ShokujiiEvent.hasOrderedOrders()` | `events/{eventId}/orders` を直接参照 | 内部で `hasOrderedOrders()` に委譲 | 呼び出し側の変更なし |
| `ShokujiiEvent.getOrder(orderId)` | `events/{eventId}/orders/{orderId}` | 内部で `getOrder(userId, orderId)` に委譲 | **引数に `userId` 追加が必要**。呼び出し箇所: `functions/default/src/eventReceipt.ts`（Phase 6 で全面書き換え予定のため、`userId` 追加修正は Phase 6 に含める） |
| `ShokujiiEvent.saveOrder(order)` | `events/{eventId}/orders/{orderId}` | 内部で `saveOrder(userId, order)` に委譲 | **引数に `userId` 追加が必要**。呼び出し箇所: `functions/default/src/eventReceipt.ts`（同上） |
| `getInCartOrdersByUpdatedTime()` | `collectionGroup('orders')` で `status == 'in_cart'` | `collectionGroup('member_orders')` に変更。converter を新スキーマに変更 | converter の型変更のみ |

### 変更不要なファイル

| ファイル | 理由 |
|:--|:--|
| `functions/default/src/pollingTask.ts` | 各メール送信関数を呼び出すだけ。個別関数側の修正で対応 |
| `functions/default/src/eventConclusionMail.ts` | `event.getOrders()` を使用していない（イベントデータのみ参照） |


## 10. API ラッパー（base/src/apis/）

### 現行の仕組み

- `base/src/apis/order.ts`: `addOrder`、`updateOrderStatus`、`updateMenuCountInCart`、`deleteMenuInCart` の Callable ラッパーを提供
- `base/src/apis/stripe.ts`: `createStripeCheckoutSession`、`stripeRefunds` の Callable ラッパーを提供
- フロント側（`cart.vue`、`UserEventCard.vue`、`[userId].vue` 等）からこれらを呼び出している

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/apis/order.ts` | `addOrder` → `addToCart` にリネーム。`updateMenuCountInCart` は廃止。`deleteMenuInCart` → `removeFromCart` にリネーム。`updateOrderStatus` → `confirmOrder` にリネーム。各リクエスト・レスポンス型を新 API に合わせて変更 |
| `base/src/apis/stripe.ts` | `stripeRefunds` → `cancelOrders` にリネーム。`StripeRefundsRequest` → `CancelOrdersRequest` に型変更。レスポンス型を `CancelOrdersResponse` に変更 |
| `common/src/apis/order.ts` | 新 API 型定義（`AddToCartRequest` / `RemoveFromCartRequest` / `ConfirmOrderRequest`）を追加。旧型定義を段階的に廃止 |
| `common/src/apis/stripe.ts` | `CancelOrdersRequest` / `CancelOrdersResponse` 型を追加。旧 `StripeRefundsRequest` を段階的に廃止 |


## 11. Functions ユーティリティ

### 現行の仕組み

- `functions/default/src/utils/order.ts` の `createOrdersForOrderDeadline`: `event.getOrders('ordered')` で注文取得 → `menu.count` 回ループでメール用注文リストを組み立て
- `functions/default/src/utils/mail.ts` の `getEventMemberEmails`: `event.getOrders('ordered')` → `user_id` でメール宛先を取得
- `functions/default/src/utils/mail.ts` の `getCommunityNonMemberEmails`: 同上で注文済みユーザーを除外

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `functions/default/src/utils/order.ts` | `createOrdersForOrderDeadline` 内の `menu.count` ループ → 1 order = 1 メニューなのでループ不要。orders をそのまま1行1品でメールテンプレート用配列に変換（必要に応じて `menu_id` で groupBy） |
| `functions/default/src/utils/mail.ts` の `getEventMemberEmails` | `event.getOrders('ordered')` のパス変更は store 側で対応。型変更のみ |
| `functions/default/src/utils/mail.ts` の `getCommunityNonMemberEmails` | 同上。`orders.map(order => order.user_id)` は新スキーマでも同じフィールドなので変更軽微 |


## 12. メンバー一覧ページ（base コンポーネント）

### 現行の仕組み

- `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` が `eventStore.members` を参照
- メンバーを `orders` の `updated_at` でソートしている

### 変更が必要なファイル

| ファイル | 変更内容 |
|:--|:--|
| `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` | `member.orders` の型変更に伴うソートロジックの修正。orders を `menu_id` で groupBy してメニュー表示 |


## 13. カート画面（cart.vue / EventCartDialog.vue）

詳細は [06_EventMemberOrderに伴うカート・注文・決済の実装.md](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) を参照。

cart.vue は API 呼び出し名の変更だけでなく、数量操作ロジック・削除フロー・注文確定（order_ids 配列）・Stripe 決済（order_ids 配列）・テンプレート表示（orders を groupBy）・`community_account` 取得方法など全面的な改修が必要。06 のスコープで実装する。
