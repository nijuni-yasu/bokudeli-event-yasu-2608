# common/src/schemas における zod の使い方

このドキュメントは、`common/src/schemas` ディレクトリで使用されている zod スキーマの定義パターンと使い方を説明します。

## 概要

Firestore の各 Document に対応する zod schema を定義する際は、以下の2つのスキーマタイプを使用します：

1. **DbSchema** - Firestore DB に書き込む際に適用されるスキーマ
2. **AppSchema** - Firestore DB から読み込まれる際、または `new` によって作成される際に適用されるスキーマ

## 基本的な構造

各スキーマファイルは以下の構造を持ちます：

```typescript
import { z } from 'zod'
import { TimestampSchema, EpochMillisSchema, NonEmptyStringSchema } from './firebase/index.js'

// 1. DbSchema の定義
const XxxDbSchema = z.object({
  // フィールド定義
})

// 2. AppSchema の定義（必要な場合）
const XxxAppSchema = z.object({
  // フィールド定義
})

// 3. convertToDb 関数の定義
const convertToDb = (xxx: Xxx) => {
  return {
    // 変換ロジック
  }
}

// 4. クラスの定義
export class Xxx {
  // プロパティ定義
  
  constructor(id: string, src: Partial<Xxx>) {
    // 初期化ロジック
  }
  
  isValidForDatabase(): boolean {
    // バリデーション
  }
  
  toFirestore(): z.infer<typeof XxxDbSchema> {
    // Firestore 形式への変換
  }
}
```

## DbSchema（データベーススキーマ）

Firestore DB に書き込む際に適用されるスキーマです。

### ルール

- 基本的に `nullable()` は使用しない方針です
  - 明示的に `null` を使用しないといけない特殊なケースを除き、使用しないでください
- 文字列に関しては、optional 文字列は `NonEmptyStringSchema` を使用してください。空文字を FieldValue.delete に変換し、ユーザー未設定時はフィールドなしとする（空文字とフィールドなしは Firestore で意味が異なる）。空文字を DB に保存する特殊ケースは `z.string().optional()` も検討可
- Timestamp は `TimestampSchema` を使用してください

### 例

```typescript
const EventOrderDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  carted_at: TimestampSchema,
  community_account: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
  status: z.enum(EVENT_ORDER_STATUS_VALUES),
  event_payment: z.enum(EVENT_PAYMENT_VALUES),
  // Optional
  ordered_at: TimestampSchema.optional(),
  canceled_at: TimestampSchema.optional(),
  payment_intent: z.string().nonempty().optional(),
  receipt_number: NonEmptyStringSchema.optional(),
})
```

## AppSchema（アプリケーションスキーマ）

Firestore DB から読み込まれる際、または `new` によって作成される際に適用されるスキーマです。

### ルール

- 生成される class の型を保証するためのものなので、基本的に `default()` を使用し、型が一意に決まるようにしてください
- Mandatory 項目に関してはその限りではない
- DB で Timestamp として保存される項目は `EpochMillisSchema` を使用して `number` に変換します
- **AppSchema を作成しない場合**: クラスのプロパティにデフォルト値を直接設定し、`Object.assign(this, src)` で初期化するパターンもあります（例: `Community.ts`, `CommunityMember.ts`）
  - この場合、コメントで「ほぼデフォルトなので AppSchema は（いまのところ）作成しない」などと理由を明記してください

### 例

```typescript
const EventOrderAppSchema = z.object({
  // Mandatory
  community_account: z.string().nonempty(),
  community_id: z.string().nonempty(),
  event_id: z.string().nonempty(),
  order_id: z.string().nonempty(),
  user_id: z.string().nonempty(),
  menus: z.array(OrderMenuSchema).nonempty(),
  event_payment: z.enum(EVENT_PAYMENT_VALUES),
  // Default
  status: z.enum(EVENT_ORDER_STATUS_VALUES).default('in_cart'),
  // Optional
  ordered_at: EpochMillisSchema.optional(),
  canceled_at: EpochMillisSchema.optional(),
  receipt_number: z.string().optional(),
  payment_intent: z.string().optional(),
})
```

## convertToDb 関数

`AppSchema` から `DbSchema` に変換するための関数です。

### 役割

- Timestamp の変換（`number` → `Timestamp`）
- `updated_at` の自動更新
- `created_at` のデフォルト値設定（新規作成時）

### 例

```typescript
const convertToDb = (order: EventOrder) => {
  return {
    ...order,
    created_at: EpochMillisSchema.default(Date.now()).parse(order.created_at),
    updated_at: Date.now(),
  }
}
```

より複雑な例（`Event` の場合）：

```typescript
const convertToDb = (event: Event, updated_by: string) => {
  return {
    ...event,
    created_at: EpochMillisSchema.default(Date.now()).parse(event.created_at),
    created_by: event.created_by ?? updated_by,
    updated_at: Date.now(),
    updated_by,
    members: event.members.map((id) => getRefFromPath(`users/${id}`)),
    event_num_members: event.members.length,
  }
}
```

### convertToDb を使わないパターン

シンプルなスキーマでは、`convertToDb` 関数を定義せず、クラスのプロパティを直接 `DbSchema` でパースするパターンもあります
（例: `Banners.ts`, `Config.ts`, `PassCode.ts`, `CommunityMember.ts`）。

この場合、`isValidForDatabase()` と `toFirestore()` では直接 `this` をパースします：

```typescript
isValidForDatabase(): boolean {
  return BannersDbSchema.safeParse(this).success
}

toFirestore(): z.infer<typeof BannersDbSchema> {
  return BannersDbSchema.parse(this)
}
```

## クラスの実装パターン

### コンストラクタ

`AppSchema` を使用して初期化します：

```typescript
constructor(event_id: string, order_id: string, src: Partial<EventOrder>) {
  Object.assign(this, EventOrderAppSchema.parse(src))
  this.event_id = event_id
  this.id = order_id
  this.order_id = order_id
  this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
  this.carted_at = EpochMillisSchema.default(Date.now()).parse(src.carted_at ?? src.created_at)
  this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
}
```

#### コンストラクタでの特殊処理

コンストラクタ内でデフォルト値の生成や変換を行うことができます：

```typescript
// デフォルト画像の生成（Community.ts の例）
constructor(id: string, src: Partial<Community>) {
  if (isEmpty(src.community_cover_image_url) || isEmpty(src.community_icon_image_url)) {
    const randomIndex = Math.floor(Math.random() * COMMUNITY_DEFAULT_IMAGE_SETS.length)
    src.community_cover_image_url = COMMUNITY_DEFAULT_IMAGE_SETS[randomIndex].cover
    src.community_icon_image_url = COMMUNITY_DEFAULT_IMAGE_SETS[randomIndex].icon
  }
  if (isEmpty(src.community_account)) {
    src.community_account = generateRandomAccount()
  }
  Object.assign(this, src)
  // ...
}

// ランダムコードの生成（PassCode.ts の例）
constructor(id: string, src: Partial<PassCode>) {
  Object.assign(this, PassCodeAppSchema.parse(src))
  this.id = id
  this.pass_code = z.string().default(generatePassCode()).parse(src.pass_code)
  this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
}
```

### isValidForDatabase メソッド

データベースに保存可能かどうかをチェックします：

```typescript
isValidForDatabase(): boolean {
  return EventOrderDbSchema.safeParse(convertToDb(this)).success
}
```

### toFirestore メソッド

Firestore に保存可能な形式に変換します：

```typescript
toFirestore(): z.infer<typeof EventOrderDbSchema> {
  return EventOrderDbSchema.parse(convertToDb(this))
}
```

## よく使うヘルパースキーマ

### TimestampSchema

Firestore の Timestamp 型を扱うためのスキーマです。DB に書き込む際に使用します。

```typescript
import { TimestampSchema } from './firebase/index.js'

const XxxDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
})
```

### EpochMillisSchema

Timestamp を `number`（ミリ秒のエポック時間）に変換するスキーマです。アプリケーション側で使用します。

```typescript
import { EpochMillisSchema } from './firebase/index.js'

const XxxAppSchema = z.object({
  created_at: EpochMillisSchema.default(Date.now()),
  updated_at: EpochMillisSchema.optional(),
})
```

### NonEmptyStringSchema

空文字を Firestore の `FieldValue.delete()` に変換するスキーマです。Firestore では string において「空文字 ""」と「フィールドなし」は意味が異なる。ユーザーが値を設定しない場合は、空文字として保存するのではなく、フィールド自体を存在させない（フィールドなし）とするためのスキーマ。DbSchema の optional 文字列フィールドに使用します。

```typescript
import { NonEmptyStringSchema } from './firebase/index.js'

const XxxDbSchema = z.object({
  // Optional なフィールドで、空文字列の場合は削除したい場合
  receipt_number: NonEmptyStringSchema.optional(),
})
```

## 実装例

### シンプルな例（EventMenu）

```typescript
import { z } from 'zod'
import { TimestampSchema } from './firebase/index.js'

const EventMenuDbSchema = z.object({
  updatedAt: TimestampSchema,
  menu_description: z.string().nonempty(),
  menu_image_url: z.string().url().nonempty(),
  menu_name: z.string().nonempty(),
  menu_price: z.number().int().positive(),
  is_sold_out: z.boolean(),
  menu_sort_number: z.number().int().nonnegative(),
})

const EventMenuAppSchema = z.object({
  // Mandatory
  menu_name: z.string().nonempty(),
  // Default
  menu_price: z.number().int().positive().default(100),
  menu_image_url: z.string().default(''),
  menu_description: z.string().default(''),
  is_sold_out: z.boolean().default(false),
  // Mandatory
  menu_sort_number: z.number().int().nonnegative(),
})

const convertToDb = (menu: EventMenu) => {
  return {
    ...menu,
    updatedAt: Date.now(),
  }
}

export class EventMenu {
  readonly id: string
  readonly menu_id: string
  readonly event_id: string
  updatedAt: number
  menu_description!: string
  menu_image_url!: string
  menu_name!: string
  menu_price!: number
  is_sold_out!: boolean
  menu_sort_number!: number

  constructor(event_id: string, menu_id: string, src: Partial<EventMenu>) {
    Object.assign(this, EventMenuAppSchema.parse(src))
    this.event_id = event_id
    this.id = menu_id
    this.menu_id = menu_id
    this.updatedAt = Date.now()
  }

  isValidForDatabase(): boolean {
    return EventMenuDbSchema.safeParse(convertToDb(this)).success
  }

  toFirestore(): z.infer<typeof EventMenuDbSchema> {
    return EventMenuDbSchema.parse(convertToDb(this))
  }
}
```

### 複雑な例（Event）

`Event` クラスでは、`convertToDb` と `toFirestore` に追加のパラメータ（`updated_by`）が必要です：

```typescript
isValidForDatabase(updateUserId: string): boolean {
  return EventDbSchema.safeParse(convertToDb(this, updateUserId)).success
}

toFirestore(updateUserId: string): any {
  return EventDbSchema.parse(convertToDb(this, updateUserId))
}
```

## 特殊なスキーマパターン

### discriminatedUnion（判別可能なユニオン）

異なる型のスキーマを `letter_type` などの判別フィールドで区別する場合に使用します（例: `CommunityLetter.ts`）：

```typescript
const CommunityLetterDbSchema = z.object({
  letter_type: z.literal('community'),
  // ...
})

const EventLetterDbSchema = z.object({
  letter_type: z.enum(['event_participant', 'event_non_participant']),
  // ...
})

const LetterDbSchema = z.discriminatedUnion('letter_type', [
  CommunityLetterDbSchema,
  EventLetterDbSchema
])
```

### merge と passthrough

既存のスキーマを拡張する場合に使用します（例: `EventLog.ts`）：

```typescript
const EventLogDbSchema = z
  .object({
    updated_at: TimestampSchema,
    updated_by: z.string().nonempty(),
  })
  .merge(EventDbSchema.partial())

const EventLogAppSchema = z
  .object({
    updated_at: EpochMillisSchema,
    updated_by: z.string().nonempty(),
  })
  .passthrough() // 追加のフィールドを許可
```

### DocumentReference の扱い

`Event.ts` では、`DocumentReference` と `string` の両方を受け入れて `string` に変換するスキーマを使用しています：

```typescript
const MemberIdSchema = z
  .string()
  .nonempty()
  .or(z.custom<typeof DocumentReference>())
  .transform((value) => (typeof value === 'string' ? value : (value as typeof DocumentReference).id))
```

**注意**: `DocumentReference` の扱いは複雑なため、可能な限り避けることを推奨します。`firebase/index.ts` のコメントにも「この実装はかなり無理矢理なので、DB で DocumentReference を使用するのは避けた方がよいかもしれない」と記載されています。

### nullable() の使用例

日付範囲などで「開始日時のみ設定可能」といった要件がある場合は `TimestampSchema.nullable()` を使用することがあります（例: `PartnerMenu.ts` の `menu_date_start`, `menu_date_end`）：

```typescript
const PartnerMenuDbSchema = z.object({
  menu_date_start: TimestampSchema.nullable(),
  menu_date_end: TimestampSchema.nullable(),
})
```

### z.pipe() による変換チェーン

複数の変換を連鎖させる場合に使用します（例: `PartnerShop.ts`）：

```typescript
const TimeStringSchema = z
  .number()
  .nullable()
  .transform((val) => (val == null ? '' : convertToTimeString(val, 'UTC')))

const XxxDbSchema = z.object({
  time_start: TimeStringSchema.pipe(z.string().nonempty()),
})
```

## schemas/firebase/index.ts の動的ロード

`schemas/firebase/index.ts` では、クライアント側とサーバー側で異なる Firebase SDK を使用するため、動的ロードを実装しています。

### 仕組み

- **クライアント側**: `firebase/firestore` を使用（`firebase.client.ts`）
- **サーバー側**: `firebase-admin/firestore` を使用（`firebase.server.ts`）
- `IS_SERVER` 定数によって実行環境を判定し、適切なモジュールを動的にインポートします

### 注意事項

- `DocumentReference` の扱いについては、コメントにもあるように「この実装はかなり無理矢理なので、DB で DocumentReference を使用するのは避けた方がよいかもしれない」とされています
- 新しいスキーマで `DocumentReference` を使用する場合は、この動的ロードの仕組みを理解した上で実装してください

## チェックリスト

新しいスキーマを作成する際のチェックリスト：

- [ ] `DbSchema` を定義し、`TimestampSchema` を使用しているか
- [ ] `AppSchema` を定義し、`EpochMillisSchema` を使用しているか（必要な場合）
- [ ] `convertToDb` 関数を定義し、`updated_at` を更新しているか
- [ ] クラスのコンストラクタで `AppSchema.parse()` を使用しているか
- [ ] `isValidForDatabase()` メソッドを実装しているか
- [ ] `toFirestore()` メソッドを実装しているか
- [ ] 空文字列を扱うフィールドには `NonEmptyStringSchema` を使用しているか
- [ ] Optional フィールドには `.optional()` を使用しているか

## 参考ファイル

### schemas ディレクトリ

- `common/src/schemas/EventOrder.ts` - 複雑な例
- `common/src/schemas/EventMenu.ts` - シンプルな例
- `common/src/schemas/Event.ts` - パラメータ付きの例、DocumentReference の扱い
- `common/src/schemas/User.ts` - Optional フィールドが多い例
- `common/src/schemas/Community.ts` - AppSchema がない例、コンストラクタでの特殊処理
- `common/src/schemas/CommunityMember.ts` - AppSchema がない例、convertToDb を使わない例
- `common/src/schemas/Banners.ts` - convertToDb を使わない例
- `common/src/schemas/Config.ts` - convertToDb を使わない例
- `common/src/schemas/PassCode.ts` - convertToDb を使わない例、コンストラクタでの特殊処理
- `common/src/schemas/CommunityLetter.ts` - discriminatedUnion の例
- `common/src/schemas/EventLog.ts` - merge と passthrough の例
- `common/src/schemas/PartnerMenu.ts` - nullable() の使用例
- `common/src/schemas/PartnerShop.ts` - z.pipe() の使用例、複雑な変換スキーマ
- `common/src/schemas/UserPersonalInformation.ts` - z.or() の使用例
- `common/src/schemas/firebase/index.ts` - ヘルパースキーマの定義、動的ロードの実装

### apis ディレクトリ

`common/src/apis` ディレクトリに新しい API 型定義を追加する際は、`common/src/apis/user.ts` をベースの参考にしてください。

- `common/src/apis/user.ts` - API リクエスト/レスポンス型定義の基本パターン

