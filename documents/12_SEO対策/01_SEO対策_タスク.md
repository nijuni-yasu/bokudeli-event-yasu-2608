# SEO 対策

Shokujii（shokujii.jp）の検索エンジン最適化に関する調査結果と対策タスク。

- **関連 Issue**: [#2195 SEO 対策（robots / sitemap / 動的メタ / 構造化データ）](https://github.com/nijuniinc/bokudeli-event-new/issues/2195)
- **露出施策（開発 × プロモーション）**: [13_成長・露出/01_露出獲得施策.md](../13_成長・露出/01_露出獲得施策.md)
- **対象アプリ**: 主に `user`（一般ユーザー向け・shokujii.jp）
- **対象外**: `partner` / `enterprise` / `manager`（管理画面。検索流入は不要。noindex のみ実施）
- **関連スキル**: `/seo-audit`（監査）、`/schema`（JSON-LD・構造化データ。skills.sh 上は schema-markup）、`/ai-seo`（Phase 3B GEO）、`/programmatic-seo`（Phase 4 量産ページ）、`/content-strategy`（Phase 4 キーワード・コンテンツ設計）

---

## 工数見積もり（S / M / L）

| 記号 | 目安 | 例 |
|------|------|-----|
| **S** | 半日〜1日 | 設定ファイル追加、静的メタ修正、調査・ドキュメント |
| **M** | 2〜5日 | Function 拡張、新規ページ 1 種、sitemap 生成 |
| **L** | 1週間以上 | スキーマ変更 + backfill、新規公開ページ群、レンダリング基盤 |

タスク見出しの `[S]` / `[M]` / `[L]` は上記の目安。実装・レビュー・デプロイ・検証を含む。

進捗表記: 完了 **✅** / 未着手・進行中 **`[ ]`**

---

## スキルとタスクの対応

| スキル | 主な用途 | 対応 Phase / タスク |
|--------|----------|---------------------|
| `/seo-audit` | 技術 SEO 監査・再監査 | Phase 2.5、P3-1、検証チェックリスト |
| `/schema` | JSON-LD 実装・検証・拡張 | P2-4 / **P2-4-V** / **P2.5-7**、**P3-S1〜3**、P4-5（LocalBusiness） |
| `/ai-seo` | AI 検索・GEO 最適化 | **Phase 3B（P3B-1〜4）** |
| `/programmatic-seo` | 量産ページ設計・プレイブック | P4-0-4、P4-8〜9 |
| `/content-strategy` | キーワード・ピラー・Hub/Spoke 設計 | **P4-0-1〜2**、P4-4 |

**推奨実行順（2026-08-30 更新）**

1. **P2.5-7** 本番デプロイ後検証（GSC レンダリング済み HTML・Schema.org Validator）— **現在ここ**
2. **P3-1** GSC 再ベースライン（sitemap 成功後 **7 日後・14 日後** の 2 回）
3. **P2-4-V 本番**・検証チェックリスト完走
4. **Phase 3B（GEO）** — インデックス改善が確認できてから
5. **Phase 4（pSEO）** — P3-6 ゲート通過後

> Phase 3B（GEO）・Phase 4（pSEO）は **インデックス基盤が機能している前提** の施策。
> sitemap 未取得・レンダリング後 noindex・description 重複が残る間は着手しない。

---

## 調査サマリ

2026-07-19 に `/seo-audit` および `/programmatic-seo` スキルに基づきコードベースと本番 URL を調査した（**初回監査時点のベースライン**。下記「実装進捗サマリ」参照）。

2026-08-30 に本番 URL・GSC を再監査。sitemap 再送信成功・代表イベント URL ライブテスト合格を確認（下記 Phase 2.5 参照）。

| 観点 | 評価（初回） | 概要（初回） |
|------|-------------|-------------|
| クローラビリティ | 要改善 | robots.txt / sitemap.xml が無い。存在しない URL も 200 を返す |
| インデックス | 要改善 | 登録済み 100 / 未登録 68。未登録の大半は「クロール済み・未登録」（63）。title / description 同一が疑われる |
| 技術基盤 | 部分的 | OGP 動的注入は実装済み。検索向けメタは未対応 |
| 構造化データ | 未着手 | JSON-LD（Event / Organization）が無い |
| レンダリング | SPA 制約 | Vue 3 CSR。Google は JS レンダリングするが遅延・AI クローラーには不利 |
| 管理画面 | 要改善 | partner / enterprise に noindex 無し |
| programmatic SEO | 未着手 | 量産ページ用データ・ハブ・レンダリング基盤が未整備 |

**初回結論**: SNS シェア（OGP）対応は整っているが、**検索エンジン向け SEO はほぼ未着手**。Phase 1〜2 で既存ページのインデックス基盤を整え、Phase 4 で検索需要に合わせた量産ページを段階的に検討する。

### 実装進捗サマリ（2026-08-30 更新）

| 観点 | 評価（現在） | 概要 |
|------|-------------|------|
| クローラビリティ | **本番 OK** | robots.txt・sitemap.xml 200。GSC sitemap **成功（1,084 URL・2026-08-30）** |
| インデックス | **回復待ち** | ベースライン 100 / 68（2026-07-10）。sitemap 成功後に P3-1 で再計測 |
| 技術基盤 | **実装済み（デプロイ待ち）** | P2.5-2〜6 実装完了。description 重複除去・内部リンク・communitylist SEO・301。**本番 curl / GSC で P2.5-7 検証待ち** |
| 構造化データ | **本番 OK** | 代表 URL ライブテスト Event 有効 1 件（2026-08-30） |
| レンダリング | **要検証** | ライブテストは合格。レンダリング後 noindex 修正（P2.5-2）実装済み。**デプロイ後 GSC で再確認** |
| 管理画面 | **本番 OK** | partner / enterprise / manager に noindex headers |
| programmatic SEO | 未着手 | Phase 4。Phase 2.5 + P3-1 後 |
| AI 検索（GEO） | 未着手 | **Phase 3B**。インデックス改善後 |

---

## 現状（できていること）

- ✅ `user/index.html` に OGP / Twitter Card の静的メタタグ
- ✅ `lang="ja"` 設定
- ✅ Firebase Hosting + HTTPS
- ✅ レスポンシブ UI（Vuetify）
- ✅ `functions/default/src/ogpRequest.ts` による `/c/**`・`/c/**/e/**` の OGP 動的注入
- ✅ `firebase.json` で OGP 対象パスを Cloud Function にルーティング
- ✅ SEO 用エージェントスキルの導入（#2195）: `seo-audit` / `programmatic-seo` / `schema` / `ai-seo` / `content-strategy`
- ✅ Google Search Console に `shokujii.jp`（ドメインプロパティ）を登録
- ✅ Phase 1 主要タスク（robots.txt、noindex、静的メタ）
- ✅ Phase 2 主要タスク（動的 title / description / canonical、JSON-LD、sitemap、404 化）
- ✅ P3-4 プリレンダー（`SEO_BODY` マーカーへイベント・コミュニティ概要 HTML 注入）
- ✅ P3-3 公開ページ Vue 側 h1（EventDetailsCard / コミュニティヒーロー）
- ✅ P3-S1〜3 構造化データ拡張（WebSite / BreadcrumbList / Event enrich）
- ✅ P2-4-V sandbox 構造化データ検証（Event 有効 1 件）
- ✅ P2-4-V 本番 curl / Rich Results Test / Schema.org Validator（2026-08-24）
- ✅ GSC sitemap 再送信成功（1,084 URL・2026-08-30）
- ✅ 本番代表 URL ライブテスト合格（`/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL`・2026-08-30）
- ✅ Phase 2.5 クリティカル修正（P2.5-2〜6 実装・2026-08-30）
- [ ] P2.5-7 本番検証（デプロイ後）・GSC レンダリング済み HTML の noindex 再確認

### Search Console（ベースライン）

- **プロパティ**: [sc-domain:shokujii.jp](https://search.google.com/search-console?hl=ja&resource_id=sc-domain:shokujii.jp)
- **登録日**: 2026-07-19（実施済み）

#### サマリー（2026-04-18 〜 2026-07-11）

- ウェブ検索の合計クリック数: **645 回**（約 3 ヶ月）
- 日次クリックはおおむね 3〜16 回で変動（大きな上昇トレンドは見られない）
- 推奨事項: 「最近、ページのインプレッション数が通常より減っています」— Phase 2.5 完了 + P3-1 再計測後に再確認

#### ページのインデックス登録（2026-07-10 時点・再計測前）

レポート: [インデックス作成 > ページ](https://search.google.com/search-console/index?resource_id=sc-domain%3Ashokujii.jp&hl=ja)

| 区分 | 件数 | 備考 |
|------|------|------|
| **登録済み** | **100** | 4/20〜6/27 は約 **125** 件で横ばい → **6/27 頃に 100 へ急減**（-25 件） |
| **未登録** | **68** | 下表の理由別。**P3-1（sitemap 成功後）で再計測予定** |

**未登録の内訳**

| 理由 | 件数 | ソース | 対応 Phase / タスク |
|------|------|--------|---------------------|
| クロール済み - インデックス未登録 | **63** | Google システム | Phase 2.5（P2.5-2〜3: noindex 調査・description 重複）+ P3-1 再計測 |
| ソフト 404 | **3** | ウェブサイト | Phase 2.5（P2.5-7）+ **P0-3** で代表 URL 特定 |
| 見つかりませんでした（404） | **1** | ウェブサイト | **P0-3** で URL 特定・修正 |
| ページにリダイレクトがあります | **1** | ウェブサイト | 意図的リダイレクトなら問題なし。要確認 |
| サーバーエラー（5xx） | 0 | — | — |
| 重複（正規未選択） | 0 | — | Phase 2 P2-3 で予防 |

**所見**

- 未登録 68 件の **93%（63/68）** が「クロール済み・未登録」。Google はページを認識しているが、品質・差別化不足でインデックスを見送っている状態。
- 2026-08-30: sitemap が GSC で **取得できませんでした** → 再送信後 **成功（1,084 URL）**。以降クロール・インデックス回復を P3-1 で追う。
- 修正デプロイ後、Search Console で各カテゴリの **修正の確認（Validate fix）** を実施する。

#### サイトマップ（2026-08-30）

| 項目 | 値 |
|------|-----|
| URL | `https://shokujii.jp/sitemap.xml` |
| GSC ステータス | **成功しました**（再送信後） |
| 検出ページ数 | **1,084** |
| 最終読み込み | 2026-08-30 |

#### URL 検査：代表イベントページ（2026-07-19・旧）

対象 URL: [https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf](https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf)  
GSC: [URL 検査](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Ashokujii.jp&id=TfW_8xocw-dGlvG5sD8NiQ&hl=ja)

**2 つの結果が矛盾している点に注意（2026-07-19 時点）**

| 検査種別 | 結果 | 日時 |
|----------|------|------|
| インデックス登録済み URL（過去クロール） | ✅ **登録済み**（配信可能） | 最終クロール 2026-07-10 |
| **ライブテスト**（公開 URL をテスト） | ❌ **登録不可 — ソフト 404** | 2026-07-19 17:58 |

→ Phase 2 デプロイ後、**2026-08-30 の新代表 URL** ではライブテスト合格（下記）。旧代表 URL は P2.5-7 で再検査する。

#### URL 検査：代表イベントページ（2026-08-30・新）

対象 URL: [https://shokujii.jp/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL](https://shokujii.jp/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL)

| 検査種別 | 結果 | 備考 |
|----------|------|------|
| 登録済み URL | ❌ **未登録**（Google 未認識） | 前回クロールなし。sitemap 成功後に回復見込み |
| **ライブテスト** | ✅ **登録可能** | インデックス許可・canonical・Event JSON-LD 有効 1 件 |
| サイトマップ | 未検出（当時） | sitemap 再送信 **成功後** に再確認 |

**P0-3 サンプル URL（記録済み）**

- イベント（旧・Soft 404 再現）: `https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf`
- イベント（新・ライブテスト合格）: `https://shokujii.jp/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL`
- 登録済み一覧の他例: `/c/hr_library/e/...`, `/c/foodculture/e/...`, `https://shokujii.jp/`, `https://about.shokujii.jp/`

### 関連ファイル

| パス | 役割 |
|------|------|
| `user/index.html` | 静的 OGP プレースホルダ + `SEO_HEAD` / `SEO_BODY` マーカー |
| `user/public/robots.txt` | クローラー指示・sitemap 参照 |
| `functions/default/src/ogpRequest.ts` | コミュニティ・イベントページの SEO 動的注入 |
| `functions/default/src/communityListSeoRequest.ts` | `/communitylist` の SEO 動的注入 |
| `functions/default/src/sitemapRequest.ts` | `sitemap.xml` 動的生成 |
| `functions/default/src/seo/` | title / meta / JSON-LD / プリレンダー HTML の純粋関数 |
| `functions/default/src/stores/seoSitemap.ts` | sitemap 用 Firestore クエリ |
| `firebase.json` | Hosting rewrite（`/c/**`・`/sitemap.xml` → Function） |
| `user/src/router/index.ts` | ルーティング・ログイン必須判定 |
| `common/src/schemas/PartnerShop.ts` | 店舗ジャンル（`GENRE_ARRAY`）等 |
| `common/src/schemas/Event.ts` | イベント（日時・場所・店舗名等） |
| `common/src/schemas/Community.ts` | コミュニティ（住所・説明・タグ等） |

---

## 調査で判明した課題

### 優先度: 高（技術 SEO）— 初回監査。Phase 1〜2 で大部分解消

| # | 課題 | 証拠・影響 | 状態 |
|---|------|-----------|------|
| H-1 | **robots.txt が存在しない** | クローラー指示・sitemap 参照不可 | ✅ Phase 1 |
| H-2 | **sitemap.xml が存在しない** | 公開 URL の発見困難 | ✅ Phase 2 + GSC 成功 |
| H-3 | **全ページの title が同一** | SERP に全ページ同タイトル | ✅ Phase 2（`/c/**`） |
| H-4 | **meta description が皆無** | スニペット機会損失 | ✅ Phase 2 + **P2.5-3**（`stripStaticMetaDescription`） |
| H-5 | **構造化データが無い** | リッチリザルト機会損失 | ✅ Phase 2 |

### 優先度: 高（2026-08-30 再監査・Phase 2.5 対象）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| R-1 | **GSC sitemap 取得失敗（歴史的）** | 「取得できませんでした」→ 再送信で **成功（1,084 URL）**。**2026-08-30 解消** |
| R-2 | **レンダリング後 noindex の疑い** | sandbox P2-4-V で JS レンダリング後 `meta robots noindex` 検出。**P2.5-2 実装済み**（公開 `/c/**/e/**` から `getLoadedEvent` ガード除去）。GSC 再確認は P2.5-7 |
| R-3 | **`<meta name="description">` が 2 本** | **P2.5-3 実装済み**（`injectSeoHtml` で静的 description を 1 件除去） |
| R-4 | **プリレンダー HTML に内部リンクなし** | **P2.5-4 実装済み**（`prerenderBody.ts` に nav + `<a href>`） |
| R-5 | **`/communitylist` が未最適化** | **P2.5-5 実装済み**（`handleCommunityListSeoRequest` + rewrite） |
| R-6 | **終了イベントが sitemap に大量掲載** | **P2.5-8 保留**（全イベント sitemap 維持。P4-2 で再検討） |

### 優先度: 中（技術 SEO）

| # | 課題 | 証拠・影響 | 状態 |
|---|------|-----------|------|
| M-1 | **ソフト 404** | 2026-07-19 代表 URL で再現 | ⚠️ 新代表 URL はライブテスト合格。旧 URL 再検査（P2.5-7） |
| M-2 | **canonical タグが無い** | GSC 実測済み | ✅ Phase 2 |
| M-3 | **完全 CSR（SPA）** | AI クローラーに不利 | ⚠️ P3-4 で部分改善。完全 SSR ではない |
| M-4 | **管理画面の noindex 未設定** | 検索結果に出うる | ✅ Phase 1 |
| M-5 | **ogpRequest が title を更新しない** | Soft 404 原因の一つ | ✅ Phase 2 |

### 優先度: 低（技術 SEO）

| # | 課題 | 証拠・影響 | 状態 |
|---|------|-----------|------|
| L-1 | `twitter:site` に URL が入っている | 本来は @ユーザー名 | ✅ Phase 1 |
| L-2 | トップページの `og:type` が `article` | トップは `website` が適切 | ✅ Phase 1 |
| L-3 | 公開ページに `<h1>` が無い | イベント名・コミュニティ名を h1 に | ✅ P3-3 |
| ~~L-4~~ | ~~Search Console 未登録~~ | **2026-07-19 登録済み** | ✅ |

### 優先度: 高（Search Console 実測・2026-07-10）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| GSC-1 | **クロール済み・未登録が 63 件** | 最大のボトルネック。**P3-1 再計測で改善率を KPI 化** |
| GSC-2 | **未登録合計 68 件（登録率 59%）** | 100 登録 / 168 既知 URL |
| GSC-3 | **登録済みが 125→100 に急減（6/27 頃）** | ライブテスト Soft 404 と整合 |
| GSC-4 | **イベント URL のライブテストが Soft 404** | 2026-07-19 旧代表 URL。**2026-08-30 新代表 URL は合格** |

### 優先度: 中（programmatic SEO・Phase 4 向け）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| P-1 | **住所がフリーテキスト** | 都道府県・市区の階層ページを機械生成できない |
| P-2 | **店舗の一般公開 URL が無い** | 店舗名指名検索を拾えない |
| P-3 | **ハブページが未整備** | `/communitylist` のみ |
| P-4 | **終了イベントの扱い未定義** | sitemap 品質低下。**P2.5-8 保留**（P4-2 で再検討） |
| P-5 | **subdomain_tags の URL 方針** | サブフォルダ推奨 |
| P-6 | **量産ページのレンダリング基盤が無い** | Phase 4 で対応 |

---

## 対策タスクリスト

**Phase 0 → 1 → 2（実装済）→ 2.5（現在）→ 3 → 3B → 4** の順で着手する。

### Phase 0: 準備

| 工数 | タスク |
|------|--------|
| — | ✅ SEO 監査の実施（本ドキュメント） |
| — | ✅ GitHub Issue 作成（#2195） |
| — | ✅ エージェントスキル導入（初回: `seo-audit` / `programmatic-seo`） |
| — | ✅ **P0-5** 追加スキル導入（`schema` / `ai-seo` / `content-strategy`） |
| [S] | ✅ **P0-1** Google Search Console に shokujii.jp を登録<br>プロパティ: `sc-domain:shokujii.jp` |
| [S] | ✅ **P0-2** Search Console で現状のインデックス数・カバレッジを確認（ベースライン取得）<br>2026-07-10: 登録済み 100 / 未登録 68。内訳は上記「ページのインデックス登録」参照 |
| [S] | [ ] **P0-3** 未登録 URL の代表サンプルを特定<br>旧（Soft 404）: `https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf` **記録済み**<br>新（ライブテスト合格）: `https://shokujii.jp/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL` **記録済み**<br>未登録 63 件・ソフト 404 3 件の URL エクスポートは残 |

### Phase 1: インデックスの土台

クローラーへの基本指示と管理画面の除外。**完了済み。**

| 工数 | タスク |
|------|--------|
| [S] | ✅ **P1-1** `user/public/robots.txt` を追加 |
| [S] | ✅ **P1-2** partner / enterprise / manager に noindex を設定 |
| [S] | ✅ **P1-3** `user/index.html` の静的メタ修正 |
| [S] | [ ] **P1-4** Search Console 登録手順を本ドキュメントに追記 |

**Phase 1 完了条件** — ✅ 達成済み

### Phase 2: ページ別メタの動的化 — **実装完了・本番デプロイ済（2026-08 確認）**

| 工数 | タスク |
|------|--------|
| [M] | ✅ **P2-1** `ogpRequest.ts` で `<title>` を動的注入<br>コミュニティ: `{community_name} \| shokujii` / イベント: `{event_name} \| shokujii` |
| [S] | ✅ **P2-2** `ogpRequest.ts` で `<meta name="description">` を動的注入<br>`og:description` と同値で可 |
| [S] | ✅ **P2-3** `ogpRequest.ts` で `<link rel="canonical">` を注入<br>正規形: 小文字 `/c/{account}` / `/c/{account}/e/{eventId}` |
| [M] | ✅ **P2-4** JSON-LD 構造化データを注入<br>イベント: schema.org `Event` / コミュニティ: `Organization` |
| [S] | ✅ **P2-5** データ不在時の HTTP ステータス改善<br>不在・削除済み・エンプラ配下（`enterprise_id != null`）・パス不正: **404**<br>限定公開イベント / 非公開・未承認コミュニティ: **200 + `X-Robots-Tag: noindex, nofollow`** |
| [S] | ✅ **P2-6** 旧パス `/community/**` から `/c/**` への 301 — **P2.5-6 で実装** |
| [M] | ✅ **P2-7** `sitemap.xml` の動的生成<br>対象: `is_public == true` のコミュニティ・イベント |
| [S] | ✅ **P2-8** クライアント側 `document.title` 更新 |
| [S] | ✅ **P2-9** 404 ページ（`[[...error]].vue`）に noindex を設定 |
| [S] | ✅ **P2-4-V** 構造化データ検証（`/schema`）— sandbox + 本番 curl / Rich Results / Schema.org Validator（2026-08-24） |

**P2-4-V 検証記録（2026-07-19・sandbox）** — 変更なし。詳細は git 履歴参照。

**P2-4-V 本番クローズ（残タスク → P2.5-7 に統合）**

- ✅ Search Console に sitemap 送信 — **2026-08-30 成功（1,084 URL）**
- ✅ 本番代表 URL ライブテスト — `/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL` 合格（Event 有効 1 件）
- [ ] Schema.org Validator（本番）
- [ ] 旧代表 URL Soft 404 再検査 — `/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf`

**Phase 2 完了条件** — ✅ 実装・本番デプロイ済。本番検証の残りは **Phase 2.5** で完走。

---

### Phase 2.5: インデックス回復（クリティカル）— **実装完了・本番検証待ち**

Phase 2 デプロイ・sitemap 成功後、**検索に出ない直接原因**を潰す。GEO / pSEO の前提。

| 優先 | 工数 | タスク |
|:----:|------|--------|
| 🔴 | [S] | ✅ **P2.5-1** GSC sitemap 再送信・成功確認<br>2026-08-30: `https://shokujii.jp/sitemap.xml` **成功・1,084 URL 検出** |
| 🔴 | [S] | ✅ **P2.5-2** レンダリング後 `noindex` の修正<br>`user/src/router/index.ts`: 公開 `/c/**/e/**` から `getLoadedEvent` ガード除去。**`/manage/event/**` のみ**維持 |
| 🔴 | [S] | ✅ **P2.5-3** 静的 `<meta name="description">` / `<link rel="canonical">` の重複除去<br>`htmlInjection.ts` の `stripStaticMetaDescription()` / `stripStaticCanonicalLink()` を `injectSeoHtml` で適用。トップは静的維持 |
| 🟠 | [S] | ✅ **P2.5-4** プリレンダー HTML に内部リンク追加<br>`prerenderBody.ts`: イベント → トップ・コミュニティ、コミュニティ → トップ・一覧 |
| 🟠 | [M] | ✅ **P2.5-5** `/communitylist` の SEO 注入<br>`handleCommunityListSeoRequest` + `getPublicCommunitiesForSeoPreview(30)` + firebase rewrite |
| 🟡 | [S] | ✅ **P2.5-6** 旧パス `/community/**` → `/c/**` 301（`firebase.json` redirects 4 ルール） |
| 🟡 | [S] | [ ] **P2.5-7** P2-4-V 本番クローズ（**デプロイ後**）<br>curl / GSC レンダリング済み HTML・Schema.org Validator・旧代表 URL Soft 404 再検査 |
| 🟠 | [M] | ⏸ **P2.5-8** 終了イベントの sitemap 方針 — **保留**（全イベント sitemap 維持。**P4-2 で再検討**） |

**Phase 2.5 完了条件**

- ✅ GSC sitemap ステータス「成功」
- ✅ P2.5-2〜6 コード実装（Issue #2335）
- [ ] 代表 URL 3 件でレンダリング済み HTML に `noindex` なし（**P2.5-7・デプロイ後**）
- [ ] イベント URL の `<meta name="description">` が 1 本のみ（固有文言）（**P2.5-7**）
- [ ] プリレンダー HTML に `<a href>` が含まれる（**P2.5-7**）
- [ ] P2-4-V 本番チェックリスト完走（**P2.5-7**）

**Phase 2.5 合計工数目安**: S × 5 + M × 2（約 1 週間）

**P2-4-V 本番検証記録（2026-08-24）**

| 対象 | URL | 方法 | 結果 |
|------|-----|------|------|
| robots.txt | `https://shokujii.jp/robots.txt` | curl | ✅ `text/plain`、Sitemap 行あり |
| sitemap.xml | `https://shokujii.jp/sitemap.xml` | curl | ✅ XML 200（2026-08-30 GSC: **1,084 URL**） |
| イベント | `/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf` | curl | ✅ 固有 title / description / canonical、`#app` 内 h1 + 概要 HTML |
| イベント JSON-LD | 同上 | curl | ✅ Event + BreadcrumbList `@graph`、`PostalAddress`、`OfflineEventAttendanceMode`、`organizer.url` |
| トップ | `https://shokujii.jp/` | curl | ✅ WebSite + Organization JSON-LD |
| 404 | `/c/flc_fes/e/nonexistent-event-id-12345` | curl | ✅ HTTP 404 |
| noindex | partner / enterprise | curl -I | ✅ `X-Robots-Tag: noindex` |
| Rich Results Test | `/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL` | [結果](https://search.google.com/test/rich-results/result?id=a6DnOb5qkYXyGehWxq2O-g) | ✅ **Event 有効 1 件** + Breadcrumbs 有効 1 件（2026-08-24） |
| Schema.org Validator | `/c/33_lab_future/e/w4Iwl5D1zKS81CX0dQqL` | [validator.schema.org](https://validator.schema.org/#url=https%3A%2F%2Fshokujii.jp%2Fc%2F33_lab_future%2Fe%2Fw4Iwl5D1zKS81CX0dQqL) | ✅ **エラー 0・警告 0**（2026-08-24） |
| GSC ライブテスト | 代表イベント | Search Console | 2026-08-24: JS 後 noindex 検出。**P2.5-2 実装後に P2.5-7 で再検証** |

---

### Phase 3: 計測・品質改善

Phase 2.5 完了後、Search Console のデータを見て判断する。**GEO（旧 P3-5）は Phase 3B へ分離。**

| 工数 | タスク |
|------|--------|
| [S] | [ ] **P3-1** GSC 再ベースライン（**sitemap 成功後**）<br>計測タイミング: 2026-08-30 から **7 日後・14 日後** の 2 回<br>KPI: 登録済み URL 数、未登録 68 → 目標 50% 削減、クロール済み・未登録 63 の推移 |
| [S] | ✅ **P3-2** Core Web Vitals を PageSpeed Insights で計測（LCP / INP / CLS）<br>2026-08-24 計測完了（下記記録）。CWV 不合格。改善は #2302 に分離 |
| [S] | ✅ **P3-3** 公開ページの `<h1>` 整備 |
| [M] | ✅ **P3-4** プリレンダリング強化（`SEO_BODY` 注入） |
| [S] | [ ] **P3-6** Phase 4 着手判断<br>**ゲート**: P3-1 で登録済み増加 **または** 代表 URL 10 件中 7 件以上が GSC「登録済み」 |

#### P3-2 Core Web Vitals 計測記録（2026-08-24）

**⚠️ 計測値はオリジン集計値であり、URL 固有の値ではない**

PSI で公開イベント詳細を計測したが、個別 URL の CrUX データが存在せず、オリジン全体の集計値にフォールバックしていた。

> There is insufficient real-user data for this URL. Falling back to aggregate data for all user experiences on this origin (`https://shokujii.jp`) instead.

| 項目 | 値 |
| ---- | -- |
| スコープ | `https://shokujii.jp` オリジン集計 |
| 収集期間 | 2026-07-25 〜 2026-08-21（28 日ローリング） |
| CWV 総合 | **不合格** |

| 指標 | p75 | 判定 |
| ---- | --- | ---- |
| LCP | 2.9s | 要改善 |
| CLS | **0.38** | **Poor** |
| TTFB | 0.3s | 良好 |

**派生 Issue**: [#2302](https://github.com/nijuniinc/bokudeli-event-new/issues/2302)（CWV 改善）、[#2303](https://github.com/nijuniinc/bokudeli-event-new/issues/2303)（Storage cacheControl）

#### 構造化データ拡張（`/schema`）— **完了済み**

| 工数 | タスク |
|------|--------|
| [S] | ✅ **P3-S1** トップページに `WebSite` + `Organization` JSON-LD |
| [S] | ✅ **P3-S2** コミュニティ・イベントに `BreadcrumbList` JSON-LD |
| [S] | ✅ **P3-S3** Event JSON-LD の enrich |

**Phase 3 合計工数目安**: S × 3 + M × 1（P3-S1〜3 は完了）

---

### Phase 3B: AI 検索（GEO）— `/ai-seo`

**着手条件（いずれか）**

- P3-1（14 日後）で登録済み URL が 2026-07-10 比 +20% 以上
- または代表イベント URL 10 件中 7 件以上が GSC「登録済み」

| 工数 | タスク |
|------|--------|
| [S] | [ ] **P3B-1**（旧 P3-5-1）AI Visibility Audit<br>10〜20 クエリ × Google AI Overview / ChatGPT / Perplexity |
| [S] | [ ] **P3B-2**（旧 P3-5-2）プリレンダー HTML の extractability 評価・改善案 |
| [S] | [ ] **P3B-3**（旧 P3-5-3）AI クローラー robots 方針の文書化 |
| [S] | [ ] **P3B-4**（旧 P3-5-4）`llms.txt` 導入要否の判断 |

**Phase 3B 合計工数目安**: S × 4（約 1 週間）

---

### Phase 4: programmatic SEO（量産ページ）

**着手条件**: P3-6 合格 + **Phase 2.5 完了** + P3-1（14 日後）でインデックス改善トレンド確認

**前倒し済み**: P4-2 の sitemap 方針 → **P2.5-8 で検討したが保留**（全イベント維持）。アーカイブ UI / 集約ページ設計は Phase 4 で継続。

#### 4-0. 前提データ・方針（着手前）

**コンテンツ戦略正本**: [02_SEO対策_コンテンツ戦略.md](./02_SEO対策_コンテンツ戦略.md)（P4-0-1 / P4-0-2 のたたき台・2026-07-19）

**関連スキル**: `/content-strategy`（P4-0-1〜2、ピラー・Hub/Spoke）+ `/programmatic-seo`（P4-0-4、プレイブック）

| 工数 | タスク |
|------|--------|
| [S] | [ ] **P4-0-1** キーワード需要検証（`/content-strategy`） |
| [S] | [ ] **P4-0-2** キーワードマッピング表の作成（`/content-strategy`） |
| [S] | [ ] **P4-0-3** 薄いコンテンツ対策の設計 |
| [S] | [ ] **P4-0-4** 適用プレイブックの選定（`/programmatic-seo`、下表参照） |

**適用可能なプレイブック**

| プレイブック | 検索パターン例 | 実現性 | 優先度 |
|--------------|---------------|--------|--------|
| **Locations** | 「{エリア} 食事会」「{駅名} ランチ会」 | ◎ 住所データあり | 高 |
| **Locations × ジャンル** | 「神田 カレー イベント」 | ◎ `GENRE_ARRAY` × 住所 | 高 |
| **Directory** | 「食事会ができる店 {エリア}」 | △ 店舗公開ページ要 | 中 |
| **Personas** | 「会社 ランチ会 幹事」 | ○ LP 数枚 | 低 |
| **Glossary / ガイド** | 「食事会 幹事 やり方」 | ○ コンテンツ制作 | 低 |

**pSEO に使える保有データ**

| データ | ソース | 独自性 |
|--------|--------|--------|
| 料理ジャンル（60 種以上） | `PartnerShop.GENRE_ARRAY` | 中（公開データ） |
| 住所・緯度経度 | Event / Community / PartnerShop | 中（要構造化） |
| 開催実績・参加人数 | Event | **高（プロダクト由来）** |
| コミュニティ活動 | Community / AlbumItem | **高（UGC）** |
| 店舗情報 | PartnerShop | 中（公開ページ未整備） |

#### 4-1. データ基盤整備

| 工数 | タスク |
|------|--------|
| [L] | [ ] **P4-1** エリア情報の構造化 |
| [M] | [ ] **P4-2** 終了イベントのアーカイブ戦略<br>sitemap 除外方針は **P2.5-8 保留分**を本 Phase で再検討。UI / 集約ページ設計は本 Phase で継続 |
| [S] | [ ] **P4-3** `subdomain_tags` の URL 方針決定 |

#### 4-2. ページ・リンク構造

| 工数 | タスク |
|------|--------|
| [M] | [ ] **P4-4** ハブページ（一覧の細分化）の新設 |
| [L] | [ ] **P4-5** 店舗公開ページの新設（**別 Issue 推奨**） |
| [L] | [ ] **P4-6** 量産ページのレンダリング基盤 |
| [M] | [ ] **P4-7** sitemap のページタイプ別分割 |

#### 4-3. 小規模検証 → 拡大

| 工数 | タスク |
|------|--------|
| [M] | [ ] **P4-8** パイロット: 上位 10〜20 エリアのみ Locations ページ化 |
| [M] | [ ] **P4-9** 成果に応じてジャンル掛け合わせ・店舗ディレクトリへ展開 |

**Phase 4 完了条件（パイロット段階）**

- 選定エリアの Locations ページがインデックスされている
- Search Console でタイプ別 sitemap のカバレッジを確認できる
- 掲載 0 件の薄いページがインデックスされていない

**Phase 4 合計工数目安**: S × 4 + M × 4 + L × 3（パイロットまで約 1〜2 ヶ月。全面展開は別途）

---

## 実装方針メモ

### ogpRequest.ts 拡張が本命である理由（Phase 2）

- `/c/**` へのリクエストは既に Cloud Function 経由
- Firestore からイベント・コミュニティデータを取得済み
- `ReplaceSectionStream` で HTML 断片を差し替える仕組みがある
- SSR 移行なしに、クローラーが読む初期 HTML にメタを載せられる

### 注入対象の候補

| 要素 | 注入先 | 備考 |
|------|--------|------|
| `<title>` | `<head>` 内 | 実装済み |
| `<meta name="description">` | `<head>` 内 | 実装済み。**P2.5-3** で静的重複除去 |
| `<link rel="canonical">` | `<head>` 内 | 実装済み |
| JSON-LD | `<head>` 内 | Event / Organization — 実装済み |
| プリレンダー本文 | `SEO_BODY` | 実装済み。**P2.5-4** で内部リンク追加 |
| `/communitylist` SEO | Function rewrite | **P2.5-5** `handleCommunityListSeoRequest` |
| OGP タグ | `<!-- OGP_BEGIN_TAG -->` 〜 | 既存実装 |

### programmatic SEO の進め方（Phase 4）

1. **Phase 2.5 完了** → P3-1 で GSC 改善確認 → **P3-6** で着手判断
2. **P4-0**（`/content-strategy` + `/programmatic-seo`）
3. P4-1（住所構造化）+ P4-6（レンダリング基盤）
4. P4-8（パイロット 10〜20 エリア）で効果測定
5. 成果が出たら P4-9 で拡大

### 構造化データ拡張の候補（`/schema`）

現行 `functions/default/src/seo/jsonLd.ts` は Event / Organization / BreadcrumbList / トップ WebSite+Organization を実装済み。

| 項目 | 現状 | 備考 |
|------|------|------|
| Event `organizer.url` | **実装済み** | 本番ライブテスト合格 |
| Event `location.address` | **PostalAddress 実装済み** | — |
| Event `eventAttendanceMode` | **Offline 固定** | — |
| トップページ | **WebSite + Organization 実装済み** | — |
| パンくず | **BreadcrumbList 実装済み** | — |
| 店舗ページ | 未実装 | `LocalBusiness`（P4-5） |

### AI 検索（GEO）の注意（`/ai-seo`）

- Google 向け: **AI 専用コンテンツの量産は避ける**（scaled content abuse リスク）
- ChatGPT / Perplexity 向け: P3-4 プリレンダー + extractable ブロックが有効
- **Phase 3B はインデックス改善後に着手**（効果測定可能な状態で実施）

### ログイン必須パス（robots.txt Disallow 候補）

`user/src/router/index.ts` の `isLoginRequired` より:

- `/profile`, `/register/complete`, `/register/email`
- `/manage/**`
- `/chat/**`
- `/c/{account}/invites`

### 公開ページ（インデックス対象）

- `/`（トップ）
- `/c/{communityAccount}`（公開コミュニティ）
- `/c/{communityAccount}/e/{eventId}`（公開イベント）
- `/communitylist`（コミュニティ一覧 — **P2.5-5 SEO 注入済み**）
- `/u/{userId}`（ユーザープロフィール ※公開設定次第）

---

## 検証チェックリスト

### Phase 2.5（インデックス回復）

- ✅ GSC sitemap 成功（1,084 URL・2026-08-30）
- ✅ P2.5-2〜6 実装（router noindex 修正・description 除去・内部リンク・communitylist SEO・301）
- ⏸ P2.5-8 保留（全イベント sitemap 維持。P4-2 で再検討）
- [ ] **デプロイ後（P2.5-7）** レンダリング済み HTML に `noindex` なし（代表 URL 3 件）
- [ ] **デプロイ後** イベント / コミュニティ URL の `description` タグが 1 本（固有文言）
- [ ] **デプロイ後** プリレンダー HTML に内部リンク（`<a href>`）
- [ ] **デプロイ後** `/communitylist` に固有 title / description
- [ ] **デプロイ後** `curl -I /community/foo` → `Location: /c/foo`（301）

### Phase 1〜2（技術 SEO）

- ✅ `curl -s https://shokujii.jp/robots.txt` が robots 形式のテキストを返す（2026-08-24 本番確認）
- ✅ `curl -s https://shokujii.jp/sitemap.xml` が XML を返す（2026-08-30 GSC: **1,084 URL**）
- ✅ 公開イベント URL の HTML に固有 title / description / canonical（2026-08-24 本番確認）
- ✅ 公開イベント URL の `#app` 内に `<h1>` と概要 HTML（2026-08-24 本番確認）
- ✅ Vue 描画後も公開イベント / コミュニティページに `<h1>` が 1 件
- ✅ トップページ HTML に WebSite + Organization JSON-LD（2026-08-24 本番確認）
- ✅ Rich Results Test（本番）で Event スキーマが有効 1 件（2026-08-24）
- ✅ Schema.org Validator で JSON-LD エラー 0（2026-08-24）
- [ ] GSC レンダリング済み HTML に noindex なし（**P2.5-2 デプロイ後・P2.5-7**）
- [ ] 旧代表 URL GSC ライブテストで Soft 404 解消確認（P2.5-7）
- ✅ 存在しないイベント URL が 404 を返す（2026-08-24 本番確認）
- [ ] 限定公開イベント URL が 200 + `X-Robots-Tag: noindex`（P2-5・未確認）
- ✅ partner / enterprise に `X-Robots-Tag: noindex`（2026-08-24 本番確認）
- ✅ Search Console に sitemap 送信成功（2026-08-30）

### Phase 3B（GEO・`/ai-seo`）— Phase 3B 着手後

- [ ] P3B-1: 主要クエリ 10 件以上で AI 回答に shokujii が引用されているか記録
- [ ] P3B-2: デプロイ後 HTML にイベント名・日時・場所が extractable 形式で含まれる
- [ ] P3B-3: AI クローラー robots 方針を本ドキュメントに記載済み

### Phase 4（programmatic SEO・パイロット後）

- [ ] P4-0-1 / P4-0-2: キーワードマッピング表が documents/ 内に存在する
- [ ] Locations ページが Rich Results / 通常検索でインデックスされている
- [ ] 掲載 0 件のエリアページが noindex または未生成である
- [ ] ハブページからスポークページへ内部リンクが張られている
- [ ] タイプ別 sitemap でインデックス率を追跡できる

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-07-19 | 初版。SEO 監査結果と Phase 1〜3 タスクリストを作成 |
| 2026-07-19 | programmatic SEO 調査結果を Phase 4 として追加。全タスクに S/M/L 工数見積もりを付与 |
| 2026-07-19 | Search Console 登録完了（P0-1）。サマリーベースラインと推奨事項を追記 |
| 2026-07-19 | インデックス登録レポート取得（P0-2）。登録 100 / 未登録 68、GSC-1〜2 と P0-3 を追加 |
| 2026-07-19 | イベント URL の URL 検査・ライブテスト結果を追記（Soft 404、GSC-3〜4）。P3-4 優先度引き上げ |
| 2026-07-19 | Phase 2 実装（P2-1〜5, P2-7, P3-4, P1-1）。`seo/` モジュール・`handleSitemapRequest`・robots.txt |
| 2026-07-19 | 追加スキル導入（P0-5: schema / ai-seo / content-strategy）。スキル対応表・P2-4-V・P3-S1〜3・P3-5-1〜4・実装進捗サマリを追記 |
| 2026-07-19 | P2-4-V sandbox 検証記録。Event JSON-LD に `organizer.url` を追加 |
| 2026-07-19 | P3-S1〜3 / P3-3 実装（WebSite / BreadcrumbList / Event enrich / Vue h1） |
| 2026-08-30 | 本番再監査。GSC sitemap 再送信成功（1,084 URL）。代表イベント URL ライブテスト合格。**Phase 2.5 新設**、GEO を **Phase 3B** に分離、P4-2 前倒し（P2.5-8）。進捗表記を ✅ / `[ ]` に統一 |
| 2026-08-30 | **Phase 2.5 実装（#2335）**: P2.5-2（公開イベント router ガード除去）・P2.5-3（description 重複除去）・P2.5-4（プリレンダー内部リンク）・P2.5-5（`/communitylist` SEO）・P2.5-6（`/community/**` 301）。P2.5-8 は保留（全イベント sitemap 維持）。P2.5-7 本番検証はデプロイ後 |
