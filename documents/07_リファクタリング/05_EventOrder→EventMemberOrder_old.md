# EventOrder → EventMemberOrder データ構造変更

## 概要

- 注文プロセス単位での「EventOrder」から、メンバー単位で注文データを管理する「EventMemberOrder」へデータ構造を変更する

## 課題

- EventOrder に stripe 決済情報等のデータが入りすぎている
- イベントに対して複数回注文した際に、1ユーザーが複数の EventOrder を持ち、注文を跨いでのデータの取り扱いが難しい状態になっている
- stripe の payment_intent がクライアントから読める状態になっており、セキュリティリスクがある

## 対応方針

- EventOrder を廃止し、EventMemberOrder を新設する
- events コレクションに members サブコレクションを新設する（memberId = user_id。1ユーザー1ドキュメント）
- members の下に orders サブコレクションを新設する（1ドキュメント = 1回の注文プロセス）
- orders ドキュメント内に menus 配列を持つ（1品 = 1オブジェクト。各オブジェクトが個別に status を持つ）
- 旧 orders コレクションは stripes コレクションにリネームし、stripe 決済情報を管理する
- stripes コレクションのデータは非公開（Functions からのみアクセス可能）にする
- community_account フィールドは全コレクションから削除する（理由は後述）

### データ構造変更で享受するメリット

- 柔軟性が上がる / 制約が減る
  - 「オーダー単位」での仕様対応もこれまで通りできる
  - さらに「ユーザー単位」での仕様対応ができる。仕様の柔軟性を高める
    - ユーザーごとの割引金額
    - ユーザーごとの参加人数
    - ユーザーごとの xxxx 機能
- ユーザーの注文情報の変更が行いやすくなる
  - 注文の一部キャンセル、ユーザー情報の登録、参加人数の調整など
- orderDoc の肥大化をやめる
  - 今後オプションメニュー機能などを作るときに option_menu とか入れるべきではない
- セキュリティ対策
  - stripe の payment_intent が公開されている状態を解消する
  - stripes コレクションの read/write を Functions のみに制限する


## データ構造サマリ

```
communities/{communityId}/events/{eventId}/members/{userId}
  ├── user_id: string
  ├── event_id: string
  ├── community_id: string
  ├── created_at: Timestamp
  ├── updated_at: Timestamp
  ├── member_count: number              // 将来用（同伴者設定）
  ├── discount_amount: number           // 将来用（コミュニティ割引）
  │
  └── orders/{orderId}                  // サブコレクション：1注文プロセス=1ドキュメント
        ├── order_id: string
        ├── user_id: string
        ├── event_id: string
        ├── community_id: string
        ├── status: 'in_cart' | 'ordered' | 'canceled'
        ├── stripe_id: string?          // stripe 決済時に紐付け
        ├── menus: [                    // 1品=1オブジェクト
        │     {
        │       menu_id: string,
        │       partner_id: string,
        │       name: string,
        │       price: number,
        │       status: 'in_cart' | 'ordered' | 'canceled',
        │       updated_at: Timestamp,
        │     }
        │   ]
        ├── created_at: Timestamp
        ├── updated_at: Timestamp
        ├── carted_at: Timestamp
        ├── ordered_at: Timestamp?
        ├── canceled_at: Timestamp?
        └── receipt_number: string?

communities/{communityId}/events/{eventId}/stripes/{stripeId}
  ├── stripe_id: string
  ├── user_id: string
  ├── event_id: string
  ├── community_id: string
  ├── created_at: Timestamp
  ├── updated_at: Timestamp
  ├── menus: [                          // 決済時のスナップショット（参考情報）
  │     { name: string, price: number, count: number }
  │   ]
  ├── payment_intent: string
  ├── pay_amount: number
  ├── refunds: [                        // 返金履歴（一部返金のたびに追加）
  │     { refund_id: string, amount: number, menus: [...], created_at: Timestamp }
  │   ]
  ├── pay_community_bill_off_amount: number // 将来用
  └── pay_user_fee_amount: number       // 将来用
```


## データ構造・コレクション 詳細

### Firestore パス

```
communities/{communityId}/events/{eventId}/members/{userId}
communities/{communityId}/events/{eventId}/members/{userId}/orders/{orderId}
communities/{communityId}/events/{eventId}/stripes/{stripeId}
```

### members コレクション（新設）

`communities/{communityId}/events/{eventId}/members/{userId}`

memberId は user_id と同一にする。1ユーザー1ドキュメントを保証し、`doc(userId)` で直接参照可能にする。

| フィールド | 型 | 必須 | 備考 |
|:--|:--|:--|:--|
| user_id | string | ○ | |
| event_id | string | ○ | |
| community_id | string | ○ | |
| created_at | Timestamp | ○ | メンバー初回作成日時 |
| updated_at | Timestamp | ○ | |
| member_count | number | - | 参加人数・同伴者設定（※将来実装予定） |
| discount_amount | number | - | コミュニティからの割引金額（※将来実装予定） |

### Event ドキュメントの members 配列との関係

Event ドキュメントには `members` 配列（ユーザーID の配列）が存在し、定員チェックやレター送信対象の判定に使用されている。この配列は引き続き使用する。

**`Event.members` 配列の更新方法**: 現行では legacy の Firestore トリガー（`functions/legacy/src/event-members.js` の `create_event_members`）が orders の onWrite で全 `ordered` ユーザーを集約し直して `Event.members` 配列と `event_num_members` を更新している。新設計では [01_legacy_to_default移行](./01_legacy_to_default移行.md) に従い `functions/default/src/eventMembers.ts` に移行した上で、新パス + `collectionGroup` 方式に対応する（詳細は [07](./07_EventMemberOrderに伴う既存機能の修正.md) のセクション 8.5 を参照）。`confirmOrder` / `stripeWebhook` / `cancelMenuItems` では `Event.members` 配列を直接更新しない。

| 操作 | members コレクション | Event.members 配列 | community.addMember |
|:--|:--|:--|:--|
| カート追加（`addToCart`） | upsert（初回作成） | 変更なし | 実行しない |
| 注文確定（`confirmOrder` / `stripeWebhook`） | 変更なし | **トリガーが自動更新** | 実行する |
| 全キャンセル（`cancelMenuItems`） | **削除しない**（履歴として残す） | **トリガーが自動更新**（ordered が0になればユーザーが消える） | - |

- `members` コレクションのドキュメントはカート追加時に作成し、全キャンセルされても削除しない（「一度参加した」記録として保持）
- `Event.members` 配列は Firestore トリガー（`createEventMembers`）が orders の書き込みをトリガーに `status === 'ordered'` のユーザーを集約して更新する。全キャンセル時は ordered なユーザーがいなくなるため、トリガーが自動的にユーザーを除外する
- この非対称な扱いにより、全キャンセルしたユーザーにレターが届かないようにしつつ、members コレクション配下の orders 履歴は保持される

### orders サブコレクション（新設）

`communities/{communityId}/events/{eventId}/members/{userId}/orders/{orderId}`

1ドキュメント = 1回の注文プロセス（= 1回の stripe 決済 or 1回の請求書払い注文確定に対応）。
同一ユーザーが追加注文した場合は、新しい order ドキュメントが作成される。
カート状態（in_cart）の order は1ユーザーにつき最大1つ。

| フィールド | 型 | 必須 | 備考 |
|:--|:--|:--|:--|
| order_id | string | ○ | ドキュメントID と同一 |
| user_id | string | ○ | |
| event_id | string | ○ | |
| community_id | string | ○ | |
| status | string | ○ | `in_cart` / `ordered` / `canceled` |
| menus | OrderMenu[] | ○ | 下記参照。1品 = 1オブジェクト |
| stripe_id | string | - | stripe 決済時に紐付け。stripes ドキュメントの ID |
| created_at | Timestamp | ○ | |
| updated_at | Timestamp | ○ | |
| carted_at | Timestamp | ○ | カート作成日時 |
| ordered_at | Timestamp | - | 注文確定日時 |
| canceled_at | Timestamp | - | 全キャンセル日時 |
| receipt_number | string | - | 領収書番号（Stripe 決済完了時に発行） |

**order の status ルール**:
- `in_cart`: カートに入っている状態（未決済）
- `ordered`: 注文確定済み。menus 内に `canceled` のメニューがあっても、有効なメニューが残っていれば `ordered` のまま
- `canceled`: 全メニューが `canceled` になった場合

### OrderMenu（menus 配列の各要素）

1品 = 1オブジェクト。同一メニューを3つ注文した場合、同じ menu_id のオブジェクトが3つ作られる。
各オブジェクトが個別に status を持つため、一部キャンセルは対象オブジェクトの status を `canceled` に変更するだけで実現できる。

| フィールド | 型 | 必須 | 備考 |
|:--|:--|:--|:--|
| menu_id | string | ○ | |
| partner_id | string | ○ | 店舗ID |
| name | string | ○ | メニュー名 |
| price | number | ○ | 単価（税込） |
| status | string | ○ | `in_cart` / `ordered` / `canceled` |
| updated_at | Timestamp | ○ | |

**menus の一部キャンセル例**:
```
menus: [
  { menu_id: "karaage", name: "唐揚げ", price: 500, status: "ordered", ... },
  { menu_id: "karaage", name: "唐揚げ", price: 500, status: "ordered", ... },
  { menu_id: "karaage", name: "唐揚げ", price: 500, status: "canceled", ... },
  { menu_id: "gyudon", name: "牛丼", price: 1000, status: "ordered", ... },
  { menu_id: "gyudon", name: "牛丼", price: 1000, status: "ordered", ... },
]
```
→ 唐揚げ3つのうち1つキャンセル済み、牛丼2つは有効

**カートUIでの表示**: `menu_id` ごとに groupBy して個数を算出する。+/- ボタンの操作はオブジェクトの追加/削除で実現する。

### stripes コレクション（旧 orders コレクションのリネーム）

`communities/{communityId}/events/{eventId}/stripes/{stripeId}`

stripe 決済情報を管理する。orders ドキュメントと 1:1 で対応する。
menus は決済時のスナップショットとして参考情報として保持する（正の情報は orders ドキュメント側）。

| フィールド | 型 | 必須 | 備考 |
|:--|:--|:--|:--|
| stripe_id | string | ○ | ドキュメントID。旧 order_id 相当 |
| user_id | string | ○ | |
| event_id | string | ○ | |
| community_id | string | ○ | |
| created_at | Timestamp | ○ | 決済ドキュメント作成日時 |
| updated_at | Timestamp | ○ | |
| menus | StripeMenu[] | ○ | 決済時のスナップショット（参考情報） |
| payment_intent | string | ○ | Stripe の PaymentIntent ID |
| pay_amount | number | ○ | 合計注文金額 |
| refunds | RefundEntry[] | ○ | 返金履歴（一部返金のたびに追加。初期値は空配列） |
| pay_community_bill_off_amount | number | - | コミュニティ割引金額（※将来実装予定） |
| pay_user_fee_amount | number | - | ユーザー手数料（※将来実装予定） |

**RefundEntry**（refunds 配列の各要素）:
```
{
  refund_id: "re_xxx",           // Stripe の Refund ID
  amount: 1500,                  // 返金金額
  menus: [                       // キャンセルしたメニュー
    { menu_id: "karaage", cancel_count: 1 },
    { menu_id: "gyudon", cancel_count: 1 }
  ],
  created_at: Timestamp
}
```
返金累計金額は `refunds.reduce((sum, r) => sum + r.amount, 0)` で算出する。

**StripeMenu**（menus 配列の各要素）:
```
{ name: "唐揚げ", price: 500, count: 3 }
```
stripes の menus は集計済みの形（menu_id ごとに count でまとめる）で保存する。

### Security Rules

| コレクション | read | write | 備考 |
|:--|:--|:--|:--|
| members | 許可 | Functions のみ | 現行の orders と同様、クライアント書き込み不可 |
| orders（members 配下） | 許可 | Functions のみ | |
| stripes | Functions のみ | Functions のみ | payment_intent を保護するため、クライアントからの read も不可 |

**firestore.rules の変更内容**:

現行の orders ルール（`match /orders/{order} { allow write: if false }`）を削除し、以下を追加する。
stripes は末尾の `match /{document=**} { allow read: if true }` より前に配置し、明示的に `read: false` を書く必要がある。

```
match /events/{event} {
    // 既存の match /orders/{order} を削除

    match /members/{memberId} {
        allow write: if false
        match /orders/{orderId} {
            allow write: if false
        }
    }
    match /stripes/{stripeId} {
        allow read, write: if false
    }
}
```

### community_account を持たない理由
旧 EventOrder では `community_account` を各ドキュメントに冗長化していたが、新設計では削除する。
- `community_account` はコミュニティの URL スラッグであり、将来的に変更機能を開発する可能性がある
- 冗長化していると、変更時に members・orders・stripes の全ドキュメントを一括更新する必要が生じる
- `community_account` が必要な場面（URL 生成等）では、イベントデータ（`event.community_account`）から取得すれば十分である
なお `community_id` は全コレクションに残す。`collectionGroup` クエリで取得した際にパスから辿るのは階層が深く脆いため、フィールドとして保持する。


## API（Callable Functions）変更

### 現行 → 新設計のマッピング

| 現行 | 新設計 | 変更内容 |
|:--|:--|:--|
| `addOrder` | `addToCart` | member upsert + order の upsert。リクエストの count を元に1品1オブジェクトに展開して menus 配列に追加 |
| `updateMenuCountInCart` | **廃止** | +ボタンは `addToCart`（count: 1）、-ボタンは `removeFromCart` に分割 |
| `deleteMenuInCart` | `removeFromCart` | 指定 menu_id のオブジェクトを末尾から1つ削除。menus が空になった場合は order ドキュメント自体を削除 |
| `updateOrderStatus` | `confirmOrder` | 請求書払い用。order と menus の status を `ordered` に。`event.members` 配列への追加 + `community.addMember` も実行 |
| `createStripeCheckoutSession` | 変更 | EventOrder オブジェクトではなく ID で受け取り、Functions 側で order を読み取る |
| `stripeRefunds` | `cancelMenuItems` に拡張 | 一部キャンセル対応。キャンセル対象の menu_id と個数を受け取る |

### 新 API 型定義

```typescript
// カートにメニューを追加（イベントページからの追加、+ボタン）
// menus の count は Functions 側で1品1オブジェクトに展開する
// 例: { menu_id: "karaage", count: 3 } → 3つのオブジェクトを menus 配列に追加
type AddToCartRequest = {
  community_id: string
  event_id: string
  menus: { menu_id: string; partner_id: string; name: string; price: number; count: number }[]
}
type AddToCartResponse = {
  order_id: string
}

// カートからメニューを1つ削除（-ボタン）
// 同一 menu_id のオブジェクトが複数ある場合、末尾から1つ削除する
// menus が空になった場合は order ドキュメント自体を削除する
// ※ゴミ箱ボタン（全削除）は存在しない。個数が1の時に-ボタンを押すと全削除と同じ状態になる
type RemoveFromCartRequest = {
  community_id: string
  event_id: string
  order_id: string
  menu_id: string
}

// 注文確定（請求書払い）
// order と menus の status を ordered に更新
// event.members 配列へのユーザー追加 + community.addMember も実行
type ConfirmOrderRequest = {
  community_id: string
  event_id: string
  order_id: string
}

// Stripe チェックアウトセッション作成
type CreateStripeCheckoutSessionRequest = {
  community_id: string
  event_id: string
  order_id: string
  isPosted: boolean
}

// メニュー単位キャンセル（一部返金対応。複数メニューを一括キャンセル可能）
type CancelMenuItemsRequest = {
  community_id: string
  event_id: string
  order_id: string
  menus: { menu_id: string; cancel_count: number }[]
}
```

**変更のポイント**:
- `AddToCartRequest` の menus に `count` フィールドを追加。Functions 側で `count` 個分の1品1オブジェクトに展開する（初回のイベントページからの複数個選択にも対応）
- `RemoveFromCartRequest` はゴミ箱ボタンなし。常に1つずつ削除（末尾から）。menus が空になったら order ごと削除
- `ConfirmOrderRequest` は `event.members` 配列追加 + `community.addMember` も含む
- 現行の `CreateStripeCheckoutSessionRequest` は EventOrder オブジェクトそのものを渡しているが、新設計では ID のみ渡し Functions 側で order を読み取る（セキュリティ向上）
- 現行の `stripeRefunds` は全額返金のみだが、新設計の `cancelMenuItems` は一部キャンセル（指定メニューの指定個数）に対応する


## Stripe Functions 変更

詳細は [06_EventMemberOrderに伴うカート・注文・決済の実装.md](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) を参照。

- `createStripeCheckoutSession`: ID ベースのリクエストに変更。`imageUrl` はメニューマスタから取得。metadata から `communityAccount` を削除
- `stripeWebhook`: order 更新 + stripes 作成 + `event.members` 追加をトランザクション内で実行
- `stripeRefunds` → `cancelMenuItems`: 一部キャンセル対応（詳細は [09_EventMemberOrderに伴うキャンセル機能.md](./09_EventMemberOrderに伴うキャンセル機能.md)）


## Store 関数インターフェース

### 設計方針: ShokujiiEvent メソッドを維持し、独立 store 関数に委譲

現行では注文データへのアクセスが 2 系統存在する。

| 経路 | ファイル | 呼び出し元 |
|:--|:--|:--|
| `ShokujiiEvent` のインスタンスメソッド | `functions/default/src/stores/event.ts` | メール送信系 Functions、領収書、請求書など（11 ファイル / 15 呼び出し） |
| 独立 store 関数 | `functions/default/src/stores/order.ts` | `orders.ts`、`stripeWebhook.ts`、`stripeRefunds.ts`（3 ファイル / 16 呼び出し） |

新設計では **ShokujiiEvent のメソッドを維持しつつ、内部実装を独立 store 関数への委譲に変更する**方針とする。

- パス構築・Firestore アクセスのロジックは `stores/order.ts` の独立関数に一元化する
- `ShokujiiEvent` のメソッドは薄いラッパーとして残す（11 ファイルの呼び出し側の変更を最小化）
- `getOrder` のように `userId` 引数が追加されるメソッドは、シグネチャ変更が呼び出し側にも波及する

```typescript
// ShokujiiEvent メソッド → 独立 store 関数への委譲例
class ShokujiiEvent extends Event {
  async getOrders(status?: OrderStatusType, transaction?: Transaction): Promise<EventMemberOrder[]> {
    return getOrders(this.community_id, this.id, status, transaction)
  }

  async getOrder(userId: string, orderId: string, transaction?: Transaction): Promise<EventMemberOrder | undefined> {
    return getOrder(this.community_id, this.id, userId, orderId, transaction)
  }

  async saveOrder(userId: string, order: EventMemberOrder, transaction?: Transaction): Promise<void> {
    return saveOrder(this.community_id, this.id, userId, order, transaction)
  }

  async hasOrderedOrders(transaction?: Transaction): Promise<boolean> {
    return hasOrderedOrders(this.community_id, this.id, transaction)
  }
}
```

### 独立 store 関数（functions/default/src/stores/order.ts）

新パス（`members/{userId}/orders/{orderId}`）では `userId` が必要になるため、全ての store 関数のシグネチャが変わる。

```typescript
// イベント内の全 orders を取得（collectionGroup 方式）
export const getOrders = async (
  communityId: string,
  eventId: string,
  status?: OrderStatusType,
  transaction?: Transaction,
): Promise<EventMemberOrder[]>

// order ドキュメントの取得
export const getOrder = async (
  communityId: string,
  eventId: string,
  userId: string,         // 追加
  orderId: string,
  transaction?: Transaction,
): Promise<EventMemberOrder | undefined>

// カート中の order を取得（1ユーザーにつき最大1つ）
export const getOrderInCart = async (
  communityId: string,
  eventId: string,
  userId: string,         // 追加
  transaction?: Transaction,
): Promise<EventMemberOrder | undefined>

// ordered の注文が存在するか判定
export const hasOrderedOrders = async (
  communityId: string,
  eventId: string,
  transaction?: Transaction,
): Promise<boolean>

// order ドキュメントの保存（upsert）
export const saveOrder = async (
  communityId: string,
  eventId: string,
  userId: string,         // 追加
  order: EventMemberOrder,
  transaction?: Transaction,
): Promise<void>

// order ドキュメントの削除
export const deleteOrder = async (
  communityId: string,
  eventId: string,
  userId: string,         // 追加
  orderId: string,
  transaction?: Transaction,
): Promise<void>

// members ドキュメントの取得・作成
export const getMember = async (
  communityId: string,
  eventId: string,
  userId: string,
  transaction?: Transaction,
): Promise<EventMember | undefined>

export const saveMember = async (
  communityId: string,
  eventId: string,
  member: EventMember,
  transaction?: Transaction,
): Promise<void>

// stripes ドキュメントの取得・作成
export const getStripe = async (
  communityId: string,
  eventId: string,
  stripeId: string,
  transaction?: Transaction,
): Promise<EventStripe | undefined>

export const saveStripe = async (
  communityId: string,
  eventId: string,
  stripe: EventStripe,
  transaction?: Transaction,
): Promise<void>
```

**注意点**:
- `getOrders` は新規追加。現行は `ShokujiiEvent` メソッドにのみ存在していた。`collectionGroup('orders')` + `where('event_id', '==', eventId)` で取得し、移行期間中は depth フィルタ（depth 8 のみ）を適用
- `hasOrderedOrders` も新規追加。`collectionGroup('orders')` + `where('event_id', '==', eventId)` + `where('status', '==', 'ordered')` + `limit(1)` で判定
- `getOrderInCart` は現行では `collectionGroup` で `user_id` + `status` でクエリしていたが、新パスでは `members/{userId}/orders` コレクション内で `status == 'in_cart'` のクエリに変更。`userId` が引数に必要
- stripes の store 関数は新規追加。`getStripe` / `saveStripe` で stripes コレクションの CRUD を行う

### ShokujiiEvent メソッドのシグネチャ変更

| メソッド | 現行 | 新設計 | 呼び出し側への影響 |
|:--|:--|:--|:--|
| `getOrders(status?)` | そのまま | そのまま（内部が委譲に変更） | なし |
| `hasOrderedOrders()` | そのまま | そのまま（内部が委譲に変更） | なし |
| `getOrder(orderId)` | orderId のみ | `getOrder(userId, orderId)` | **引数追加が必要** |
| `saveOrder(order)` | order のみ | `saveOrder(userId, order)` | **引数追加が必要** |


## Firestore インデックス変更

### 削除するインデックス（community_account 廃止に伴い不要）

| フィールド構成 | 理由 |
|:--|:--|
| `community_account` + `event_id` + `status` + `updated_at` | community_account 削除 |
| `community_account` + `event_id` + `status` + `user_id` | community_account 削除 |
| `community_account` + `event_id` + `status` + `user_id` + `updated_at` | community_account 削除 |
| `partner_id` + `order_date` | レガシー用。新設計では不要 |

### 残すインデックス（COLLECTION_GROUP: orders）

| フィールド構成 | 用途 |
|:--|:--|
| `status` + `updated_at` | カート購読、注文一覧 |
| `status` + `user_id` | ユーザーのカート取得 |
| `status` + `user_id` + `updated_at` DESC | ユーザー注文一覧（マイページ） |
| `user_id` + `updated_at` DESC | ユーザー注文一覧（ページング） |
| `user_id` + `updated_at` DESC + `status` DESC | ユーザー注文一覧（ステータス付き） |

### 新規追加するインデックス（COLLECTION_GROUP: orders）

| フィールド構成 | 用途 |
|:--|:--|
| `event_id` + `status` + `updated_at` | イベント別注文一覧（community_account の代替） |
| `event_id` + `status` + `user_id` | イベント別メンバー取得 |


## 実装

### 実装_カート・注文・決済

詳細は [06_EventMemberOrderに伴うカート・注文・決済の実装.md](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) を参照。

- カート追加（`addToCart`）: member upsert + order upsert + menus 展開
- カート削除（`removeFromCart`）: menus 末尾から1品削除。空になったら order 削除
- 注文確定（`confirmOrder`）: status 更新 + `event.members` 追加 + `community.addMember`
- Stripe 決済: `createStripeCheckoutSession` + `stripeWebhook`（トランザクション内で実行）
- カート画面（`cart.vue` / `EventCartDialog.vue`）: 数量操作・削除・注文確定・Stripe 決済の全面改修
- eventStore ラッパー関数: `addOrder` → `addToCart` 等のリネーム

### 実装_既存機能の修正

詳細は [07_EventMemberOrderに伴う既存機能の修正.md](./07_EventMemberOrderに伴う既存機能の修正.md) を参照。

- フロント表示（イベントページ、管理者画面、ADMIN 画面、マイページ、メンバー一覧）
- 請求書・領収書
- イベントメンバーのリスト取得、レターのユーザリスト取得
- Firestore トリガー（`onOrderChanged` の document パス変更）
- メール送信 Functions（注文データの読み取り・集計ロジック変更）
- API ラッパー（`base/src/apis/` の関数名・型変更）
- Functions ユーティリティ（`utils/order.ts`、`utils/mail.ts`）

### 実装_キャンセル機能

詳細は [09_EventMemberOrderに伴うキャンセル機能.md](./09_EventMemberOrderに伴うキャンセル機能.md) を参照。

- メニュー単位でのキャンセル（一部キャンセル）
- Stripe 一部返金
- 全キャンセル

### bokudeli-event-payment

- 請求書・お店の支払い明細は orders ドキュメントの menus の値を参照する


## データ移行計画

詳細は [10_EventMemberOrderに伴うデータ移行.md](./10_EventMemberOrderに伴うデータ移行.md) を参照。

- 旧 `orders` → 新 `members` + `orders` + `stripes` にバッチコピー。旧データは変更しない
- 並行運用は行わず、メンテナンスウィンドウを設けて一斉切り替え
- 旧 orders コレクションはロールバック用に保持


## 影響範囲（コード変更が必要なファイル）

### 影響度：大（全面改修）

| ファイル | 変更内容 |
|:--|:--|
| `common/src/schemas/EventOrder.ts` | 新スキーマ EventMemberOrder + EventStripe を作成。旧スキーマは段階的に廃止 |
| `common/src/apis/order.ts` | API 型定義を新データ構造に合わせて変更（上記 API 変更参照） |
| `common/src/apis/stripe.ts` | EventOrder → ID ベースに変更 |
| `base/src/stores/event.ts` | subscribeOrders を members + orders サブコレクションの購読に変更 |
| `base/src/stores/orderList.ts` | `collectionGroup('orders')` のクエリパス変更 |
| `base/src/stores/currentUser.ts` | カート購読を members/orders 構造に変更 |
| `functions/default/src/stores/order.ts` | EventMemberOrder の CRUD に全面書き替え |
| `functions/default/src/orders.ts` | Callable を新 API（addToCart / removeFromCart / confirmOrder）に全面改修 |
| `functions/default/src/stripe.ts` | ID ベースのリクエストに変更、order 読み取りロジック追加 |
| `functions/default/src/stripeWebhook.ts` | stripes ドキュメント作成ロジック追加、menus の status 一括更新 |
| `functions/default/src/stripeRefunds.ts` | 一部キャンセル対応（cancelMenuItems）に拡張 |

### 影響度：中

| ファイル | 変更内容 |
|:--|:--|
| `common/src/utils/invoice.ts` | 請求計算ロジックの入力型変更（1品1オブジェクト対応） |
| `base/src/utils/orders.ts` | 集計関数のリファクタ（count → groupBy で算出） |
| `base/src/apis/order.ts` | 関数名・型を新 API に合わせて変更（`addOrder` → `addToCart` 等） |
| `base/src/apis/stripe.ts` | `StripeRefundsRequest` → `CancelMenuItemsRequest` 等の型変更 |
| `base/src/components/pages/cart.vue` | 06「カート・注文・決済の実装」参照。数量操作・削除・注文確定・Stripe 決済・テンプレート表示・community_account 取得を全面改修 |
| `base/src/components/UserEventCard.vue` | props の型変更 |
| `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` | `member.orders` の型変更、ソートロジックの変更 |
| `user/src/pages/u/[userId].vue` | マイページ注文一覧の型・キャンセル処理変更 |
| `user/src/components/manage/event/member.vue` | 管理者向け注文一覧の型変更 |
| `admin/src/pages/order/index.vue` | 集計方法の変更 |
| `admin/src/pages/order/[eventId].vue` | 集計方法の変更 |
| `firestore.rules` | members・orders・stripes のルール追加（上記 Security Rules 参照） |
| `firestore.indexes.json` | インデックスの追加・削除（上記インデックス変更参照） |
| `functions/default/src/stores/event.ts` | ShokujiiEvent の注文関連メソッドを独立 store 関数への委譲に変更。`getOrder` / `saveOrder` は `userId` 引数追加 |
| `functions/default/src/orderCompletionMail.ts` | `onOrderChanged` の document パス変更、`eventRef` 取得ロジック修正 |
| `functions/default/src/eventStatusChangeMail.ts` | `event.getOrders()` パス変更、`menu.count` ループ → groupBy |
| `functions/default/src/orderDeadlineMail.ts` | 同上 |
| `functions/default/src/orderRemindMail.ts` | 同上 |
| `functions/default/src/inCartNotification.ts` | `getInCartOrdersByUpdatedTime`・`event.getOrders('in_cart')` パス変更 |
| `functions/default/src/remindUnorderedMail.ts` | `event.hasOrderedOrders()` パス変更 |
| `functions/default/src/eventInformationMail.ts` | `event.getOrders()` パス変更 |
| `functions/default/src/utils/order.ts` | `createOrdersForOrderDeadline` の `menu.count` ループ → groupBy |
| `functions/default/src/utils/mail.ts` | `getEventMemberEmails`・`getCommunityNonMemberEmails` のパス変更 |
| `functions/default/src/eventMembers.ts`（新規） | legacy の `event-members.js` を default に移行 + パス変更 + `collectionGroup` + `event_id` フィルタに変更 |
| `functions/legacy/src/event-members.js` | 廃止（default への移行に伴い削除） |
| `base/src/composable/loadEventMembers.ts` | Deprecated。廃止して eventStore に統合 |
| `base/src/composable/countEventMembers.ts` | community_account 条件を削除、event_id のみでクエリ |
