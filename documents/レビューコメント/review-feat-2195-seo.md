# ブランチ feat/2195-seo レビュー記録

## 評価セッション（2026-07-19 17:46・shokujii-code-review）

- **評価日時**: 2026-07-19 17:46 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|

- 指摘なし（documents/12_SEO対策/SEO対策.md 新規作成。チェックリスト照合のみ）

## 評価セッション（2026-07-19 17:50・shokujii-code-review）

- **評価日時**: 2026-07-19 17:50 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|

- 指摘なし（SEO対策.md に Phase 4・工数見積もり追加。ドキュメントのみ）

## 評価セッション（2026-07-19 18:10・shokujii-code-review）

- **評価日時**: 2026-07-19 18:10 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|

- 指摘なし（Phase 2 SEO 実装: ogpRequest 拡張、sitemap、robots.txt、seo モジュール、Vitest 17 件追加）

## 評価セッション（2026-07-19 18:10・shokujii-code-review・再実行）

- **評価日時**: 2026-07-19 18:10 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | sitemap `lastmod` が ShokujiiEvent/Community 生成時に常に現在時刻になる |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | イベント URL の communityAccount 不一致時も 200 + 誤 canonical を返していた |

### RC-1

**GitHub id**: なし（エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/stores/seoSitemap.ts`

**レビュワーのコメント（原文）**:

ShokujiiEvent / ShokujiiCommunity の constructor が `updated_at` を `Date.now()` で上書きするため、withConverter 経由では sitemap の `lastmod` が常に生成日時になってしまう。Firestore の raw `updated_at`（Timestamp）から millis を取得すべき。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

### RC-2

**GitHub id**: なし（エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `functions/default/src/ogpRequest.ts` L204 付近

**レビュワーのコメント（原文）**:

`getEvent(eventId)` のみでパス上の `communityAccount` を検証していないため、`/c/wrong/e/{validEventId}` で 200 と誤った canonical URL が返る。P2-3 の正規 URL 要件に反するため 404 とすべき。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

## 評価セッション（2026-07-19 18:21・shokujii-code-review）

- **評価日時**: 2026-07-19 18:21 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|

- 指摘なし（P1-2 noindex headers、P1-3 index.html メタ、P2-8 document.title、P2-9 404 noindex）

## 評価セッション（2026-07-19 18:37・review-comments-evaluate・auto）

- **評価日時**: 2026-07-19 18:37 JST
- **評価者**: Cursor Agent（review-comments-evaluate）
- **ブランチ名**: feat/2195-seo
- **PR**: #2196
- **REVIEW_REQUEST_SINCE**: 2026-07-19T09:24:00Z
- **partial**: true（Codex usage limits のみ。Copilot レビューは取得）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼コメント、Codex limits/connect 案内）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-3 | 3610294674 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | JSON-LD 埋め込み時に script 終了タグをエスケープ |
| [x] | RC-4 | 3610294682 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | catch-all error パラメータ配列を正しく解釈 |
| [x] | RC-5 | 3610294691 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | sitemap の x-forwarded-host 未設定時 400 |
| [x] | RC-6 | 5015208780 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | OGP title/description の二重 HTML エスケープ |
| [x] | RC-7 | 5015208780 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | title 置換時の replace $ 特殊シーケンス |
| [x] | RC-8 | 5015208780 | 👌 修正不要 | — | 📌 スコープ内 | — | 📐 リファクタ | M | seoSitemap を withConverter 経由に |
| [x] | RC-9 | 5015208780 | 🟡 修正提案 | 📤 #2197 別Issue化 | 📤 スコープ外 | — | 📋 仕様追加 | M | 公開イベント sitemap 取得のページング<br>#2197 |
| [x] | RC-10 | 5015208780 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | robots.txt Disallow: /register の末尾スラッシュ削除 |

## 評価セッション（2026-07-19 18:45・shokujii-code-review）

- **評価日時**: 2026-07-19 18:45 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: #2196

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|

- 指摘なし（RC-10 robots.txt 末尾スラッシュ削除、RC-9 #2197 別Issue化記録）

## 評価セッション（2026-07-19 18:50・review-comments-evaluate）

- **評価日時**: 2026-07-19 18:50 JST
- **評価者**: Cursor Agent（review-comments-evaluate）
- **ブランチ名**: feat/2195-seo
- **PR**: #2196

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-8 | 5015208780 | 👌 修正不要 | — | 📌 スコープ内 | — | 📐 リファクタ | M | seoSitemap を withConverter 経由に |

### RC-8

**GitHub id**: 5015208780

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/seoSitemap.ts`

**レビュワーのコメント（原文）**:

seoSitemap を withConverter 経由にリファクタすべき（プロジェクト規約整合）。

**判断結果**: 👌 修正不要

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📐 リファクタ

**想定工数**: M

**評価**: 👌 修正不要

**ステータス**: —

**判断理由**: RC-1 で既に対応済み。`ShokujiiEvent` / `ShokujiiCommunity` の constructor は `updated_at` を `Date.now()` で上書きするため、既存 converter 経由にすると sitemap の `lastmod` が常に生成時刻になり RC-1 が再発する。現状の raw `updated_at` 読み取りは意図的な設計。withConverter 化する場合は sitemap 専用の軽量 converter が必要で、#2197（ページング）と合わせて別途検討が妥当。

## 評価セッション（2026-07-19 19:00・review-comments-evaluate・auto）

- **評価日時**: 2026-07-19 19:00 JST
- **評価者**: Cursor Agent（review-comments-evaluate）
- **ブランチ名**: feat/2195-seo
- **PR**: #2196
- **REVIEW_REQUEST_SINCE**: 2026-07-19T09:50:06Z
- **partial**: true（Codex usage limits）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4（レビュー依頼コメント、Codex limits/connect 案内）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-11 | 3610329752 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | sitemap の x-forwarded-host カンマ区切り時に先頭 host のみ使用 |
| [x] | RC-12 | 3610329756 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | afterEach の document.title 更新を try/catch で保護 |
| [x] | RC-13 | 5015271247 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | ogpRequest でも resolveRequestSite を使用（host 未設定/配列対応） |

## 評価セッション（2026-07-19 19:42・shokujii-code-review）

- **評価日時**: 2026-07-19 19:42 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: feat/2195-seo
- **PR**: #2196
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|

- 指摘なし（P3-S1〜3 構造化データ拡張、P3-3 Vue h1 整備）

## 評価セッション（2026-07-19 20:00・review-comments-evaluate・auto）

- **評価日時**: 2026-07-19 20:00 JST
- **評価者**: Cursor Agent（review-comments-evaluate）
- **ブランチ名**: feat/2195-seo
- **PR**: #2196
- **REVIEW_REQUEST_SINCE**: 2026-07-19T10:46:50Z
- **partial**: true（Codex usage limits / 未接続）
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼コメント、Codex limits/connect 案内）
- **手順 4a 自動修正**: RC-14〜15（🚨 2件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-14 | 3610407930 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | resolveRequestSite で x-forwarded-proto を優先 |
| [x] | RC-15 | 3610407935 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | sitemap イベント取得に enterprise_id == null 追加 |
| [ ] | RC-16 | 5015432068 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | M | Organization JSON-LD 住所を PostalAddress 型に統一（imo） |
| [ ] | RC-17 | 5015432068 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 📐 リファクタ | M | seoSitemap が converter なし raw 読み取り（nits） |
| [ ] | RC-18 | 5015432068 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 🔧 微修正 | S | sitemap lastmod を JST 日付に揃える（nits） |

### RC-14

**GitHub id**: 3610407930

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/utils/resolveRequestSite.ts:24`

**レビュワーのコメント（原文）**:

`req.protocol` だけで site URL を組み立てると、プロキシ配下では `http` になり sitemap / canonical が `http://...` になる可能性があります（`x-forwarded-proto` を優先して解決したいです）。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**判断理由**: `resolveProtocol` を追加し `x-forwarded-proto`（カンマ区切り先頭）を優先。Vitest 2 件追加。

### RC-15

**GitHub id**: 3610407935

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/seoSitemap.ts:50`

**レビュワーのコメント（原文）**:

コミュニティは `enterprise_id == null` で PF のみを対象にしている一方、イベント側は `enterprise_id` フィルタが無く、enterprise イベントも sitemap に載る可能性があります（`firebase.json` では enterprise は noindex 付与済みなので、sitemap には混ぜない方が安全です）。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**判断理由**: `getPublicEventsForSitemap` に `.where('enterprise_id', '==', null)` を追加。`firestore.indexes.json` に複合インデックス（is_public + is_deleted + enterprise_id）を追加。

### RC-16

**GitHub id**: 5015432068（Copilot トップレベルレビュー）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/seo/jsonLd.ts:128-140`

**レビュワーのコメント（原文）**:

`buildOrganizationJsonLdNode` は `address: fullAddress` の平文文字列。統一するなら `buildEventJsonLdNode` と同じ構造化住所にすると一貫性が上がります。

**判断結果**: 未着手

**PRスコープ**: 📌 スコープ内

**変更種別**: 📐 リファクタ

**想定工数**: M

**評価**: 🟡 修正提案

**ステータス**: 未着手

**判断理由**: Rich Results への影響は軽微。imo レベルでマージブロック外。

### RC-17

**GitHub id**: 5015432068（Copilot トップレベルレビュー）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/stores/seoSitemap.ts`

**レビュワーのコメント（原文）**:

他 store は withConverter + Zod だが seoSitemap は raw 読み取り。軽量ユースケースとして割り切り可だが統一観点では記録。

**判断結果**: 未着手

**PRスコープ**: 📌 スコープ内

**変更種別**: 📐 リファクタ

**想定工数**: M

**評価**: 🟡 修正提案

**ステータス**: 未着手

**判断理由**: RC-1 対応済みの意図的設計（updated_at 上書き回避）。withConverter 化は別途検討。

### RC-18

**GitHub id**: 5015432068（Copilot トップレベルレビュー）

**レビュワー**: Copilot

**指摘箇所**: `functions/default/src/seo/sitemap.ts:15-18`

**レビュワーのコメント（原文）**:

`lastmod` が UTC 日付のため JST 21 時以降は翌日付になる。JST ベースに揃えるなら luxon が候補。

**判断結果**: 未着手

**PRスコープ**: 📌 スコープ内

**変更種別**: 🔧 微修正

**想定工数**: S

**評価**: 🟡 修正提案

**ステータス**: 未着手

**判断理由**: SEO 影響は軽微（nits）。luxon 依存追加の要否は別判断。

