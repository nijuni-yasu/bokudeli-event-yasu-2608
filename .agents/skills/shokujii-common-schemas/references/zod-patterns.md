# common/src/schemas における Zod パターン

Firestore の各 Document に対応する zod スキーマの定義パターン。`documents/実装メモ/common_schemas における zod の使い方.md` の要約。

## 目次

1. [DbSchema と AppSchema](#dbschema-と-appschema)
2. [ヘルパースキーマ](#ヘルパースキーマ)
3. [convertToDb](#converttodb)
4. [クラス実装パターン](#クラス実装パターン)
5. [特殊パターン](#特殊パターン)
6. [参考ファイル](#参考ファイル)

## DbSchema と AppSchema

### DbSchema

Firestore DB に書き込む際に適用。ルール:

- 日付・時刻: `TimestampSchema`
- 文字列: optional 文字列は `NonEmptyStringSchema`（空文字→FieldValue.delete、ユーザー未設定時はフィールドなし）。空文字を DB に保存する特殊ケースは `z.string().optional()` も検討可
- `nullable()` は特殊ケース以外使わない

```typescript
const EventOrderDbSchema = z.object({
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  community_id: z.string().nonempty(),
  receipt_number: NonEmptyStringSchema.optional(),
})
```

### AppSchema

読み込み時、constructor での初期化時に適用。ルール:

- 日付・時刻: `EpochMillisSchema`（number に変換）
- 基本的に `default()` で型を一意に
- AppSchema を作らない場合: コメントで理由を明記

```typescript
const EventOrderAppSchema = z.object({
  community_id: z.string().nonempty(),
  status: z.enum(EVENT_ORDER_STATUS_VALUES).default('in_cart'),
  ordered_at: EpochMillisSchema.optional(),
})
```

## ヘルパースキーマ

| スキーマ | 用途 | 使用箇所 |
|---------|------|----------|
| TimestampSchema | Firestore Timestamp に正規化 | DbSchema |
| EpochMillisSchema | number（ミリ秒）に正規化 | AppSchema |
| NonEmptyStringSchema | 空文字を FieldValue.delete に変換。ユーザー未設定時はフィールドなしとする（空文字とフィールドなしは Firestore で意味が異なる） | DbSchema の optional 文字列 |

NonEmptyStringSchema の意図: Firestore では string において「空文字 ""」と「フィールドなし」は意味が異なる。ユーザーが値を設定しない場合は、空文字ではなくフィールドなしとするためのスキーマ。

```typescript
import { TimestampSchema, EpochMillisSchema, NonEmptyStringSchema } from './firebase/index.js'
```

## convertToDb

AppSchema から DbSchema への変換。役割:

- Timestamp 変換（number → Timestamp）
- updated_at の自動更新
- created_at のデフォルト設定

```typescript
const convertToDb = (order: EventOrder) => {
  return {
    ...order,
    created_at: EpochMillisSchema.default(Date.now()).parse(order.created_at),
    updated_at: Date.now(),
  }
}
```

`convertToDb` は `updated_at` を number のまま返す。`toFirestore` 内の `DbSchema.parse` で `TimestampSchema` が number → Timestamp に変換する。

convertToDb を使わないパターン: Banners.ts、Config.ts、PassCode.ts など。その場合 `DbSchema.safeParse(this)` を直接使用。

## クラス実装パターン

### コンストラクタ

```typescript
constructor(event_id: string, order_id: string, src: Partial<EventOrder>) {
  Object.assign(this, EventOrderAppSchema.parse(src))
  this.event_id = event_id
  this.id = order_id
  this.order_id = order_id
  this.created_at = EpochMillisSchema.default(Date.now()).parse(src.created_at)
  this.updated_at = EpochMillisSchema.default(Date.now()).parse(src.updated_at)
}
```

### isValidForDatabase と toFirestore

```typescript
isValidForDatabase(): boolean {
  return EventOrderDbSchema.safeParse(convertToDb(this)).success
}

toFirestore(): z.infer<typeof EventOrderDbSchema> {
  return EventOrderDbSchema.parse(convertToDb(this))
}
```

Event のように toFirestore にパラメータが必要な場合: `toFirestore(updateUserId: string)` を実装し、Converter でパラメータを管理。

## 特殊パターン

### discriminatedUnion

複数型を判別フィールドで区別（CommunityLetter.ts）:

```typescript
const LetterDbSchema = z.discriminatedUnion('letter_type', [
  CommunityLetterDbSchema,
  EventLetterDbSchema
])
```

### merge と passthrough

既存スキーマの拡張（EventLog.ts）:

```typescript
const EventLogDbSchema = z.object({ updated_at: TimestampSchema }).merge(EventDbSchema.partial())
const EventLogAppSchema = z.object({ updated_at: EpochMillisSchema }).passthrough()
```

### nullable()

日付範囲で「開始日時のみ設定可能」など（PartnerMenu.ts）:

```typescript
menu_date_start: TimestampSchema.nullable(),
menu_date_end: TimestampSchema.nullable(),
```

### DocumentReference

可能な限り避ける。firebase/index.ts のコメント参照。

## 参考ファイル

- `common/src/schemas/EventOrder.ts` - 複雑な例
- `common/src/schemas/EventMenu.ts` - シンプルな例
- `common/src/schemas/Event.ts` - パラメータ付き toFirestore
- `common/src/schemas/User.ts` - Optional フィールドが多い例
- `common/src/schemas/Community.ts` - AppSchema なし
- `common/src/schemas/Banners.ts` - convertToDb なし
- `common/src/schemas/CommunityLetter.ts` - discriminatedUnion
- `common/src/schemas/PartnerMenu.ts` - nullable
- `common/src/schemas/firebase/index.ts` - ヘルパースキーマ定義
