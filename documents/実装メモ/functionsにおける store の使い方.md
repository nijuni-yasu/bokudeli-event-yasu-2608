# functions/default における stores の使い方

このドキュメントは、`functions/default/src` で `functions/default/src/stores` を使用する際の一貫性のあるパターンを説明します。

## 概要

`functions/default/src/stores` は、Firestore とのデータの読み書きを抽象化し、型安全性と一貫性を保つためのレイヤーです。各ストアは以下の要素で構成されます：

1. **スキーマクラスの拡張** - `common/src/schemas` のクラスを拡張して、追加のメソッドやプロパティを実装
2. **FirestoreDataConverter の実装** - Firestore との変換ロジックを定義
3. **CRUD 操作関数** - データの取得、保存、削除などの操作を提供
4. **Transaction サポート** - トランザクション内での操作をサポート

## 1. 基本的なストアの実装パターン

### 1.1. シンプルなストア（User の例）

最もシンプルなパターンです。単一のコレクションに対する基本的な CRUD 操作を提供します。

```typescript
import {
  DocumentData,
  FirestoreDataConverter,
  getFirestore,
  QueryDocumentSnapshot,
  Transaction,
} from 'firebase-admin/firestore'
import { User } from '@shokujii/common/schemas/User.js'
import { UserPersonalInformation } from '@shokujii/common/schemas/UserPersonalInformation.js'

// スキーマクラスの拡張
export class ShokujiiUser extends User {
  user_email: string = ''

  constructor(id: string, data: Partial<User> & Partial<UserPersonalInformation>) {
    super(id, data)
    Object.assign(this, new UserPersonalInformation(id, data))
  }
}

// FirestoreDataConverter の実装
const userConverter: FirestoreDataConverter<ShokujiiUser> = {
  toFirestore(user: ShokujiiUser): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ShokujiiUser {
    return new ShokujiiUser(snapshot.id, snapshot.data())
  },
}

// 取得関数
export const getUser = async (userId: string, withPersonalInformation: boolean): Promise<ShokujiiUser | undefined> => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(userId).withConverter(userConverter)
  const user = (await userRef.get()).data()
  if (user == null) {
    return undefined
  }
  if (withPersonalInformation) {
    const userPersonalInformation = await getUserPersonalInformation(userId)
    user.user_email = userPersonalInformation?.user_email ?? ''
  }
  return user
}

// 保存関数
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

### 1.2. パラメータ付き Converter（Event の例）

`toFirestore()` メソッドに追加のパラメータが必要な場合、Converter クラスを作成してパラメータを管理します。

```typescript
import {
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
} from 'firebase-admin/firestore'
import { Event } from '@shokujii/common/schemas/Event.js'

// パラメータ付き Converter
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

// 取得関数（パラメータ不要）
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

// 保存関数（userId が必要）
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

### 1.3. サブコレクションの操作

親ドキュメントの拡張クラス内に、サブコレクションの操作メソッドを実装します。

```typescript
export class ShokujiiEvent extends Event {
  // サブコレクション（orders）の取得
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

  // サブコレクション（orders）の単一取得
  async getOrder(orderId: string, transaction?: Transaction): Promise<EventOrder | undefined> {
    const db = getFirestore()
    const orderRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .collection('orders')
      .doc(orderId)
      .withConverter(new ShokujiiEventOrderConverter())
    const snapshot = await (transaction === undefined ? orderRef.get() : transaction.get(orderRef))
    return snapshot.data()
  }

  // サブコレクション（orders）の保存
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

### 1.4. サブコレクションの Converter 実装

サブコレクションのドキュメントは、親ドキュメントの ID を参照する必要がある場合があります。その場合、`fromFirestore` で親の ID を取得します。

```typescript
class ShokujiiEventOrderConverter implements FirestoreDataConverter<EventOrder> {
  toFirestore(order: EventOrder): DocumentData {
    return order.toFirestore()
  }
  fromFirestore(snapshot: QueryDocumentSnapshot): EventOrder {
    const eventId = snapshot.ref.parent.parent!.id
    return new EventOrder(eventId, snapshot.id, snapshot.data())
  }
}
```

### 1.5. CollectionGroup クエリ

複数のコレクションにまたがってクエリを実行する場合、`collectionGroup` を使用します。

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

### 1.6. 複合クエリ

複数の条件を組み合わせたクエリを実行します。

```typescript
export const getAllAcceptingOrderEvents = async (
  targetDateTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('is_public', '==', true)
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(targetDateTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}
```

## 2. 関数ファイルでの stores の使用

### 2.1. 基本的なインポートと使用

```typescript
import { getUser, saveUser, ShokujiiUser } from './stores/user.js'
import { getEvent, saveEvent, ShokujiiEvent } from './stores/event.js'
import { getCommunity } from './stores/community.js'

export const someFunction = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  // ユーザーを取得
  const user = await getUser(uid, true)
  if (user == null) {
    throw new HttpsError('not-found', 'ユーザーが見つかりません')
  }

  // イベントを取得
  const event = await getEvent(eventId)
  if (event == null) {
    throw new HttpsError('not-found', 'イベントが見つかりません')
  }

  // 処理を続行...
})
```

### 2.2. Transaction 内での使用

トランザクション内で複数の操作を行う場合、すべての stores 関数に同じ `transaction` オブジェクトを渡します。

**注意**: すべての stores 関数が Transaction をサポートしているわけではありません。例えば、`getUser` は Transaction をサポートしていないため、Transaction 内で使用する場合は、Transaction 外で取得するか、別の方法を検討してください。

```typescript
import { getFirestore } from 'firebase-admin/firestore'
import { getEvent, saveEvent } from './stores/event.js'
import { getUser, saveUser } from './stores/user.js'

const db = getFirestore()

export const someFunction = onCall(async (request) => {
  return db.runTransaction(async (transaction) => {
    // Transaction を渡して取得（Transaction をサポートしている関数のみ）
    const event = await getEvent(eventId, transaction)
    
    // getUser は Transaction をサポートしていないため、Transaction 外で取得
    // または、Transaction 内で必要な場合は別の方法を検討
    const user = await getUser(userId, false)

    if (event == null || user == null) {
      throw new HttpsError('not-found', 'データが見つかりません')
    }

    // データを更新
    event.someProperty = 'new value'
    user.someProperty = 'new value'

    // Transaction を渡して保存
    await saveEvent(userId, event, transaction)
    await saveUser(user, transaction)
  })
})
```

### 2.3. 拡張クラスのメソッドの使用

拡張クラスに実装されたメソッドを使用します。

```typescript
import { getEvent, ShokujiiEvent } from './stores/event.js'

export const someFunction = onCall(async (request) => {
  const event = await getEvent(eventId)
  if (event == null) {
    throw new HttpsError('not-found', 'イベントが見つかりません')
  }

  // 拡張クラスのメソッドを使用
  const orders = await event.getOrders('in_cart')
  const menus = await event.getMenus()
  const members = await event.getMembers(true)
})
```

### 2.4. 拡張クラスのメソッド内での Transaction 使用

拡張クラスのメソッド内でも Transaction をサポートします。

**注意**: すべての拡張クラスのメソッドが Transaction をサポートしているわけではありません。例えば、`ShokujiiEvent.getMembers()` は Transaction をサポートしていないため、Transaction 内で使用する場合は注意が必要です。

```typescript
import { getFirestore } from 'firebase-admin/firestore'
import { getEvent } from './stores/event.js'

const db = getFirestore()

export const someFunction = onCall(async (request) => {
  return db.runTransaction(async (transaction) => {
    const event = await getEvent(eventId, transaction)
    if (event == null) {
      throw new HttpsError('not-found', 'イベントが見つかりません')
    }

    // Transaction を渡して拡張クラスのメソッドを呼び出す（Transaction をサポートしているメソッドのみ）
    const orders = await event.getOrders('in_cart', transaction)
    const order = await event.getOrder(orderId, transaction)

    // getMembers は Transaction をサポートしていないため、Transaction 外で取得
    // const members = await event.getMembers(true)

    // 処理を続行...
  })
})
```

### 2.5. 複数のストアを組み合わせた使用

複数のストアを組み合わせて使用します。

```typescript
import { getCommunity } from './stores/community.js'
import { getEvent } from './stores/event.js'
import { getUser } from './stores/user.js'
import { getEventPartnerShop } from './stores/partner.js'

export const someFunction = onCall(async (request) => {
  const community = await getCommunity(communityId)
  const event = await getEvent(eventId)
  const user = await getUser(userId, true)
  const shop = await getEventPartnerShop(event)

  if (community == null || event == null || user == null || shop == null) {
    throw new HttpsError('not-found', 'データが見つかりません')
  }

  // 処理を続行...
})
```

## 3. 特殊なパターン

### 3.1. ドキュメントが存在しないエンティティ（Partner の例）

Partner はドキュメントが存在せず、サブコレクション（menus, shops）のみが存在する場合があります。

```typescript
export class Partner {
  constructor(readonly id: string) {}

  async getMenus(transaction?: Transaction): Promise<PartnerMenu[]> {
    const db = getFirestore()
    const menusRef = db
      .collection('partners')
      .doc(this.id)
      .collection('menus')
      .withConverter(new PartnerMenuConverter())
    const snapshot = await (transaction === undefined ? menusRef.get() : transaction.get(menusRef))
    return snapshot.docs.map((doc) => doc.data())
  }
}

// ドキュメントが存在しないため、サブコレクションの存在で判定
export const getPartner = async (id: string): Promise<Partner | undefined> => {
  const db = getFirestore()
  const shopsRef = db.collection('partners').doc(id).collection('shops').withConverter(new PartnerShopConverter())
  const shops = await shopsRef.listDocuments()
  return shops.length !== 0 ? new Partner(id) : undefined
}
```

### 3.2. キャッシュ付きのメソッド（Community の例）

パフォーマンス向上のため、一度取得したデータをキャッシュする場合があります。

```typescript
export class ShokujiiCommunity extends Community {
  private _members: CommunityMember[] | null = null

  async getMembers(): Promise<CommunityMember[]> {
    if (this._members === null) {
      const db = getFirestore()
      const snapshot = await db
        .collection('communities')
        .doc(this.id)
        .collection('members')
        .withConverter(communityMemberConverter)
        .get()
      this._members = snapshot.docs.map((doc) => doc.data())
    }
    return this._members
  }
}
```

### 3.3. 複数のコレクションへの保存（User の例）

1つのエンティティが複数のコレクションに分割されている場合、すべてのコレクションに保存します。

```typescript
export const saveUser = async (user: ShokujiiUser, transaction?: Transaction) => {
  const db = getFirestore()
  const userRef = db.collection('users').doc(user.id).withConverter(userConverter)
  const userPersonalInformationRef = db
    .collection('users_personal_information')
    .doc(user.id)
    .withConverter(userPersonalInformationConverter)
  const upi = new UserPersonalInformation(user.id, {
    user_email: user.user_email,
  })
  if (transaction === undefined) {
    await userRef.set(user, { merge: true })
    await userPersonalInformationRef.set(upi, { merge: true })
  } else {
    transaction.set(userRef, user, { merge: true })
    transaction.set(userPersonalInformationRef, upi, { merge: true })
  }
}
```

### 3.4. 拡張クラス内での自己保存（Event の例）

拡張クラスのメソッド内で、自分自身を保存する場合があります。

```typescript
export class ShokujiiEvent extends Event {
  async updateEventStatus(status: RawEventStatusType, transaction?: Transaction): Promise<void> {
    const userId = this.updated_by || this.created_by
    if (!userId) {
      throw new Error('Cannot update event status: no updated_by or created_by found')
    }

    // インスタンスのステータスを更新
    this.event_status.value = status

    // 自分自身を保存
    const db = getFirestore()
    const eventRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .withConverter(new ShokujiiEventConverter(userId))

    if (transaction === undefined) {
      await eventRef.set(this, { merge: true })
    } else {
      transaction.set(eventRef, this, { merge: true })
    }
  }
}
```

### 3.5. DocumentReference からの変換

Firestore の DocumentReference からエンティティを取得する場合があります。

```typescript
export const convertReferenceToEvent = async (
  eventRef: DocumentReference<DocumentData, DocumentData>,
): Promise<ShokujiiEvent | undefined> => {
  const eventSnapshot = await eventRef.withConverter(new ShokujiiEventConverter()).get()
  return eventSnapshot.data()
}
```

### 3.6. DocumentReference の直接更新

CollectionGroup クエリなどで取得した DocumentReference を直接更新する場合があります。このパターンは、エンティティ全体を再取得・再保存する必要がない場合に有効です。

```typescript
export const getScheduledLetters = async (
  endTime: number,
  transaction?: Transaction,
): Promise<{ letter: Letter; ref: DocumentReference }[]> => {
  const db = getFirestore()
  const lettersRef = db
    .collectionGroup('letters')
    .where('status', '==', 'timed')
    .where('scheduled_at', '<=', Timestamp.fromMillis(endTime))
    .withConverter(letterConverter)

  const snapshot = await (transaction === undefined ? lettersRef.get() : transaction.get(lettersRef))
  return snapshot.docs.map((doc) => ({
    letter: doc.data(),
    ref: doc.ref,
  }))
}

export const updateSentStatus = async (ref: DocumentReference, transaction?: Transaction): Promise<void> => {
  if (transaction) {
    transaction.update(ref, { status: 'sent', sent_at: Timestamp.now() })
  } else {
    await ref.update({ status: 'sent', sent_at: Timestamp.now() })
  }
}
```

使用例：

```typescript
import { getFirestore, Transaction } from 'firebase-admin/firestore'
import { getScheduledLetters, updateSentStatus } from './stores/letter.js'

const db = getFirestore()

export const sendScheduledLetters = async () => {
  return db.runTransaction(async (transaction) => {
    const lettersWithRefs = await getScheduledLetters(Date.now(), transaction)
    
    for (const { letter, ref } of lettersWithRefs) {
      // メール送信処理...
      
      // DocumentReference を直接更新
      await updateSentStatus(ref, transaction)
    }
  })
}
```

## 4. 実装例

### 例1: シンプルなストア実装（Config）

```typescript
import { DocumentData, FirestoreDataConverter, getFirestore, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { ConfigGlobal } from '@shokujii/common/schemas/Config.js'

const configGlobalConverter: FirestoreDataConverter<ConfigGlobal> = {
  toFirestore(config: ConfigGlobal): DocumentData {
    return config.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot): ConfigGlobal {
    return new ConfigGlobal(snapshot.id, snapshot.data())
  },
}

export const getConfigGlobal = async (): Promise<ConfigGlobal | undefined> => {
  const db = getFirestore()
  const configRef = db.collection('configs').doc('global').withConverter(configGlobalConverter)
  const snapshot = await configRef.get()
  return snapshot.exists ? (snapshot.data() ?? undefined) : undefined
}
```

### 例2: 複雑なストア実装（Event）

```typescript
import {
  getFirestore,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  DocumentData,
  Transaction,
  Timestamp,
} from 'firebase-admin/firestore'
import { Event, type RawEventStatusType } from '@shokujii/common/schemas/Event.js'
import { EventOrder, EventOrderStatusType } from '@shokujii/common/schemas/EventOrder.js'
import { EventMenu } from '@shokujii/common/schemas/EventMenu.js'

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

  async updateEventStatus(status: RawEventStatusType, transaction?: Transaction): Promise<void> {
    const userId = this.updated_by || this.created_by
    if (!userId) {
      throw new Error('Cannot update event status: no updated_by or created_by found')
    }
    this.event_status.value = status
    const db = getFirestore()
    const eventRef = db
      .collection('communities')
      .doc(this.community_id)
      .collection('events')
      .doc(this.id)
      .withConverter(new ShokujiiEventConverter(userId))
    if (transaction === undefined) {
      await eventRef.set(this, { merge: true })
    } else {
      transaction.set(eventRef, this, { merge: true })
    }
  }
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

### 例3: 関数ファイルでの使用

```typescript
import { onCall, HttpsError } from 'firebase-functions/https'
import { getFirestore } from 'firebase-admin/firestore'
import { getCommunity } from './stores/community.js'
import { getEvent, ShokujiiEvent } from './stores/event.js'
import { getUser } from './stores/user.js'

const db = getFirestore()

export const someFunction = onCall(async (request) => {
  const uid = request.auth?.uid
  if (uid == null) {
    throw new HttpsError('unauthenticated', '認証が必要です')
  }

  return db.runTransaction(async (transaction) => {
    const community = await getCommunity(communityId, transaction)
    const event = await getEvent(eventId, transaction)
    const user = await getUser(uid, true)

    if (community == null || event == null || user == null) {
      throw new HttpsError('not-found', 'データが見つかりません')
    }

    // 拡張クラスのメソッドを使用
    const orders = await event.getOrders('in_cart', transaction)
    const members = await event.getMembers(true)

    // 処理を続行...
  })
})
```

## 5. チェックリスト

新しいストアを実装する際のチェックリスト：

### 基本的な実装

- [ ] `common/src/schemas` から適切なクラスをインポートしているか
- [ ] 必要に応じて拡張クラスを作成しているか
- [ ] `FirestoreDataConverter` を実装しているか
- [ ] `toFirestore()` メソッドを正しく使用しているか
- [ ] コンストラクタで `snapshot.data()` を正しく渡しているか
- [ ] Transaction をサポートしているか（可能な限り）

### 取得関数

- [ ] `getXXX` 関数を実装しているか
- [ ] Transaction パラメータをサポートしているか
- [ ] 存在しない場合の処理（`undefined` を返す）を実装しているか
- [ ] CollectionGroup クエリが必要な場合は実装しているか

### 保存関数

- [ ] `saveXXX` 関数を実装しているか
- [ ] Transaction パラメータをサポートしているか
- [ ] `{ merge: true }` オプションを使用しているか（必要に応じて）
- [ ] パラメータ付き Converter が必要な場合は実装しているか

### サブコレクション

- [ ] サブコレクションの操作が必要な場合は、拡張クラスにメソッドを実装しているか
- [ ] サブコレクションの Converter で親の ID を正しく取得しているか
- [ ] Transaction をサポートしているか

### 関数ファイルでの使用

- [ ] stores から適切な関数やクラスをインポートしているか
- [ ] Transaction 内で使用する場合は、すべての stores 関数に Transaction を渡しているか
- [ ] 拡張クラスのメソッドを使用する場合は、Transaction を渡しているか（必要に応じて）

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

### パターン4: 複合クエリ

```typescript
export const getAllAcceptingOrderEvents = async (
  targetDateTimeMillis: number,
  transaction?: Transaction,
): Promise<ShokujiiEvent[]> => {
  const db = getFirestore()
  const eventsRef = db
    .collectionGroup('events')
    .where('event_status.value', '==', 'accepting_order')
    .where('is_public', '==', true)
    .where('event_deadline_datetime', '>', Timestamp.fromMillis(targetDateTimeMillis))
    .where('is_deleted', '==', false)
    .withConverter(new ShokujiiEventConverter())
  const eventsSnapshot = await (transaction === undefined ? eventsRef.get() : transaction.get(eventsRef))
  return eventsSnapshot.docs.map((doc) => doc.data())
}
```

## 7. 注意事項

### Converter の実装

- **必ず `toFirestore()` メソッドを使用する**: 直接 Firestore に書き込むのではなく、クラスの `toFirestore()` メソッドを使用してください。これにより、データの整合性が保証されます。
- **コンストラクタで初期化**: Firestore から読み込む際は、必ずクラスのコンストラクタを使用して初期化してください。
- **パラメータが必要な場合**: `toFirestore()` にパラメータが必要な場合は、Converter クラスを作成してパラメータを管理してください。

### Transaction のサポート

- **可能な限り Transaction をサポート**: すべての stores 関数で Transaction をサポートするように実装してください。
- **Transaction の一貫性**: Transaction 内で複数の操作を行う場合、すべての stores 関数に同じ `transaction` オブジェクトを渡してください。
- **Transaction の取得**: Transaction 内で取得する場合は、`transaction.get()` を使用してください。
- **Transaction をサポートしない関数**: 一部の関数（例: `getUser`, `getMembers`）は Transaction をサポートしていません。これらの関数は、複数のコレクションからデータを取得する必要がある、またはキャッシュを使用しているなどの理由で、Transaction 内での使用が適切でない場合があります。Transaction 内で使用する場合は、Transaction 外で取得するか、別の方法を検討してください。

### エラーハンドリング

- **存在チェック**: 取得関数は、データが存在しない場合に `undefined` を返すように実装してください。
- **エラーメッセージ**: エラーメッセージは日本語で明確に記述してください。
- **必須パラメータのチェック**: パラメータが必要な場合は、適切にチェックしてください。

### 型安全性

- **型定義の使用**: 可能な限り型定義をインポートして使用し、`any` の使用を避けてください。
- **型アサーション**: 型アサーション（`as`）は最小限に抑え、必要な場合のみ使用してください。

### パフォーマンス

- **不要な取得を避ける**: 必要なデータのみを取得するようにしてください。
- **キャッシュの活用**: 適切な場合にキャッシュを活用してください（例: `ShokujiiCommunity.getMembers()`）。
- **バッチ操作**: 可能な限りバッチ操作を使用してください。

## 8. 参考ファイル

### stores ディレクトリ

- `functions/default/src/stores/user.ts` - シンプルなストア実装の例、複数のコレクションへの保存
- `functions/default/src/stores/event.ts` - パラメータ付きのストア実装の例、サブコレクションの操作、CollectionGroup クエリ
- `functions/default/src/stores/community.ts` - サブコレクションの読み書き、キャッシュの活用
- `functions/default/src/stores/letter.ts` - CollectionGroup クエリ、DocumentReference の使用
- `functions/default/src/stores/partner.ts` - ドキュメントが存在しないエンティティの例
- `functions/default/src/stores/passCode.ts` - シンプルなストア実装の例
- `functions/default/src/stores/config.ts` - シンプルなストア実装の例

### 関数ファイルでの使用例

- `functions/default/src/communityManager.ts` - 基本的な stores の使用例
- `functions/default/src/eventSnapshot.ts` - Transaction 内での stores の使用例
- `functions/default/src/orders.ts` - 関数内で Converter を直接使用する例（stores を使用しない場合）
- `functions/default/src/user.ts` - 複数の stores を組み合わせた使用例
- `functions/default/src/letter.ts` - 複数の stores を組み合わせた使用例

## 9. 関連ドキュメント

- [functions における zod の使い方](./functionsにおける%20zod%20の使い方.md) - `common/src/schemas` と `common/src/apis` の zod スキーマの使用方法
- [schemas における zod の使い方](./schemas%20における%20zod%20の使い方.md) - `common/src/schemas` での zod スキーマの定義方法
