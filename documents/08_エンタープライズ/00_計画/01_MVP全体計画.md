# エンプラ MVP 全体計画（統合バックログ）

3 つの正本ファイルに散在する MVP タスクを、フェーズ・ゲート・依存・クリティカルパスとして 1 枚に統合する。
**本書はタスクの索引・順序・実装進捗のチェックリスト**に徹する。各タスクの詳細は出所の正本を参照する（本書に本文を複製しない）。

## 進捗の見方

| 記法 | 意味 |
|:--|:--|
| `- [ ]` | **未完了**（未着手、または一部のみ完了） |
| `✅` | **完了**（受け入れ条件を満たし、本番投入可能な状態） |

- チェックは **実装完了** を表す。仕様書の確定だけでは ✅ にしない（ゲート G2 は例外 — 下記）。
- 一部完了の場合は `- [ ]` のまま、**メモ** 行に進捗を書く。
- 正本の詳細・受け入れ条件は `出所` 列のリンクを参照。
- v0.1 で既に入っている基盤（オンボーディング・OTP・全社管理者・subsidy 決済・監査ログ**書き込み**等）は [90_アーカイブ/v0.1原典/11_未実装洗い出し](../90_アーカイブ/v0.1原典/11_エンタープライズ_v0.1未実装洗い出し.md) §実装済みを参照。**本書のチェック対象は残タスク**。

> 設計判断の経緯は [20_設計判断_ADR/](../20_設計判断_ADR/)（[ADR-001](../20_設計判断_ADR/ADR-001_Project分離なし.md) Project 分離なし・[ADR-002](../20_設計判断_ADR/ADR-002_IdP採用とゲスト方針.md) IdP 採用）を参照。
> 最初の関門である `dev/enterprise` → `development` マージの実行手順は [02_developmentマージ.md](./02_developmentマージ.md)（PF 版影響ゼロ）を参照。

---

## 進捗サマリ

最終更新: **2026-06-27**（WS-B B-1〜B-6 ✅、C-1 PoC + G1 通過。3 軸モデル・publish_scope 移行は Phase 2 継続）

| 区分 | 完了 | 未完了 | 計 |
|:--|--:|--:|--:|
| WS-A（Phase 0） | 5 | 1 | 6 |
| WS-B（IdP・本番前） | 6 | 0 | 6 |
| WS-C（スキーマ・MVP 最小） | 2 | 0 | 2 |
| WS-D（v0.1 残） | 0 | 5 | 5 |
| WS-E（前倒し） | 0 | 5 | 5 |
| WS-F（PF 露出） | 0 | 2 | 2 |
| **WS-M（development マージ）** | **7** | **5** | **12** |
| WS-G（Phase 2・MVP 外） | 0 | 8 | 8 |
| **WS-A〜F 全タスク** | **11** | **13** | **24** |
| ゲート G1〜G3 | 3 | 0 | 3 |
| 本番ブロッカー RC | 4 | 0 | 4 |

---

## 正本マップ（タスクの出所）

| 出所 | 役割 | 含むもの |
|:--|:--|:--|
| [00_計画/02_developmentマージ.md](./02_developmentマージ.md) | **#2071 マージ実行**（PF 版影響ゼロ） | WS-M（T1〜T7・デプロイ順・着地条件） |
| [10_仕様/](../10_仕様/) | MVP 機能仕様（現行正本） | WS-D 各タスクの詳細 |
| [30_リファクタ計画/01・02・05](../30_リファクタ計画/01_Project分離なし_タスク.md) | コード衛生・認証モデル・**C-1 PoC** | PA-01〜31（Phase 0/1/2）、[05_WS-C_C-1_PoC設計](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md) |
| [10_仕様/04_詳細_イベント管理](../10_仕様/04_詳細_イベント管理.md) + [ADR-003](../20_設計判断_ADR/ADR-003_publish_scope移行.md) | 機能拡張・スキーマ | 3 軸モデル / publish_scope / MVP 前倒し / PF 露出フィルタ |

---

## 統合バックログ（チェックリスト）

ID は本書の通し番号。`出所` で正本の元 ID（PA-xx / D-xx / T-xx / §）を辿れる。

### WS-M: development マージ（最初の関門・PR #2071）

`dev/enterprise` → `development` への取り込み。**PF 版影響ゼロ**を構造的に満たすプレマージ作業。
詳細（`enterprise_id == null` 罠・materialize・バックフィル責務分界・戦略 A/B・ブランチ戦略）の正本は [02_developmentマージ.md](./02_developmentマージ.md)。

| 状態 | ID | タスク | 02 | 紐付け | 重要度 | 依存 |
|:--|:--|:--|:--|:--|:--|:--|
| - [ ] | M-1 | `enterprise_id: null` の materialize（schema nullable 化 / converter）＋既存 PF `communities` / `events` バックフィル | T1 | F-1 | 🚨 前提 | — |
| ✅ | M-2 | PF 版の全一覧/検索クエリに `where('enterprise_id','==',null)` 露出フィルタ追加 | T2 | F-1 | 🚨 必須 | M-1 |
| ✅ | M-3 | 複合インデックス追加（`enterprise_id` + `is_public` + 既存 orderBy）。**先行デプロイ**（Phase 2 G-6 後は `publish_scope` 版を追加） | T3 | — | 🚨 必須 | M-1 |
| ✅ | M-4 | Rules 後方互換テスト（PF ユーザーが既存 PF doc を read 可・エンプラ doc を read 不可） | T4 | A-5 | 🟡 強推 | — |
| ✅ | M-5 | member_orders の公開 read 厳格化（共有 collectionGroup） | T5 | RC-36 / F-1 | 🚨 必須 | — |
| ✅ | M-6 | partner / PF が `enterprise_subsidy` enum ＋ optional 追加を parse できる回帰テスト | T6 | C-5 | 🟡 推奨 | — |
| ✅ | M-7 | 公開 `users` doc の `enterprise_id` 保存の是非（プライバシー・PF 露出） | T7 | RC-70 | 🟡 判断 | — |

**メモ（責務分界）**

- **M-1（本リポジトリ）**: ✅ `Event` / `Community` schema nullable 化・converter materialize・`Event.test.ts` / `Community.test.ts` 済。**未**: 本番バックフィル完了確認。`member_orders` 等は T1 batch 外 — [02 §2.3.1](./02_developmentマージ.md#231-member_orders--members--stripes-t1-対象外と将来-backfill)
- **M-1（[`bokudeli-event-batch`](https://github.com/nijuniinc/bokudeli-event-batch)）**: `tasks/0043_backfill_enterprise_id_null.js` あり。**本番実行・完了確認待ち**。M-2 切替はバックフィル完了後（02 §2.4）。
- **M-2**: ✅ `user` の PF 一覧・検索・collectionGroup クエリに `enterprise_id == null` を追加済み（index・communitylist・profile・community 詳細・manage 系・`userEventList`）。**本番反映は T1 backfill 完了後**（§2.4）。
- **M-2〜M-3**: F-1 のマージ必須サブセット。F-1 全体（他 collectionGroup 等）は WS-F で継続追跡。
- **デプロイ順（戦略 B）**: M-3 → M-4 / M-5（Rules）→ M-2（アプリ）。02 §4 参照。

**WS-M 完了条件**（02 §6・§5 着地条件）

- [ ] **M-8** M-1〜M-5 がすべて ✅（戦略 B: WS-F 同梱マージ）。現状 M-2〜M-5 ✅、M-1（本番 backfill）未完
- [ ] **M-9** PF 版トップ／コミュニティ一覧が、公開エンプラデータ存在下でも正常表示（permission-denied なし・エンプラ非表示）
- ✅ **M-10** Rules 後方互換テストがグリーン（`tests/firestore-rules/src/enterprise.test.ts`）
- [ ] **M-11** 本番反映順: インデックス（M-3）→ Rules（M-4 / M-5）→ アプリ（M-2）
- [ ] **M-12** #2071 着地 — 本番ブロッカー RC-36 / RC-82 / RC-96 / RC-92 解消 ＋ `development` へマージ（RC 4 件 ✅。**残**: M-1 本番 backfill・M-8〜M-11）

> M-7: `users` に `enterprise_id` を載せる方針で判断完了（RC-70 受容）。M-6 はマージブロッカーではない（02 §3）。

### WS-A: コード衛生・リリース独立（Phase 0・即着手・高 ROI）

| 状態 | ID | タスク | 出所 | MVP | 依存 |
|:--|:--|:--|:--|:--|:--|
| ✅ | A-1 | memberOrders / stripe の subsidy 分岐を純粋関数へ抽出＋ユニットテスト（本丸） | PA-21a〜f | 前提 | — |
| ✅ | A-2 | `if==enterprise` の DI 化（base 3 ファイル） | PA-30a-b / PA-31a-b | 前提 | — |
| ✅ | A-3 | PF 越境ログインのルートガード（暫定防御） | PA-03d | 必須 | — |
| - [ ] | A-4 | PF 版アカウント作成 / ログイン入口の分離（誤作成是正） — **WS-A スコープ外**（[#2090](https://github.com/nijuniinc/bokudeli-event-new/issues/2090) で別途実装） | PA-05 | 必須 | — |
| ✅ | A-5 | CI paths フィルタ＋ Rules CI 必須化 | PA-22a-b / PA-23 | 必須 | — |
| ✅ | A-6 | functions 選択的デプロイ分割（デプロイ結合の解消） | PA-24a-b | 必須 | — |

**メモ（一部進捗）**

- **A-1**: ✅ [#2119](https://github.com/nijuniinc/bokudeli-event-new/issues/2119)。`addEnterpriseSubsidyMenusToCart` 追加・`memberOrders.ts` `addToCart` 委譲。helper テスト追加。
- **A-2**: ✅ `EventPaymentUiStrategy` / `EventDraftPreparer` / `CartMonthlyUsageLoader` 注入完了（`eventPaymentUiStrategy.ts`・`eventDraft.ts`・`cartMonthlyUsage.ts`、base 3 ファイル + enterprise 側 loader）。
- **A-3**: ✅ PF `user` router guard（`enterpriseUserClaims` + `/` リダイレクト + 通知 i18n）。エンプラ `/admin` token とホスト照合（RC-96）も ✅。
- **A-4**: [#2090](https://github.com/nijuniinc/bokudeli-event-new/issues/2090)（PA-05）で別イシュー。**WS-A（#2119）スコープ外**。ログイン / 新規登録入口の分離は別ブランチ・別 PR。
- **A-5**: ✅ `pr-verify.yml` paths-filter・enterprise verify。#2119 で `development` branch protection に context `verify` / `test`（Rules CI）登録（[03_branch_protection.md](../../AIエージェント/03_branch_protection.md) §0-3-2b）。
- **A-6**: ✅ `deploy_functions.yml` hybrid / pf / enterprise 3 job 並列 + `workflow_dispatch` 個別発火。

### WS-B: 認証モデル（IdP・Phase 1・本番投入前に前倒し）

| 状態 | ID | タスク | 出所 | MVP | 依存 |
|:--|:--|:--|:--|:--|:--|
| ✅ | B-1 | IdP / マルチテナンシー有効化・tenantId 疎通・Rules tenant 検証 | PA-01a-c | 本番前 | G3 |
| ✅ | B-2 | `enterprise_id ↔ tenantId` 設計・移行方針 | PA-01d-e | 本番前 | G3 |
| ✅ | B-3 | テナント onboarding（企業作成＝テナント＋初期管理者＋claims、本丸） | PA-02d | 本番前 | B-1, B-2 |
| ✅ | B-4 | auth/claims/メアド検索のテナント化 | PA-02a-c, e-f | 本番前 | B-2 |
| ✅ | B-5 | クライアント tenantId 設定・ログイン UI・guard | PA-03a-c | 本番前 | B-1 |
| ✅ | B-6 | 同一メール衝突方針の正式化 | PA-04 | 本番前 | B-2 |

**メモ**: 現行コードは claims + OTP（project-level `getAuth()`）。IdP テナントは未導入。**仕様正本**: [05_認証・テナント](../10_仕様/05_認証・テナント.md) §0（`tenant_id` / `EnterpriseMember.user_email` / 同一メール共存確定。[#2121](https://github.com/nijuniinc/bokudeli-event-new/issues/2121)）。

### WS-C: スキーマ基盤（MVP: C-1 PoC + C-5。本実装は Phase 2）

| 状態 | ID | タスク | 出所 | MVP | 依存 |
|:--|:--|:--|:--|:--|:--|
| ✅ | C-1 | スキーマ型分岐 PoC（3 方式比較 → **H1 採用** → G1 通過） | PA-10a / [05_WS-C_C-1](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md) | 推奨 | — |
| ✅ | C-5 | partner が base 形で parse できる互換テスト | PA-11e | 必須 | — |

**メモ（2026-06-27 スコープ変更 + C-1 MVP 前倒し）**

- **C-1** は MVP 中に **PoC + G1 のみ**（本番 `Event.ts` 変更なし）。正本: [05_WS-C_C-1_PoC設計.md](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md)。採用案 **H1**（App write discriminatedUnion + Db フラット寛容）。
- **PR-C1b ✅** — `eventWrite.ts` 昇格 + `eventDraft` strict（[05 §10.2](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md#102-pr-c1bmvp-中推奨-完了)）
- **C-2〜C-4・旧 E-1・旧 C-3（publish_scope Migrate）** は **Phase 2（WS-G G-5〜G-7 本実装）** へ移行。PF 横断の理由は前回メモ参照。
- **MVP の公開・参加**: **`is_public`（2 値）** ＋ PF 共有即参加。`publish_scope` / `join_type` は Phase 2。
- **C-5 ✅** — 現行 optional 拡張向け。G-7 本実装後に fixture 拡張。

### WS-D: MVP 機能の未実装（v0.1 残・大半は WS-A〜C と並行可）

| 状態 | ID | タスク | 出所 | MVP | 依存 |
|:--|:--|:--|:--|:--|:--|
| - [ ] | D-1 | メール配信制御（エンプラのイベント/ユーザーに PF 不要メールを送らない） | 10_仕様/04_メール | 必須 | — |
| - [ ] | D-2 | ダッシュボード＋ CSV（月別/メンバー別の回数・人数・金額） | 10_仕様/04_ダッシュボード | 必須 | — |
| - [ ] | D-3 | 監査ログ閲覧 UI＋取得 Callable（書き込みは実装済み） | 10_仕様/04_監査 | 必須 | — |
| - [ ] | D-4 | 課金スナップショット Scheduled Function（毎月 1 日） | 10_仕様/03_課金 | 必須 | — |
| - [ ] | D-5 | マイページ・友人の認可レイヤ（enterprise_id フィルタ） | 10_仕様/04_マイページ | 必須 | — |

**メモ**: D-3 の **writeAuditLog（書き込み）** は v0.1 実装済。`/admin/audit-logs`・`getEnterpriseAuditLogs` は未。**D-2** は MVP では `enterprise_id` ＋ **`is_public`** による一覧・集計で実装可。`publish_scope` クエリへの切替は Phase 2（G-6）後。

### WS-E: 機能拡張・仕様変更（v0.3 MVP 前倒し）

| 状態 | ID | タスク | 出所 | MVP | 依存 |
|:--|:--|:--|:--|:--|:--|
| - [ ] | E-2 | 全社管理者の全イベント編集権限【前倒し】 | D-8 | 必須 | — |
| - [ ] | E-3 | セッションタイムアウト 1 週間【前倒し・v0.1 上書き】 | D-9 | 必須 | — |
| - [ ] | E-4 | マイページ：福利厚生割の利用状況表示【前倒し】 | D-10 | 必須 | — |
| - [ ] | E-5 | コミュニティ一括作成のデフォルト画像ランダム付与 | D-11 | 必須 | — |

**メモ**: **E-1**（参加方式 `join_type`）・**E-6**（`access_password`）は **WS-G G-5 / G-6** へ移行（Phase 2）。**E-3** は `useSessionTimeout` あり（現状 1 時間）。仕様の 1 週間には未対応。

### WS-F: PF 版データ露出フィルタ（v0.3 §3・MVP 必須・独立）

| 状態 | ID | タスク | 出所 | MVP | 依存 |
|:--|:--|:--|:--|:--|:--|
| - [ ] | F-1 | PF の全一覧・検索・collectionGroup に `where('enterprise_id', '==', null)` を必須化。T1 batch は `communities` / `events` のみ — `member_orders` 等は [02 §2.3.1](./02_developmentマージ.md#231-member_orders--members--stripes-t1-対象外と将来-backfill)。エンプラゲストの PF 掲載（`allow_guest && publish_scope === 'public'`）は **G-1 / MVP 外**（[04_詳細_ゲスト参加](../10_仕様/04_詳細_ゲスト参加.md) §2.1） | §3-1 | 必須 | — |
| - [ ] | F-2 | 未ログイン時はエンプラ画面をログインへリダイレクト（ゲスト参加=allow_guest による未ログイン閲覧例外は MVP 外・将来対応） | §3-2 | 必須 | — |

**メモ（F-1 残）**: T2 一覧は ✅。共有 store の CG（`event.ts` `event_id` 横断、`currentUser` カート等）は §3 メモ・[02 §2.3.1](./02_developmentマージ.md#231-member_orders--members--stripes-t1-対象外と将来-backfill)。当該 CG に `== null` を載せる前に batch + PF 書き込み経路の materialize が必要。

### WS-G: Phase 2（MVP 外・PF/エンプラ横断含む）

| 状態 | ID | タスク | 出所 | 旧 WS | 依存 |
|:--|:--|:--|:--|:--|:--|
| - [ ] | G-5 | **3 軸モデル実装**（`join_type` / `auto_join_on_event_order` / `community_type`）＋参加方式 UI・Rules（approval / open）。**PF 版と合わせて設計**（PF も承認制参加を入れる場合は同時） | D-1〜D-5 / E-1 | 旧 C-2, E-1 | G2 |
| - [ ] | G-6 | **`publish_scope` 導入・`is_public` 段階廃止**（expand → migrate → contract）。PF/エンプラ横断 Migrate・インデックス切替 | D-6 / ADR-003 | 旧 C-3 | G-5（推奨） |
| - [ ] | G-7 | **C-4 本実装** — H1（C-1 採用）で Event/User/Community/EventMember 再定義 + partner 互換テスト拡張 | PA-11a-e | 旧 C-4 | **G1**, G2 |
| - [ ] | G-1 | ゲスト参加（デフォルトプール固定）＋ allow_guest テナント例外 Rules ＋ PF 掲載（`allow_guest == true` かつ `publish_scope === 'public'` をクエリ B で取得し PF 一覧とマージ） | PA-06 / ADR-002 §3 / [04_詳細_ゲスト参加](../10_仕様/04_詳細_ゲスト参加.md) §2.1 | — | G-6 |
| - [ ] | G-8 | パスワード保護 `access_password`（アクセス付与基盤） | D-6a / D-6b / ADR-003 §4 | 旧 E-6 | G-6 |
| - [ ] | G-2 | 企業別 SSO（テナント単位 SAML/OIDC）／オープン交流の扉 | ADR-002 §1.5 / §5.1 | — | — |
| - [ ] | G-3 | functions の _base/_user/_enterprise 再編・マルチ codebase | PA-20b-c / PA-24c | — | — |
| - [ ] | G-4 | 機能 ON/OFF（feature_flags）・トップバナー | D-12 | — | — |

**メモ（G-5〜G-7 の推奨順）**: **MVP: C-1 PoC → G1** →（Phase 2）**G-7 本実装（C-4）** → G-5 → G-6 → G-1 / G-8。C-1 正本: [05_WS-C_C-1_PoC設計](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md)。

> ゲスト参加（G-1）は v0.1 `01` では MVP 記載だったが **MVP 外に確定**。3 軸モデル・publish_scope も **2026-06-27 時点で MVP 外（Phase 2）に確定**。

---

## ゲート（通過まで本実装に進まない）

| 状態 | ゲート | 判定内容 | 影響 |
|:--|:--|:--|:--|
| ✅ | **G1**: スキーマ PoC | discriminatedUnion × プロジェクト規約 × partner 互換 — **C-1**（[05_WS-C_C-1](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md)） | **G-7（C-4 本実装）着手可** |
| ✅ | **G2**: スキーマ確定 | [ADR-003](../20_設計判断_ADR/ADR-003_publish_scope移行.md) + [10_仕様/04_イベント管理](../10_仕様/04_詳細_イベント管理.md) で publish_scope / join_type / auto_join が固まったか | **G-5〜G-7 着手可否**（Phase 2・仕様のみ MVP 前確定済） |
| ✅ | **G3**: IdP 着手前論点 | ロールバック境界・方式併存・MAU 課金試算・partner 影響 | WS-B 全体の着手可否 |

> **G3（2026-06-27 通過）**: ロールバック・併存・lookup 分離は [05_認証・テナント](../10_仕様/05_認証・テナント.md) §0 / [04_WS-B](../30_リファクタ計画/04_WS-B認証モデル詳細設計.md)。MAU は [07_デプロイ・運用](../10_仕様/07_デプロイ・運用.md) §9.1 — MVP は 50k MAU 無料枠内、超過見込み時は Shokujii 収益で IdP 従量課金を許容（延期フォールバック不採用）。Rules CI は A-5 ✅。

> **G1（2026-06-27 通過）**: H1（App write discriminatedUnion + Db flat）採用。[05_WS-C_C-1_PoC設計](../30_リファクタ計画/05_WS-C_C-1_PoC設計.md) 末尾 G1 判定。実装 `eventWrite.ts`（PR-C1b）、比較 PoC `poc/eventSchemaPoC.ts`。

> **G2** は仕様・ADR レベルで通過。**コード反映は Phase 2（WS-G G-5〜G-7）**。MVP は現行 `is_public` ＋ optional 拡張（C-5 ✅）で出荷する。

---

## フェーズ統合

| フェーズ | 含むワークストリーム | 完了の意味 |
|:--|:--|:--|
| **Merge** | **WS-M** | #2071 を PF 版影響ゼロで `development` へ取り込み |
| Phase 0 | WS-A（A-4 を除く本ブランチ分 ＋ A-4 は #2090 別 PR）／ WS-F（独立着手可） | リリース独立・テスト独立・越境ログイン抑止・PF 露出防止 |
| Phase 1 | WS-B（**B-1〜B-6 ✅**）／ WS-C（**C-1 ✅**、**G1 ✅**、C-5 ✅） | 本番投入の認証基盤 ＋ 型分岐方式確定 |
| MVP 仕上げ | WS-D（v0.1 残 5 件）／ WS-E（E-2〜E-5）／ WS-F 仕上げ | MVP 機能の完成（`is_public`・即参加モデル） |
| Phase 2 | WS-G（3 軸・publish_scope・ゲスト等） | PF/エンプラ横断の機能拡張 |

**フェーズ完了チェック**

- [ ] **WS-M 完了** — M-1〜M-12 全項目 ✅（最初の関門）
- [ ] **Phase 0 完了** — WS-A 全項目 ✅（**A-4 は [#2090](https://github.com/nijuniinc/bokudeli-event-new/issues/2090) 別 PR で可**）＋ WS-F の F-1・F-2 ✅
- [x] **Phase 1 完了** — WS-B 全項目 ✅ ＋ WS-C（**C-1** ✅、C-5 ✅）＋ **G1** ✅
- [ ] **MVP 仕上げ完了** — WS-D・WS-E（E-2〜E-5）・WS-F 全項目 ✅
- [ ] **本番ブロッカー RC 全解消** — 下記 §本番ブロッカー 全項目 ✅

WS-D の大半（D-1 メール・D-3 監査ログ UI・D-4 課金 snapshot・D-5 認可・D-2 ダッシュボード）は WS-B と**並行可**。D-2 は MVP では `is_public` ベースの一覧・集計で実装する。

---

## クリティカルパス

```
[Merge]   M-1（enterprise_id: null + バックフィル）→ M-3 → M-4/M-5 → M-2 ─→ #2071 着地
[Phase 0] A-1（memberOrders 分岐抽出・本丸）──┐
          A-2/A-5/A-6 ───────────────────────┼─→ Phase 0 完了
[Phase 1] G3 → B-2 → B-3（onboarding テナント化・本丸）─→ 本番投入可
          C-1（PoC）→ G1 ─→ 方式 H1 確定（WS-B/D/F と並行可）
[MVP]     D-1・D-2・D-3・D-4・D-5・E-2〜E-5・F-1（並行・独立）
[Phase 2] G-7（C-4 本実装）→ G-5（3 軸）→ G-6（publish_scope Migrate）→ G-1 / G-8
```

- 2 大山場: **A-1（Phase 0）** と **B-3（Phase 1）** は独立。人員 2 系統なら同時進行可。
- MVP クリティカルパス: **M-1 backfill 完了 → #2071 着地** と **B-3（IdP onboarding）**。
- Phase 2 結節点: **G-5（PF 合わせた参加モデル）→ G-6（PF 横断 publish_scope）**（[ADR-003](../20_設計判断_ADR/ADR-003_publish_scope移行.md)）。

---

## レビュー由来の残課題

[PR #2071](https://github.com/nijuniinc/bokudeli-event-new/pull/2071)（`dev/enterprise`）のレビューコメント評価 [documents/レビューコメント/pr-2071.md](../../レビューコメント/pr-2071.md) から、**MVP / 本番ブロッカーまたは横断的影響あり**のものだけを本書に surface する。RC 118 件の詳細・対応状況の正本は `pr-2071.md`（インライン修正は PR チェックリストで消化）。

### 本番ブロッカー（🚨 必須修正・未実装）

| 状態 | RC | 要約 | 紐付け WS | PF 影響 |
|:--|:--|:--|:--|:--|
| ✅ | RC-36 | member_orders の enterprise 補助情報が公開 read（Rules 分離または非公開保存） | F-1 / A-5 | ◯ 共有 collection |
| ✅ | RC-82 | communities create が任意 enterprise_id 許可（create 時に claims と一致検証） | B-4 / A-5 | △ 共有 Rules |
| ✅ | RC-92 | invoice status≠200 でも blob 処理（エラー時 return） | —（PR 内修正） | — |
| ✅ | RC-96 | `/admin` が token とホスト企業未照合（他社 admin が別ホスト /admin 可能） | A-3 / B-4 | — |

### MVP 前倒し（🟡 計画タスクと重複・要追従）

| 状態 | RC | 要約 | 紐付け WS | PF 影響 |
|:--|:--|:--|:--|:--|
| ✅ | RC-35 | enterprise_subsidy が決済なしで確定可能（confirmOrder 側拒否または補助計算まで受付停止） | A-1 / D-4 | ◯ 共有 functions |
| - [ ] | RC-44 | `/u/:userId` が他社・停止メンバーをゲートなし | D-5 | △ |
| ✅ | RC-48 | カートが PF/他テナント注文を混在表示（enterprise_id 一致のみ） | F-1 | ◯ base 共有 cart |
| - [ ] | RC-86 | 注文 doc の `enterprise_id` は保存済み。`is_guest` は未導入（ゲスト参加 / G-1 → D-2 で追跡） | G-1 → D-2 | ◯ 注文スキーマ |
| - [ ] | RC-28 / RC-87 | enterprises / admin 判定の withConverter なし直読み | A-2 / G-7 | ◯ base store 共有 |

### データ整合・claims 一貫性（🟡 束ねて対応）

| 状態 | RC | 要約 | 備考 |
|:--|:--|:--|:--|
| - [ ] | RC-19 / RC-25 | createEnterprise：saveEnterprise 後 Auth 失敗で孤児 enterprise | 順序変更またはロールバック |
| - [ ] | RC-30 | community 作成と manager 付与が非アトミック | manager 不在コミュニティ残存 |
| - [ ] | RC-56 | CSV メンバー作成：Auth 成功後の失敗時ロールバックなし | createUser 後失敗時に Auth 削除 |
| - [ ] | RC-76 | 最後の管理者チェックが非トランザクション | 同時無効化で admin 0 人 |
| - [ ] | RC-98 / RC-106 / RC-107 | Rules is_active 未確認・claims 先行更新・降格後 token 残存 | WS-B claims 一貫性とセット |

### 本番前運用・仕様判断（⏸ / ❓）

| 状態 | RC | 要約 | 備考 |
|:--|:--|:--|:--|
| ✅ | RC-70 | 公開 users に enterprise_id を保存 | 👌 載せる方針で受容 |
| - [ ] | RC-20 / RC-116 | ログイン前ロゴが Storage 403 | logo 公開 read か URL 方針を [10_仕様/05_認証・テナント](../10_仕様/05_認証・テナント.md) で確定 |
| - [ ] | RC-62 / RC-117 | App Check 未登録・custom_domain が reCAPTCHA allowed_domains 外 | [10_仕様/07_デプロイ・運用](../10_仕様/07_デプロイ・運用.md) 運用手順 |

> UX・リファクタ・format 系（RC-23/24/29/31/50-51/71/80/91/104/114/118 等）は MVP 構造に影響しないため `pr-2071.md` のみで追跡する。

---

## 未決事項

| # | 論点 | 備考 |
|:--|:--|:--|
| ~~Q-1~~ | ~~E-6 パスワード保護を MVP に含めるか~~ | **Phase 2（G-8）へ確定**（ADR-003 §4） |
| ~~Q-2~~ | ~~C-3 community 公開区分を PF 版へ展開するか~~ | **Phase 2（G-6）で PF/エンプラ横断 Migrate 時に判断** |
| Q-3 | dev/enterprise を development へ取り込む段取り | **WS-M** + [02_developmentマージ.md](./02_developmentマージ.md)（PF 版影響ゼロ・戦略 B 推奨） |
| Q-4 | Phase 2 で PF 版にも `join_type: approval`（参加申請）を入れるか | G-5 着手前に PF 版仕様（[10_コミュニティに参加・退会](../../03_参加者獲得/10_コミュニティに参加・退会.md)）と合わせて決定 |

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-18 | 初版（v0.1/11・v0.2/08・v0.3/02 を WS-A〜G に統合。ゲート G1-G3・フェーズ統合・クリティカルパス） |
| 2026-06-18 | 仕様現行化: 正本を 10_仕様 / ADR-003 へ。G2・WS-D 出所を更新 |
| 2026-06-18 | PR #2071 レビュー由来の残課題セクションを追加（pr-2071.md を正本） |
| 2026-06-19 | development マージ計画を 02 に分離。WS-F F-1 注記・Q-3 を 02 参照に更新 |
| 2026-06-19 | チェックリスト形式へ移行（状態列・進捗サマリ・フェーズ完了チェック・初期進捗メモ） |
| 2026-06-19 | WS-M（development マージ）セクション追加。02 の T1〜T7 を M-1〜M-7、着地条件を M-8〜M-12 に索引化 |
| 2026-06-19 | PF 露出方針を `enterprise_id: null` materialize へ更新。ゲスト PF 掲載は `allow_guest + publish_scope`（G-1） |
| 2026-06-19 | 実装照合で M-3〜M-7・M-10・C-5 を ✅ に更新。記法を `[x]` から ✅ へ統一。M-1・M-2 は一部のみで `[ ]` 維持 |
| 2026-06-19 | M-2 をコード実装完了として ✅ に更新（本番反映は T1 backfill 後） |
| 2026-06-20 | A-4 を #2071 / WS-A ブランチのスコープ外と明記。実装は [#2090](https://github.com/nijuniinc/bokudeli-event-new/issues/2090) 別途 |
| 2026-06-20 | WS-A 実装照合: A-2 / A-3 / A-6 を ✅。A-1 は helper 抽出済・Callable 薄層化残で `- [ ]` 維持。A-5 は repo 内 workflow 済・branch protection 未 |
| 2026-06-20 | RC-35 / RC-82 / RC-92 / RC-96 を ✅ に更新。A-1 メモを RC-35 済・リファクタ残に整理。M-12 は M-1 backfill 待ちが残 |
| 2026-06-20 | RC-48 を ✅ に更新。RC-86 は `enterprise_id` 済・`is_guest` 未として文言を精密化 |
| 2026-06-25 | M-1 / F-1 メモに 02 §2.3.1（member_orders 等 T1 対象外・将来 backfill 条件）へのリンクを追加 |
| 2026-06-27 | #2119: A-1 ✅（addEnterpriseSubsidyMenusToCart）・A-5 ✅。WS-A 5/6 完了（A-4 は #2090） |
| 2026-06-27 | G3 ✅ 通過（MAU 試算確定・IdP 前倒し。07 §9.1 参照） |
| 2026-06-27 | 3 軸モデル・publish_scope 移行（旧 C-2/C-3/E-1/E-6）を Phase 2（WS-G G-5〜G-8）へ延期。MVP は `is_public` ＋ PF 共有即参加 |
| 2026-06-27 | **WS-B B-1〜B-6 ✅** — IdP Phase 1 完了。Phase 1 フェーズ完了チェック ✅ |
| 2026-06-27 | **PR-C1b 完了** — `eventWrite.ts` + `eventDraft` strict |
| 2026-06-27 | **C-1 PoC 実装 + G1 通過**（poc/eventSchemaPoC。H1 採用確定） |
| 2026-06-27 | **C-1 PoC を MVP 前倒し**（05_WS-C_C-1_PoC設計.md。H1 採用案・G1 条件）。G-7 は C-4 本実装のみ |
