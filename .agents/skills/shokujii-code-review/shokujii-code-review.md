---
name: shokujii-code-review
description: Shokujiiプロジェクトのコーディング規約に従ってコードをレビューする。指摘は 🚨必須修正/🟡修正提案/👌修正不要（対応後は ✅対応済み、別Issue化は 📤#NNNN別Issue化）の共通区分で review-comments-evaluate と共通。PRレビュー時は pr-<番号>.md に RC 記録を追記。コード変更のレビュー依頼時に使用する。
---

# Shokujii コードレビュー

過去のレビューコメント（kokufu）から抽出したプロジェクト固有のルール集。
コードレビュー時はこのチェックリストに沿って確認すること。

---

## チェックリスト

### TypeScript・型安全性

- [ ] `any` を使用していないか
- [ ] `as` によるキャストを使用していないか（型推論で解決できるはず）
- [ ] `common` の schema・API 以外で新規 Zod スキーマを定義していないか（`ZodError` の捕捉のみ可）。`as` 回避は型ガードで行う
- [ ] `@ts-ignore` を使用していないか
- [ ] 関数の戻り値の型が明示されているか
- [ ] `optional` と `nullable` を適切に使い分けているか
- [ ] `tsconfig` の strict 設定を緩める変更をしていないか

### 比較・falsy チェック

- [ ] 数値に falsy チェック (`!`, `||`, `if (num)`) を使っていないか（`0` に誤反応する）
- [ ] 文字列に falsy チェックを使っていないか（`!= null` または `!== ''` を使う）
- [ ] boolean 以外の値に `!` を使っていないか（`!= null` に変更する）
- [ ] `null` と `undefined` を区別して比較しているか（`== null` で両方を捕捉する）
- [ ] 権限チェック関数が `Promise<boolean>` 等を返す場合、呼び出し側で `await` しているか（await 漏れは常に truthy 判定になり認可バイパスに直結する）

### Vue リアクティビティ

- [ ] `watch` の多用をしていないか（`computed` で代替できる場合は `computed` を使う）
- [ ] リアクティブ変数 (`.value`) を関数内で直接使っていないか
- [ ] `isProcessing`、`isCompleted` 等の一時フラグを不必要にリアクティブにしていないか
- [ ] `v-if` と `v-show` を適切に使い分けているか（機能を殺す場合は `v-if`）
- [ ] `defineEmits` を最新の型構文で書いているか（例: `defineEmits<{ save: [menu: BokudeliPartnerMenu] }>()`）
- [ ] `props` と `model` を同時に定義していないか
- [ ] イベントハンドラ・ライフサイクルフックから呼ぶ非同期処理に `try/catch` があるか（unhandled rejection や UI 不整合を防ぐ）

### Vue コンポーネント設計

- [ ] `base` のコンポーネント内にルーティングパスをハードコードしていないか（`emit` を使ってコンポーネントを汎化する）
- [ ] `base` のコンポーネント内にビジネスロジックを持ち込んでいないか
- [ ] ローディング状態は「画面全体に影響するデータが読み込まれているか」で判断しているか
- [ ] `getLoadedXXX` を使う場合、「そのデータが画面全体に影響する」ことを確認しているか
- [ ] ローディング中を表現する変数は `null | boolean` パターンを使っているか（`null` = ローディング中）
- [ ] 複数の非同期処理が競合しうる箇所で `isLoading` を個別に持っていないか（先祖返りを防ぐため一つにまとめる）
- [ ] テーマカラーを直接指定していないか（Vuetify Theme を使う）
- [ ] `base/src/components/pages/` は deprecated であることを認識しているか
- [ ] ハードコードされた UI 文字列を `i18n` に移行しているか（**`ja.ts` のみ**。英語 locale は作らない）
- [ ] `src/locales/messages/en.ts` 等の **英語 locale を新規追加していないか**（本プロジェクトは日本語のみ）
- [ ] 英語用の UI 文字列だけを別ファイルに分けていないか（未使用の `en.ts` 残骸を作らない）
- [ ] 削除等の破壊的操作に確認モーダルを挟んでいるか（誤操作防止の UX）
- [ ] `var` を使っていないか（`const` / `let` を使う）

### セキュリティ

- [ ] `v-html` に DB・ユーザー入力由来の動的データ（TinyMCE 等のリッチテキスト含む）を渡す場合、サニタイズ（DOMPurify 等）しているか（`$t()` 等の静的文字列のみの場合は対象外）
- [ ] `target="_blank"` を使う外部リンクに `rel="noopener noreferrer"` を付けているか（`window.open`・`v-html` 内リンク・`ja.ts` の文言内リンクも対象）
- [ ] Auth ユーザー作成 → Firestore 保存のような複数ステップの作成処理で、後続ステップが失敗した場合に先行して作成済みのリソースをロールバック・補償削除しているか（残すと再登録不能や認可バイパスにつながる）
- [ ] 外部 URL のホスト名検証を `startsWith` のみで行っていないか（`https://good.com.attacker.example` のようになりすませる。URL をパースして `protocol === 'https:'` と hostname を厳密比較する）
- [ ] 運用ドキュメント・レビュー記録に実ユーザーの UID・メールアドレス等の PII や認証情報ファイルの中身を平文で残していないか（プレースホルダー化する）

### アクセシビリティ（Phase 1 対象外）

> **現フェーズではコードレビューでの a11y 指摘は行わない**（ユーザー規模・優先度の都合）。
> `aria-label` / `alt` / キーボード操作 / ARIA ロール等は通常 PR では確認しない。
> **例外**: 個別仕様書（`documents/`）に a11y 要件が明記されている場合のみ、その PR スコープ内で確認する。

### Materio / UI テンプレート

- [ ] `base/materio/`（`@core` / `@layouts`）を変更していないか
- [ ] Materio のレイアウト・スタイル調整を `user/src/styles/` 等の override で行っているか
- [ ] materio 配下にプロジェクト固有の util / コンポーネントを追加していないか（`base/src/` 等を使う）

### Firestore / Store パターン

- [ ] DB への操作は必ず store 関数を経由しているか（直接 `update`、`setDoc` 等を呼ばない）
- [ ] `withConverter` を付けた reference を使っているか（付けない ref の使用は NG）
- [ ] `toFirestore` を store の `FirestoreDataConverter` 外で直接呼んでいないか
- [ ] `withConverter` を削除していないか（削除すると zod バリデーションが外れる）
- [ ] `updateXXX` 系の関数は全フィールドを書き戻す方針になっているか（Partial マージ禁止）
- [ ] `withConverter` + `set` で既存ドキュメントを更新する際、先に `get` して既存データを引き継いでいるか（`toFirestore` は全フィールドを書き込むため、既存フィールドが失われる）
- [ ] Transaction 内で読み込む場合、Transaction 外で同じドキュメントを読んでいないか
- [ ] Transaction 内で **すべての read が write より前** に実行されているか（Firestore は write 後の read を拒否する。`addMember` 等の read+write を内包するメソッドにも注意）
- [ ] レースコンディションが発生しうる箇所に Transaction を使っているか
- [ ] communityId と eventId の両方が分かるのに `getEvent` を使っていないか（`getEventInCommunity` を使う。`getEvent` は eventId のみ分かる Tier C 向け）
- [ ] ループ内で Firestore の read/write や外部 API 呼び出しを逐次 `await` していないか（`Promise.all`・バッチ処理・並列度を制限した実行を検討する）
- [ ] カウンタや上限チェック等の不変条件を read-then-write で更新していないか（`FieldValue.increment` または Transaction で原子性を担保する）
- [ ] 新規の複合クエリ（`where` 複数条件・`orderBy` 併用・`array-contains` 等）に対応する `firestore.indexes.json` の追加漏れ・重複がないか
- [ ] store の zod パースエラー等、握りつぶすと調査不能になる catch 節で `reportClientError` を呼んでいるか（クライアント側 store）

### community_id / community_account の使い分け

- [ ] `useCommunityStore(string)` には `community_account`（URL スラッグ）を渡しているか
- [ ] Callable / Firestore パス / Storage には `community_id`（Firestore ドキュメント ID）を渡しているか
- [ ] URL 生成（`getCommunityPath`, `getEventPath` 等）には `community_account` を渡しているか
- [ ] 同一コンポーネント内で prop 名 `communityId` と `communityAccount` を混在させていないか（用途が異なる場合は JSDoc で区別する）

### Firestore Security Rules

- [ ] `firestore.rules` の create/update で、新規・機微フィールドの書き込み可能な値を制約しているか（`hasOnly`、他フィールドや `request.auth` との一致検証等）
- [ ] 新規コレクション・クエリで `enterprise_id` / `community_id` のテナント分離が必要な場合、`isSameEnterprise` / `docEnterpriseId` 等の既存ヘルパーに揃えているか（`enterprise_id` が null のドキュメントの扱いも含む）
- [ ] `firestore.rules` を変更した場合、`tests/firestore-rules` 側のテストも追加・更新しているか

### Firebase Functions

- [ ] `console.log` / `console.error` を使っていないか（`createModuleLogger` を使う）
- [ ] `import { logger } from 'firebase-functions'` を直接使っていないか（`createModuleLogger` を使う）
- [ ] ログメッセージに `letter |` 等の接頭辞をつけていないか（`createModuleLogger` 使用時は不要）
- [ ] メールの一括送信に `Promise.all` を使っていないか（SendGrid personalizations の `sendDynamicTemplateWithPersonalizations`（`utils/sendgridBulk.ts`）によるバッチ送信とし、バッチ単位の失敗と受付件数をログに記録する）
- [ ] メールの1件送信に `Promise.allSettled` や失敗集計ログを使っていないか（`try/catch` で十分）
- [ ] Callable Functions の引数にオブジェクト（クラスインスタンス等）を渡していないか（ID のリストを渡す）
- [ ] `secrets` の指定が必要な Function（SendGrid 等）に `{ secrets: ['SENDGRID_API_KEY'] }` が付いているか
- [ ] Firestore トリガー（`onDocumentWritten` 等）は 1 回の操作で複数ドキュメントが変化すると複数回発火する前提で、メール送信等の副作用が重複しないか（Transaction 等で未処理を原子的に確保する。送信成功前に sent 確定フラグだけ立てない）
- [ ] トリガー / Function 内で catch した例外をログのみにせず再 throw し、Cloud Functions の自動リトライに乗せているか（意図的に握りつぶす場合は理由をコメントに明記する）

### 決済 (Stripe)

- [ ] Webhook は `req.body` ではなく `req.rawBody` を使い `stripe.webhooks.constructEvent` で署名検証しているか
- [ ] Webhook・決済確定処理が再送・重複配信されても二重処理にならないか（処理済み判定によるべき等性）
- [ ] Stripe の Charges API / Sources API / Card Element 等の非推奨 API を新規に使っていないか（Checkout Sessions・PaymentIntents・Setup Intents を使う）

### CI / Functions デプロイ

- [ ] `functions/default/src/index.ts` の export 追加・削除がある場合、`.github/workflows/deploy_functions.yml` の `--only` リスト（hybrid / pf / enterprise）も同 PR で更新されているか
- [ ] 更新漏れは 🚨 必須修正（マージ後も Function が未デプロイでサイレント障害になる）
- [ ] export しない内部ヘルパーは対象外
- [ ] 後方非互換なスキーマ変更・新規 Callable を含む PR で、複数 CI ワークフロー（`deploy_functions` / `deploy_user` / `deploy_partner` 等）間のデプロイ順序を明記・保証しているか

### 日付・時刻処理

- [ ] `Date` オブジェクトを直接使っていないか（`luxon` を使う）
- [ ] `new Date()` で UNIX タイムを生成していないか（実行環境によって値が変わる）
- [ ] 日付の固定値は `CUTOFF_UNIX_TIME_XXXX` のように `common` に定数として定義しているか
- [ ] `common` の `DEFAULT_TIME_ZONE` をアプリ層（`user` / `partner` / `base` / `functions`）で直接 import していないか（海外対応時の置換コストを下げるため、タイムゾーンへの参照は `common` 内部に閉じる）
- [ ] タイムゾーン依存の計算ロジックを call site で組み立てていないか（必要なら `common` 側に zone を閉じた util / ドメイン関数を追加して呼び出す）
- [ ] `$d(..., 'date'|'time'|'datetime'|'datetime_weekday_short')` 等の vue-i18n datetimeFormats を新規追加していないか（`common/src/utils/datetime.ts` の `convertToXxx` 系を使う）
- [ ] 日付・時刻の表示フォーマットを call site で独自実装していないか（`convertToDate` / `convertToTimeString` / `convertToDatetime` / `convertToDatetimeWeekdayShort` 等を使う）

### スキーマ設計 (Zod / common)

- [ ] 新規フィールドを `optional` にしていないか（新規追加フィールドは基本 `required`）
- [ ] ソート用のフィールドを文字列型で定義していないか（数値型が正しい）
- [ ] 独自の日付文字列変換を実装していないか（`luxon` または `zod` の `transform` を使う）
- [ ] 親ドキュメントが既に持っている情報を子ドキュメントに重複させていないか
- [ ] DbSchema の日付・時刻フィールドに `TimestampSchema` を使っているか
- [ ] AppSchema の日付・時刻フィールドに `EpochMillisSchema` を使っているか
- [ ] 既存データに影響する変更の場合、`bokudeli-event-batch` 側での migration / backfill 対応（または少なくとも言及）があるか
- [ ] DbSchema で `nullable()` を安易に使っていないか（明示的に `null` が必要な特殊ケースを除き避ける方針。optional 文字列は `NonEmptyStringSchema` を検討する）

### Composable / Store の役割分担

- [ ] 計算ロジックは composable より store で行うようになっているか
- [ ] Composable 内の Store は引数で受け取らず Composable 内で再取得しているか
- [ ] Store に不要なビジネスロジックを持ち込んでいないか

### テスト (Vitest)

- [ ] `documents/テスト方針・テスト項目書/テスト方針.md` の基準（ビジネスロジック・純粋関数・バグ修正）に該当する新規・変更ロジックに vitest テストを追加しているか
- [ ] Transaction・レースコンディションを含む store 関数を新規追加・変更した場合、優先してテストを追加しているか

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

[/review-comments-evaluate](../../review-comments-evaluate/SKILL.md) と同一の **共通区分**（**❌ 未対応は使わない**）。手順・`pr-<番号>.md` への記録は [SKILL.md](SKILL.md) を参照。

- 🚨 **必須修正**: マージ前に対応が必要（セキュリティ・データ不整合・バグ等）
- 🟡 **修正提案**: 改善を検討してほしい（設計・可読性等）。マージ必須ではない
- 👌 **修正不要**: 指摘はあるが対応不要（誤解・仕様どおり・過剰指摘等）
- ✅ **対応済み**: コード・PR で既に解消済み（ドキュメント追記時の **判断結果** に使用）
- 📤 **#NNNN 別Issue化**: 本 PR では実装せず別 Issue に切り出し済み（ドキュメント追記時の **判断結果** に使用）

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
const event = await getEventInCommunity(community_id, event_id)
await runTransaction(db, async (t) => {
  // event は Transaction で保護されていない
  if (event?.is_public) { ... }
})

// OK: Transaction 内で読み込む
await runTransaction(db, async (t) => {
  const event = await getEventInCommunity(community_id, event_id, t)
  if (event?.is_public) { ... }
})
```

### NG: communityId が分かっているのに getEvent を使う

```typescript
// NG: communityId が分かっているのに collectionGroup の getEvent
const event = await getEvent(event_id)
if (event == null || event.community_id !== community_id) { ... }

// OK
const event = await getEventInCommunity(community_id, event_id, transaction)
if (event == null) { ... }
```

### NG: Transaction 内で write の後に read を実行する

Firestore のトランザクションは「すべての read → すべての write」の順序を厳守する必要がある。write 後の read は `FAILED_PRECONDITION` で拒否される。read+write を内包するメソッド（`addMember` 等）を Transaction 内で呼ぶ場合は特に注意。

```typescript
// NG: saveOrder（write）の後に addMember 内で transaction.get（read）が走る
await db.runTransaction(async (transaction) => {
  const orders = await getOrdersByIds(..., transaction) // read
  for (const order of orders) {
    saveOrder(..., order, transaction) // write
  }
  await community.addMember(uid, transaction) // 内部で transaction.get → read！エラー
})

// OK-1: read を全て先に実行する（addMember 内の read も含めて先に済ませる）
await db.runTransaction(async (transaction) => {
  const orders = await getOrdersByIds(..., transaction) // read
  const memberRef = db.collection('communities').doc(id).collection('members').doc(uid)
  const memberSnap = await transaction.get(memberRef) // read（addMember の read を先出し）
  for (const order of orders) {
    saveOrder(..., order, transaction) // write
  }
  transaction.set(memberRef, memberData) // write（addMember の write を後出し）
})

// OK-2: アトミック性が不要なら addMember をトランザクション外で呼ぶ
await db.runTransaction(async (transaction) => {
  const orders = await getOrdersByIds(..., transaction) // read
  for (const order of orders) {
    saveOrder(..., order, transaction) // write
  }
})
await community.addMember(uid) // トランザクション外
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
await updateEventMenus({ menuIds: menuObjects.map((m) => m.menu_id) })
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

### NG: アプリ層で `DEFAULT_TIME_ZONE` を直接参照する

海外対応時にタイムゾーン参照が散らばっていると置換コストが膨らむ。
`DEFAULT_TIME_ZONE` は `common` 内部に閉じ、アプリ層は zone を内部に閉じた util を呼ぶ。

```typescript
// NG: アプリ層で zone 参照（DEFAULT_TIME_ZONE）を露出させる
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from '@shokujii/common/utils/datetime.js'

const day = DateTime.fromMillis(ms, { zone: DEFAULT_TIME_ZONE }).day

// OK: zone を内部に閉じた util を使う（必要なら common に追加する）
import { getDayOfMonth } from '@shokujii/common/utils/datetime.js'

const day = getDayOfMonth(ms)
```

### NG: アプリ層で日付計算を組み立てる

`common` の定数 / zone / format を call site で結線するとローカライズや仕様変更の影響が広がる。
ドメイン的に意味のある計算は `common` に集約し、call site は 1 行で呼ぶ。

```typescript
// NG: 定数と zone と format を call site で結線する
import { DateTime } from 'luxon'
import { DEFAULT_TIME_ZONE } from '@shokujii/common/utils/datetime.js'
import { EVENT_RESERVATION_LEAD_TIME_DAYS } from '@shokujii/common/constants/eventReservation.js'

const min = DateTime.now()
  .setZone(DEFAULT_TIME_ZONE)
  .startOf('day')
  .plus({ days: EVENT_RESERVATION_LEAD_TIME_DAYS })
  .toFormat('yyyy-MM-dd')

// OK: ドメイン関数として common に集約し、call site は 1 行
import { getReservationLeadTimeMinDateString } from '@shokujii/common/utils/reservationLeadTime.js'

const min = getReservationLeadTimeMinDateString(Date.now())
```

### NG: 英語 locale ファイル（`en.ts`）の追加

本プロジェクトは **日本語 UI のみ**。`user/src/locales/messages/en.ts` のような部分英語ファイルは、メンテ負荷だけ増やし、実際には `locale: 'ja'` で使われない。

```typescript
// NG: 英語 locale の新規追加
// user/src/locales/messages/en.ts
export default { user: { friend_sort_last_met_at: 'Last met' } }
```

```typescript
// OK: 日本語のみ（base / user / partner の ja.ts）
// user/src/locales/messages/ja.ts
friend_sort_last_met_at: '最後に会った順',
```

### NG: vue-i18n の `$d` で日付・時刻をフォーマットする

vue-i18n の datetimeFormats は廃止済み。新規実装では `common` の Luxon ベース util を使う。

```vue
// NG: vue-i18n datetimeFormats に依存する
{{ $d(event.event_start_datetime, 'datetime_weekday_short') }}

// OK: common の convertToXxx を使う
import { convertToDatetimeWeekdayShort } from '@shokujii/common/utils/datetime.js'

{{ convertToDatetimeWeekdayShort(event.event_start_datetime) }}
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

### NG: `v-html` にユーザー入力をそのまま渡す

```vue
<!-- NG: TinyMCE 等のリッチテキストをサニタイズせず v-html で描画 -->
<div v-html="event.event_desc" />
```

```vue
<!-- OK: サニタイズしてから描画する -->
<div v-html="sanitizeHtml(event.event_desc)" />
```

`$t('...')` 等、開発者が管理する静的文字列のみを渡す場合はサニタイズ不要。

### NG: 1 回の操作で複数ドキュメントが変化する前提を欠いたトリガー処理

```typescript
// NG: 一括更新で複数行が同時に ordered になり、onDocumentWritten が複数回発火して
// 注文完了メールが重複送信される
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  if (event.data?.after.data()?.status === 'ordered') {
    await sendOrderCompleteMail(...) // 発火のたびに送られる
  }
})

// NG: 送信成功前に sent 確定フラグだけ立てる（送信 API 失敗時、次回は送信済み扱いで通知が永久欠落する）
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  const order = event.data?.after.data()
  if (order?.status !== 'ordered' || order.mail_sent_at != null) return
  await markMailSent(orderRef) // 送信前に sent を立てる
  await sendOrderCompleteMail(...) // ここで失敗すると再送されない
})

// OK: Transaction で未送信を原子的に確保してから送信し、成功後に sent 記録する
export const onOrderWritten = onDocumentWritten('.../member_orders/{orderId}', async (event) => {
  const order = event.data?.after.data()
  if (order?.status !== 'ordered' || order.mail_sent_at != null) return
  await db.runTransaction(async (t) => {
    const snap = await t.get(orderRef)
    if (snap.data()?.mail_sent_at != null) return
    t.update(orderRef, { mail_sending_at: FieldValue.serverTimestamp() })
  })
  await sendOrderCompleteMail(...)
  await markMailSent(orderRef)
})

// OK（本番パターン）: member_orders 単位の onDocumentWritten ではなく、確定処理の入口で 1 回だけ副作用
// → functions/default/src/orderConfirmedSideEffects.ts 参照
```

### NG: ループ内で Firestore read/write を逐次 await する

```typescript
// NG: メンバー数に比例して直列に await する（タイムアウト・コスト増）
for (const memberId of memberIds) {
  const membership = await getChatMembership(roomId, memberId)
}

// OK: 並列化する（必要なら並列度を制限する）
const memberships = await Promise.all(memberIds.map((memberId) => getChatMembership(roomId, memberId)))
```

### NG: カウンタ・上限チェックを read-then-write で行う

```typescript
// NG: 同時実行で increment が失われたり、上限チェックが古い値のまま通過する
const room = await getChatRoom(roomId)
if (room.unread_count < 99) {
  await saveChatRoom({ ...room, unread_count: room.unread_count + 1 })
}

// OK: FieldValue.increment で原子的に更新し、上限は Transaction 内で判定する
await db.runTransaction(async (t) => {
  const snapshot = await t.get(roomRef)
  if ((snapshot.data()?.unread_count ?? 0) >= 99) return
  t.update(roomRef, { unread_count: FieldValue.increment(1) })
})
```

### NG: Firestore Rules で新規・機微フィールドの書き込みを制約しない

```
// NG: community 作成時に enterprise_id を任意の値で自由に設定できる
match /communities/{communityId} {
  allow create: if request.auth != null
}

// OK: 書き込み可能な値を明示的に制約する
match /communities/{communityId} {
  allow create: if request.auth != null
    && request.resource.data.enterprise_id == null
}
```

### NG: `target="_blank"` に `rel="noopener noreferrer"` がない

```vue
<!-- NG: 開いた先のページから window.opener 経由で元ページを操作できてしまう -->
<a href="https://example.com" target="_blank">外部サイト</a>

<!-- OK -->
<a href="https://example.com" target="_blank" rel="noopener noreferrer">外部サイト</a>
```

`window.open(url, '_blank')` や `v-html` で描画するリンク、`ja.ts` の文言内リンクも対象。

### NG: Stripe Webhook で署名検証・べき等性を省略する

```typescript
// NG: パース済み body を使う（署名検証が機能しない）＋ 冪等チェックなし
export const stripeWebhook = onRequest(async (req, res) => {
  const event = JSON.parse(req.body)
  await handlePaymentIntentSucceeded(event.data.object)
  res.sendStatus(200)
})

// OK: rawBody + constructEvent で署名検証し、Transaction 内で処理済みを原子的に確保する
export const stripeWebhook = onRequest(async (req, res) => {
  const event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], webhookSecret)
  const txResult = await db.runTransaction(async (transaction) => {
    if (await getStripeByPaymentIntent(..., transaction) != null) return 'already_processed'
    // saveStripe + saveOrder を同一 transaction 内で実行
    return 'processed'
  })
  if (txResult === 'already_processed') {
    res.sendStatus(200)
    return
  }
  await handlePaymentIntentSucceeded(event.data.object)
  res.sendStatus(200)
})

// 詳細: functions/default/src/stripeWebhook.ts の handleOrderConfirmation 参照
```

### NG: Promise を返す権限チェック関数の await 漏れ

```typescript
// NG: hasRole() が Promise<boolean> を返すため、常に truthy と判定される
if (hasRole(uid, 'manager')) {
  await issueInviteUrl(communityId)
}

// OK
if (await hasRole(uid, 'manager')) {
  await issueInviteUrl(communityId)
}
```

### NG: トリガー内の例外をログのみで握りつぶす

```typescript
// NG: 例外を再 throw しないため Cloud Functions の自動リトライが働かず、
// Firestore とチャットの同期が取れないまま放置される
export const syncEventChatMember = onDocumentWritten(path, async (event) => {
  try {
    await addChatMember(...)
  } catch (e) {
    logger.error('failed to sync chat member', { error: e })
  }
})

// OK: 再 throw して自動リトライに乗せる
export const syncEventChatMember = onDocumentWritten(path, async (event) => {
  try {
    await addChatMember(...)
  } catch (e) {
    logger.error('failed to sync chat member', { error: e })
    throw e
  }
})
```

### NG: 複数ステップの作成処理でロールバックがない

```typescript
// NG: Firestore 保存に失敗すると Auth ユーザーだけが残り、
// email-already-exists で再登録できなくなる
export const registerUser = onCall(async (request) => {
  const authUser = await admin.auth().createUser({ email })
  await saveUser(new ShokujiiUser(authUser.uid, { ... })) // ここで失敗すると孤児化
})

// OK: 失敗時は作成済みリソースを補償削除する
export const registerUser = onCall(async (request) => {
  const authUser = await admin.auth().createUser({ email })
  try {
    await saveUser(new ShokujiiUser(authUser.uid, { ... }))
  } catch (e) {
    await admin.auth().deleteUser(authUser.uid)
    throw e
  }
})
```

### NG: 外部 URL のホスト名検証を startsWith のみで行う

```typescript
// NG: startsWith は https://lh3.googleusercontent.com.attacker.example にもマッチする
if (url.startsWith('https://lh3.googleusercontent.com')) {
  // 信頼済みとして扱う
}

// OK: URL をパースして protocol と hostname を厳密比較する
const parsed = new URL(url)
if (parsed.protocol === 'https:' && parsed.hostname === 'lh3.googleusercontent.com') {
  // 信頼済みとして扱う
}
```

### NG: DbSchema で nullable() を安易に使う

```typescript
// NG: 明示的に null を保存する特殊な理由がないのに nullable() にする
const XxxDbSchema = z.object({
  memo: z.string().nullable(),
})

// OK: optional 文字列は NonEmptyStringSchema で「フィールドなし」を表現する
const XxxDbSchema = z.object({
  memo: NonEmptyStringSchema.optional(),
})
```

日付範囲の「開始日時のみ設定可能」等、明示的に `null` が必要な特殊ケースは `TimestampSchema.nullable()` のように使ってよい（例: `PartnerMenu.ts`）。
