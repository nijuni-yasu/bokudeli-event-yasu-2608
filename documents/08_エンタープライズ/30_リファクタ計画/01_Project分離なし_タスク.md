# エンプラv0.2_Project分離なし_タスク（パターンA）

Project 分離なしで実装を進める場合のリファクタリングを検討する。

> **本書の位置づけ**
> Project 分離なし リファクタの本質は「**プロジェクトは分けず、パターンB が"強制"するコード衛生（モジュール境界・Auth 境界・スキーマ分岐）だけを単一プロジェクト内で先取りする**」こと。
> `90_アーカイブ/v0.2_アーキテクチャ再検討/05_不採用_パターンB_実装タスク.md` のタスクのうち、**インフラ分割系（Project ×2・multi-App・partner Bridge・cross-project）は採らず、コード整理系だけ**を採用する（§5 の線引き表）。
>
> **関連**
> - 意思決定: [ADR-001_Project分離なし.md](../20_設計判断_ADR/ADR-001_Project分離なし.md)（A/B 全論点・早見表・将来シナリオ）
> - B 実装タスク（流用元）: [05_不採用_パターンB_実装タスク.md](../90_アーカイブ/v0.2_アーキテクチャ再検討/05_不採用_パターンB_実装タスク.md)

---

## 0. 現状の到達点（すでにできていること）

リファクタの起点。土台はかなりできており、本書は「残った分岐・optional・ハイブリッド関数・Auth 境界」を仕上げる作業に絞る。

- **フロント**: `enterprise/` は既に独立 Vue アプリ（約 100 ファイル）。`base` 内に残るエンプラ関連は **実質 4 ファイル**だが、内訳は「**`if==enterprise` 分岐が残る 3 ファイル**」＋「**DI 前例の 1 ファイル（分岐なし・横展開すべき正解パターン）**」である（混同に注意）:
  - 分岐が残る（§4 で DI 化する対象）:
    - `base/src/stores/event.ts`
    - `base/src/components/eventcreate/EventDetailCard.vue`
    - `base/src/components/pages/cart.vue`
  - DI 前例（分岐なし・流用元）:
    - `base/src/composable/managePathResolvers.ts`
- **DI パターンの前例あり**: `managePathResolvers.ts` は「`if==enterprise` を書かず、path 解決関数を user / enterprise 側から注入する」設計。**これが横展開すべき正解パターン**。
- **Functions**: 単一 codebase（`functions/default`）だが `enterprise/` サブフォルダに Callable 15 本が分離済み。残る絡みは **ハイブリッド6関数**（`04` F-5）:
  - `memberOrders.ts` / `stripe.ts` / `stripeWebhook.ts` / `cancelOrders.ts` / `utils/enterpriseSubsidyOrders.ts` / `stores/enterprise.ts`

---

## 1. Authentication（Auth 境界）

### 課題
- エンプラ版にログインすると、PF版URLにもアクセスしてログイン状態になる
- PF版にも「イベント」「コミュニティ」「ともだち」情報が表示されてしまう。食い止めたい

### スコープ整理（重要）— この 2 課題は層が違う

上記 2 つの課題は**別レイヤー**であり、本章で扱うのは前者（Auth 境界）だけである。後者（データ露出）を本章の Auth 対応と混同しないこと。

| 課題 | 層 | v0.2 本書での扱い | 正本 |
|:--|:--|:--|:--|
| エンプラユーザーが PF版にログイン状態になる | **Auth 境界** | 本章 §1 で扱う | v0.2（本書 §1） |
| PF版にエンプラの「イベント/コミュニティ/ともだち」が表示される | **クエリ / Rules フィルタ** | 本章では扱わない | **[10_仕様/02_アーキテクチャ](../10_仕様/02_アーキテクチャ.md)**（PF 露出フィルタ） |

- **後者（データ露出）は Auth では解決しない**。IdP マルチテナンシーを入れても Firestore は単一 DB のままで、`03` §5.1「残る（解決しない）」のとおり blast radius・collectionGroup 越境は A のまま残る。PF 側の全一覧・検索・`collectionGroup` クエリに `enterprise_id == null` を必須化する作業が**別途**必要で、これは **v0.3 §3-1 が正本**。本書ではタスク化しない（二重管理を避ける）。
- したがって「PF版にエンプラが見える」体感課題の主因はクエリ側であり、**IdP だけ入れても消えない**点に注意。

### 対応方針：IdP を採用し、認証モデルだけ v0.2 に前倒し（確定）

[ADR-002_IdP採用とゲスト方針.md](../20_設計判断_ADR/ADR-002_IdP採用とゲスト方針.md) の確定方針に従い、**IdP（Identity Platform マルチテナンシー）を end-state として採用**する。採用理由は ①Auth 混在を構造的に解消、②同一メール衝突が消える、③**企業別 SSO（テナント単位 SAML/OIDC）への唯一の正道**（`07` §1.5）。

ただし「フル IdP を今すぐ全部」ではなく、**移行コストの非対称性**で段階を分ける。

| 選択肢 | 内容 | v0.2 での位置づけ |
|:--|:--|:--|
| (b) claims + Rules + ルートガード | `user_type === 'enterprise'` を PF 側ルートガードで弾く。規律依存だが**可視的な越境ログインを安価に止める** | **Phase 0（暫定・即効。IdP 認証モデルが入るまでの先行防御。PA-03d）** |
| (a) IdP **認証モデル** | テナント onboarding・`getUserIdFromEmail` のテナントスコープ化・`enterprise_id ↔ tenantId` 1:1。エンプラユーザーを**最初からテナント所属で生成**する | **Phase 1（v0.2 内で前倒し・PA-01〜03）** |
| (a) IdP の**ゲスト/SSO/UI** | ゲストフロー（デフォルトプール固定・`07` §3）／企業別 SSO（`07` §1.5）／オープン交流の扉（`07` §5.1）／UI リッチ化 | **Phase 2（後続・移行に鈍感）** |

**なぜ認証モデルを前倒しするか（移行コストの非対称性）**: v0.2 は **sandbox がデータ削除前提**（`03`・`01_再設計`）でテナント作成・作り直しがほぼタダ。一方、本番に企業ユーザーが積まれた後の「プロジェクトレベル uid → テナント uid」移行は**重い難所＋テスト工数大**（PA-02d）。「**エンプラユーザーを最初からテナントに生成しておけば、後から重い移行をしなくて済む**」が前倒しの本質。逆にゲスト/SSO/UI は移行に鈍感なので後続でよい。

**同一メール衝突の扱い**: 現状 `onboarding.ts` の初期管理者作成は `getUserIdFromEmail` でプロジェクト全体の既存ユーザーをチェックしており、PF に同一メールが居ると衝突する。IdP マルチテナンシーなら**テナントごとに uid 名前空間が分かれる**ため、PF とエンプラで別アカウントを自然に共存させられる（衝突が構造的に解消。`07` §4）。

### リファクタ範囲（IdP 認証モデル・A 内で完結）

| 対象 | 現状 | 変更 | フェーズ |
|:--|:--|:--|:--|
| `functions/default/src/enterprise/onboarding.ts` | `createUser` がプロジェクトレベル・同一メール全体衝突 | テナント内ユーザー作成 + 企業ごとテナント作成 | Phase 1 |
| `functions/default/src/stores/user.ts`（`getUserIdFromEmail`） | プロジェクト全体検索 | テナントスコープ検索 | Phase 1 |
| `functions/default/src/enterprise/auth.ts` | `createCustomToken` がプロジェクトレベル | テナント対応（`getAuth().tenantManager().authForTenant(tenantId)...`） | Phase 1 |
| `base/src/firebase.ts` | `auth.tenantId` 未指定 | エンプラアプリでログイン前に `auth.tenantId` を設定 | Phase 1 |
| `enterprise/src/composable/useEnterpriseTenantGuard.ts`（既存） | 論理ガード | テナント前提に拡張 | Phase 1 |

※ B の multi-App 化（`04` T-10 / F-1）は **不要**。単一プロジェクト内のテナント切替で済むのが A の利点。

### 認証モデル着手時に詰める論点（移行の山場）

- **ロールバック**: `onboarding.ts` のテナント作成＋初期管理者＋claims＋`users` doc 生成が連鎖する（PA-02d）。**テナント作成成功・管理者作成失敗時のロールバック**境界を設計する。
- **方式の併存（移行ウィンドウ）**: 現行は `enterprise_id` claim 方式。tenant 方式へ切り替える間、**2 方式が併存する期間**の Rules / トークン判定を整理する。
- **本番の既存ユーザー**: PF に同一メールが既に居るケースの移行手順（sandbox は再作成で可・PA-01e）。本番投入前に認証モデルを入れるのが最も安い。
- **課金試算**: Identity Platform は MAU 課金（`03` §5.1）。有効アカウント数での試算が必要。
- **partner への影響**: partner の横断 read は Admin SDK でテナンシーをバイパスするため原則影響しないが、明示確認が必要。
- **ゲスト身元**: ゲストは**デフォルトプール固定**（テナントに入れない）。これは認証モデル設計時に前提として固定しておく（`07` §3。Phase 2 のゲスト/オープン交流を安価に保つため）。

---

## 2. common のスキーマ（optional 汚染回避）

### 課題
- エンプラ用のフィールドが共有スキーマ（`Event` / `User` / `Community`）で `optional` になってしまう
- 追加仕様が多いエンプラ固有フィールドが optional で増え続け、型システムが「エンプラ時のみ存在」を保証できない

### 対応方針（DB は単一コレクションのまま、**型レイヤーだけ分岐**）

| 手法 | 内容 | 向き |
|:--|:--|:--|
| (a) `z.discriminatedUnion` | `user_type` 等の判別子で「エンプラ時のみ必須」を型強制（既に `CommunityBillSettings` で使用前例あり） | クエリ/書き込み経路の型安全性 |
| (b) base schema + `.extend()` で派生 | `EventBaseSchema` を `EnterpriseEventSchema` が継承（zod 継承） | エンプラ固有の集約 |
| (c) ネスト化 | 散らばった optional を `enterprise: {...}` の 1 オブジェクトに束ね、内側は必須 | 汚染の局所化 |

### 制約と両立条件
- DbSchema（保存型）は同一コレクションに PF / エンプラが同居するため、**read 側は「混在しうる」前提の parse 設計**が必要。「必須化」できるのは主に App / 書き込み経路の型。
- **partner 横断との両立**: partner は「base / PF 形」で読めることが必須（`04` F-3）。エンプラ拡張は **base 形の上位互換（optional 拡張）** に保ち、partner は base 形で parse する設計にする。

→ `04` の T-14（`enterprise_id` required 方針整理）の**コード部分だけ**を A 向けに採用。スキーマ設計は `shokujii-common-schemas` スキルに従う。

### 着手条件（ゲート）と v0.3 との順序依存（重要）

- **採用方式は PoC（PA-10a）と partner 互換テスト（PA-11e）を通過ゲートとする**。`discriminatedUnion` を DbSchema に入れると、プロジェクト規約（`updateXXX` の全フィールド書き戻し・`withConverter`・`optionalDeleteField`）との相互作用、および **partner が混在データを base 形で parse できるか**が論点になる。ここを PoC で確認できるまで PA-11a〜d の本実装に進まない。
| **v0.3 のスキーマ確定** | [ADR-003](../20_設計判断_ADR/ADR-003_publish_scope移行.md) + [10_仕様/04_詳細_イベント管理](../10_仕様/04_詳細_イベント管理.md) で `community.join_type` / `event.publish_scope` 等が確定。PA-11 着手前に G2 を通過すること |

---

## 3. テストとリリース（独立性）

### 課題
- PF版をリリースする時に、エンプラ版のテストをする必要がある
- エンプラ版をリリースする時に、PF版のテストをする必要がある

### 切り分け（重要）— この懸念は「2 つの別々の結合」が混ざっている

「片方をリリースすると他方に影響する／両方テストが要る」は、性質の違う 2 つの結合の同居である。**片方は A のまま完全に消せる**が、**もう片方は部分的にしか消せない**。混同すると「だから B（Project 分離）が要る」と誤って結論しやすい。

| 結合の種類 | 中身 | A での回避可否 |
|:--|:--|:--|
| **デプロイ結合** | エンプラ関数を直すと `--only functions` で **PF 関数まで全再デプロイ**される（コールドスタート・障害巻き込み・リリース独立性なし）。現状 `deploy_functions.yml` の `args: '--force --only functions'` がこの実体 | ✅ **A のまま完全に回避可能**（後述・§6 PA-24） |
| **ロジック結合（テスト結合）** | 共有モジュール（`stores/event.ts` / `stores/memberOrder.ts` / 共通 utils 等）を直すと PF・エンプラ両方に影響 → 両方テスト必須 | △ **「専用部分」は回避可・「真の共有部分」は構造的に残る** |

### A で実現できること / できないこと

**できる①（デプロイ結合の解消・A のまま・Project 分離不要）**

`03` §3.3 の「firebase functions は 1 ディレクトリしかデプロイできない」「デプロイ分割は B 固有」という前提は**正確ではない**。Firebase は Project を分けずにデプロイ単位を割る手段を 2 つ持つ。

- **(a) 選択的デプロイ（最小コスト・即効）**: `firebase deploy --only functions:func1,func2,...` で関数を名前指定でデプロイできる。エンプラ Callable 15 本（`createEnterprise` 〜 `createEnterpriseCommunities`・`index.ts` L53-67）は名前が確定しているため、デプロイ workflow を「エンプラ関数群」「PF 関数群」の 2 系統に割れば、**片方のリリースで他方の関数が再デプロイ・コールドスタートする事象が消える**。sandbox も Project も増えない（= `03` §8.2 が「B の正当なメリット」とした Functions デプロイ独立性を、B のコストを払わずに獲得）。
- **(b) マルチ codebase（同一 Project 内）**: `firebase.json` の `functions` 配列は複数エントリ（`codebase` 違い）を持てる（現状は `default` 1 つ）。`pf` / `enterprise` の 2 codebase に割れば**完全に独立したデプロイ単位**になる。ただし共有層（`_base`）を両 codebase から参照する仕組み（共有パッケージ化 or シンボリックリンク）が要るため (a) より重く、PA-20（ディレクトリ再編）とセット。**(a) を Phase 0、(b) は必要に応じて Phase 2**。

**できる②（ソース整理でテスト結合の影響範囲を可視化）**
- Functions ソースを `functions_base`（共通 stores / utils / trigger）/ `_user` / `_enterprise` の**論理ディレクトリ**へ整理（`04` T-21 のコード部分）。これ自体はデプロイ回数を変えない（デプロイ独立は上記①の選択的デプロイで別途得る）。
- **ハイブリッド6関数**（F-5）の `enterprise_subsidy` 分岐を、`utils/enterpriseSubsidyOrders.ts` のような**純粋関数**へ追い出し、PF フローからは薄く呼ぶ。これで「エンプラ専用ファイルを直した＝エンプラ影響だけ」「共有本体を直した＝両方」とテスト範囲を切り分けられる（テストを分離）。
- CI の `paths` フィルタで、変更パッケージ・変更ファイルに対応するテストだけ走らせる（`pr-verify.yml` 最適化）。エンプラ専用モジュール（`enterprise/*.ts`）のみの変更なら PF テストは不要。
- フロントは enterprise アプリ独立済みのため、**`base` 共有部を変更した時だけ**両方テスト。`base` 変更を DI / composable で減らせばテスト連動も減る（§4）。

**できない（A の構造的限界・真の共有部分は残る）**
- **共有モジュール変更時は両方テストが残る**。`memberOrders.ts` の注文作成トランザクション本体・共通 stores（`stores/event.ts` 等）・共通 utils は PF・エンプラが同じコードを通るため、ここを変えれば両方テストは構造的に必須。純粋関数化（PA-21）で**真に共有している範囲を最小化**するのが現実解で、ゼロにはできない。これは B（Project 分離）に行かない限り残る部分であり、A 継続の生命線は「この共有本体を薄く保てているか」。
- 単一 Rules・単一 DB なので「**Rules 変更時は PF / エンプラ両方テスト**」も残る → **Rules ユニットテストの CI 必須化**で担保（`再検討.md` §7.1 と同じ統制）。

---

## 4. コードベース 分離と共通化（`if==enterprise` 回避）

### 課題
- `(if == エンタープライズ)` のような分岐は絶対に避けたい

### 対応方針：`managePathResolvers` の DI パターンを横展開

分岐を「注入・設定・slot」で吸収し、`base` から `if==enterprise` を排除する。

| 現状の分岐箇所 | 解消アプローチ |
|:--|:--|
| `EventDetailCard.vue`（`isEnterpriseCommunity` で payment 選択肢を切替） | 利用可能な payment 一覧と既定値を **props / composable で注入**。base は「与えられた選択肢を描画」するだけに |
| `base/src/stores/event.ts`（enterprise 分岐） | enterprise 固有ロジックを `enterprise` 側の composable / store へ移し、base は共通 I/F のみ |
| `base/src/components/pages/cart.vue` | 決済方式の戦略を注入（同上） |

- 共通ロジック → `base` / `common`、PF 固有 → `user`、エンプラ固有 → `enterprise`。
- Functions も `functions_base`（共通 stores）+ `_user` + `_enterprise` の論理レイヤ（§3 と同じ整理）。
- **方針**: `if==enterprise` は戦略パターン / 設定注入 / slot で代替する。

---

## 5. Project 分離なし リファクタの「やる / やらない」線引き（最重要）

| 区分 | 項目 | 理由 |
|:--|:--|:--|
| **やる**（コード衛生・infra 不要・高 ROI） | ハイブリッド関数の純粋関数化（§3・既に半分済み）／`if==enterprise` の DI 化（§4・3 ファイル）／Rules CI 必須化／CI paths フィルタ／PF 越境ログインのルートガード（§1 (b)）／**functions 選択的デプロイ分割（§3・PA-24・Project 分離不要）** | A のコスト優位を保ったまま、即効性が高く低リスクな整理。**将来 B へ移行する時にもコード面で地続き** |
| **やる（条件付き・Phase 1）** | IdP **認証モデル**（§1 (a)・PA-01〜03・テナント onboarding/メアド検索のテナント化）／スキーマ型分岐（§2）／functions 論理ディレクトリ整理（§3） | IdP 認証モデルは**移行コストの非対称性**から本番データ前に前倒し（`07` 確定方針）。スキーマは PoC ゲート（PA-10a）と v0.3 確定待ち。ディレクトリ再編は「デプロイ 1 回のまま」なので即効性が薄く後ろでよい |
| **後回し（Phase 2・移行に鈍感）** | IdP の**ゲスト/SSO/UI**（ゲストフロー＝デフォルトプール `07` §3／企業別 SSO `07` §1.5／オープン交流の扉 `07` §5.1）／functions ディレクトリ再編（PA-20b-c） | 認証モデルと違い移行に鈍感。事業ニーズに応じて追加実装すればよい |
| **やらない**（B 固有・infra 分割） | 2 プロジェクト化（`04` T-01〜07）／`base/firebase.ts` の multi-App 化（T-10）／partner Bridge（T-30〜35）／cross-project メニューコピー（T-40） | これらが B の「sandbox ×2・cross-project」コストの実体。A では不要。**注**: `04` T-06「functions デプロイ分割」は **B 固有ではない**。選択的デプロイ（§3 PA-24）で A のまま実現でき、こちらは「やる」に移動した |

**狙い**: Project 分離なし リファクタは「**B のコード整理（モジュール境界・Auth 境界・スキーマ分岐）を、infra 分割コストを払わずに得る**」もの。これをやっておけば、将来トリガー（`03` §9 の事業条件）が来た時の B 移行が、コード面では地続きになる。**ただし「やる」の中でも即効性・リスクで段階を分ける**（§5.1）。

### 5.1 実装フェーズ（最小出荷ライン）

「全部やる」前提ではなく、**ROI・リスク・依存**で 3 段階に切る。Phase 0 を v0.2 の最小出荷ラインとする。

| フェーズ | 含むタスク | 狙い・性質 |
|:--|:--|:--|
| **Phase 0（v0.2 必須・高 ROI / 低リスク・リリース最優先）** | PA-03d（PF 越境ログインのルートガード・暫定防御）／**PA-05（PF 版アカウント作成/ログイン入口の分離・誤作成是正）**／PA-21a〜f（subsidy 分岐抽出＋ユニットテスト・既に半分済み）／PA-30a-b・PA-31a-b（`if==enterprise` の DI 化・3 ファイル）／PA-22a-b・PA-23（CI paths・Rules CI 必須化）／**PA-24（functions 選択的デプロイ分割・デプロイ結合の解消）** | 体感課題の可視部分を抑えつつ、テスト独立性と境界整理を最小コストで獲得。B 移行の `04` T-22 もほぼ完了状態にできる |
| **Phase 1（v0.2 内で前倒し・移行に敏感）** | **IdP 認証モデル**: PA-01a〜e（IdP/テナント有効化・`enterprise_id ↔ tenantId` 設計・移行方針）／PA-02a〜f（テナント onboarding・ログイン・claims・`getUserIdFromEmail` テナント化）／PA-03a〜c（`tenantId` 設定・ログインフロー・guard）。＋スキーマ分岐 PA-10a（PoC）→ PA-11a〜e | **IdP 認証モデルは本番データ前に**（移行コストの非対称性・`07` 確定方針）。エンプラユーザーを最初からテナント生成し将来の重い移行を回避。スキーマは PoC ゲート（PA-10a）＋ v0.3 §1〜§3 確定待ち |
| **Phase 2（後続・移行に鈍感）** | IdP の **ゲストフロー**（デフォルトプール固定・`07` §3／**PA-06 `allow_guest` テナント例外 Rules**）／**企業別 SSO**（`07` §1.5）／**オープン交流の扉**（`07` §5.1）／PA-20b-c（functions の `_base`/`_user`/`_enterprise` ディレクトリ再編） | 認証モデルと違い移行に鈍感。事業ニーズに応じて追加実装 |

- **PF 露出（データ）フィルタ**は本書スコープ外（v0.3 §3-1 が正本）。v0.2 と並行して v0.3 側で対応する前提。
- **ゲスト身元はデフォルトプール固定**（テナントに入れない）を Phase 1 の認証モデル設計時に前提として固定する（`07` §3。Phase 2 のゲスト/オープン交流を安価に保つため）。
- Phase 0 だけでも「越境ログイン抑止・subsidy のテスト分離・`if==enterprise` 撲滅・Rules 安全網」という v0.2 の主目的は達成できる。Phase 1 は「リリースを止めずに、本番データが積まれる前に認証モデルを入れる」マイルストーン。

---

## 6. タスク一覧（実装単位まで細分化）

タスク ID は `PA-xx`（子タスクは `PA-xxa`）。難易度は実装規模感（小 / 中 / 大）。
**現状ヘルパー抽出済み**: `functions/default/src/utils/enterpriseSubsidyOrders.ts` に `assertEnterpriseEventPaymentAllowed` / `getEventEnterpriseId` / `assertActiveEnterpriseMember` / `assertEnterpriseSubsidyOrdersConsistent` / `loadEnterpriseMemberForSubsidy` が抽出済み。PA-21 はゼロからではなく「これを集約しインライン分岐を消す」方向。

### A. 認証（§1）

> **フェーズ（§5.1）**: PA-03d・**PA-05** は **Phase 0**（暫定防御・認証導線の是正・v0.2 必須）。PA-01〜03（IdP 認証モデル＝テナント onboarding・ログイン・claims）は **Phase 1（v0.2 内で前倒し）**＝移行コストの非対称性により本番データ前に入れる（着手前に §1「認証モデル着手時に詰める論点」を確定）。ゲストフロー・SSO・オープン交流（**PA-06** 含む）は **Phase 2**（`07` §3/§1.5/§5.1）。PF 露出（データ）フィルタは本書スコープ外（v0.3 §3-1 が正本）。ゲスト身元は**デフォルトプール固定**（`07` §3）。

| 子ID | タスク | 対象 | 完了条件 | 依存 | 難易度 |
|:--|:--|:--|:--|:--|:--|
| PA-01a | sandbox で Identity Platform 有効化 + マルチテナンシー有効化 | GCP Console | テナント作成可能な状態 | — | 小 |
| PA-01b | テナント 1 個作成し `tenantId` 指定の Email/Password ログイン疎通（最小 HTML） | GCP / 検証用 | `auth.tenantId` 指定でログイン成功 | PA-01a | 小 |
| PA-01c | emulator で Rules の `request.auth.token.firebase.tenant` 参照を検証 | `firestore.rules` / emulator | テナント claim で read 可否が切替 | PA-01b | 中 |
| PA-01d | `enterprise_id` ↔ `tenantId` の対応設計（1:1、`enterprises` doc に `tenant_id` 保持） | `common/src/schemas/Enterprise.ts` | スキーマ・保存場所の確定 | — | 小 |
| PA-01e | 既存エンプラ Auth ユーザーの移行方針（sandbox は再作成、本番は import 手順） | 設計判断 | 移行手順書 | PA-01d | 小 |
| PA-02a | テナント対応 Auth ラッパ util 追加（`authForTenant(tenantId)`） | `functions/default/src/utils/`（新規） | PF / エンプラで使い分けるヘルパー | PA-01d | 中 |
| PA-02b | `confirmEnterpriseEmailLogin` の `createCustomToken` をテナント対応 | `enterprise/auth.ts:151` | テナント発行トークンでログイン | PA-02a | 中 |
| PA-02c | `syncEnterpriseCustomClaims`（`getUser`/`setCustomUserClaims`）をテナント対応 | `enterprise/auth.ts:35-51` | テナント内ユーザーへ claims 付与 | PA-02a | 中 |
| PA-02d | `onboarding.ts` の `createUser` をテナント内作成 + テナント未作成時に作成 | `enterprise/onboarding.ts:135` | 企業作成時にテナント＋初期管理者が生成 | PA-02a, PA-01d | 大 |
| PA-02e | `getUserIdFromEmail` をテナントスコープ版に分離（PF 用と別関数） | `stores/user.ts` | エンプラ検索がテナント内に閉じる | PA-02a | 中 |
| PA-02f | `getValidEnterprisePassCodeFromEmail` 等 email lookup への影響確認 | `stores/passCode.ts` | OTP フローがテナント前提で動く | PA-02e | 小 |
| PA-03a | `base/firebase.ts` に tenantId 設定の仕組み（enterprise アプリから注入） | `base/src/firebase.ts` | エンプラ起動時に `auth.tenantId` セット | PA-01b | 中 |
| PA-03b | ログインフローで `signInWithCustomToken` 前に tenantId 確定 | `enterprise/.../pass-code.vue`・`EmployeeLoginForm.vue` | テナント指定ログインが UI で成立 | PA-03a, PA-02b | 中 |
| PA-03c | `useEnterpriseTenantGuard` をテナント前提に拡張 | `enterprise/src/composable/useEnterpriseTenantGuard.ts` | テナント不一致を遮断 | PA-03a | 小 |
| PA-03d | PF 側で `user_type==='enterprise'` を弾く補助ガード（(b)） | `user` ルートガード / `base` | エンプラユーザーが PF に入れない | — | 小 |
| PA-04 | 同一メール衝突方針の決定（PF / エンプラ別人格を正式化） | 設計判断 | 仕様確定 | PA-01d | 小 |
| PA-05 | **PF 版の「アカウント作成 / ログイン入口の分離」**（未登録メールに即 OTP 送信 → `confirmEmailLogin` で `createUser` してしまう既存課題の是正。`07` §6 残課題4）。IdP 採否と独立した認証バグで、エンプラ誤ログイン・誤作成の温床 | `functions/default/src/user.ts` / PF ログイン UI | 未登録メールで暗黙作成されない（作成導線と認証導線を分離） | — | 中 |
| PA-06 | **`allow_guest` のテナント例外 Security Rules 設計**（テナントを持たない=デフォルトプールの認証ユーザーが、`allow_guest == true` のエンプライベントと**自分の** member/order のみ read/write 可。`07` §3/§5.1/§6 残課題1）。**Phase 2** | Enterprise `firestore.rules`（`allow_guest` 例外） | no-tenant ユーザーの read/write 範囲が `allow_guest` イベント＋本人 doc に限定される | PA-01c, PA-03c | 中 |

### B. スキーマ（§2）

> **フェーズ（§5.1）**: 全体が **Phase 1（条件付き）**。PA-10a PoC・PA-11e partner 互換テストを通過ゲートとし、**v0.3 §1〜§3 のスキーマ確定後**に着手する（§2「着手条件」参照）。

| 子ID | タスク | 対象 | 完了条件 | 依存 | 難易度 |
|:--|:--|:--|:--|:--|:--|
| PA-10a | 3 方式の比較検証（discriminatedUnion / extend / ネスト）を PoC | `common/src/schemas/Event.ts` で試作 | 採用方式の決定 | — | 中 |
| PA-10b | partner 互換要件の確定（base 形 parse の契約・`04` F-3） | partner read 経路 | 互換ルールの明文化 | PA-10a | 小 |
| PA-11a | `Event` のエンプラ拡張を採用方式で再定義（`enterprise_id`/`enterprise_subsidy_settings`） | `common/src/schemas/Event.ts` | エンプラ時必須が型で表現 | PA-10a | 中 |
| PA-11b | `User` の `user_type`/`enterprise_id` を再定義 | `common/src/schemas/User.ts` | 同上 | PA-10a | 小 |
| PA-11c | `Community` のエンプラ拡張 | `common/src/schemas/Community.ts` | 同上 | PA-10a | 小 |
| PA-11d | `EventMember`/`EventMemberOrder`/`EventStripe` の `enterprise_id`・`pay_enterprise_subsidy_amount` | 各スキーマ | 同上 | PA-10a | 中 |
| PA-11e | partner が base 形で parse できる互換テスト追加 | `common` テスト | 混在データで parse 成功 | PA-11a-d, PA-10b | 中 |

### C. テスト・リリース（§3）— 最大の難所

> **フェーズ（§5.1）**: PA-21a〜f（subsidy 分岐抽出＋テスト）・PA-22・PA-23・**PA-24（選択的デプロイ分割）** は **Phase 0**（最高 ROI）。PA-20b-c（`_base`/`_user`/`_enterprise` ディレクトリ再編）は「デプロイ回数を変えない」ため即効性が薄く **Phase 2**。**デプロイ結合の解消は再編（PA-20）ではなく PA-24（選択的デプロイ）で、テスト独立性は PA-21（純粋関数化）＋ PA-22（CI paths）で先に得る**（§3 の切り分け参照）。

| 子ID | タスク | 対象 | 完了条件 | 依存 | 難易度 |
|:--|:--|:--|:--|:--|:--|
| PA-20a | `_base`/`_user`/`_enterprise` の**境界定義**（どの stores/utils/関数がどこか） | 設計 | 配置表の確定 | — | 中 |
| PA-20b | `enterprise/*` 15 Callable を `_enterprise` へ集約（既存サブフォルダなので移動主体） | `functions/default/src/enterprise/*` | ディレクトリ移動完了 | PA-20a | 中 |
| PA-20c | 共通 stores/utils を `_base` へ集約 | `functions/default/src/stores/*`・`utils/*` | 共通層が明確 | PA-20a | 大 |
| PA-20d | `index.ts` 整理（未エクスポートの `communityManager` 2 本も是正） | `functions/default/src/index.ts` | export 漏れ解消 | PA-20b | 小 |
| PA-21a | `memberOrders.ts` の `enterprise_subsidy` インライン分岐（L91-115, L324-362）を専用関数へ抽出 | `memberOrders.ts`・`enterpriseSubsidyOrders.ts` | PF フローは薄い呼び出しのみ | PA-20a | 大 |
| PA-21b | `stripe.ts` の `enterprise_subsidy` 分岐（L100-, checkout origin L196-）を専用関数へ | `stripe.ts`・`enterpriseSubsidyOrders.ts` | 同上 | PA-20a | 中 |
| PA-21c | `stripeWebhook.ts` のエンプラ metadata 分岐の切り出し | `stripeWebhook.ts` | エンプラ決済後処理が分離 | PA-21b | 中 |
| PA-21d | `cancelOrders.ts` の subsidy 返戻・usage 戻し分岐の切り出し | `cancelOrders.ts` | キャンセル時の subsidy 処理が分離 | PA-21a | 中 |
| PA-21e | `stores/enterprise.ts` の責務整理（`adjustEnterpriseMemberMonthlyUsage` 等の配置） | `stores/enterprise.ts` | 配置確定 | PA-20a | 中 |
| PA-21f | 抽出した純粋関数のユニットテスト整備 | `*.test.ts` | subsidy ロジックが単体テスト可能 | PA-21a-e | 中 |
| PA-22a | `pr-verify.yml` に `paths` フィルタ導入（変更パッケージのみ build/lint/test） | `.github/workflows/pr-verify.yml` | 無関係変更で全テストが走らない | — | 中 |
| PA-22b | base 変更時は user/enterprise 両方テストする例外ルールの明文化 | CI 設定 | 共有層変更の安全策 | PA-22a | 小 |
| PA-23 | Rules ユニットテストの CI 必須化（他社 read 拒否・PF/エンプラ越境の最低ケース） | `firestore.rules` / tests | PR で Rules テスト必須 | — | 中 |
| PA-24a | エンプラ関数群 / PF 関数群の**デプロイ対象リスト確定**（`index.ts` の export 区分・ハイブリッド6関数の扱い） | 設計 | 関数の振り分け表 | — | 小 |
| PA-24b | `deploy_functions.yml` を選択的デプロイ（`--only functions:<names>`）の 2 系統に分割 | `.github/workflows/deploy_functions.yml` | 片方リリースで他方関数が再デプロイされない | PA-24a | 中 |
| PA-24c | （任意・将来）マルチ codebase 化の評価（共有層 `_base` の取り込み方式・PA-20 と整合） | `firebase.json` / 設計 | codebase 分割の要否判断 | PA-20a | 中 |

### D. コードベース分離（§4）

> **フェーズ（§5.1）**: 全体が **Phase 0**。対象は 3 ファイルのみで `managePathResolvers` の前例どおり戦略注入に置換でき、小さく確実に `if==enterprise` を消せる。

| 子ID | タスク | 対象 | 完了条件 | 依存 | 難易度 |
|:--|:--|:--|:--|:--|:--|
| PA-30a | `EventDetailCard.vue` の payment 選択肢を props/composable で注入する I/F 設計 | `base/.../EventDetailCard.vue` | 注入 I/F の確定 | — | 中 |
| PA-30b | user/enterprise から payment 選択肢・既定値を注入（`isEnterpriseCommunity` 分岐除去） | `user`・`enterprise` 呼び出し側 | base から enterprise 分岐消滅 | PA-30a | 中 |
| PA-31a | `base/src/stores/event.ts` の enterprise 分岐を DI/戦略注入に置換 | `base/src/stores/event.ts` | base が共通 I/F のみ | PA-30a | 中 |
| PA-31b | `base/src/components/pages/cart.vue` の決済方式分岐を戦略注入に | `base/.../cart.vue` | 同上 | PA-30a | 中 |

---

## 7. クリティカルパス（フェーズ別・暫定）

**Phase 0（v0.2 最小出荷ライン）— ここを最優先で完了させる**

1. **PA-21a（→ PA-20a 境界定義は最小限）→ PA-21b-f memberOrders / stripe 分岐抽出＋ユニットテスト**（最大の難所・F-5・最高 ROI）
2. **PA-30a → PA-30b / PA-31a-b `if==enterprise` の DI 化**（3 ファイル）
3. **PA-03d PF 越境ログインのルートガード**（可視課題の安価な解）／**PA-05 PF 版アカウント作成・ログイン入口の分離**（誤作成是正・IdP 独立）
4. **PA-22a-b / PA-23 CI paths・Rules CI 必須化**
5. **PA-24a-b functions 選択的デプロイ分割**（デプロイ結合の解消・Project 分離なしでリリース独立性を獲得・PA-21 の純粋関数化と相補）

**Phase 1（v0.2 内で前倒し・移行に敏感）**

6. **PA-01a〜e → PA-02a〜f → PA-03a〜c IdP 認証モデル**（テナント onboarding・ログイン・claims・`getUserIdFromEmail` テナント化）。**本番に企業ユーザーを積む前に**入れる（移行コストの非対称性・`07` 確定方針）。着手前に §1「認証モデル着手時に詰める論点」を確定。
7. **PA-10a PoC →（ゲート通過後）PA-11a-e スキーマ分岐**（partner 互換 PA-10b/PA-11e が両立条件・v0.3 §1〜§3 確定後）

**Phase 2（後続・移行に鈍感）**

8. **IdP のゲストフロー（デフォルトプール固定・`07` §3）／企業別 SSO（`07` §1.5）／オープン交流の扉（`07` §5.1）**
9. **PA-20b-c functions ディレクトリ再編 ＋ PA-24c マルチ codebase 化（必要時）**

**山場（細分化で判明）**:
- **PA-21a（memberOrders の分岐抽出）** が functions 系の山場であり、**Phase 0 の本丸**。`enterprise_subsidy` 分岐が注文作成トランザクションの内側（在庫ループ・月額上限・usage 更新）に食い込んでおり、「在庫ループと subsidy 計算の責務分離」が必要。ここを綺麗にすると、将来 B の `04` T-22（ハイブリッド関数振り分け）がほぼ完了状態になる。
- **PA-02d（onboarding のテナント化）** が認証系の山場で **Phase 1 の本丸**。企業作成と同時にテナント作成・初期管理者作成・claims 付与・`users` doc 作成が連鎖するため、トランザクション境界・ロールバック・方式併存（§1）の設計が要る。**本番データ前に入れる**のが移行コスト最小（`07` 確定方針）。

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-18 | 初版（Project 分離なし リファクタ方針。現状到達点・4 テーマの対応方針・やる/やらない線引き・タスク一覧 PA-01〜31・クリティカルパス） |
| 2026-06-18 | 更新: §6 タスクを実装単位の子タスク（PA-01a〜PA-31b・完了条件/依存付き）へ細分化、§7 クリティカルパスと山場（PA-02d onboarding テナント化・PA-21a memberOrders 分岐抽出）を更新 |
| 2026-06-18 | レビュー反映（オーバーエンジニアリング回避・最小出荷ライン整理）: §0 分岐ファイルの内訳明確化（分岐 3＋DI 例 1）、§1 にスコープ整理（Auth 境界 vs データ露出は層が違う・後者は v0.3 §3-1 が正本）を追加し IdP を段階適用（v0.2 は (b) ルートガード／フル IdP は Phase 2）へ・移行時の未解決論点（ロールバック/方式併存/MAU 課金/partner 影響）を追記、§2 にスキーマ採用ゲート（PA-10a PoC・PA-11e）と v0.3 スキーマ確定待ちの順序依存を追記、§5 線引き表をフェーズ区分へ更新＋§5.1 実装フェーズ（Phase 0/1/2・最小出荷ライン）を新設、§6 各セクションにフェーズ注記、§7 クリティカルパスをフェーズ別へ再編 |
| 2026-06-18 | `07` 確定方針を反映: **IdP を end-state として採用**し、移行コストの非対称性から**認証モデル（テナント onboarding・メアド検索のテナント化）を Phase 1 に前倒し**、ゲスト/SSO/UI を Phase 2 へ。§1 対応方針を「IdP 採用・認証モデル前倒し」に書き換え（リファクタ範囲にフェーズ列追加・移行論点を整理・ゲスト身元はデフォルトプール固定を明記）、§5 線引き表を「Phase 1=IdP 認証モデル＋スキーマ／Phase 2=ゲスト/SSO/UI・ディレクトリ再編」に分割、§5.1・§6 認証注記・§7 クリティカルパスと山場（PA-02d を Phase 1 本丸）を更新 |
| 2026-06-18 | functions リリース結合の精査を反映: §3 に「**デプロイ結合 vs テスト（ロジック）結合**」の切り分け表を追加し、**デプロイ結合は A のまま選択的デプロイ（`--only functions:<names>`）／マルチ codebase で完全に解消できる**ことを明記（`03` §3.3「1 ディレクトリしかデプロイ不可」「デプロイ分割は B 固有」を訂正）。テスト結合は「専用部分＝CI paths で回避可・真の共有本体＝構造的に残る」と整理。§5 線引き表で T-06 を「やらない（B 固有）」から「やる（A でも可）」へ移動、§5.1 Phase 0・§6 C に **PA-24a-c（選択的デプロイ分割・将来のマルチ codebase 評価）** を追加、§7 クリティカルパスを更新 |
| 2026-06-18 | 起票漏れ2件をタスク化（`07` §6 残課題）: §6 A に **PA-05（PF 版アカウント作成/ログイン入口の分離・誤作成是正・Phase 0）** と **PA-06（`allow_guest` テナント例外 Security Rules 設計・Phase 2）** を追加。§5.1 フェーズ表・§6 A フェーズ注記・§7 クリティカルパスに反映 |
