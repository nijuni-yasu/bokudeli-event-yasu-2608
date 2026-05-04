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
- members の下に member_orders サブコレクションを新設する（1ドキュメント = 1メニュー）
- orderドキュメントをメニュー単位にする。複数個のメニューを注文する場合は、複数のorderドキュメントを作る。
- 1つのstripeのドキュメントが、複数のorderドキュメントに紐づく。stripe側にはorder_ids配列を持たせる
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
- orderドキュメント の肥大化をやめる
  - 今後オプションメニュー機能などを作るときに option_menu とか入れるべきではない
  - 1orderドキュメントに1メニューとすることで、メニュー単位で別のユーザーに譲渡するなども対応できるようになる
- セキュリティ対策
  - stripe の payment_intent が公開されている状態を解消する
  - stripes コレクションの read/write を Functions のみに制限する


## データ構造サマリ

### 移行前（旧 EventOrder / `orders`）

イベント直下の `orders` サブコレクションに格納。1ドキュメント = **1回の注文プロセス**。同一ユーザーが複数回注文すると **複数の `orders` ドキュメント** が並ぶ。メニューは **`menus` 配列**でまとめ、数量は各要素の **`count`** で表現。Stripe 関連フィールド（`payment_intent` 等）は **同一ドキュメントに混在**していた（クライアントからも読める状態）。スキーマは `common/src/schemas/EventOrder.ts` に準拠。

```
communities/{communityId}/events/{eventId}/orders/{orderId}
  ├── order_id: string
  ├── user_id: string
  ├── event_id: string
  ├── community_id: string
  ├── community_account: string
  ├── status: 'in_cart' | 'ordered' | 'canceled'
  ├── menus: [                          // 1要素 = メニュー行（数量は count）
  │     {
  │       menu_id: string,
  │       partner_id: string,
  │       name: string,
  │       price: number,
  │       count: number,
  │       imageUrl: string (URL)
  │     }
  │   ]
  ├── created_at: Timestamp
  ├── updated_at: Timestamp
  ├── carted_at: Timestamp
  ├── ordered_at: Timestamp?
  ├── canceled_at: Timestamp?
  ├── payment_intent: string?           // Stripe（orders ドキュメントに同居）
  ├── refund_id: string?                // 単一の返金 ID（新設計では stripes.refunds 配列へ）
  └── receipt_number: string?
```

合計金額は `menus` の `price * count` を合算（アプリ側では `EventOrder` の `totalPrice` getter と同等）。

### 移行後（新設計）

```
communities/{communityId}/events/{eventId}/members/{userId}
  ├── user_id: string
  ├── event_id: string
  ├── community_id: string
  ├── created_at: Timestamp
  ├── updated_at: Timestamp
  ├── member_count?: number             // 将来用（同伴者設定）。optional。今回は未設定（`EventMember` DB スキーマ）
  ├── discount_amount?: number          // 将来用（コミュニティ割引）。optional。今回は未設定
  │
  └── member_orders/{orderId}            // サブコレクション：1ドキュメント=1メニュー
        ├── order_id: string
        ├── user_id: string
        ├── event_id: string
        ├── community_id: string
        ├── status: 'in_cart' | 'ordered' | 'canceled'
        ├── stripe_id: string?          // stripe 決済時に紐付け
        ├── menu_id: string
        ├── menu_name: string
        ├── menu_price: number          // int・正の値（`EventMemberOrder` の DB スキーマ）
        ├── created_at: Timestamp
        ├── updated_at: Timestamp
        ├── carted_at: Timestamp
        ├── ordered_at: Timestamp?
        └── canceled_at: Timestamp?

communities/{communityId}/events/{eventId}/stripes/{stripeId}
  ├── stripe_id: string
  ├── order_ids: string[]
  ├── user_id: string
  ├── event_id: string
  ├── community_id: string
  ├── created_at: Timestamp
  ├── updated_at: Timestamp
  ├── menus: [        // 決済時の注文内容サマリー。menu_id ごとに count でまとめた集計済みの形
  │     { menu_name: string, menu_price: number, count: number }  // `EventStripe` の StripeMenu（各 int 制約あり）
  │   ]
  ├── payment_intent: string
  ├── pay_amount: number
  ├── receipt_number: string?           // 領収書番号（Stripe 決済完了時に発行）
  ├── refunds: [                        // 返金履歴（一部返金のたびに追加）
  │     { refund_id: string, amount: number, order_ids: [...], created_at: Timestamp }
  │   ]
  ├── pay_community_bill_off_amount?: number // 将来用。optional。今回は未設定
  └── pay_user_fee_amount?: number       // 将来用。optional。今回は未設定
```


## データ構造・コレクション 詳細

### Firestore パス

```
communities/{communityId}/events/{eventId}/members/{userId}
communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}
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

**`Event.members` 配列の更新方法**: 現行では legacy の Firestore トリガー（`functions/legacy/src/event-members.js` の `create_event_members`）が orders の onWrite で全 `ordered` ユーザーを集約し直して `Event.members` 配列と `event_num_members` を更新している。新設計では [01_legacy_to_default移行](./01_legacy_to_default移行.md) に従い `functions/default/src/eventMembers.ts` に移行した上で、新パス + `collectionGroup` 方式に対応する（詳細は [07](./07_EventMemberOrderに伴う既存機能の修正.md) のセクション 8.5 を参照）。`confirmOrder` / `stripeWebhook` / `cancelOrders` では `Event.members` 配列を直接更新しない。

| 操作 | members コレクション | Event.members 配列 | community.addMember |
|:--|:--|:--|:--|
| カート追加（`addToCart`） | upsert（初回作成） | 変更なし | 実行しない |
| 注文確定（`confirmOrder` / `stripeWebhook`） | 変更なし | **トリガーが自動更新** | 実行する |
| 全キャンセル（`cancelOrders`） | **削除しない**（履歴として残す） | **トリガーが自動更新**（ordered が0になればユーザーが消える） | - |

- `members` コレクションのドキュメントはカート追加時に作成し、全キャンセルされても削除しない（「一度参加した」記録として保持）
- `Event.members` 配列は Firestore トリガー（`createEventMembers`）が member_orders の書き込みをトリガーに `status === 'ordered'` のユーザーを集約して更新する。全キャンセル時は ordered なユーザーがいなくなるため、トリガーが自動的にユーザーを除外する
- この非対称な扱いにより、全キャンセルしたユーザーにレターが届かないようにしつつ、members コレクション配下の member_orders 履歴は保持される

### member_orders サブコレクション（新設）

`communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}`

1ドキュメント = 1メニュー。同一メニューを3つ注文した場合、同じ menu_id の order ドキュメントが3つ作成される。
カート状態（`in_cart`）の order は1ユーザーにつき複数存在しうる（メニューの数だけ存在する）。

| フィールド | 型 | 必須 | 備考 |
|:--|:--|:--|:--|
| order_id | string | ○ | ドキュメントID と同一 |
| user_id | string | ○ | |
| event_id | string | ○ | |
| community_id | string | ○ | |
| status | string | ○ | `in_cart` / `ordered` / `canceled` |
| menu_id | string | ○ | メニュー ID |
| menu_name | string | ○ | メニュー名 |
| menu_price | number | ○ | 単価（税込） |
| stripe_id | string | - | stripe 決済時に紐付け。stripes ドキュメントの ID |
| created_at | Timestamp | ○ | |
| updated_at | Timestamp | ○ | |
| carted_at | Timestamp | ○ | カート追加日時 |
| ordered_at | Timestamp | - | 注文確定日時 |
| canceled_at | Timestamp | - | キャンセル日時 |

**order の status ルール**:
- `in_cart`: カートに入っている状態（未決済）
- `ordered`: 注文確定済み
- `canceled`: キャンセル済み

**一部キャンセルの例**:

唐揚げ3つ + 牛丼2つを注文した場合、5つの order ドキュメントが作成される。唐揚げ1つをキャンセルした場合:
```
member_orders/aaa  → { menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", ... }
member_orders/bbb  → { menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", ... }
member_orders/ccc  → { menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "canceled", ... }
member_orders/ddd  → { menu_id: "gyudon",  menu_name: "牛丼",   menu_price: 1000, status: "ordered", ... }
member_orders/eee  → { menu_id: "gyudon",  menu_name: "牛丼",   menu_price: 1000, status: "ordered", ... }
```
→ 唐揚げ3つのうち1つキャンセル済み、牛丼2つは有効

**カート UI での表示**: `menu_id` ごとに groupBy して個数を算出する。+ボタンは `addToCart`（count: 1）、-ボタンは `removeFromCart`（order_id 指定）で実現する。

**stripe_id による決済グルーピング**: 同一の stripe 決済で確定された order ドキュメントは、同じ `stripe_id` を持つ。キャンセル時は `stripe_id` でグルーピングし、stripe ごとに返金処理を行う。

### stripes コレクション（旧 orders コレクションのリネーム）

`communities/{communityId}/events/{eventId}/stripes/{stripeId}`

stripe 決済情報を管理する。1 stripes ドキュメントが複数の order ドキュメントに紐づく（1:N）。
各 order doc 側にも `stripe_id` を持つため双方向参照となるが、stripes は write-once（一度書いたら変更しない）ため整合性のリスクはない。
menus は決済時の注文内容サマリーとして参考情報として保持する（正の情報は member_order ドキュメント側）。Stripe に送ったリクエスト全体は Cloud Logging に構造化ログとして記録する。

| フィールド | 型 | 必須 | 備考 |
|:--|:--|:--|:--|
| stripe_id | string | ○ | ドキュメントID |
| order_ids | string[] | ○ | この決済に含まれる order ドキュメントの ID 配列 |
| user_id | string | ○ | |
| event_id | string | ○ | |
| community_id | string | ○ | |
| created_at | Timestamp | ○ | 決済ドキュメント作成日時 |
| updated_at | Timestamp | ○ | |
| menus | StripeMenu[] | ○ | 決済時の注文内容サマリー（参考情報。下記参照） |
| payment_intent | string | ○ | Stripe の PaymentIntent ID |
| pay_amount | number | ○ | 合計注文金額 |
| receipt_number | string | - | 領収書番号（Stripe 決済完了時に発行） |
| refunds | RefundEntry[] | ○ | 返金履歴（一部返金のたびに追加。初期値は空配列） |
| pay_community_bill_off_amount | number | - | コミュニティ割引金額（※将来実装予定） |
| pay_user_fee_amount | number | - | ユーザー手数料（※将来実装予定） |

**RefundEntry**（refunds 配列の各要素）:
```
{
  refund_id: "re_xxx",           // Stripe の Refund ID
  amount: 1500,                  // 返金金額
  order_ids: ["ccc", "ddd"],     // キャンセルした order ドキュメントの ID
  created_at: Timestamp
}
```
返金累計金額は `refunds.reduce((sum, r) => sum + r.amount, 0)` で算出する。

**StripeMenu**（menus 配列の各要素）:
```
{ menu_name: "唐揚げ", menu_price: 500, count: 3 }
```
menus は member_order ドキュメントの `menu_id` ごとに count でまとめた集計済みの形で保存する。Stripe に送ったリクエスト全体は `stripe.ts` の Cloud Logging に構造化ログとして記録する。

### Security Rules

| コレクション | read | write | 備考 |
|:--|:--|:--|:--|
| members | 全ユーザー | Functions のみ | イベントページの参加者一覧に表示するため。明示的に `allow read: if true` で許可 |
| member_orders（members 配下） | 全ユーザー | Functions のみ | イベントページの注文情報に表示するため。明示的に `allow read: if true` で許可 |
| stripes | 本人のみ | Functions のみ | 決済情報・領収書は本人限定。resource.data.user_id で認証ユーザーと突き合わせる |

**firestore.rules の変更内容**:

現行の orders ルール（`match /orders/{order} { allow write: if false }`）を削除し、以下を追加する。
members と member_orders には明示的に `allow read: if true` を追加し、write は Functions のみに制限する。
stripes は read を本人のみに制限する。

```
match /events/{event} {
    // 既存の match /orders/{order} を削除

    match /members/{memberId} {
        allow read: if true
        allow write: if false
        match /member_orders/{orderId} {
            allow read: if true
            allow write: if false
        }
    }
    match /stripes/{stripeId} {
        allow read: if request.auth != null && request.auth.uid == resource.data.user_id
        allow write: if false
    }
}
```

### community_account を持たない理由
旧 EventOrder では `community_account` を各ドキュメントに冗長化していたが、新設計では削除する。
- `community_account` はコミュニティの URL スラッグであり、将来的に変更機能を開発する可能性がある
- 冗長化していると、変更時に members・member_orders・stripes の全ドキュメントを一括更新する必要が生じる
- `community_account` が必要な場面（URL 生成等）では、イベントデータ（`event.community_account`）から取得すれば十分である

### `community_id` を冗長化する理由（設計メモ）

Firestore の親パス（`communities/{communityId}/...`）から理論上は `communityId` を導出できるが、**`members` / `members` 配下の `member_orders` / `stripes` には `community_id` をフィールドとして必ず保持する**方針とする。

- **`collectionGroup` クエリ**: `collectionGroup('member_orders')` 等で取得したドキュメントに対し、ドキュメントパスをパースしてコミュニティ ID を解決する方式は、階層が深く、パス構造の変更にも弱い。クエリの `where` 条件や本ドキュメントのインデックス設計（例: `event_id` と組み合わせ）では、**フィールドとしての `community_id` の方が扱いやすい**。
- **セキュリティルール・バックエンド**: `resource.data` に安定した識別子があると、ルールや Functions での判定が単純になる（パス依存に集中しない）。
- **`community_account` との切り分け**: URL スラッグは変更されうるため各注文系ドキュメントには持たない一方、**`community_id` は変更されない前提の識別子**として冗長化してよい。Firestore での一般的なパターン（クエリ効率のための意図的な非正規化）とも整合する。
- **書き込み時の注意**: 作成・更新は store 経由で一元化し、`community_id` の取り違えが起きないようにする。


## API（Callable Functions）変更

### 現行 → 新設計のマッピング

| 現行 | 新設計 | 変更内容 |
|:--|:--|:--|
| `addOrder` | `addToCart` | member upsert + count 分の order ドキュメントを新規作成（1メニュー=1ドキュメント） |
| `updateMenuCountInCart` | **廃止** | +ボタンは `addToCart`（count: 1）、-ボタンは `removeFromCart` に分割 |
| `deleteMenuInCart` | `removeFromCart` | 指定 order_id の order ドキュメントを直接削除 |
| `updateOrderStatus` | `confirmOrder` | 請求書払い用。指定 order_ids の全 order を `ordered` に一括更新 + `community.addMember` |
| `createStripeCheckoutSession` | 変更 | order_ids 配列で受け取り、Functions 側で order を読み取り。metadata に orderIds を格納 |
| `stripeRefunds` | `cancelOrders` に拡張 | キャンセル対象の order_ids を直接指定。stripe_id でグルーピングして返金処理 |

### 新 API 型定義

```typescript
// カートにメニューを追加（イベントページからの追加、+ボタン）
// menus の count 分だけ order ドキュメントを新規作成する（1メニュー=1ドキュメント）
// 例: { menu_id: "karaage", count: 3 } → 3つの order ドキュメントを作成
type AddToCartRequest = {
  community_id: string
  event_id: string
  menus: { menu_id: string; count: number }[]
}
// クライアントは members/{userId}/member_orders を subscribe しているため、
// 作成された order_id を返す必要はない
type AddToCartResponse = void

// カートから1品削除（-ボタン）
// 指定した order_id の order ドキュメントを直接削除する
type RemoveFromCartRequest = {
  community_id: string
  event_id: string
  order_id: string           // 削除対象の order ドキュメント ID
}

// 注文確定（請求書払い）
// 指定した order_ids の全 order を in_cart → ordered に一括更新
// community.addMember も実行
// ※ Event.members 配列の更新は Firestore トリガーが自動実行
type ConfirmOrderRequest = {
  community_id: string
  event_id: string
  order_ids: string[]        // 決済対象の order ドキュメント ID 配列
}

// Stripe チェックアウトセッション作成
// 指定した order_ids の order を読み取り、line_items を構築
// metadata に orderIds をカンマ区切りで格納（Webhook で使用）
type CreateStripeCheckoutSessionRequest = {
  community_id: string
  event_id: string
  order_ids: string[]        // 決済対象の order ドキュメント ID 配列
  isPosted: boolean
}

// キャンセル（一部キャンセル・全キャンセル対応）
// 指定した order_ids の order を ordered → canceled に更新
// stripe_id でグルーピングし、stripe ごとに Stripe 返金を実行
type CancelOrdersRequest = {
  community_id: string
  event_id: string
  order_ids: string[]        // キャンセル対象の order ドキュメント ID 配列
}
type CancelOrdersResponse = {
  canceled_count: number
  refunds: {                 // stripe_id ごとに返金結果を返す
    stripe_id: string
    refund_id: string
    amount: number
  }[]
}
```

**変更のポイント**:
- `AddToCartRequest` の menus に `count` フィールドを追加。Functions 側で `count` 個分の order ドキュメントを作成する（初回のイベントページからの複数個選択にも対応）。レスポンスは void（クライアントは subscribe で取得）
- `RemoveFromCartRequest` は `order_id` で削除対象を直接指定。1ドキュメント = 1メニューなので、削除 = 1品削除
- `ConfirmOrderRequest` は `order_ids` 配列で決済対象を明示指定。`community.addMember` も含む
- **`CreateStripeCheckoutSessionRequest`**: common では **`order_ids` 配列のみ**の型に統一し、旧 `order: EventOrder` ペイロードは型定義から削除した。Callable はサーバ側で注文を読み取る。当面の実装は **order_ids を 1 件**に限定し、旧パスの `getOrder` で `EventOrder` を取得して Checkout を生成する。**複数件・metadata の orderIds・Webhook 連携の本実装は Phase 2** とする
- 現行の `stripeRefunds` は全額返金のみだが、新設計の `cancelOrders` は `order_ids` で任意の order を指定してキャンセル可能。`stripe_id` でグルーピングして返金処理を行うため、複数決済にまたがるキャンセルにも対応する


## Stripe Functions 変更

詳細は [06_EventMemberOrderに伴うカート・注文・決済の実装.md](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) を参照。

- `createStripeCheckoutSession`: `order_ids` 配列ベースのリクエストに変更。各 order ドキュメントを読み取り、`menu_id` ごとに groupBy して line_items を構築。`imageUrl` はメニューマスタから取得。metadata に `orderIds`（カンマ区切り）を格納、`communityAccount` は削除
- `stripeWebhook`: metadata の `orderIds` から各 order を取得し、全 order の status を `ordered` に一括更新 + stripes ドキュメント作成（`order_ids` 配列を含む）+ `community.addMember` をトランザクション内で実行
- `stripeRefunds` → `cancelOrders`: `order_ids` で直接キャンセル対象を指定。`stripe_id` でグルーピングし、stripe ごとに Stripe 一部返金を実行（詳細は [09_EventMemberOrderに伴うキャンセル機能.md](./09_EventMemberOrderに伴うキャンセル機能.md)）


## Store 関数インターフェース

### 設計方針: ShokujiiEvent メソッドを維持し、独立 store 関数に委譲

現行では注文データへのアクセスが 2 系統存在する。

| 経路 | ファイル | 呼び出し元 |
|:--|:--|:--|
| `ShokujiiEvent` のインスタンスメソッド | `functions/default/src/stores/event.ts` | メール送信系 Functions、領収書、請求書など（11 ファイル / 15 呼び出し） |
| 独立 store 関数（旧パス） | `functions/default/src/stores/order.ts` | 移行完了まで残す。`orders.ts`、`stripe.ts`（Checkout 過渡期）等 |
| 独立 store 関数（新パス） | `functions/default/src/stores/memberOrder.ts` | 新パス CRUD・`getInCartMemberOrdersByUpdatedTime` 等。移行後はここに統一 |

新設計では **ShokujiiEvent のメソッドを維持しつつ、内部実装を独立 store 関数への委譲に変更する**方針とする。

- パス構築・Firestore アクセスのロジックは **`stores/memberOrder.ts`** の独立関数に置く。ドキュメント上は歴史的に `order.ts` と書かれていたが、実装は `memberOrder.ts` とし、**データ移行完了後に旧 `stores/order.ts` を削除して `memberOrder.ts` に統一する**方針とする
- `ShokujiiEvent` のメソッドは薄いラッパーとして残す（11 ファイルの呼び出し側の変更を最小化）
- `getOrder` のように `userId` 引数が追加されるメソッドは、シグネチャ変更が呼び出し側にも波及する。**`getOrders` / `getOrder` / `saveOrder` / `hasOrderedOrders` の全面委譲とシグネチャ変更は Phase 4 および Phase 5** で実施する（メール・通知・購読まわりの修正と同時に進める）

```typescript
// ShokujiiEvent メソッド → 独立 store 関数への委譲例
class ShokujiiEvent extends Event {
  async getOrders(status?: OrderStatusType, transaction?: Transaction): Promise<EventMemberOrder[]> {
    return getOrders(this.community_id, this.id, status, transaction)
  }

  async getOrder(userId: string, orderId: string, transaction?: Transaction): Promise<EventMemberOrder | undefined> {
    return getOrder(this.community_id, this.id, userId, orderId, transaction)
  }

  async getOrdersByIds(userId: string, orderIds: string[], transaction?: Transaction): Promise<EventMemberOrder[]> {
    return getOrdersByIds(this.community_id, this.id, userId, orderIds, transaction)
  }

  async saveOrder(userId: string, order: EventMemberOrder, transaction?: Transaction): Promise<void> {
    return saveOrder(this.community_id, this.id, userId, order, transaction)
  }

  async hasOrderedOrders(transaction?: Transaction): Promise<boolean> {
    return hasOrderedOrders(this.community_id, this.id, transaction)
  }
}
```

### 独立 store 関数（functions/default/src/stores/memberOrder.ts）

新パス（`members/{userId}/member_orders/{orderId}`）では `userId` が必要になるため、全ての store 関数のシグネチャが変わる。実装ファイルは **`memberOrder.ts`**。旧パス専用の `stores/order.ts` は移行完了後に削除する。

```typescript
// イベント内の全 order ドキュメントを取得（collectionGroup('member_orders') 方式）
export const getOrders = async (
  communityId: string,
  eventId: string,
  status?: OrderStatusType,
  transaction?: Transaction,
): Promise<EventMemberOrder[]>

// order ドキュメントの取得（1件）
export const getOrder = async (
  communityId: string,
  eventId: string,
  userId: string,         // 追加
  orderId: string,
  transaction?: Transaction,
): Promise<EventMemberOrder | undefined>

// 複数 order ドキュメントの一括取得（ID 指定）
export const getOrdersByIds = async (
  communityId: string,
  eventId: string,
  userId: string,
  orderIds: string[],
  transaction?: Transaction,
): Promise<EventMemberOrder[]>

// カート中の orders を全件取得（1ユーザーにつき複数存在しうる）
export const getOrdersInCart = async (
  communityId: string,
  eventId: string,
  userId: string,
  transaction?: Transaction,
): Promise<EventMemberOrder[]>

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
- `getOrders` は新規追加。現行は `ShokujiiEvent` メソッドにのみ存在していた。`collectionGroup('member_orders')` + `where('event_id', '==', eventId)` で取得する。旧パスのイベント直下 `orders` とコレクション ID が異なる（`orders` と `member_orders`）ため、**depth フィルタで新旧を切り分ける必要はない**
- `hasOrderedOrders` も新規追加。`collectionGroup('member_orders')` + `where('event_id', '==', eventId)` + `where('status', '==', 'ordered')` + `limit(1)` で判定（同上）
- `getOrdersInCart` は旧 `getOrderInCart` のリネーム＋戻り値変更。メニュー単位では `in_cart` の order が複数存在するため、`EventMemberOrder[]` を返す。`members/{userId}/member_orders` コレクション内で `status == 'in_cart'` のクエリで取得
- `getOrdersByIds` は新規追加。`confirmOrder` / `createStripeCheckoutSession` / `cancelOrders` で使用する。指定した `orderIds` の order ドキュメントを一括取得する。内部実装は各 `orderIds` に対して `memberOrderRef` で直接参照し、`transaction.getAll()` または並列 `get()` で取得する
- stripes の store 関数は新規追加。`getStripe` / `saveStripe` で stripes コレクションの CRUD を行う
- カート放置通知用の時間範囲クエリは **`getInCartMemberOrdersByUpdatedTime`** を用いる（`EventMemberOrder` 用 converter と `collectionGroup('member_orders')` を用いる。コレクション名が旧 `orders` と異なるため depth フィルタは不要）。`event.ts` の `getInCartOrdersByUpdatedTime` は当面旧 `EventOrder` のままとし、**`inCartNotification.ts` を新関数へ切り替える作業は Phase 5** で行う

### ShokujiiEvent メソッドのシグネチャ変更

| メソッド | 現行 | 新設計 | 呼び出し側への影響 |
|:--|:--|:--|:--|
| `getOrders(status?)` | そのまま | そのまま（内部が委譲に変更） | なし |
| `hasOrderedOrders()` | そのまま | そのまま（内部が委譲に変更） | なし |
| `getOrder(orderId)` | orderId のみ | `getOrder(userId, orderId)` | **引数追加が必要** |
| `getOrdersByIds` | なし | `getOrdersByIds(userId, orderIds)` | **新規追加** |
| `saveOrder(order)` | order のみ | `saveOrder(userId, order)` | **引数追加が必要** |


## Firestore インデックス変更

### 削除するインデックス（community_account 廃止に伴い不要）

| フィールド構成 | 理由 |
|:--|:--|
| `community_account` + `event_id` + `status` + `updated_at` | community_account 削除 |
| `community_account` + `event_id` + `status` + `user_id` | community_account 削除 |
| `community_account` + `event_id` + `status` + `user_id` + `updated_at` | community_account 削除 |
| `partner_id` + `order_date` | レガシー用。新設計では不要 |

### 残すインデックス（COLLECTION_GROUP: member_orders）

| フィールド構成 | 用途 |
|:--|:--|
| `status` + `updated_at` | カート購読、注文一覧 |
| `status` + `user_id` | ユーザーのカート取得 |
| `status` + `user_id` + `updated_at` DESC | ユーザー注文一覧（マイページ） |
| `user_id` + `updated_at` DESC | ユーザー注文一覧（ページング） |
| `user_id` + `updated_at` DESC + `status` DESC | ユーザー注文一覧（ステータス付き） |

### 新規追加するインデックス（COLLECTION_GROUP: member_orders）

| フィールド構成 | 用途 |
|:--|:--|
| `event_id` + `status` + `updated_at` | イベント別注文一覧（community_account の代替） |
| `event_id` + `status` + `user_id` | イベント別メンバー取得 |


## 実装

### 実装_カート・注文・決済

詳細は [06_EventMemberOrderに伴うカート・注文・決済の実装.md](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) を参照。

- カート追加（`addToCart`）: member upsert + count 分の order ドキュメント新規作成（1メニュー=1ドキュメント）
- カート削除（`removeFromCart`）: 指定 order_id の order ドキュメントを直接削除
- 注文確定（`confirmOrder`）: 指定 order_ids の全 order を `ordered` に一括更新 + `community.addMember`
- Stripe 決済: `createStripeCheckoutSession`（order_ids → line_items 構築、metadata に orderIds 格納）+ `stripeWebhook`（metadata の orderIds から各 order を更新 + stripes 作成をトランザクション内で実行）
- カート画面（`cart.vue` / `EventCartDialog.vue`）: 数量操作・削除・注文確定・Stripe 決済の全面改修。orders を `menu_id` で groupBy して表示
- eventStore ラッパー関数: `addOrder` → `addToCart` 等のリネーム

### 実装_注文一覧と領収書

詳細は [08_EventMemberOrderに伴う注文一覧と領収書.md](./08_EventMemberOrderに伴う注文一覧と領収書.md) を参照。

- マイページの注文一覧: order ドキュメント単位のカード表示 → **イベント単位**（1カード = 1イベント）に変更
- 領収書: order 単位 → **stripe_id 単位** で発行に変更。stripes ドキュメントをデータソースに使用

### 実装_既存機能の修正

詳細は [07_EventMemberOrderに伴う既存機能の修正.md](./07_EventMemberOrderに伴う既存機能の修正.md) を参照。

- フロント表示（イベントページ、管理者画面、ADMIN 画面、メンバー一覧）
- 請求書
- イベントメンバーのリスト取得、レターのユーザリスト取得
- Firestore トリガー（`onOrderChanged` の document パス変更）
- メール送信 Functions（注文データの読み取り・集計ロジック変更。1 order = 1 メニューのため groupBy で集計）
- API ラッパー（`base/src/apis/` の関数名・型変更）
- Functions ユーティリティ（`utils/order.ts`、`utils/mail.ts`）

### 実装_キャンセル機能

詳細は [09_EventMemberOrderに伴うキャンセル機能.md](./09_EventMemberOrderに伴うキャンセル機能.md) を参照。

- `cancelOrders`: 指定 order_ids の order を `canceled` に更新
- Stripe 一部返金: `stripe_id` でグルーピングし、stripe ごとに返金処理
- 全キャンセル: ユーザーの全 `ordered` order_ids を指定して `cancelOrders` を呼ぶ

### bokudeli-event-payment

- 請求書・お店の支払い明細は orders ドキュメントの `menu_name` / `menu_price` を参照し、`menu_id` で groupBy して集計する


## データ移行計画

詳細は [10_EventMemberOrderに伴うデータ移行.md](./10_EventMemberOrderに伴うデータ移行.md) を参照。

- 旧 `orders` → 新 `members` + `member_orders` + `stripes` にバッチコピー。旧データは変更しない
- 並行運用は行わず、メンテナンスウィンドウを設けて一斉切り替え
- 旧 orders コレクションはロールバック用に保持


## 影響範囲（コード変更が必要なファイル）

### 影響度：大（全面改修）

| ファイル | 変更内容 |
|:--|:--|
| `common/src/schemas/EventMemberOrder.ts` | スキーマを menus 配列ベース → メニュー単位ドキュメントに変更。OrderMenu 削除、`menu_id` / `menu_name` / `menu_price` をトップレベルに。`partner_id` は `Event.partner_id` を参照するため含めない。旧 EventOrder スキーマは段階的に廃止 |
| `common/src/schemas/EventStripe.ts` | `order_ids: string[]` 追加、`menus` フィールドで注文内容サマリーを保持。RefundEntry の `menus` → `order_ids` に変更 |
| `common/src/apis/memberOrder.ts` | API 型定義を新設計に合わせて変更。`AddToCartResponse` → void、`RemoveFromCartRequest` から `menu_id` 削除、`ConfirmOrderRequest` / `CreateStripeCheckoutSessionRequest` を `order_ids` 配列に変更、`CancelMenuItemsRequest` → `CancelOrdersRequest`（`order_ids` 指定）に変更 |
| `common/src/apis/stripe.ts` | EventOrder → order_ids ベースに変更 |
| `base/src/stores/event.ts` | subscribeOrders を members + member_orders サブコレクションの購読に変更 |
| `base/src/stores/orderList.ts` | `collectionGroup('member_orders')` のクエリに変更 |
| `base/src/stores/currentUser.ts` | カート購読を members/member_orders 構造に変更 |
| `functions/default/src/stores/memberOrder.ts` | EventMemberOrder の CRUD に全面書き替え。`getOrderInCart` → `getOrdersInCart`（複数返却）、`getOrdersByIds` 新設 |
| `functions/default/src/memberOrders.ts` | Callable を新 API（addToCart / removeFromCart / confirmOrder）に全面改修。メニュー単位ドキュメント作成・削除に変更 |
| `functions/default/src/stripe.ts` | order_ids ベースのリクエストに変更、複数 order 読み取り → groupBy で line_items 構築。metadata に orderIds 格納 |
| `functions/default/src/stripeWebhook.ts` | metadata の orderIds から複数 order を取得・一括更新。stripes ドキュメント作成に `order_ids` 配列を含める |
| `functions/default/src/stripeRefunds.ts` | `cancelOrders` に拡張。`order_ids` 指定 → `stripe_id` でグルーピングして返金処理 |

### 影響度：中

| ファイル | 変更内容 |
|:--|:--|
| `common/src/utils/invoice.ts` | 請求計算ロジックの入力型変更（1 order = 1 メニュー。`menu_id` で groupBy して集計） |
| `base/src/utils/orders.ts` | 集計関数のリファクタ（`menu_id` で groupBy して count / 合計金額を算出） |
| `base/src/apis/order.ts` | 関数名・型を新 API に合わせて変更（`addOrder` → `addToCart` 等） |
| `base/src/apis/stripe.ts` | `StripeRefundsRequest` → `CancelOrdersRequest` 等の型変更 |
| `common/src/apis/eventReceipt.ts` | `EventReceiptRequest` の `orderId` → `stripeId` に変更 |
| `user/src/router/utils.ts` | `getReceiptPath` の引数を `orderId` → `stripeId` に変更 |
| `user/src/pages/receipt.vue` | クエリパラメータを `orderId` → `stripeId` に変更 |
| `base/src/components/pages/cart.vue` | 06「カート・注文・決済の実装」参照。数量操作（+は addToCart、-は removeFromCart で order_id 指定）・注文確定（order_ids 配列）・Stripe 決済（order_ids 配列）・テンプレート表示（orders を `menu_id` で groupBy）・community_account 取得を全面改修 |
| `base/src/components/UserEventCard.vue` | props の型変更（`orders: EventMemberOrder[]`）。orders を `menu_id` で groupBy して表示。領収書ボタンを `stripe_id` 単位で表示 |
| `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` | `member.orders` の型変更、ソートロジックの変更 |
| `user/src/pages/u/[userId].vue` | マイページ注文一覧をイベント単位のカード表示に変更。キャンセル処理を `cancelOrders` に変更。領収書ダウンロードの引数を `stripeId` に変更 |
| `user/src/components/manage/event/member.vue` | 管理者向け注文一覧の型変更 |
| `admin/src/pages/order/index.vue` | 集計方法の変更（`menu_id` で groupBy） |
| `admin/src/pages/order/[eventId].vue` | 集計方法の変更（`menu_id` で groupBy） |
| `firestore.rules` | members・member_orders・stripes のルール追加（上記 Security Rules 参照） |
| `firestore.indexes.json` | インデックスの追加・削除（上記インデックス変更参照） |
| `functions/default/src/stores/event.ts` | ShokujiiEvent の注文関連メソッドを独立 store 関数への委譲に変更。`getOrder` / `saveOrder` は `userId` 引数追加。`getOrdersByIds` 新設 |
| `functions/default/src/orderCompletionMail.ts` | `onOrderChanged` の document パス変更、`eventRef` 取得ロジック修正 |
| `functions/default/src/eventStatusChangeMail.ts` | `event.getOrders()` パス変更、1 order = 1 メニューのため `menu_id` で groupBy して集計 |
| `functions/default/src/orderDeadlineMail.ts` | 同上 |
| `functions/default/src/orderRemindMail.ts` | 同上 |
| `functions/default/src/inCartNotification.ts` | `getInCartOrdersByUpdatedTime`・`event.getOrders('in_cart')` パス変更 |
| `functions/default/src/remindUnorderedMail.ts` | `event.hasOrderedOrders()` パス変更 |
| `functions/default/src/eventInformationMail.ts` | `event.getOrders()` パス変更 |
| `functions/default/src/utils/order.ts` | `createOrdersForOrderDeadline` の集計を `menu_id` で groupBy に変更 |
| `functions/default/src/utils/mail.ts` | `getEventMemberEmails`・`getCommunityNonMemberEmails` のパス変更 |
| `functions/default/src/eventMembers.ts`（新規） | legacy の `event-members.js` を default に移行 + パス変更 + `collectionGroup` + `event_id` フィルタに変更 |
| `functions/legacy/src/event-members.js` | 廃止（default への移行に伴い削除） |
| `base/src/composable/loadEventMembers.ts` | Deprecated。廃止して eventStore に統合 |
| `base/src/composable/countEventMembers.ts` | community_account 条件を削除、event_id のみでクエリ |
