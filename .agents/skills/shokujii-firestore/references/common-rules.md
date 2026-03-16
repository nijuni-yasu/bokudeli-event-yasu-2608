# Firestore / Store 共通ルール

base、functions、user、admin の全パッケージで Firestore を扱う際に共通で適用されるルール。shokujii-code-review の Firestore / Store パターンに基づく。

## チェックリスト

### 必須ルール

- [ ] **DB への操作は必ず store 関数を経由しているか**（直接 `update`、`setDoc`、`getDoc`、`collection` 等を呼ばない）
- [ ] **withConverter を付けた reference を使っているか**（目的: 読み書き時に common schema の Zod を通すため。付けない ref の使用は NG。例外あり）
- [ ] **toFirestore を store の FirestoreDataConverter 外で直接呼んでいないか**
- [ ] **withConverter を削除していないか**（削除すると zod バリデーションが外れる）
- [ ] **updateXXX 系の関数は全フィールドを書き戻す方針になっているか**（Partial マージ禁止）
- [ ] **withConverter + set で既存ドキュメントを更新する際、先に get して既存データを引き継いでいるか**（`toFirestore` は全フィールドを書き込むため、既存フィールドが失われる）
- [ ] **Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか**
- [ ] **レースコンディションが発生しうる箇所に Transaction を使っているか**

### array-contains 等のクエリ

`where('managers', 'array-contains', ref)` のように DocumentReference が必要な場合:

- **NG**: `doc(db, 'users', userId)` を直接使う
- **OK**: store で定義した `getUserRef(userId)` 等の xxxRef 関数を使う

xxxRef は withConverter 付きの DocumentReference を返す。withConverter の目的は、読み書き時に common の schema（Zod）を通すことである。型安全性とバリデーションを維持するため、必ず store 経由の ref を使う。

### パッケージ別の store 配置

| パッケージ | store の配置 | 呼び出し元 |
|-----------|-------------|------------|
| base | `base/src/stores/` | user, admin のページ・コンポーネント |
| functions | `functions/default/src/stores/` | functions の Callable/Trigger/Scheduled |

user と admin は **base の store のみ**を使用する。直接 Firestore を呼ばない。

## 例外・違反の一覧

### 許容される例外

- **Partner（base/src/stores/partner.ts）**: partnerRef は withConverter なしの `doc(db, 'partners', partnerId)`。親ドキュメントを read/write せず、サブコレクション（shops, menus）の親パスとしてのみ使用するため。親ドキュメントにスキーマが存在しない、またはドキュメント自体を扱わない場合の例外。

### 未修正の TODO

- **createNewCommunity（base/src/stores/community.ts 103–107 行目）**: `memberRef` に `// TODO withConverter` があり、`setDoc(memberRef, { roles: ['manager'] })` で withConverter なしで書き込んでいる。スキルが示す「あるべき姿」は正しいが、この箇所は未修正の TODO として残っている。

### 修正対象の違反

以下のファイルはスキルで NG としているパターンが残っており、修正対象である。

| ファイル | 違反内容 |
|---------|----------|
| `user/src/pages/u/[userId].vue` | `collection(db, 'users')`、`doc(db, 'users', userId)` を直接使用 |
| `user/src/pages/manage/*.vue` | `doc(db, 'users', userId)` を array-contains に直接使用 |
