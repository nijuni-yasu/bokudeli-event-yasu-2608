# firestore.rules 改修

関連イシュー: [#1882](https://github.com/nijuniinc/bokudeli-event-new/issues/1882)

## 概要

`firestore.rules` 末尾の `match /{document=**} { allow read: if true }` が、内側で定義した read 制限をすべて無効化している。
Firestore Security Rules は OR 評価（いずれかのマッチしたルールが許可すれば許可）のため、ワイルドカードがすべてのドキュメントに read を許可し、個別の制限が打ち消される。

## 影響を受けるパス

| パス | 意図した制限 | 現状（ワイルドカードにより） |
| :-- | :-- | :-- |
| `communities/{c}/events/{e}/stripes/{s}` | 本人のみ read | **全公開（leak）** |
| `users_personal_information/{uid}` | 本人のみ read | **全公開（leak）** |
| `pass_code/**` | 全拒否 | **全公開（leak）** |
| `communities/{c}/invites/**` | 全拒否 | **全公開（leak）** |
| `communities/{c}/events/{e}/orders/{o}` (legacy) | 明示ルールなし | **全公開** |
| `communities/{c}/letters/{l}` | `isManager()` のみ | **全公開** |

## クライアントが read しているパス一覧

`base` / `user` / `admin` 各パッケージの store・コンポーネントを調査した結果。
`functions/default` は Admin SDK（ルール非依存）のため対象外。

### 通常の read（doc / collection query）

| パス | 読込元 | 公開/制限 |
| :-- | :-- | :-- |
| `assets/{bannersId}` | base | 公開 |
| `configs/{configId}` | base, user, admin | 公開 |
| `users/{userId}` | base | 公開 |
| `users_personal_information/{userId}` | base | **本人のみ** |
| `communities/{communityId}` | base | 公開 |
| `communities/{communityId}/members/{memberId}` | base | 公開 |
| `communities/{communityId}/events/{eventId}` | base | 公開 |
| `communities/{communityId}/events/{eventId}/menus/{menuId}` | base | 公開 |
| `communities/{communityId}/events/{eventId}/members/{memberId}` | base | 公開 |
| `communities/{communityId}/events/{eventId}/members/{memberId}/member_orders/{orderId}` | base | 公開 |
| `communities/{communityId}/events/{eventId}/stripes/{stripeId}` | base | **本人のみ** |
| `communities/{communityId}/letters/{letterId}` | base | **マネージャーのみ** |
| `partners/{partnerId}` | base | 公開 |
| `partners/{partnerId}/shops/{shopId}` | base | 公開 |
| `partners/{partnerId}/menus/{menuId}` | base | 公開 |

### collection group query

| store | collectionGroup 名 | 代表ファイル | 備考 |
| :-- | :-- | :-- | :-- |
| `base/src/stores/eventList.ts` | `events` | L35 | 全コミュニティ横断のイベント一覧。廃止不可 |
| `base/src/stores/currentUser.ts` | `member_orders` | L105 | ユーザーのカート・注文一覧。廃止不可 |
| `base/src/stores/orderList.ts` | `member_orders` | L53 | 注文一覧（フィルタ付き）。廃止不可 |
| `base/src/stores/shopList.ts` | `shops` | L34 | 全パートナー横断の店舗一覧。廃止不可 |
| `base/src/stores/letter.ts` | `letters` | L56 | **廃止可能**（後述） |

### letters の read 箇所

letters を read している箇所はすべてマネージャー UI 内であり、一般ユーザーは読んでいない。

| ファイル | 用途 |
| :-- | :-- |
| `user/src/components/manage/event/letter.vue` | マネージャー UI（イベントのレター管理） |
| `user/src/components/manage/community/letter.vue` | マネージャー UI（コミュニティのレター管理） |
| `base/src/components/LetterEdit.vue` | マネージャー向け編集 UI |
| `base/src/components/EmailDialog.vue` | メール送信ダイアログ（マネージャー用） |

## collection group query への影響

### 問題

Firestore Security Rules の仕様として、**collection group query は `match /{path=**}/コレクション名/{docId}` 形式のルールでないと許可されない**。
固定パスの `match /communities/{community}/events/{event}` では collection group query は通らない。

参考: [Firestore Security Rules — collection group queries](https://firebase.google.com/docs/firestore/security/rules-query#collection_group_queries_and_security_rules)

現状は末尾のワイルドカード `match /{document=**} { allow read: if true }` が collection group query の read も暗黙的に許可しているため動いている。
ワイルドカードを単純に削除すると、collection group query が permission denied で壊れる。

### 対応方針

collectionGroup ごとに対応を分ける。

#### events / member_orders / shops — collection group ルールを追加

データ構造上 collectionGroup が必須なため、`match /{path=**}/...` 形式のルールを新規追加する。

```
match /{path=**}/events/{event} { allow read: if true }
match /{path=**}/member_orders/{order} { allow read: if true }
match /{path=**}/shops/{shop} { allow read: if true }
```

#### letters — collectionGroup クエリを廃止し、通常クエリに置き換える

letters の collectionGroup を廃止することで、`match /{path=**}/letters/{letter}` ルールが不要になり、既存の `match /communities/{community}/letters/{letter} { allow read, write: if isManager() }` がそのまま機能する。

**廃止可能な根拠**:
`base/src/stores/letterList.ts` は既に collectionGroup を使わずに letters を取得している。
community を `community_account` で先に引き、そこから letters サブコレクションに直接アクセスするパターン:

```ts
// letterList.ts（既存・collectionGroup 不使用）
const communitySnapshot = await getDocs(
  query(collection(db, 'communities'), where('community_account', '==', communityAccount)),
)
_letterListRef = collection(communitySnapshot.docs[0].ref, 'letters').withConverter(letterConverter)
```

一方 `base/src/stores/letter.ts` だけが collectionGroup を使用している:

```ts
// letter.ts（現状・collectionGroup 使用 → 廃止対象）
const communitySnapshot = await getDocs(
  query(
    collectionGroup(db, 'letters'),
    where('community_account', '==', communityAccount),
    where('letter_id', '==', letterId),
  ).withConverter(letterConverter),
)
```

これを `letterList.ts` と同じパターンに置き換える:

```ts
// letter.ts（修正後・collectionGroup 不使用）
const communitySnapshot = await getDocs(
  query(collection(db, 'communities'), where('community_account', '==', communityAccount)),
)
const letterRef = doc(
  collection(communitySnapshot.docs[0].ref, 'letters'),
  letterId,
).withConverter(letterConverter)
```

**メリット**:
- `match /{path=**}/letters/{letter}` ルールが不要
- letters の `isManager()` 制限をそのまま維持できる（`community` 変数が利用可能）
- ルールの例外的な条件分岐が減り、`firestore.rules` がシンプルになる

## 修正方針

### 1. 削除するもの

末尾のワイルドカードを削除:
```diff
-       match /{document=**} {
-           allow read: if true
-       }
```

### 2. 明示的に `allow read` を追加するパス

| パス | 追加する read ルール | 備考 |
| :-- | :-- | :-- |
| `assets/{asset}` | `allow read: if true` | 新規 match |
| `partners/{partnerId}` | `allow read: if true` | 既存 match に追加 |
| `partners/{partnerId}/shops/{shop}` | `allow read: if true` | 既存 match に追加 |
| `partners/{partnerId}/menus/{menu}` | `allow read: if true` | 既存 match に追加 |
| `partners/{partnerId}/options/{option}` | `allow read: if true` | 既存 match に追加 |
| `communities/{community}` | `allow read: if true` | 既存 match に追加 |
| `communities/{community}/members/{memberId}` | `allow read: if true` | 既存 match に追加 |
| `communities/{community}/events/{event}` | `allow read: if true` | 既存 match に追加 |
| `communities/{community}/events/{event}/menus/{menu}` | `allow read: if true` | 新規 match |
| `communities/{community}/events/{event}/members/{memberId}` | `allow read: if true` | 既存 match に追加 |
| `communities/{community}/events/{event}/members/{m}/member_orders/{o}` | `allow read: if true` | 既存 match に追加 |
| `users/{userId}` | `allow read: if true` | 既存 match に追加 |

### 3. collection group 対応ルール（新規追加）

```
match /{path=**}/events/{event} { allow read: if true }
match /{path=**}/member_orders/{order} { allow read: if true }
match /{path=**}/shops/{shop} { allow read: if true }
```

letters は collectionGroup クエリを廃止するため、ここには含めない。

### 4. 制限を維持するパス（変更なし）

| パス | ルール | 備考 |
| :-- | :-- | :-- |
| `communities/{c}/events/{e}/stripes/{s}` | `allow read: if request.auth != null && request.auth.uid == resource.data.user_id` | 本人のみ |
| `users_personal_information/{uid}` | `allow read: if request.auth != null && request.auth.uid == user_id` | 本人のみ |
| `pass_code/**` | `allow read, write: if false` | 全拒否 |
| `communities/{c}/invites/**` | `allow read, write: if false` | 全拒否 |
| `communities/{c}/letters/{l}` | `allow read, write: if isManager()` | マネージャーのみ（変更なし） |

### 5. legacy orders を明示的に閉じる

```diff
  match /orders/{order} {
-     allow write: if false
+     allow read, write: if false
  }
```

### 6. letter.ts の collectionGroup クエリを廃止

`base/src/stores/letter.ts` の `getLetterRef()` を修正し、`collectionGroup(db, 'letters')` を通常のサブコレクションアクセスに置き換える。

## 修正後の firestore.rules（全体像）

```
rules_version = '2';
service cloud.firestore {
    match /databases/{database}/documents {
        function isSupport() {
            return request.auth != null &&
                   request.auth.uid in get(/databases/$(database)/documents/configs/global).data.support_user_ids
        }
        match /assets/{asset} {
            allow read: if true
        }
        match /configs/{config} {
            allow read: if true
            allow write: if false
        }
        match /partners/{partner_id} {
            allow read: if true
            match /shops/{shop} {
                allow read: if true
                allow create, update, delete: if request.auth != null && request.auth.uid == partner_id
                allow create, update, delete: if isSupport()
            }
            match /menus/{menu} {
                allow read: if true
                allow create, update, delete: if request.auth != null && request.auth.uid == partner_id
            }
            match /options/{option} {
                allow read: if true
                allow create, update, delete: if request.auth != null && request.auth.uid == partner_id
            }
        }
        match /communities/{community} {
            function isManager() {
                return request.auth != null &&
                       exists(/databases/$(database)/documents/communities/$(community)/members/$(request.auth.uid)) &&
                       "manager" in get(/databases/$(database)/documents/communities/$(community)/members/$(request.auth.uid)).data.roles
            }
            allow read: if true
            allow create: if request.auth != null
            allow update: if isSupport() || isManager()
            match /events/{event} {
                allow read: if true
                allow create, update: if isSupport()
                allow create, update: if isManager() && get(/databases/$(database)/documents/communities/$(community)).data.is_approved
                allow delete: if isManager() && get(/databases/$(database)/documents/communities/$(community)/events/$(event)).data.event_status.value == 'in_draft'
                allow update: if request.auth != null && resource.data.partner_id == request.auth.uid
                match /orders/{order} {
                    allow read, write: if false
                }
                match /members/{memberId} {
                    allow read: if true
                    allow write: if false
                    match /member_orders/{orderId} {
                        allow read: if true
                        allow write: if false
                    }
                }
                match /stripes/{stripeId} {
                    allow read: if request.auth != null && request.auth.uid == resource.data.user_id
                    allow write: if false
                }
                match /menus/{menuId} {
                    allow read: if true
                }
            }
            match /members/{memberId} {
                allow read: if true
                allow create: if isSupport() || isManager() || (request.auth != null && request.auth.uid == memberId)
                allow update: if isSupport() || isManager()
                allow delete: if request.auth != null && request.auth.uid == memberId
            }
            match /invites/{document=**} {
                allow read, write: if false
            }
            match /letters/{letter} {
                allow read, write: if isManager()
            }
        }
        match /users/{user_id} {
            allow read: if true
            allow create, update: if request.auth != null && request.auth.uid == user_id
        }
        match /users_personal_information/{user_id} {
            allow read: if request.auth != null && request.auth.uid == user_id
            allow write: if false
        }
        match /pass_code/{document=**} {
            allow read, write: if false
        }
        // collection group query 用ルール
        match /{path=**}/events/{event} {
            allow read: if true
        }
        match /{path=**}/member_orders/{order} {
            allow read: if true
        }
        match /{path=**}/shops/{shop} {
            allow read: if true
        }
    }
}
```

## 仕様書の更新

[`documents/07_リファクタリング/05_EventOrder→EventMemberOrder.md`](./05_EventOrder→EventMemberOrder.md) の Security Rules 節（L257-289）を更新する:

- 「ワイルドカードルールで許可済み」という前提を削除
- 明示的 `allow read` に変更した旨を反映
- ワイルドカード依存の危険性を注記
- 新規コレクション追加時は公開/非公開を必ず明示的に記述するガイドラインを追記
