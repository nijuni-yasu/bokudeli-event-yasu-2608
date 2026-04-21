# EventMemberOrder 対応：SlackBot（order-notification）

## 概要

`EventMemberOrder` へのデータ構造変更に伴い、`functions/shokujii-slackbot/order-notification.js` の Firestore トリガーパスおよび通知ロジックを変更する。

## 変更対象

| ファイル | 変更 |
|:--|:--|
| `functions/shokujii-slackbot/order-notification.js` | トリガーパス変更・通知ロジック変更 |
| `functions/shokujii-slackbot/event-notification.js` | 変更なし |
| `functions/shokujii-slackbot/app.js` | 変更なし |
| `functions/shokujii-slackbot/utils/bot-utils.js` | 変更なし |

## 変更内容

### 1. Firestore トリガーパス

```
旧: communities/{communityId}/events/{eventId}/orders/{orderId}
新: communities/{communityId}/events/{eventId}/members/{memberId}/member_orders/{orderId}
```

### 2. `eventRef` の参照方法

パス階層が 1 段増えるため、親コレクションの参照を変更する。

```
旧: after.ref.parent.parent
    （member_orders/{orderId} → orders → events/{eventId}）

新: after.ref.parent.parent.parent.parent
    （member_orders/{orderId} → member_orders → members/{memberId} → members → events/{eventId}）
```

`communityRef` の取得（`eventRef.parent.parent`）は変更なし。

### 3. メニュー情報の取得

旧設計の `menus` 配列から、`member_order` ドキュメントのトップレベルフィールドに変更する。

```
旧: orderSnapshot.get('menus').at(-1)['name']
新: orderSnapshot.get('menu_name')
    orderSnapshot.get('menu_price')   // 将来の表示拡張用（今回は不使用）
```

### 4. 通知の集約ロジック

#### 背景

新設計では 1 `member_order` = 1 メニューのため、`confirmOrder` / `stripeWebhook` で複数メニューを同時に注文すると、複数のドキュメントが一斉に `ordered` になり、トリガーが品数分だけ並列に発火する。全て通知すると Slack がスパムになるため、集約して 1 通知にまとめる。

#### 集約方針

スキーマ追加なしで実現するため、既存の `updated_at` フィールドと `order_id`（ドキュメントID）をタイブレーカーとして使用する。

**ロジック:**

1. 発火条件：`before.status !== 'ordered' && after.status === 'ordered'`（`in_cart → ordered` の変化のみ）
2. `members/{memberId}/member_orders` を以下の条件でクエリ
   - `status == 'ordered'`
   - `updated_at > トリガー対象ドキュメントの updated_at から 5 秒前`（`updated_at` が無い場合は実装上 `Date.now()` にフォールバック）
3. 取得結果を `order_id`（ドキュメントID）昇順でソート（JS 側: `docs.sort((a, b) => a.id.localeCompare(b.id))`）
4. **先頭の `order_id` が自分の `orderId` と一致する場合のみ** → 全件を集約して通知送信
5. 一致しない場合 → スキップ（最小 `order_id` のトリガーが担当）

**ポイント:** 基準を `Date.now()` にすると Cloud Functions の実行遅延が 5 秒を超えたときに同一バッチの `updated_at` がクエリから外れ、通知が欠落しうる。書き込み時刻であるトリガー対象の `updated_at` を基準にすると避けられる。`confirmOrder` / `stripeWebhook` のバッチ書き込みでは全ドキュメントがほぼ同一の `updated_at` を持つため、同一注文内はこの窓に収まる。`order_id` による決定論的なタイブレーカーにより、常に1つのトリガーだけが通知を担当する。

#### フローチャート

```
member_order が in_cart → ordered に変化
       ↓
members/{memberId}/member_orders を
status=ordered AND updated_at > トリガー対象の updated_at - 5秒 でクエリ
       ↓
結果を order_id ASC でソート（JS 側）
       ↓
  ┌─── 先頭の order_id == 自分の orderId ?
  │
  YES → 全件を menu_name で集計し count を付与（1件は名前のみ、2件以上は 名前×count）
        → 1行の Slack メッセージを送信
  │
  NO  → スキップ（最小 order_id のトリガーが担当）
```

#### ケース別の動作

| ケース | 動作 |
|:--|:--|
| 1品だけ注文 | クエリ結果が自分だけ → 送信 |
| 3品同時注文（バッチ） | 最小 order_id のトリガーのみ送信。全3品を集約 |
| 5秒以内に2回 confirmOrder | 2回目の注文が1回目のウィンドウに含まれる可能性あり（実運用上は稀） |

### 5. 通知メッセージフォーマット

#### フォーマット

1行。ユーザー名・イベント名は Slack のリンク記法とする。

```
<{userUrl}|{userName}> さんが、<{eventUrl}|{eventName}> で、{メニュー表現} を注文したよ！
```

- **メニュー表現**: `menu_name` ごとに count を集計する。並びは **order_id 昇順のドキュメント走査で初出の順**。
  - count が **1** のとき: メニュー名のみ（×1 は付けない）
  - count が **2 以上** のとき: `メニュー名×count`（×は半角乗算記号に相当する 1 文字でよい）
- 複数メニュー種別があるときは **` と `**（前後スペース付き）で連結する。

例: 唐揚げ×2・牛丼×1 のとき  
`… で、唐揚げ×2 と 牛丼 を注文したよ！`

#### 例

```
<https://.../u/userId|田中さん> さんが、<https://.../c/.../e/eventId|4月食事会> で、唐揚げ×2 と 牛丼 を注文したよ！
```

単品のみの例:

```
<https://.../u/userId|田中さん> さんが、<https://.../c/.../e/eventId|4月食事会> で、バターチキンカレー を注文したよ！
```

#### 集計方法

クエリ取得結果を `order_id` 昇順で走査し、`menu_name` ごとの count と **初出順の名前リスト**を得る。各名前について上記ルールで片語を作り、` と ` で連結する。

```js
const menuCounts = {}
const menuNameOrder = []
for (const doc of results) {
  const name = doc.get('menu_name')
  if (name == null || name === '') continue
  if (menuCounts[name] === undefined) {
    menuCounts[name] = 0
    menuNameOrder.push(name)
  }
  menuCounts[name] += 1
}
const menuPhrase = menuNameOrder
  .map((name) => (menuCounts[name] === 1 ? name : `${name}×${menuCounts[name]}`))
  .join(' と ')
const message = `<${userUrl}|${userName}> さんが、<${eventUrl}|${eventName}> で、${menuPhrase} を注文したよ！`
```

## スキーマ変更

なし。既存フィールド（`updated_at`, `menu_name`, `status`）を使用する。

## インデックス

`members/{memberId}/member_orders` コレクション内での `status + updated_at` クエリは、`05_EventOrder→EventMemberOrder.md` で定義済みの `COLLECTION_GROUP: member_orders` の `status + updated_at` インデックスがカバーする。
