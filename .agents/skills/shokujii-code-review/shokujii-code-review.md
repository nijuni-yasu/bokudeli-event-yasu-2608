---
name: shokujii-code-review
description: Shokujiiプロジェクトのコーディング規約に従ってコードをレビューする。PRレビュー、コード変更のレビュー依頼時、またはレビューを求められた際に使用する。
---

# Shokujii コードレビュー

過去のレビューコメント（kokufu）から抽出したプロジェクト固有のルール集。
コードレビュー時はこのチェックリストに沿って確認すること。

---

## チェックリスト

### TypeScript・型安全性
- [ ] `any` を使用していないか
- [ ] `as` によるキャストを使用していないか（型推論で解決できるはず）
- [ ] `@ts-ignore` を使用していないか
- [ ] 関数の戻り値の型が明示されているか
- [ ] `optional` と `nullable` を適切に使い分けているか
- [ ] `tsconfig` の strict 設定を緩める変更をしていないか

### 比較・falsy チェック
- [ ] 数値に falsy チェック (`!`, `||`, `if (num)`) を使っていないか（`0` に誤反応する）
- [ ] 文字列に falsy チェックを使っていないか（`!= null` または `!== ''` を使う）
- [ ] boolean 以外の値に `!` を使っていないか（`!= null` に変更する）
- [ ] `null` と `undefined` を区別して比較しているか（`== null` で両方を捕捉する）

### Vue リアクティビティ
- [ ] `watch` の多用をしていないか（`computed` で代替できる場合は `computed` を使う）
- [ ] リアクティブ変数 (`.value`) を関数内で直接使っていないか
- [ ] `isProcessing`、`isCompleted` 等の一時フラグを不必要にリアクティブにしていないか
- [ ] `v-if` と `v-show` を適切に使い分けているか（機能を殺す場合は `v-if`）
- [ ] `defineEmits` を最新の型構文で書いているか（例: `defineEmits<{ save: [menu: BokudeliPartnerMenu] }>()`）
- [ ] `props` と `model` を同時に定義していないか

### Vue コンポーネント設計
- [ ] `base` のコンポーネント内にルーティングパスをハードコードしていないか（`emit` を使ってコンポーネントを汎化する）
- [ ] `base` のコンポーネント内にビジネスロジックを持ち込んでいないか
- [ ] ローディング状態は「画面全体に影響するデータが読み込まれているか」で判断しているか
- [ ] `getLoadedXXX` を使う場合、「そのデータが画面全体に影響する」ことを確認しているか
- [ ] ローディング中を表現する変数は `null | boolean` パターンを使っているか（`null` = ローディング中）
- [ ] 複数の非同期処理が競合しうる箇所で `isLoading` を個別に持っていないか（先祖返りを防ぐため一つにまとめる）
- [ ] テーマカラーを直接指定していないか（Vuetify Theme を使う）
- [ ] `base/src/components/pages/` は deprecated であることを認識しているか
- [ ] ハードコードされた UI 文字列を `i18n` に移行しているか
- [ ] `var` を使っていないか（`const` / `let` を使う）

### Firestore / Store パターン
- [ ] DB への操作は必ず store 関数を経由しているか（直接 `update`、`setDoc` 等を呼ばない）
- [ ] `withConverter` を付けた reference を使っているか（付けない ref の使用は NG）
- [ ] `toFirestore` を store の `FirestoreDataConverter` 外で直接呼んでいないか
- [ ] `withConverter` を削除していないか（削除すると zod バリデーションが外れる）
- [ ] `updateXXX` 系の関数は全フィールドを書き戻す方針になっているか（Partial マージ禁止）
- [ ] `withConverter` + `set` で既存ドキュメントを更新する際、先に `get` して既存データを引き継いでいるか（`toFirestore` は全フィールドを書き込むため、既存フィールドが失われる）
- [ ] Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか
- [ ] レースコンディションが発生しうる箇所に Transaction を使っているか

### Firebase Functions
- [ ] `console.log` / `console.error` を使っていないか（`createModuleLogger` を使う）
- [ ] `import { logger } from 'firebase-functions'` を直接使っていないか（`createModuleLogger` を使う）
- [ ] ログメッセージに `letter |` 等の接頭辞をつけていないか（`createModuleLogger` 使用時は不要）
- [ ] メールの一括送信に `Promise.all` を使っていないか（SendGrid personalizations の `sendDynamicTemplateWithPersonalizations`（`utils/sendgridBulk.ts`）によるバッチ送信とし、バッチ単位の失敗と受付件数をログに記録する）
- [ ] メールの1件送信に `Promise.allSettled` や失敗集計ログを使っていないか（`try/catch` で十分）
- [ ] Callable Functions の引数にオブジェクト（クラスインスタンス等）を渡していないか（ID のリストを渡す）
- [ ] `secrets` の指定が必要な Function（SendGrid 等）に `{ secrets: ['SENDGRID_API_KEY'] }` が付いているか

### 日付・時刻処理
- [ ] `Date` オブジェクトを直接使っていないか（`luxon` を使う）
- [ ] `new Date()` で UNIX タイムを生成していないか（実行環境によって値が変わる）
- [ ] 日付の固定値は `CUTOFF_UNIX_TIME_XXXX` のように `common` に定数として定義しているか

### スキーマ設計 (Zod / common)
- [ ] 新規フィールドを `optional` にしていないか（新規追加フィールドは基本 `required`）
- [ ] ソート用のフィールドを文字列型で定義していないか（数値型が正しい）
- [ ] 独自の日付文字列変換を実装していないか（`luxon` または `zod` の `transform` を使う）
- [ ] 親ドキュメントが既に持っている情報を子ドキュメントに重複させていないか
- [ ] DbSchema の日付・時刻フィールドに `TimestampSchema` を使っているか
- [ ] AppSchema の日付・時刻フィールドに `EpochMillisSchema` を使っているか

### Composable / Store の役割分担
- [ ] 計算ロジックは composable より store で行うようになっているか
- [ ] Composable 内の Store は引数で受け取らず Composable 内で再取得しているか
- [ ] Store に不要なビジネスロジックを持ち込んでいないか

### コード品質・可読性
- [ ] 早期リターンをエラーハンドリング以外で多用していないか（並列処理は `else` で書く）
- [ ] 「並列の処理（値の代入など）」を早期リターンで書いていないか
- [ ] 不要な変数への代入を中継していないか
- [ ] 冗長なチェックを追加していないか（型で保証されているものを再チェックしない）
- [ ] 不要な `if` のネストを避け `&&` で一行にまとめているか
- [ ] 自明なコメントを書いていないか
- [ ] 誤ったコメントを書いていないか
- [ ] `common` に定義されている util 関数を使わず独自実装していないか
- [ ] インターフェースが統一されている関数群を個別に try-catch で囲んでいないか
- [ ] Store は常に存在するため `storeXXX &&` のような null チェックをしていないか
- [ ] マジックナンバー・インデックス固定（例: 配列の `[0]` で固定）をしていないか（別途定数に切り出す）
- [ ] 将来流用できる部分を最初から汎用化しているか

### コミット・PR
- [ ] 1つの PR に複数の責務を混在させていないか
- [ ] 無関係な修正を同じコミットに含めていないか
- [ ] 動作的に大きな変更を別 PR または別 Issue に分けているか

### アセット管理
- [ ] 画像・バナー等のアセットをコード内にハードコードしていないか（Firestore / Storage で管理する）

---

## フィードバック形式

- 🔴 **必須修正**: マージ前に対応が必要（セキュリティ・データ不整合・バグ等）
- 🟡 **提案**: 改善を検討してほしい（設計・可読性等）
- 🟢 **任意**: あれば尚良い（スタイル・細かい最適化等）

---

## よくある間違いパターン（過去レビューより）

### NG: 数値・文字列への falsy チェック

```typescript
// NG
if (!price) { ... }
if (updateUserId.trim() === '') { ... }

// OK
if (price == null) { ... }
if (updateUserId !== '') { ... }
```

### NG: Transaction 外でのドキュメント読み込みを Transaction 内で再利用

```typescript
// NG: Transaction 外で取得した event を Transaction 内で使う
const event = await getEvent(eventId)
await runTransaction(db, async (t) => {
  // event は Transaction で保護されていない
  if (event.is_public) { ... }
})

// OK: Transaction 内で読み込む
await runTransaction(db, async (t) => {
  const eventSnap = await t.get(eventRef)
  if (eventSnap.data()?.is_public) { ... }
})
```

### NG: `watch` を使ったリアクティビティ

```typescript
// NG: watch で計算結果を別の ref に書き込む
watch(someRef, (val) => {
  result.value = calc(val)
})

// OK: computed で代替する
const result = computed(() => calc(someRef.value))
```

### NG: `withConverter` + `set` で既存データを取得せずに上書き

```typescript
// NG: 既存データを確認せず set → DB 上の他フィールドが消える
const ref = db.collection('items').doc(id).withConverter(converter)
const data = new Item(id, { name: 'new' })
await ref.set(data) // 既存の price, category 等が消える

// OK: 既存データを取得してから set
const snapshot = await ref.get()
const data = snapshot.data() ?? new Item(id, { name: 'new' })
data.name = 'new'
await ref.set(data)
```

### NG: save 関数の呼び出し側が get を忘れる

```typescript
// NG: get せずに新規インスタンスで saveUser → 既存フィールドが欠落
const user = new ShokujiiUser(userId, { user_name: 'new name' })
await saveUser(user) // merge: true でも toFirestore が返さないフィールドは維持されない

// OK: get してから変更して save
const user = await getUser(userId)
user.user_name = 'new name'
await saveUser(user)
```

### NG: `withConverter` なしの ref

```typescript
// NG
const ref = doc(db, 'letters', id)
await updateDoc(ref, data)

// OK
const ref = doc(db, 'letters', id).withConverter(letterConverter)
// store 関数を経由して操作する
await letterStore.update(ref, data)
```

### NG: Callable に オブジェクトを渡す

```typescript
// NG: BokudeliEventMenu[] をそのまま渡す（JSON シリアライズで機能が落ちる）
await updateEventMenus({ menus: menuObjects })

// OK: ID リストを渡す
await updateEventMenus({ menuIds: menuObjects.map(m => m.menu_id) })
```

### NG: Functions で console や logger を直接使う

```typescript
// NG: console を使う
console.log('letter | sendLetter called')

// NG: firebase-functions の logger を直接インポートする
import { logger } from 'firebase-functions'
logger.info('sendLetter called')

// OK: createModuleLogger を使う（Cloud Logging で module フィールドによるフィルタリングが可能になる）
import { createModuleLogger } from './utils/logger.js'
const logger = createModuleLogger('letter')
logger.info('sendLetter called')
// createModuleLogger 使用時はログに接頭辞（"letter |" 等）をつけない
```

### NG: メール一括送信に Promise.all を使う

```typescript
// NG: 1件の失敗で全体が中断する
await Promise.all(
  emails.map(async (to) => {
    await sgMail.send({ to, from: DEFAULT_FROM, templateId, dynamicTemplateData })
  }),
)

// OK: 失敗しても他の送信は継続し、結果を集計する
const results = await Promise.allSettled(
  emails.map(async (to) => {
    return sgMail.send({ to, from: DEFAULT_FROM, templateId, dynamicTemplateData })
  }),
)

const failedCount = results.filter((r) => r.status === 'rejected').length
if (failedCount > 0) {
  logger.warn('Failed to send mail', {
    successCount: results.filter((r) => r.status === 'fulfilled').length,
    failedCount,
    totalEmails: emails.length,
  })
}
```

### NG: Date オブジェクトの直接使用

```typescript
// NG: 実行環境によって UNIX タイムの値が変わる
const now = new Date().getTime()

// OK: luxon を使う
import { DateTime } from 'luxon'
const now = DateTime.now().toMillis()
```

### NG: 日付・時刻フィールドのスキーマの使い分け

```typescript
// NG: DbSchema で EpochMillisSchema を使う → Firestore に number で保存され、created_at 等と型が揃わない
deleted_at: EpochMillisSchema.optional()

// NG: AppSchema で TimestampSchema を使う → アプリ側で Timestamp オブジェクトになり、比較・表示が煩雑
deleted_at: TimestampSchema.optional()

// OK: DbSchema には TimestampSchema、AppSchema には EpochMillisSchema
// DbSchema
deleted_at: TimestampSchema.optional()
// AppSchema
deleted_at: EpochMillisSchema.optional()
```

### NG: ローディング状態を特定ドキュメントの読み込みで判断する

```typescript
// NG: shop が読み込めているかで画面全体をブロックする
const isLoading = computed(() => shop.value == null)

// OK: 表示に必要なデータが読み込まれているかで判断する
// shop は isOwner の判定にのみ使う
// isOwner: null | boolean（null = ローディング中）
const isOwner = computed<null | boolean>(() => {
  if (shop.value == null) return null
  return shop.value.owner_id === currentUser.value?.uid
})
```

### NG: 複数の isLoading が競合する

```typescript
// NG: Basic と Detail を同時に押されると先祖返りを起こす
const isLoadingBasic = ref(false)
const isLoadingDetail = ref(false)

// OK: isLoading を一つにまとめる
const isLoading = ref(false)
```
