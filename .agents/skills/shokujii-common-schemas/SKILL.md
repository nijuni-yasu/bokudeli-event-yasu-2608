---
name: shokujii-common-schemas
description: Shokujii プロジェクトにおける common の Zod スキーマ設計ルール。DbSchema / AppSchema、TimestampSchema / EpochMillisSchema の使い分けを正しく実装するためのスキル。新しい Firestore スキーマを追加する、common にスキーマを定義する、Event や User などの既存スキーマにフィールドを追加する、日付・時刻フィールドを扱う場合に必ず参照すること。「スキーマを追加して」「common の型を定義して」「created_at を追加して」「Event に新しいフィールドを追加して」など、common/src/schemas や common/src/apis を触る依頼時に使用する。
---

# Shokujii Common Schemas

common パッケージにおける Zod スキーマの設計と実装パターン。Firestore の各 Document に対応するスキーマを定義する際のルール。

## 必須ルール

### 日付・時刻フィールド

- **DbSchema**: `TimestampSchema` を使う。Firestore に Timestamp 型で保存するため。
- **AppSchema**: `EpochMillisSchema` を使う。Firestore の Timestamp を number に正規化し、アプリ側で扱いやすくするため。

日付・時刻の扱いは AI が誤りやすい箇所。必ず上記を使い分けること。

### DbSchema と AppSchema の役割

| スキーマ | 用途 | 日付・時刻 |
|---------|------|-----------|
| DbSchema | Firestore への書き込み時に適用 | TimestampSchema |
| AppSchema | 読み込み時、constructor での初期化時に適用 | EpochMillisSchema |

### その他のルール

- **nullable()**: 明示的に null が必要な特殊ケース以外は使わない
- **文字列**: optional 文字列は `NonEmptyStringSchema`。空文字を FieldValue.delete に変換し、ユーザー未設定時はフィールドなしとする（空文字とフィールドなしは Firestore で意味が異なる）。空文字を DB に保存する特殊ケースは `z.string().optional()` も検討可（現状の実装例はなし）
- **convertToDb**: Timestamp 変換、updated_at の自動更新、created_at のデフォルト設定を行う

## 参照ファイル

**代表的な参考ファイル**:

- `common/src/schemas/firebase/index.ts` - TimestampSchema, EpochMillisSchema の定義
- `common/src/schemas/EventOrder.ts` - convertToDb を含む代表例

| 対象 | 参照 | 内容 |
|------|------|------|
| スキーマ定義の詳細 | [references/zod-patterns.md](references/zod-patterns.md) | DbSchema / AppSchema、クラス構造、convertToDb、特殊パターン |
| functions での使用 | [references/common-schemas-in-functions.md](references/common-schemas-in-functions.md) | Firestore 読み書き、API バリデーション、拡張クラス |

**詳細**: プロジェクトルート（リポジトリルート）からの相対パス `documents/実装メモ/common_schemas における zod の使い方.md` に完全なドキュメントがある。複雑なパターンはそちらを参照すること。

## クイックチェックリスト

新規スキーマ作成時:

- [ ] DbSchema に TimestampSchema を使っているか
- [ ] AppSchema に EpochMillisSchema を使っているか
- [ ] convertToDb で updated_at を更新しているか
- [ ] コンストラクタで AppSchema.parse を使っているか
- [ ] isValidForDatabase と toFirestore を実装しているか

## よくある誤り

**NG**: DbSchema に EpochMillisSchema を使う  
**OK**: DbSchema は TimestampSchema

**NG**: AppSchema に TimestampSchema を使う  
**OK**: AppSchema は EpochMillisSchema

**NG**: 日付フィールドに z.number や z.date を直接使う  
**OK**: DbSchema は TimestampSchema、AppSchema は EpochMillisSchema
