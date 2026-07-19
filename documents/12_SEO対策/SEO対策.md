# SEO 対策

Shokujii（shokujii.jp）の検索エンジン最適化に関する調査結果と対策タスク。

- **関連 Issue**: [#2195 SEO 対策（robots / sitemap / 動的メタ / 構造化データ）](https://github.com/nijuniinc/bokudeli-event-new/issues/2195)
- **対象アプリ**: 主に `user`（一般ユーザー向け・shokujii.jp）
- **対象外**: `partner` / `enterprise` / `manager`（管理画面。検索流入は不要。noindex のみ実施）
- **関連スキル**: `/seo-audit`（監査）、`/programmatic-seo`（Phase 4 の量産ページ設計）

---

## 工数見積もり（S / M / L）

| 記号 | 目安 | 例 |
|------|------|-----|
| **S** | 半日〜1日 | 設定ファイル追加、静的メタ修正、調査・ドキュメント |
| **M** | 2〜5日 | Function 拡張、新規ページ 1 種、sitemap 生成 |
| **L** | 1週間以上 | スキーマ変更 + backfill、新規公開ページ群、レンダリング基盤 |

タスク見出しの `[S]` / `[M]` / `[L]` は上記の目安。実装・レビュー・デプロイ・検証を含む。

---

## 調査サマリ

2026-07-19 に `/seo-audit` および `/programmatic-seo` スキルに基づきコードベースと本番 URL を調査した。

| 観点 | 評価 | 概要 |
|------|------|------|
| クローラビリティ | 要改善 | robots.txt / sitemap.xml が無い。存在しない URL も 200 を返す |
| インデックス | 要改善 | 登録済み 100 / 未登録 68。未登録の大半は「クロール済み・未登録」（63）。title / description 同一が疑われる |
| 技術基盤 | 部分的 | OGP 動的注入は実装済み。検索向けメタは未対応 |
| 構造化データ | 未着手 | JSON-LD（Event / Organization）が無い |
| レンダリング | SPA 制約 | Vue 3 CSR。Google は JS レンダリングするが遅延・AI クローラーには不利 |
| 管理画面 | 要改善 | partner / enterprise に noindex 無し |
| programmatic SEO | 未着手 | 量産ページ用データ・ハブ・レンダリング基盤が未整備 |

**結論**: SNS シェア（OGP）対応は整っているが、**検索エンジン向け SEO はほぼ未着手**。Phase 1〜2 で既存ページのインデックス基盤を整え、Phase 4 で検索需要に合わせた量産ページを段階的に検討する。

---

## 現状（できていること）

- [x] `user/index.html` に OGP / Twitter Card の静的メタタグ
- [x] `lang="ja"` 設定
- [x] Firebase Hosting + HTTPS
- [x] レスポンシブ UI（Vuetify）
- [x] `functions/default/src/ogpRequest.ts` による `/c/**`・`/c/**/e/**` の OGP 動的注入
- [x] `firebase.json` で OGP 対象パスを Cloud Function にルーティング
- [x] SEO 監査・programmatic SEO 用エージェントスキルの導入（#2195）
- [x] Google Search Console に `shokujii.jp`（ドメインプロパティ）を登録

### Search Console（ベースライン）

- **プロパティ**: [sc-domain:shokujii.jp](https://search.google.com/search-console?hl=ja&resource_id=sc-domain:shokujii.jp)
- **登録日**: 2026-07-19（実施済み）

#### サマリー（2026-04-18 〜 2026-07-11）

- ウェブ検索の合計クリック数: **645 回**（約 3 ヶ月）
- 日次クリックはおおむね 3〜16 回で変動（大きな上昇トレンドは見られない）
- 推奨事項: 「最近、ページのインプレッション数が通常より減っています」— Phase 1〜2 実施後に再確認

#### ページのインデックス登録（2026-07-10 時点）

レポート: [インデックス作成 > ページ](https://search.google.com/search-console/index?resource_id=sc-domain%3Ashokujii.jp&hl=ja)

| 区分 | 件数 | 備考 |
|------|------|------|
| **登録済み** | **100** | 4/20〜6/27 は約 **125** 件で横ばい → **6/27 頃に 100 へ急減**（-25 件） |
| **未登録** | **68** | 下表の理由別 |

**未登録の内訳**

| 理由 | 件数 | ソース | 対応 Phase / タスク |
|------|------|--------|---------------------|
| クロール済み - インデックス未登録 | **63** | Google システム | Phase 2（P2-1〜4: title / description / canonical / JSON-LD）。SPA + 同一メタが主因と推定 |
| ソフト 404 | **3** | ウェブサイト | Phase 2（P2-5, P2-9）+ **P0-3** で代表 URL 特定 |
| 見つかりませんでした（404） | **1** | ウェブサイト | **P0-3** で URL 特定・修正 |
| ページにリダイレクトがあります | **1** | ウェブサイト | 意図的リダイレクトなら問題なし。要確認 |
| サーバーエラー（5xx） | 0 | — | — |
| 重複（正規未選択） | 0 | — | Phase 2 P2-3 で予防 |

**所見**

- 未登録 68 件の **93%（63/68）** が「クロール済み・未登録」。Google はページを認識しているが、品質・差別化不足でインデックスを見送っている状態。
- コード監査で判明した **全ページ同一 title / description 欠如** と整合。Phase 2 のメタ動的化が最優先の対策になる。
- ソフト 404（3 件）は SPA の `** → index.html` フォールバック（課題 M-1）と一致。P2-5 の 404 化で改善見込み。
- 修正デプロイ後、Search Console で各カテゴリの **修正の確認（Validate fix）** を実施する。

#### URL 検査：代表イベントページ（2026-07-19）

対象 URL: [https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf](https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf)  
GSC: [URL 検査](https://search.google.com/search-console/inspect?resource_id=sc-domain%3Ashokujii.jp&id=TfW_8xocw-dGlvG5sD8NiQ&hl=ja)

**2 つの結果が矛盾している点に注意**

| 検査種別 | 結果 | 日時 |
|----------|------|------|
| インデックス登録済み URL（過去クロール） | ✅ **登録済み**（配信可能） | 最終クロール 2026-07-10 |
| **ライブテスト**（公開 URL をテスト） | ❌ **登録不可 — ソフト 404** | 2026-07-19 17:58 |

→ 過去にはインデックスされていたが、**現時点の HTML では Google が「実質 404」と判定**している。登録済み 100 件 → 6/27 の 125→100 急減とも整合。**他のイベントページも同様の可能性が高い**。

**ライブテストで判明した問題**

| 項目 | 状態 | 対応タスク |
|------|------|-----------|
| ページの可用性 | **ソフト 404** | P2-1〜4, P3-4（メタ + 本文のサーバー注入） |
| ユーザー指定 canonical | **なし** | P2-3 |
| `<title>` | トップと同一「食事でつながる「shokujii」」 | P2-1（ogpRequest は OGP のみ差し替え、title は未変更） |
| `<meta name="description">` | なし | P2-2 |
| 初期 HTML の `#app` 内 | ローディングスピナーのみ（イベント本文なし） | P3-4（プリレンダリング検討） |
| サイトマップ | **一時的な処理エラー** | P2-7（sitemap 未配置が原因） |
| 参照元ページ | 検出されませんでした | P2-7 + 内部リンク強化 |
| HTTPS | ✅ 問題なし | — |
| クロール / インデックス許可 | ✅ 問題なし（noindex なし） | — |

**ソフト 404 の技術的原因（推定）**

1. すべてのイベント URL が **同一 `<title>`** と **空に近い初期 HTML** を返す（`user/index.html` + ローダーのみ）
2. `ogpRequest.ts` は **OGP タグだけ**差し替え、`title` / `description` / 本文は触らない
3. Google のライブテストは「URL ごとに固有のコンテンツがあるか」を見る → トップページのコピーと判別 → **ソフト 404**

**P0-3 サンプル URL（記録済み）**

- イベント（登録済みだがライブテスト Soft 404）: `https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf`
- 登録済み一覧の他例: `/c/hr_library/e/...`, `/c/foodculture/e/...`, `https://shokujii.jp/`, `https://about.shokujii.jp/`

### 関連ファイル

| パス | 役割 |
|------|------|
| `user/index.html` | 静的 OGP プレースホルダ + `SEO_HEAD` / `SEO_BODY` マーカー |
| `user/public/robots.txt` | クローラー指示・sitemap 参照 |
| `functions/default/src/ogpRequest.ts` | コミュニティ・イベントページの SEO 動的注入 |
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

### 優先度: 高（技術 SEO）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| H-1 | **robots.txt が存在しない** | `https://shokujii.jp/robots.txt` が index.html を 200 で返す。クローラーへの指示・sitemap 参照ができない |
| H-2 | **sitemap.xml が存在しない** | 公開コミュニティ・イベントが外部リンクなしでは発見されにくい |
| H-3 | **全ページの title が同一** | `user/index.html` 固定。`document.title` 更新も未実装。SERP に全ページ同タイトル |
| H-4 | **meta description が皆無** | `og:description` のみ。Google スニペット用の description タグが無い |
| H-5 | **構造化データが無い** | JSON-LD 未使用。イベントリッチリザルト（日時・場所）の機会損失 |

### 優先度: 中（技術 SEO）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| M-1 | **ソフト 404** | SPA + 同一 title。**GSC 集計 3 件 + イベント URL ライブテストでも再現**（2026-07-19） |
| M-2 | **canonical タグが無い** | URL 検査で「ユーザー指定 canonical: なし」を確認。**GSC 実測済み** |
| M-3 | **完全 CSR（SPA）** | JS 非実行クローラー・AI 検索系にコンテンツが見えない |
| M-4 | **管理画面の noindex 未設定** | partner / enterprise のログイン画面が検索結果に出うる |
| M-5 | **ogpRequest が title を更新しない** | OGP のみ差し替え。**ライブテスト Soft 404 の直接原因の一つ** |

### 優先度: 低（技術 SEO）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| L-1 | `twitter:site` に URL が入っている | 本来は @ユーザー名。アカウント無ければ削除 |
| L-2 | トップページの `og:type` が `article` | トップは `website` が適切 |
| L-3 | 公開ページに `<h1>` が無い | イベント名・コミュニティ名を h1 にすべき |
| ~~L-4~~ | ~~Search Console 未登録~~ | **2026-07-19 登録済み**。ベースライン取得済み（P0-2） |

### 優先度: 高（Search Console 実測・2026-07-10）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| GSC-1 | **クロール済み・未登録が 63 件** | 最大のボトルネック。同一 title / 薄いコンテンツ / SPA の組み合わせが疑われる |
| GSC-2 | **未登録合計 68 件（登録率 59%）** | 100 登録 / 168 既知 URL。Phase 2 後に再計測し改善率を KPI にする |
| GSC-3 | **登録済みが 125→100 に急減（6/27 頃）** | ライブテスト Soft 404 と整合。放置するとさらに脱落するリスク |
| GSC-4 | **イベント URL のライブテストが Soft 404** | 代表 URL で確認（2026-07-19）。**全イベントページに波及する可能性大** |



### 優先度: 中（programmatic SEO・Phase 4 向け）

| # | 課題 | 証拠・影響 |
|---|------|-----------|
| P-1 | **住所がフリーテキスト** | `event_address_base` 等が文字列のみ。都道府県・市区の階層ページを機械生成できない |
| P-2 | **店舗の一般公開 URL が無い** | `PartnerShop` は partner 管理画面専用。店舗名指名検索を拾えない |
| P-3 | **ハブページが未整備** | `/communitylist` のみ。エリア別・ジャンル別の内部リンク構造が無い |
| P-4 | **終了イベントの扱い未定義** | 期限切れイベントが薄いページとして蓄積しうる |
| P-5 | **subdomain_tags の URL 方針** | サブドメイン分割前提の設計。サブフォルダの方がドメインオーソリティを集約できる |
| P-6 | **量産ページのレンダリング基盤が無い** | Phase 2 の ogpRequest は既存ページのメタ注入のみ。新規一覧ページの本文は CSR では不十分 |

---

## 対策タスクリスト

進捗はチェックボックスで管理する。**Phase 1 → 2 → 3** の順で着手し、**Phase 4** は Phase 2 完了後に需要検証から段階的に進める。

### Phase 0: 準備

| 工数 | タスク |
|------|--------|
| — | [x] SEO 監査の実施（本ドキュメント） |
| — | [x] GitHub Issue 作成（#2195） |
| — | [x] エージェントスキル導入（`seo-audit` / `programmatic-seo`） |
| [S] | [x] **P0-1** Google Search Console に shokujii.jp を登録<br>プロパティ: `sc-domain:shokujii.jp` |
| [S] | [x] **P0-2** Search Console で現状のインデックス数・カバレッジを確認（ベースライン取得）<br>2026-07-10: 登録済み 100 / 未登録 68。内訳は上記「ページのインデックス登録」参照 |
| [S] | [ ] **P0-3** 未登録 URL の代表サンプルを特定<br>イベント（Soft 404 再現）: `https://shokujii.jp/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf` **記録済み**。未登録 63 件・ソフト 404 3 件の URL エクスポートは残 |



### Phase 1: インデックスの土台

クローラーへの基本指示と管理画面の除外。

| 工数 | タスク |
|------|--------|
| [S] | [x] **P1-1** `user/public/robots.txt` を追加<br>Allow: 公開ページ（`/`, `/c/**`, `/communitylist` 等）<br>Disallow: `/manage/**`, `/chat/**`, `/cart`, `/login`, `/register/**`, `/profile` 等<br>Sitemap: `https://shokujii.jp/sitemap.xml` を記載 |
| [S] | [x] **P1-2** partner / enterprise / manager に noindex を設定<br>方式: `firebase.json` の headers で `X-Robots-Tag: noindex`（推奨） |
| [S] | [x] **P1-3** `user/index.html` の静的メタ修正<br>`meta description` 追加、`twitter:site` 修正、トップの `og:type` を `website` に |
| [S] | [ ] **P1-4** Search Console 登録手順を本ドキュメントに追記 |

**Phase 1 完了条件**

- `https://shokujii.jp/robots.txt` が正しいテキストを返す（HTML ではない）
- partner / enterprise が noindex になっている

**Phase 1 合計工数目安**: S × 4（約 2〜4 日）

### Phase 2: ページ別メタの動的化（本命）

既存 `ogpRequest.ts` を拡張し、検索エンジン向けメタをサーバーサイド注入する。

| 工数 | タスク |
|------|--------|
| [M] | [x] **P2-1** `ogpRequest.ts` で `<title>` を動的注入<br>コミュニティ: `{community_name} \| shokujii` / イベント: `{event_name} \| shokujii` |
| [S] | [x] **P2-2** `ogpRequest.ts` で `<meta name="description">` を動的注入<br>`og:description` と同値で可 |
| [S] | [x] **P2-3** `ogpRequest.ts` で `<link rel="canonical">` を注入<br>正規形: 小文字 `/c/{account}` / `/c/{account}/e/{eventId}` |
| [M] | [x] **P2-4** JSON-LD 構造化データを注入<br>イベント: schema.org `Event` / コミュニティ: `Organization`<br>検証: [Google Rich Results Test](https://search.google.com/test/rich-results)（**デプロイ後に実施**） |
| [S] | [x] **P2-5** データ不在時の HTTP ステータス改善<br>イベント / コミュニティ不在・非公開時: 404 を返す |
| [S] | [ ] **P2-6** 旧パス `/community/**` から `/c/**` への 301 リダイレクト<br>Function 側または router 側で方針決定 |
| [M] | [x] **P2-7** `sitemap.xml` の動的生成<br>対象: `is_public == true` のコミュニティ・イベント<br>方式: onRequest + rewrite（`handleSitemapRequest`） |
| [S] | [x] **P2-8** クライアント側 `document.title` 更新<br>router `afterEach` でページ遷移時に更新 |
| [S] | [x] **P2-9** 404 ページ（`[[...error]].vue`）に noindex を設定 |

**Phase 2 完了条件**

- `https://shokujii.jp/sitemap.xml` が公開 URL を含む
- 公開イベントページの HTML にページ固有の title・description・canonical が含まれる
- イベントページに schema.org Event の JSON-LD が含まれる（Rich Results Test で PASS）
- 存在しないイベント URL が 404 を返す

**Phase 2 合計工数目安**: M × 3 + S × 6（約 2〜3 週間）

### Phase 3: 計測に基づく改善

Phase 1・2 デプロイ後、Search Console のデータを見て判断する。

| 工数 | タスク |
|------|--------|
| [S] | [ ] **P3-1** Search Console でカバレッジ・クロールエラーを確認<br>Phase 2 デプロイ後: 未登録 68 → 目標 50% 削減。修正の確認（Validate fix）を実施 |
| [S] | [ ] **P3-2** Core Web Vitals を PageSpeed Insights で計測（LCP / INP / CLS） |
| [S] | [ ] **P3-3** 公開ページの `<h1>` 整備（イベント名・コミュニティ名を h1 に） |
| [M] | [x] **P3-4** プリレンダリング強化の要否判断・実装<br>`ogpRequest.ts` で `#app` 内にイベント概要 HTML を注入（`SEO_BODY` マーカー） |
| [S] | [ ] **P3-5** AI 検索対応（GEO）の検討<br>関連スキル: `ai-seo`（必要に応じて導入） |
| [S] | [ ] **P3-6** Phase 4 着手判断<br>Phase 2 のインデックス率・流入データを見て pSEO の優先度を決定 |

**Phase 3 合計工数目安**: S × 5 + M × 1（約 1 週間、P3-4 は判断次第で拡大）

### Phase 4: programmatic SEO（量産ページ）

Phase 2 完了後、需要検証から段階的に着手。**別 Issue 化を推奨**する項目あり。

#### 4-0. 前提データ・方針（着手前）

| 工数 | タスク |
|------|--------|
| [S] | [ ] **P4-0-1** キーワード需要検証<br>「食事会 {エリア}」「ランチ会 {ジャンル}」等の検索ボリューム確認 |
| [S] | [ ] **P4-0-2** キーワードマッピング表の作成<br>既存 `/c/**`・`/communitylist` とのカニバリ回避 |
| [S] | [ ] **P4-0-3** 薄いコンテンツ対策の設計<br>ページ固有の価値（開催実績数・参加人数・写真等）の定義<br>掲載 0 件のページは生成しない or noindex |
| [S] | [ ] **P4-0-4** 適用プレイブックの選定（下表参照） |

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
| [L] | [ ] **P4-1** エリア情報の構造化<br>schema に `prefecture` / `city` 追加、または既存住所からの正規化 backfill<br>実装先: `bokudeli-event-batch` 側を検討 |
| [M] | [ ] **P4-2** 終了イベントのアーカイブ戦略<br>noindex / 集約ページへの巻き取り / 開催実績データとして再利用の方針決定 |
| [S] | [ ] **P4-3** `subdomain_tags` の URL 方針決定<br>サブドメインではなく `shokujii.jp/t/{tag}/` 等のサブフォルダを推奨 |

#### 4-2. ページ・リンク構造

| 工数 | タスク |
|------|--------|
| [M] | [ ] **P4-4** ハブページ（一覧の細分化）の新設<br>例: `/events/tokyo/` → `/events/tokyo/curry/` → 各イベント<br>ハブ＆スポークの内部リンク構造 |
| [L] | [ ] **P4-5** 店舗公開ページの新設<br>例: `/shops/{shopId}` + `LocalBusiness` スキーマ<br>店舗側の掲載同意・公開フラグ設計を含む（**別 Issue 推奨**） |
| [L] | [ ] **P4-6** 量産ページのレンダリング基盤<br>onRequest Function で HTML 生成 / ビルド時 SSG 等の方式選定<br>CSR のままでは pSEO ページは機能しない |
| [M] | [ ] **P4-7** sitemap のページタイプ別分割<br>events / communities / areas / shops 等。Search Console でタイプ別インデックス率を追跡 |

#### 4-3. 小規模検証 → 拡大

| 工数 | タスク |
|------|--------|
| [M] | [ ] **P4-8** パイロット: 上位 10〜20 エリアのみ Locations ページ化<br>インデックス率・流入・CV を計測 |
| [M] | [ ] **P4-9** 成果に応じてジャンル掛け合わせ・店舗ディレクトリへ展開<br>薄いコンテンツ警告が出ないか監視 |

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
| `<title>` | `<head>` 内 | OGP セクション外。別 ReplaceSectionStream または head 全体置換 |
| `<meta name="description">` | `<head>` 内 | 同上 |
| `<link rel="canonical">` | `<head>` 内 | 同上 |
| JSON-LD | `<head>` 内 `<script type="application/ld+json">` | Event / Organization |
| OGP タグ | `<!-- OGP_BEGIN_TAG -->` 〜 | 既存実装 |

### programmatic SEO の進め方（Phase 4）

1. Phase 2 完了 → P4-0（需要検証・プレイブック選定）
2. P4-1（住所構造化）+ P4-6（レンダリング基盤）の方式見積もり
3. P4-8（パイロット 10〜20 エリア）で効果測定
4. 成果が出たら P4-9 で拡大。店舗公開（P4-5）は別 Issue

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
- `/communitylist`（コミュニティ一覧）
- `/u/{userId}`（ユーザープロフィール ※公開設定次第）

---

## 検証チェックリスト

### Phase 1〜2（技術 SEO）

- [ ] `curl -s https://shokujii.jp/robots.txt` が robots 形式のテキストを返す（**P1-1 実装済み・デプロイ後確認**）
- [ ] `curl -s https://shokujii.jp/sitemap.xml` が XML を返す（**P2-7 実装済み・デプロイ後確認**）
- [ ] 公開イベント URL の HTML に固有 title / description / canonical が含まれる（**P2-1〜3 実装済み・デプロイ後確認**）
- [ ] 公開イベント URL の `#app` 内に `<h1>` と概要 HTML が含まれる（**P3-4 実装済み・デプロイ後確認**）
- [ ] Rich Results Test で Event スキーマが検出される（**P2-4 実装済み・デプロイ後確認**）
- [ ] GSC URL 検査ライブテストで Soft 404 が解消される（代表: `/c/flc_fes/e/drl46nkkVgwFFv4Jy0Vf`）
- [ ] 存在しないイベント URL が 404 を返す（**P2-5 実装済み・デプロイ後確認**）
- [ ] partner / enterprise に `X-Robots-Tag: noindex` が付く
- [ ] Search Console に sitemap を送信済み

### Phase 4（programmatic SEO・パイロット後）

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
