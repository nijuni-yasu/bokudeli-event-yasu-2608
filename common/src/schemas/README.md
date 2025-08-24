# Schemas

Firestore の各 Docuemnt に対応する zod schema を定義するディレクトリです。
各ドキュメントに対して、以下2タイプの schema を用意します。

## xxxDbSchema

Firestore DB に書き込む際に適用される schema です。

- 基本的に `nullable()` は使用しない方針です
  明示的に `null` を使用しないといけない特殊なケースを除き、使用しないでください
- 文字列に関しては、ユーザーが明示的に空文字を設定することが可能な場合は `z.string().optional()` を使用、そうでない場合は `NonEmptyStringSchema` を使用してください
- Timestamp は `TimestampSchema` を使用してください

## xxxAppSchema

Firestore DB から読み込まれる際、または new によって作成される際に適用される schema です。
生成される class の型を保証するためのものなので、基本的に `default()` を使用し、型が一意に決まるようにしてください。（ただし、 Mandatory 項目に関してはその限りではない）

- DB で Timestamp として保存される項目は `EpochMillisSchema` を使用して `number` に変換します
  