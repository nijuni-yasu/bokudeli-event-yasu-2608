---
name: shokujii-firestore
description: Shokujii プロジェクトにおける Firestore 操作のルールとパターン。base / functions / user / partner / enterprise のいずれで Firestore を扱う場合も使用する。store 経由・withConverter・xxxRef の使用が必須。新規 store の追加、既存 store の修正、Firestore の読み書きを行うときは必ず参照すること。「Firestore を触る」「store を追加する」「Event のサブコレクションを読む」「array-contains でクエリする」「user_id でユーザーを検索する」「コミュニティの managers でフィルタする」「Callable Function で Firestore を読む」など、Firestore 関連の依頼時に使用する。
---

# Shokujii Firestore Store

base、functions、user、partner、enterprise の全パッケージで Firestore を扱う際の共通ルールとパターン。

## 共通ルール（全パッケージ）

詳細は [references/common-rules.md](references/common-rules.md) を参照。

- **DB 操作は必ず store 経由**: `db.collection()`、`updateDoc`、`setDoc`、`getDoc` 等を直接呼ばない
- **xxxRef は必ず withConverter 付き**: 読み書き時に common schema の Zod を通すため。DocumentReference は store の `getUserRef` 等を使う
- **toFirestore を Converter 外で呼ばない**: 変換ロジックは FirestoreDataConverter 内に閉じる
- **withConverter を削除しない**: 削除すると Zod バリデーションが外れる
- **array-contains 等のクエリ**: `doc(db, 'users', userId)` ではなく `getUserRef(userId)` を使う

## パッケージ別の参照先

| 対象 | 参照ファイル | 内容 |
|------|-------------|------|
| **base** (user/partner/enterprise の store) | [references/base-stores.md](references/base-stores.md) | クライアント SDK、Pinia、xxxRef、onSnapshot |
| **functions** (サーバー store) | [references/functions-stores.md](references/functions-stores.md) | Admin SDK、get/save 関数、Transaction |
| **user / partner / enterprise** (store 利用側) | base-stores.md | store 経由のみ。直接 Firestore を呼ばない |

## クイックチェックリスト

実装前に確認すること:

- [ ] 対象パッケージの store を経由しているか（base なら base/stores、functions なら functions/stores）
- [ ] withConverter 付きの ref を使っているか
- [ ] array-contains 等で DocumentReference が必要な場合、`getUserRef(userId)` 等の xxxRef を使っているか
- [ ] 既存ドキュメントの更新時、`toFirestore` が全フィールドを書き込むため、先に get して既存データを引き継いでいるか
- [ ] Transaction 内で読むドキュメントを、Transaction 外で読んでいないか

## よくある誤り

**NG**: `doc(db, 'users', userId)` を array-contains に渡す  
**OK**: `getUserRef(userId)` を使う（base の user store で定義）

**NG**: ページコンポーネントで `collection(db, 'users')` を直接使う  
**OK**: base の store にクエリ用の関数を追加し、それを経由する

**修正対象の既知違反**: `user/src/pages/u/[userId].vue`（collection/doc 直接使用）、`user/src/pages/manage/*.vue`（array-contains に doc 直接使用）は修正対象。詳細は common-rules.md の「例外・違反の一覧」を参照。

**NG**: `updateDoc(ref, { field: value })` で部分更新  
**OK**: 全フィールドを書き戻す `updateXXX` 方針。または `set` + `merge: true` の前に get して既存データを引き継ぐ

## 参照ファイルの読み方

- **base の store を追加・修正する**: base-stores.md を読む
- **functions の store を追加・修正する**: functions-stores.md を読む
- **user/partner/enterprise で Firestore を使う**: base-stores.md を読み、既存 store を経由する形で実装する
- **共通ルールの確認**: common-rules.md を読む
