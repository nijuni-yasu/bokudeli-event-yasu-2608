# 無料参加・割引参加 EventMemberOrder 対応

> **本ドキュメントの位置づけ**  
> `03_無料参加・割引参加・クーポン.md` の仕様を、`05_EventOrder→EventMemberOrder.md` のデータ構造変更に合わせて修正した差分仕様。  
> 本ドキュメントに記載がないセクション（2. ねらい、3. 前提条件、4. 画面仕様 など）は元仕様のまま変更なし。

---

## 変更の核心

旧設計（EventOrder）と新設計（EventMemberOrder）では、注文ドキュメントの粒度が根本的に変わる。

| | 旧（EventOrder） | 新（EventMemberOrder） |
|:--|:--|:--|
| 1 ドキュメント | 複数メニューをまとめた注文単位（`menus: OrderMenu[]` + `count`） | **メニュー 1 品** |
| `pay_community_bill_off_amount` | `Σ min(off_amount, price) × count`（全メニュー行の合計） | **`min(off_amount, menu_price)`（1 品分のみ）** |
| free の値 | `menus の合計金額`（全行合計） | **`menu_price`（1 品分）** |
| count 乗算 | 必要（各行の count を掛ける） | **不要**（ドキュメント数が count を表す） |
| 削除後の再計算 | 残り menus から `pay_community_bill_off_amount` を再計算 | **不要**（各ドキュメントが独立して値を持つ） |

---

## 5.1 Firestoreスキーマ

### 5.1.1 コレクション構成

```
communities/{communityId}/events/
├── {eventId}/
│   ├── community_bill_settings (フィールド)       ← 変更なし
│   ├── members/ (サブコレクション)
│   │   └── {userId}/
│   │       └── member_orders/ (サブコレクション)   ← 旧 orders/ から変更
│   │           └── {orderId}/
│   │               ├── ... (既存フィールド)
│   │               └── pay_community_bill_off_amount  ← 追加
│   └── coupon_usage/ (サブコレクション・Phase 2以降)  ← 変更なし
│       └── {couponUsageId}/
│           ├── coupon_code
│           ├── user_id
│           ├── used_at
│           └── discount_amount
```

旧仕様の `orders/{orderId}` 直下に置いていた主催者負担オフ額（旧フィールド名 `payment_community_bill_off_amount`、現在は `pay_community_bill_off_amount`）を、`members/{userId}/member_orders/{orderId}` 配下の各ドキュメントに移動する。

### 5.1.2 イベントドキュメント拡張

変更なし。`community_bill_settings` の構造・配置はそのまま。

### 5.1.3 データマイグレーション（バッチ処理）

アプリ側スキーマの必須化（5.1.3.1）と新フィールドの整備（5.1.3.2）に伴い、`bokudeli-event-batch` リポジトリの tasks/checks で 2 つのバッチを実行する。

- **実装・実行の所在**: **Firestore の一括更新用マイグレーションは `bokudeli-event-batch` リポジトリの `tasks` で管理・実行する。** 本リポジトリ（bokudeli-event-new）に置くのは参照用など例外的な場合に限り、**正本・本番実行は batch 側のタスク**とする。
- **参照**: [bokudeli-event-batch / tasks](https://github.com/nijuniinc/bokudeli-event-batch/tree/main/tasks)
- **リリース順序**: 対象環境で全バッチを完了させた**あと**に、アプリ（本リポ）をデプロイする。順序の詳細は 5.1.3.3 を参照。手順の骨子は `documents/デプロイ手順/デプロイ手順.md` の「データマイグレーション（バッチ処理）があるリリース」に従う。

#### 5.1.3.1 community_bill_settings の必須化（tasks/0038）

アプリ側スキーマでは `event_payment === 'community_bill'` のとき `community_bill_settings` を必須とする。**既存の Firestore イベント**で同フィールドが欠けている（または `type` が解釈不能な）ドキュメントは、必須化したコードをデプロイする前にデータを揃える。

| 項目 | 内容 |
|:--|:--|
| **タスク** | `tasks/0038_migrate_community_bill_settings.js` |
| **チェック** | `checks/0038_check_community_bill_settings.js` |
| **対象パス** | `communities/{cid}/events/{eid}` |
| **対象条件** | `event_payment === 'community_bill'` かつ `community_bill_settings` が**未設定**、または `type` が `'free'` / `'discount'` 以外、または `discount` で `off_amount` が正の整数でない |
| **ドライラン環境変数** | `MIGRATE_COMMUNITY_BILL_DRY_RUN=1` |

- **未設定の場合**: `community_bill_settings: { type: 'free' }` を付与する（レガシー「未設定 = 全額主催者負担・free 相当」と一致させる）。`merge: true` で他フィールドは保持。
- **type が不正な場合**: 自動上書きはせず、`console.warn` で警告ログを残してスキップする。手動調査・補正の対象とし、ドライラン時点で件数が 0 であることを確認してから本番実行する。
- **監査フィールド**: `updated_by` / `updated_at` などは**付与しない**（onUpdate トリガーや他バッチとの干渉を避けるため、変更したフィールドのみを書き込む）。
- **チェック内容**: `community_bill` イベント全件で `community_bill_settings` が `{ type: 'free' }` または `{ type: 'discount', off_amount: 正の整数 }` のいずれかになっていることを検証する。失敗があれば `process.exitCode = 1`。

#### 5.1.3.2 既存 member_orders への pay_community_bill_off_amount マイグレーション（tasks/0039）

5.2.1 / 5.3.2 のとおり、新コードの `confirmOrder` / `createStripeCheckoutSession` では各 `member_orders` の `pay_community_bill_off_amount` をサーバー側で再計算し、ストアード値と一致しない場合 `failed-precondition` エラーになる。tasks/0038 で `community_bill_settings` を整備したあと、既存 `member_orders` の `pay_community_bill_off_amount` が `undefined` のままだと（`free` 相当の場合）`expected = menu_price` と不整合になるため、新コードデプロイの**前**に本タスクを実行する。

| 項目 | 内容 |
|:--|:--|
| **タスク** | `tasks/0039_migrate_pay_community_bill_off_amount.js` |
| **チェック** | `checks/0039_check_pay_community_bill_off_amount.js` |
| **対象パス** | `communities/{cid}/events/{eid}/members/{uid}/member_orders/{oid}`（`collectionGroup('member_orders')`） |
| **対象条件** | 親イベントが `event_payment === 'community_bill'` かつ `member_orders.status !== 'canceled'`（`canceled` は変更しない） |
| **ドライラン環境変数** | `MIGRATE_PAY_COMMUNITY_BILL_OFF_AMOUNT_DRY_RUN=1` |

- **算出**: `calcDiscount(community_bill_settings, menu_price)` の結果を書き込む。
  - `type === 'free'` → `menu_price`
  - `type === 'discount'` → `Math.min(off_amount, menu_price)`
  - 上記以外（割引なし） → `undefined`（フィールドを書き込まない。`0` は保存しない方針に従う）
- **監査フィールド**: `updated_by` / `updated_at` などは**付与しない**（onUpdate トリガーや他バッチとの干渉を避けるため、変更したフィールドのみを書き込む）。
- **チェック内容**: 上記対象条件の全 `member_orders` について、ストアード `pay_community_bill_off_amount` が `calcDiscount(...)` の結果と一致するか検証する。失敗があれば `process.exitCode = 1`。
- **依存関係**: 親イベントの `community_bill_settings` を参照するため、tasks/0038 完了後でないと正しい値を算出できない。

#### 5.1.3.3 リリース順序

```bash
# 1. tasks/0038 ドライラン（type 不正件数が 0 であることを確認）
MIGRATE_COMMUNITY_BILL_DRY_RUN=1 yarn run task -- -m <env>

# 2. tasks/0038 本番実行
yarn run task -- -m <env>

# 3. checks/0038 検証（PASSED を確認）
yarn run check -- -m <env>

# 4. tasks/0039 ドライラン
MIGRATE_PAY_COMMUNITY_BILL_OFF_AMOUNT_DRY_RUN=1 yarn run task -- -m <env>

# 5. tasks/0039 本番実行
yarn run task -- -m <env>

# 6. checks/0039 検証（PASSED を確認）
yarn run check -- -m <env>

# 7. アプリ（bokudeli-event-new）の feat/960-v2 をデプロイ
```

### 5.1.4 `community_bill_settings` の構造

変更なし。

### 5.1.5 注文ドキュメント（EventMemberOrder）

旧 `OrderDocument`（`orders/{orderId}`）を廃止し、新 `EventMemberOrder`（`member_orders/{orderId}`）に変更する。

```typescript
// member_orders/{orderId} ドキュメント
interface EventMemberOrderDocument {
  // === 既存フィールド（EventMemberOrder 仕様どおり）===
  order_id: string
  user_id: string
  event_id: string
  community_id: string
  status: 'in_cart' | 'ordered' | 'canceled'
  stripe_id?: string          // Stripe 決済時に紐付け
  menu_id: string
  menu_name: string
  menu_price: number          // 単価（税込・正の整数）。addToCart 時にマスタから取得して固定
  created_at: Timestamp
  updated_at: Timestamp
  carted_at: Timestamp
  ordered_at?: Timestamp
  canceled_at?: Timestamp

  // === 割引機能で追加 ===
  // この 1 品に適用された主催者負担額
  // addToCart 時にサーバー算出。割引なしの場合はフィールドなし（0 は保存しない）
  pay_community_bill_off_amount?: number
}

// OrderMenu インターフェースは不要（menus 配列を持たないため）
```

#### `pay_community_bill_off_amount` の値の決まり方（1 ドキュメント単位）

旧仕様では「メニュー行ごと」の計算・合算が必要だったが、1 ドキュメント = 1 品のため単純な比較になる。

| 割引タイプ | 値 | 例（`menu_price: 800`） |
|:--|:--|:--|
| `free` | `menu_price` | `800` |
| `discount` | `min(off_amount, menu_price)` | `off_amount: 500` → `500`、`off_amount: 1000` → `800` |
| `coupon`（Phase 2） | `min(クーポン割引額, menu_price)` | — |
| 割引なし | **フィールドなし**（`undefined`。`0` は保存しない） | — |

旧仕様にあった `× count` の乗算は**不要**。1 ドキュメント = 1 品なので、同一メニューを 3 個注文した場合は同じ `pay_community_bill_off_amount` を持つ 3 つのドキュメントが作られる。

**算出ロジック（Functions 共通ヘルパー）**:

```typescript
const calcDiscount = (
  settings: CommunityBillSettings | undefined,
  menu_price: number,
): number | undefined => {
  if (!settings || !settings.type) return undefined
  if (settings.type === 'free') return menu_price
  if (settings.type === 'discount') return Math.min(settings.off_amount, menu_price)
  return undefined
}
// undefined の場合はフィールドを付けない（FieldValue.delete() またはフィールド省略）
```

#### カート中の `pay_community_bill_off_amount` の更新

旧仕様では「カート更新 Callable が menus の更新と**同一トランザクション**で更新」と規定していたが、新設計では**トランザクション不要**。

- `addToCart` で各 order ドキュメントを作成する際、個別に `pay_community_bill_off_amount` を設定する
- `removeFromCart` で order ドキュメントを削除しても、他の order ドキュメントへの影響がないため**再計算不要**

旧仕様の「追加ボタン連打への対策として同一トランザクションで更新」という要件は、ドキュメント単位の独立性により自然に解消される。

#### 参加者の支払額の算出

```
// 1 order ドキュメントの参加者支払額（1品分）
per_item_payment = menu_price - (pay_community_bill_off_amount ?? 0)

// カート全体（order_ids 分）の合計支払額
total_payment = Σ over order_ids: per_item_payment
              = Σ menu_price - Σ pay_community_bill_off_amount
```

旧仕様の `支払額 = menus の合計金額 - pay_community_bill_off_amount` から変更。

#### 支払額 ¥0 の判定

`total_payment === 0` が成立するケース:

- **`free`**: 全 order で `pay_community_bill_off_amount === menu_price` → 必ず ¥0
- **`discount`**: 全 order で `off_amount >= menu_price`（= `pay_community_bill_off_amount === menu_price`）→ ¥0

いずれも個々のドキュメントの `menu_price - pay_community_bill_off_amount` を合算して判定する。

#### Stripe 決済金額の保持

変更なし。「Stripe の請求額だけを重複保存するフィールドは新設しない」方針を維持する。

### 5.1.6 stripes ドキュメント

旧仕様で「将来用・optional」としていた stripes の主催者負担合計フィールド（旧名 `pay_community_bill_amount`）を **`pay_community_bill_off_amount` として本実装**に昇格させる（member_orders と同一キー名だが、stripes ではセッション合計）。

```typescript
// stripes ドキュメント（変更箇所のみ）
{
  pay_amount: number                   // 参加者の実支払額（Stripe 課金額）
  pay_community_bill_off_amount: number    // 主催者負担合計（このセッション分の合計）
  // ※ pay_amount + pay_community_bill_off_amount = Σ menu_price が成り立つ
}
```

`stripes.pay_community_bill_off_amount = Σ (member_order.pay_community_bill_off_amount ?? 0)`（当該セッションの `order_ids` に含まれる各 member_orders ドキュメントの合計）。

**無料参加 / 割引後 ¥0 確定**（`confirmOrder` 経由、Stripe 未使用）では `stripes` ドキュメントを作成しない（`stripe_id` は order ドキュメントに設定されない）。

---

## 5.2 Functions 設計

### 5.2.1 Callable Functions

#### カート更新（`addToCart`）

旧仕様:「Order の `menus` を更新すると同時に、`community_bill_settings` と menus 各行の単価・個数から `pay_community_bill_off_amount` を算出し、同一トランザクションで更新する」

新仕様:「`addToCart` で count 個分の order ドキュメントを作成する際、**各ドキュメントに個別に** `pay_community_bill_off_amount` を設定する。トランザクション不要。`removeFromCart` でのドキュメント削除後は再計算不要」

具体的な処理:

```
addToCart 処理:
1. イベントの community_bill_settings を取得
2. menu_id に対応するマスタから menu_name / menu_price を取得（クライアント送信値は信頼しない）
3. count 個分の order ドキュメントを作成。各 doc に:
   - menu_id, menu_name, menu_price（マスタ値）
   - pay_community_bill_off_amount = calcDiscount(community_bill_settings, menu_price)
     （undefined の場合はフィールドを付けない）
4. members ドキュメントを upsert
```

#### `updateEventDiscountSettings`

変更なし。

#### `validateCoupon` / `applyCoupon`（Phase 2以降）

変更なし。

### 5.2.2 Trigger Functions

変更なし。

---

## 5.3 処理フロー

### 5.3.1 割引設定の更新

変更なし。

### 5.3.2 注文確定時の決済フロー（支払い方法別）

注文確定処理のサーバー側再計算の対象が変わる。

旧仕様:「イベント `community_bill_settings` と Order の `menus` から `pay_community_bill_off_amount` を再計算し、Order に保存済みの値と整合するか検証」

新仕様:「各 order ドキュメントの `menu_price` から個別に再計算し、各ドキュメントの `pay_community_bill_off_amount` と整合するか検証」

```typescript
// サーバー側再計算・整合検証（confirmOrder / createStripeCheckoutSession 内）
for (const order of orders) {
  const expected = calcDiscount(event.community_bill_settings, order.menu_price)
  if ((order.pay_community_bill_off_amount ?? undefined) !== expected) {
    throw new HttpsError('failed-precondition', '割引金額が一致しません')
  }
}

// 支払額計算
const total_payment = orders.reduce(
  (sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0),
  0,
)
```

#### `community_bill` + `free`（無料参加）

変更箇所のみ記載。

| 旧仕様 | 新仕様 |
|:--|:--|
| 「`pay_community_bill_off_amount` がメニュー合計と一致することを確認する」 | 「各 order ドキュメントの `pay_community_bill_off_amount === menu_price` を確認する」 |
| 「`pay_community_bill_off_amount` はカート時点で既にメニュー合計相当が入っている」 | 「各 order ドキュメントに `menu_price` 相当が入っている」 |

#### `community_bill` + `discount`（割引参加）

変更箇所のみ記載。

| 旧仕様 | 新仕様 |
|:--|:--|
| 「`Σ min(off_amount, price) × count`（5.1.5 の行ごと算定）と Order の `pay_community_bill_off_amount` が一致することを確認する」 | 「各 order ドキュメントの `min(off_amount, menu_price)` と `pay_community_bill_off_amount` が一致することを確認する」 |
| 「支払額 = メニュー合計 − 上記主催者負担合計」 | 「支払額 = `Σ (menu_price - pay_community_bill_off_amount)` over order_ids」 |

#### `community_bill` + 割引設定なし

変更なし。

#### `community_bill` + `coupon`（Phase 2以降）

| 旧仕様 | 新仕様 |
|:--|:--|
| 「クーポン適用時もカート更新 Callable で更新」 | 「addToCart 時に `calcDiscount` でドキュメント単位に設定する」 |
| 「`discount` と同様に行ごとに `min(割引額, price) × count` を合算」 | 「`min(クーポン割引額, menu_price)` を各ドキュメントに個別設定」 |

#### `user_advance`（クレカ前払い）

変更なし。

### 5.3.3 バリデーション処理

#### 注文確定時（参加者側）

旧仕様:「`discount` の場合：再計算は 5.1.5 のとおり各行 `min(off_amount, price) × count` の合計」

新仕様:「`discount` の場合：再計算は各 order ドキュメントに対して `min(off_amount, menu_price)` を個別検証」

その他は変更なし。

### 5.3.4 請求処理

請求ロジックの方針は変わらないが、集計対象コレクションが変わる。

旧仕様:「対象イベントの全注文（`status: 'ordered'`）の `pay_community_bill_off_amount` を集計」
（`collectionGroup('orders')` または `event.getOrders('ordered')` を使用）

新仕様:「`collectionGroup('member_orders')` + `where('event_id', '==', eventId)` + `where('status', '==', 'ordered')` で取得した全 member_orders の `pay_community_bill_off_amount` を集計」

```
割引総額 = Σ over ordered member_orders where event_id == eventId:
             (pay_community_bill_off_amount ?? 0)
手数料   = 割引総額 × 0.1
請求合計 = 割引総額 + 手数料
```

算式自体は変更なし。1 order = 1 メニューになったことで、ドキュメント数は増えるが集計ロジックはシンプルになる（groupBy や count 乗算が不要）。

### 5.3.5 キャンセル・払い戻し

旧仕様:「Stripe へ支払った金額の全額払い戻しを行う」

新仕様でも全額払い戻しの方針は変わらないが、**返金金額の算出方法**が変わる。

```typescript
// キャンセル対象 orders の返金金額（stripe_id でグルーピング後）
const refund_amount = canceledOrders.reduce(
  (sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0),
  0,
)
// ※ 旧設計では order.menus の price × count の合計だったが、
//    新設計では各ドキュメントの (menu_price - pay_community_bill_off_amount) の合計になる
```

`community_bill` + `discount` で差額を Stripe 決済していた場合も、各 order ドキュメントの `pay_community_bill_off_amount` から参加者の実支払額を計算できるため同じ式で対応できる。

### 5.3.6 領収書（`receipt_number`）

方針は変更なし。「無料参加 / 割引後 ¥0 で Stripe 決済がない注文では領収書を発行しない」。

判定方法は `total_payment === 0`（全 order_ids の `menu_price - pay_community_bill_off_amount` の合計）。

---

## 5.4 カート画面の表示（新規追加）

旧仕様 4.2.3 の割引表示を EventMemberOrder 向けに実装する。

### 表示用 groupBy（cart.vue）

`in_cart` の order ドキュメントを `menu_id` で groupBy し、グループ内の割引額を合算する。

```typescript
// orders を menu_id ごとに集計（computed で算出）
const groupedMenus = computed(() => {
  const map = new Map<string, {
    menu_id: string
    menu_name: string
    menu_price: number    // 単価
    count: number
    order_ids: string[]
    totalPrice: number    // 元の小計（menu_price × count）
    totalDiscount: number // 割引合計（pay_community_bill_off_amount の合計）
    totalPayment: number  // 参加者支払小計
  }>()

  for (const order of cartOrders) {
    const discount = order.pay_community_bill_off_amount ?? 0
    const existing = map.get(order.menu_id)
    if (existing) {
      existing.count++
      existing.order_ids.push(order.order_id)
      existing.totalPrice += order.menu_price
      existing.totalDiscount += discount
      existing.totalPayment += order.menu_price - discount
    } else {
      map.set(order.menu_id, {
        menu_id: order.menu_id,
        menu_name: order.menu_name,
        menu_price: order.menu_price,
        count: 1,
        order_ids: [order.order_id],
        totalPrice: order.menu_price,
        totalDiscount: discount,
        totalPayment: order.menu_price - discount,
      })
    }
  }
  return Array.from(map.values())
})

// カート合計
const cartTotalPayment = computed(() =>
  groupedMenus.value.reduce((sum, g) => sum + g.totalPayment, 0),
)
```

### 割引表示例（カート画面・無料参加）

```
唐揚げ                ×2
  元価格:  ¥1,000（取消線）
  割引:   -¥1,000
  小計:    ¥0

合計: ¥0
```

### 割引表示例（カート画面・割引参加）

`menu_price: 1000`、`off_amount: 300`、2 個の場合:

```
唐揚げ                ×2
  元価格:  ¥2,000
  割引:   -¥600（¥300 × 2）
  小計:    ¥1,400

合計: ¥1,400
```

旧仕様 4.2.3 の「Order の `menus` および `pay_community_bill_off_amount` に基づく」という説明は、「各 order ドキュメントの `menu_price` と `pay_community_bill_off_amount` の合算に基づく」に読み替える。

---

## 6. 実装優先度（変更点のみ）

### Phase 1.1：スキーマ更新

| 旧仕様チェック項目 | 変更内容 |
|:--|:--|
| `pay_community_bill_off_amount` のスキーマ追加（common, EventOrder） | **`common/src/schemas/EventMemberOrder.ts` に追加**（`EventOrder.ts` ではなく） |
| — | **`common/src/schemas/EventStripe.ts` の `pay_community_bill_off_amount` を optional から必須に変更**（stripes ドキュメント作成時に常に設定） |

### Phase 1.3：決済処理・注文確定処理・キャンセル払い戻し

| 旧仕様チェック項目 | 変更内容 |
|:--|:--|
| カート更新 Callable：`menus` と同一トランザクションで `pay_community_bill_off_amount` を算出・更新 | **`addToCart` で count 個分の各ドキュメント作成時に個別設定。トランザクション不要** |
| 無料参加時の決済スキップ（Stripe なしで直接 `ordered`） | 判定を `total_payment === 0`（全 order の `menu_price - pay_community_bill_off_amount` の合計）に変更 |
| 割引参加時の差額を Stripe Checkout Session で決済 | 決済金額を `Σ (menu_price - pay_community_bill_off_amount)` で算出。`stripes` ドキュメントに `pay_community_bill_off_amount` を設定 |
| 注文確定時：サーバーで `pay_community_bill_off_amount` の再計算・整合検証 | **各 order ドキュメントを個別に検証**（1 ドキュメントごとに `min(off_amount, menu_price)` と比較） |
| キャンセル時：Stripe 利用注文は全額払い戻し | 返金金額を `Σ (menu_price - pay_community_bill_off_amount)` over canceled order_ids で算出 |

### Phase 1.4：請求書発行機能の対応

| 旧仕様チェック項目 | 変更内容 |
|:--|:--|
| 注文の `pay_community_bill_off_amount` を集計する請求額算出ロジック | `collectionGroup('member_orders')` からの集計に変更（パス変更。集計式は同じ） |

---

## 7. 注意事項（追記）

### 7.2 セキュリティ考慮事項（追記）

旧仕様の記述「`pay_community_bill_off_amount` はクライアントが任意に書き換えられないこと」は変わらない。

新設計では Firestore Security Rules で `members/{userId}/member_orders/{orderId}` への直接 write を `false` としているため（`05_EventOrder→EventMemberOrder.md` の Security Rules 参照）、クライアントからの直接更新はルールで防がれる。

### 7.6 removeFromCart 時の再計算不要（新規追記）

旧設計では `-` ボタンでメニュー個数を減らした際に、Order の `menus` 配列を更新した後 `pay_community_bill_off_amount` を全行再計算して更新する必要があった。

新設計では `-` ボタンで 1 つの order ドキュメントを削除するだけで、残りのドキュメントへの影響がない。`removeFromCart` は単一ドキュメントの削除のみであり、`pay_community_bill_off_amount` の更新処理は**不要**。

---

## 影響ファイル（差分）

旧仕様 6.（実装優先度）のチェックリストに加えて、以下のファイルが対象になる。

| ファイル | 変更内容 |
|:--|:--|
| `common/src/schemas/EventMemberOrder.ts` | `pay_community_bill_off_amount?: number` を追加 |
| `common/src/schemas/EventStripe.ts` | `pay_community_bill_off_amount: number` を optional から必須に変更 |
| `functions/default/src/memberOrders.ts` | `addToCart` で `calcDiscount` を呼び `pay_community_bill_off_amount` を各ドキュメントに設定 |
| `functions/default/src/memberOrders.ts` | `confirmOrder` の再計算ロジックを「各ドキュメント個別の `min(off_amount, menu_price)`」に変更 |
| `functions/default/src/stripe.ts` | `createStripeCheckoutSession` の決済金額を `Σ (menu_price - pay_community_bill_off_amount)` で算出 |
| `functions/default/src/stripeWebhook.ts` | stripes ドキュメント作成時に `pay_community_bill_off_amount` を設定 |
| `functions/default/src/stripeRefunds.ts` | `cancelOrders` の返金額を `Σ (menu_price - pay_community_bill_off_amount)` で算出 |
| `functions/default/src/utils/invoice.ts` | 入力型を `EventMemberOrder[]`（1 item = 1 doc）に変更。groupBy や count 乗算を削除 |
| `base/src/components/pages/cart.vue` | 割引表示を groupBy + `totalDiscount` / `totalPayment` で算出（上記 5.4 参照） |
| `base/src/components/UserEventCard.vue` | totalPrice 算出を `status !== 'canceled'` の `menu_price` 合計に変更（`pay_community_bill_off_amount` の合計を割引額として表示） |

---

## feat/960-v2 実装方針

### ブランチ戦略

`origin/development` から新ブランチ `feat/960-v2` を切り、旧 `feat/960` を**参考資料**としながら EventMemberOrder ベースで再実装する。旧 `feat/960` のコードはそのまま cherry-pick しない（`EventOrder` 前提のロジックが混入するため）。

```bash
git checkout -b feat/960-v2 origin/development
```

### development で実装済みのもの（追加実装不要）

| 項目 | 状況 |
|:--|:--|
| `EventMemberOrder` スキーマ（`EventMemberOrder.ts`） | 実装済み（`pay_community_bill_off_amount` フィールドのみ追加が必要） |
| `EventStripe` スキーマ（`pay_community_bill_off_amount: optional`） | 実装済み。optional → 使用するよう変更のみ |
| `memberOrders.ts`（`addToCart` / `removeFromCart` / `confirmOrder`） | 実装済み。割引ロジックのみ追加 |
| `stripe.ts`（`createStripeCheckoutSession`） | 実装済み。`community_bill` + discount パスの追加のみ |
| `stripeWebhook.ts` | 実装済み。`pay_community_bill_off_amount` のセットのみ追加 |
| `cancelOrders.ts` | 実装済み。返金額の計算式変更と `community_bill` + discount の Stripe 返金対応のみ |
| `invoice.ts`（基本的な集計関数） | 実装済み（`calculateOrdersTotal` は `menu_price` ベース）。割引集計関数の追加が必要 |
| `cart.vue`（`GroupedMenu` 型・`groupOrdersByMenu`・基本的な決済フロー） | 実装済み。割引表示フィールドと `community_bill` + discount パスの追加のみ |

### 実装が必要なもの（新規・変更）

#### Phase A：スキーマ（common）

**ほぼそのまま流用可能なもの（feat/960 → v2）**

- `common/src/schemas/Event.ts`：`community_bill_settings`（`CommunityBillSettingsAppSchema` / `CommunityBillSettingsDbSchema`）の追加。`feat/960` の `a2254dc6` + `3cb49659` の変更を `development` 版 `Event.ts` に適用する。コードはそのまま使える

**新規追加・変更が必要なもの**

- `common/src/schemas/EventMemberOrder.ts`：`pay_community_bill_off_amount?: number` を `EventMemberOrderDbSchema` / `EventMemberOrderAppSchema` / `EventMemberOrder` クラスに追加。`feat/960` にはなかった変更

  ```typescript
  // EventMemberOrderDbSchema に追加
  pay_community_bill_off_amount: z.number().int().nonnegative().optional(),

  // EventMemberOrder クラスに追加
  pay_community_bill_off_amount?: number
  ```

- `common/src/schemas/EventStripe.ts`：`pay_community_bill_off_amount` はすでに optional で存在する。スキーマ変更は不要。Webhook 側でセットするだけでよい

#### Phase B：計算ユーティリティ（common）

**書き直しが必要なもの（EventOrder → EventMemberOrder）**

`feat/960` の `paymentCommunityBillOffAmount.ts` は `menus: OrderMenu[]` 配列を引数にとっていたが、`EventMemberOrder` では `menu_price` 1 値のみを使う。関数シグネチャを変更して書き直す。

```typescript
// common/src/utils/paymentCommunityBillOffAmount.ts（v2 版）

/**
 * 1 つの member_orders ドキュメントに適用する主催者負担額を算出する。
 * 割引なし / 非 community_bill の場合は undefined。
 */
export function computePaymentCommunityBillOffAmount(
  eventPayment: EventPaymentType,
  settings: CommunityBillSettingsType | undefined,
  menu_price: number,   // ← 旧: menus: CommunityBillMenuLine[]
): number | undefined {
  if (eventPayment !== 'community_bill') return undefined
  if (settings == null) return undefined
  if (settings.type === 'free') return menu_price
  if (settings.type === 'discount') return Math.min(settings.off_amount, menu_price)
  return undefined
}

/**
 * order_ids 全体の参加者支払合計を算出する。
 */
export function computeTotalPayment(orders: EventMemberOrder[]): number {
  return orders.reduce((sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0), 0)
}

/**
 * サーバー側再計算とストアード値の整合チェック（confirmOrder / createStripeCheckoutSession 用）。
 */
export function isPaymentCommunityBillOffAmountConsistent(
  eventPayment: EventPaymentType,
  settings: CommunityBillSettingsType | undefined,
  order: EventMemberOrder,
): boolean {
  const expected = computePaymentCommunityBillOffAmount(eventPayment, settings, order.menu_price)
  const stored = order.pay_community_bill_off_amount
  return expected === stored   // 両方 undefined も一致とみなす
}
```

**`common/src/utils/invoice.ts` への追加（EventMemberOrder 対応の割引集計）**

`development` 版の `invoice.ts` は `calculateOrdersTotal`（`status === 'ordered'` の `menu_price` 合計）のみを持ち、割引集計はない。以下の関数を追加する（`feat/960` の実装を `EventMemberOrder[]` 型に書き直したもの）：

```typescript
/**
 * 確定注文の主催者負担合計（割引総額）を算出する。
 * pay_community_bill_off_amount が正の整数のもののみ合算。
 */
export function sumOrderedCommunityBillOffAmount(orders: EventMemberOrder[]): number {
  return orders
    .filter((o) => o.status === 'ordered')
    .reduce((sum, o) => {
      const amount = o.pay_community_bill_off_amount
      return typeof amount === 'number' && amount > 0 ? sum + amount : sum
    }, 0)
}

/**
 * 割引請求書の明細用に、pay_community_bill_off_amount ごとに注文件数をまとめる。
 */
export function groupOrderedCommunityBillOffByAmount(orders: EventMemberOrder[]): CommunityBillOffGroupLine[] {
  const countByAmount = new Map<number, number>()
  for (const o of orders) {
    if (o.status !== 'ordered') continue
    const amount = o.pay_community_bill_off_amount
    if (typeof amount !== 'number' || amount <= 0) continue
    countByAmount.set(amount, (countByAmount.get(amount) ?? 0) + 1)
  }
  return Array.from(countByAmount.entries())
    .map(([amountPerOrder, orderCount]) => ({
      amountPerOrder,
      orderCount,
      lineSubtotal: amountPerOrder * orderCount,
    }))
    .sort((a, b) => b.amountPerOrder - a.amountPerOrder)
}
```

#### Phase C：Functions

**`functions/default/src/memberOrders.ts`（addToCart・confirmOrder に割引ロジックを追加）**

`development` 版の `addToCart` は各 order ドキュメントを作成するが、割引を設定していない。以下を追加する：

```typescript
// addToCart のトランザクション内、createOrder 呼び出し直前
const discount = computePaymentCommunityBillOffAmount(
  eventData.event_payment,
  eventData.community_bill_settings,
  masterMenu.menu_price,
)
await createOrder(community_id, event_id, uid, {
  // ... 既存フィールド ...
  ...(discount !== undefined ? { pay_community_bill_off_amount: discount } : {}),
}, transaction)
```

`confirmOrder` には整合チェックと支払額 ¥0 判定（Stripe スキップ）を追加する：

```typescript
// confirmOrder のトランザクション内、status 更新前
for (const order of orders) {
  if (!isPaymentCommunityBillOffAmountConsistent(
    eventData.event_payment,
    eventData.community_bill_settings,
    order,
  )) {
    throw new HttpsError('failed-precondition', '割引金額が一致しません')
  }
}

const totalPayment = computeTotalPayment(orders)
if (totalPayment < 0) {
  throw new HttpsError('internal', '支払額が負になっています')
}
// totalPayment === 0 の場合はそのまま ordered に（Stripe 決済不要）
// totalPayment > 0 の場合：community_bill + discount で差額が発生する
//   → community_bill のイベントでは Stripe 非対応（confirmOrder ルートを使う）
//   → 将来的に差額 Stripe が必要な場合はここで分岐
```

**`functions/default/src/stripe.ts`（`createStripeCheckoutSession` の割引対応）**

`development` 版は `event_payment !== 'user_advance'` なら即エラー。`community_bill` + `discount` で差額 Stripe が必要な場合（`computeTotalPayment > 0`）に対応する。

```typescript
// event_payment チェックを変更
if (event.event_payment !== 'user_advance' && event.event_payment !== 'community_bill') {
  throw new HttpsError('failed-precondition', '...')
}
if (event.event_payment === 'community_bill') {
  // community_bill は discount で差額が生じる場合のみ Stripe 決済
  if (event.community_bill_settings?.type !== 'discount') {
    throw new HttpsError('failed-precondition', '...')
  }
}

// 各 order の整合チェック
for (const order of orders) {
  if (!isPaymentCommunityBillOffAmountConsistent(event.event_payment, event.community_bill_settings, order)) {
    throw new HttpsError('failed-precondition', '割引金額が一致しません')
  }
}

// line_items の unit_amount を参加者支払額（discount 後）に変更
grouped.set(order.menu_id, {
  menuName: order.menu_name,
  unitAmount: order.menu_price - (order.pay_community_bill_off_amount ?? 0), // ← 変更点
  quantity: 1,
  imageUrl: menuImageMap.get(order.menu_id) ?? '',
})
```

**`functions/default/src/stripeWebhook.ts`（`pay_community_bill_off_amount` の設定）**

stripes ドキュメント作成時に `pay_community_bill_off_amount` を追加する：

```typescript
const payAmount = orders.reduce((sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0), 0)
const payCommunityBillAmount = orders.reduce((sum, o) => sum + (o.pay_community_bill_off_amount ?? 0), 0)

const stripeDoc = new EventStripe(stripeDocId, {
  // ... 既存フィールド ...
  pay_amount: payAmount,  // ← discount 後の実支払額
  pay_community_bill_off_amount: payCommunityBillAmount > 0 ? payCommunityBillAmount : undefined,
})
```

**`functions/default/src/cancelOrders.ts`（返金額の計算式変更 + `community_bill` + discount 対応）**

`development` 版は `refundAmount = Σ menu_price`（割引前の金額で返金）になっている。`community_bill` + `discount` で Stripe 決済した注文は `menu_price - pay_community_bill_off_amount` が実支払額なので、返金額もこれに変える。

また、`development` 版は `event_payment === 'user_advance'` のときのみ Stripe 返金している。`community_bill` + `discount` で差額 Stripe 決済した場合（order に `stripe_id` がある場合）も返金が必要になる。

```typescript
// 返金条件の変更: event_payment === 'user_advance' → stripe_id を持つ order が存在する
const hasStripePayment = fetchedOrders.some((o) => o.stripe_id != null)
if (!hasStripePayment) {
  return { canceled_count: canceledCount, refunds: [] }
}

// 返金額の計算式を変更
const refundAmount = groupOrders.reduce(
  (sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0),
  0,
)
```

#### Phase D：フロント

**`base/src/components/EventDiscountChip.vue`（新規ファイル）**

`feat/960` からそのまま流用できる（依存が `CommunityBillSettingsType` のみ）。

**`base/src/components/EventCard.vue`（チップ表示追加）**

`feat/960` の差分をそのまま `development` 版に適用できる（`EventDiscountChip` の追加）。

**`base/src/components/EventDetailsCard.vue`（チップ表示追加）**

同上。

**`base/src/components/eventcreate/EventDetailCard.vue`（割引設定 UI）**

`feat/960` の差分をベースに `development` 版に適用する。

**`base/src/components/pages/cart.vue`（割引表示・決済フロー変更）**

`development` 版の `cart.vue` には以下が**すでに実装済み**：
- `GroupedMenu` 型（`menu_id`・`count`・`order_ids` など）
- `groupOrdersByMenu` 関数
- `EnrichedCartItem`（`groupedMenus`・`totalPrice`）
- 決済フロー（`user_advance` → Stripe、それ以外 → `confirmOrder`）

以下を**追加・変更**する：

```typescript
// GroupedMenu に割引フィールドを追加
type GroupedMenu = {
  // ... 既存フィールド ...
  totalPrice: number     // 追加：元の小計
  totalDiscount: number  // 追加：割引合計
  totalPayment: number   // 追加：参加者支払小計
}

// groupOrdersByMenu を拡張
const discount = order.pay_community_bill_off_amount ?? 0
existing.totalPrice += order.menu_price
existing.totalDiscount += discount
existing.totalPayment += order.menu_price - discount

// EnrichedCartItem の totalPrice を totalPayment に変更（支払額ベース）
totalPrice: cartItem.orders.reduce(
  (sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0),
  0,
),

// 決済フローに community_bill + discount（差額 Stripe）パスを追加
if (event.event_payment === 'user_advance' || needsCommunityBillStripe(event, cartItem.orders)) {
  // Stripe Checkout
} else {
  // confirmOrder（community_bill 割引なし・free・discount ¥0）
}
```

**`base/src/utils/orders.ts`（参加者支払合計）**

`ordersTotalPrice` は従来どおり `ordered` の `Σ menu_price`。参加者の実支払合計（割引後・`in_cart` 含む）は **`@shokujii/common/utils/paymentCommunityBillOffAmount` の `computeTotalPayment(orders, event_payment, community_bill_settings)`** を使用する（`base` に重複ヘルパは置かない）。

**`base/src/components/UserEventCard.vue`（totalPrice の割引反映）**

`development` 版の `totalPrice` は `Σ menu_price`。`pay_community_bill_off_amount` を引いた実支払額ベースに変更する：

```typescript
const totalPrice = computed(() =>
  props.orders
    .filter((o) => o.status !== 'canceled')
    .reduce((sum, o) => sum + o.menu_price - (o.pay_community_bill_off_amount ?? 0), 0),
)
```

`isShowInvoiceButton` の条件も、`community_bill` + `discount` で差額 Stripe 決済した場合（order に `stripe_id` がある）に拡張する：

```typescript
const isShowInvoiceButton = computed(() => {
  if (props.ordersLoading || props.ordersError) return false
  if (!props.orders.some((o) => o.status === 'ordered')) return false
  // user_advance または community_bill + discount で Stripe 決済した注文がある場合
  return (
    props.event.event_payment === 'user_advance' ||
    props.orders.some((o) => o.status === 'ordered' && o.stripe_id != null)
  )
})
```

#### Phase E：請求書

**`functions/default/src/eventBillInvoice.ts`（割引モード対応）**

`common/src/utils/invoice.ts` に追加した `sumOrderedCommunityBillOffAmount`・`groupOrderedCommunityBillOffByAmount` を使って割引請求書の生成に対応する。`feat/960` の `e3eea885` / `067353cb` の変更を `EventMemberOrder[]` 型で書き直したものを適用する。

---

### 実装順序と依存関係

```
Phase A（スキーマ）
  ├── Event.ts に community_bill_settings 追加
  └── EventMemberOrder.ts に pay_community_bill_off_amount 追加

Phase B（ユーティリティ）
  ├── paymentCommunityBillOffAmount.ts を EventMemberOrder 向けに書き直し
  └── invoice.ts に割引集計関数を追加

Phase C（Functions）  ← Phase A・B に依存
  ├── memberOrders.ts（addToCart・confirmOrder）
  ├── stripe.ts（createStripeCheckoutSession）
  ├── stripeWebhook.ts
  └── cancelOrders.ts

Phase D（フロント）  ← Phase A・B に依存
  ├── EventDiscountChip.vue（新規）
  ├── EventCard.vue / EventDetailsCard.vue（チップ追加）
  ├── EventDetailCard.vue（設定 UI）
  ├── cart.vue（割引表示・決済フロー）
  ├── orders.ts（utils）
  └── UserEventCard.vue

Phase E（請求書）  ← Phase B・C に依存
  └── eventBillInvoice.ts
```

### cherry-pick できるコミット（feat/960 から）

ドキュメントのみのコミットは `development` ベースにそのまま持ち込める：

| コミット | 内容 |
|:--|:--|
| `8db68435` | `[doc] 無料参加と割引参加の請求書仕様書を追加` |
| `e5e1c7ec` | `[doc] 割引参加機能の仕様書を更新` |
