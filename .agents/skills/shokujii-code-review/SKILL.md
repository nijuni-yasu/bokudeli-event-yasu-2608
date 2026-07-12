---
name: shokujii-code-review
description: Shokujiiプロジェクトのコーディング規約に従ってコードをレビューする。指摘は 🚨必須修正/🟡修正提案/👌修正不要（対応後は ✅対応済み、別Issue化は 📤#NNNN別Issue化）の共通区分で review-comments-evaluate と共通（❌未対応は使わない）。PR紐づき時は pr-<番号>.md に RC 記録を追記。コード変更のレビュー依頼時に使用。
---

# Shokujii コードレビュー

## 他スキルとの役割分担

| スキル | 役割 |
|--------|------|
| **本スキル** | 差分に対する**能動的**レビュー（チェックリスト・共通区分の指摘） |
| [/review-comments-evaluate](../review-comments-evaluate/SKILL.md) | **外部**レビュー（Copilot / Codex / kokufu）コメントの評価 |

同一 PR の記録は **`documents/レビューコメント/pr-<番号>.md` 1 ファイル**に集約し、RC 番号は evaluate の続き番号ルールに従う。詳細は evaluate の [他スキルとの役割分担](../review-comments-evaluate/SKILL.md#他スキルとの役割分担) を参照。

## レビュー手順

1. 変更差分（または指定されたファイル）を読む（`git diff origin/development...HEAD` 等）
2. 下記チェックリストの各項目を順に確認する（詳細・NG/OK 例は [shokujii-code-review.md](shokujii-code-review.md)）
3. 問題があれば [フィードバック形式](#フィードバック形式) に従ってコメントを出力する（**1 指摘 = 1 ブロック**、共通区分を付ける）
4. **ドキュメントへの記録** — 下記を実行（ユーザーが「記録不要」と明示した場合のみ省略）

### 手順 4: ドキュメントへの記録

**PR 番号が分かる場合は原則必須**（指摘が 0 件のときはセッション見出しと「指摘なし」のみでよい）。ユーザーが「記録不要」と明示した場合のみ省略。

1. [review-comments-evaluate](../review-comments-evaluate/SKILL.md) の **手順 4**（保存先・同一 PR の扱い・RC 記録ブロック）に従う
2. ファイル末尾に `## 評価セッション（<日時>・shokujii-code-review）` を追記。メタデータに **評価日時**・**ブランチ名**・**PR** を含める。Outdated / レビュー非該当は「該当なし」でよい
3. **RC 採番**: 既存 `pr-<番号>.md` の最終 RC の次から。指摘ごとに 1 RC
4. **並び順**: **`path` 昇順**、同一 `path` 内は**行番号昇順**
5. 各 RC は **RC 記録ブロック（12項目）**（evaluate 参照）。**判断結果**は [共通区分](../review-comments-evaluate/SKILL.md#判断結果共通区分プロジェクト共通) のみ。**PRスコープ**・**ラベル**（複数可）・**変更種別**・**想定工数**も evaluate と同一語彙で記載する
   - **レビュワー**: `Cursor Agent（shokujii-code-review）`
   - **識別子**: `RC-n（GitHub id: なし・エージェントレビュー）` 等
   - **指摘箇所**: `` `path:line` ``
   - **該当コード**: [該当コードの取得（共通）](../review-comments-evaluate/SKILL.md#該当コードの取得共通)（`git diff origin/development...HEAD -- <path>`）
   - **レビュワーのコメント（原文）**: 手順 3 のチャット指摘文をそのまま
6. 冒頭の通し **`### RC 一覧（サマリ）`** 表にも本セッション分の**行**を追記（evaluate 手順 4 の項 5）。セッション内も同じ表形式（要約列含む）

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
- [ ] Transaction 内で **すべての read が write より前** に実行されているか（Firestore は write 後の read を拒否する。`addMember` 等の read+write を内包するメソッドにも注意）
- [ ] レースコンディションが発生しうる箇所に Transaction を使っているか

### Firebase Functions

- [ ] `console.log` / `console.error` を使っていないか（`createModuleLogger` を使う）
- [ ] `import { logger } from 'firebase-functions'` を直接使っていないか（`createModuleLogger` を使う）
- [ ] ログメッセージに `letter |` 等の接頭辞をつけていないか（`createModuleLogger` 使用時は不要）
- [ ] メールの一括送信に `Promise.all` を使っていないか（SendGrid personalizations の `sendDynamicTemplateWithPersonalizations`（`utils/sendgridBulk.ts`）によるバッチ送信とし、バッチ単位の失敗と受付件数をログに記録する）
- [ ] メールの1件送信に `Promise.allSettled` や失敗集計ログを使っていないか（`try/catch` で十分）
- [ ] Callable Functions の引数にオブジェクト（クラスインスタンス等）を渡していないか（ID のリストを渡す）
- [ ] `secrets` の指定が必要な Function（SendGrid 等）に `{ secrets: ['SENDGRID_API_KEY'] }` が付いているか

### CI / Functions デプロイ

- [ ] `functions/default/src/index.ts` の export 追加・削除がある場合、`.github/workflows/deploy_functions.yml` の `--only` リスト（hybrid / pf / enterprise）も同 PR で更新されているか
- [ ] 更新漏れは 🚨 必須修正（マージ後も Function が未デプロイでサイレント障害になる）
- [ ] export しない内部ヘルパー（他 Function から import するだけの関数）は対象外

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

## GitHub Pull Request でレビューするとき（GitHub Copilot 等）

このスキルに沿って **GitHub 上**で PR をレビューする場合（例: GitHub Copilot が本リポの規約ドキュメントを参照するとき）は、次を守ること。

- **Conversation タブに、複数ファイル分の指摘を 1 本のトップレベルコメントにまとめない**こと。
- **Files changed** で該当行に **インラインの review comment** を付け、**1 指摘につき 1 コメント**とすること。

本ファイルは主に **Cursor / Claude 等のエージェント**向けである。GitHub Copilot が常にこの節に従う保証はないが、プロジェクトの期待動作として記載する。リポジトリの `.github/copilot-instructions.md` や PR 依頼コメントとあわせて参照される想定。

---

## フィードバック形式

チャットでの指摘と、`pr-<番号>.md` への RC 記録の **判断結果** は、[/review-comments-evaluate](../review-comments-evaluate/SKILL.md) と同じ **共通区分** を使う（**❌ 未対応は使わない**）。

```
🚨 **必須修正** [🔧微修正/S]: [問題の説明] → [修正方法]
🟡 **修正提案** [📋仕様追加/M]: [問題の説明] → [改善案]
🟡 **修正提案** [🆕新機能/L]: [問題の説明] → [改善案]
🟡 **修正提案** [📐リファクタ/M]: [問題の説明] → [改善案]
👌 **修正不要**: [問題の説明] → [対応不要の理由]
```

- **🚨 必須修正**: マージ前に対応が必要（セキュリティ・データ不整合・バグ等）
- **🟡 修正提案**: 改善を検討してほしい（設計・可読性等）。マージ必須ではない
- **👌 修正不要**: 指摘はあるが対応不要（誤解・仕様どおり・過剰指摘等）

**変更種別・工数タグ（任意）**: 行頭または末尾に `[🔧微修正/S]` `[📋仕様追加/M]` `[🆕新機能/L]` `[📐リファクタ/M]` `[📄ドキュメントのみ/S]` のように付けてよい。**省略形は使わない**。[review-comments-evaluate の変更種別・想定工数](../review-comments-evaluate/SKILL.md#変更種別) の**正式語彙**（微修正 / リファクタ / 新機能 / 仕様追加 / ドキュメントのみ / 確認のみ / 該当なし）をそのまま用いる。👀 確認のみ・➖ 該当なしは工数 `—` のみでよい。省略時は evaluate / 記録時に付与する。

**対応完了後**のドキュメント記録では **判断結果** を **✅ 対応済み** に更新する。本 PR では実装せず別 Issue へ切り出した場合は **📤 #NNNN 別Issue化** に更新する（AGENTS.md「レビューコメント対応記録」参照）。

**優先度の補足**（任意）: 本文に `[must]` / `[P2]` / `[nits]` / `[fyi]` を付けてよい。**判断結果の共通区分は上記に統一**する。

記録の詳細は [手順 4](#手順-4-ドキュメントへの記録) および [review-comments-evaluate](../review-comments-evaluate/SKILL.md) を参照。

---

## 詳細基準・よくある間違いパターン

各ルールの詳細な説明・NG/OK のコード例は以下を参照：

[shokujii-code-review.md](shokujii-code-review.md)
