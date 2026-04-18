# EventMemberOrder タスク計画

## 概要

[05_EventOrder→EventMemberOrder.md](./05_EventOrder→EventMemberOrder.md) のデータ構造変更を実装するためのタスク計画。
**1 order ドキュメント = 1 メニュー**。menus 配列は持たない。
依存関係に基づき 8 フェーズに分割し、各フェーズで 1-2 PR を作成する。

**本番リリース**: 本タスク計画に含まれる実装を揃えてからデプロイする想定（フェーズごとの本番部分リリースは前提としない）。

## 依存関係

```
Phase 1: 土台（スキーマ・Store・インフラ）
    ↓
Phase 2: バックエンド Callable Functions + createEventMembers トリガー
    ↓
Phase 3: フロント（カート画面）  ← Phase 2 と同時デプロイ
    ↓
Phase 4: 既存機能の修正（フロント表示・購読）※マイページ・領収書除く  ┐
Phase 5: 既存機能の修正（Functions）                                      ┘ 並行作業可能
    ↓
Phase 6: マイページの注文一覧・領収書
    ↓
Phase 7: キャンセル機能
    ↓
Phase 8: データ移行
```


## Phase 1: 土台（スキーマ・Store・インフラ）

**目的**: 全フェーズが依存する型・Store 関数・Security Rules・インデックスを先に固める。既存コードは壊さず「追加」のみ行う。

**Phase 1 の範囲外（Phase 4〜5 で実施）**: `ShokujiiEvent` の `getOrders` / `getOrder` / `saveOrder` / `hasOrderedOrders` / `getOrdersByIds` の全面委譲とシグネチャ変更。カート放置通知 `inCartNotification.ts` を **`getInCartMemberOrdersByUpdatedTime`** に切り替える作業。本番リリースは全機能実装とテスト後の想定とし、上記はメール・通知・購読まわり（Phase 4〜5）と同時に進める。

**PR**: 1 PR

**仕様書**: [05](./05_EventOrder→EventMemberOrder.md) のデータ構造・Store 関数インターフェース・Security Rules・インデックス

### タスク

- [ ] 新スキーマ定義
  - [ ] `common/src/schemas/EventMemberOrder.ts` を新規作成（EventMember, EventMemberOrder）。menus 配列は持たず `menu_id` / `menu_name` / `menu_price` をトップレベルに配置。`partner_id` は `Event.partner_id` を参照するため含めない
  - [ ] `common/src/schemas/EventStripe.ts` を新規作成（EventStripe, RefundEntry）。`order_ids: string[]`、`menus`（決済時の注文内容サマリー）を持つ
  - [ ] DbSchema / AppSchema の日付フィールドに TimestampSchema / EpochMillisSchema を適用
  - [ ] 旧 EventOrder スキーマはこの時点では残す

- [ ] API 型定義の追加
  - [ ] `common/src/apis/order.ts` に AddToCartRequest / RemoveFromCartRequest / ConfirmOrderRequest を追加（AddToCartResponse は void）
  - [ ] `common/src/apis/stripe.ts` に CreateStripeCheckoutSessionRequest（**order_ids のみ**。旧 `order: EventOrder` ペイロードは削除）/ CancelOrdersRequest / CancelOrdersResponse を追加

- [ ] Functions 側 Store 関数の実装
  - [ ] `functions/default/src/stores/memberOrder.ts` に新パス対応の store 関数を実装・拡張
    - getOrders, getOrder, getOrdersInCart, getOrdersByIds, hasOrderedOrders, saveOrder, deleteOrder
    - getMember, saveMember
    - getStripe, saveStripe
    - `getInCartMemberOrdersByUpdatedTime`（EventMemberOrder 用 converter。**完成と inCart への接続は Phase 5**）
  - [ ] 旧パス用の `functions/default/src/stores/order.ts` は移行完了後に削除し `memberOrder.ts` に統一する方針（Phase 1 では残す）

- [ ] Security Rules の更新
  - [ ] `firestore.rules` に members / member_orders / stripes のルールを追加
  - [ ] 旧 orders のルールはこの時点では残す

- [ ] Firestore インデックスの更新
  - [ ] `firestore.indexes.json` に新規インデックスを追加（event_id + status + updated_at 等）
  - [ ] community_account 関連の旧インデックスはこの時点では残す

### 検証

- [ ] `npm -w common run build` が通ること
- [ ] `npm -w functions/default run build` が通ること
- [ ] Security Rules のデプロイが成功すること
- [ ] インデックスのデプロイが成功すること


## Phase 2: バックエンド Callable Functions + createEventMembers

**目的**: カート追加・注文確定・Stripe 決済の Functions を新 API に書き替え、`confirmOrder` / `stripeWebhook` と整合するよう `Event.members` 自動更新トリガー（`createEventMembers`）を default に載せる

**PR**: Phase 3 と合わせて 1 PR（同時デプロイが必要なため）

**Phase 2 と Phase 3 の並行作業**: 担当を分けて進めてよい。その場合は **Callable の export 名・リクエスト型を先に固定**し、`base/src/apis/order.ts` の `httpsCallable` の第2引数と 1:1 で一致させる。フロントはエミュレータまたは dev に同じブランチを向けて結合検証する。

**仕様書**: [06](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) のデータ操作・Stripe Functions 変更、[07](./07_EventMemberOrderに伴う既存機能の修正.md) のセクション 8.5（`createEventMembers` の legacy → default 移行）

### タスク

- [ ] addToCart Function の実装
  - [ ] member ドキュメントの upsert（初回のみ作成）
  - [ ] menus[].count 分の order ドキュメントを新規作成（1 order = 1 メニュー。`menu_id` / `menu_name` / `menu_price` をトップレベルに配置）
  - [ ] トランザクション不要（ドキュメント新規作成のみで読み取り競合なし）

- [ ] removeFromCart Function の実装
  - [ ] 指定 order_id の order ドキュメントを直接削除（1 order = 1 メニューなので削除 = 1品削除）
  - [ ] トランザクション不要（単一ドキュメントの削除のみ）

- [ ] confirmOrder Function の実装
  - [ ] order_ids で指定された全 order の status を ordered に一括更新
  - [ ] community.addMember を実行
  - [ ] バリデーション: 全 order_ids が存在し、全て in_cart、全て認証ユーザーのもの
  - [ ] ※ Event.members 配列の更新は Firestore トリガー（`createEventMembers`）が自動実行するため不要

- [ ] createStripeCheckoutSession の改修
  - [ ] リクエストを order_ids 配列に変更
  - [ ] getOrdersByIds で複数 order ドキュメントを一括取得
  - [ ] 各 order の menu_id / menu_name / menu_price を menu_id ごとに groupBy して line_items を構築
  - [ ] imageUrl をイベントの menus サブコレクション（メニューマスタ）から取得
  - [ ] metadata に orderIds をカンマ区切りで格納
  - [ ] metadata から communityAccount を削除
  - [ ] community_account をイベントデータから取得
  - [ ] バリデーション: 全 order_ids が存在し、全て in_cart、全て認証ユーザーのもの

- [ ] stripeWebhook の改修
  - [ ] metadata から orderIds（カンマ区切り）を取得し分割
  - [ ] getOrdersByIds で複数 order ドキュメントを一括取得
  - [ ] 全 order の status を ordered に一括更新、ordered_at を設定
  - [ ] stripes ドキュメントを新規作成（order_ids 配列, payment_intent, pay_amount, menus）
  - [ ] 各 order に stripe_id を設定
  - [ ] community.addMember を実行
  - [ ] 上記をトランザクション内で実行
  - [ ] ※ Event.members 配列の更新は Firestore トリガー（`createEventMembers`）が自動実行するため不要

- [ ] `createEventMembers` の legacy → default 移行（`Event.members` 配列の自動更新）
  - [ ] `functions/default/src/eventMembers.ts` を新規作成（v2 `onDocumentWritten` + TypeScript）
  - [ ] document パスを `communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}` に設定
  - [ ] 内部の注文走査を `collectionGroup('member_orders')` + `where('event_id', '==', eventId)` で実装
  - [ ] トランザクションなしの通常 read + update で実装（`collectionGroup` がトランザクション内で使用できないため）
  - [ ] `functions/legacy/src/event-members.js` を廃止・削除（default のデプロイと同時に削除。二重発火を防ぐため）
  - [ ] `confirmOrder` / `stripeWebhook` / `cancelOrders` では `Event.members` 配列を直接更新せず、order ドキュメントへの書き込みをトリガーに `createEventMembers` が自動更新

- [ ] 旧 Callable Functions（addOrder / updateMenuCountInCart / deleteMenuInCart）を削除
  - [ ] updateOrderStatus は Phase 7 で cancelOrders に置き換えるまで残す
  - [ ] `functions/default/src/index.ts` の export 名が `base` 側 `httpsCallable` の関数名と一致していることを確認する

### 検証

- [ ] `npm -w functions/default run build` が通ること
- [ ] ローカルエミュレータで addToCart → removeFromCart → addToCart の一連フローが動くこと
- [ ] ローカルエミュレータで confirmOrder（請求書払い）が動くこと
- [ ] dev 環境で confirmOrder または Stripe Webhook 完了後に `Event.members` が `createEventMembers` により更新されること（legacy トリガー削除後も参加者一覧が正しいこと）


## Phase 3: フロント（カート画面）

**目的**: Phase 2 の新 API を呼ぶフロント側を更新

**PR**: Phase 2 と合わせて 1 PR（同時デプロイが必要なため）

**マイページとの境界**: `user/src/pages/u/[userId].vue` は Phase 7 まで `eventStore.updateOrderStatus` でキャンセルする。**Phase 3 では `updateOrderStatus` を eventStore から削除しない**。カートの請求書確定・当日払い確定のみ `confirmOrder` に切り替える。

**仕様書**: [06](./06_EventMemberOrderに伴うカート・注文・決済の実装.md) のカート画面の実装・eventStore ラッパー

### タスク

- [ ] API ラッパーの更新
  - [ ] `base/src/apis/order.ts`: `addToCart` / `removeFromCart` / `confirmOrder` を追加し、`httpsCallable` の第2引数を Phase 2 でデプロイする関数名と一致させる
  - [ ] `addOrder` / `updateMenuCountInCart` / `deleteMenuInCart` を削除または未使用化
  - [ ] `updateOrderStatus` はマイページ用に **`httpsCallable(..., 'updateOrderStatus')` のまま残す**（Phase 7 で `cancelOrders` へ移行）
  - [ ] `base/src/apis/stripe.ts`: `createStripeCheckoutSession` の引数型を common の order_ids ベースに合わせる

- [ ] eventStore ラッパー関数の更新
  - [ ] `base/src/stores/event.ts`: `addToCart` / `removeFromCart` / `confirmOrder` を公開。`updateMenuCountInCart` は廃止
  - [ ] **`updateOrderStatus` は引き続き公開**し、`userId.vue` のキャンセルが動くようにする
  - [ ] **`cancelOrders` は Phase 3 では eventStore に載せない**（カートフロー不要。マイページは当面 `stripeRefunds` を `apis` 直叩きのまま。Phase 7 で `cancelOrders` に統一）
  - [ ] store の return オブジェクトを上記に合わせて更新

- [ ] EventCartDialog.vue の更新
  - [ ] `eventStore.addToCart` に変更
  - [ ] リクエストから `imageUrl` を削除
  - [ ] `common` の `AddToCartRequest` に合わせ、`menus` の `count` を維持しフィールド名を型どおりに揃える（表示用に送る名称・価格はサーバがマスタで上書きする前提だが、クライアントは型と矛盾させない）

- [ ] cart.vue の全面改修
  - [ ] 数量操作: +ボタンは addToCart（count: 1 で新 order doc 作成）、-ボタンは removeFromCart（order_id で doc 削除）
  - [ ] 削除: removeFromCart（order_id で直接削除）
  - [ ] 注文確定: confirmOrder（order_ids 配列を送信）
  - [ ] Stripe 決済: createStripeCheckoutSession（order_ids 配列を送信）
  - [ ] テンプレート: orders を menu_id で groupBy して表示（order_ids を保持し -ボタン時に末尾 ID を指定）
  - [ ] community_account: order から → cartItem.event から取得に変更

- [ ] currentUser.ts のカート購読更新
  - [ ] `collectionGroup('member_orders')` の converter を新スキーマ（1 order = 1 メニュー）に変更

- [ ] 型・テンプレート
  - [ ] `cart.vue` の `EventOrder` / `OrderMenuType` / `order.menus` 前提をやめ、`EventMemberOrder` と groupBy 表示に合わせて import と computed を整理する

- [ ] 任意: Callable エラー UX
  - [ ] 定員超過・注文期限・`user_advance` での `confirmOrder` 拒否など、サーバの `failed-precondition` 等をトーストやダイアログに表示する

### 検証

- [ ] `npm -w base run build:types` が通ること
- [ ] `npm -w base run lint` が通ること
- [ ] `npm -w user run build` が通ること
- [ ] dev 環境でイベントページからカート追加ができること
- [ ] dev 環境でカート画面の +/- ボタンが動くこと
- [ ] dev 環境で請求書払いの注文確定ができること
- [ ] dev 環境で Stripe 決済（Checkout → Webhook）の一連フローが通ること
- [ ] dev 環境でカート画面のメニュー表示・合計金額が正しいこと


## Phase 4: 既存機能の修正（フロント表示・購読）

**目的**: 新パスでのデータ読み取り・表示に対応（マイページの注文一覧・領収書は Phase 6）

**PR**: 2-3 PR（表示系 / 管理画面系 / 請求書系で分割可能）

**仕様書**: [07](./07_EventMemberOrderに伴う既存機能の修正.md) のセクション 1-6, 12-13

### タスク

- [ ] **Functions `ShokujiiEvent`（`functions/default/src/stores/event.ts`）の委譲（読み取り・保存の新パス化）**
  - [ ] `getOrders` / `getOrder` / `saveOrder` / `hasOrderedOrders` を `stores/memberOrder.ts` へ委譲
  - [ ] `getOrder` / `saveOrder` に `userId` 引数を追加し、呼び出し元を順次修正

- [ ] イベントページの表示
  - [ ] `base/src/stores/event.ts` の subscribeOrders を `collectionGroup('member_orders')` + where event_id に変更
  - [ ] orderConverter を新スキーマ（EventMemberOrder）に変更（event_id をドキュメントフィールドから取得）
  - [ ] BokudeliEventMember の型を新スキーマに変更（`orders: EventMemberOrder[]`）
  - [ ] `base/src/components/EventMemberList.vue` の表示ロジック変更（orders を menu_id で groupBy）

- [ ] 請求書
  - [ ] `functions/default/src/eventBillInvoice.ts` の getOrders パス変更。orders を menu_id で groupBy して集計

- [ ] 集計ユーティリティ
  - [ ] `base/src/utils/orders.ts`: ordersCount → `status !== 'canceled'` の order ドキュメント数。ordersTotalPrice → `order.menu_price` の合計。getSubtotalsOfOrders → orders を menu_id で groupBy
  - [ ] `common/src/utils/invoice.ts`: calculateOrdersTotal → orders の menu_price 合計。aggregateOrderMenus → orders を menu_id で groupBy

- [ ] 管理者画面
  - [ ] `user/src/components/manage/event/member.vue` の型変更（EventMemberOrder[]）・orders を user_id + menu_id で groupBy・CSV 出力修正
  - [ ] `user/src/components/manage/event/overview.vue` の型変更

- [ ] ADMIN 画面
  - [ ] `admin/src/pages/order/[eventId].vue` の flatMap → orders 配列をそのまま表示（1 order = 1 メニューなので展開不要）。表示上は menu_id で groupBy
  - [ ] `admin/src/pages/order/index.vue` の型変更（ユーティリティ側修正で対応）

- [ ] メンバー一覧
  - [ ] `base/src/components/pages/c/[communityId]/e/[eventId]/members.vue` のソートロジック修正。orders を menu_id で groupBy してメニュー表示
  - [ ] `base/src/composable/loadEventMembers.ts` / `countEventMembers.ts` を廃止

### 検証

- [ ] `npm -w user run build` / `npm -w admin run build` が通ること
- [ ] dev 環境でイベントページの参加者一覧が正しく表示されること
- [ ] dev 環境で管理者画面の注文一覧・CSV 出力が正しいこと
- [ ] dev 環境で ADMIN 画面の集計が正しいこと


## Phase 5: 既存機能の修正（Functions）

**目的**: メール送信 Functions・Firestore トリガー・ユーティリティを新パスに対応

**PR**: 1-2 PR

**仕様書**: [07](./07_EventMemberOrderに伴う既存機能の修正.md) のセクション 7-11（セクション 8.5 `createEventMembers` の実装は Phase 2）

### タスク

- [ ] **Functions `ShokujiiEvent`（`functions/default/src/stores/event.ts`）**
  - [ ] `getOrdersByIds` を新規追加し `memberOrder` へ委譲（必要なら `userId` 引数を追加）
  - [ ] `getOrdersByIds` の呼び出し元の修正・テスト

- [ ] Firestore トリガーの更新
  - [ ] `functions/default/src/orderCompletionMail.ts` の document パスを新パスに変更
  - [ ] eventRef の取得を parent.parent.parent.parent に変更
  - [ ] メールテンプレート用のメニュー情報: order.menus 配列が存在しないため、当該 order の menu_name / menu_price を直接使用、または同一ユーザー・同一イベントの全 orders を取得して menu_id で groupBy

- [ ] メール送信 Functions の更新
  - [ ] `functions/default/src/eventStatusChangeMail.ts`: orders を menu_id で groupBy して集計（menus 配列の menu.count ループは不要）
  - [ ] `functions/default/src/orderDeadlineMail.ts` のパス変更（store 側修正で対応）
  - [ ] `functions/default/src/orderRemindMail.ts`: orders を menu_id で groupBy して集計
  - [ ] `functions/default/src/inCartNotification.ts` を **`getInCartMemberOrdersByUpdatedTime`** に切り替え（パス・converter は `memberOrder` 側で完結させる）
  - [ ] `functions/default/src/remindUnorderedMail.ts` のパス変更（store 側修正で対応）
  - [ ] `functions/default/src/eventInformationMail.ts` のパス変更（store 側修正で対応）

- [ ] レターの更新
  - [ ] `functions/default/src/letter.ts` の getParticipantIds / getEventMemberIds を members サブコレクションベースに変更

- [ ] ユーティリティの更新
  - [ ] `functions/default/src/utils/order.ts`: 1 order = 1 メニューなので menu.count ループ不要。orders をそのまま1行1品で使用、または menu_id で groupBy
  - [ ] `functions/default/src/utils/mail.ts` の型変更

- [ ] API ラッパーの更新
  - [ ] `base/src/apis/order.ts` の旧 API 型定義を削除
  - [ ] `common/src/apis/order.ts` の旧型定義を削除
  - [ ] `common/src/apis/stripe.ts` の旧型定義を削除（CancelOrdersRequest / CancelOrdersResponse に統一）

### 検証

- [ ] `npm -w functions/default run build` が通ること
- [ ] dev 環境で注文完了メールが正しく送信されること
- [ ] dev 環境で注文期限メールが正しく送信されること
- [ ] dev 環境でレター送信対象が正しいこと


## Phase 6: マイページの注文一覧・領収書

**目的**: マイページをイベント単位表示にし、領収書を stripe_id 単位で発行する（仕様書 [08](./08_EventMemberOrderに伴う注文一覧と領収書.md)）

**PR**: 1 PR（フロントと `eventReceipt` をまとめる場合）または分割可

**仕様書**: [08](./08_EventMemberOrderに伴う注文一覧と領収書.md)

### タスク

- [ ] ページネーションの hasMore 方式への変更
  - [ ] `base/src/stores/orderList.ts`: `totalCount` を廃止し `hasMore` フラグに変更。`getCountFromServer` の呼び出しを削除。取得件数 < pageSize で `hasMore = false` とする
  - [ ] `base/src/components/IncrementalLoader.vue`: `hasMore` props を追加（optional）。`hasMore` が渡された場合はそちらで判定し、渡されていない場合は従来通り `totalCount > loadedCount` で判定する（後方互換。他のストアの呼び出し元を変更不要にするため）
  - [ ] `[userId].vue` の `IncrementalLoader` 呼び出しを新 props（`:has-more`）に変更

- [ ] マイページの注文一覧（※ Phase 7 で `UserEventCard.vue` にキャンセルモーダルを組み込み、`cancelOrders` に統合する前提）
  - [ ] `user/src/pages/u/[userId].vue` で orders を event_id で groupBy してイベント単位のカード表示に変更。`downloadReceipt` の引数を `(eventId, stripeId)` に変更（キャンセル処理の `cancelOrders` 化は Phase 7）
  - [ ] `base/src/components/UserEventCard.vue` の props 型変更（orders: EventMemberOrder[] を受け取る）。orders を menu_id で groupBy して表示。totalPrice は orders の menu_price 合計。領収書ボタンを stripe_id 単位で表示（emit に `eventId` と `stripeId` を渡す）。領収書ボタンの表示条件を `event_payment === 'user_advance'` に変更（`user_on_day` と `community_bill` を除外）。全キャンセル時は領収書ボタンを表示しない。キャンセルボタンの条件を有効 order の有無で判定

- [ ] 領収書
  - [ ] `common/src/apis/eventReceipt.ts` の `EventReceiptRequest` を `orderId` → `stripeId` に変更
  - [ ] `user/src/router/utils.ts` の `getReceiptPath` の引数を `orderId` → `stripeId` に変更
  - [ ] `user/src/pages/receipt.vue` のクエリパラメータを `orderId` → `stripeId` に変更
  - [ ] `functions/default/src/eventReceipt.ts`: 領収書は stripe_id 単位で発行に変更。stripes ドキュメントをデータソースに（pay_amount を金額、menus からメニュー一覧を取得。receipt_number を stripes に保存）
  - [ ] totalPrice getter → ユーティリティ関数（calcTotalPrice）に変更。ExTaxPrice / TaxPrice も同様

### 検証

- [ ] `npm -w user run build` / `npm -w base run build:types` / `npm -w functions/default run build` が通ること
- [ ] dev 環境でマイページの注文一覧がイベント単位で正しく表示されること
- [ ] dev 環境でページネーション（もっと読み込み）が正しく動作すること
- [ ] dev 環境で領収書ボタンが `user_advance` のときのみ表示されること
- [ ] dev 環境で全キャンセル済みのイベントでは領収書ボタンが表示されないこと
- [ ] dev 環境で領収書が stripe_id 単位で正しくダウンロードできること


## Phase 7: キャンセル機能

**目的**: order 単位の一部キャンセル + Stripe 一部返金を実装

**PR**: 1 PR

**仕様書**: [09](./09_EventMemberOrderに伴うキャンセル機能.md)  
**運用 Runbook**: [12](./12_cancelOrders_返金失敗時_Runbook.md)

### タスク

- [ ] cancelOrders Function の実装
  - [ ] 認証チェック（request.auth.uid）
  - [ ] `getOrdersByIds`（`functions/default/src/stores/memberOrder.ts`）で対象 order を一括取得
  - [ ] バリデーション（パターン A・厳格）: `order_ids` が空でないこと、**重複 ID が無いこと**（重複時は `invalid-argument`）。取得件数がユニーク件数と一致すること（別イベント・別ユーザー・存在しない ID はここでエラー）。**全て `status === 'ordered'`**（1件でも `canceled` / `in_cart` 等なら `failed-precondition` 等。スキップしない）。`community_id` / `event_id` が各 order と一致すること
  - [ ] `user_advance` のとき、対象 orders に **`stripe_id` 欠落が無い**こと（あれば `failed-precondition`）
  - [ ] **検算**: 返金前に、対象 `menu_price` 合計と `stripes.pay_amount`・既存 `refunds` 合計との整合（仕様 [09](./09_EventMemberOrderに伴うキャンセル機能.md) ステップ4）
  - [ ] 注文期限チェック（event.event_deadline_datetime > 現在時刻）
  - [ ] 対象 order の status を canceled に変更、canceled_at を設定
  - [ ] event_payment に基づき Stripe 返金 or 返金なしを判定
  - [ ] 対象 orders を stripe_id でグルーピングし、stripe ごとに **ベストエフォートで順次処理**:
    - stripes ドキュメントを取得
    - キャンセル金額を算出（対象 orders の menu_price 合計）
    - 返金累計 + 今回の返金額 ≦ pay_amount のバリデーション
    - 決済から180日以内のバリデーション
    - stripe.refunds.create({ payment_intent, amount, idempotencyKey })
    - 成功時: stripes の refunds 配列に追記、レスポンス `refunds` に追加
    - 失敗時: `refund_errors` に追記し **次の stripe_id を続行**（可能な限り続行）
  - [ ] レスポンス: `CancelOrdersResponse`（`refund_errors`・**`user_message`** を返金失敗時にセット。仕様どおり [common](../../common/src/apis/stripe.ts) 型と整合）
  - [ ] Stripe 返金のべき等性: `idempotencyKey` を `refund_{stripe_id}_{order_ids}` から決定論的に生成（同一 stripe_id 内の order_ids は昇順ソート）。厳格バリデーションにより「処理完了後の同一リクエスト再送」はエラーになり得るため、フロントで二重送信防止すること（[09](./09_EventMemberOrderに伴うキャンセル機能.md) の「べき等性とバリデーション（パターン A）」参照）
  - [ ] ※ Event.members 配列の更新は Firestore トリガー（`createEventMembers`）が自動実行するため不要

- [ ] 旧 Callable Functions（updateOrderStatus / stripeRefunds）を削除（`functions/default/src/index.ts` の export 名含め Callable 名を `cancelOrders` に統一）

- [ ] キャンセルモーダル UI の実装（※ Phase 6 で `UserEventCard.vue` の props が `orders: EventMemberOrder[]` に変更済みであることが前提）
  - [ ] orders を menu_id で groupBy して表示（order_ids を保持）
  - [ ] 各グループ内を **`ordered_at` 昇順**（無ければ `carted_at` → `created_at`）でソートし、個数選択で **末尾 N 件**をキャンセル対象として選定（[09](./09_EventMemberOrderに伴うキャンセル機能.md)）
  - [ ] 全キャンセルのショートカットボタン
  - [ ] キャンセル済み order のグレーアウト表示
  - [ ] 有効な order が 0 の場合はキャンセルボタン非表示
  - [ ] **ローディング表示**、**二重送信防止**（送信中は実行ボタン無効化）
  - [ ] レスポンスの **`user_message`** または **`refund_errors`** があるとき、仕様のユーザー向け文言をトースト等で表示（再試行は原則不要である旨を含めてよい）

- [ ] マイページのキャンセル処理（※ Phase 6 で `[userId].vue` のイベント単位表示への変更済みであることが前提）
  - [ ] `user/src/pages/u/[userId].vue` のキャンセル処理を cancelOrders API 1本に変更。支払方式別の分岐ロジックを削除
  - [ ] `base/src/components/UserEventCard.vue` にキャンセルモーダルを組み込み

- [ ] API ラッパー・型
  - [ ] `base/src/apis/stripe.ts` に `cancelOrders` ラッパーを追加（戻り値型は `CancelOrdersResponse`）
  - [ ] `common/src/apis/stripe.ts` の `CancelOrdersResponse`（`refund_errors`・`user_message`）が実装と一致していること

- [ ] 運用・監視（推奨）
  - [ ] [12_cancelOrders_返金失敗時_Runbook.md](./12_cancelOrders_返金失敗時_Runbook.md) を関係者で共有
  - [ ] Cloud Logging で `cancelOrders` の Stripe エラーまたは `refund_errors` 発生をアラート可能にする（閾値は運用で決定）

### 検証

- [ ] dev 環境で一部キャンセル（order_ids で一部の order を指定）が動くこと
- [ ] dev 環境で複数メニューの一括キャンセル（複数 order_ids）が動くこと
- [ ] dev 環境で複数 stripe_id にまたがるキャンセルが正しく動くこと
- [ ] dev 環境で **複数 stripe_id のうち一部だけ Stripe が失敗**した場合、成功分が `refunds` に入り失敗分が `refund_errors` に入り、可能な限り続行されること
- [ ] dev 環境で全キャンセル → Event.members 配列からの除外が動くこと
- [ ] dev 環境で Stripe 一部返金が正しい金額で実行されること
- [ ] dev 環境でキャンセル後の totalPrice 表示が正しいこと
- [ ] dev 環境で `cancelOrders` の厳格バリデーション: 空の `order_ids`・**重複 ID**・既に `canceled` の order_id 混在・`in_cart` がエラーになること
- [ ] dev 環境で `user_advance` かつ `stripe_id` 欠落 order が混ざると `failed-precondition` になること（またはデータ上不発）
- [ ] dev 環境で領収書ボタン: `user_advance` かつ `ordered` が1件以上残るときのみ表示、全キャンセル後は非表示であること（[08](./08_EventMemberOrderに伴う注文一覧と領収書.md) / [09](./09_EventMemberOrderに伴うキャンセル機能.md) と整合）
- [ ] dev 環境でキャンセルモーダル内の選定が **`ordered_at` 昇順の末尾 N 件**と一致すること
- [ ] dev 環境で DB 更新後に Stripe のみ失敗するケース（モック等）で **`user_message` が表示**されること


## Phase 8: データ移行

**目的**: 既存の旧 orders データを新パスにコピーし、旧データをクリーンアップ

**PR**: 1 PR（移行スクリプト）+ デプロイ作業

**仕様書**: [10](./10_EventMemberOrderに伴うデータ移行.md)

### タスク

- [ ] 移行スクリプトの実装（bokudeli-event-batch）
  - [ ] `collectionGroup('orders')` で旧 `events/.../orders` のみ取得（depth 6 で限定。新設の `member_orders` は別名のためこのクエリに含まれない）
  - [ ] in_cart ステータスの注文は除外
  - [ ] members / member_orders / stripes ドキュメントへの変換・書き込み
  - [ ] 旧 order の menus を 1:N 展開（count 分の order ドキュメントを作成。menu_id / menu_name / menu_price をトップレベルに配置）
  - [ ] 新 order_id は自動生成（旧 order_id は使わない。1:N のため）
  - [ ] stripe_id を payment_intent ありの全展開 doc に設定
  - [ ] stripes に order_ids 配列（展開で生成された全 order ID）を格納
  - [x] stripes のフィールド名は menus で確定
  - [ ] refund_id の refunds 配列への変換（order_ids に展開された全 ID を含む）
  - [ ] receipt_number は stripes ドキュメントに移行
  - [ ] stripes.created_at の設定（ordered_at or created_at）
  - [ ] バッチ処理（450件ごとに自動分割）+ エラーハンドリング
  - [ ] べき等性: stripes / members は set による upsert、member_orders はグループ単位で既存を削除してから再作成

- [ ] 移行の実行（メンテナンスウィンドウ内）
  - ※ 以下の Phase 0〜6 は **メンテナンス作業手順のステップ番号**であり、本ドキュメント上の「Phase 1〜8（開発フェーズ）」とは別物である。
  - [ ] Phase 0: アプリからの書き込みを停止
  - [ ] Phase 1: 新 Security Rules / インデックスのデプロイ（開発 Phase 1 で済み）
  - [ ] Phase 2: 新 Functions のデプロイ（開発 Phase 2-7 で済み）
  - [ ] Phase 3: 新フロントのデプロイ（開発 Phase 2-7 で済み）
  - [ ] Phase 4: データ移行スクリプトの実行
  - [ ] Phase 5: 移行検証スクリプトの実行
  - [ ] Phase 6: アプリからの書き込みを再開

- [ ] 移行後のクリーンアップ（別 PR）
  - [ ] 旧 orders コレクションの削除
  - [ ] 旧 EventOrder スキーマの廃止
  - [ ] 旧 API 型定義の廃止（開発 Phase 5 で済んでいなければ）
  - [ ] 不要な旧インデックスを削除（community_account 関連 + partner_id + order_date）

### 検証

- [ ] ステージング環境でデータ移行スクリプトが正常終了すること
- [ ] 旧 orders の menus count 合計 = 新 member_orders の件数（1:N 展開のため。旧 orders 件数とは一致しない）
- [ ] 各 stripes の order_ids.length = 対応する旧 order の menus count 合計
- [ ] 移行後にフロント表示・メール送信が正常動作すること
- [ ] ロールバック手順が機能すること（テスト実行）


## スケジュール目安

| Phase | 作業量目安 | 備考 |
|:--|:--|:--|
| Phase 1 | 2-3 日 | スキーマ設計が固まっていれば早い |
| Phase 2+3 | 3-5 日 | 最も大きく、リスクも高い。`createEventMembers` を含む。丁寧にレビュー |
| Phase 4 | 2-3 日 | マイページ・領収書除く表示・購読 |
| Phase 5 | 2-3 日 | Phase 4 と並行可能 |
| Phase 6 | 1-2 日 | マイページ注文一覧・領収書（[08](./08_EventMemberOrderに伴う注文一覧と領収書.md)） |
| Phase 7 | 2-3 日 | キャンセル。`createEventMembers` は Phase 2 でデプロイ済みであること |
| Phase 8 | 2-3 日 | 移行スクリプト + 実行 |
| **合計** | **約 2-3 週間** | |

## 注意事項

- Phase 2 と Phase 3 は同時デプロイが必要（旧 API を削除するため）。`createEventMembers` の default 化と legacy 削除もこのタイミングで行う。1 つの PR にまとめる
- Phase 2 と Phase 3 のタスクは**担当を分けて並行**してよい。その場合は Callable の export 名と `base` の `httpsCallable` 第2引数を先に合わせ、結合検証でデプロイ前に齟齬を潰す
- Phase 4 と Phase 5 は並行して進められる
- Phase 6 は Phase 4 のイベント表示・集計ユーティリティ等が揃っていると実装しやすい（厳密な直列は不要な場合もある）
- Phase 7（キャンセル）は Phase 2-3 以降であれば実装着手可能。本番で `cancelOrders` を有効にする前に Phase 2 でデプロイした `createEventMembers` が動作していること
- Phase 8 は開発 Phase 1〜7 が完了してから実施する
- 各フェーズの lint / format チェックは PR 作成前に必ず実施する
