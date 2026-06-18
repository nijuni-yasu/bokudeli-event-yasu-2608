# development マージ計画（PF版影響ゼロ）

エンプラ MVP の**最初の関門**＝ `dev/enterprise`（[PR #2071](https://github.com/nijuniinc/bokudeli-event-new/pull/2071)）を `origin/development` へ取り込む実行計画。
`development` は PF 版リリース（v2.10 / v2.11 等）が継続的に載るため、**PF 版への影響をゼロにした状態でマージする**ことを最優先に置く。

> 本書は**実行手順の正本**。タスクの索引・進捗チェックリストは [01_MVP全体計画.md](./01_MVP全体計画.md) **WS-M**（M-1〜M-12 ↔ T1〜T7・着地条件）、RC の正本は [documents/レビューコメント/pr-2071.md](../../レビューコメント/pr-2071.md)、PF 露出仕様は [10_仕様/02_アーキテクチャ](../10_仕様/02_アーキテクチャ.md)（PF 版データ露出フィルタ）および [10_仕様/04_詳細_ゲスト参加](../10_仕様/04_詳細_ゲスト参加.md) §2.1 を参照。

---

## 0. 目的とゴール定義

「PF 版影響ゼロ」を **データの有無に依存しない構造的保護**として定義する。

- 単に「マージ時点で壊れない」だけでなく、**本番に公開エンプラデータが出現しても PF 版が壊れない・エンプラのデータが PF 版に漏れない**状態を作る。
- 対象マージ規模（参考）: 約 265 ファイル変更、うち共有コード（`base` / `common` / `functions` / `*.rules`）62 ファイル・+4842 行。

---

## 1. 確認済み（追加対応不要・後方互換）

| 領域 | 根拠 |
|:--|:--|
| 共有スキーマ | `Event` / `Community` / `User` / `EventMemberOrder` の追加フィールド（`enterprise_id` 等）は**すべて `.optional()`**。PF 版の Zod parse は壊れない（`common/src/schemas/Event.ts` ほか） |
| Firestore Rules | events / communities の read は `docEnterpriseId(data) == null \|\| isSameEnterprise(data)`（`firestore.rules`）。**`enterprise_id` を持たない既存 PF doc は `== null` 分岐で従来どおり read 可**。後方互換 |
| 共有カート | `base/src/components/pages/cart.vue` は `enterprise_id` を claims から取得し、未保持（= PF 版ユーザー）は早期 return。PF 版動線は素通り |

---

## 2. リスク（PF 版トップの一覧クエリ）

「enterprise イベントが PF 版トップに表示される／PF 版が壊れる」の核心。

- PF 版トップ `user/src/pages/index.vue` と一覧 `user/src/pages/communitylist/index.vue` は **`is_public == true` のみで絞り、`enterprise_id` フィルタを持たない**。
- Firestore の collectionGroup クエリは **Rules で読めない doc が結果集合に混入し得るとクエリ全体が permission-denied** になる。
  - → 本番に公開エンプライベント（`is_public=true`）が **1 件でも存在した瞬間、PF 版トップの一覧が丸ごと落ちる**（RC-81 を認証ユーザーに一般化した状態）。
  - → 本番にエンプラ公開データが無ければマージ時点の影響はゼロ。

### 2.1 Firestore の罠：`where('enterprise_id', '==', null)` は効かない

仕様（v0.3 §3-1）の「PF 版クエリに `enterprise_id == null` 必須化」には落とし穴がある。

- `convertEventToDb`（`common/src/schemas/Event.ts`）は optional 値を**書き込まず省略**する。
- Firestore の `== null` は**フィールド欠落の doc をマッチしない**。
- → 既存 PF イベントは `enterprise_id` フィールド自体が無いため、素朴に `where('enterprise_id','==',null)` を足すと **PF 版トップが全件ゼロ表示になる致命的リグレッション**。

**対策（T1）**: PF doc 側に判別子を materialize する。比較対象は次の 2 案。
- (a) **採用**: 既存 PF events / communities を `enterprise_id: null` で**バックフィル** ＋ converter が PF doc にも常に `enterprise_id: null` を書く（以降の新規 doc 対応）。**前提**: `Event` / `Community` / `EventMemberOrder` の `enterprise_id` を schema 上 `null` 許容（`nullable`）へ拡張すること。現行は `NonEmptyStringSchema.optional()` のため `null` を書き込むと withConverter で弾かれる。
- (b) **不採用**: 常在の真偽フラグ（例: `is_enterprise` 既定 false）を導入し、PF クエリは `where('is_enterprise','==',false)` で絞る（schema 変更不要だが、判別用フィールドが増える）

### 2.2 T1 の決定: `enterprise_id: null` 方式を採用

PF / Enterprise の判別を **`enterprise_id` に一本化**し、PF doc には **`enterprise_id: null` を明示保存**する。

| doc | `enterprise_id` | 備考 |
|:--|:--|:--|
| PF community | **`null`（明示保存）** | 既存 PF doc はバックフィルで追加 |
| PF event | **`null`（明示保存）** | 既存 PF doc はバックフィルで追加 |
| Enterprise community | 企業 ID（string） | 作成経路で必ずセット |
| Enterprise event | 企業 ID（string） | 親 community から引き継ぐ |

**採用理由**:

- 判別子を `enterprise_id`（PF = `null` / Enterprise = string）に一本化し、Rules の `docEnterpriseId(data) == null` と同じ概念で扱える。
- 新フィールド（`is_enterprise` / `site_targets` 等）を増やさず、テナント分離と PF 除外を同じフィールドで表現できる。
- schema `nullable` 化と converter 変更、既存 PF doc のバックフィルは必要だが、責務が明確になる。

`enterprise_id: null` も欠落フィールドにはマッチしないため、**既存 PF doc へのバックフィル完了前に PF クエリを切り替えてはならない**。

> **将来（G-1 / MVP 外）**: エンプラゲストイベントの PF 一覧掲載は `allow_guest == true` かつ `publish_scope === 'public'` で判定する（[04_詳細_ゲスト参加](../10_仕様/04_詳細_ゲスト参加.md) §2.1）。MVP マージ（T2）ではクエリ A（`enterprise_id == null`）のみ追加し、エンプラ doc は PF 一覧から除外する。

### 2.3 バックフィル対象

今回の PF トップ・公開コミュニティ一覧を守る目的では、必須対象は **`communities` と `events`**。

- `/communities/{communityId}`: PF コミュニティ一覧 `user/src/pages/communitylist/index.vue` の対象
- `/communities/{communityId}/events/{eventId}`: PF トップ `user/src/pages/index.vue` の `collectionGroup('events')` 対象

`member_orders` / `members` / `stripes` は、PF トップ・公開コミュニティ一覧の露出フィルタ目的では必須対象外。ただし、将来 PF/Enterprise が混在する collectionGroup クエリを同じ方式で絞る場合は、その対象 doc にも `enterprise_id: null` を materialize する。

### 2.4 バックフィル実装リポジトリ

既存データへのバックフィルは本リポジトリ内の Functions / migration script ではなく、バッチ専用リポジトリ [`nijuniinc/bokudeli-event-batch`](https://github.com/nijuniinc/bokudeli-event-batch) で実装・実行する。

本リポジトリ（`bokudeli-event-new`）側の責務は次に限定する。

- `common` schema / converter が PF doc に `enterprise_id: null` を保存・parse できる状態にする（`nullable` 化）
- PF / Enterprise の新規書き込み経路で `enterprise_id` が正しく保存されるようにする（PF = `null`、Enterprise = string）
- PF 一覧クエリを、バックフィル完了後に `where('enterprise_id', '==', null)` へ切り替える
- 必要な Firestore index / Rules / 回帰テストを整備する

`bokudeli-event-batch` 側の責務は次のとおり。

- 既存 `/communities/{communityId}` に `enterprise_id: null` を backfill する（`enterprise_id` フィールドが無い PF doc のみ）
- 既存 `/communities/{communityId}/events/{eventId}` に `enterprise_id: null` を backfill する（同上）
- `enterprise_id` が string として存在する doc（Enterprise）は**触らない**
- dry-run / 件数確認 / 実行ログ / 再実行時の冪等性を持たせる

PF クエリ切替（T2）は、`bokudeli-event-batch` による本番バックフィル完了確認後に実施する。

### 2.5 将来拡張（MVP では見送り）

- **テナント分離**: `enterprise_id`（PF = `null` / Enterprise = string）を維持する。新しい判別フィールド（`is_enterprise` / `site_targets` 等）は導入しない。
- **エンプラゲストの PF 掲載（G-1）**: `allow_guest == true` かつ `publish_scope === 'public'` で判定する（[04_詳細_ゲスト参加](../10_仕様/04_詳細_ゲスト参加.md) §2.1）。PF トップはクエリ A（PF ネイティブ）とクエリ B（エンプラゲスト）をクライアントでマージする。
- **OEM / 地域専用サイト**: §2.6 の `subdomain_tags` 型 **inclusion** モデルを参考に、`enterprise_id == null`（PF 面の土台 exclusion）＋ `subdomain_tags`（OEM inclusion）の二層が考えられる。MVP では見送る。

### 2.6 先行事例: curry（神田カレーグランプリ）

本リポジトリにかつて存在した OEM サイト `curry/`（神田カレーグランプリ向け、`user` と別 hosting）が、**同一 Firestore・複数フロント**での露出制御の実績である（`curry/` は [#1733](https://github.com/nijuniinc/bokudeli-event-new/issues/1733) で削除済み。経緯は [07_リファクタリング/02_curryを削除.md](../../07_リファクタリング/02_curryを削除.md)）。

#### データの持ち方

| 項目 | 内容 |
|:--|:--|
| 判別フィールド | `subdomain_tags: string[]`（`communities` / `events` の両方） |
| タグ値の例 | `'kanda-curry'`（`base/src/locales/messages/ja.ts` の `subdomain_tags`） |
| 導入 | #423（2024-07、コミット `0ce81e05` ほか） |
| イベントへの付与 | イベント作成・編集時、親コミュニティの `subdomain_tags` を候補としてチップ選択し `event.subdomain_tags` に保存（`EventDetailCard`） |
| コミュニティへの付与 | リポジトリ内に設定 UI はなく、運用で Firestore に `['kanda-curry']` 等を設定した想定 |

スキーマ・インデックスは現行も残存する（`common/src/schemas/Community.ts` / `Event.ts`、`firestore.indexes.json` の `subdomain_tags` 複合 index）。

#### 露出の仕組み（PF と curry の両方表示）

| サイト | クエリ方針 | 意味 |
|:--|:--|:--|
| **PF 版（`user`）** | `subdomain_tags` で**絞らない**（`is_public` 等のみ） | タグ付きイベントも PF トップ・一覧に**そのまま表示** |
| **curry 版** | `where('subdomain_tags', 'array-contains', 'kanda-curry')` を追加 | タグ付き doc のみ **inclusion 表示** |

「PF にも curry にも出す」は、**イベント doc に `'kanda-curry'` を含め、PF は無条件表示・curry はタグで絞る**ことで実現していた（#428 ほか）。

#### 本マージの `enterprise_id: null` exclusion との対比

| 観点 | curry（`subdomain_tags`） | 本計画（`enterprise_id: null` exclusion） |
|:--|:--|:--|
| 主目的 | OEM サイト向け **inclusion**（タグがあるものだけ別サイトに出す） | PF 公開面から Enterprise を **exclusion**（Rules 起因の permission-denied 回避） |
| PF 側 | フィルタなし（除外は不要だった） | `where('enterprise_id', '==', null)` が必須 |
| 表現力 | 配列で複数サイト・「両方に出す」に向く | `enterprise_id` で PF / Enterprise の二値。ゲスト PF 掲載は `allow_guest + publish_scope` |
| アプリ構成 | `user` + `curry` の別パッケージ・別 hosting | 単一 `user` + クエリ / Rules 分離 |
| 欠落フィールド | 空配列 `[]` は `array-contains` にマッチしない（curry 側は非表示） | `null` も欠落にはマッチしない → **バックフィル必須**（§2.2） |

#### §2.5 への示唆

将来「地域専用サイト」を再導入する場合、curry 実績は **`subdomain_tags` 型の inclusion モデル**の参考になる。一方、**Enterprise の PF 漏れ・一覧落ち**は curry では起きなかった問題のため、本マージでは `enterprise_id: null` による PF 側 exclusion を優先する。両者を併用するなら、例えば `enterprise_id == null`（PF 面の土台）＋ `subdomain_tags`（OEM inclusion）の二層が考えられるが、MVP では見送る。

---

## 3. プレマージ・チェックリスト（T1〜T7）

| # | タスク | 対象 | 重要度 |
|:--|:--|:--|:--|
| T1 | `enterprise_id: null` の materialize＋既存 PF `communities` / `events` バックフィル（§2.2〜2.4。schema nullable 化含む） | `common` schema / converter・[`bokudeli-event-batch`](https://github.com/nijuniinc/bokudeli-event-batch) | 🚨 前提 |
| T2 | PF 版の全一覧/検索クエリに `where('enterprise_id', '==', null)` 露出フィルタ追加（**T1 完了が条件**） | `user/index.vue`(×3)・`communitylist/index.vue`・`userEventList` ほか | 🚨 必須（F-1） |
| T3 | 複合インデックス追加（`enterprise_id` + `is_public` + 既存 orderBy）。**先行デプロイ**（C-3 後は `publish_scope` へ移行） | `firestore.indexes.json` | 🚨 必須 |
| T4 | Rules 後方互換テスト（PF 版ユーザーが既存 PF doc を read 可・エンプラ doc を read 不可） | `tests/firestore-rules` | 🟡 強く推奨 |
| T5 | member_orders の公開 read 厳格化（共有 collectionGroup） | `firestore.rules` / RC-36 | 🚨 必須 |
| T6 | partner / PF が新 enum `enterprise_subsidy`（`EVENT_PAYMENT_VALUES`）＋ optional 追加を許容して parse できる回帰テスト | `common` / partner | 🟡 推奨（C-5） |
| T7 | 公開 `users` doc が `enterprise_id` を持つことの是非（PF 版から read 可＝プライバシー） | RC-70・要判断 | 🟡 判断 |

---

## 4. マージ戦略とデプロイ順序

| 戦略 | 内容 | 評価 |
|:--|:--|:--|
| A. データゲート（最小マージ） | 後方互換な Rules/スキーマ/functions を先にマージし、**F-1（T1〜T3）が本番に入るまで本番で公開エンプラデータを作らない**運用ゲートを敷く | 速いが脆い。運用ミスで PF 版が落ちる |
| **B. WS-F 同梱（推奨）** | **T1〜T5 をマージに含める**。データの有無に関わらず PF 版が構造的に守られる＝真の「影響ゼロ」 | 安全。本タスクの正しいゴール |

**デプロイ順序（B）**: インデックス（T3）→ Rules（T4 / T5）→ アプリ（T2）。逆順だとクエリが index 待ちで落ちる。

---

## 5. ブランチ戦略

- `dev/enterprise` は **#2071 の決着専用**とし、新規 WS をここに積み増さない（肥大化回避）。
- 着地条件がそろったら **`development` へ 1 回マージして #2071 を閉じる**。

| 着地条件 | 内容 |
|:--|:--|
| 🚨 必須修正の解消 | RC-36 / RC-82 / RC-96（セキュリティ）＋ RC-92 |
| PF 回帰の安全確認 | 共有コード・Rules 変更が PF を壊さない（A-5 の Rules CI が効く状態が理想） |
| 移行敏感機能の隔離 | IdP（WS-B）・スキーマ分岐（WS-C）など未確定なものは #2071 に含めない（含まれていれば別ブランチへ切り出す） |

- **以降の新規作業は `development` から短命トピックブランチを切り、`development` へ直接 PR マージ**する（`dev/enterprise` を経由しない）。
- `development` への**こまめな rebase は常時**行い乖離を抑える。「MVP 完成後に一括マージ」はしない。

---

## 6. 完了条件

- [ ] T1〜T5 が実装・テスト済み（戦略 B）
- [ ] PF 版トップ／コミュニティ一覧が、公開エンプラデータ存在下でも正常表示（permission-denied なし・エンプラ非表示）
- [ ] Rules 後方互換テストがグリーン（既存 PF doc read 可）
- [ ] インデックス先行デプロイ → Rules → アプリの順で本番反映
- [ ] #2071 着地条件（§5）を満たし `development` へマージ

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-19 | 初版（PF 版影響ゼロのマージ計画。`== null` 罠・T1〜T7・戦略 A/B・ブランチ戦略） |
| 2026-06-19 | T1 方針を `is_enterprise` 方式に確定。`enterprise_id: null` 方式との比較、バックフィル対象（`communities` / `events`）を追記 |
| 2026-06-19 | バックフィル実装先を `bokudeli-event-batch` に明記（§2.4・T1 対象更新） |
| 2026-06-19 | 将来拡張（`site_type` enum 等への migrate）を §2.5 に追記 |
| 2026-06-19 | 01 の WS-M セクション追加に伴い、索引先を WS-M（M-1〜M-12）へ明記 |
| 2026-06-19 | §2.6 に curry（`subdomain_tags`）先行事例と `is_enterprise` との対比を追記 |
| 2026-06-19 | T1 方針を `enterprise_id: null` 方式へ再確定。`is_enterprise` / `site_targets` は不採用。ゲスト PF 掲載は `allow_guest + publish_scope`（G-1） |
