# functions/default における common/schemas の使い方

このドキュメントは、`functions/default/src` で `common/src/schemas` の zod スキーマを使用する際の一貫性のあるパターンを説明します。

## 概要

`functions/default/src` では、以下の2つの主要な用途で `common/src/schemas` を使用します：

1. **Firestore データの読み書き** - スキーマクラスを使用して Firestore との変換を行う
2. **API リクエスト/レスポンスのバリデーション** - `common/src/apis` の zod スキーマを使用してバリデーションを行う

## 1. Firestore データの読み書き

### 基本的なパターン

`stores/` ディレクトリでは、`common/src/schemas` からクラスをインポートし、`FirestoreDataConverter` を使用して Firestore との変換を行います。

### スキーマクラスのインポート

```typescript
import { User } from '@shokujii/common/schemas/User.js'
import { Event } from '@shokujii/common/schemas/Event.js'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'
```

### FirestoreDataConverter の実装

各スキーマクラスに対して、`FirestoreDataConverter` を実装します：

```typescript
import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase-admin/firestore'

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): User {
    return new User(snapshot.id, snapshot.data())
  },
}
```

### 拡張クラスの作成

必要に応じて、スキーマクラスを拡張して追加のメソッドを実装します：

```typescript
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'

export class ShokujiiUser extends User {
  user_email: string = ''

  constructor(id: string, data: Partial<User> & Partial<UserPersonalInformation>) {
    super(id, data)
    Object.assign(this, new UserPersonalInformation(id, data))
  }
}
```

### Firestore への保存

```typescript
import { getFirestore, Transaction } from 'firebase-admin/firestore'

export const saveUser = async (user: ShokujiiUser, transaction?: Transaction) => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(user.id).withConverter(userConverter)
  
  if (transaction === undefined) {
    await userRef.set(user, { merge: true })
  } else {
    transaction.set(userRef, user, { merge: true })
  }
}
```

### Firestore からの読み込み

```typescript
export const getUser = async (userId: string): Promise<ShokujiiUser | undefined> => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(userId).withConverter(userConverter)
  const user = (await userRef.get()).data()
  return user ?? undefined
}
```

### パラメータが必要な toFirestore メソッド

一部のスキーマクラス（例: `Event`）では、`toFirestore()` メソッドに追加のパラメータが必要です。この場合、`FirestoreDataConverter` の実装でパラメータを管理します：

```typescript
class ShokujiiEventConverter implements FirestoreDataConverter<ShokujiiEvent> {
  constructor(private readonly userId?: string) {}

  toFirestore(event: ShokujiiEvent): DocumentData {
    if (this.userId == null) {
      throw new Error('userId is required')
    }
    return event.toFirestore(this.userId)
  }

  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiEvent {
    return new ShokujiiEvent(snapshot.id, snapshot.data())
  }
}

// 使用例
export const saveEvent = async (userId: string, event: ShokujiiEvent, transaction?: Transaction) => {
  const db = getFirestore()
  const eventRef = db
    .collection('communities')
    .doc(event.community_id)
    .collection('events')
    .doc(event.id)
    .withConverter(new ShokujiiEventConverter(userId))
  
  if (transaction === undefined) {
    await eventRef.set(event, { merge: true })
  } else {
    transaction.set(eventRef, event, { merge: true })
  }
}
```

## 2. API リクエスト/レスポンスのバリデーション

### 基本的なパターン

`onCall` 関数内で、`common/src/apis` から zod スキーマをインポートしてリクエストデータをバリデーションします。

### API スキーマのインポート

```typescript
import { UpdateMenuCountInCartRequestSchema, DeleteMenuInCartRequestSchema } from '@shokujii/common/apis/order.js'
import { sendTestLetterRequestSchema } from '@shokujii/common/apis/letter.js'
import { CreateStripeCheckoutSessionRequest } from '@shokujii/common/apis/stripe.js'
```

### リクエストデータのバリデーション

```typescript
import { onCall, HttpsError } from 'firebase-functions/https'

export const updateOrderMenuCount = onCall(async (request) => {
  // 認証チェック
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  // 引数の取得とバリデーション
  const validatedData = UpdateOrderMenuCountRequestSchema.parse(request.data)
  const { community_id, event_id, order_id, menu_id, count } = validatedData

  // 処理を続行...
})
```

### エラーハンドリング

zod の `parse()` メソッドは、バリデーションに失敗した場合に自動的にエラーを throw します。Firebase Functions では、このエラーが自動的にクライアントに返されます。

明示的にエラーハンドリングを行う場合は、`safeParse()` を使用します：

```typescript
const result = UpdateMenuCountInCartRequestSchema.safeParse(request.data)
if (!result.success) {
  throw new HttpsError('invalid-argument', 'Invalid request data', result.error)
}
const validatedData = result.data
```

## 3. スキーマの部分的な使用

### 配列スキーマの使用

スキーマの一部（例: 配列スキーマ）をインポートして、Firestore から取得したデータをバリデーションする場合：

```typescript
import { OrderMenuType, OrderMenuArraySchema } from '@shokujii/common/schemas/EventOrder.js'

// Firestore から取得したデータをバリデーション
const menusRaw = orderSnapshot.get('menus')
const menus = OrderMenuArraySchema.parse(menusRaw) as OrderMenuType[]
```

### 型のインポート

スキーマから型定義をインポートして使用する場合：

```typescript
import { EventOrderStatusType } from '@shokujii/common/schemas/EventOrder.js'
import { CommunityMemberRolesType } from '@shokujii/common/schemas/CommunityMember.js'
import { RawEventStatusType } from '@shokujii/common/schemas/Event.js'

// 型として使用
async function getOrders(status?: EventOrderStatusType): Promise<EventOrder[]> {
  // ...
}
```

## 4. 実装例

### 例1: シンプルなストア実装（User）

```typescript
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'
import {
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
} from 'firebase-admin/firestore'

export class ShokujiiUser extends User {
  user_email: string = ''

  constructor(id: string, data: Partial<User> & Partial<UserPersonalInformation>) {
    super(id, data)
    Object.assign(this, new UserPersonalInformation(id, data))
  }
}

const userConverter: FirestoreDataConverter<ShokujiiUser> = {
  toFirestore(user: ShokujiiUser): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiUser {
    return new ShokujiiUser(snapshot.id, snapshot.data())
  },
}

export const getUser = async (userId: string): Promise<ShokujiiUser | undefined> => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(userId).withConverter(userConverter)
  const user = (await userRef.get()).data()
  return user ?? undefined
}

export const saveUser = async (user: ShokujiiUser, transaction?: Transaction) => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(user.id).withConverter(userConverter)
  if (transaction === undefined) {
    await userRef.set(user, { merge: true })
  } else {
    transaction.set(userRef, user, { merge: true })
  }
}
```

### 例2: パラメータ付きのストア実装（Event）

```typescript
import { Event } from '@shokujii/common/schemas/Event.js'
import {
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
} from 'firebase-admin/firestore'

class ShokujiiEventConverter implements FirestoreDataConverter<ShokujiiEvent> {
  constructor(private readonly userId?: string) {}

  toFirestore(event: ShokujiiEvent): DocumentData {
    if (this.userId == null) {
      throw new Error('userId is required')
    }
    return event.toFirestore(this.userId)
  }

  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiEvent {
    return new ShokujiiEvent(snapshot.id, snapshot.data())
  }
}

export class ShokujiiEvent extends Event {
  // 追加のメソッドを実装...
}

export const getEvent = async (eventId: string, transaction?: Transaction): Promise<ShokujiiEvent | undefined> => {
  const db = getFirestore()
  const eventRef = db
    .collectionGroup('events')
    .where('event_id', '==', eventId)
    .limit(1)
    .withConverter(new ShokujiiEventConverter())
  const eventData = await (transaction === undefined ? eventRef.get() : transaction.get(eventRef))
  return eventData.empty ? undefined : eventData.docs[0].data()
}

export const saveEvent = async (userId: string, event: ShokujiiEvent, transaction?: Transaction): Promise<void> => {
  const db = getFirestore()
  const eventRef = db
    .collection('communities')
    .doc(event.community_id)
    .collection('events')
    .doc(event.id)
    .withConverter(new ShokujiiEventConverter(userId))
  if (transaction === undefined) {
    await eventRef.set(event, { merge: true })
  } else {
    transaction.set(eventRef, event, { merge: true })
  }
}
```

### 例3: API リクエストのバリデーション

```typescript
import { onCall, HttpsError } from 'firebase-functions/https'
import { UpdateMenuCountInCartRequestSchema } from '@shokujii/common/apis/order.js'
import { OrderMenuArraySchema, OrderMenuType } from '@shokujii/common/schemas/EventOrder.js'
import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

export const updateMenuCountInCart = onCall(async (request) => {
  // 認証チェック
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  // 引数の取得とバリデーション
  const validatedData = UpdateMenuCountInCartRequestSchema.parse(request.data)
  const { community_id, event_id, order_id, menu_id, count } = validatedData

  return db.runTransaction(async (transaction) => {
    const orderRef = db
      .collection('communities')
      .doc(community_id)
      .collection('events')
      .doc(event_id)
      .collection('orders')
      .doc(order_id)

    const orderSnapshot = await transaction.get(orderRef)

    if (orderSnapshot == null || !orderSnapshot.exists) {
      throw new HttpsError('not-found', `注文が見つかりません: ${orderRef.path}`)
    }

    // Firestore から取得したデータをバリデーション
    const menusRaw = orderSnapshot.get('menus')
    const menus = OrderMenuArraySchema.parse(menusRaw) as OrderMenuType[]

    // 処理を続行...
  })
})
```

## 5. チェックリスト

新しい機能を実装する際のチェックリスト：

### Firestore データの読み書き

- [ ] `common/src/schemas` から適切なクラスをインポートしているか
- [ ] `FirestoreDataConverter` を実装しているか
- [ ] `toFirestore()` メソッドを正しく使用しているか
- [ ] コンストラクタで `snapshot.data()` を正しく渡しているか
- [ ] Transaction をサポートしているか（必要に応じて）
- [ ] 拡張クラスが必要な場合は、適切に継承しているか

### API リクエスト/レスポンスのバリデーション

- [ ] `common/src/apis` から適切なスキーマをインポートしているか
- [ ] `onCall` 関数内でリクエストデータをバリデーションしているか
- [ ] 認証チェックを適切に行っているか
- [ ] エラーハンドリングが適切か

### スキーマの部分的な使用

- [ ] 必要な部分スキーマ（配列スキーマなど）をインポートしているか
- [ ] Firestore から取得したデータを適切にバリデーションしているか
- [ ] 型定義を適切にインポートして使用しているか

## 6. よくあるパターン

### パターン1: 複数のスキーマを組み合わせる

```typescript
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'

export class ShokujiiUser extends User {
  user_email: string = ''

  constructor(id: string, data: Partial<User> & Partial<UserPersonalInformation>) {
    super(id, data)
    Object.assign(this, new UserPersonalInformation(id, data))
  }
}
```

### パターン2: サブコレクションの読み書き

```typescript
import { EventOrderStatusType } from '@shokujii/common/schemas/EventOrder.js'
import { EventOrder } from '@shokujii/common/schemas/EventOrder.js'
import { Transaction } from 'firebase-admin/firestore'

export class ShokujiiEvent extends Event {
  async getOrders(status?: EventOrderStatusType, transaction?: Transaction): Promise<EventOrder[]> {
    const db = getFirestore()
    const ordersRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .withConverter(new ShokujiiEventOrderConverter())
    const snapshot = await (transaction === undefined ? ordersRef.get() : transaction.get(ordersRef))
    const orders = snapshot.docs.map((doc) => doc.data())
    return status === undefined ? orders : orders.filter((order) => order.status === status)
  }
}
```

### パターン3: CollectionGroup クエリ

```typescript
export const getEvent = async (eventId: string, transaction?: Transaction): Promise<ShokujiiEvent | undefined> => {
  const db = getFirestore()
  const eventRef = db
    .collectionGroup('events')
    .where('event_id', '==', eventId)
    .limit(1)
    .withConverter(new ShokujiiEventConverter())
  const eventData = await (transaction === undefined ? eventRef.get() : transaction.get(eventRef))
  return eventData.empty ? undefined : eventData.docs[0].data()
}
```

## 7. 注意事項

### スキーマクラスの使用

- **必ず `toFirestore()` メソッドを使用する**: 直接 Firestore に書き込むのではなく、クラスの `toFirestore()` メソッドを使用してください。これにより、データの整合性が保証されます。
- **コンストラクタで初期化**: Firestore から読み込む際は、必ずクラスのコンストラクタを使用して初期化してください。
- **Transaction のサポート**: 可能な限り Transaction をサポートするように実装してください。

### API バリデーション

- **必ずバリデーションを行う**: `onCall` 関数内では、必ずリクエストデータをバリデーションしてください。
- **認証チェック**: 認証が必要な関数では、必ず `request.auth?.uid` をチェックしてください。
- **エラーメッセージ**: エラーメッセージは日本語で明確に記述してください。

### 型安全性

- **型定義の使用**: 可能な限り型定義をインポートして使用し、`any` の使用を避けてください。
- **型アサーション**: 型アサーション（`as`）は最小限に抑え、必要な場合のみ使用してください。

## 8. 参考ファイル

### stores ディレクトリ

- `functions/default/src/stores/user.ts` - シンプルなストア実装の例
- `functions/default/src/stores/event.ts` - パラメータ付きのストア実装の例
- `functions/default/src/stores/community.ts` - サブコレクションの読み書きの例
- `functions/default/src/stores/letter.ts` - CollectionGroup クエリの例

### API 実装

- `functions/default/src/orders.ts` - API リクエストのバリデーションの例
- `functions/default/src/user.ts` - 複数の API エンドポイントの実装例
- `functions/default/src/stripe.ts` - 型定義を使用した API 実装の例

### common/src/apis

- `common/src/apis/order.ts` - API スキーマ定義の例
- `common/src/apis/user.ts` - 型定義のみの API スキーマの例
- `common/src/apis/letter.ts` - シンプルな API スキーマの例

### common/src/schemas

- `common/src/schemas/User.ts` - シンプルなスキーマクラスの例
- `common/src/schemas/Event.ts` - パラメータ付きの toFirestore メソッドの例
- `common/src/schemas/EventOrder.ts` - 部分スキーマ（配列スキーマ）の例

## 9. 関連ドキュメント

- [schemas における zod の使い方](./schemas%20における%20zod%20の使い方.md) - `common/src/schemas` での zod スキーマの定義方法
