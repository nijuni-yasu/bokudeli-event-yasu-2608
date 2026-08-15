# Schemas

Firestore の各 Document に対応する zod schema を定義するディレクトリです。
各ドキュメントに対して、以下2タイプの schema を用意します。

## xxxDbSchema

Firestore DB に書き込む際に適用される schema です。

- 基本的に `nullable()` は使用しない方針です
  明示的に `null` を使用しないといけない特殊なケースを除き、使用しないでください
- 文字列に関しては、optional 文字列は `NonEmptyStringSchema` を使用してください。空文字を FieldValue.delete に変換し、ユーザー未設定時はフィールドなしとする（空文字とフィールドなしは Firestore で意味が異なる）。空文字を DB に保存する特殊ケースは `z.string().optional()` も検討可
- Timestamp は `TimestampSchema` を使用してください

## xxxAppSchema

Firestore DB から読み込まれる際、または new によって作成される際に適用される schema です。
生成される class の型を保証するためのものなので、基本的に `default()` を使用し、型が一意に決まるようにしてください。（ただし、 Mandatory 項目に関してはその限りではない）

- DB で Timestamp として保存される項目は `EpochMillisSchema` を使用して `number` に変換します

## eventWrite.ts と poc/

**`eventWrite.ts`** は Event の **write 経路専用**スキーマ（H1: App write strict + Db flat 寛容）。`event_payment` を判別子とする `discriminatedUnion` で、エンプラ書き込み時に `enterprise_id` を型で必須化する。補助設定は Event に持たず Enterprise `subsidy_settings_history` を開催月で解決する。package から export し、`base/src/stores/eventDraft.ts` 等の書き込み前検証に使う。正本: [05_WS-C_C-1_PoC設計.md](../../../documents/08_エンタープライズ/30_リファクタ計画/05_WS-C_C-1_PoC設計.md)（PR-C1b で昇格済み）。

**`poc/`** は C-1 PoC 用の **A/B/C 方式比較**（discriminatedUnion / extend / ネスト）のみ。package export の対象ではなく、方式選定と G1 ゲート用の試作・テスト置き場である。本番 write スキーマは `eventWrite.ts` を参照すること。
