# PayPay決済_遅延決済

## 1. 目的

PayPay での決済に対応することで、以下を目指す。

- **ユーザー参加率の向上**: クレジットカード以外の決済手段を提供し、参加のハードルを下げる
- **決済完了率の向上**: 利用者の多い PayPay を選択肢に加え、途中離脱を減らす

## 2. 課題

PayPay は **遅延決済** となる場合がある。

- カード決済: Checkout 完了と同時に `payment_status` が `paid` になる
- PayPay 等: 顧客がリダイレクトを完了した時点では `payment_status` が `unpaid` のまま（Stripe API の `payment_status` は `paid` / `unpaid` / `no_payment_required` の 3 値）
- 後日、決済が確定すると `checkout.session.async_payment_succeeded` が発火する

このため、`checkout.session.completed` のみを処理すると、支払い未確定のまま注文を確定してしまうリスクがある。

さらに、`payment_status` が `unpaid` のまま `order.status` を `in_cart` にしておくと、ユーザーがカートから注文を削除したりメニューを編集できてしまう。決済処理中は編集・削除を禁止する必要がある。

## 3. 対応案

### 3.1 order.status に `processing` を追加（必須）

`common/src/schemas/EventMemberOrder.ts` の `EVENT_MEMBER_ORDER_STATUS_VALUES` に `'processing'` を追加する。あわせて `processing_payment_intent` と `processing_at` を `EventMemberOrder` に追加し、processing 中はどの PaymentIntent に紐づいているかを記録する。

**フィールドの責務分離**: `processing_payment_intent` / `processing_at` はいずれも **processing 状態のときだけ存在する一時フィールド**として扱う。`ordered` 確定時 / `async_payment_failed` で `in_cart` に戻すとき、いずれも `undefined` にクリアする。確定済みの PaymentIntent は `EventStripe.payment_intent`（必須）が永続保持するため、`EventMemberOrder` 側は永続化しない。フィールド名に `processing_` プレフィックスを付けることで「processing 中のみ有効」という寿命を明示する。

| status | 意味 | 編集・削除 | カート表示 | 注文一覧表示 |
|--------|------|------------|------------|---------------|
| `in_cart` | カート編集中 | ✅ 可 | ✅ | ❌ |
| `processing` | 決済処理中（PayPay 等） | ❌ 不可 | ❌ | ✅「決済処理中」 |
| `ordered` | 注文確定 | ❌ 不可 | ❌ | ✅ |
| `canceled` | キャンセル済み | - | ❌ | ✅ |

**ステータス遷移**:

```
in_cart ──[checkout.session.completed, payment_status=paid または no_payment_required]──→ ordered
    │
    └──[checkout.session.completed, payment_status=unpaid]──→ processing
                                                                              │
                                                                              ├──[async_payment_succeeded]──→ ordered
                                                                              │
                                                                              └──[async_payment_failed]──→ in_cart（再試行可能）
```

- `updateMenuCountInCart` / `deleteMenuInCart`: `in_cart` のみ許可（現状のまま。`processing` は自動的に拒否される）
- `processing` からの遷移は Webhook のみ。Callable の `updateOrderStatus` では `processing` への遷移は許可しない
- **processing の注文のキャンセル**: 不可。`async_payment_failed` で `in_cart` に戻るまで待つ。ユーザーが能動的にキャンセルする手段は提供しない

### 3.2 payment_status の値（参考）

Stripe Checkout Session の `payment_status` は以下の 3 値のみ（[API リファレンス](https://docs.stripe.com/api/checkout/sessions/object#checkout_session_object-payment_status)）。

| 値 | 意味 |
|----|------|
| `paid` | 決済完了。資金が利用可能 |
| `unpaid` | 未払い。遅延決済の場合は Checkout 完了時点でこの状態 |
| `no_payment_required` | 支払い不要（setup モードや 0 円など） |

遅延決済（PayPay 等）では、`checkout.session.completed` 受信時点では `unpaid` となる。`no_payment_required` の場合は支払い不要のため、`ordered` として即時確定する。

### 3.3 Webhook の修正（必須）

**署名検証**: すべての Webhook 処理の前に `stripe.webhooks.constructEvent` で署名を検証する。未検証のペイロードを処理しない。

| 対応 | 内容 |
|------|------|
| payment_status の確認 | `checkout.session.completed` 受信時、`payment_status === 'paid'` または `'no_payment_required'` の場合は `ordered` に遷移する |
| processing への遷移 | `payment_status` が `unpaid` の場合は `order.status = 'processing'` に更新する |
| async_payment_succeeded の処理 | `checkout.session.async_payment_succeeded` イベントを処理し、`processing` → `ordered` に遷移する |
| async_payment_failed の処理 | `checkout.session.async_payment_failed` で `processing` → `in_cart` に戻し、ユーザーが再試行できるようにする |

**冪等性**:

- `checkout.session.completed`: `order.status === 'ordered'` の場合はスキップ。`payment_status === 'paid'` または `'no_payment_required'` で `ordered` に遷移する際、既に `ordered` なら 200 を返して終了。
- `async_payment_succeeded`: `order.status === 'ordered'` の場合はスキップ（既に確定済み）。
- `async_payment_failed`: `order.status === 'in_cart'` の場合はスキップ（既に戻済み）。

**no_payment_required 時の payment_intent**: `payment_status === 'no_payment_required'` のときは `payment_intent` が null になり得る（0円・setup モードなど）。この場合、payment_intent チェックをスキップし、`order.processing_payment_intent` は更新しない（undefined のまま）にする。

**ordered 確定時の processing_payment_intent**: `processing` → `ordered` に遷移するとき、および `in_cart` から直接 `ordered` に遷移するときは、`order.processing_payment_intent` と `order.processing_at` を `undefined` にクリアする。確定済みの PaymentIntent は `EventStripe.payment_intent` が保持するため、`EventMemberOrder` 側に残さない。

**async_payment_failed 時の processing_payment_intent**: `processing` → `in_cart` に戻す際、失敗した `processing_payment_intent` をクリアする（`order.processing_payment_intent` / `order.processing_at` を `undefined` に）。再試行時は新しい Checkout Session で新しい `payment_intent` が発行される。

**同一 order に別 PaymentIntent が紐づいている場合のレース回避**: `async_payment_failed` 受信時、`order.processing_payment_intent` が Webhook 側の `paymentIntent` と一致しない場合は触らない。「PayPay 失敗 → ユーザーが別カードで再決済 → 新しい PI で processing 中」のケースで、古い失敗イベントが新しい processing を巻き戻すのを防ぐため。

**addMember のタイミング**: `community.addMember(userId)` は `order.status = 'ordered'` に更新したとき**のみ**実行する。`processing` のときは実行しない。

**metadata**: `async_payment_succeeded` および `async_payment_failed` でも `session.metadata` に `orderId`, `eventId`, `communityId`, `userId` が含まれる。`checkout.session.completed` と同じ metadata 構造を前提にすれば、同じロジックで注文を特定できる。

### 3.4 success_url に session_id を追加（必須）

`functions/default/src/stripe.ts` の `success_url` に `session_id={CHECKOUT_SESSION_ID}` を追加する。

```
success_url: `${getUserUrl(uid)}?eventId=${order.event_id}&communityAccount=${order.community_account}&isPosted=${isPosted}&session_id={CHECKOUT_SESSION_ID}`
```

フロントで `session_id` から Stripe Session の `payment_status` を取得するか、`order.status` をポーリングする際に必要となる。

### 3.5 Stripe ダッシュボードの設定（必須）

Webhook エンドポイントに以下のイベントを追加する。

- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`

**手順**: Stripe Dashboard → Developers → Webhooks → 対象エンドポイント → Update details → Select events to listen to

### 3.5.1 Checkout Session の `expires_at` と Webhook での再検証

- `functions/default/src/stripe.ts` の `createStripeCheckoutSession` では、**カード決済・PayPay いずれも同一の Checkout Session** 作成時に `expires_at`（`CHECKOUT_SESSION_EXPIRES_SECONDS` により現状は約 31 分後）を設定する。
- **`checkout.session.completed` や `checkout.session.async_payment_succeeded` などの確定系 Webhook では `expires_at` を再チェックしない**。セッション期限は Stripe 上で決済画面の有効期限として機能し、遅延決済の成否は `payment_status` および `async_payment_*` で扱う。
- したがって **Webhook 側で `expires_at` を突き合わせる追加実装は本仕様の対象外**とする（任意に追加してよい整備ではなく採用しない）。イベントの注文締切との厳密な整合や、締切超過後の返金まで含めた制御が必要な場合は、別途仕様（例: `08_注文期限超過時の自動返金_将来実装.md`）で設計する。

### 3.6 フロントエンドの表示（推奨）

success_url 遷移時、決済が未確定の可能性があるため、表示を分ける。

| 状態 | 表示 |
|------|------|
| `order.status === 'ordered'` | 「イベント参加完了」モーダル（現状どおり） |
| `order.status === 'processing'` | 「決済処理中です。完了後、注文一覧に反映されます。」など |

**実装方針**:

1. success_url に `session_id={CHECKOUT_SESSION_ID}` を追加する（3.4 参照）
2. フロントで注文の `order.status` をポーリングし、`ordered` になったら「参加完了」に切り替える。`processing` の間は「決済処理中です。完了後、注文一覧に反映されます。」と表示する

**注文一覧での processing 表示**: 注文一覧（`status !== 'in_cart'`）では `processing` の注文も表示し、「決済処理中」と区別して表示する。カート（`status === 'in_cart'`）には `processing` は含まれない。

### 3.7 リカバリーの流れ

| タイミング | イベント | 処理 |
|-----------|----------|------|
| 顧客が PayPay リダイレクト完了 | `checkout.session.completed` | `payment_status === 'paid'` または `'no_payment_required'` → `ordered`、`payment_status === 'unpaid'` → `processing` |
| 後日、決済が成功 | `checkout.session.async_payment_succeeded` | `processing` → `ordered` |
| 決済が失敗 | `checkout.session.async_payment_failed` | `processing` → `in_cart`（再試行可能） |

`checkout.session.async_payment_succeeded` を処理することで、遅延決済が後から成功した場合も正しく注文を確定できる。`async_payment_failed` で `in_cart` に戻すことで、ユーザーがカートから再度決済を試せる。

### 3.8 テスト

遅延決済フローのテスト方法。

1. **Stripe CLI で Webhook をトリガー**: ローカル開発時、`stripe listen` で Webhook を転送しつつ、以下のコマンドでイベントを発火できる。
   - `stripe trigger checkout.session.async_payment_succeeded`
   - `stripe trigger checkout.session.async_payment_failed`
   - 注意: トリガーしたイベントの `metadata` は本番と異なるため、事前に `processing` 状態の注文を用意するか、Webhook の metadata 検証を一時的に緩和する必要がある。

2. **テスト用 PaymentMethod**: Stripe の [Testing](https://docs.stripe.com/testing) では、遅延決済をシミュレートする PaymentMethod が用意されている。国・決済手段ごとに `pm_successDelayed_*`、`pm_failed_*` などがある。PayPay 相当の遅延決済フローをテストする方法は、Stripe ダッシュボードで PayPay を有効にしたうえで、Test モードで実際の Checkout フローを試すか、上記 CLI で Webhook をトリガーする。

3. **Stripe CLI のローカルテスト**: `stripe listen --forward-to localhost:5001/<project>/us-central1/stripeWebhook` で Webhook を転送し、Checkout 完了後に `async_payment_succeeded` / `async_payment_failed` が届くことを確認する。
