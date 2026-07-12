# AGENTS.md

AIエージェント向けプロジェクトガイド。

**出力は必ず日本語で行ってください。**

## Skills スキル（定型タスクの手順書）

**プロジェクトオリジナル**のスキル。以下のタスクを依頼された場合、対応するスキルファイルを読み込んで手順に従うこと。

| タスク                                                                          | スキル                       |
| :------------------------------------------------------------------------------ | :--------------------------- |
| コミット整理（fixup / squash / 分割 / 新規 / amend の自律判断）                 | `/git-commit-workflow`       |
| コミットメッセージ生成（gh でイシュー検証。不一致時は create-issue）            | `/git-commit-message`        |
| GitHub イシュー作成                                                             | `/git-create-issue`          |
| PR 本文生成                                                                     | `/git-create-pull-request`   |
| AI レビュー完了待ち → evaluate（watcher 起動時 Shell に notify_on_output 必須） | `/wait-ai-pr-review`         |
| コードレビュー                                                                  | `/shokujii-code-review`      |
| lint・format・型・test チェック（PR verify 相当。format はローカル自動修正）    | `/lint-and-format`           |
| fixup（追修正の統合・メッセージ維持。明示依頼時）                               | `/git-fixup`                 |
| squash（統合＋メッセージ更新。明示依頼時）                                      | `/git-squash`                |
| レビューコメント検討                                                            | `/review-comments-evaluate`  |
| レビューコメント返信                                                            | `/review-comments-reply`     |
| コードレビュードキュメント更新                                                  | `/review-doc-update`         |
| 分割コミット（明示依頼時）                                                      | `/git-split-commit`          |
| スキル提案                                                                      | `/skill-propose`             |
| sandbox へ push + Actions デプロイ                                              | `/github-actions-deploy`     |
| sandbox WIP デプロイ                                                            | `/github-sandbox-wip-deploy` |
| コミット後の反映（PR + sandbox）                                                | `/git-reflect-after-commit`  |
| GCP Cloud Logging ERROR 取得・解析（gcloud / JSON 添付）                        | `/gcp-logging-error-analysis` |

## 推奨スキル（技術スタック別）

**外部からインストールした**スキル。以下のタスク時は、該当スキルを `/スキル名` で参照して利用すること。

| タスク                                 | スキル                               | タイミング                                                                                           |
| :------------------------------------- | :----------------------------------- | :--------------------------------------------------------------------------------------------------- |
| Vue コンポーネント実装                 | `/vue-best-practices`                | 実装時、レビュー時                                                                                   |
| ルーティング・ナビゲーション           | `/vue-router-best-practices`         | 実装時                                                                                               |
| Vue のデバッグ                         | `/vue-debug-guides`                  | デバッグ時                                                                                           |
| Firestore の読み書き・ルール           | `/firebase-firestore-standard`       | 実装時                                                                                               |
| Firestore store 操作（base/functions） | `/shokujii-firestore`                | store 追加・修正時、Firestore 読み書き時、仕様書に従った実装で Firestore を触る場合                  |
| common の Zod スキーマ設計             | `/shokujii-common-schemas`           | 新規スキーマ追加時、既存スキーマのフィールド追加時、common/src/schemas や common/src/apis を触る場合 |
| Firebase Functions 実装                | `/shokujii-functions-implementation` | Callable / Scheduled / メール送信の Function 追加・修正時、functions/default を触る場合              |
| Stripe 決済実装                        | `/stripe-integration`                | 実装時                                                                                               |
| UI の設計・実装                        | `/frontend-design`                   | 新規ページ・コンポーネント作成時、スタイリング・ビジュアル改善時                                     |
| UI のレビュー・品質チェック            | `/web-design-guidelines`             | アクセシビリティ確認時、UX レビュー時、PR マージ前の品質チェック時                                   |
| スキル作成・改善                       | `/skill-creator`                     | 新規スキル作成時、既存スキルの編集・最適化時                                                         |
| ユニットテスト (Vitest)                | `/vitest`                            | テスト作成時、common/functions のロジックテスト時                                                    |
| 実装前の設計インタビュー（要件明確化） | `/grill-me`                          | 実装前の設計フェーズ、要件が固まっていない時、設計の壁打ち時                                         |

## プロジェクト概要

**プロジェクト名**: Shokujii（食事でつながる）
**概要**: 食事関連のコミュニティイベント管理プラットフォーム。
**アーキテクチャ**: Firebase ベースのモノレポ（`npm workspaces`）。

## 関連リポジトリ

| リポジトリ | 役割 |
| :-- | :-- |
| [`nijuniinc/bokudeli-event-batch`](https://github.com/nijuniinc/bokudeli-event-batch) | Firestore 既存データの backfill / migration など、アプリ本体外で実行するバッチ処理 |

既存 Firestore データへの backfill は、原則として本リポジトリの `functions/default` ではなく `bokudeli-event-batch` 側で実装・実行する。アプリ本体側は schema / converter / store / Rules / index / テストを整備する。エンプラ MVP の enterprise_id null materialize バックフィル手順は [documents/08_エンタープライズ/00_計画/02_developmentマージ.md](documents/08_エンタープライズ/00_計画/02_developmentマージ.md) §2.4 を参照。

## ディレクトリ構造

### アクティブ

| パス                   | 概要                   | 技術スタック                                 |
| :--------------------- | :--------------------- | :------------------------------------------- |
| **/user**              | 一般ユーザー向けアプリ       | Vue 3 + Vite + Vuetify 3                     |
| **/partner**           | 飲食店向け管理画面           | Vue 3 + Vite + Vuetify 3                     |
| **/enterprise**        | エンタープライズ向けアプリ   | Vue 3 + Vite + Vuetify 3                     |
| **/functions/default** | バックエンドロジック         | Firebase Functions v2 (Node 20) + TypeScript |
| **/common**            | 共有コード             | TypeScript (Schema, Utils)                   |
| **/base**              | 共有UIコンポーネント   | Vue 3 (Materio Template)                     |

### レガシー (Deprecated) — 新規コード生成時の参照禁止

| パス         | 概要                      |
| :----------- | :------------------------ |
| **/manager** | 運営向け管理画面 (Legacy) |

Slack / LINE bot および旧 legacy Functions は `functions/default` に統合済み（#2060 Phase 2/3）。

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

### UI 文言・i18n（日本語のみ）

- **表示言語は日本語のみ**（Phase 1）。英語 UI・多言語切替は未対応。
- UI 文字列は **`ja.ts` にのみ**追加する。
  - `base/src/locales/messages/ja.ts`（共通）
  - 各アプリの `src/locales/messages/ja.ts`（例: `user` / `partner`）
- **`src/locales/messages/en.ts` 等の英語 locale ファイルは作らない**（製品として多言語対応を始める明示指示がある場合を除く）。
- i18n 基盤（`vue-i18n`）は日本語用の `$t` 集約のために使う。`base/src/plugins/i18n/index.ts` は `locale` / `fallbackLocale` とも **`ja`**。各アプリの `themeConfig` の `langConfig` も日本語のみとする。
- 日付・時刻の表示は `common/src/utils/datetime.ts` の `convertToXxx` を使う（`vue-i18n` の `datetimeFormats` / `$d` は新規追加しない）。

### Materio テンプレート（`base/materio/`）

- **`base/materio/`（`@core` / `@layouts` 含む）は原則変更禁止**。テンプレート更新時の diff 回避・マージ容易性のため。
- レイアウト・スタイルの調整は **`user/src/styles/`**、**`base/src/styles/`**、各 Vue コンポーネントの `<style>` で override する。
- `user/src/@core` / `@layouts` は materio へのシンボリックリンク。不足 util は **`base/src/`** 等のプロジェクト側に追加し、materio 直下に直接足さない。
- 例外: Materio テンプレート本体のアップストリーム取り込み等、明示的なメンテナンス作業時のみ編集可。

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
4. 仕様書・ドキュメントに基づく実装で、base/functions の store や Firestore の読み書きが含まれる場合は、shokujii-firestore を参照すること
5. 仕様書・ドキュメントに基づく実装で、common のスキーマ（common/src/schemas、common/src/apis）を触る場合は、shokujii-common-schemas を参照すること
6. functions/default で Function を追加・修正する場合は、shokujii-functions-implementation を参照すること
7. セッション開始時、`.agents/state/pr-review-pending-wake.json` に未処理 wake があれば [`wait-ai-pr-review`](.agents/skills/wait-ai-pr-review/SKILL.md) 手順 6 に従い evaluate 未処理をユーザーへ報告する。`pr-<n>.md` に当該 `since` 以降の評価セッションが無い場合は auto evaluate 未完了として [`review-comments-evaluate`](.agents/skills/review-comments-evaluate/SKILL.md) auto モード（手順 4 追記まで）の実行を提案する
8. セッション開始時、`.agents/state/deploy-pending-wake.json` に未処理 wake（`consumed: false`）があれば **deploy 結果報告未処理**としてユーザーへ報告する。ユーザーが報告を依頼した場合は [`github-actions-deploy`](.agents/skills/github-actions-deploy/SKILL.md) を **mode=report** で完走する
9. Agent 使用量の確認: Cursor 2.x 以降の stop hook は top-level の `input_tokens` 等を提供する環境では自動計上される。トークン未提供（`aborted`・旧版・CLI 等）の場合は ledger に `null` が記録され followup も出ない（Phase 1 制限）。payload にトークンが無い場合は `transcript_path` から Claude 互換 transcript の usage をフォールバック取得する。stop hook が推定 ¥100 以上のターンのみ `followup_message` で使用量を表示する（`[agent-usage-report]` プレフィックス。閾値は `.agents/config/agent-usage-pricing.json` の `followup_min_jpy`）。手動確認は `python3 .agents/scripts/agent_usage.py report --last-session` または `.agents/state/agent-usage/reports/` を参照（hook による推定値）

## 作業完了前の必須手順（コード変更）

ソースコードやビルド・lint 対象となる設定を変更したタスクでは、**完了報告の前に必ず** `/lint-and-format` スキル（`.agents/skills/lint-and-format/SKILL.md` または `.claude/skills/lint-and-format/SKILL.md`）の手順に従い、PR verify（`pr-verify.yml`）と同じ verify:functions-deploy / build / lint / format / 型 / vitest のローカルチェック（format 失敗時は format 自動修正）を実行すること。

### Functions 追加時の CI 連携

`functions/default` で **Cloud Functions として export する**関数を新規追加・削除したら、同 PR で `.github/workflows/deploy_functions.yml` の `--only` リスト（hybrid / pf / enterprise）も更新すること。更新漏れすると development / production では Trigger・Callable が未デプロイのままになる。詳細は `/shokujii-functions-implementation` を参照。PR verify は `npm run verify:functions-deploy` で export と deploy リストの一致を検証する。

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
  - 例: `[partner] #1777 注文詳細画面の修正`
  - 例: `[base][common] #1799 withConverter の削除を禁止`
  - 例: `[ci] #2084 deploy_user の checkout を v6 に更新`
  - 例: `[firebase] #1901 firestore.indexes.json の重複インデックスを削除`
  - 例: `[ai] #1800 分割コミットスキルに ci と firebase タグを追加`
  - 例: `[enterprise] #2071 カート月次 usage を enterprise 側から注入`
  - 使用可能なタグ: `[user]` `[partner]` `[enterprise]` `[base]` `[common]` `[functions]` `[doc]` `[ci]` `[terraform]` `[firebase]` `[ai]`
  - [doc]: documents/ 内の更新のみ。[ci]: `.github/workflows/`。[terraform]: `terraform/`。[firebase]: `firebase.json` / `.firebaserc` / `firestore.rules` / `storage.rules` / `firestore.indexes.json`。[ai]: `.cursor` / `.agents` / `.claude` / `CLAUDE.md` / `AGENTS.md` / `.github/copilot-instructions.md` 等の AI エージェント向け指示・設定
  - ルートの `package.json` / `package-lock.json` 等、上記タグに該当しないモノレポ横断設定は**接頭辞なし**（`#イシュー番号` と要約タイトルのみ）。PR タイトルも同様。手順・判定ルール・例は `/git-commit-message` と `/git-create-pull-request` スキルを参照。

### エージェント向け Git 操作の禁止（本番・リリース系）

背景: [`documents/AIエージェント/03_branch_protection.md`](documents/AIエージェント/03_branch_protection.md) §5。

**エージェントは次を実行してはならない**（人間のリリース作業専用）:

- `development` / `main` / `production` / リリースタグ（`v` + 数字）への **直 push**
- `npm version`（引数問わず全バリアント）
- `git branch -f main` / `git branch -f production`

**許可される push**: 現在の feature / `release/*` / `sync/*` / `hotfix/*` 等の作業ブランチへの `git push origin HEAD:<ref>`（PR 作成・更新用）。`development` の更新はこれらのブランチ + PR 経由のみ。

**例外**: ユーザーが「本番リリースを実行して」と明示した場合でも、エージェントは **自動実行せず** [`documents/デプロイ手順/デプロイ手順.md`](documents/デプロイ手順/デプロイ手順.md) の手順を提示に留める。

上記は Hook でも機械的にブロックされる（検査正本: `.agents/hooks/protect-git-release-check.sh`、Claude: `.claude/hooks/`、Cursor: `.cursor/hooks/`）。

## コードレビュー

PR・コードレビューのコメントは必ず日本語で行う。
レビュー時はプロジェクト固有のチェックリストに従うこと。

チェックリスト: `.agents/skills/shokujii-code-review/shokujii-code-review.md`

### レビューコメント対応記録（必須）

`documents/レビューコメント/pr-<PR番号>.md` を RC 対応状況の正本とする。
**RC-n の対応を依頼され実装を進めたタスク**では、コード変更と**同一作業内**（コミット前）に `pr-<番号>.md` を必ず更新する（[`lint-and-format`](.agents/skills/lint-and-format/SKILL.md) と同様、完了報告の前提）。

| 状況 | 対応列 | 判断列 | PRスコープ |
| ---- | ------ | ------ | ---------- |
| コードで解消した | `[x]` | ✅ 対応済み | 📌 スコープ内（変更なし可） |
| 対応不要と確定 | `[x]` | 👌 修正不要 | — または 📤 スコープ外 |
| 本 PR では実装せず別 Issue へ切り出した | `[x]` | 📤 #NNNN 別Issue化 | 📤 スコープ外 |
| 未着手 | `[ ]` | 🟡 修正提案 / 🚨 必須修正 | 評価時のまま |

- **❌ 未対応は使わない**（[`review-comments-evaluate`](.agents/skills/review-comments-evaluate/SKILL.md) と共通）。未着手は `[ ]` + 🟡 / 🚨 で表す。
- 「別 Issue で対応」「方針検討」等の**文言だけ**で Issue を作らない状態は禁止。切り出す場合は [`git-create-issue`](.agents/skills/git-create-issue/SKILL.md) で Issue を作成し、判断列に **`📤 #NNNN 別Issue化`**、要約列 2 行目に Issue URL または番号を明記する。
- Issue 作成まで完了したら **対応列は `[x]`** とする（本 PR 側の運用対応は完了）。

**更新箇所**（漏れ防止）: ファイル冒頭の通し `### RC 一覧（サマリ）` 表、直近評価セッション内サマリ表（あれば）、該当 RC 記録ブロックの判断結果・PRスコープ・判断理由・要約。詳細は `/review-comments-evaluate` を参照。

## エージェント用ファイルとシンボリックリンク

実装・修正は **Cursor** と **Claude（Claude Code 等）** のどちらでも行う。どちらの環境でも同じプロジェクトガイドとスキルを参照できるよう、次のように整理している。

- **`AGENTS.md`**: AI 向けプロジェクトガイドの**正本**。
- **`CLAUDE.md`**: `AGENTS.md` への**シンボリックリンク**。Claude 側がプロジェクトルートの `CLAUDE.md` を読む場合でも、常に `AGENTS.md` と同じ内容になる。
- **スキル（`SKILL.md` 等）の正本**: **`.agents/skills/`**。Cursor 用の **`.cursor/skills`** と Claude 用の **`.claude/skills`** は、どちらも **`.agents/skills` へのシンボリックリンク**である。スキルを編集する場合は **`.agents/skills` 側（またはリンク経由で同一ファイル）** を更新すればよい。

`.cursor/` や `.claude/` には、エディタ・ツールごとの設定（例: `.cursor/rules.json`、`.claude/settings.json`、hooks）が置かれることがあり、これらはスキル正本とは別パスとして扱う。
