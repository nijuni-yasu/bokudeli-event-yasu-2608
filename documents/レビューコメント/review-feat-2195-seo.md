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

