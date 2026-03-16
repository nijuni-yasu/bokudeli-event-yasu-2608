# functions における Firestore Store パターン

functions パッケージ（`functions/default/src/stores/`）で Firestore を扱う際のパターン。Callable / Trigger / Scheduled の各 Function から store を経由して Firestore にアクセスする。

**詳細**: プロジェクトルート（リポジトリルート）からの相対パス `documents/実装メモ/functionsにおける store の使い方.md` に 600 行超の完全なドキュメントがある。新規 store の追加や複雑なパターンはそちらを参照すること。

## 概要

- **SDK**: `firebase-admin/firestore`（Admin SDK）
- **取得**: `getFirestore()` で db インスタンスを取得
- **パターン**: getXXX / saveXXX の非同期関数、拡張クラスのメソッド
- **Transaction**: 可能な限りサポート。複数操作時は同じ transaction を渡す

## 1. 基本的なパターン

```typescript
import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { User } from '@shokujii/common/schemas/User.js'

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
  return (await userRef.get()).data()
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

## 2. パラメータ付き Converter

`toFirestore(userId)` のようにパラメータが必要な場合、Converter クラスで管理する。

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
```

## 3. サブコレクションの Converter

親の ID は `fromFirestore` で `snapshot.ref.parent.parent!.id` から取得する。

```typescript
class ShokujiiEventOrderConverter implements FirestoreDataConverter<EventOrder> {
  fromFirestore(snapshot: QueryDocumentSnapshot): EventOrder {
    const eventId = snapshot.ref.parent.parent!.id
    return new EventOrder(eventId, snapshot.id, snapshot.data())
  }
  // ...
}
```

## 4. CollectionGroup クエリ

```typescript
const eventRef = db
  .collectionGroup('events')
  .where('event_id', '==', eventId)
  .limit(1)
  .withConverter(new ShokujiiEventConverter())
```

## 5. Transaction 内での使用

- 複数操作時は `db.runTransaction()` 内で実行
- すべての store 関数に同じ `transaction` を渡す
- 注意: `getUser` 等、Transaction をサポートしていない関数もある。その場合は Transaction 外で取得する

```typescript
return db.runTransaction(async (transaction) => {
  const event = await getEvent(eventId, transaction)
  const user = await getUser(userId)  // Transaction 非対応の場合は外で取得
  // ...
  await saveEvent(userId, event, transaction)
})
```

## 6. 拡張クラスのメソッドパターン

getXXX / saveXXX のトップレベル関数に加え、拡張クラス（例: ShokujiiEvent）にインスタンスメソッドを実装するパターン。サブコレクションの操作をエンティティに紐づけて記述できる。

```typescript
// ShokujiiEvent クラスに getOrders, saveOrder, getMenus, saveMenu 等を実装
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
    return snapshot.docs.map((doc) => doc.data())
  }

  async saveOrder(order: EventOrder, transaction?: Transaction): Promise<void> {
    const db = getFirestore()
    const orderRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .doc(order.id)
      .withConverter(new ShokujiiEventOrderConverter())
    if (transaction === undefined) {
      await orderRef.set(order, { merge: true })
    } else {
      transaction.set(orderRef, order, { merge: true })
    }
  }
}
```

使用例: getEvent で取得した ShokujiiEvent に対して、event.getOrders(), event.saveOrder() を呼ぶ。Transaction をサポートするメソッドには transaction を渡す。getMembers 等、Transaction 非対応のメソッドもある。

## 7. 関数ファイルでの使用

- `db.collection()` 等を直接呼ばない
- store の getXXX / saveXXX を import して使用する
- 拡張クラスのメソッド（event.getOrders(), event.saveOrder() 等）も併用する

```typescript
import { getUser, saveUser } from './stores/user.js'
import { getEvent, saveEvent } from './stores/event.js'

export const someFunction = onCall(async (request) => {
  const user = await getUser(uid, true)
  const event = await getEvent(eventId)
  if (event == null) throw new HttpsError('not-found', 'イベントが見つかりません')
  const orders = await event.getOrders('in_cart')  // 拡張クラスのメソッド
  // ...
})
```

## 参考ファイル

- `functions/default/src/stores/user.ts`
- `functions/default/src/stores/event.ts` - サブコレクション、CollectionGroup、パラメータ付き Converter
- `functions/default/src/stores/community.ts`
- `functions/default/src/stores/letter.ts` - DocumentReference の直接更新
- `functions/default/src/stores/partner.ts` - ドキュメントが存在しないエンティティ
