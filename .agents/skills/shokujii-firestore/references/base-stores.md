# base における Firestore Store パターン

base パッケージ（`base/src/stores/`）で Firestore を扱う際のパターン。user と admin は base の store を経由して Firestore にアクセスする。

## 概要

- **SDK**: `firebase/firestore`（クライアント SDK。firebase-admin ではない）
- **状態管理**: Pinia の `defineStore`
- **リアルタイム**: `onSnapshot` で購読
- **参照取得**: `getUserRef(userId)` 等の xxxRef 関数で withConverter 付き DocumentReference を返す

## 1. xxxRef パターン

各コレクションに対し、withConverter 付きの DocumentReference を返す関数を定義する。

```typescript
// base/src/stores/user.ts
const userConverter: FirestoreDataConverter<User> = {
  toFirestore(user: User): DocumentData {
    return user.toFirestore()
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User {
    const data = snapshot.data(options)
    return new User(snapshot.id, data)
  },
}

/**
 * users コレクションの DocumentReference（withConverter 付き）を返す。
 * array-contains 等のクエリで使用する際も、必ずこの ref を使うこと。
 */
export const getUserRef = (userId: string): DocumentReference<User> => {
  return doc(db, 'users', userId).withConverter(userConverter)
}
```

## 2. Converter の実装（クライアント SDK）

クライアント SDK の `fromFirestore` は第2引数で `SnapshotOptions` を受け取る。

```typescript
fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): User {
  const data = snapshot.data(options)
  return new User(snapshot.id, data)
}
```

## 3. array-contains での使用

`where('managers', 'array-contains', ref)` のように DocumentReference が必要な場合、必ず xxxRef を使う。

```typescript
// OK: getUserRef を使う
query(
  collection(db, 'communities').withConverter(communityConverter),
  where('managers', 'array-contains', getUserRef(userId)),
)

// NG: doc(db, 'users', userId) を直接使う
where('managers', 'array-contains', doc(db, 'users', userId))  // 禁止
```

## 4. Pinia Store 内での Firestore 操作

store は `defineStore` 内で Firestore を呼ぶ。ref は xxxRef で取得する。

```typescript
export const useUserStore = (userId: string) => {
  const store = defineStore(`/users/${userId}`, () => {
    const userRef = getUserRef(userId)
    const user = ref<User | null>(null)

    const subscribe = () => {
      onSnapshot(userRef, (snapshot) => {
        user.value = snapshot.data() ?? new User(userId, {})
      })
    }

    const updateUser = async (data: User) => {
      await setDoc(userRef, data, { merge: true })
    }

    return { user, subscribe, updateUser }
  })
  return store()
}
```

## 5. サブコレクションの Converter

サブコレクションのドキュメントは、親の ID を `fromFirestore` で取得する。

```typescript
const menuConverter: FirestoreDataConverter<EventMenu> = {
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): EventMenu {
    const data = snapshot.data(options)
    const event_id = snapshot.ref.parent.parent!.id
    return new EventMenu(event_id, snapshot.id, data)
  },
  // ...
}
```

## 6. CollectionGroup クエリ

複数コレクションにまたがるクエリでは、`collectionGroup` に withConverter を付ける。

```typescript
query(
  collectionGroup(db, 'events'),
  where('event_id', '==', eventId),
).withConverter(eventConverter)
```

## 7. user / admin での利用

user と admin のページ・コンポーネントでは、**base の store のみ**を使用する。

- Firestore の `doc`、`collection`、`getDocs` 等を直接 import して使わない
- クエリが必要な場合は、base の store にヘルパー関数を追加する
- 既存の `useUserStore`、`useCommunityStore`、`useEventStore` 等を利用する

## 参考ファイル

- `base/src/stores/user.ts` - getUserRef、シンプルな store
- `base/src/stores/community.ts` - array-contains で getUserRef を使用
- `base/src/stores/event.ts` - サブコレクション、CollectionGroup
- `base/src/stores/orderList.ts` - collectionGroup、ページネーション
- `base/src/stores/partner.ts` - サブコレクションの onSnapshot

例外・TODO・違反の一覧は [common-rules.md](common-rules.md) の「例外・違反の一覧」を参照。
