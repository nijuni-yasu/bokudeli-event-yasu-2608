# EventMemberOrder の複数注文時の発火について

## 概要

`EventMemberOrder` は **1 ドキュメント = 1 メニュー** の設計のため、ユーザーが複数メニューを 1 回の注文確定で購入すると、`member_orders` の書き込みが N 回発生する。
現状は `member_orders` の `onDocumentWritten`（`createEventMembers`）が N 回発火しており、また「注文確定時にやること」が `confirmOrder` / `stripeWebhook` / `onDocumentWritten` の 3 経路に分散しているため、追加機能（友だち追加など）のたびに複数箇所への変更が必要になっている。

本ドキュメントでは現状の発火構造を整理し、**1 PR で `createEventMembers`（`onDocumentWritten`）を廃止し、注文確定時の Side Effects を 1 つの内部関数に集約する**リファクタリングの方針と手順をまとめる。

---

## 1. 注文確定時に発火する Side Effects 一覧

`functions/default` の現行コードを基準に整理する。

| # | Side Effect | 実装箇所 | 重複防止の仕組み |
| :-- | :-- | :-- | :-- |
| 1 | Community メンバー追加 | `stores/community.ts` `ShokujiiCommunity.addMember` | ドキュメントが存在すれば `roles` を引き継いで `set`（冪等） |
| 2 | Event メンバー配列 (`event.members`) 更新 | `eventMembers.ts` `createEventMembers`（`onDocumentWritten`） | 全 ordered な `member_orders` を再集約（最終整合性） |
| 3 | 注文完了メール（参加者向け） | `orderCompletionMail.ts` `sendOrderCompletionMailToMember` | なし（呼ぶ度に送信） |
| 4 | 注文完了メール（主催者向け） | `orderCompletionMail.ts` `sendOrderCompletionMailToOrganizers` | なし |
| 5 | 新着イベントメール（コミュニティメンバー向け） | `orderCompletionMail.ts` `sendNewEventNotificationToMembers` | `event.sent_new_event_mail_at` フラグ＋トランザクション |
| 6 | 人気イベントメール（全ユーザー向け） | `popularEventMail.ts` `trySendPopularEventMailAfterMembersSync` | `event.sent_popular_event_mail_at` フラグ＋トランザクション |

将来的に追加が想定される Side Effects: 友だち追加 等。

---

## 2. 現状の発火経路

```
                                    ┌── (a) confirmOrder (Callable, 後払い専用)
                                    │      ↓ orders.status = 'ordered' (transaction)
                                    │      ↓ community.addMember()
                                    │      ↓ sendOrderCompletionMails()
                                    │           ├ sendOrderCompletionMailToMember
                                    │           ├ sendOrderCompletionMailToOrganizers
                                    │           └ sendNewEventNotificationToMembers
                                    │
注文確定の入口は2つ ──────────────┤
                                    │
                                    └── (b) stripeWebhook (onRequest, 先払い/割引)
                                           ↓ orders.status = 'ordered' (transaction)
                                           ↓ community.addMember()
                                           ↓ sendOrderCompletionMails()  (a と同じ)

         ↓ member_orders ドキュメント書き込みをトリガー（N 個分 N 回）

(c) createEventMembers (onDocumentWritten) ★ 1 注文確定で N 回発火
    ↓ event.members を再集約して update
    ↓ trySendPopularEventMailAfterMembersSync()
```

---

## 3. 課題

1. **2 経路の重複実装**
   - `community.addMember` と `sendOrderCompletionMails` の呼び出しが `confirmOrder` と `stripeWebhook` に二重に書かれている
   - 友だち追加など発火物が増えるたびに両方を編集する必要があり、片方への追記漏れが発生しやすい

2. **`onDocumentWritten` の N 回発火**
   - 1 ユーザーが複数メニューを注文すると `member_orders` の書き込みが N 回発生し、`createEventMembers` も N 回起動する
   - `event.members` の再集約自体は冪等だが、不要な Firestore の読み書きと、`trySendPopularEventMailAfterMembersSync` の同時並行起動による無駄な競合（フラグで弾かれるだけだが）が発生する
   - キャンセル経路（`cancelOrders`）でも同様

3. **「注文確定時にやること」が散在**
   - メール・コミュニティメンバー追加は Callable / Webhook 直呼び、`event.members` 更新と人気イベントメールは trigger 経由、と二系統に分かれており、見通しが悪い

---

## 4. 対応方針

ユーザーの指針:

- **`onDocumentWritten` を使わない**（複数注文に対して N 回発火するため）
- **Stripe 決済経路と OrderConfirm 経路を 1 つにしたい**

これに沿い、以下のリファクタリングを **1 PR** で行う。

### 方針 A: 「注文確定 Side Effects」を 1 つの内部関数に集約

`functions/default/src/orderConfirmedSideEffects.ts`（新規）に、以下のシグネチャの関数を作る。

```ts
// イメージ（未実装）
export async function applyOrderConfirmedSideEffects(params: {
  event: ShokujiiEvent
  userId: string
}): Promise<void> {
  // 1. event.members 配列を ordered で再集約（旧 createEventMembers 第1トランザクション相当）
  // 2. community.addMember()
  // 3. sendOrderCompletionMailToMember
  // 4. sendOrderCompletionMailToOrganizers
  // 5. sendNewEventNotificationToMembers
  // 6. trySendPopularEventMailAfterMembersSync
  // 7. 将来追加される副作用（友だち追加 等）はここに足す
}
```

`confirmOrder` / `stripeWebhook` の双方から、トランザクションで `orders.status = 'ordered'` を確定した直後に **1 回だけ** 呼び出す。

### 方針 B: `createEventMembers`（`onDocumentWritten`）を廃止

- `event.members` の更新を方針 A の関数内で直接行う
- `cancelOrders` 経路でも `event.members` から自分を外す処理を追加する（= 方針 C）
- `index.ts` の export からも `createEventMembers` を削除する
- N 回発火問題が消え、`trySendPopularEventMailAfterMembersSync` も 1 回だけ呼ばれるようになる

### 方針 C: `cancelOrders` 用の Side Effects 関数も切り出す

`functions/default/src/orderCanceledSideEffects.ts`（新規）に、以下を行う関数を作る。

```ts
// イメージ（未実装）
export async function applyOrderCanceledSideEffects(params: {
  event: ShokujiiEvent
  userId: string
}): Promise<void> {
  // 1. event.members 配列を ordered で再集約
  //    （ユーザーの ordered な member_orders がゼロになった場合、members から外れる）
  // 2. 将来追加される副作用（キャンセル通知メール 等）
}
```

`cancelOrders.ts` のトランザクション完了後に呼び出す。

### 方針 D: 管理者・直接書き込み経路の方針判断

`onDocumentWritten` を廃止すると、Firestore コンソールや管理者画面から直接 `status` を書き換えても何も発火しなくなる。
現状そのような運用は想定されていないため、本 PR では **直接書き込み経路をサポートしない** 方針で進める（必要になった時点で別途 Callable を用意する）。

---

## 5. 1 PR で行う実装ステップ

> 実装順は下から上に依存している。原則この順で進める。

### Step 1: `event.members` 再集約ロジックの切り出し

`createEventMembers` が持つ「全 ordered な `member_orders` を再集約して `event.members` を更新する」ロジックを、`stores/event.ts` または新設の helper（`utils/recalcEventMembers.ts` 等）に抽出する。

- 既存の `getOrders(communityId, eventId, 'ordered', transaction)`（`stores/memberOrder.ts`）と `eventData.updateMembersFieldOnly` を内部で利用
- トランザクションを引数で受け取れるシグネチャにしておく（`applyOrderConfirmedSideEffects` 内で再利用しやすくするため）

### Step 2: `applyOrderConfirmedSideEffects` の新設

`functions/default/src/orderConfirmedSideEffects.ts` を新規作成。
中身は以下を直列または並列で呼ぶ。

1. Step 1 で切り出した `event.members` 再集約
2. `community.addMember(userId)`
3. `sendOrderCompletionMails(event, userId)`
4. `trySendPopularEventMailAfterMembersSync({ communityId, eventId, triggerUserId: userId })`

### Step 3: `confirmOrder` の置き換え

`memberOrders.ts` の `confirmOrder` で、トランザクション後に行っている個別処理（`community.addMember` / `sendOrderCompletionMails` 呼び出し）を `applyOrderConfirmedSideEffects` の 1 回呼び出しに置き換える。

### Step 4: `stripeWebhook` の置き換え

`stripeWebhook.ts` で同様に置き換える。
冪等性は **既存の `getStripeByPaymentIntent` チェック**（`stripes` ドキュメントが既に存在する場合は early return）で担保されているため、関数差し替え後も Webhook 再送に対する重複送信は発生しない。

### Step 5: `applyOrderCanceledSideEffects` の新設と `cancelOrders` への組み込み

`orderCanceledSideEffects.ts` を新規作成し、`cancelOrders.ts` のトランザクション完了後（Stripe refund 処理の前後どちらかは要検討、`event.members` の整合性を優先するなら refund より前）に呼び出す。

- 内部では Step 1 で切り出した `event.members` 再集約をそのまま再利用する

### Step 6: `createEventMembers` の削除

- `functions/default/src/eventMembers.ts` を削除
- `functions/default/src/index.ts` の `createEventMembers` を export 一覧から削除
- 関連するテスト（あれば）も削除

### Step 7: デプロイ後の動作確認

- 注文確定（後払い・先払い・割引）で `event.members` が更新されること
- 注文完了メール / 新着イベントメール / 人気イベントメールが従来どおり 1 回だけ届くこと
- キャンセルで `event.members` から外れること
- Cloud Functions のログで `createEventMembers` が完全に呼ばれなくなっていること

---

## 6. 冪等性のポイント

統合後も以下の冪等性は維持されることを確認する。

| 項目 | 冪等性確保の手段 | 統合後の扱い |
| :-- | :-- | :-- |
| Stripe Webhook 再送 | `getStripeByPaymentIntent` で既存 stripes ドキュメントを検出して early return | **維持**（Side Effects 関数を呼ぶ前段でチェック） |
| 新着イベントメール再送防止 | `event.sent_new_event_mail_at` フラグをトランザクションでセット | **維持** |
| 人気イベントメール再送防止 | `event.sent_popular_event_mail_at` フラグをトランザクションでセット | **維持** |
| `confirmOrder` 二重呼び出し | 現状なし（status が `in_cart` でなければ throw） | **維持**（既存の in_cart チェックで弾かれる） |
| `community.addMember` の重複呼び出し | 既存ドキュメントに対して `set` で `roles` を引き継ぐ | **維持**（実質冪等） |
| `event.members` の更新 | 全 ordered な orders を再集約して上書き | **維持**（再実行可能） |

---

## 7. 注意点

- **失敗時の挙動**
  - `applyOrderConfirmedSideEffects` 内で 1 つでも失敗すると後続の Side Effects が実行されないリスクがある
  - 各 Side Effect は **個別に try/catch してログを出し、他の Side Effects の実行を止めない** 構造とする（現状の `confirmOrder` / `stripeWebhook` も `sendOrderCompletionMails` を try/catch している。ここに合わせる）
  - ただし、`event.members` の更新だけは後続の人気イベントメール判定に影響するため、失敗時はログを出した上で人気イベントメール判定をスキップする
- **トランザクション境界**
  - `applyOrderConfirmedSideEffects` は `confirmOrder` / `stripeWebhook` の **トランザクション外** で呼ぶ
  - 内部で `event.members` 更新用の小さなトランザクションは張る
- **`cancelOrders` の return 値への影響**
  - `applyOrderCanceledSideEffects` の失敗で全体を 5xx にしないよう、try/catch でログのみに留める
- **legacy / shokujii-slackbot 等への影響**
  - 本 PR の範囲外（`functions/default` のみを対象とする）

### 7.1 `ordered` 確定と `event.members` 同期の間のクラッシュ（許容方針・PR #1982 RC-4）

`confirmOrder` / `stripeWebhook` は、**`member_orders` を `ordered` にするトランザクション**がコミットしたあと、**別処理**として `applyOrderConfirmedSideEffects`（内部の `recalcEventMembers` はさらに独自のトランザクション）を呼ぶ。

このため、**トランザクション成功直後から Side Effects 完了前**に Cloud Functions のインスタンスが落ちるなどすると、**DB 上は `ordered` 済みだが `event.members` / `event_num_members` が古いまま**という状態が理論上あり得る。`createEventMembers`（`onDocumentWritten`）を廃止した後は、**書き込みトリガーによる自動補正もない**。

**採用方針（案 C: ドキュメントで明文化し、コードは変えない）**

- 同一トランザクションへ `event.members` 更新を取り込む、または専用のリカバリキュー／スケジュールジョブを追加する対応は、**複雑性とコスト**の観点から**行わない**。
- **通常の収束経路**: 同一イベントで **別ユーザーの注文確定**や **`cancelOrders` 後の `applyOrderCanceledSideEffects`** が走ると `recalcEventMembers` が再度実行され、`ordered` な `member_orders` から **イベント全体の `members` が再集約**されるため、多くの場合は不整合が解消される。
- **許容する取り残し**: 当該イベントで **以後いっさい注文確定・キャンセルが発生しない**場合、上記の再集約が走らず **`event.members` のずれが残り続ける**可能性がある。発生頻度は極めて低いと判断し、現時点では許容する。

---

## 8. 関連ドキュメント

- [05_EventOrder→EventMemberOrder.md](./05_EventOrder→EventMemberOrder.md): データ構造変更
- [07_EventMemberOrderに伴う既存機能の修正.md](./07_EventMemberOrderに伴う既存機能の修正.md): 「8.5. Firestore トリガー（createEventMembers）」で legacy → default 移行の経緯
- [09_EventMemberOrderに伴うキャンセル機能.md](./09_EventMemberOrderに伴うキャンセル機能.md): `cancelOrders` の仕様
- [documents/06_メール通知/メール_全ユーザー_人気イベント.md](../06_メール通知/メール_全ユーザー_人気イベント.md): 人気イベントメールの仕様
