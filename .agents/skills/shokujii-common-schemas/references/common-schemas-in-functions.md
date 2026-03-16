# functions における common/schemas の使い方

`functions/default/src` で `common/src/schemas` を使用する際のパターン。`documents/実装メモ/functionsにおける common_schemas の使い方.md` の要約。

## 目次

1. [Firestore の読み書き](#firestore-の読み書き)
2. [拡張クラス](#拡張クラス)
3. [パラメータ付き toFirestore](#パラメータ付き-tofirestore)
4. [API バリデーション](#api-バリデーション)
5. [common/src/apis の新規定義](#commonsrcapis-の新規定義)
6. [部分スキーマの使用](#部分スキーマの使用)
7. [参考ファイル](#参考ファイル)

## Firestore の読み書き

### 基本的なパターン

stores では `common/src/schemas` のクラスをインポートし、FirestoreDataConverter で変換する。

```typescript
import { User } from '@shokujii/common/schemas/User.js'
import { FirestoreDataConverter, QueryDocumentSnapshot, DocumentData } from 'firebase-admin/firestore'

const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): User {
    return new User(snapshot.id, snapshot.data())
  },
}
```

### 保存と読み込み

```typescript
export const saveUser = async (user: ShokujiiUser, transaction?: Transaction) => {
  const userRef = db.collection('users').doc(user.id).withConverter(userConverter)
  if (transaction === undefined) {
    await userRef.set(user, { merge: true })
  } else {
    transaction.set(userRef, user, { merge: true })
  }
}

export const getUser = async (userId: string) => {
  const userRef = db.collection('users').doc(userId).withConverter(userConverter)
  return (await userRef.get()).data() ?? undefined
}
```

必ず `toFirestore()` メソッドを使用する。直接 Firestore に書き込まない。`toFirestore` は store の FirestoreDataConverter 経由で呼ばれる。shokujii-firestore スキルが store 経由の Firestore 操作を定めており、その store が common schema を利用する関係。

## 拡張クラス

複数スキーマを組み合わせる場合、クラスを拡張する。

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

## パラメータ付き toFirestore

Event のように toFirestore に userId が必要な場合、Converter クラスでパラメータを管理する。

```typescript
class ShokujiiEventConverter implements FirestoreDataConverter<ShokujiiEvent> {
  constructor(private readonly userId?: string) {}

  toFirestore(event: ShokujiiEvent): DocumentData {
    if (this.userId == null) throw new Error('userId is required')
    return event.toFirestore(this.userId)
  }

  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiEvent {
    return new ShokujiiEvent(snapshot.id, snapshot.data())
  }
}

export const saveEvent = async (userId: string, event: ShokujiiEvent, transaction?: Transaction) => {
  const eventRef = db
    .collection('communities')
    .doc(event.community_id)
    .collection('events')
    .doc(event.id)
    .withConverter(new ShokujiiEventConverter(userId))
  // ...
}
```

## API バリデーション

onCall 関数内で `common/src/apis` の zod スキーマでリクエストをバリデーションする。

```typescript
import { sendTestLetterRequestSchema } from '@shokujii/common/apis/letter.js'

export const sendTestLetter = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) throw new HttpsError('unauthenticated', '認証が必要です')

  const validatedData = sendTestLetterRequestSchema.parse(request.data)
  const { communityId, letterId } = validatedData
  // ...
})
```

## common/src/apis の新規定義

API の Request/Response 型を追加する際のパターン。

**型のみ**（user.ts、order.ts）: TypeScript の型定義を export。Callable の型パラメータや手動バリデーションで使用。

```typescript
export type UpdateProfileFromProvidersRequest = { additionalInfo: Partial<User> }
export type UpdateProfileFromProvidersResponse = { user: User & { user_email?: string } }
```

**Zod スキーマ**（letter.ts）: バリデーションが必要な場合は z.object を export。`Schema.parse(request.data)` で使用。

```typescript
import { z } from 'zod'

export const sendTestLetterRequestSchema = z.object({
  communityId: z.string().nonempty(),
  letterId: z.string().nonempty(),
})
```

参考: `common/src/apis/user.ts`（型のみ）、`common/src/apis/letter.ts`（Zod スキーマ）

## 部分スキーマの使用

配列スキーマや型のインポート:

```typescript
import { OrderMenuArraySchema, OrderMenuType } from '@shokujii/common/schemas/EventOrder.js'
import { EventOrderStatusType } from '@shokujii/common/schemas/EventOrder.js'

const menusRaw = orderSnapshot.get('menus')
const menus = OrderMenuArraySchema.parse(menusRaw) as OrderMenuType[]

async function getOrders(status?: EventOrderStatusType): Promise<EventOrder[]> { ... }
```

## 参考ファイル

- `functions/default/src/stores/user.ts` - シンプルなストア
- `functions/default/src/stores/event.ts` - パラメータ付き Converter
- `functions/default/src/orders.ts` - API バリデーション
- `common/src/apis/user.ts` - 型のみの API 定義
- `common/src/apis/letter.ts` - Zod スキーマの API 定義
- `common/src/apis/order.ts` - 型のみの API 定義
