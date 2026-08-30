# ブランチ fix/2335-phase-2.5-seo レビュー記録

Phase 2.5 SEO（#2335）のレビューコメント対応記録。パス解決の正本は `.agents/skills/review-comments-evaluate/references/review-doc-path.md`。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | Phase 2.5 の実装 Issue を CLOSED の #2195 と記載<br>本作業は #2335。完了条件・更新履歴の 2 箇所を #2335 に修正 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 新規 SEO ハンドラが `express.Response` に直接依存<br>`utils/httpResponse.ts` の規約（ogp / sitemap 系は `HttpResponse`）に合わせて統一 |
| [ ] | RC-3 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `forwardSafeHeaders` / `fetchIndexHtml` / `SEO_CACHE_CONTROL` が `ogpRequest.ts` からのコピー<br>共有 util（`seo/serveIndexHtml.ts` 等）への抽出が望ましい。自動修正対象外 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | JSON-LD ヘルパーの引数型が `Awaited<ReturnType<typeof ...>>`<br>`ogpRequest.ts` の既存表現と一致するため許容 |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `buildTopNavLink` の第 1 引数 `site` が未使用<br>`buildNavLink(href, label)` に整理し呼び出し 4 箇所を更新 |
| [x] | RC-6 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 静的 canonical が SEO_HEAD ブロック外にあり、Function 注入ページで canonical が 2 本になる<br>矛盾する canonical は無視され P2-3 の施策が無効化。`stripStaticCanonicalLink()` を追加 |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `isPublicEventDetailPath` 分岐が到達不能になった<br>ガードが `/manage/event/**` 限定になったため dead code + JSDoc が実態と不一致。方針判断が必要 |
| [x] | RC-8 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 公開イベントのクライアント側 404 ガード除去<br>直リンク・リロードは Function が 404、アプリ内リンクは `is_deleted == false` クエリ由来のため実害なし |
| [x] | RC-9 | 3888663271, 3888667950 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `/communitylist/`・`/community/` が static index.html に落ち SEO 注入されない<br>`firebase.json` に 301 redirect を追加 |
| [x] | RC-10 | 3888667952 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `index.html` の固定 canonical が `/u/**` 等 rewrite 対象外ページにも配信され全ページがトップ canonical 化<br>静的 canonical を削除 |
| [x] | RC-11 | 3888667953 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `documentTitle.test.ts` の `as never` 禁止<br>`RouteLocationNormalized` の型付き fixture ヘルパーに置換 |
| [ ] | RC-12 | 3888663241 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | SEO util 重複（RC-3 と同趣旨）<br>Copilot 指摘。RC-3 と統合して別途対応 |
| [x] | RC-13 | なし | 👌 修正不要 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 存在しない `/c/**/e/**` への SPA 遷移が無限ローディング<br>実機再現。`exists === false` 時のみ `/404`（composable 追加） |
| [ ] | RC-14 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ, 🐛 実害 | 🔧 微修正 | S | `usePublicEventNotFoundRedirect()` が eventId の存在しか見ず、URL の communityAccount 不一致を検出しない<br>不整合な `/c/:communityAccount/e/:eventId` でも公開ページが開き、members では実コミュニティの公開設定を迂回しうる |

---

## 評価セッション（2026-08-30 15:10・shokujii-code-review）

- **評価日時**: 2026-08-30 15:10 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `fix/2335-phase-2.5-seo`
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S | Phase 2.5 の実装 Issue を CLOSED の #2195 と記載<br>本作業は #2335。完了条件・更新履歴の 2 箇所を #2335 に修正 |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 新規 SEO ハンドラが `express.Response` に直接依存<br>`utils/httpResponse.ts` の規約（ogp / sitemap 系は `HttpResponse`）に合わせて統一 |
| [ ] | RC-3 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `forwardSafeHeaders` / `fetchIndexHtml` / `SEO_CACHE_CONTROL` が `ogpRequest.ts` からのコピー<br>共有 util（`seo/serveIndexHtml.ts` 等）への抽出が望ましい。自動修正対象外 |
| [x] | RC-4 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | JSON-LD ヘルパーの引数型が `Awaited<ReturnType<typeof ...>>`<br>`ogpRequest.ts` の既存表現と一致するため許容 |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `buildTopNavLink` の第 1 引数 `site` が未使用<br>`buildNavLink(href, label)` に整理し呼び出し 4 箇所を更新 |
| [x] | RC-6 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 静的 canonical が SEO_HEAD ブロック外にあり、Function 注入ページで canonical が 2 本になる<br>矛盾する canonical は無視され P2-3 の施策が無効化。`stripStaticCanonicalLink()` を追加 |
| [ ] | RC-7 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `isPublicEventDetailPath` 分岐が到達不能になった<br>ガードが `/manage/event/**` 限定になったため dead code + JSDoc が実態と不一致。方針判断が必要 |
| [x] | RC-8 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 公開イベントのクライアント側 404 ガード除去<br>直リンク・リロードは Function が 404、アプリ内リンクは `is_deleted == false` クエリ由来のため実害なし |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/12_SEO対策/01_SEO対策_タスク.md:339`

**該当コード（レビュー時点の diff）**:

```diff
+- ✅ P2.5-2〜6 コード実装（Issue #2195）
...
+| 2026-08-30 | **Phase 2.5 実装（#2195）**: P2.5-2（公開イベント router ガード除去）・P2.5-3（description 重複除去）・P2.5-4（プリレンダー内部リンク）・P2.5-5（`/communitylist` SEO）・P2.5-6（`/community/**` 301）。P2.5-8 は保留（全イベント sitemap 維持）。P2.5-7 本番検証はデプロイ後 |
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: Phase 2.5 の実装 Issue が `#2195` と記載されているが、`#2195` は Phase 1/2 の Issue で既に CLOSED。本ブランチのコミットはすべて `#2335`（OPEN・Phase 2.5 SEO インデックス回復クリティカル修正）を参照している → 完了条件・更新履歴の Issue 番号を `#2335` に修正する。

**コメント要約**: Phase 2.5 の実装 Issue を CLOSED の #2195 と記載。
本作業は #2335。完了条件・更新履歴の 2 箇所を #2335 に修正。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: ドキュメント正本の追跡性の問題。修正方針が一意（#2195 → #2335）で工数 S・📄 ドキュメントのみのため手順 3b で自動修正した。冒頭の「関連 Issue: #2195」は Phase 1/2 の記述として妥当なので変更していない。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/communityListSeoRequest.ts:21`

**該当コード（レビュー時点の diff）**:

```diff
+import express from 'express'
+import { https } from 'firebase-functions/v2'
...
+const forwardSafeHeaders = (from: Response, to: express.Response, options?: { excludeCacheControl?: boolean }) => {
...
+  async (req: https.Request, res: express.Response) => {
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `functions/default/src/utils/httpResponse.ts` の JSDoc は「`HttpResponse`: express 型に依存したくない onRequest ハンドラ（ogp / sitemap / stripeWebhook の一部）」と使い分けを規定している。本ハンドラは ogp / sitemap と同じ SEO 系ハンドラであり、`express` を直接 import して `express.Response` を注釈するとこの規約から外れる → `HttpResponse` を使い、ハンドラの `res` は `ogpRequest.ts` と同様に推論に任せる。

**コメント要約**: 新規 SEO ハンドラが `express.Response` に直接依存。
`utils/httpResponse.ts` の規約（ogp / sitemap 系は `HttpResponse`）に合わせて統一。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 既存の型使い分け規約が JSDoc に明記されており、修正方針が一意。`tsc -b` で型検査が通ることを確認した。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/communityListSeoRequest.ts:18-53`

**該当コード（レビュー時点の diff）**:

```diff
+const SEO_CACHE_CONTROL = 'public, max-age=600, s-maxage=600'
+
+const forwardSafeHeaders = (from: Response, to: express.Response, options?: { excludeCacheControl?: boolean }) => {
+  const excludedHeaderKeys = new Set([
+    'content-encoding',
...
+const fetchIndexHtml = async (): Promise<{ html: string; response: Response } | undefined> => {
+  const response = await fetch(`${getEventSiteOrigin()}/index.html`)
+  if (!response.ok) {
+    return undefined
+  }
+  const html = await response.text()
+  return { html, response }
+}
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `SEO_CACHE_CONTROL` / `forwardSafeHeaders` / `fetchIndexHtml` が `ogpRequest.ts` と完全に同一のコピーになっている。除外ヘッダの追加やキャッシュ方針の変更時に片方だけ直る事故が起きる → `seo/serveIndexHtml.ts` 等の共有モジュールに抽出し、`ogpRequest.ts` と共用する。

**コメント要約**: `forwardSafeHeaders` / `fetchIndexHtml` / `SEO_CACHE_CONTROL` が `ogpRequest.ts` からのコピー。
共有 util（`seo/serveIndexHtml.ts` 等）への抽出が望ましい。自動修正対象外。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 変更種別が 📐 リファクタで、既存 `ogpRequest.ts` 側の書き換えを伴うため `auto-fix-policy.md` の条件付き 🟡 自動修正の対象外（🔧 微修正 / 📄 ドキュメントのみに限定）。抽出先の設計判断をユーザーに委ねる。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/communityListSeoRequest.ts:55`

**該当コード（レビュー時点の diff）**:

```diff
+const buildCommunityListJsonLd = (params: {
+  site: string
+  canonicalUrl: string
+  communities: Awaited<ReturnType<typeof getPublicCommunitiesForSeoPreview>>
+}): Record<string, unknown> => {
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: store が `SeoCommunityPreviewEntry` を export しているため直接使うほうが読みやすいが、`ogpRequest.ts` の `communityData: NonNullable<Awaited<ReturnType<typeof getCommunityByAccount>>>` と同じ既存表現であり、store の戻り値変更に追従できる利点もある → 既存慣習に一致するため対応不要。

**コメント要約**: JSON-LD ヘルパーの引数型が `Awaited<ReturnType<typeof ...>>`。
`ogpRequest.ts` の既存表現と一致するため許容。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 同一ディレクトリの既存ハンドラと同じ型表現であり、規約違反ではない。統一するなら `ogpRequest.ts` 側も含めた別作業が適切。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/seo/prerenderBody.ts:24`

**該当コード（レビュー時点の diff）**:

```diff
+const buildTopNavLink = (site: string, href: string, label: string): string =>
+  `<a href="${escapeHtmlAttribute(href)}">${escapeHtmlText(label)}</a>`
...
+  const navBlock = `<nav>
+  ${buildTopNavLink(input.site, `${input.site}/`, 'トップ')}
+  · ${buildTopNavLink(input.site, communityUrl, input.communityName)}
+</nav>`
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `buildTopNavLink` の第 1 引数 `site` が関数本体で使われていない（href は呼び出し側で組み立て済み）。呼び出し 4 箇所すべてで無意味な引数を渡しており、「site を基準に href を作る」という誤解も招く → 引数を `(href, label)` に絞り、名前も `buildNavLink` にする。

**コメント要約**: `buildTopNavLink` の第 1 引数 `site` が未使用。
`buildNavLink(href, label)` に整理し呼び出し 4 箇所を更新。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 未使用引数の削除は方針が一意で影響範囲が同一ファイル内に閉じるため手順 3b で自動修正した。`prerenderBody.test.ts` は既存のまま通過。

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/index.html:12`

**該当コード（レビュー時点の diff）**:

```diff
     <meta
       name="description"
       content="ランチ会・食事会の幹事向けプラットフォーム。イベント・会議・セミナー・社内交流会・異業種交流会。飲食店からお弁当やケータリングを配達・デリバリー"
     />
+    <link rel="canonical" href="https://shokujii.jp/" />
     <link rel="stylesheet" type="text/css" href="/loader.css" />
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: 追加した静的 canonical が `SEO_HEAD_BEGIN` / `SEO_HEAD_END` マーカーの外にあるため、Function 注入ページ（`/c/**`、`/c/**/e/**`、新規 `/communitylist`）のレスポンスに canonical が 2 本入る（`https://shokujii.jp/` + ページ固有 URL）。Google は矛盾する複数 canonical を無視するため、P2-3 で入れたページ固有 canonical が効かなくなり、Phase 2.5 の目的（インデックス回復）に逆行する → 同 PR で導入した `stripStaticMetaDescription()` と同様に、注入時に静的 canonical を除去する（`stripStaticCanonicalLink()`）。トップページは素の `index.html` 配信なので静的 canonical が残り従来どおり。

**コメント要約**: 静的 canonical が SEO_HEAD ブロック外にあり、Function 注入ページで canonical が 2 本になる。
矛盾する canonical は無視され P2-3 の施策が無効化。`stripStaticCanonicalLink()` を追加。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 仕様判断・スコープ外設計・セキュリティ確認のいずれにも該当せず、同 PR の description 重複除去と同じ方針で解決できるため手順 3a で自動修正した。`htmlInjection.test.ts` の SAMPLE_HTML に静的 canonical を追加し、注入後に canonical が 1 本のみになる回帰テストを追加（11 tests passed）。ドキュメント（P2.5-3 行）も canonical を含む記述に更新した。

---

**識別子**: RC-7（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/router/eventRouteGuard.ts:4`

**該当コード（レビュー時点の diff）**:

```diff
-    const eventIdMatch = to.path.match(/\/c\/[^/]+\/e\/([^/]+)/) || to.path.match(/\/manage\/event\/([^/]+)/)
-    if (eventIdMatch) {
+    const manageEventMatch = to.path.match(/^\/manage\/event\/([^/]+)/)
+    if (manageEventMatch) {
       ...
       } catch (err) {
         const redirect = resolveEventLoadFailureRedirect(to.path, err)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: ガードが `/manage/event/**` 限定になったため、`resolveEventLoadFailureRedirect` に渡る path は常に管理画面パスになり、`isPublicEventDetailPath(path)` 分岐は到達不能（dead code）になった。JSDoc の「公開イベント詳細は ogpRequest がサーバー側で存在確認済みのため…」も実際の呼び出し経路と合わない。テストが両分岐を通しているため lint でも検出されない → 公開パス分岐と JSDoc を整理する（または将来の再導入意図をコメントで明示する）。

**コメント要約**: `isPublicEventDetailPath` 分岐が到達不能になった。
ガードが `/manage/event/**` 限定になったため dead code + JSDoc が実態と不一致。方針判断が必要。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 「削除する」か「将来の再導入前提で残す」かの方針判断が必要で修正方針が一意でないため自動修正しない（`auto-fix-policy.md`）。`isPublicEventDetailPath` は `eventRouteGuard.test.ts` からも参照されており、削除する場合はテストの整理も伴う。

---

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/router/index.ts:465`

**該当コード（レビュー時点の diff）**:

```diff
-    // イベントページ or イベント管理ページの場合: 削除済みイベントは404へリダイレクト
-    const eventIdMatch = to.path.match(/\/c\/[^/]+\/e\/([^/]+)/) || to.path.match(/\/manage\/event\/([^/]+)/)
+    // イベント管理ページのみ: 削除済みイベントは404へリダイレクト
+    // 公開 /c/**/e/** は ogpRequest 側で404済みのためクライアント存在チェックは行わない
+    // （getLoadedEvent タイムアウト時の誤404→noindex を防ぐ）
+    const manageEventMatch = to.path.match(/^\/manage\/event\/([^/]+)/)
```

**レビュワーのコメント（原文）**:

👌 **修正不要**: 公開イベント詳細でクライアント側の `is_deleted` チェックが無くなるため、削除済みイベントへの SPA 内遷移が `/404` に飛ばなくなる。ただし直リンク・リロードは `firebase.json` の `/c/**/e/**` rewrite 経由で `handleEventOgpRequest` が 404 を返し、アプリ内のイベント一覧は `where('is_deleted', '==', false)` 由来のリンクしか持たないため、実害は限定的 → Phase 2.5 の目的（レンダリング後 noindex の解消）を優先する現方針で妥当。

**コメント要約**: 公開イベントのクライアント側 404 ガード除去。
直リンク・リロードは Function が 404、アプリ内リンクは `is_deleted == false` クエリ由来のため実害なし。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: サーバー側 404 が一次防御として機能しており、誤 404 → noindex のリスク（R-2）のほうが影響が大きい。ドキュメント（P2.5-2）にも方針が明記されている。

---

## 評価セッション（2026-08-30 15:46・review-comments-evaluate auto）

- **評価日時**: 2026-08-30 15:46 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `fix/2335-phase-2.5-seo`
- **PR**: #2338
- **REVIEW_REQUEST_SINCE**: 2026-08-30T06:30:07Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文・Codex 接続案内）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-9 | 3888663271, 3888667950 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `/communitylist/`・`/community/` が static index.html に落ち SEO 注入されない<br>`firebase.json` に 301 redirect を追加 |
| [x] | RC-10 | 3888667952 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `index.html` の固定 canonical が `/u/**` 等 rewrite 対象外ページにも配信され全ページがトップ canonical 化<br>静的 canonical を削除 |
| [x] | RC-11 | 3888667953 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `documentTitle.test.ts` の `as never` 禁止<br>`RouteLocationNormalized` の型付き fixture ヘルパーに置換 |
| [ ] | RC-12 | 3888663241 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | SEO util 重複（RC-3 と同趣旨）<br>Copilot 指摘。RC-3 と統合して別途対応 |
| [x] | RC-13 | なし | 👌 修正不要 | — | — | — | 👀 確認のみ | — | 存在しない `/c/**/e/**` への SPA 遷移が無限ローディングになる懸念<br>RC-8 と同根。Phase 2.5 方針で許容 |

---

**識別子**: RC-9（GitHub id: 3888663271, 3888667950）

**レビュワー**: Copilot, Codex

**指摘箇所**: `firebase.json`（hosting redirects）

**レビュワーのコメント（原文）**:

Copilot [must]: `/communitylist/` や `/community/` 等の末尾スラッシュ付き URL が rewrite 対象外となり static `index.html` に落ち、SEO 注入 Function が実行されない → 301 redirect で正規 URL へ統一する。

Codex P2: 同上（trailing slash 問題）。

**コメント要約**: `/communitylist/`・`/community/` が static index.html に落ち SEO 注入されない。`firebase.json` に 301 redirect を追加。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 実害あり・修正方針一意。`/community/` と `/communitylist/` の 301 を `firebase.json` に追加した。

---

**識別子**: RC-10（GitHub id: 3888667952）

**レビュワー**: Codex

**指摘箇所**: `user/index.html:12`

**レビュワーのコメント（原文）**:

Codex P2: 固定 canonical `https://shokujii.jp/` が `/u/**` プロフィール等 rewrite 対象外ページにもそのまま配信され、全ページがトップ canonical 化される。

**コメント要約**: `index.html` の固定 canonical が `/u/**` 等 rewrite 対象外ページにも配信され全ページがトップ canonical 化。静的 canonical を削除。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-6 で Function 注入ページ向けに `stripStaticCanonicalLink()` を導入済み。静的 canonical は `/u/**` 等に悪影響するため `index.html` から削除。トップページの canonical は JSON-LD / og:url で代替（別 Issue 化可）。

---

**識別子**: RC-11（GitHub id: 3888667953）

**レビュワー**: Codex

**指摘箇所**: `user/tests/router/documentTitle.test.ts`

**レビュワーのコメント（原文）**:

Codex P1: `as never` はプロジェクト規約で禁止。`RouteLocationNormalized` の型付き fixture を使う。

**コメント要約**: `documentTitle.test.ts` の `as never` 禁止。`RouteLocationNormalized` の型付き fixture ヘルパーに置換。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 条件付き 🟡 自動修正対象。`createDocumentTitleRoute()` ヘルパーを追加し `as never` を除去。7 tests passed。

---

**識別子**: RC-12（GitHub id: 3888663241）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/communityListSeoRequest.ts`

**レビュワーのコメント（原文）**:

Copilot: SEO util（`forwardSafeHeaders` / `fetchIndexHtml` 等）が `ogpRequest.ts` と重複。共有 util への抽出を推奨。

**コメント要約**: SEO util 重複（RC-3 と同趣旨）。Copilot 指摘。RC-3 と統合して別途対応。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: RC-3 と同一指摘。📐 リファクタのため自動修正対象外。RC-3 対応時にまとめて解消する。

---

**識別子**: RC-13（GitHub id: なし・Copilot トップレベル）

**レビュワー**: Copilot

**指摘箇所**: `user/src/router/index.ts`（公開イベントガード除去）

**レビュワーのコメント（原文）**:

Copilot: 公開 `/c/**/e/**` から `getLoadedEvent` ガードを除去したため、存在しないイベント URL への SPA 内遷移が `/404` にならず無限ローディングになる可能性。

**コメント要約**: 存在しない `/c/**/e/**` への SPA 遷移が無限ローディングになる懸念。RC-8 と同根。Phase 2.5 方針で許容。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: セルフレビュー RC-8 と同根。直リンク・リロードは Function 404、一覧リンクは `is_deleted == false` 由来。Phase 2.5 の noindex 解消を優先する現方針で妥当。

---

## 評価セッション（2026-08-30 16:34・review-comments-evaluate auto）

- **評価日時**: 2026-08-30 16:34 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto）
- **ブランチ名**: `fix/2335-phase-2.5-seo`
- **PR**: #2338
- **REVIEW_REQUEST_SINCE**: 2026-08-30T07:26:31Z
- **partial**: true（Codex 接続案内 + no_issues サマリのみ。substantive インライン指摘なし）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼定型文・Copilot 承知返信・Codex 接続案内・Codex no_issues）
- **新規 RC**: なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| — | — | — | — | — | — | — | — | — | 新規 RC なし。Copilot は RC-3/RC-7/RC-12 以外に追加指摘なし。Codex は major issues なし |

**判断理由**: `b295b3b90` 以降の再レビュー。Copilot トップレベル（5467397360）で既記録 RC-3/RC-7/RC-12 以外の高信頼指摘はないと確認。Codex（5467400225）は no_issues。インラインコメント 0 件。自動修正対象なし。

---

## 評価セッション（2026-08-30 20:18・shokujii-code-review）

- **評価日時**: 2026-08-30 20:18 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `fix/2335-phase-2.5-seo`
- **PR**: #2338
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-14 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🔒 セキュリティ, 🐛 実害 | 🔧 微修正 | S | `usePublicEventNotFoundRedirect()` が eventId の存在しか見ず、URL の communityAccount 不一致を検出しない<br>不整合な `/c/:communityAccount/e/:eventId` でも公開ページが開き、members では実コミュニティの公開設定を迂回しうる |

---

**識別子**: RC-14（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/composable/usePublicEventNotFoundRedirect.ts:6`

**該当コード（レビュー時点の diff）**:

```diff
+export const usePublicEventNotFoundRedirect = (eventId: string, options: EventStoreOptions = {}): void => {
+  const eventStore = useEventStore(eventId, options) as EventStore
+  const { exists } = storeToRefs(eventStore)
+  usePublicResourceNotFoundRedirect(exists)
+}
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `usePublicEventNotFoundRedirect()` が `eventId` の `exists` しか見ておらず、URL の `communityAccount` と `event.community_account` の一致を検証していません。`user/src/pages/c/[communityAccount]/e/[eventId]/index.vue` と `members.vue`、`enterprise/src/pages/c/[communityAccount]/e/[eventId]/members.vue` はこの composable を通したあとに URL 側 community と eventId 側 event を別々に読み込むため、実在する別コミュニティの eventId を差し込んだ不整合 URL でも `/404` になりません。とくに `base/src/components/pages/c/[communityAccount]/e/[eventId]/members.vue` は members 公開可否を URL 由来の `communityStore.community?.is_show_member` で判定しているので、`/c/<公開設定の別community>/e/<対象eventId>/members` の形で実コミュニティ側の公開制御を迂回できます。サーバー側 `functions/default/src/ogpRequest.ts` は同じ `community_account` 不一致を 404 にしているため、SPA 側も一致チェックを入れて挙動を揃えるべきです → `usePublicEventNotFoundRedirect`（または各ページ側）で `event.community_account === route.params.communityAccount` まで確認し、不一致なら `/404` にしてください。

**コメント要約**: `usePublicEventNotFoundRedirect()` が eventId の存在しか見ず、URL の communityAccount 不一致を検出しない。
不整合な `/c/:communityAccount/e/:eventId` でも公開ページが開き、members では実コミュニティの公開設定を迂回しうる。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ, 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: URL 不整合時の 404 判定漏れにより、公開ページの参照先整合性が崩れ、members 公開可否を実コミュニティではなく URL 側コミュニティ設定で判定してしまう。サーバー側は同条件を 404 にしており、クライアント側だけ許可する理由もないため、マージ前に塞ぐ必要があると判断した。

