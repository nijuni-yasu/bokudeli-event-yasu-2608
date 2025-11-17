# legacy to default 移行

## 1. 概要
### 1.1 機能の目的
`functions/legacy`ディレクトリに存在するJavaScriptで記述されたFirebase Functions v1のコードを、`functions/default`ディレクトリにTypeScriptで記述されたFirebase Functions v2のコードとして移行する。これにより、コードの型安全性向上、保守性向上、最新APIの活用を実現する。

### 1.2 主要な機能
- **Firebase Functions v1からv2への移行**: 全てのFunctionsをv2 APIに移行
- **JavaScriptからTypeScriptへの移行**: 型安全性の向上と開発体験の改善
- **スキーマの統一**: `common/src/schemas`で定義されたスキーマを使用したデータバリデーション
- **コードの整理と最適化**: 既存のdefault実装パターンに合わせたコード構造への統一

### 1.3 対象ユーザー
- 開発者（バックエンド開発者）

## 2. ねらい
### 2.1 ビジネス目標
- コードの保守性向上による開発効率の改善
- 型安全性によるバグの早期発見と修正コストの削減
- 最新APIの活用によるパフォーマンス向上と運用コストの最適化

### 2.2 ユーザー価値
- より安定したサービスの提供
- 新機能の追加が容易になる

### 2.3 成功指標（KPI）
- legacyディレクトリの全ファイルが移行完了
- 既存機能の動作が維持されていること
- 型エラーが解消されていること

## 3. 前提条件
### 3.1 技術的前提条件
- Firebase Functions v2 APIの知識
- TypeScriptの知識
- `common/src/schemas`で定義されたスキーマの理解
- 既存の`functions/default`の実装パターンの理解

### 3.2 ビジネス的前提条件
- 既存機能の動作を維持する必要がある
- 移行中もサービスを継続運用する必要がある

### 3.3 依存関係
- `common`パッケージのスキーマ定義
- Firebase Admin SDK
- Firebase Functions v2
- 各種外部ライブラリ（stripe, sendgrid, sharp等）

## 4. 画面仕様
本機能はバックエンドのみの変更のため、画面仕様は該当なし。

## 5. 技術仕様・データ構造設計

### 5.1 移行対象ファイル一覧

#### 5.1.1 Trigger Functions（Firestore Trigger）
| ファイル名 | 機能 | 現在の実装 | 移行先 |
|-----------|------|-----------|--------|
| `event-snapshot.js` | イベントメニュースナップショット作成 | v1 `onWrite` | v2 `onDocumentWritten` |
| `event-members.js` | イベントメンバー更新 | v1 `onWrite` | v2 `onDocumentWritten` |
| `event-logging.js` | イベント変更ログ記録 | v1 `onWrite` | v2 `onDocumentWritten` |
| `community-members.js` | コミュニティメンバー更新・メール送信 | v1 `onWrite` | v2 `onDocumentWritten` |
| `storage-image.js` | 画像サムネイル生成 | v1 `onFinalize` | v2 `onObjectFinalized` |

#### 5.1.2 Callable Functions（HTTP Callable）
| ファイル名 | 機能 | 現在の実装 | 移行先 |
|-----------|------|-----------|--------|
| `orders.js` | 注文の追加・削除・ステータス更新 | v1 `onCall` | v2 `onCall` |
| `stripe-refunds.js` | Stripe返金処理 | v1 `onCall` | v2 `onCall` |
| `sendgrid-mail.js` | メール送信 | v1 `onCall` | v2 `onCall` |

#### 5.1.3 HTTP Request Functions
| ファイル名 | 機能 | 現在の実装 | 移行先 |
|-----------|------|-----------|--------|
| `stripe-webhook.js` | Stripe Webhook処理 | v1 `onRequest` | v2 `onRequest` |
| `invoice.js` | 請求書PDF生成 | v2 `onRequest` | 既にv2（最適化のみ） |
| `eventBillInvoice.js` | イベント請求書PDF生成 | v2 `onRequest` | 既にv2（最適化のみ） |
| `namesprint.js` | 名札PDF生成 | v2 `onRequest` | 既にv2（最適化のみ） |
| `flyer.js` | チラシPDF生成 | v2 `onRequest` | 既にv2（最適化のみ） |

#### 5.1.4 Scheduled Functions
| ファイル名 | 機能 | 現在の実装 | 移行先 |
|-----------|------|-----------|--------|
| `sendgrid-mail.js` | ポーリングタスク（請求書メール送信） | v1 `onSchedule` | v2 `onSchedule` |
| `backup.js` | Firestoreバックアップ | v1 `onSchedule` | v2 `onSchedule` |

### 5.2 移行パターン

#### 5.2.1 v1からv2への移行パターン

##### Firestore Trigger（onWrite → onDocumentWritten）
```typescript
// v1 パターン
import functions from 'firebase-functions/v1'
export const myFunction = functions
  .region('asia-northeast1')
  .firestore.document('collection/{docId}')
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null
    const after = change.after.exists ? change.after.data() : null
    // 処理
  })

// v2 パターン
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
export const myFunction = onDocumentWritten(
  'collection/{docId}',
  async (event) => {
    const before = event.data.before?.data()
    const after = event.data.after?.data()
    // 処理
  }
)
```

##### Callable Function（onCall）
```typescript
// v1 パターン
import functions from 'firebase-functions/v1'
export const myFunction = functions
  .region('asia-northeast1')
  .https.onCall(async (data, context) => {
    const uid = context.auth?.uid
    if (uid == null) {
      throw new functions.https.HttpsError('unauthenticated', '...')
    }
    // 処理
  })

// v2 パターン
import { onCall, HttpsError } from 'firebase-functions/v2/https'
export const myFunction = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '...')
  }
  // 処理
})
```

##### HTTP Request Function（onRequest）
```typescript
// v1 パターン
import functions from 'firebase-functions/v1'
export const myFunction = functions
  .region('asia-northeast1')
  .https.onRequest(async (req, res) => {
    // 処理
  })

// v2 パターン
import { onRequest } from 'firebase-functions/v2/https'
export const myFunction = onRequest(async (req, res) => {
  // 処理
})
```

##### Scheduled Function（onSchedule）
```typescript
// v1 パターン
import functions from 'firebase-functions/v1'
export const myFunction = functions
  .region('asia-northeast1')
  .pubsub.schedule('0 2 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    // 処理
  })

// v2 パターン
import { onSchedule } from 'firebase-functions/v2/scheduler'
export const myFunction = onSchedule(
  {
    schedule: '0 2 * * *',
    timeZone: 'Asia/Tokyo',
    region: 'asia-northeast1',
  },
  async () => {
    // 処理
  }
)
```

##### Storage Trigger（onFinalize → onObjectFinalized）
```typescript
// v1 パターン
import functions from 'firebase-functions/v1'
export const myFunction = functions
  .region('asia-northeast1')
  .storage.object()
  .onFinalize(async (object) => {
    // 処理
  })

// v2 パターン
import { onObjectFinalized } from 'firebase-functions/v2/storage'
export const myFunction = onObjectFinalized(async (event) => {
  const object = event.data
  // 処理
})
```

#### 5.2.2 スキーマの使用パターン

##### データ取得とバリデーション
```typescript
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'
import { Event } from '@shokujii/common/schemas/Event.js'
import { Community } from '@shokujii/common/schemas/Community.js'

// Firestoreから取得したデータをスキーマでバリデーション
const orderSnapshot = await db.collection('...').doc(orderId).get()
const orderData = orderSnapshot.data()
if (!orderData) {
  throw new HttpsError('not-found', 'Order not found')
}

// スキーマを使用したバリデーション（必要に応じて）
// EventOrderDbSchema.parse(orderData) など
```

##### データ保存時のスキーマ使用
```typescript
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'

const order = new EventOrder(eventId, orderId, {
  user_id: uid,
  menus: menus,
  // ...
})

// バリデーション
if (!order.isValidForDatabase()) {
  throw new HttpsError('invalid-argument', 'Invalid order data')
}

// Firestoreに保存
await db.collection('...').doc(orderId).set(order.toFirestore())
```

### 5.3 各ファイルの移行詳細

#### 5.3.1 event-snapshot.js → eventSnapshot.ts
**機能**: イベント作成・更新時に、パートナーのメニューをイベントのメニューコレクションにスナップショットとしてコピー

**移行内容**:
- v1 `onWrite` → v2 `onDocumentWritten`
- JavaScript → TypeScript
- エラーハンドリングの改善
- 型定義の追加

**スキーマ使用**:
- `Event`スキーマを使用してイベントデータをバリデーション

**実装例**:
```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { Event } from '@shokujii/common/schemas/Event.js'

export const makeShopSnapshotToEvent = onDocumentWritten(
  'communities/{communityId}/events/{eventId}',
  async (event) => {
    const afterData = event.data.after?.data()
    if (!afterData) return

    const beforeStatus = event.data.before?.data()?.event_status?.value
    const afterStatus = afterData.event_status?.value

    // ステータス変更チェック
    if (beforeStatus === 'accepting_order' && afterStatus === 'accepting_order') {
      return
    }

    // メニュースナップショット作成処理
    // ...
  }
)
```

#### 5.3.2 event-members.js → eventMembers.ts
**機能**: 注文の作成・更新・削除時に、イベントの`members`フィールドと`event_num_members`を更新

**移行内容**:
- v1 `onWrite` → v2 `onDocumentWritten`
- JavaScript → TypeScript
- `EventOrder`スキーマを使用したバリデーション

**スキーマ使用**:
- `EventOrder`スキーマを使用
- `Event`スキーマを使用

**実装例**:
```typescript
import { onDocumentWritten } from 'firebase-functions/v2/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'

export const createEventMembers = onDocumentWritten(
  'communities/{communityId}/events/{eventId}/orders/{orderId}',
  async (event) => {
    const db = getFirestore()
    const { communityId, eventId } = event.params

    await db.runTransaction(async (transaction) => {
      const eventRef = db
        .collection('communities')
        .doc(communityId)
        .collection('events')
        .doc(eventId)
      
      const ordersRef = eventRef.collection('orders')
      const ordersSnapshot = await transaction.get(ordersRef)
      
      const userIds = new Set<string>()
      ordersSnapshot.docs.forEach((orderDoc) => {
        const orderData = orderDoc.data()
        if (orderData.status === 'ordered') {
          userIds.add(orderData.user_id)
        }
      })

      transaction.update(eventRef, {
        members: Array.from(userIds).map((userId) => 
          db.doc(`users/${userId}`)
        ),
        event_num_members: userIds.size,
      })
    })
  }
)
```

#### 5.3.3 event-logging.js → eventLogging.ts
**機能**: イベントの変更をログとして記録

**移行内容**:
- v1 `onWrite` → v2 `onDocumentWritten`
- JavaScript → TypeScript
- 差分計算ロジックの型安全性向上

**スキーマ使用**:
- `Event`スキーマを使用

#### 5.3.4 community-members.js → communityMembers.ts
**機能**: コミュニティメンバーの作成・更新・削除時に、コミュニティの`members`、`managers`、`community_num_members`を更新し、マネージャー追加・削除時にメール送信

**移行内容**:
- v1 `onWrite` → v2 `onDocumentWritten`
- JavaScript → TypeScript
- SendGridメール送信のv2対応

**スキーマ使用**:
- `Community`スキーマを使用
- `CommunityMember`スキーマを使用

#### 5.3.5 orders.js → orders.ts
**機能**: 注文の追加・削除・ステータス更新

**移行内容**:
- v1 `onCall` → v2 `onCall`
- JavaScript → TypeScript
- `EventOrder`スキーマを使用したバリデーション

**スキーマ使用**:
- `EventOrder`スキーマを使用
- `Event`スキーマを使用

**API定義**:
```typescript
// common/src/apis/order.ts に定義（新規作成）
export const AddOrderRequestSchema = z.object({
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
})
export type AddOrderRequest = z.infer<typeof AddOrderRequestSchema>

export const DeleteOrderRequestSchema = z.object({
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  menu_id: z.string().nonempty(),
})
export type DeleteOrderRequest = z.infer<typeof DeleteOrderRequestSchema>

export const UpdateOrderStatusRequestSchema = z.object({
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  status: z.enum(EVENT_ORDER_STATUS_VALUES),
})
export type UpdateOrderStatusRequest = z.infer<typeof UpdateOrderStatusRequestSchema>
```

#### 5.3.6 stripe-webhook.js → stripeWebhook.ts
**機能**: Stripe Webhookを受信し、チェックアウトセッション完了時に注文ステータスを更新

**移行内容**:
- v1 `onRequest` → v2 `onRequest`
- JavaScript → TypeScript
- Stripe SDKの型定義活用

**スキーマ使用**:
- `EventOrder`スキーマを使用

#### 5.3.7 stripe-refunds.js → stripeRefunds.ts
**機能**: Stripe返金処理

**移行内容**:
- v1 `onCall` → v2 `onCall`
- JavaScript → TypeScript
- Stripe SDKの型定義活用

**スキーマ使用**:
- `EventOrder`スキーマを使用

**API定義**:
```typescript
// common/src/apis/stripe.ts に追加
export const StripeRefundRequestSchema = z.object({
  paymentIntent: z.string().nonempty(),
  orderId: z.string().nonempty(),
})
export type StripeRefundRequest = z.infer<typeof StripeRefundRequestSchema>
```

#### 5.3.8 sendgrid-mail.js → sendgridMail.ts
**機能**: 
- メール送信（Callable Function）
- ポーリングタスク（Scheduled Function）で請求書メール送信

**移行内容**:
- v1 `onCall` → v2 `onCall`
- v1 `onSchedule` → v2 `onSchedule`
- JavaScript → TypeScript
- 既存の`pollingTask.ts`との統合を検討

**注意事項**:
- `pollingTask.ts`に既に類似機能が実装されている可能性があるため、統合を検討

#### 5.3.9 storage-image.js → storageImage.ts
**機能**: ユーザーアバター画像のアップロード時に、サムネイル画像を自動生成

**移行内容**:
- v1 `onFinalize` → v2 `onObjectFinalized`
- JavaScript → TypeScript
- Sharpライブラリの型定義活用

#### 5.3.10 backup.js → backup.ts
**機能**: Firestoreの定期バックアップ

**移行内容**:
- v1 `onSchedule` → v2 `onSchedule`
- JavaScript → TypeScript

#### 5.3.11 invoice.js, eventBillInvoice.js, namesprint.js, flyer.js
**機能**: PDF生成（請求書、イベント請求書、名札、チラシ）

**移行内容**:
- 既にv2で実装されているため、最適化と型安全性の向上のみ
- スキーマの使用を検討

### 5.4 共通ユーティリティの移行

#### 5.4.1 utils/ ディレクトリ
legacyの`utils/`ディレクトリにあるユーティリティ関数もTypeScriptに移行し、必要に応じて`common/src/utils`に移動する。

**移行対象**:
- `converter.js` → TypeScript化
- `datetime.js` → TypeScript化（既存の`common/src/utils/datetime.ts`と統合を検討）
- `eventUtils.js` → TypeScript化
- `mail.js` → TypeScript化（既存の`functions/default/src/utils/mail.ts`と統合）
- `makePdf.js` → TypeScript化
- `misc.js` → TypeScript化
- `stream.js` → TypeScript化
- `urls.js` → TypeScript化（既存の`functions/default/src/utils/urls.ts`と統合を検討）

### 5.5 エラーハンドリング

#### 5.5.1 エラーハンドリングパターン
```typescript
import { HttpsError } from 'firebase-functions/v2/https'

try {
  // 処理
} catch (error) {
  if (error instanceof HttpsError) {
    throw error
  }
  console.error('Unexpected error:', error)
  throw new HttpsError('internal', 'An unexpected error occurred')
}
```

### 5.6 認証・権限チェック

#### 5.6.1 認証チェックパターン
```typescript
import { onCall, HttpsError } from 'firebase-functions/v2/https'

export const myFunction = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }
  // 処理
})
```

#### 5.6.2 管理者権限チェック（必要な場合）
```typescript
import { getUser } from './stores/user.js'

const user = await getUser(uid)
if (!user.is_admin) {
  throw new HttpsError('permission-denied', '管理者権限が必要です')
}
```

### 5.7 処理フロー

#### 5.7.1 基本的な移行フロー
```markdown
1. legacyファイルの機能を理解
2. 対応するスキーマを`common/src/schemas`から確認
3. v2 APIのパターンを確認（既存のdefault実装を参考）
4. TypeScriptで実装
5. スキーマを使用したバリデーションを追加
6. エラーハンドリングを改善
7. テスト（既存機能の動作確認）
8. legacyファイルを削除（移行完了後）
```

#### 5.7.2 エラーハンドリングを含む処理フロー
```markdown
1. リクエスト受信
2. 認証チェック
   - 失敗時: 認証エラーを返却
3. 引数のバリデーション（スキーマ使用）
   - 失敗時: バリデーションエラーを返却
4. ビジネスロジック実行
   - 成功: 処理を継続
   - 失敗: ビジネスロジックエラーを返却
5. データ保存（スキーマ使用）
   - 失敗時: データベースエラーを返却
6. レスポンス返却
```

## 6. データマイグレーション
本機能は既存データの構造変更を伴わないため、データマイグレーションは不要。

## 7. 実装優先度

### 7.1 Phase 1（必須・優先度高）
- [ ] `event-members.js` → `eventMembers.ts`（注文機能に直結）
- [ ] `orders.js` → `orders.ts`（注文機能に直結）
- [ ] `stripe-webhook.js` → `stripeWebhook.ts`（決済機能に直結）
- [ ] `stripe-refunds.js` → `stripeRefunds.ts`（決済機能に直結）
- [ ] `event-snapshot.js` → `eventSnapshot.ts`（イベント機能に直結）
- [ ] `community-members.js` → `communityMembers.ts`（コミュニティ機能に直結）

### 7.2 Phase 2（重要・優先度中）
- [ ] `event-logging.js` → `eventLogging.ts`
- [ ] `sendgrid-mail.js` → `sendgridMail.ts`（既存の`pollingTask.ts`との統合を検討）
- [ ] `storage-image.js` → `storageImage.ts`

### 7.3 Phase 3（優先度低）
- [ ] `backup.js` → `backup.ts`
- [ ] `invoice.js`の最適化（既にv2）
- [ ] `eventBillInvoice.js`の最適化（既にv2）
- [ ] `namesprint.js`の最適化（既にv2）
- [ ] `flyer.js`の最適化（既にv2）

### 7.4 Phase 4（共通ユーティリティ）
- [ ] `utils/`ディレクトリの移行
- [ ] 既存の`common/src/utils`や`functions/default/src/utils`との統合

## 8. 注意事項

### 8.1 既存システムへの影響

#### 8.1.1 データベース構造への影響
- データベース構造の変更はなし
- 既存のデータはそのまま使用可能

#### 8.1.2 アプリケーションへの影響
- **フロントエンド**: Functionsのエンドポイント名が変更される可能性があるため、フロントエンドの呼び出しコードを確認・更新が必要
- **バックエンド**: legacyとdefaultの両方が存在する期間は、両方のFunctionsがデプロイされる可能性があるため、重複に注意
- **既存機能**: 既存機能の動作を維持する必要がある

#### 8.1.3 運用への影響
- **デプロイ**: legacyとdefaultの両方をデプロイする場合、リソース使用量が増加する可能性
- **ログ**: v2ではログ形式が変更される可能性があるため、ログ監視の確認が必要
- **パフォーマンス**: v2ではデフォルトのタイムアウトやメモリ設定が異なる可能性があるため、必要に応じて調整

### 8.2 セキュリティ考慮事項
- 認証チェックの実装漏れがないか確認
- 権限チェックの実装漏れがないか確認
- スキーマバリデーションによる不正データの防止
- シークレット管理（v2では`defineSecret`を使用）

### 8.3 運用考慮事項
- **ログ**: 適切なログレベルでエラーを記録
- **バックアップ**: 移行前に既存のFunctionsのバックアップを取得
- **監視**: 移行後の動作監視を強化
- **パフォーマンス**: v2のデフォルト設定を確認し、必要に応じて調整
- **拡張性**: 将来の機能追加を考慮したコード構造

### 8.4 移行時の注意点
- legacyとdefaultの両方が存在する期間は、重複デプロイに注意
- 移行完了後は、legacyディレクトリを削除する前に十分な動作確認を実施
- 各ファイルの移行は段階的に実施し、1つずつ動作確認を行う
- 既存のテストがある場合は、テストも移行・更新する

### 8.5 既存実装との統合
- `functions/default`に既に実装されている機能（例: `pollingTask.ts`）との統合を検討
- 重複する機能は統合し、コードの重複を避ける
- 既存のユーティリティ関数（`utils/urls.ts`、`utils/mail.ts`等）を活用

