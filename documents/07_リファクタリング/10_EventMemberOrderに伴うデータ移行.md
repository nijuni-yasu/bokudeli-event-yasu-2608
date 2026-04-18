# EventMemberOrder に伴うデータ移行

## 概要

旧 `orders` コレクション（注文情報 + Stripe 決済情報が混在）を、新しい3コレクション（`members` + `member_orders` + `stripes`）に分離・移行する。新スキーマのフィールド定義は `common/src/schemas/EventMemberOrder.ts`（EventMember / EventMemberOrder）および `common/src/schemas/EventStripe.ts` に準拠する。
**1 order ドキュメント = 1 メニュー**。旧 order の `menus` 配列を展開し、1品ごとに独立した order ドキュメントを作成する。

- 移行中はアプリからの書き込みが停止されている前提（メンテナンスウィンドウ）
- データ移行はアプリのリリース前に先にデータコピーを行う
- `in_cart` 状態の order は移行しない（メンテナンスウィンドウ中に有効期限切れとして扱う）
- 並行運用は行わず、一斉切り替えを行う

---

## 移行対象のパス

```
旧: communities/{communityId}/events/{eventId}/orders/{orderId}
    → 1ドキュメントに注文情報（menus 配列）+ stripe 決済情報が混在

新: communities/{communityId}/events/{eventId}/members/{userId}
    communities/{communityId}/events/{eventId}/members/{userId}/member_orders/{orderId}  ← 1 doc = 1 メニュー
    communities/{communityId}/events/{eventId}/stripes/{stripeId}
```

---

## フィールドマッピング

### 旧 EventOrder → 新 members

| 旧フィールド | 新フィールド | 変換ルール |
|:--|:--|:--|
| `user_id` | `user_id` | そのまま。ドキュメント ID にも使用 |
| `event_id` | `event_id` | そのまま |
| `community_id` | `community_id` | そのまま |
| `created_at` | `created_at` | 同一 user_id + event_id グループ内で最古の order の `created_at` |
| - | `updated_at` | 移行実行時のタイムスタンプ |
| - | `member_count` | 未設定（将来用） |
| - | `discount_amount` | 未設定（将来用） |
| `community_account` | *(削除)* | 新スキーマに含めない |

### 旧 EventOrder → 新 member_orders（1:N 展開）

旧 order の `menus` 配列を展開し、**1品ごとに独立した order ドキュメント**を作成する。

| 旧フィールド | 新フィールド | 変換ルール |
|:--|:--|:--|
| *(自動生成)* | `order_id` | 新規 ID を自動生成（ドキュメント ID と同一） |
| `user_id` | `user_id` | そのまま |
| `event_id` | `event_id` | そのまま |
| `community_id` | `community_id` | そのまま |
| `status` | `status` | 親 order の `status` を引き継ぐ |
| `menus[i].menu_id` | `menu_id` | 展開元の menu オブジェクトから取得 |
| `menus[i].name` | `menu_name` | 展開元の menu オブジェクトから取得 |
| `menus[i].price` | `menu_price` | 展開元の menu オブジェクトから取得 |
| `created_at` | `created_at` | そのまま |
| `updated_at` | `updated_at` | そのまま |
| `carted_at` | `carted_at` | そのまま |
| `ordered_at` | `ordered_at` | そのまま（存在する場合のみ） |
| `canceled_at` | `canceled_at` | そのまま（存在する場合のみ） |
| `payment_intent` | *(stripes へ移動)* | orders からは削除 |
| `refund_id` | *(stripes.refunds へ移動)* | orders からは削除 |
| `community_account` | *(削除)* | 新スキーマに含めない |
| *(旧 order_id)* | `stripe_id` | `payment_intent` がある場合、旧 `order_id` を設定（全展開 doc に同じ値） |
| `menus[i].imageUrl` | *(削除)* | 新スキーマに含めない（メニューマスタから参照） |
| `menus[i].count` | *(展開に使用)* | `count` 分のドキュメントを生成 |

### 展開ルール

旧スキーマでは `count` で数量を表現していたが、新スキーマでは **1品 = 1 ドキュメント** に展開する。

```
旧: { menu_id: "karaage", partner_id: "partner1", name: "唐揚げ", price: 500, count: 3, imageUrl: "..." }

新: 3つの order ドキュメントに展開（各ドキュメントのフィールド）
  → { order_id: "auto_1", menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", stripe_id: "旧orderId", ... }
  → { order_id: "auto_2", menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", stripe_id: "旧orderId", ... }
  → { order_id: "auto_3", menu_id: "karaage", menu_name: "唐揚げ", menu_price: 500, status: "ordered", stripe_id: "旧orderId", ... }
```

- `count` → 展開によって不要に。`count` 個分のドキュメントを生成
- `imageUrl` → 新スキーマに含めない（メニューマスタから参照）
- `status` → 親 order の `status` を引き継ぐ（`canceled` の order なら全展開 doc が `canceled`）
- `stripe_id` → `payment_intent` がある場合、旧 `order_id` を全展開 doc に設定
- `order_id` → 旧 `order_id` は使用しない。1:N 展開のため新規 ID を自動生成する

### 旧 EventOrder → 新 stripes（`payment_intent` がある場合のみ）

| 旧フィールド | 新フィールド | 変換ルール |
|:--|:--|:--|
| `order_id` | `stripe_id` | ドキュメント ID に使用（旧 order_id を維持） |
| - | `order_ids` | 展開で生成された全 order ドキュメントの ID 配列 |
| `user_id` | `user_id` | そのまま |
| `event_id` | `event_id` | そのまま |
| `community_id` | `community_id` | そのまま |
| `updated_at` | `updated_at` | そのまま |
| `ordered_at` / `created_at` | `created_at` | 決済ドキュメントの作成日時。`ordered_at` があれば使用、なければ旧 `created_at` |
| `menus` | `menus` | Firestore では `common/src/schemas/EventStripe.ts` の `StripeMenu` 形式 `{ menu_name, menu_price, count }`。旧 `menus[].name` → `menu_name`、旧 `menus[].price` → `menu_price` にマッピング（行ごとに `count` は旧データのまま） |
| `payment_intent` | `payment_intent` | そのまま |
| totalPrice (getter) | `pay_amount` | 旧 order の `menus.reduce((sum, m) => sum + m.price * m.count, 0)` で算出（`m` は旧 EventOrder のメニュー行） |
| `refund_id` | `refunds` | 後述 |
| `community_account` | *(削除)* | 新スキーマに含めない |
| - | `pay_community_bill_amount` | 未設定（将来用） |
| - | `pay_user_fee_amount` | 未設定（将来用） |

### receipt_number について

新設計では領収書は **`stripe_id` 単位で発行** する（07 の請求書・領収書セクション参照）。旧 order の `receipt_number` は **stripes ドキュメントに移行** する。

| 旧フィールド | 新フィールド | 変換ルール |
|:--|:--|:--|
| `receipt_number` | stripes の `receipt_number` | `payment_intent` がある場合に移行。ない場合は不要 |

### refunds の移行ルール

旧スキーマの `refund_id`（単一値）を新スキーマの `refunds`（配列）に変換する。

| 旧の状態 | 新 `refunds` の値 |
|:--|:--|
| `refund_id` なし | `[]`（空配列） |
| `refund_id` あり | `[{ refund_id, amount: totalPrice, order_ids: [展開した全order_id], created_at: canceled_at }]` |

- 旧スキーマでは全額返金のみだったため、`amount` は `totalPrice` と同額
- `order_ids` は展開で生成された全 order ドキュメントの ID 配列（全キャンセルのため全 order が対象）
- `created_at` は Firestore 上では `Timestamp`（`EventStripe.ts` の `RefundEntry`）。旧 order の `canceled_at` を優先し、欠落時は擬似コードどおり `updated_at` で代替

---

## 移行バッチの処理フロー

### 擬似コード

```typescript
async function migrateOrders(dryRun: boolean) {
  const db = getFirestore()
  const stats = { total: 0, migrated: 0, members: 0, newOrders: 0, stripes: 0, skipped: 0, errors: 0 }

  // 1. 旧 orders コレクションの全ドキュメントを collectionGroup で取得
  const allOrders = await db.collectionGroup('orders').get()

  // 旧 orders のみをフィルタ（depth 6 = communities/x/events/x/orders/x）
  // 新設の注文は `member_orders` サブコレクションに保存するため、`collectionGroup('orders')` の結果には含まれない（コレクション名が異なる）
  const oldOrders = allOrders.docs.filter(
    doc => doc.ref.path.split('/').length === 6
  )

  // in_cart 状態の order は移行しない（メンテナンスウィンドウ中に有効期限切れとして扱う）
  const targetOrders = oldOrders.filter(doc => doc.data().status !== 'in_cart')

  stats.total = oldOrders.length
  stats.skipped = oldOrders.length - targetOrders.length
  logger.info(`Total old orders: ${stats.total}, in_cart skipped: ${stats.skipped}`)

  // 2. communityId + eventId + userId でグルーピング
  //    （communityId と eventId は親パスから取得）
  const grouped = groupBy(targetOrders, (doc) => {
    const communityId = doc.ref.parent.parent!.parent.parent!.id
    const eventId = doc.ref.parent.parent!.id
    const userId = doc.data().user_id
    return `${communityId}/${eventId}/${userId}`
  })

  // 3. グループごとに移行処理
  for (const [key, docs] of Object.entries(grouped)) {
    const [communityId, eventId, userId] = key.split('/')

    try {
      // バッチ書き込み（500件上限を考慮して分割）
      let batch = db.batch()
      let batchCount = 0
      const BATCH_LIMIT = 450  // 安全マージンを持たせる

      // 3a. members ドキュメント作成（set で upsert）
      const memberRef = db
        .collection('communities').doc(communityId)
        .collection('events').doc(eventId)
        .collection('members').doc(userId)

      // 再実行対応: 既存の member_orders サブコレクションを削除（自動生成 ID のため重複防止）
      const existingOrders = await memberRef.collection('member_orders').get()
      if (!existingOrders.empty) {
        logger.info(`Clearing existing orders for re-migration: ${key} (${existingOrders.size} docs)`)
        for (const existingDoc of existingOrders.docs) {
          batch.delete(existingDoc.ref)
          batchCount++
          if (batchCount >= BATCH_LIMIT) {
            if (!dryRun) await batch.commit()
            batch = db.batch()
            batchCount = 0
          }
        }
      }

      const oldestCreatedAt = Math.min(...docs.map(d => d.data().created_at.toMillis()))

      batch.set(memberRef, {
        user_id: userId,
        event_id: eventId,
        community_id: communityId,
        created_at: Timestamp.fromMillis(oldestCreatedAt),
        updated_at: Timestamp.now(),
      })
      batchCount++
      stats.members++

      // 3b. 各旧 order → N 件の新 order ドキュメントに展開
      for (const doc of docs) {
        const old = doc.data()

        // menus を展開して個別の order ドキュメントを作成
        const expandedOrderIds: string[] = []

        for (const menu of old.menus) {
          for (let i = 0; i < menu.count; i++) {
            // バッチサイズチェック
            if (batchCount >= BATCH_LIMIT) {
              if (!dryRun) await batch.commit()
              batch = db.batch()
              batchCount = 0
            }

            const newOrderRef = memberRef.collection('member_orders').doc()
            expandedOrderIds.push(newOrderRef.id)

            batch.set(newOrderRef, {
              order_id: newOrderRef.id,
              user_id: userId,
              event_id: eventId,
              community_id: communityId,
              status: old.status,
              menu_id: menu.menu_id,
              menu_name: menu.name,
              menu_price: menu.price,
              created_at: old.created_at,
              updated_at: old.updated_at,
              carted_at: old.carted_at,
              ...(old.ordered_at && { ordered_at: old.ordered_at }),
              ...(old.canceled_at && { canceled_at: old.canceled_at }),
              ...(old.payment_intent && { stripe_id: doc.id }),
            })
            batchCount++
            stats.newOrders++
          }
        }

        // 3c. payment_intent がある場合 → stripes ドキュメント作成
        if (old.payment_intent) {
          if (batchCount >= BATCH_LIMIT) {
            if (!dryRun) await batch.commit()
            batch = db.batch()
            batchCount = 0
          }

          const stripeRef = db
            .collection('communities').doc(communityId)
            .collection('events').doc(eventId)
            .collection('stripes').doc(doc.id)

          const payAmount = old.menus.reduce(
            (sum, m) => sum + m.price * m.count, 0
          )

          const refunds = old.refund_id
            ? [{
                refund_id: old.refund_id,
                amount: payAmount,
                order_ids: expandedOrderIds,
                created_at: old.canceled_at ?? old.updated_at,
              }]
            : []

          batch.set(stripeRef, {
            stripe_id: doc.id,
            order_ids: expandedOrderIds,
            user_id: userId,
            event_id: eventId,
            community_id: communityId,
            payment_intent: old.payment_intent,
            menus: old.menus.map(m => ({
              menu_name: m.name,
              menu_price: m.price,
              count: m.count,
            })),
            pay_amount: payAmount,
            refunds,
            ...(old.receipt_number && { receipt_number: old.receipt_number }),
            created_at: old.ordered_at ?? old.created_at,
            updated_at: old.updated_at,
          })
          batchCount++
          stats.stripes++
        }
      }

      if (!dryRun && batchCount > 0) {
        await batch.commit()
      }
    } catch (error) {
      stats.errors++
      logger.error(`Migration failed for ${key}`, error)
    }
  }

  logger.info('Migration stats:', stats)
  return stats
}
```

### バッチサイズの考慮

- Firestore の `WriteBatch` は **500 オペレーション** が上限
- 1 旧 order → N 新 order（menus の count 合計分）+ 最大1 stripes → N+1 オペレーション
- 例: 旧 order に `[{count:3}, {count:2}]` の menus がある場合 → 5 新 order + 1 stripes = 6 オペレーション
- バッチサイズを 450 に制限し、超過時は自動的に新しいバッチに切り替える

### べき等性

再実行時の安全性を確保するため、以下の戦略を採用する。

- **stripes ドキュメント**: 旧 `order_id` をドキュメント ID に使うため、`set()` による upsert（存在すれば上書き、なければ作成）で自然にべき等になる
- **members ドキュメント**: `userId` をドキュメント ID に使うため、同様に `set()` による upsert でべき等
- **member_orders ドキュメント**: ID が自動生成のため、再実行すると新しい ID で重複作成される。そのため、**グループ単位で既存の member_orders を削除してから書き直す**
- **再実行最適化（任意）**: イベント単位チェック・グループ単位スキップを実装した場合、一致すると判定したグループでは `member_orders` の削除・再作成や `members` / `stripes` への書き込みを省略できる。詳細は直後の節「再実行最適化（イベント単位チェック・グループ単位スキップ）」を参照。スキップしない場合は従来どおり上記の手順となる。

```typescript
// グループ単位のべき等性確保
// 1. 既存の member_orders サブコレクションを削除（重複防止）
const existingOrders = await memberRef.collection('member_orders').get()
if (!existingOrders.empty) {
  logger.info(`Clearing existing orders for re-migration: ${key} (${existingOrders.size} docs)`)
  for (const doc of existingOrders.docs) {
    batch.delete(doc.ref)
    batchCount++
    if (batchCount >= BATCH_LIMIT) {
      if (!dryRun) await batch.commit()
      batch = db.batch()
      batchCount = 0
    }
  }
}

// 2. members は set() で upsert（既存があれば上書き）
batch.set(memberRef, { ... })

// 3. member_orders を新規作成（削除済みのため重複しない）
// 4. stripes は set() で upsert
```

この戦略により、部分成功（members 作成済みだが member_orders/stripes が未書き込み）のケースでも、再実行時に正しく復旧できる。

### 再実行最適化（イベント単位チェック・グループ単位スキップ）

大量データの再実行コスト・書き込み回数を抑えるため、**まずイベント単位で整合性の前提を満たすかを判定し、問題なければグループ単位（`community_id` + `event_id` + `user_id`）の移行処理をスキップ**するオプションを検討する。

#### 目的

- 再実行時に **不要な `member_orders` の削除・再作成**および **`members` / `stripes` の書き込み**を減らす
- 移行タスクの母集団は従来どおり **旧 `orders`（パス・depth フィルタ済み）** と **`validateMigratableOrder` 通過分** に揃える（`checks/0037_check_orders.js` と矛盾しないこと）

#### 処理順序

1. **イベント単位の事前チェック**  
   対象イベントに属する旧 `orders`（`in_cart` 除外・migratable のみ）と、既に存在する新スキーマ（`members` / `member_orders` / `stripes`、いずれも `collectionGroup` 取得後にパス深さ + 正規表現でフィルタ）から、下記「比較指標」を算出し、**旧側と新側が一致するか**を判定する。
2. **判定結果に応じた分岐**  
   - **一致しない**: 当該イベント内の **すべてのグループ**について、従来どおりフル移行（既存の削除→再作成を含む）を行う。  
   - **一致する**: 当該イベント内の各グループについて、**グループ単位のスキップ判定**（次項）に進む。

※ 「イベントで不一致」の場合でも、イベント内の一部グループだけが正しい可能性はあるが、**運用・実装の単純さのためイベント全体をフル移行にフォールバック**する方針とする（必要なら将来、グループ単位のみ再チェックする拡張を検討）。

#### グループ単位スキップ

イベント単位チェックが **一致**したイベントについてのみ、各グループ（`community_id` + `event_id` + `user_id`）で以下を比較し、**すべて一致すれば当該グループの移行処理（`member_orders` 削除・`members` set・`member_orders` / `stripes` 作成）をスキップ**する。

比較は **配列・マルチセットは順序に依存しない**よう、ソートまたは出現回数付きで正規化してから行う。

| 指標 | 旧データ側の定義 | 新データ側の定義 | 備考 |
|:--|:--|:--|:--|
| ユーザー | 当該グループの旧 order の `user_id`（同一グループ内は同一のはず） | 当該 `members` ドキュメントの `user_id` | グループ単位では実質一致確認 |
| メニュー ID（展開後） | 当該グループの migratable な旧 order について、`menus` を `count` 分展開したときの `menu_id` の列 | 当該 `member_orders` の各 doc の `menu_id` の列 | **1 行 = 1 ドキュメント** に揃える |
| メニュー数（展開後） | 上記の展開後の本数（= `menus` の `count` 合計） | `member_orders` の件数 | 仕様書「1:N 展開」と一致 |
| メニュー金額の合計 | 展開後各行の `menu_price` 相当：旧は `sum(price * count)` per order をグループ合算、新は `member_orders.menu_price` の合計 | 両者一致 | `stripes.pay_amount` との二重計上に注意（イベント単位・グループ単位で定義を一貫させる） |
| `payment_intent` | 当該グループの旧 order ごとに `payment_intent` が非空文字列のものの `payment_intent` 値の列（旧 order 1 件につき最大 1 回） | 当該グループに対応する `stripes`（`stripe_id` = 旧 `order_id`）の `payment_intent` の列 | 旧 order に PI がない行は配列に含めない、など **空文字・未定義の扱いを固定**する |

**stripes の件数**: グループ内で旧 order の `payment_intent` あり件数と、新 `stripes`（当該イベント・当該ユーザーの決済）の件数が一致することを、イベント単位チェックまたはグループ単位チェックのどちらかで必ず含める。

#### イベント単位チェックで用いる指標（例）

イベント全体について、旧 migratable 集計と新スキーマ集計から、少なくとも次を **同一の定義で** 比較する（具体フィールドは実装と `0037_check_orders.js` に合わせる）。

- **ユーザー ID の集合**（当該イベントに注文のある `user_id`）
- **メニュー ID のマルチセット**（展開後、イベント全体）
- **展開後メニュー本数**（イベント全体）
- **メニュー金額合計**（イベント全体、旧・新で同じ式）
- **`payment_intent` のマルチセット**（`payment_intent` ありの旧 order から）

イベント単位で一致した場合のみ、同一イベント内のグループごとに上記「グループ単位スキップ」用の指標で突き合わせる。

#### 制約・注意

- **合致＝完全な正しさの証明ではない**（異なる内訳で同じ合計になる等）。初回品質は Phase 3 の検証・`0037_check_orders.js` に依存する。
- **移行後に新アプリ等が `members` / `member_orders` / `stripes` に書き込むと**、再実行時のスキップ判定が偽の不一致・偽の一致を起こし得る。スキップ機能を使う実行は **Phase 2 直後・検証前**に限定するか、メンテナンス中のみとする。
- スキップ時は **書き込みが発生しない**ため、意図した副作用（例: Cloud Functions の `onDocumentWritten`）も発生しない。デプロイ順（データ移行 → 検証 → 新機能デプロイ）と併用する。

#### ドキュメント・実装の同期

- スキップ条件を変更した場合は **`tasks/0037_migrate_orders.js` と `checks/0037_check_orders.js`、本節**を同期すること。

---

## 移行フェーズ

データ移行はアプリのリリース前に先に行い、新コレクションにデータが存在する状態でアプリを切り替える。

| フェーズ | 内容 | 作業者 | リスク |
|:--|:--|:--|:--|
| Phase 0: 準備 | 移行バッチの開発・テスト。staging 環境での検証 | 開発者 | 低 |
| Phase 1: メンテナンス開始 | メンテナンスモード ON。アプリからの書き込みを停止 | 運営 | 低 |
| Phase 2: データ移行 | 旧 orders → 新 members + member_orders + stripes にバッチコピー。`in_cart` はスキップ。旧データは変更しない。再実行時の負荷削減のため、**イベント単位チェック・グループ単位スキップ**（上記「移行バッチの処理フロー」内の再実行最適化を参照）を実装する場合は本フェーズで有効化する | 自動 | 低 |
| Phase 3: 検証 | 移行データの整合性チェック（後述） | 開発者 | 低 |
| Phase 4: 切り替え | Security Rules + インデックス + Functions + フロントエンドを一斉デプロイ | 開発者 | 中 |
| Phase 5: 動作確認 | 主要機能の動作確認 | 開発者・運営 | 低 |
| Phase 6: メンテナンス終了 | メンテナンスモード OFF | 運営 | 低 |
| Phase 7: クリーンアップ | 旧 orders コレクション・旧インデックスの削除（十分な運用期間後） | 開発者 | 低 |

### Phase 4: デプロイ順序

1. **Security Rules**: 新コレクション（members, member_orders, stripes）のルールを追加。旧 orders のルールはまだ残す
2. **Firestore インデックス**: 新コレクション用のインデックスをデプロイ（反映に時間がかかるため先に実行。Phase 2 の前に事前デプロイしておくことも検討）
3. **Functions**: 新しい store 関数・Callable Functions をデプロイ
4. **フロントエンド**: user / admin アプリをデプロイ

---

## 移行検証

### Phase 3 で実施する検証項目

旧 orders は **`collectionGroup('orders')` + depth フィルタ（path の深さ = 6）** で取得する（`events/{eventId}/orders/{orderId}` のみ）。新設の注文ドキュメントは **`collectionGroup('member_orders')`** で集計する（旧 `orders` コレクション名とは別のため、二重計上にならない）。
旧 orders のうち `in_cart` は移行対象外のため、検証時も除外する。
**重要**: 1 旧 order → N 新 order（1:N 展開）のため、旧 orders の件数と新 member_orders の件数は一致しない。メニューの `count` 合計で比較する。

**本リポジトリの自動検証（`bokudeli-event-batch/checks/0037_check_orders.js`）** を使う場合の前提:

- 期待件数の母集団は **移行タスク（`tasks/0037_migrate_orders.js`）が実際に書き込む旧 order** に限る。旧 orders のうち `validateMigratableOrder` を通らないもの（不正データ）はタスク側でスキップされるため、下表の「全旧 order を対象にした単純集計」と数が一致しないことがある。
- **実行は移行直後かつ、新アプリ等が `members` / `member_orders` / `stripes` にまだ書き込んでいない状態**で行うこと。移行後に新規注文が入ると件数検証は偽の不一致になり得る。
- 新コレクションは `collectionGroup` 取得後に **パス深さ + 正規表現**でフィルタする（`member_orders` は深さ 8）。他用途の同名サブコレクション混入を防ぐ。
- **refunds**: 運用データでは旧 `refund_id` が全返金に記録されているとは限らないため、**「旧に `refund_id` がある行」についてのみ**新 `stripes.refunds` の内容を厳密に検証する。グローバルな件数一致は自動検証の PASS 条件に含めない。逆方向（新に `refunds` あり・旧に `refund_id` なし等）は警告のみ。
- `validateMigratableOrder` 等はタスクとチェックで **二重定義**している。変更時は両方を同期すること。

**移行タスク（`tasks/0037_migrate_orders.js`）** の運用注意:

- メンテナンス中（旧 orders への並行書き込みなし）を前提とする。グループ処理で途中まで `commit` した後に失敗した場合、再実行で当該グループの `member_orders` は削除から再作成できるが、その間に旧 orders が変わると整合が崩れる。
- ドライラン（`MIGRATE_ORDERS_DRY_RUN`）では **書き込みは行わないが、既存 `member_orders` の読み取り（get）は行う**。再実行最適化（イベント単位チェック等）を実装した場合は、スキップ判定のため **追加の読み取り（get）** が発生しうる（読み取りコストに注意）。

| 検証項目 | 方法 | 期待値 |
|:--|:--|:--|
| ドキュメント数（member_orders） | 旧 orders の `menus.reduce((s,m) => s+m.count, 0)` の総合計 vs 新 member_orders の件数 | 一致（1:N 展開のため） |
| ドキュメント数（members） | 新 members の件数 vs 旧 orders（`in_cart` 除外）の `user_id + event_id` のユニーク数 | 一致 |
| ドキュメント数（stripes） | 新 stripes の件数 vs 旧 orders で `payment_intent` ありの件数 | 一致 |
| 金額整合性 | サンプル stripes の `pay_amount` vs 旧 order の `totalPrice` | 一致 |
| order_ids 整合性 | 各 stripes の `order_ids.length` vs 旧 order の menus の count 合計 | 一致 |
| stripe_id 紐付け | 新 member_orders の `stripe_id` vs 新 stripes の `stripe_id` | 対応する stripes ドキュメントが存在 |
| receipt_number | 旧 orders で `receipt_number` ありの件数 vs 新 stripes で `receipt_number` ありの件数 | 一致 |
| refunds 移行 | 手動・レポート用: 旧 `refund_id` あり件数 vs 新 `refunds` 非空件数（旧データ欠損があると一致しない）。**自動検証**では旧に `refund_id` がある行ごとに新 `stripes.refunds` へ同一 `refund_id` が載ること等を検証 | 上記参照 |
| menu_price 整合性 | 各 stripes の `order_ids` で取得した member_orders の `menu_price` 合計 vs `pay_amount` | 一致（canceled order を含む元の合計） |

### 検証スクリプト（擬似コード）

以下は概念説明用。本番の自動検証はリポジトリの `checks/0037_check_orders.js` を用い、上記「本リポジトリの自動検証」の前提（migratable のみ・refunds の扱い等）に合わせること。

```typescript
const OLD_ORDER_PATH_DEPTH = 6  // communities/x/events/x/orders/x

async function verifyMigration() {
  const db = getFirestore()

  // 旧データの集計（depth フィルタで旧 orders のみ取得。member_orders は collectionGroup('orders') に含まれない）
  const allOrders = await db.collectionGroup('orders').get()
  const oldOrderDocs = allOrders.docs
    .filter(doc => doc.ref.path.split('/').length === OLD_ORDER_PATH_DEPTH)
    .filter(doc => doc.data().status !== 'in_cart')

  // 旧 orders の menus count 合計（= 展開後の新 order 件数の期待値）
  const expectedNewOrderCount = oldOrderDocs.reduce((sum, doc) => {
    const menus = doc.data().menus || []
    return sum + menus.reduce((s, m) => s + (m.count || 1), 0)
  }, 0)

  const oldStats = {
    total: oldOrderDocs.length,
    expectedNewOrders: expectedNewOrderCount,
    uniqueMembers: new Set(oldOrderDocs.map(d => `${d.data().event_id}_${d.data().user_id}`)).size,
    withPaymentIntent: oldOrderDocs.filter(d => d.data().payment_intent).length,
    withReceiptNumber: oldOrderDocs.filter(d => d.data().receipt_number).length,
    withRefundId: oldOrderDocs.filter(d => d.data().refund_id).length,
  }

  // 新データの集計（events 配下の member_orders のみ）
  const newOrderDocsSnap = await db.collectionGroup('member_orders').get()
  const newOrderDocs = newOrderDocsSnap.docs
  const newMembers = await db.collectionGroup('members').get()
  // members の depth フィルタ（depth 6 = communities/x/events/x/members/x）
  const newMemberDocs = newMembers.docs.filter(doc => doc.ref.path.split('/').length === 6)
  const newStripes = await db.collectionGroup('stripes').get()

  // 比較・レポート出力
  logger.info('Old orders stats:', oldStats)
  logger.info('New member_orders count:', newOrderDocs.length)
  logger.info('New members count:', newMemberDocs.length)
  logger.info('New stripes count:', newStripes.docs.length)

  const isValid =
    oldStats.expectedNewOrders === newOrderDocs.length &&
    oldStats.uniqueMembers === newMemberDocs.length &&
    oldStats.withPaymentIntent === newStripes.docs.length &&
    oldStats.withReceiptNumber === newStripes.docs.filter(d => d.data().receipt_number).length &&
    oldStats.withRefundId === newStripes.docs.filter(d => d.data().refunds?.length > 0).length

  logger.info(`Migration verification: ${isValid ? 'PASSED' : 'FAILED'}`)
  return isValid
}
```

**擬似コードの `isValid` について**: `withRefundId` と新 stripes の `refunds` 非空件数の一致は、旧データで返金が `refund_id` に載っていないケースがあると成立しない。実運用の PASS/FAIL は `checks/0037_check_orders.js` の条件に従う。また `expectedNewOrders` を「全旧 order」の `count` 合計で出しているが、移行タスクがスキップする不正 order を除いた期待値に揃えるなら migratable のみで集計する（同スクリプトと同じ）。

---

## エラーハンドリング

| エラーケース | 対応 |
|:--|:--|
| 旧 order に `user_id` がない | スキップしてログに記録 |
| menus が空配列 | スキップしてログに記録 |
| menus の `count` が 0 以下 | スキップしてログに記録 |
| バッチ書き込み失敗 | 該当グループをエラーログに記録し、次のグループへ続行。後から再実行可能 |
| 他階層に同名 `orders` があり collectionGroup に混ざる | パスの深さ（depth 6）で `events/.../orders` のみに限定 |
| バッチサイズ超過 | 自動的に新しいバッチに切り替え（450 オペレーションで分割） |

### collectionGroup の注意点

`collectionGroup('orders')` は Firestore 内のすべての **`orders` という名前のコレクション** を返す。新設の注文は **`member_orders`** サブコレクションに保存するため、旧パス（`events/.../orders`）と **コレクション名が衝突しない**。移行バッチでは引き続き **`events/{eventId}/orders`** を depth 6 で特定する（プロジェクト内に別用途の `orders` コレクションがある場合の混在防止）。

```
旧（移行対象）: communities/{cId}/events/{eId}/orders/{oId}                 → depth 6
新: communities/{cId}/events/{eId}/members/{uId}/member_orders/{oId}        → collectionGroup('member_orders') で取得
```

---

## ドライランモード

移行バッチには `dryRun` フラグを実装し、本番実行前に以下を確認する:

- 変換されるドキュメントの件数（旧 order 数 → 新 order 数の 1:N 展開を含む）
- 展開結果のサンプル出力（旧 order 1 件が何件の新 order に展開されたか）
- エラー・スキップされるドキュメントの一覧
- Firestore への書き込みは行わない

---

## 実行環境

| 項目 | 方針 |
|:--|:--|
| 実行方法 | Firebase Functions の onRequest（管理者のみアクセス可）or ローカルスクリプト |
| 実行タイミング | 深夜の低利用時間帯。メンテナンスモード中 |
| タイムアウト | Functions の場合 540秒上限。1:N 展開によりデータ量が増えるため、ローカル実行を推奨 |
| ログ出力 | 移行件数・展開件数・スキップ件数・エラー件数のサマリを Cloud Logging に出力 |

---

## ロールバック手順

問題発生時は以下の手順でロールバックする。旧 orders コレクションは移行後も削除せず保持しているため、コードを戻すだけで復旧可能。

1. フロントエンド（user / admin）を旧バージョンにロールバック
2. Functions を旧バージョンにロールバック
3. Security Rules を旧バージョンにロールバック
4. 新コレクション（members, member_orders, stripes）のデータは残しても問題ない（旧コードからは参照されない）
5. 原因調査・修正後、再度移行を実行（既存チェックにより重複を防止）

### ロールバック判断基準

- 移行検証（Phase 3）でドキュメント数や金額の不一致が発見された場合
- Phase 5 の動作確認で致命的な不具合が発見された場合

---

## 移行時の注意点

- **アプリからの書き込みが停止されている前提**: メンテナンスウィンドウ中に移行を実行する。移行中にアプリから旧 orders への書き込みが発生しないことを前提とする（WriteBatch はトランザクションではないため、読み取りと書き込みの間の整合性はメンテナンスモードで担保する）
- **in_cart 状態の order は移行しない**: メンテナンスウィンドウ中は新規注文が停止されるため、`in_cart` は有効期限切れとして扱う。移行バッチで `in_cart` をスキップすることで、不完全な注文データの移行を防ぐ
- **1:N 展開によるデータ量増加**: 旧 order 1 件が menus の count 合計分のドキュメントに展開されるため、新 member_orders のドキュメント数は旧 orders より多くなる。Firestore の課金・パフォーマンスへの影響を事前に見積もること
- **データ移行はアプリリリース前に実行**: 先に新コレクションにデータをコピーし、検証完了後にアプリを切り替える。これにより、新コードのデプロイ時点で新コレクションにデータが存在する状態を保証する
- **並行運用は行わない**: 旧と新の二重書き込みは複雑すぎるため、メンテナンスウィンドウを設けて一斉切り替えとする
- **旧 orders の保持期間**: Phase 7（クリーンアップ）まで少なくとも2週間以上の運用期間を設ける
- **collectionGroup インデックス**: `collectionGroup('member_orders')` 用のインデックスは **`collectionGroup('orders')`（旧パス）とは別コレクション名のため衝突しない**。旧 orders 向けのインデックス・クエリと独立して管理できる
