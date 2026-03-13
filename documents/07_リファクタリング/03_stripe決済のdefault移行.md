# Stripe 決済の default 移行

## 背景

- Stripe 決済・返金・注文確定の処理が `functions/legacy` に残っている
- legacy は Firebase Functions v1 + JavaScript で実装されており、stores パターン・型安全性・Secret 管理が default と異なる
- default に統一することで、TypeScript 化・stores パターンの適用・`defineSecret` によるシークレット管理を実現する

## 現状の決済フロー

### 決済方式

| 値 | 名称 | 決済タイミング |
|---|---|---|
| `user_advance` | 事前クレジットカード決済 | 注文時に Stripe Checkout で即時決済 |
| `user_on_day` | 当日払い | 注文時は決済なし、当日現地で支払い |
| `community_bill` | 主催者払い | 注文時は決済なし、主催者がまとめて支払い |

### 注文時フロー

```
[user_advance の場合]
cart.vue
  → createStripeCheckoutSession (default/stripe.ts)
  → Stripe Checkout 画面にリダイレクト
  → 決済完了後、Stripe が Webhook を送信
  → stripe_webhook (legacy/stripe-webhook.js)
    → order.status を 'ordered' に更新
    → payment_intent を保存
    → コミュニティメンバーに追加

[user_on_day / community_bill の場合]
cart.vue
  → eventStore.updateOrderStatus(order, 'ordered')
  → base/apis/order.ts → httpsCallable('update_order_status')
  → update_order_status (legacy/orders.js)
    → order.status を 'ordered' に更新
    → コミュニティメンバーに追加
```

### キャンセル時フロー

```
[user_advance の場合]
user/pages/u/[userId].vue
  → httpsCallable('stripe_refunds') を直接呼び出し
  → stripe_refunds (legacy/stripe-refunds.js)
    → Stripe Refund API で返金
    → order.status を 'canceled' に更新
    → refund_id を保存

[user_on_day / community_bill の場合]
user/pages/u/[userId].vue
  → eventStore.updateOrderStatus(order, 'canceled')
  → base/apis/order.ts → httpsCallable('update_order_status')
  → update_order_status (legacy/orders.js)
    → order.status を 'canceled' に更新
```

## 移行対象

### Legacy 関数

| Legacy 関数 | ファイル | 種別 | 呼び出し元 |
|---|---|---|---|
| `stripe_webhook` | `functions/legacy/src/stripe-webhook.js` | HTTP トリガー (v1) | Stripe Dashboard |
| `stripe_refunds` | `functions/legacy/src/stripe-refunds.js` | Callable (v1) | `user/src/pages/u/[userId].vue` |
| `update_order_status` | `functions/legacy/src/orders.js` | Callable (v1) | `base/src/apis/order.ts` |

### 関連する既存 Default 関数

| Default 関数 | ファイル | 概要 |
|---|---|---|
| `createStripeCheckoutSession` | `functions/default/src/stripe.ts` | Stripe Checkout Session 作成（移行済み） |
| `addOrder` / `updateMenuCountInCart` / `deleteMenuInCart` | `functions/default/src/orders.ts` | カート操作（移行済み） |
| `onOrderChanged` | `functions/default/src/orderCompletionMail.ts` | 注文確定時のメール送信トリガー |

## 対応箇所

### 新規ファイル作成

| ファイル | 内容 |
|---|---|
| `functions/default/src/stripeWebhook.ts` | Stripe Webhook ハンドラー |
| `functions/default/src/stripeRefunds.ts` | Stripe 返金処理 |

### ファイル修正

| ファイル | 修正内容 |
|---|---|
| `functions/default/src/orders.ts` | `updateOrderStatus` 関数を追加 |
| `functions/default/src/stores/community.ts` | `ShokujiiCommunity.addMember` メソッドを追加 |
| `functions/default/src/index.ts` | 新規関数のエクスポートを追加 |
| `common/src/apis/stripe.ts` | `StripeRefundsRequest` 型を追加 |
| `common/src/schemas/EventOrder.ts` | `refund_id` フィールドを追加 |
| `base/src/apis/order.ts` | `updateOrderStatus` の呼び出し先を legacy → default に変更 |
| `base/src/apis/stripe.ts` | `stripeRefunds` のラッパー関数を追加 |
| `user/src/pages/u/[userId].vue` | `stripe_refunds` の直接呼び出しを `base/apis/stripe.ts` 経由に変更 |

### Legacy ファイル削除（移行完了後）

| ファイル | 内容 |
|---|---|
| `functions/legacy/src/stripe-webhook.js` | Webhook ハンドラー |
| `functions/legacy/src/stripe-refunds.js` | 返金処理 |
| `functions/legacy/src/orders.js` | 注文ステータス更新 |
| `functions/legacy/src/index.js` | 上記3関数のエクスポートを削除 |

## 共通仕様

### ログ出力

すべての新規関数では `console.log` / `console.error` を使用せず、`firebase-functions` の `logger` を使用する。

```typescript
import { logger } from 'firebase-functions'
```

### ステータス遷移の制約

注文ステータスの遷移は以下のみ許可する。これ以外の遷移はエラーとする。

| 現在のステータス | 遷移先 | 経路 |
|---|---|---|
| `in_cart` | `ordered` | `updateOrderStatus`（`user_on_day` / `community_bill` のみ） |
| `in_cart` | `ordered` | `stripeWebhook`（`user_advance` のみ） |
| `ordered` | `canceled` | `stripeRefunds`（`user_advance` の返金） |
| `ordered` | `canceled` | `updateOrderStatus`（`user_on_day` / `community_bill` のキャンセル） |

不正な遷移の例:

- `ordered` → `ordered`（重複確定）
- `canceled` → `ordered`（キャンセル済みの復活）
- `canceled` → `canceled`（二重キャンセル）
- `in_cart` → `ordered`（`user_advance` で `updateOrderStatus` 経由）

### コミュニティメンバー追加の共通化

`stripeWebhook` と `updateOrderStatus` の両方で、注文確定時にコミュニティメンバーへの追加を行う。この処理を共通ヘルパー関数として `functions/default/src/stores/community.ts` の `ShokujiiCommunity` クラスに追加する。

現状 `ShokujiiCommunity` にはメンバー追加用の汎用メソッドが存在しないため、以下を新規追加する:

```typescript
async addMember(userId: string, transaction?: Transaction): Promise<void> {
  const db = getFirestore()
  const memberRef = db
    .collection('communities')
    .doc(this.id)
    .collection('members')
    .doc(userId)
    .withConverter(communityMemberConverter)
  const data = new CommunityMember(userId, {})
  if (transaction === undefined) {
    await memberRef.set(data, { merge: true })
  } else {
    transaction.set(memberRef, data, { merge: true })
  }
}
```

各関数からは以下のように呼び出す:

```typescript
const community = await getCommunity(communityId)
if (community != null) {
  await community.addMember(userId, transaction)
}
```

#### Legacy `addCommunityUser` との差分

- Legacy は `users` コレクションからユーザーの存在を確認してからメンバー追加していたが、新実装ではユーザー存在チェックを省略する。Checkout を完了できる、または Callable を呼び出せるユーザーは認証済みであり、不要なチェックである
- Legacy は `{ updated_at: Timestamp.now() }` のみを `merge: true` で書き込んでいたが、新実装は `CommunityMember` クラス経由で `{ roles: [] }` を書き込む。ただし `merge: true` を使用するため、既存メンバーの `roles`（例: `['manager']`）が上書きされることはない

## 詳細仕様

### 1. stripeWebhook（`functions/default/src/stripeWebhook.ts`）

Legacy の `stripe_webhook` を Firebase Functions v2 の `onRequest` で再実装する。

#### シークレット

- `STRIPE_API_KEY`: Stripe API キー（`defineSecret` で管理）。`webhooks.constructEvent` 自体は Stripe API への通信を行わないためキーは不要だが、`createStripeCheckoutSession` と同じ Stripe インスタンス生成パターンに統一するためキーを渡す
- `STRIPE_WEBHOOK_ENDPOINT_SECRET`: Webhook 署名検証用シークレット（`defineSecret` で管理）

#### 処理フロー

1. `stripe.webhooks.constructEvent` で署名を検証
2. `event.type === 'checkout.session.completed'` のみ処理（それ以外は 400 を返す）
3. `event.data.object.metadata` から以下を取得:
   - `orderId`, `eventId`, `communityId`, `userId`
4. stores 経由で order を取得（`getOrder`）
5. order の存在チェック
6. **冪等性チェック**: `order.status` が既に `'ordered'` の場合は処理をスキップし、200 を返す（Stripe はリトライするため、同じ Webhook が複数回届く可能性がある。エラーを返すとさらにリトライされるため、正常レスポンスを返す）
7. **ステータス遷移チェック**: `order.status` が `'in_cart'` であることを確認（`'canceled'` など想定外の状態の場合はログを出力し 200 を返す）
8. order のプロパティを更新:
   - `status: 'ordered'`
   - `ordered_at: Date.now()`
   - `payment_intent: event.data.object.payment_intent`（`Stripe.Checkout.Session.payment_intent` の型は `string | Stripe.PaymentIntent | null` だが、`checkout.session.completed` では string（PaymentIntent ID）が返る。null になるのは `payment_status` が `no_payment_required` の場合だが、`mode: 'payment'` で作成しているため該当しない）
9. stores 経由で order を保存（`saveOrder`）— `toFirestore()` 内で epoch millis が Firestore Timestamp に変換される
10. コミュニティメンバーに追加（`community.addMember(userId)`）
11. 成功レスポンス（200）を返す

#### エラーハンドリング

- 署名検証失敗 → 400
- order が見つからない → 400（`logger.error` でログ出力）
- 未対応のイベントタイプ → 400
- 冪等性チェックで既に `ordered` → 200（正常終了として扱う）
- 想定外のステータス → 200 + `logger.warn` でログ出力

### 2. stripeRefunds（`functions/default/src/stripeRefunds.ts`）

Legacy の `stripe_refunds` を Firebase Functions v2 の `onCall` で再実装する。

#### シークレット

- `STRIPE_API_KEY`: Stripe API キー（`defineSecret` で管理）

#### リクエスト型（`common/src/apis/stripe.ts` に追加）

```typescript
export type StripeRefundsRequest = {
  payment_intent: string
  order_id: string
  community_id: string
  event_id: string
}
```

#### 処理フロー

1. 認証チェック（`request.auth?.uid`）
2. リクエストデータのバリデーション
3. stores 経由で order を取得（`getOrder`）
4. order の存在チェック
5. 権限チェック（`order.user_id === uid`）
6. **ステータスチェック**: `order.status === 'ordered'` であることを確認（`'in_cart'` の注文に対する返金や、既に `'canceled'` の注文への二重返金を防止）
7. `stripe.refunds.create({ payment_intent })` で Stripe に全額返金リクエスト（`amount` を指定しないため全額返金となる。部分返金が必要になった場合は別途対応する）
8. order のプロパティを更新:
   - `status: 'canceled'`
   - `canceled_at: Date.now()`
   - `refund_id: refund.id`
9. stores 経由で order を保存（`saveOrder`）— `toFirestore()` 内で epoch millis が Firestore Timestamp に変換される
10. `{ refund_id }` を返却

#### エラーハンドリング

- 未認証 → `unauthenticated`
- order が見つからない → `not-found`
- 権限なし → `permission-denied`
- ステータスが `ordered` でない → `failed-precondition`
- Stripe API エラー → `unknown`

#### Legacy との差分

- 権限チェック（`order.user_id === uid`）を追加（Legacy にはなかった）
- ステータスチェック（`order.status === 'ordered'`）を追加（Legacy にはなかった）
- `community_id` と `event_id` をリクエストに追加（stores の `getOrder` に必要）
- Legacy は `collectionGroup('orders')` で orderId のみで検索していたが、default では `community_id` / `event_id` / `order_id` の3つのパスで直接参照する

### 3. updateOrderStatus（`functions/default/src/orders.ts` に追加）

Legacy の `update_order_status` を Firebase Functions v2 の `onCall` で再実装する。

#### リクエスト型

既存の `common/src/apis/order.ts` の `UpdateOrderStatusRequest` を使用する。

```typescript
// 既存の型定義
export type UpdateOrderStatusRequest = {
  community_id: string
  event_id: string
  order_id: string
  status: EventOrderStatusType
}
```

#### 処理フロー

1. 認証チェック（`request.auth?.uid`）
2. リクエストデータのバリデーション
3. トランザクション内で:
   a. event を stores 経由で取得（`getEvent`）
   b. order を stores 経由で取得（`getOrder`）
   c. event・order の存在チェック
   d. `community_id` の整合性チェック（`eventData.community_id === community_id` を確認。`getEvent` は `collectionGroup` で取得するため、不正な `community_id` が渡されると `saveOrder` で誤ったパスに書き込む可能性がある）
   e. 権限チェック（`order.user_id === uid`）
   f. `event.event_payment === 'user_advance'` かつ `status === 'ordered'` の場合はエラー（Stripe 経由でのみ注文確定可能）
   g. **ステータス遷移チェック**: 「共通仕様 > ステータス遷移の制約」に基づき、現在のステータスから要求されたステータスへの遷移が許可されているか確認
   h. プロパティ更新:
      - `status === 'ordered'` の場合: `ordered_at = Date.now()` を設定
      - `status === 'canceled'` の場合: `canceled_at = Date.now()` を設定
   i. stores 経由で order を保存（`saveOrder`）
   j. `status === 'ordered'` の場合: コミュニティメンバーに追加（`community.addMember(userId, transaction)`）

#### エラーハンドリング

- 未認証 → `unauthenticated`
- event / order が見つからない → `not-found`
- `community_id` と event の `community_id` が不一致 → `not-found`
- 権限なし → `permission-denied`
- `user_advance` で `ordered` への変更 → `permission-denied`
- 不正なステータス遷移 → `failed-precondition`

### 4. スキーマ変更（`common/src/schemas/EventOrder.ts`）

`refund_id` フィールドを追加する。

```typescript
// EventOrderDbSchema に追加
refund_id: z.string().nonempty().optional(),

// EventOrderAppSchema に追加
refund_id: z.string().optional(),
```

クラスにプロパティを追加:

```typescript
refund_id?: string
```

### 5. フロントエンド変更

#### `base/src/apis/order.ts`

`updateOrderStatus` の呼び出し先を変更:

```typescript
// 変更前
const f = httpsCallable<UpdateOrderStatusRequest, void>(functions, 'update_order_status')

// 変更後
const f = httpsCallable<UpdateOrderStatusRequest, void>(functions, 'updateOrderStatus')
```

#### `base/src/apis/stripe.ts`

`stripeRefunds` 関数を追加:

```typescript
import { StripeRefundsRequest } from '@shokujii/common/apis/stripe.js'

export const stripeRefunds = (input: StripeRefundsRequest) => {
  const f = httpsCallable(functions, 'stripeRefunds')
  return f(input)
}
```

#### `user/src/pages/u/[userId].vue`

`stripe_refunds` の直接呼び出しを `base/apis/stripe.ts` 経由に変更:

```typescript
// 変更前
const stripeRefunds = httpsCallable(functions, 'stripe_refunds')
await stripeRefunds({ paymentIntent: order.payment_intent, orderId: order.order_id })

// 変更後
import { stripeRefunds } from '@shokujii/base/apis/stripe'
await stripeRefunds({
  payment_intent: order.payment_intent,
  order_id: order.order_id,
  community_id: order.community_id,
  event_id: order.event_id,
})
```

### 6. index.ts の更新（`functions/default/src/index.ts`）

エクスポートに以下を追加:

- `stripeWebhook`（`./stripeWebhook.js` から）
- `stripeRefunds`（`./stripeRefunds.js` から）
- `updateOrderStatus`（`./orders.js` から）

## デプロイ戦略

Legacy と default の関数名が異なるため、段階的に移行できる。development 環境で検証した後に production へ展開する。

Functions のデプロイは `deploy_functions.yml` により全 codebase（default + legacy）が一括デプロイされる。フロントエンド（user）のデプロイは `deploy_user.yml` により `user/**` / `base/**` の変更で独立してデプロイされる。

### Phase 1: バックエンドのデプロイと検証（development）

**シークレットの準備**:

- GCP Secret Manager に `STRIPE_WEBHOOK_ENDPOINT_SECRET` を設定（development 環境）
  - `STRIPE_API_KEY` は `createStripeCheckoutSession` で既に設定済み
  - 環境構築の詳細は `documents/07_リファクタリング/03_stripe決済の環境構築手順.md` を参照

**コード変更**:

- `functions/default/src` に新関数（`stripeWebhook`, `stripeRefunds`, `updateOrderStatus`）を追加
- `functions/default/src/stores/community.ts` に `addMember` メソッドを追加
- `common/src/schemas/EventOrder.ts` に `refund_id` フィールドを追加
- `common/src/apis/stripe.ts` に `StripeRefundsRequest` 型を追加
- `functions/default/src/index.ts` にエクスポートを追加

**デプロイ**:

- development ブランチにマージ → `deploy_functions.yml` で自動デプロイ

**確認事項**:

- Firebase Console で `stripeWebhook`, `stripeRefunds`, `updateOrderStatus` が表示されること
- `stripeWebhook` の URL を控える（`https://asia-northeast1-{projectId}.cloudfunctions.net/stripeWebhook`）
- この時点では既存トラフィックに影響なし（フロントエンド未変更、Webhook URL 未変更）

### Phase 2: フロントエンドのデプロイと検証（development）

**コード変更**:

- `base/src/apis/order.ts` の `updateOrderStatus` の呼び出し先を `'update_order_status'` → `'updateOrderStatus'` に変更
- `base/src/apis/stripe.ts` に `stripeRefunds` ラッパー関数を追加
- `user/src/pages/u/[userId].vue` の `stripe_refunds` 直接呼び出しを `base/apis/stripe.ts` 経由に変更

**デプロイ**:

- development ブランチにマージ → `deploy_user.yml` で自動デプロイ
- この時点で Callable 関数（`updateOrderStatus`, `stripeRefunds`）は即座に default に切り替わる
- Webhook はまだ legacy のままなので `user_advance` の注文確定フローには影響しない

**確認事項**:

- `user_on_day` / `community_bill` イベントで注文確定 → `updateOrderStatus`（default）が呼ばれること
- `user_on_day` / `community_bill` イベントでキャンセル → `updateOrderStatus`（default）が呼ばれること
- `user_advance` イベントでキャンセル → `stripeRefunds`（default）が呼ばれること
- 注文確定メール（`onOrderChanged`）が正常に送信されること

### Phase 3: Stripe Webhook の切り替え（development）

**作業**:

- Stripe Dashboard（test mode）で **新規 Webhook エンドポイントを作成**し、default の URL を登録
- 既存の legacy 用エンドポイントの URL を変更するより、新規作成の方がロールバックが容易
- 環境構築の詳細は `documents/07_リファクタリング/03_stripe決済の環境構築手順.md` を参照

**確認事項**:

- `user_advance` イベントで注文 → Stripe Checkout → 決済完了 → Webhook → 注文確定の全フロー
- Webhook が `stripeWebhook`（default）に届き、order.status が `ordered` に更新されること
- コミュニティメンバーに追加されること
- `user_advance` の注文確定後にキャンセル → Stripe 返金 → order.status が `canceled` に更新される全フロー

**ロールバック**: 問題があれば Stripe Dashboard で新規エンドポイントを無効化し、既存の legacy 用エンドポイントをそのまま使用

### Phase 4: production デプロイ

**シークレットの準備**:

- GCP Secret Manager に `STRIPE_WEBHOOK_ENDPOINT_SECRET` を設定（production 環境）

**デプロイ**:

- Phase 1〜2 のコード変更を production ブランチにマージ
- `deploy_functions.yml` + `deploy_user.yml` で自動デプロイ
- この時点で Callable 関数は即座に default に切り替わるが、Webhook はまだ legacy のまま

**確認事項**:

- Phase 2 と同じ確認を production で実施

### Phase 5: Stripe Webhook の切り替え（production）

**作業**:

- Stripe Dashboard（live mode）で **新規 Webhook エンドポイントを作成**し、default の URL を登録
- 既存の legacy 用エンドポイントの URL を変更するより、新規作成の方がロールバックが容易
- 環境構築の詳細は `documents/07_リファクタリング/03_stripe決済の環境構築手順.md` を参照

**確認事項**:

- Phase 3 と同じ全フローの動作確認を production で実施

**ロールバック**: 問題があれば Stripe Dashboard で新規エンドポイントを無効化し、既存の legacy 用エンドポイントをそのまま使用

### Phase 6: Legacy 関数の削除

**Stripe 側の作業（コード変更・デプロイの前に実施）**:

- default への切り替えが問題なく完了していることを確認したうえで、Stripe Dashboard で **旧（legacy）Webhook エンドポイントを無効化または削除**する
- 実施タイミング: Phase 3（development）・Phase 5（production）の確認事項が完了し、切り替えが確定した後
- 実施理由: Phase 6 で legacy 関数を削除すると、旧エンドポイントの URL は存在しない関数を指す。Stripe は有効なエンドポイントへイベントを配信し続けるため、無効化しないと checkout.session.completed が恒常的に失敗し、リトライが発生する
- 手順の詳細は `documents/07_リファクタリング/03_stripe決済の環境構築手順.md` の「旧 Webhook エンドポイントの無効化」を参照

**コード変更**:

- `functions/legacy/src/stripe-webhook.js` を削除
- `functions/legacy/src/stripe-refunds.js` を削除
- `functions/legacy/src/orders.js` を削除
- `functions/legacy/src/index.js` から上記3関数のエクスポートを削除

**CI の変更**:

- `.github/workflows/deploy_functions.yml` の legacy `.env` 生成から、他の legacy 関数が使用していないシークレットの書き出しを削除
  - `STRIPE_WEBHOOK_ENDPOINT_SECRET` → 削除対象
  - `STRIPE_API_SECRET_KEY` → 削除対象
  - ただし削除前に他の legacy 関数が参照していないことを確認すること。確認方法: `functions/legacy/src/` 配下で `process.env.STRIPE_WEBHOOK_ENDPOINT_SECRET` / `process.env.STRIPE_API_SECRET_KEY` を検索し、削除対象のファイル以外で参照がないことを確認する

**デプロイ**:

- development → production の順でデプロイ

## Stripe SDK / API バージョン方針

### 現状

| パッケージ | SDK バージョン | pin された API バージョン | コード上の指定 |
|---|---|---|---|
| default | `stripe@^12.17.0` | `2022-11-15` | `apiVersion: '2022-11-15'` を明示指定 |
| legacy | `stripe@^13.2.0` | `2023-08-16` | 指定なし（SDK のデフォルト） |

### 方針: 既存の default に合わせる

新規関数（`stripeWebhook`, `stripeRefunds`）は既存の `createStripeCheckoutSession` と同じ `stripe@^12` / `apiVersion: '2022-11-15'` を使用する。

**理由**:

- Checkout Session の作成と Webhook / 返金で同じ API バージョンを使うことが重要。API バージョン間で metadata や payment_intent の構造が変わる可能性があるため
- legacy の `stripe@^13` で使用している `refunds.create` と `webhooks.constructEvent` は `2022-11-15` でも同じインターフェースで動作する（v12→v13 の破壊的変更はこれらの API に影響しない）
- このタスクの目的は legacy → default の移行であり、SDK アップグレードは別スコープにすべき

### 将来の対応: SDK アップグレード（別 Issue）

SDK のアップグレードはこのタスク完了後に別 Issue で対応する。参考として SDK バージョンと pin API バージョンの対応は以下の通り。

| SDK メジャーバージョン | pin された API バージョン |
|---|---|
| v12 | `2022-11-15` |
| v13 | `2023-08-16` |
| v14 | `2023-10-16` |
| v15 | `2024-04-10` |
| v16 | `2024-06-20` |
| v17 | `2024-09-30.acacia` |
| v18 | `2025-03-31.basil` |
| v19 | `2025-09-30.clover` |
| v20 | `2026-02-25.clover`（最新安定版） |

アップグレード時は以下を考慮すること:

- v12→v13: `del` メソッド → `cancel()` への変更、デフォルトリトライが 0→1 に変更
- 各メジャーバージョンの破壊的変更は [stripe-node Wiki](https://github.com/stripe/stripe-node/wiki) の Migration guide を参照
- アップグレード後は `apiVersion` の明示指定を削除し、SDK の pin に任せる運用が推奨

## 注意事項

- `ordered_at` / `canceled_at` の設定には `Date.now()` を使用する。コードレビュー規約では `luxon` の使用が推奨されているが、`EventOrder` スキーマ自体が `convertToDb` 内で `Date.now()` を使用しており、epoch millis を返す点で `Date.now()` と `DateTime.now().toMillis()` は等価である。Cloud Functions の実行環境は UTC 固定のため実害はなく、既存の `EventOrder` との一貫性を優先する
- Stripe Dashboard の Webhook URL 変更は Phase 3/5 で行う。Phase 2 のフロントエンドデプロイより先に変更しないこと
- `refund_id` は現在 Legacy が Firestore に書き込んでいるがスキーマに定義されていない。既存データとの互換性に注意すること
- `onOrderChanged`（`orderCompletionMail.ts`）は order の `status` が `ordered` に変わった時にメール送信するトリガーで、移行後も変更不要（Firestore トリガーなのでどの関数が書き込んでも発火する）
- admin パッケージは `stripe_refunds`, `update_order_status`, `stripe_webhook` のいずれも使用していないため、影響なし
- Phase 4（production デプロイ）と Phase 5（Webhook URL 切り替え）の間にタイムラグがある。この間 `user_advance` の注文確定は legacy の Webhook で処理されるが、Callable 関数（`updateOrderStatus`, `stripeRefunds`）は default で処理される。両者は独立したフローなので問題ない
- 既存の `CreateStripeCheckoutSessionRequest` は `order: EventOrder` をオブジェクトとして渡しており、コードレビュー規約の「Callable Functions の引数にオブジェクトを渡さない」に抵触する。ただし `createStripeCheckoutSession` は今回の移行対象ではなく、Stripe の `line_items` 生成にメニュー情報（name, price, imageUrl 等）が必要なため ID のみでは不十分である。この改善は今回のスコープ外とし、必要に応じて別 Issue で対応する

## 実装時の参考情報

- `documents/07_リファクタリング/03_stripe決済の環境構築手順.md` ー Stripe 環境構築の詳細手順
- `documents/実装メモ/common_schemas における zod の使い方.md`
- `documents/実装メモ/functionsにおける common_schemas の使い方.md`
- `documents/実装メモ/functionsにおける store の使い方.md`
