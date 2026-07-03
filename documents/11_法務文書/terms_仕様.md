# 法務文書サイト（terms）仕様

利用規約・プライバシーポリシー・特定商取引法に基づく表示・店舗利用規約などの法務文書を、コード管理・静的サイトとして公開する仕様の正本。

**関連 Issue**: [#2150 terms をコード管理する](https://github.com/nijuniinc/bokudeli-event-new/issues/2150)

**参考サイト**

- [terms.popopo.com](https://terms.popopo.com/)（利用規約）
- [terms.popopo.com/privacy](https://terms.popopo.com/privacy)（プライバシーポリシー）
- [terms.popopo.com/specified_commercial_transactions](https://terms.popopo.com/specified_commercial_transactions)（特定商取引法）

---

## 1. 概要

### 1.1 目的

| 項目 | 内容 |
| :-- | :-- |
| 課題 | 法務文書が Notion で管理されており、改定履歴・デプロイ・リンク管理がアプリ本体と分離している |
| 解決 | モノレポ内に `terms/` ワークスペースを設け、Markdown で文言を管理し Firebase Hosting で公開する |
| 公開 URL（本番） | `https://terms.shokujii.jp`（サブドメイン専用サイト） |

### 1.2 対象文書（Phase 1）

| 文書 | 公開パス | 移行元 |
| :-- | :-- | :-- |
| ユーザー利用規約 | `/user` | [ユーザー利用規約.md](./ユーザー利用規約.md) / Notion |
| プライバシーポリシー | `/privacy` | [プライバシーポリシー.md](./プライバシーポリシー.md) / Notion |
| 特定商取引法に基づく表記 | `/specified_commercial_transactions` | [特定商取引法に基づく表記.md](./特定商取引法に基づく表記.md) / Notion |
| 店舗利用規約 | `/partner` | [飲食店利用規約.md](./飲食店利用規約.md) / Notion |

URL 設計の方針:

- **全法務文書を同じ階層**に揃える（`/user` / `/privacy` / `/specified_commercial_transactions` / `/partner`）
- **`/` は `https://shokujii.jp/` へ 301 リダイレクト**（文書一覧・ページ間ナビは設けない）
- `/user` と `/partner` で一般ユーザー向け・店舗向けを対称に表現する
- プライバシー・特商法のパスは参考サイト（POPOPO）に合わせる

#### 表示名・ファイル名・パスの対応

| 表示名（サイト上） | `documents/11_法務文書/` | `terms/content/` | 公開パス |
| :-- | :-- | :-- | :-- |
| 利用規約 | `ユーザー利用規約.md` | `user.md` | `/user` |
| プライバシーポリシー | `プライバシーポリシー.md` | `privacy.md` | `/privacy` |
| 特定商取引法に基づく表記 | `特定商取引法に基づく表記.md` | `specified_commercial_transactions.md` | `/specified_commercial_transactions` |
| 店舗利用規約 | `飲食店利用規約.md`（ファイル名は歴史的経緯） | `partner.md` | `/partner` |

### 1.3 対象外（別 Issue）

| 項目 | 理由 |
| :-- | :-- |
| FAQ（Notion） | 法務文書ではなくヘルプ系。`about.shokujii.jp` 等との整理が別途必要 |
| コミュニティガイド（bit.ly） | ガイドラインであり本仕様のスコープ外 |
| 独立 Cookie / 外部送信ポリシー | [プライバシーポリシー.md](./プライバシーポリシー.md) に Google Analytics（Cookie）を記載済み。電気通信事業届出で独立ページが必要になった場合は [03_電気通信事業届出準備.md](../05_コミュニケーションと通知/03_電気通信事業届出準備.md) を参照し別 Issue とする |
| エンプラ版プライバシーポリシー | [08_エンタープライズ/10_仕様/06_セキュリティ.md](../08_エンタープライズ/10_仕様/06_セキュリティ.md) にドラフトあり。導入審査向けは Phase 3 以降で `/enterprise/privacy` 等を検討 |
| エンプラ向けセキュリティポリシー・SLA | B2B 導入審査用ドラフト。一般向け terms サイトの Phase 1 外 |

---

## 2. ねらい

- **法務・エンジニア双方**が Git PR で改定をレビューできる
- アプリ内リンクを **環境別 URL 定数** に集約し、Notion 直リンクを廃止する
- 参考サイトと同様、**制定日・改定日** をページ上で明示する
- 本番・テスト環境で **既存 Hosting パターンと同型** にデプロイできる

---

## 3. 現状

### 3.1 Notion URL（置換対象）

| 文書 | 現行 URL |
| :-- | :-- |
| 利用規約 | `https://nijuni.notion.site/shokujii-38ef325b1c5f446880bbe35bc4bbf41c` |
| プライバシーポリシー | `https://nijuni.notion.site/shokujii-26a5f4507e5343329d2b7c6bea51030b` |
| 特定商取引法 | `https://nijuni.notion.site/a761c206d7704b5caa4058c6c3f8fff7` |

店舗利用規約はアプリから Notion 直リンクされていない。Notion に別ページがある場合は Phase 1 移行時に URL を確認し、§8 の告知対象に加える。

### 3.2 アプリ内の参照箇所

Notion URL がハードコードされている主なファイル:

| パッケージ | ファイル | 参照する法務文書（移行後） |
| :-- | :-- | :-- |
| `base` | `src/components/LoginDialog.vue`, `src/locales/messages/ja.ts` | ユーザー利用規約・プライバシーポリシー → `/user`, `/privacy` |
| `user` | `src/components/Footer.vue`, `src/locales/messages/ja.ts` | 同上 + 特商法 → `/specified_commercial_transactions` |
| `enterprise` | `src/components/Footer.vue`, `src/locales/messages/ja.ts` | 同上（エンプラも PF 版規約に同意） |
| `partner` | `src/locales/messages/ja.ts` | コミュニティ主催設定: **ユーザー利用規約** → `/user`（現状 Notion のユーザー規約 URL）。店舗利用規約は未リンク |

#### partner における規約リンクの使い分け（Phase 2）

| 画面・文脈 | リンク先 | 定数 |
| :-- | :-- | :-- |
| コミュニティ主催設定（既存 `ja.ts`） | ユーザー利用規約 `/user` | `LEGAL_URLS.terms` |
| 店舗オンボーディング（ホーム TODO STEP(3)） | 店舗利用規約 `/partner` | `LEGAL_URLS.partnerTerms` |
| 店舗掲載申し込み（form.run） | 本仕様のスコープ外（外部フォーム） | — |

### 3.3 リポジトリ内の法務 Markdown

`documents/11_法務文書/` に各文書の Markdown が既に存在する。Phase 1 ではこれを **`terms/content/` へ取り込み**、公開用正本とする。

### 3.4 Phase 1 で公開すべき法務文書の網羅性

現時点のアプリ・`documents/11_法務文書/` を照合した結果、**Phase 1 の 4 文書で足りる**（Issue #2150 のスコープとして妥当）。

| 確認項目 | 結果 |
| :-- | :-- |
| Footer / ログイン同意文が参照する文書 | ユーザー利用規約・プライバシーポリシー・特商法 → カバー済み |
| 店舗向け規約 | `飲食店利用規約.md` あり。`/partner` として公開し Phase 2 で partner からリンク |
| Cookie ポリシー | プライバシーポリシー内に記載。独立ページは不要（§1.3） |
| コミュニティガイド | 法務同意文書ではない（§1.3） |

---

## 4. 画面・サイト仕様

### 4.1 サイト構成

- **完全静的サイト**（SPA・認証・Firestore 不要）
- 各ページ: ページ最上部に大きなタイトル（例: 「利用規約」「プライバシーポリシー」）、本文（条文構造）、制定日・改定日
- **各ページは独立**（グローバルナビ・サイドバー・文書間リンクは設けない）
- レスポンシブ（スマホでの長文閲覧を想定）
- 表示言語は **日本語のみ**（`AGENTS.md` 方針に準拠）
- リンク色は shokujii アプリの primary 緑（`#1AC662`）に合わせる

### 4.2 トップ（`/`）

`terms.shokujii.jp/` へのアクセスは **`https://shokujii.jp/` へ 301 リダイレクト**する（Firebase Hosting `redirects`）。文書一覧ページは設けない。

### 4.3 共通レイアウト

- グローバルナビ・サイドバー・サイトタイトル（「shokujii 法務文書」等の内部用語）は表示しない
- フッターに「食事でつながる「shokujii」」と `© {当年} nijuni inc.`（年は自動更新）を表示
- スタイルは各アプリ（Vuetify）とは独立した軽量 CSS

### 4.4 制定日・改定日

参考サイトと同様、ページ末尾に表示する。Markdown frontmatter で管理:

```yaml
---
title: 利用規約
effective_date: 2020-01-01
revised_dates:
  - 2024-06-01
---
```

移行時は Notion または現行公開ページから **制定日・改定日を法務確認の上** frontmatter に転記する（`documents/11_法務文書/*.md` には frontmatter がないため Phase 1 で新規付与）。

---

## 5. 技術仕様

### 5.1 ディレクトリ構成

```
terms/
├── package.json
├── vite.config.ts          # または vitepress.config.ts
├── content/                # 公開文言の正本（Markdown）
│   ├── user.md             # 利用規約（/user）
│   ├── privacy.md
│   ├── specified_commercial_transactions.md
│   └── partner.md          # 店舗利用規約（/partner）
├── public/                 # favicon, ロゴ等
└── dist/                   # ビルド成果物 → Firebase Hosting
```

ルート `package.json` の `workspaces` に `"terms"` を追加する。

### 5.2 技術選定

| 方式 | 採用 | 理由 |
| :-- | :-- | :-- |
| **VitePress** | **推奨** | Markdown ネイティブ、静的生成、Vue モノレポとの親和性 |
| Astro | 候補 | 軽量だが新スタック追加 |
| 素の HTML | 非推奨 | 差分レビュー・再利用が弱い |

#### VitePress のルーティング

VitePress は `content/` 配下の Markdown ファイル名がそのまま URL パスになる（`user.md` → `/user`）。`/` は Firebase Hosting の 301 リダイレクトで `shokujii.jp` へ転送する。カスタム `rewrites` は Phase 1 では不要。

設定の目安:

- `srcDir: 'content'`（または `docs/` + `srcDir` をプロジェクト構成に合わせる）
- `cleanUrls: true` で `/user.html` ではなく `/user` を生成
- 詳細は [VitePress ルーティング](https://vitepress.dev/guide/routing) を参照

### 5.3 文言の正本と `documents/11_法務文書/`

| パス | 役割 |
| :-- | :-- |
| `terms/content/*.md` | **公開・デプロイの正本**。改定はここを更新して PR |
| `documents/11_法務文書/*.md` | **初回移行元**。移行完了後は更新しない（参照用アーカイブとして残す） |

二重管理を避ける方針:

1. Phase 1 移行完了後、法務文言の改定は **`terms/content/` のみ**
2. `documents/11_法務文書/*.md`（`terms_仕様.md` を除く）は削除せず残すが、ファイル先頭または `documents/11_法務文書/README.md` に「正本は `terms/content/`」と deprecated 旨を明記する（Phase 1 完了時タスク）
3. 自動同期・symlink は行わない

### 5.4 アプリ側 URL 定数（Phase 2）

`base` に環境別ベース URL を集約する（`LoginDialog.vue` が `base` にあり、`base` は既に `import.meta.env` を利用しているため。`common` は `tsc` ビルドのみで env 注入の先例がない）。

```typescript
// base/src/constants/legalUrls.ts
const TERMS_BASE = import.meta.env.VITE_TERMS_BASE_URL ?? 'https://terms.shokujii.jp'

export const LEGAL_URLS = {
  terms: `${TERMS_BASE}/user`,
  privacy: `${TERMS_BASE}/privacy`,
  commercial: `${TERMS_BASE}/specified_commercial_transactions`,
  partnerTerms: `${TERMS_BASE}/partner`,
} as const
```

`index`（`/`）は shokujii.jp へ 301 リダイレクトするため、`LEGAL_URLS` には含めない。

各アプリの `.env` に `VITE_TERMS_BASE_URL` を設定する（`base` を import する全アプリでビルド時に注入される）。

| 環境 | `VITE_TERMS_BASE_URL` |
| :-- | :-- |
| production | `https://terms.shokujii.jp` |
| development | `https://terms.test.tabete.co` |
| sandbox（個人 Firebase） | `https://<PROJECT_ID>-terms.web.app` または個別カスタムドメイン（WIP 確認用。必須ではない） |

### 5.5 Firebase Hosting

`firebase.json` に hosting target を追加する。

```json
{
  "public": "terms/dist",
  "target": "terms",
  "ignore": ["**/.*", "**/node_modules/**"],
  "headers": [
    {
      "source": "**/*.html",
      "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }]
    },
    {
      "source": "/",
      "headers": [{ "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }]
    },
    {
      "source": "/assets/**/*.@(js|css)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

- **rewrites 不要**（静的 HTML のみ。`user` / `enterprise` のような SPA fallback は使わない）
- キャッシュ: HTML は `no-cache`、ハッシュ付きアセットは長期キャッシュ（既存 target と同型）

#### Hosting サイト ID・target 名

| 項目 | 値 |
| :-- | :-- |
| Firebase Hosting target 名 | `terms` |
| Hosting サイト ID | `<GCP_PROJECT_ID>-terms`（例: 本番 `bokudeli-event-dev-terms`、テスト `bokudeli-event-test-terms`） |

enterprise の命名規則（[07_デプロイ・運用.md](../08_エンタープライズ/10_仕様/07_デプロイ・運用.md) §1）に倣う。

#### 初回デプロイチェックリスト

[07_デプロイ・運用.md §2](../08_エンタープライズ/10_仕様/07_デプロイ・運用.md)（enterprise マージ前チェックリスト）と同型。`development` へマージして CI を走らせる**前**に環境ごとに完了すること。

**Firebase / GCP**

- [ ] Hosting サイト作成 — サイト ID = `<PROJECT_ID>-terms`（`terraform/firebase.tf` の `google_firebase_hosting_site.terms`）
- [ ] `firebase target:apply hosting terms <PROJECT_ID>-terms`
- [ ] `FIREBASERC` 更新 — GitHub Environment Variable に `hosting.terms` の target マッピングを追記

**GitHub Actions（Environment 単位: `development` / `production`）**

- [ ] `FIREBASERC` — `terms` target を追記済み
- [ ] `PROJECT_ID` / `GCLOUD_SERVICE_KEY` — 既存設定と一致

**ドメイン**

- [ ] Firebase Console → terms サイトにカスタムドメイン追加
- [ ] DNS（TXT / CNAME）設定

**初回確認**

- [ ] `Deploy terms` workflow_dispatch で成功
- [ ] `/`, `/user`, `/privacy` 等が期待どおり表示される

#### カスタムドメイン

| 環境 | ドメイン（案） |
| :-- | :-- |
| production | `terms.shokujii.jp` |
| development | `terms.test.tabete.co` |

Firebase Console で terms サイトにドメインを追加し、DNS（TXT / CNAME）を設定する。

### 5.6 CI/CD

| 成果物 | 内容 |
| :-- | :-- |
| `.github/workflows/deploy_terms.yml` | `deploy_user.yml` と同型。`paths: terms/**` でトリガー、`--only hosting:terms` でデプロイ |
| `.github/workflows/pr-verify.yml` | `terms/**` の path filter と build ステップを追加 |
| `terraform/firebase.tf` | `google_firebase_hosting_site.terms` を追加 |

`terms` は `common` / `base` に依存しない想定のため、pr-verify は `terms` 単体の build のみで足りる。

### 5.7 開発コマンド（案）

```bash
npm -w terms run dev
npm -w terms run build
```

---

## 6. 実装優先度

### Phase 1（MVP）— Issue #2150 の核心

- [ ] `terms/` ワークスペース作成（VitePress）
- [ ] `documents/11_法務文書/` から 4 文書を `terms/content/` へ移行（`user.md` 等）
- [ ] 各文書の制定日・改定日を法務確認の上 frontmatter 化
- [ ] `/` を `https://shokujii.jp/` へ 301 リダイレクト（`firebase.json`）
- [ ] frontmatter（制定日・改定日）と共通レイアウト
- [ ] `firebase.json` / Terraform / `deploy_terms.yml` / pr-verify 更新
- [ ] §5.5 初回デプロイチェックリスト完走
- [ ] `documents/11_法務文書/README.md` に正本の所在（`terms/content/`）を明記
- [ ] テスト環境（`terms.test.tabete.co`）デプロイ・動作確認
- [ ] 本番（`terms.shokujii.jp`）デプロイ

### Phase 2 — アプリリンク切替

- [x] `base/src/constants/legalUrls.ts` 追加
- [x] 各アプリ `.env` に `VITE_TERMS_BASE_URL`（README 記載。GitHub Actions Variables はマージ前に人手で追記）
- [x] Notion 直リンクを `LEGAL_URLS` 参照に置換（§3.2 の全ファイル）
- [x] `partner` のコミュニティ主催設定: ユーザー利用規約 → `LEGAL_URLS.terms`（`/user`）に置換
- [x] `partner` に店舗利用規約リンクを追加 → `LEGAL_URLS.partnerTerms`（`/partner`）。配置: ホーム TODO STEP(3)

### Phase 3 — 運用整備

- [ ] Notion ページに新 URL 告知（Notion 側リダイレクトは困難な場合あり）
- [ ] 法務改定フロー（PR 必須・施行日記載・レビュー担当）を本ドキュメントまたは別手順書に固定
- [ ] エンプラ向け法務文書の要否判断（`/enterprise/*` の追加検討）

---

## 7. 法務改定の運用ルール

1. 文言変更は **`terms/content/` の Markdown PR** のみで行う
2. PR 説明に **改定理由** と **施行日** を記載する
3. **法務確認後** にマージする（エンジニア単独での文言変更は禁止）
4. マージ後、CI が自動デプロイする（`development` / `production` ブランチ運用は既存アプリと同型）
5. アプリの同意文・Footer は URL 定数参照のため、文言改定だけではアプリ再デプロイは不要（URL が変わる場合のみ Phase 2 対象）

---

## 8. Notion 廃止手順

推奨順序（ダウンタイム回避）:

1. terms サイトをテスト環境にデプロイし URL 確認
2. 本番 `terms.shokujii.jp` を公開
3. Phase 2 でアプリ内リンクを一括切替
4. Notion ページをアーカイブまたは「新 URL へ移転」文言のみ残す

Notion からの HTTP リダイレクトは設定できない可能性が高いため、**アプリリンクの切替が実質的な移行完了条件** とする。

---

## 9. 注意事項

### 9.1 セキュリティ

- 静的サイトのみ。認証・個人情報・Firestore は不要
- `.env` / シークレットはコミットしない（他アプリと同様）

### 9.2 既存システムへの影響

- 新 Hosting サイト・DNS・Terraform リソースの追加が必要
- リンク切替までは Notion が有効なため、Phase 1 単体ではアプリ挙動は変わらない

### 9.3 確定事項・未決定事項

#### 確定

| 論点 | 決定 |
| :-- | :-- |
| トップページ（`/`） | `https://shokujii.jp/` へ 301 リダイレクト |
| ユーザー利用規約のパス | `/user` |
| 店舗利用規約のパス | `/partner` |
| URL 定数の配置 | `base/src/constants/legalUrls.ts` |
| 文言の正本 | `terms/content/`（`documents/11_法務文書/*.md` は移行後アーカイブ） |
| Phase 1 の法務文書網羅性 | 4 文書で足りる（§3.4） |

#### 未決定（実装前に確定）

| # | 論点 | 推奨 |
| :-- | :-- | :-- |
| A | テスト環境ドメイン | `terms.test.tabete.co` |
| B | VitePress テーマ・ブランド CSS | shokujii primary 緑（`#1AC662`）に合わせた最小カスタム |
| C | sandbox のカスタムドメイン | 必須ではない。`<PROJECT_ID>-terms.web.app` で WIP 確認可 |

---

## 10. 関連ドキュメント

| ドキュメント | 内容 |
| :-- | :-- |
| [ユーザー利用規約.md](./ユーザー利用規約.md) | 初回移行元テキスト |
| [プライバシーポリシー.md](./プライバシーポリシー.md) | 初回移行元テキスト |
| [特定商取引法に基づく表記.md](./特定商取引法に基づく表記.md) | 初回移行元テキスト |
| [飲食店利用規約.md](./飲食店利用規約.md) | 店舗利用規約・**初回移行元**（移行後は `terms/content/partner.md` が正本） |
| [03_電気通信事業届出準備.md](../05_コミュニケーションと通知/03_電気通信事業届出準備.md) | 将来の Cookie / 外部送信ポリシー追加の参考 |
| [08_エンタープライズ/10_仕様/07_デプロイ・運用.md](../08_エンタープライズ/10_仕様/07_デプロイ・運用.md) | Hosting target・CI の参考 |
| [08_エンタープライズ/10_仕様/08_カスタムドメイン.md](../08_エンタープライズ/10_仕様/08_カスタムドメイン.md) | サブドメイン・環境別ドメインの参考 |
