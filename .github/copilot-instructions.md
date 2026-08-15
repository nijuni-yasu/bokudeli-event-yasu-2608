## プロジェクト概要

**プロジェクト名**: Shokujii（食事でつながる）
**概要**: 食事関連のコミュニティイベント管理プラットフォーム。
**アーキテクチャ**: Firebase ベースのモノレポ（`npm workspaces`）。

## ディレクトリ構造

### アクティブ

| パス                   | 概要                   | 技術スタック                                 |
| :--------------------- | :--------------------- | :------------------------------------------- |
| **/user**              | 一般ユーザー向けアプリ | Vue 3 + Vite + Vuetify 3                     |
| **/partner**           | 飲食店向け管理画面     | Vue 3 + Vite + Vuetify 3                     |
| **/functions/default** | バックエンドロジック   | Firebase Functions v2 (Node 20) + TypeScript |
| **/common**            | 共有コード             | TypeScript (Schema, Utils)                   |
| **/base**              | 共有UIコンポーネント   | Vue 3 (Materio Template)                     |

### レガシー (Deprecated) — 新規コード生成時の参照禁止

| パス         | 概要                      |
| :----------- | :------------------------ |
| **/manager** | 運営向け管理画面 (Legacy) |

Slack / LINE bot および旧 legacy Functions は `functions/default` に統合済み（#2060 Phase 2/3）。

### Functions 追加時の CI 連携

`functions/default/src/index.ts` で Cloud Functions として **export する**関数を追加・削除したら、同 PR で index.ts に import と export を追加すること（deploy yml への手書きは不要）。PR verify は `npm run verify:functions-deploy` で deploy 設定を検証する。

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
  - 例: `[partner] #1777 注文詳細画面の修正`
  - 例: `[base][common] #1799 withConverter の削除を禁止`
  - 例: `[ci] #2084 deploy_user の checkout を v6 に更新`
  - 使用可能なタグ: `[user]` `[partner]` `[base]` `[common]` `[functions]` `[doc]` `[ci]` `[terraform]` `[firebase]` `[ai]`
  - [doc]: documents/ 内の更新のみ。[ci]: `.github/workflows/`。[terraform]: `terraform/`。[firebase]: Firebase 設定・ルール・インデックス。[ai]: AI エージェント向け指示・設定
  - ルートの package.json / package-lock.json 等、上記タグに該当しない変更は接頭辞なし

## Pull Request ルール

- PR 作成を依頼された場合、必ず `.github/pull_request_template.md` の内容と構造を読み込むこと
- 現在の変更内容（`git diff` やステージングされた変更）を解析し、各セクション（概要、変更内容、影響範囲など）を具体的に埋めること
- 「チェックリスト」は完了済みと推定されるものは `[x]`、確認が必要なものは `[ ]` のままにする
- 文体は「です・ます」調で簡潔に
- PR は必ず**日本語**で記述する

## コードレビュー

レビューコメントは必ず日本語で記述する。
レビュー時はプロジェクト固有のチェックリストに従うこと。

チェックリスト: `.agents/skills/shokujii-code-review/shokujii-code-review.md`

### アクセシビリティ（Phase 1 対象外）

通常の PR レビューでは、アクセシビリティ（`aria-label`、`alt`、キーボード操作、ARIA ロール等）を指摘しない。
個別仕様書（`documents/`）に a11y 要件が明記されている PR のみ例外とする。

### Pull Request（GitHub）上でのレビュー形式

- **インラインコメントを優先する**: `Files changed` タブで、指摘する**該当行**に review comment を付ける（1 指摘につき 1 コメントが望ましい）。
- **トップレベル（会話タブ）への長文まとめは避ける**: 複数ファイル・複数観点を 1 本のトップレベルコメントに詰め込まない。ファイルごと・指摘ごとに行コメントへ分ける。
- PR コメントでレビューの書き方だけ指示された場合でも、**当該 PR の diff に対するコードレビュー（インライン指摘）を実行**すること。書き方への承知返信のみで終えない。
- 上記は GitHub Copilot / Codex 等の自動レビューでも同様とする（ツールが常に従う保証はないが、プロジェクトの期待動作として記載する）。

### レビューコメントの prefix

| prefix | 意味                                            |
| :----- | :---------------------------------------------- |
| [must] | 必ず変更（マージ前に対応必須）                  |
| [imo]  | 自分の意見だが修正必須ではない（in my opinion） |
| [nits] | ささいな指摘（nitpick）                         |
| [ask]  | 質問                                            |
| [fyi]  | 参考情報                                        |
