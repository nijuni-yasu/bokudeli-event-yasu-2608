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
| [ ] | RC-9 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `user/index.html` に固定 canonical を追加したが、rewrite 対象外の公開パスでは差し替わらない<br>`/u/**` などが常にトップ canonical を返し、公開ページの正規URL判定を壊す |
| [ ] | RC-10 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 公開イベントの存在確認を外した一方で、`exists === false` を UI が処理していない<br>存在しない `/c/**/e/**` へ SPA 遷移すると `/404` にならず無限ローディングになる |

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

## 評価セッション（2026-08-30 15:31・shokujii-code-review）

- **評価日時**: 2026-08-30 15:31 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: `fix/2335-phase-2.5-seo`
- **PR**: #2338
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-9 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | `user/index.html` に固定 canonical を追加したが、rewrite 対象外の公開パスでは差し替わらない<br>`/u/**` などが常にトップ canonical を返し、公開ページの正規URL判定を壊す |
| [ ] | RC-10 | なし | 🚨 必須修正 | 未着手 | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 公開イベントの存在確認を外した一方で、`exists === false` を UI が処理していない<br>存在しない `/c/**/e/**` へ SPA 遷移すると `/404` にならず無限ローディングになる |

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

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

🚨 **必須修正** [🔧微修正/S]: `user/index.html` にトップ固定の canonical を追加していますが、`firebase.json` で canonical を差し替える Function rewrite は `/communitylist`・`/c/**`・`/c/**/e/**` だけです。`/u/**` など rewrite 対象外の公開 URL ではこの静的 canonical がそのまま返り、どのページでも正規 URL が `https://shokujii.jp/` になってしまいます。`user/src` 側にも route ごとに canonical を更新する処理は見当たらないため、公開プロフィール等のインデックス判定を壊す実害があります → 固定 canonical の追加は差し替え経路があるページに限定するか、rewrite 対象外の公開ルートでも正しい canonical を設定する仕組みを入れてください。

**コメント要約**: `user/index.html` に固定 canonical を追加したが、rewrite 対象外の公開パスでは差し替わらない。
`/u/**` などが常にトップ canonical を返し、公開ページの正規URL判定を壊す。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 差分で追加された canonical が rewrite 対象外ルートにも配信されるため、公開ページの canonical が誤る実害がある。修正方針は複数あるが、いずれにせよ現状のままはマージ不可のため 🚨 と判断した。

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `user/src/router/index.ts:466`

**該当コード（レビュー時点の diff）**:

```diff
-    // イベントページ or イベント管理ページの場合: 削除済みイベントは404へリダイレクト
-    // 例: /c/example-community/e/abc123, /manage/event/abc123
-    const eventIdMatch = to.path.match(/\/c\/[^/]+\/e\/([^/]+)/) || to.path.match(/\/manage\/event\/([^/]+)/)
-    if (eventIdMatch) {
-      const eventId = eventIdMatch[1]
+    // イベント管理ページのみ: 削除済みイベントは404へリダイレクト
+    // 公開 /c/**/e/** は ogpRequest 側で404済みのためクライアント存在チェックは行わない
+    // （getLoadedEvent タイムアウト時の誤404→noindex を防ぐ）
+    const manageEventMatch = to.path.match(/^\/manage\/event\/([^/]+)/)
+    if (manageEventMatch) {
+      const eventId = manageEventMatch[1]
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: 公開イベント詳細の `getLoadedEvent()` ガードを外した一方で、ページ側は `event != null` しか見ておらず、`base/src/stores/event.ts` が `exists.value = false` に落ちたケースを処理していません。そのため存在しない `/c/**/e/**` へ SPA 内遷移や手入力で到達すると、`/404` に遷移せずスピナーが出続けます。サーバー側 404 はリロード時しか効かないので、クライアント遷移の退行は別途吸収が必要です → 公開イベントでも「存在しない」ケースだけは `/404` に落とすか、少なくとも詳細ページで `eventStore.exists === false` を監視して not found を表示してください。

**コメント要約**: 公開イベントの存在確認を外した一方で、`exists === false` を UI が処理していない。
存在しない `/c/**/e/**` へ SPA 遷移すると `/404` にならず無限ローディングになる。

**評価**: 🚨 必須修正

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `base/src/stores/event.ts` は未存在イベントを `exists = false` で確定させるのに、今回の差分でそのシグナルを受ける側がなくなった。Function rewrite では防げない SPA 内遷移で実際に無限ローディングへ落ちるため、実害のある退行として 🚨 に分類した。

