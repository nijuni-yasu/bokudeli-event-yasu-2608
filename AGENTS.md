# AGENTS.md

AIエージェント向けプロジェクトガイド。

**出力は必ず日本語で行ってください。**

## Skills スキル（定型タスクの手順書）

**プロジェクトオリジナル**のスキル。以下のタスクを依頼された場合、対応するスキルファイルを読み込んで手順に従うこと。

| タスク                         | スキル                         |
| :----------------------------- | :----------------------------- |
| コミットメッセージ生成         | `/git-commit-message`          |
| PR 本文生成                    | `/git-create-pull-request`     |
| コードレビュー                 | `/shokujii-code-review`        |
| lint・format チェック          | `/lint-and-format`             |
| fixup                          | `/git-fixup`                   |
| squash                         | `/git-squash`                  |
| レビューコメント検討           | `/review-comments-evaluate`    |
| レビューコメント返信           | `/review-comments-reply`       |
| コードレビュードキュメント更新 | `/review-doc-update`           |
| 分割コミット                   | `/git-split-commit`            |
| スキル提案                     | `/skill-propose`               |

## 推奨スキル（技術スタック別）

**外部からインストールした**スキル。以下のタスク時は、該当スキルを `/スキル名` で参照して利用すること。

| タスク                     | スキル                         | タイミング     |
| :------------------------- | :----------------------------- | :------------- |
| Vue コンポーネント実装     | `/vue-best-practices`          | 実装時、レビュー時 |
| ルーティング・ナビゲーション | `/vue-router-best-practices`   | 実装時         |
| Vue のデバッグ             | `/vue-debug-guides`            | デバッグ時     |
| Firestore の読み書き・ルール | `/firebase-firestore-standard` | 実装時         |
| Stripe 決済実装            | `/stripe-integration`          | 実装時         |
| UI の設計・実装           | `/frontend-design`             | 新規ページ・コンポーネント作成時、スタイリング・ビジュアル改善時 |
| UI のレビュー・品質チェック | `/web-design-guidelines`       | アクセシビリティ確認時、UX レビュー時、PR マージ前の品質チェック時 |

## プロジェクト概要

**プロジェクト名**: Shokujii（食事でつながる）
**概要**: 食事関連のコミュニティイベント管理プラットフォーム。
**アーキテクチャ**: Firebase ベースのモノレポ（`npm workspaces`）。

## ディレクトリ構造

### アクティブ

| パス                   | 概要                   | 技術スタック                                 |
| :--------------------- | :--------------------- | :------------------------------------------- |
| **/user**              | 一般ユーザー向けアプリ | Vue 3 + Vite + Vuetify 3                     |
| **/admin**             | 飲食店向け管理画面     | Vue 3 + Vite + Vuetify 3                     |
| **/functions/default** | バックエンドロジック   | Firebase Functions v2 (Node 20) + TypeScript |
| **/common**            | 共有コード             | TypeScript (Schema, Utils)                   |
| **/base**              | 共有UIコンポーネント   | Vue 3 (Materio Template)                     |

### レガシー (Deprecated) — 新規コード生成時の参照禁止

| パス                             | 概要                          |
| :------------------------------- | :---------------------------- |
| **/manager**                     | 運営向け管理画面 (Legacy)     |
| **/functions/legacy**            | バックエンドロジック (Legacy) |
| **/functions/shokujii-slackbot** | Slack 連携ボット              |
| **/functions/shokujii-linebot**  | LINE 連携ボット               |

## 外部サービス連携

コードを書く際は各サービスの公式ドキュメントを参照してください。

- **SendGrid** - メールサービス
- **Stripe** - 決済処理
- **Adobe PDF Services** - ドキュメント生成
- **Slack/LINE** - ボット連携

## 技術スタック・ルール

- **パッケージマネージャ**: `npm`（`yarn` 禁止）
- **言語**: TypeScript（`any` 禁止）
- **フォーマッタ**: Prettier (`.prettierrc`)
- **Linter**: ESLint (`eslint.config.mjs`)

### 開発コマンド

`-m <env_file_postfix>` は環境変数ファイルの接尾辞（例: `-m development` → `.env.development`）。

```
npm install
npm -w <pkg> run dev -- -m <env_file_postfix>
npm -w <pkg> run build -- -m <env_file_postfix>
npm -w <pkg> run lint
npm -w <pkg> run format:check
```

## 作業前の確認事項

1. `documents/` 内の仕様書・各パッケージの `README.md` を読んでプロジェクトの文脈を理解する
2. `common` / `base` にある再利用可能なコードを優先的に使用し、重複実装を避ける
3. Firebase Security Rules (`firestore.rules`, `storage.rules`) へのセキュリティ影響を意識する

### Firestore 操作の必須ルール（厳守）

- **DB 操作は必ず store 経由**: `db.collection()`、`update`、`set`、`delete` 等を直接呼ばない。`base/src/stores/` または `functions/default/src/stores/` の関数を経由すること。
- **xxxRef は必ず withConverter 付き**: DocumentReference を取得する際は store の `withConverter` 付き ref を使う（Zod バリデーションを維持するため）。
- **Functions の Firestore 操作**: `functions/default` では `documents/実装メモ/functionsにおける store の使い方.md` を参照し、store 関数のみで読み書きすること。

### スキーマの日付・時刻フィールド（common/src/schemas/firebase）

- **DbSchema**: 日付・時刻フィールドには `TimestampSchema` を使う（Firestore に Timestamp 型で保存するため）
- **AppSchema**: 日付・時刻フィールドには `EpochMillisSchema` を使う（Firestore の Timestamp を number に正規化し、アプリ側で扱いやすくするため）

### パッケージ依存関係の注意

`base` は本来 `common` のみに依存すべきだが、現状 `user` 等との依存反転が発生している箇所がある。新規コード作成時はこの依存反転を避けて設計すること。

## セキュリティ（必須）

- `.env`, `.secret`, `.firebaserc` はコミット禁止
- `.secret` をエージェントが読み込むことは禁止
- Firebase Security Rules の既存の権限設定・バリデーションを壊さないこと

## Git ルール

- コミットメッセージは日本語で記述する
- main ブランチへの直接コミット禁止
- `package-lock.json` は必ずコミットする
- タイトルの接頭辞に変更したディレクトリと Issue 番号を含める
  - 例: `[admin] #1777 注文詳細画面の修正`
  - 例: `[base][common] #1799 withConverter の削除を禁止`
  - 例: `[ai] #1800 分割コミットスキルに doc と ai タグを追加`
  - 使用可能なタグ: `[user]` `[admin]` `[base]` `[common]` `[functions]` `[doc]` `[ai]`
  - [doc]: documents/ 内の更新のみ。[ai]: .cursor / .agents / .github / CLAUDE.md / AGENTS.md 等

## コードレビュー

PR・コードレビューのコメントは必ず日本語で行う。
レビュー時はプロジェクト固有のチェックリストに従うこと。

チェックリスト: `.agents/skills/shokujii-code-review/shokujii-code-review.md`
