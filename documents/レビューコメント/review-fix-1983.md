# ブランチ fix/1983 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 4950057093 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Copilot PR overview。18 ファイル中 17 レビュー済みでインライン指摘なし<br>Node 24 移行・firebase-functions 7.x 更新の差分に追加指摘なし |
| [x] | RC-2 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `@tsconfig/node24` の phantom dependency。node20 時代も同構成で本 PR スコープ外と判断<br>各アプリ devDependencies 追加は別途検討可 |
| [x] | RC-3 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `.at(-1)` 後退は型チェック通過のため必要。tsconfig lib 引き上げは別タスク<br>本 PR では対応不要と判断 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | ネイティブ依存の nodejs24 実走確認は検証タスク。コード修正対象外<br>sandbox デプロイ成功済み。実走はマージ判断側で対応 |
| [x] | RC-5 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `HttpsFunction` 注釈の不統一は d.ts 出力に影響なし<br>一貫性のみの指摘のため本 PR では対応不要 |
| [x] | RC-6 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | express 4/5 混在は sandbox 実走確認事項。コード修正対象外<br>使用 API は 4/5 共通。本 PR では対応不要 |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `HttpResponse` の `set` / `send` / `json` を express 実体に合わせ JSDoc で res 型方針を追記<br>対応済み |

---

## 評価セッション（2026-08-17 18:14・review-comments-evaluate）

- **評価日時**: 2026-08-17 18:14 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: fix/1983
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2276
- **REVIEW_REQUEST_SINCE**: 2026-08-17T09:06:00Z
- **partial**: true（Codex は no_issues のみ。Copilot 初回エラー後に overview + 追加指摘なし返信）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4
- **新規 RC**: 1 件（RC-1）。🚨 / 🟡 未着手 0 件のため手順 4a 自動修正なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 4950057093 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | Copilot PR overview。18 ファイル中 17 レビュー済みでインライン指摘なし<br>Node 24 移行・firebase-functions 7.x 更新の差分に追加指摘なし |

**識別子**: RC-1（GitHub id: 4950057093）

**レビュワー**: Copilot（copilot-pull-request-reviewer）

**指摘箇所**: PR トップレベル（Pull request overview）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

## Pull request overview

ローカル/CI/Cloud Functions の実行環境を Node 20 系から Node 24（nodejs24）へ移行し、合わせて `firebase-functions` を 7.3.2 へ更新することで、ランタイム提供終了（nodejs20）に備えつつ依存関係の整合性を保つ PR です。

**Changes:**
- ルート/CI/Functions の Node バージョンを Node 24 に統一（`.node-version`、Functions `engines.node`、Actions workflow の `setup-node@v6` 化）
- `firebase-functions@^7.3.2` への更新に伴い、HTTP ハンドラ周辺の型（`HttpResponse`、`HttpsFunction`）を v7 系に追随
- Node 24 向け TypeScript 設定（`@tsconfig/node24`、`@types/node@^24`）へ更新し、各アプリの `tsconfig.node.json` を追随

### Reviewed changes

Copilot reviewed 17 out of 18 changed files in this pull request and generated no comments.

**コメント要約**: Copilot が PR overview で変更内容を要約し、17/18 ファイルをレビューしたがインラインコメントは生成されなかった。
具体的なコード指摘・必須修正は含まれない。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 変更サマリと「generated no comments」のみで、アクション可能な指摘がない。Node 24 / firebase-functions 7.x 移行 PR として Copilot 側の追加修正要求はない。

---

**レビュー非該当スキップ（RC 未採番）**:

| GitHub id | 種別 | 理由 |
|:---|:---|:---|
| IC_kwDOJXF1N88AAAABPL2AJA | レビュー依頼定型文 | 手順 12 の @codex / @copilot 依頼コメント |
| IC_kwDOJXF1N88AAAABPL2Dsg | Copilot エラー | コード指摘なし（unexpected error） |
| IC_kwDOJXF1N88AAAABPL43CQ | Codex no_issues | Didn't find any major issues のみ |
| IC_kwDOJXF1N88AAAABPL48Hw | Copilot 承知返信 | 「追加の指摘はありません」のみ |

---

## 評価セッション（2026-08-18 01:45・shokujii-code-review）

- **評価日時**: 2026-08-18 01:45 JST
- **評価者**: Cursor Agent（`/shokujii-code-review` セルフレビュー・リスク洗い出し）
- **ブランチ名**: fix/1983
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2276
- **レビュー範囲**: `git diff origin/development...HEAD`（18 ファイル。`package-lock.json` は依存差分のみ確認）
- **新規 RC**: 6 件（RC-2〜RC-7。🚨 0 件 / 🟡 6 件）
- **自動修正**: 実施なし（ユーザー依頼はレビュー + リスク洗い出し。🚨 0 件、🟡 は方針が二択 or スコープ外 / 確認のみ）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-2 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `@tsconfig/node24` の phantom dependency。node20 時代も同構成で本 PR スコープ外と判断<br>各アプリ devDependencies 追加は別途検討可 |
| [x] | RC-3 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `.at(-1)` 後退は型チェック通過のため必要。tsconfig lib 引き上げは別タスク<br>本 PR では対応不要と判断 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | ネイティブ依存の nodejs24 実走確認は検証タスク。コード修正対象外<br>sandbox デプロイ成功済み。実走はマージ判断側で対応 |
| [x] | RC-5 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `HttpsFunction` 注釈の不統一は d.ts 出力に影響なし<br>一貫性のみの指摘のため本 PR では対応不要 |
| [x] | RC-6 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | express 4/5 混在は sandbox 実走確認事項。コード修正対象外<br>使用 API は 4/5 共通。本 PR では対応不要 |
| [x] | RC-7 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `HttpResponse` の `set` / `send` / `json` を express 実体に合わせ JSDoc で res 型方針を追記<br>対応済み |

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/package.json:47`

**該当コード（レビュー時点の diff）**:

```json
   "devDependencies": {
-    "@tsconfig/node20": "^20.1.4",
+    "@tsconfig/node24": "^24.0.5",
     "@types/lodash": "^4.17.5",
-    "@types/node": "^20.12.5",
+    "@types/node": "^24",
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `@tsconfig/node24` は `base/package.json` にのみ宣言されているが、実際に `extends` しているのは `user` / `partner` / `enterprise` の `tsconfig.node.json` であり、これらのパッケージは依存を宣言せず npm workspaces のホイストに依存している（phantom dependency）。→ 各アプリの `devDependencies` に `@tsconfig/node24` を追加する。

**コメント要約**: `@tsconfig/node24` を使う 3 アプリが依存を宣言していない。
ホイスト構成が変わると解決に失敗する。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 指摘は妥当だが `@tsconfig/node20` 時代も base のみ宣言の同一構成であり、本 PR で新規に発生した問題ではない。ユーザー判断により本 PR では各アプリへの devDependencies 追加は行わない。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/directives/linkify/utils/linkifiedSegments.test.ts:66`

**該当コード（レビュー時点の diff）**:

```ts
     expect(textValues(segments)).toEqual(['<b>太字</b>', ' '])
-    expect(segments.at(-1)).toEqual({
+    expect(segments[segments.length - 1]).toEqual({
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/M]: `Array.prototype.at`（ES2022）から添字参照への書き換えは、`@types/node` を 24 系へ更新した結果 `base` の型チェックで ES2022 の lib が有効でなくなったことへの回避策である（`.at(-1)` に戻すと `error TS2550: Property 'at' does not exist ... Try changing the 'lib' compiler option to 'es2022' or later` が再現する）。`user` / `partner` / `enterprise` 側は `@vue/tsconfig` 経由で `.at()` が使えるため（`*/src/@layouts/components/VerticalNavGroup.vue:134` で使用中）、base だけモダン配列 API が書けない非対称が残る。→ `tsconfig.base.json` の `target` / `lib` 引き上げ（移行計画書 §3.4 で「別タスク推奨」としている項目）を Issue として起票し、追跡できる状態にする。

**コメント要約**: base の lib が ES2020 のままで ES2022 配列 API が使えず、コード側を後退させている。
app 側とは非対称。根治（target / lib 引き上げ）の Issue が未作成。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 添字参照への書き換えは `@types/node` 24 更新後の型チェック通過に必要な回避策。`tsconfig.base.json` の lib 引き上げは別タスク（移行計画書 §3.4）のため本 PR では対応不要。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/07_リファクタリング/23_node20のversion更新.md:149`

**該当コード（レビュー時点の diff）**:

```markdown
 - [ ] **ネイティブ依存の Node 24 / google-24 互換**
   - `sharp@0.34.5`（画像処理・ネイティブバイナリ）
   - `@google-cloud/firestore@7.11.0` / `@google-cloud/storage@7.15.0`
   - `@adobe/pdfservices-node-sdk@4.1.0`
-- [ ] **`firebase-functions@6.3.2` の Node 24 動作確認**
+- [x] **`firebase-functions@7.3.2` の Node 24 動作確認**（#1933 と同 PR で更新。`HttpResponse` 型で `@types/express` バージョン差異を回避）
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👀確認のみ]: 移行計画書 §4 の「ネイティブ依存の Node 24 / google-24 互換」と §5.3-4「画像サムネイル生成・PDF 生成を sandbox で実際に走らせる」が未チェックのままである。PR 本文でも「sandbox デプロイ後の実走確認は別途」と明記されている。sandbox2510 への `deploy_functions`（87 関数）は成功しているためデプロイ可否は確認済みだが、`sharp`（画像処理）・`@adobe/pdfservices-node-sdk`（`flyer` / `eventBillInvoice` / `enterpriseBillInvoice` / `namesPrint`）・`@sendgrid/mail@7`（engines 表記は `>=10.*` 止まり）の**実行**は未確認。→ development マージ前に sandbox で PDF 生成・画像処理・メール送信を実走し、結果をチェックリストに反映する。

**コメント要約**: ネイティブ依存・外部 SDK の nodejs24 実走確認が未完のままマージ可能状態。
デプロイ成功は確認済み。実行時エラーは Cloud Logging でしか検出できない。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: コード修正ではなく sandbox での実走確認タスク。デプロイ成功は確認済み。ユーザー判断により本 PR では検証チェックリスト更新は行わない。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/ogpRequest.ts:195`（同 `:279`、`functions/default/src/sitemapRequest.ts:36`）

**該当コード（レビュー時点の diff）**:

```ts
-export const handleEventOgpRequest = https.onRequest(
+export const handleEventOgpRequest: HttpsFunction = https.onRequest(
   {
     region: 'asia-northeast1',
     memory: '1GiB',
   },
-  async (req: https.Request, res: express.Response) => {
+  async (req, res) => {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `: HttpsFunction` の明示注釈は `ogpRequest.ts` / `sitemapRequest.ts` の 3 箇所のみで、他の 8 つの `onRequest` export（`stripeWebhook` / `flyer` / `namesPrint` / `eventBillInvoice` / `enterpriseBillInvoice` / `slackbot` / `broadcast_event_message_request`）には付いていない。生成 d.ts を比較すると注釈なしでも `import("firebase-functions/https").HttpsFunction` と出力されるため（`dist/flyer.d.ts` 参照）、express 型の露出回避という目的は注釈なしでも達成できている。→ 全 `onRequest` export に統一して付けるか、この 2 ファイルから外すか、どちらかに揃える。

**コメント要約**: `HttpsFunction` 注釈が 2 ファイルのみで他の onRequest と不統一。
d.ts 出力は注釈の有無で同一のため、統一方針を決めたい。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: d.ts 出力は注釈の有無で同一。一貫性のみの指摘で動作・型安全性への影響なし。ユーザー判断により本 PR では統一対応は行わない。

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/slackbot.ts:168`

**該当コード（レビュー時点の diff）**:

```ts
// 本 PR の差分外（firebase-functions 7 更新の影響を受ける既存コード）
export const slackbot = onRequest(
  { region: 'asia-northeast1', invoker: 'public', secrets: [...] },
  (req, res) => {
    getExpressReceiver().app(req, res)
  },
)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👀確認のみ]: `firebase-functions@7.3.2` は内部依存を `express@5.2.1` / `@types/express@5.0.6` に更新している（6.x は express 4 系）。一方 `@slack/bolt@3.22.0` の `ExpressReceiver` は `express@^4.21.0` 前提であり、`slackbot` では firebase-functions 側の req / res をそのまま express 4 のアプリへ渡している。express の major が混在する構成は今回の更新で初めて発生するため、Slack スラッシュコマンドと OAuth インストール（`directInstall`）の実走確認を sandbox で行いたい。加えて v7 では `withErrorHandler` が導入され、async `onRequest` の未処理例外が従来のタイムアウト待ちではなく即 500 応答になる（`headersSent` チェックはあり二重送信はしない）。`stripeWebhook` は自前 try/catch で 200 / 400 を返しているため影響は限定的だが、500 応答時の Stripe 再送に対するべき等性は既存実装のままである点を認識しておきたい。

**コメント要約**: firebase-functions 7 の内部 express が 5 系になり、Bolt（express 4）と major 混在。
Slack コマンド・OAuth の実走確認と、v7 の async 例外 → 即 500 挙動の把握が必要。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: express 4/5 混在は sandbox 実走確認事項。使用 API は 4/5 共通でコード修正対象ではない。ユーザー判断により本 PR では対応不要。

---

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/utils/httpResponse.ts:4`

**該当コード（レビュー時点の diff）**:

```ts
+/** onRequest ハンドラが利用する Response の最小インターフェース（@types/express のバージョン差異を避ける） */
+export type HttpResponse = {
+  status(code: number): HttpResponse
+  set(field: string, value?: string | number): HttpResponse
+  setHeader(name: string, value: string | number | readonly string[]): HttpResponse
+  send(body?: unknown): unknown
+  json(body: unknown): unknown
+  readonly headersSent: boolean
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 手書きの構造型は実体（express の `Response`）とずれても型検査で気づけない。`set` の value を `string | number` としているが express のシグネチャは `string | string[]` で、`number` は型上通っても実体の想定外である（現状の呼び出しはすべて文字列なので実害はない）。また `send` / `json` の戻り値が `unknown` のため `res.status(200).json(...)` 以降のチェーンができず、express の `Response` とも異なる。→ value を `string | string[]`、戻り値を `void` または `HttpResponse` に変更して実体に合わせる。あわせて、`onRequest` の res 型が `HttpResponse`（ogp / sitemap / stripeWebhook）・推論された express の `Response`（flyer / invoice 系 / slackbot）・`Writable`（`streamInvoicePdf` の引数）の 3 系統に分かれているため、どの型を使うかの方針を JSDoc に 1 行追記したい。

**コメント要約**: `HttpResponse` の `set` value 型が express と不一致で、戻り値 `unknown` も実体と異なる。
res 型が 3 系統に分かれるため使い分け方針の明記も必要。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `set` の value を `string | string[]`、`send` / `json` の戻り値を `HttpResponse` に変更。res 型の使い分け方針を JSDoc に追記済み。

---
