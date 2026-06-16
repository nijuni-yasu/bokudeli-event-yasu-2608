# manager パッケージの現行標準スタックへの移行

## 0. 目的

運営向け管理画面 `manager` は、購入テンプレート（Vuetify Material Dashboard PRO）をベースにした **Vue 2 / Vue CLI 世代のレガシー**であり、技術スタック・依存・CI のすべてが現行標準（`user` / `partner`）から取り残されている。

本ドキュメントは、**manager が実装している基本仕様（運営向けの横断閲覧＋一部運営操作）はそのまま維持**しつつ、`user` / `partner` と同じ現行標準スタックへ作り直す（案A）ための計画をまとめる。

> 方針: 既存 `manager` を段階的に置き換え、最終的にレガシー資産を削除する。仕様の追加・変更は本移行のスコープ外（あくまで「同じことを新スタックで」行う）。

---

## 1. 背景・現状の問題

### 1.1 技術スタックの世代差

| 項目 | manager（現状） | user / partner（現行標準・移行先） |
| :--- | :--- | :--- |
| Node | **16.14.2**（`manager/.node-version`、EOL） | 20（→ 24 へ移行検討中、#1983） |
| フレームワーク | **Vue 2.6**（EOL 2023-12-31） | Vue 3 |
| UI | **Vuetify 2.2**（Material Dashboard PRO） | Vuetify 3（Materio テンプレート） |
| ビルド | **vue-cli-service（webpack）** | Vite |
| 言語 | **JavaScript（素）** | TypeScript |
| Firebase SDK | **firebase 7.16（compat / namespaced）** | modular SDK（`firebase/firestore`） |
| 状態管理 | Vuex 3 | Pinia（`@shokujii/base/plugins/pinia`） |
| ルーティング | vue-router 3（手書き routes） | unplugin-vue-router（ファイルベース）+ layouts |
| i18n | vue-i18n 8（`locale: 'en'`） | vue-i18n（`ja` 固定） |
| monorepo | **workspaces 対象外**（`yarn.lock` + 独自 `package-lock.json`） | npm workspaces |
| 共有コード | `common` / `base` 再利用なし | `@shokujii/base` / `@shokujii/common` を利用 |
| Firestore 操作 | **直接アクセス**（`db.collection().set/delete`） | **store 経由**（withConverter 付き） |

### 1.2 デプロイできない要因（複合）

legacy 向け `deploy_manager.yml` は **移行着手まで削除済み**（#2087）。フェーズ5で `deploy_partner.yml` 同型として新規追加する。削除前の workflow が落ちる原因は「hosting:manager ターゲット未設定」だけではない。

- **(A) `.firebaserc` の hosting target 未マッピング**（sandbox で表面化した直接エラー）。`firebase.json` に `target: "manager"` は定義済みだが、`firebase target:apply hosting manager <site>` が未実行の環境で失敗する。
- **(B) Node 16 が EOL**。`node-version-file: ./manager/.node-version`（=16.14.2）で、`setup-node@v6` での取得が将来的に不安定。他 deploy は Node 20/24 系。
- **(C) 旧ビルドツールチェーン**。`vue-cli-service 4` + `sass-loader 8` + node-sass 世代は新しい npm / Node で peer 依存衝突・ネイティブビルド失敗を起こしやすい。
- **(D) lockfile ドリフト**。workflow が `npm ci` ではなく `npm install`、かつ `yarn.lock` と `package-lock.json` 混在。
- **(E) Vue 2 / Vuetify 2 / vue-cli が EOL**。セキュリティ更新が来ない。

本移行（案A）は (B)〜(E) を根治する。(A) は sandbox 個別セットアップの問題として別途対応（[23 とは別軸]）。

### 1.3 規約違反（移行で是正）

- Firestore を **store 経由せず直接アクセス**（AGENTS.md「DB 操作は必ず store 経由」「xxxRef は withConverter 付き」に反する）。
- `common`（Zod スキーマ・`datetime.ts`）・`base`（stores・plugins）の再利用ゼロ。
- 認証許可メール（`support+admin@nijuni.jp`）が**ソースにハードコード**。

---

## 2. 維持すべき基本仕様（運営機能）

`manager/src/router.js` と `views/admin/*` から、運営（社内管理者）専用の実機能は以下。`views/dashboard/*` / `views/pages/*` のテンプレートデモ群は**対象外（移植しない）**。

| # | 画面 | 現行パス | 機能 | データ源（現状） |
| :- | :--- | :--- | :--- | :--- |
| 1 | ログイン | `/pages/login` | Firebase Auth（email/pw）。**`support+admin@nijuni.jp` のみ許可**（それ以外は強制 signOut） | Firebase Auth |
| 2 | 運営TODO（Home） | `/` | 静的な運営手順の案内 | なし |
| 3 | 店舗一覧 | `/ShopList` | 一覧表示＋**開店(is_open)／運営承認(is_approved) のスイッチ更新**、メニューページ遷移 | `collectionGroup('shops')` |
| 4 | メニュー管理 | `/ShopList/Menu` | 選択店舗のメニュー **追加／編集／削除**（画像・期間限定・在庫上限・売切） | `partners/{id}/menus` |
| 5 | イベント一覧 | `/EventList` | 全イベント横断表示（主催者情報・定員・参加数・ステータス・公開設定・URL） | `collectionGroup('events')` |
| 6 | コミュニティ一覧 | `/CommunityList` | コミュニティ（主催者）一覧（会社/団体・連絡先・SNS・利用目的・作成日） | `communities` |
| 7 | 注文一覧 | `/OrderList` | communities→events→`collectionGroup('orders')` を突合した注文明細 | 複数横断 |
| 8 | ユーザー一覧 | `/UserList` | ユーザー一覧（プロフィール・SNS・MyPage リンク） | `collectionGroup('users')` |

> 注: 現行は `UserList.vue` / `CommunityList.vue` のタイトルやファイル名の対応に混乱（両方「コミュニティ一覧」表記など）がある。移行時に**画面名・ファイル名・表示タイトルを整理**する。

---

## 3. アーキテクチャ方針（移行先）

`partner` を雛形にする。

- **エントリ**: `main.ts` で `@shokujii/base/plugins/{router, pinia, vuetify, i18n, layouts}` を読み込む（`partner/src/main.ts` 準拠）。
- **ルーティング**: `unplugin-vue-router`（ファイルベース、`src/pages/`）+ `vite-plugin-vue-layouts`（`src/layouts/`）。
- **状態**: Pinia。Firestore 読み書きは **`@shokujii/base/stores/*` を再利用**（横断取得系は `collectionGroup` + withConverter 実装済み）。
- **型・スキーマ**: `@shokujii/common` の Zod スキーマ・`common/src/utils/datetime.ts`（`convertToXxx`）を使用。日時の独自整形（`toDate().toLocaleString()` 等）は撤廃。
- **i18n**: `ja` 固定。文言は `manager/src/locales/messages/ja.ts` と `base` 共通の `ja.ts`。`en.ts` は作らない（AGENTS.md）。
- **monorepo**: ルート `package.json` の `workspaces` に `manager` を追加。`yarn.lock` は削除、`package-lock.json` はルートで一元管理。
- **依存反転の回避**: `base` への新規依存を持ち込みつつ、`base → manager` の逆依存を作らない。

### 3.1 base store の再利用マッピング

| 画面 | 再利用する store（base） | 補足 |
| :--- | :--- | :--- |
| 店舗一覧 | `useShopListStore(filters)` | `collectionGroup('shops')` + `shopConverter`。承認/開店更新は `base/stores/partner.ts` の shop 更新関数（無ければ追加）。 |
| メニュー管理 | `partners/{id}/menus` 用 store | 既存に無ければ `base/src/stores/` に CRUD store を新設（withConverter 必須）。 |
| イベント一覧 | `useEventListStore(filters, pageSize, { autoContinue: true })` | `collectionGroup('events')` + `eventConverter`。 |
| コミュニティ一覧 | `useCommunityListStore(filters)`（`base/stores/communityList.ts`） | 既存利用。 |
| 注文一覧 | `useOrderListStore(storeId, filters)`（`base/stores/orderList.ts`） | events/communities 突合は store 側 or 画面側で `common` 型に整える。 |
| ユーザー一覧 | `base/stores/user.ts` + 一覧 store | 一覧用 store が無ければ `base` に新設（withConverter 必須）。 |

> 既存 store に不足がある場合は **`base` 側に store を追加**してから manager で参照する（直接 `db.collection()` を書かない）。store 追加時は `/shokujii-firestore` スキルに従う。

---

## 4. ディレクトリ構成案（partner 準拠）

```
manager/
  package.json          # workspaces 配下、type: module、vite/vue-tsc/vitest
  vite.config.ts        # partner の vite.config.ts を流用
  vite.alias.ts
  vitest.config.ts
  .node-version         # 20（または #1983 に合わせ 24）
  index.html
  src/
    main.ts
    App.vue
    pages/              # ファイルベースルーティング
      login.vue                  # 旧 pages/Login
      index.vue                  # 旧 admin/Home（運営TODO）
      shops/index.vue            # 旧 admin/ShopList
      shops/[partnerId]/menu.vue # 旧 admin/Menu + ModalMenuForm
      events/index.vue           # 旧 admin/EventList
      communities/index.vue      # 旧 admin/CommunityList
      orders/index.vue           # 旧 admin/OrderList
      users/index.vue            # 旧 admin/UserList
      [[...error]].vue           # 404
    layouts/
      default.vue
      blank.vue                  # ログイン用
    components/
      MenuEditCard.vue           # 旧 ModalMenuForm を Vue3/Vuetify3 化
    locales/messages/ja.ts
    themes/  themeConfig.ts      # partner 準拠（ja のみ）
```

> パス名は現行のキャメルケース（`/ShopList`）から **小文字・複数形**（`/shops` 等）へ整理する。運営用ブックマーク等があれば周知。

---

## 5. monorepo / CI / Firebase 設定の変更

### 5.1 ルート `package.json`

- `workspaces` に `"manager"` を追加。

### 5.2 `deploy_manager.yml`

> **現状**: legacy 向け `.github/workflows/deploy_manager.yml` は削除済み。`github-actions-deploy` スキルの一括デプロイ対象からも除外（5 本: user / partner / functions / firestore / storage）。移行フェーズ5で **新規作成**する。

`deploy_partner.yml` と同型で `.github/workflows/deploy_manager.yml` を追加する。

- `actions/checkout@v6` / `actions/setup-node@v6`（#2085 済み）。
- `node-version-file` を `manager/.node-version`（20 or 24）に。
- `npm ci`（ルート workspace）→ `npm -w manager run build -- -m <env>` でビルド。
- デプロイは共通 `./.github/actions/deploy`（`--only hosting:manager`）に寄せる方向を検討（現行 manager は手書きの `firebase deploy`。可能なら storage/firestore 同様 composite action へ統一）。
- `paths` フィルタは `manager/**` に加え、共有変更（`base/**` / `common/**`）でも再デプロイが要るか検討。

### 5.3 `firebase.json` / `.firebaserc`

- `firebase.json` の `hosting` の `manager` ターゲットは現状維持（`public: "manager/dist"`）。Vite の出力先が `dist` であることを確認。
- 各環境（本番 / 各 sandbox）で `firebase target:apply hosting manager <siteId>` を実施（要因 A の恒久対応。手順は [firebaseプロジェクト新規作成.md](../firebaseプロジェクト/firebaseプロジェクト新規作成.md) に追記）。

### 5.4 `pr-verify.yml`

- manager が workspace に入ると lint / format / typecheck / test の対象になる。`vue-tsc`・`vitest`・eslint が通る状態にする。

---

## 6. 認証・セキュリティの見直し

現行はログイン後にメールアドレスを**フロントでハードコード比較**している。移行に合わせて次を検討（最低限 6.1 は実施）。

- **6.1**: 許可判定をソース直書きから外す。当面は環境変数（`VITE_*`）化、可能ならカスタムクレーム（例: `role: 'admin'`）+ ルーターガードへ。
- **6.2**: Firestore Security Rules で運営アクセス（横断 `collectionGroup` 読み取り・店舗承認の書き込み）が**運営ロールに限定**されているか確認。フロントの判定だけに依存しない。
- **6.3**: `support+admin@nijuni.jp` 等の運用アカウント情報はドキュメント・コードに残さない。

---

## 7. 段階的移行手順

1. **足場作り**: `manager` を partner 雛形で再初期化（`vite.config.ts` / `main.ts` / layouts / themes / i18n）。workspaces 追加。ビルドが通る空アプリを用意。
2. **認証**: ログイン画面（`blank` レイアウト）+ ルーターガード（運営ロール判定）を移植。
3. **読み取り系の移植（store 再利用）**: イベント一覧 → コミュニティ一覧 → ユーザー一覧 → 注文一覧 → 店舗一覧 の順で、`base` store を使って表示。日時・型は `common` に寄せる。
4. **更新系の移植**: 店舗の開店/承認スイッチ、メニュー CRUD。**store 経由の更新関数**を `base` に用意して呼ぶ。
5. **CI / Firebase**: `deploy_manager.yml` を新規作成（`deploy_partner.yml` 同型）、`pr-verify` 通過、各環境の hosting target マッピング。
6. **検証**（§8）→ 本番反映。
7. **レガシー削除**: 旧 `manager`（Vue2 資産・`yarn.lock`・テンプレートデモ・未使用依存 `vue-world-map` / `chartist` 等）を削除。AGENTS.md の「レガシー」記述を更新。

> 各フェーズは独立 PR にし、`/lint-and-format` を完了条件にする。

---

## 8. 検証手順

- **ローカル**: `npm -w manager run dev -- -m development` で 8 画面が表示・操作できる。
- **PR verify 相当**: `/lint-and-format`（build / lint / format / 型 / vitest）が通る。
- **機能確認**: 旧 manager と同一データで、店舗承認・開店切替・メニュー CRUD・各一覧の件数/内容が一致。
- **sandbox デプロイ**: フェーズ5で新規作成した `deploy_manager.yml` を発火し、404 / target エラーが出ず、hosting が更新される。
- **権限**: 非運営アカウントでログイン拒否、運営アカウントで全機能可。

---

## 9. 削除・整理する資産（移行完了後）

- `manager/src/views/dashboard/**`、`manager/src/views/pages/**`（Login/Error 以外のデモ）。
- 未使用依存: `vue-world-map` / `vue-chartist` / `archiver` / `vee-validate`(3) / `vuetify-loader` 等（移行後に棚卸し）。
- `manager/yarn.lock`、独自 `package-lock.json`、`vue.config.js` / `babel.config.js` / `.browserslistrc` など vue-cli 系設定。
- テンプレート由来の SASS（`src/sass/vuetify-material/**`）。

---

## 10. リスク・留意点

- **データ表示差分**: 旧 manager は型を緩く扱い、欠損データもそのまま表示していた。`common` の Zod 適用で**バリデーション落ち**が起きうる。一覧 store では `reportClientError` でスキップする既存パターン（`eventList.ts` 参照）に倣う。
- **store 不足**: 運営横断の更新（店舗承認など）に対応する store 関数が `base` に無い場合は新設が必要。`base` 肥大化を避けつつ、user/partner と共用できる形にする。
- **パス変更**: 運営のブックマーク URL が変わる。周知 or リダイレクト検討。
- **Node バージョン**: 20 で着手し、#1983（Node 24）と歩調を合わせるか要調整。

---

## 11. 関連 Issue / ドキュメント

- [23_node20のversion更新.md](23_node20のversion更新.md)（Node 24 / Functions ランタイム、#1983）
- [firebaseプロジェクト新規作成.md](../firebaseプロジェクト/firebaseプロジェクト新規作成.md)（hosting target マッピング）
- スキル: `/shokujii-firestore`（store 追加）, `/shokujii-common-schemas`（スキーマ）, `/vue-best-practices`, `/frontend-design`, `/lint-and-format`
- 雛形: `partner/`（`vite.config.ts` / `main.ts` / `pages` / `layouts` / `themes`）

> 本移行に着手する際は GitHub Issue を作成し（`/git-create-issue`）、フェーズ単位で PR を分ける。
