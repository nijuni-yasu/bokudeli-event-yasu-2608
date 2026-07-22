# WS-C C-1: スキーマ型分岐 PoC 設計

[01_MVP全体計画.md](../00_計画/01_MVP全体計画.md) **C-1**（旧 PA-10a）の**実装者向け正本**。3 方式比較 PoC と **ゲート G1** 通過条件を定義する。

> **位置づけ（2026-06-27）**
>
> - **C-1（本書）**: MVP 中に実施 — 方式決定 + G1 通過。本番 `Event.ts` 等は **PoC 完了まで変更しない**。
> - **C-4 / G-7 本実装**: Phase 2 — PoC 採用方式で User / Community / EventMember 等を本番配線。
> - **G-5 / G-6**: Phase 2 — `join_type` / `publish_scope` 等 PF 横断フィールド（C-1 とは独立）。

**関連**

| ドキュメント | 内容 |
|:--|:--|
| [01_Project分離なし_タスク.md §2](./01_Project分離なし_タスク.md) | optional 汚染課題・3 方式の概要 |
| [02_Project分離なし_実装計画.md](./02_Project分離なし_実装計画.md) | フェーズ・M2 との関係 |
| [partnerCompat.test.ts](../../../common/src/schemas/partnerCompat.test.ts) | C-5 互換 golden fixture |
| [shokujii-common-schemas SKILL](../../../.agents/skills/shokujii-common-schemas/SKILL.md) | DbSchema / AppSchema 規約 |

---

## 1. 背景と目的

### 1.1 課題

- PF / エンプラは **同一 Firestore コレクション**（`events` / `users` / `communities` 等）を共有する。
- エンプラ拡張（`enterprise_id` / `enterprise_subsidy_settings` / `user_type` 等）が **共有スキーマ上で optional** になり、型システムが「エンプラ時のみ必須」を保証できない（optional 汚染）。
- partner は Admin SDK で横断 read し、**base 形（PF 相当）で parse 成功**することが必須（C-5 ✅）。

### 1.2 C-1 の目的

| 目的 | C-1 で達成 | C-4（Phase 2）で達成 |
|:--|:--|:--|
| 3 方式をコードで比較し **採用方式を 1 つ決定** | ✅ | — |
| **G1 通過**（partner 互換 × 規約 × write 型安全） | ✅ | — |
| 本番 schema / converter / store の差し替え | — | ✅ |
| User / Community / Order への横展開 | 設計メモのみ | ✅ |

### 1.3 MVP との関係

- `publish_scope` / `join_type`（G-5 / G-6）は **Phase 2**。C-1 とは **独立**。
- MVP 出荷は **現行 `is_public` + optional 拡張 + C-5** のまま可能。
- C-1 完了後、**任意（推奨）**で enterprise 書き込み 1 経路だけ strict 化 — **PR-C1b**（§10.2）。G1 は「方式成立」の証明であり、本番 strict 化は PR-C1b / Phase 2 C-4 で段階的に行う。

---

## 2. 採用方針（決定案: **H1**）

### 2.1 方式名

**H1: App 層 write discriminatedUnion + Db 層フラット寛容**

| 層 | スキーマ | 役割 |
|:--|:--|:--|
| **DbSchema** | 現行 `EventDbSchema` 相当（フラット optional） | Firestore 保存形。**変更しない**（partner・EventLog・既存 doc 互換） |
| **AppSchema（read）** | 現行 `EventAppSchema` 相当（寛容） | `fromFirestore` / `Event` constructor。混在 doc を parse |
| **AppSchema（write）** | `EventWriteAppSchema`（discriminatedUnion） | PF / エンプラの**書き込み経路のみ** strict 化 |

### 2.2 却下・温存

| 方式 | 判定 | 理由 |
|:--|:--|:--|
| (a) DbSchema 全体 discriminatedUnion | **PoC で却下** | partner parse・`EventLog` merge（`EventDbSchema.partial()`）・既存 doc が重い |
| (b) base + `.extend()` のみ | **PoC で却下** | optional 汚染が残る |
| (c) Db ネスト `enterprise: { ... }` | **Phase 2 候補** | optional 局所化に有効だが **migrate 必須**。C-4 で再評価 |
| **H1** | **採用** | Db 不変で partner 互換維持。write 経路で型安全を獲得。C-4 への diff 最小 |

### 2.3 判別子（Event）

**`event_payment`** を discriminatedUnion の判別子とする。

| 分支 | `event_payment` | エンプラ固有フィールド |
|:--|:--|:--|
| PF write | `user_advance` / `user_on_day` / `community_bill` | `enterprise_id` は `null` または未設定。`enterprise_subsidy_settings` 禁止 |
| Enterprise write | `enterprise_subsidy` | `enterprise_id: string`（nonempty）**必須**、`enterprise_subsidy_settings` **必須** |

既存の `EVENT_PAYMENT_VALUES` と整合。PF 版は `enterprise_subsidy` を選択不可（A-2 `EventPaymentUiStrategy` で既に UI 禁止）。

### 2.4 型ガード（read 側・補助）

```ts
export type EnterpriseEvent = Event & {
  event_payment: 'enterprise_subsidy'
  enterprise_id: string
  enterprise_subsidy_settings: EnterpriseSubsidySettingsType
}

export function isEnterpriseEvent(e: Event): e is EnterpriseEvent {
  return e.event_payment === 'enterprise_subsidy' && e.enterprise_id != null
}
```

read 側の `Event` クラスプロパティは **現行どおり optional のまま**。strict 性は write schema + type guard で補う。

---

## 3. コード配置・命名・昇格ライフサイクル

**「PoC」は一時ラベル**。本番に残るのは H1（write 型分岐）のみ。`eventSchemaPoC` という名称は **昇格後に消える想定**（§3.3）。

### 3.1 3 層の整理

| 層 | パス（現状 → 昇格後） | 役割 | 寿命 |
|:--|:--|:--|:--|
| **実験場** | `poc/eventSchemaPoC.ts` | A/B/C/H1 比較・G1 テスト。package **export しない** | 一時（H1 抽出後は A/B/C のみ残すか削除） |
| **MVP 部分配線** | → `schemas/eventWrite.ts`（**PR-C1b**） | H1 write schema の本番 export + `eventDraft` 1 経路 strict | **残る** |
| **Phase 2 全面配線** | `Event.ts` 整理 + User/Community 等（**G-7 / C-4**） | 全 Entity 横展開・read/write 責務分離 | Phase 2 |

```
[PR-C1 完了]  poc/eventSchemaPoC.ts（比較ラボ + H1）
       │
       ├─ PR-C1b（MVP・推奨）─→ eventWrite.ts（H1 抽出・export）
       │                        eventDraft.ts（Enterprise write parse 1 経路）
       │
       └─ Phase 2 G-7（C-4）──→ Event/User/Community 本番配線
                                poc/ の A/B/C は削除 or 比較テストのみに縮小
```

| 段階 | G1 の意味 | 本番 strict 化 |
|:--|:--|:--|
| **PR-C1 後** | 方式 H1 が成立（テストで証明） | まだ optional 汚染のまま運用可 |
| **PR-C1b 後** | — | エンプラ **書き込み 1 経路**のみ `enterprise_id` / `subsidy_settings` 必須 |
| **Phase 2 C-4** | — | User / Community 等へ横展開、`Event.ts` read/write 整理 |

### 3.2 なぜ `eventSchemaPoC` と感じるか

1 ファイルに **4 種類** が同居しているため。

| 中身 | 例 | 本番に残る？ |
|:--|:--|:--|
| H1 正本 | `EventWriteAppSchema`, `EnterpriseEventWriteAppSchema` | ✅ → `eventWrite.ts` |
| 却下 A | `EventDbSchemaVariantA` | ❌ G1 記録用 |
| 却下 B | `EventWriteExtendOnlySchemaB` | ❌ 同上 |
| 温存 C | `EventNestedWriteSchemaC`, `flattenNestedWriteToFlat` | ❌ Phase 2 再評価 |

本番名は **`eventWrite.ts`**（write 専用 discriminatedUnion）が責務と一致する。`PoC` は **ディレクトリ `poc/` か比較テスト名** にだけ残す。

### 3.3 昇格時のネーミング（PR-C1b 実装時の目安）

| 現在（PoC） | PR-C1b 昇格後 | 備考 |
|:--|:--|:--|
| `poc/eventSchemaPoC.ts`（H1 部分） | `schemas/eventWrite.ts` | common の package export 対象 |
| `poc/eventSchemaPoC.test.ts`（G1-2〜7） | `schemas/eventWrite.test.ts` | H1 回帰 |
| `parseH1EventWrite` | `parseEventWrite` | 本番 API |
| `h1WriteToEvent` | テスト helper または削除 | |
| `poc/`（A/B/C） | `poc/eventWriteApproachComparison.test.ts` または削除 | 却下理由は末尾「G1 判定」に残る |

**触らない（PR-C1b まで）**: `Event.ts`（read/Db）、partner、`eventConverter`。

---

## 4. スキーマ定義（H1 正本 — Event）

**現状のコード**は `common/src/schemas/poc/eventSchemaPoC.ts`（H1 部分）。**package export しない**。  
PR-C1b で `eventWrite.ts` へ移す。Phase 2 C-4 で `Event.ts` 本体整理 + 他 Entity（§8）。

### 4.1 Write 用 discriminatedUnion（H1 核心）

```ts
import { z } from 'zod'
import {
  EVENT_PAYMENT_VALUES,
  EnterpriseSubsidySettingsAppSchema,
} from '../Event.js' // PoC 中は Event から import。昇格時に core へ分割

const PfEventPaymentSchema = z.enum(['user_advance', 'user_on_day', 'community_bill'])

/** PF 書き込み用 — PoC では Event コアのサブセット + 判別 */
const PfEventWriteAppSchema = z
  .object({
    event_payment: PfEventPaymentSchema,
    enterprise_id: z.null().optional(),
    enterprise_subsidy_settings: z.undefined().optional(),
    // + EventCore 必須フィールド（PoC テストでは partnerCompat fixture から導出）
  })
  .strict() // 未知キー禁止は PoC 評価項目（採否は G1-2 で判断）

const EnterpriseEventWriteAppSchema = z.object({
  event_payment: z.literal('enterprise_subsidy'),
  enterprise_id: z.string().nonempty(),
  enterprise_subsidy_settings: EnterpriseSubsidySettingsAppSchema,
  // + EventCore 必須フィールド
})

export const EventWriteAppSchema = z.discriminatedUnion('event_payment', [
  PfEventWriteAppSchema,
  EnterpriseEventWriteAppSchema,
])
```

### 4.2 Db 変換（flatten）

H1 では **Db 形は現行フラットのまま**。write union parse 後、既存 `convertEventToDb` / `Event.toFirestore` と **同一出力**になることを G1-4 で検証。

```
EventWriteAppSchema.parse(draft)
  → Event インスタンス（または plain object）
  → convertEventToDb(event, updated_by)   // 既存関数をそのまま利用
  → EventDbSchema.parse(...)
```

ネスト (c) を Phase 2 で採る場合も、**flatten 関数 1 箇所**に集約する設計とする（C-4 設計メモ）。

---

## 5. 3 方式 PoC の比較実装

PoC テスト `eventSchemaPoC.test.ts` で **同一 fixture** を 3 方式に通し、観点表（§6）を埋める。

| ID | 方式 | PoC 実装の要点 |
|:--|:--|:--|
| **A** | Db discriminatedUnion | `EventDbSchema` を union 化した試作。**partner parse / EventLog** を試験 |
| **B** | extend のみ | `EventBaseAppSchema.extend({ enterprise_id?: ... })`。**write reject テスト** |
| **C** | App nest + Db flatten | write 入力を `{ core, enterprise?: { id, subsidy } }` に。**flatten → 現行 Db** |
| **H1** | App write union + Db flat | §4 の正本 |

---

## 6. 比較観点表（G1 レポートに記載）

| 観点 | A Db union | B extend | C nest+flatten | **H1** |
|:--|:--|:--|:--|:--|
| partner 互換（C-5 fixture） | △〜× | ○ | ○（flatten 正しければ） | **◎** |
| エンプラ write 型安全 | ◎ | △ | ◎ | **◎** |
| class 表面の optional 汚染 | △ | △ | ◎ | △（write のみ ◎） |
| `EventLog` merge 影響 | × リスク | ○ | ○ | **◎**（Db 不変） |
| `optionalDeleteField` / materialize | 要検証 | ○ | 要検証 | **◎**（現行維持） |
| `withConverter` 変更量 | 大 | 中 | 中 | **小** |
| C-4 本実装 diff | 大 | 小（効果も小） | 中〜大 | **中（計画済み）** |

---

## 7. ゲート G1 — 通過条件

PoC テスト + 本書の判定メモで **全項目 ✅** なら G1 通過。`01_MVP全体計画.md` の G1 を ✅ に更新する。

### 7.1 テスト条件（機械判定）

| ID | 条件 | 方法 |
|:--|:--|:--|
| **G1-1** | C-5 fixture（PF 形 / エンプラ subsidy 形）が **現行 `Event` constructor + `EventDbSchema`** で parse 成功 | `partnerCompatTestDummyData` 再利用 |
| **G1-2** | `EnterpriseEventWriteAppSchema` が `enterprise_id` 欠落を **reject** | zod `.safeParse` |
| **G1-3** | `EnterpriseEventWriteAppSchema` が `enterprise_subsidy_settings` 欠落を **reject** | 同上 |
| **G1-4** | `PfEventWriteAppSchema` が `event_payment: 'enterprise_subsidy'` を **reject** | 同上 |
| **G1-5** | H1: write union → flatten → **現行 `toFirestore` 出力と deepEqual**（PF / エンプラ各 1 ケース） | golden 比較 |
| **G1-6** | `EventDbSchema.partial()`（EventLog 用）が **現行どおり merge 可能** | H1 は Db 不変のため自動的に ○。A 方式のみ明示試験 |
| **G1-7** | `enterprise_id: null` materialize（T1）が維持される | `Community.test` / `Event.test` 相当の null 明示保存 |

### 7.2 規約チェック（レビュー判定）

| ID | 条件 |
|:--|:--|
| **G1-8** | DbSchema 日付は `TimestampSchema`、AppSchema 日付は `EpochMillisSchema`（[shokujii-common-schemas](../../../.agents/skills/shokujii-common-schemas/SKILL.md)） |
| **G1-9** | `updateXXX` 全フィールド書き戻し・`withConverter` 経路を **PoC 段階では変更しない** 方針が明文化されている |
| **G1-10** | 方式決定理由が §6 表 + 3 行サマリで **05 本文 or PR** に残る |

### 7.3 G1 サマリ（記載テンプレート）

```markdown
## G1 判定（C-1 PoC）

- 採用方式: **H1**（App write union + Db flat）
- partner 互換: G1-1 ✅（C-5 fixture）
- write strict: G1-2〜4 ✅
- toFirestore 同等: G1-5 ✅
- 却下: A（Db union）— 理由: …
- Phase 2 C-4 への引き継ぎ: PR-C1b で `eventWrite.ts`、Phase 2 で User 判別子（§8）
```

---

## 8. 他 Entity の Phase 2 引き継ぎ（PoC メモ）

C-1 PoC の**代表は Event のみ**。以下は G-7（C-4）設計メモとして本書に残す。

| Entity | 推奨判別子 | 備考 |
|:--|:--|:--|
| **User** | `user_type` | 未設定 = PF。union の default 分支設計が必要（C-4 TODO） |
| **Community** | `enterprise_id`（`null` vs `string`） | フィールド少。H1 同型 |
| **EventMember** | `enterprise_id` optional | メンバー doc。enterprise イベント時のみ必須化を write で |
| **EventMemberOrder** | `pay_enterprise_subsidy_amount` + `enterprise_id` | 注文確定スナップショット |

**User 判別子 TODO（C-4 前に解決）**

- `user_type` 未設定 doc が PF に多数存在
- 案: `z.union([PfUserWrite, EnterpriseUserWrite])` + PF は `user_type` 省略可能な **superRefine**、または read/write スキーマ完全分離

---

## 9. MVP  optional 追加ルール（C-1 完了後の運用）

G1 通過後、MVP 開発中にエンプラ固有フィールドを増やす場合:

1. **DbSchema に optional を直足ししない**（Phase 2 C-4 まで）
2. 必ず **`EnterpriseEventWriteAppSchema`（`eventWrite.ts` 昇格後）に追加**し write 経路で必須化
3. PF / partner 経路には載せない
4. C-5 テストに fixture 1 件追加（互換回帰）

---

## 10. 成果物と PR 構成

### 10.1 PR-C1（PoC のみ — 本番挙動変更なし）

| パス | 内容 |
|:--|:--|
| `common/src/schemas/poc/eventSchemaPoC.ts` | A / B / C / H1 試作 |
| `common/src/schemas/poc/eventSchemaPoC.test.ts` | G1-1〜7 自動テスト |
| `documents/08_エンタープライズ/30_リファクタ計画/05_WS-C_C-1_PoC設計.md` | 本書（G1 判定追記） |

**完了条件（C-1 ✅）**

- [x] PoC テスト全緑
- [x] G1 判定メモ（§7.3）を本書末尾に追記
- [x] `01_MVP全体計画.md` の C-1 ✅ / G1 ✅

### 10.2 PR-C1b（MVP 中・推奨）— ✅ 完了

G1 通過後の **自然な次ステップ**。C-4 全面配線（Phase 2）とは別で、エンプラ書き込み 1 経路だけ先に strict 化する。

| パス | 内容 |
|:--|:--|
| `common/src/schemas/eventWrite.ts` | §3.3 に従い H1 を抽出・export（`parseEventWrite` 等） |
| `common/src/schemas/eventWrite.test.ts` | G1-2〜7 相当を移行（`eventSchemaPoC.test.ts` から H1 部分） |
| `base/src/stores/eventDraft.ts` | `prepareEnterpriseEventDraft` 出口で `assertEnterpriseEventDraftStrict` |
| `poc/eventSchemaPoC.ts` | H1 削除後、A/B/C 比較のみ残す（`eventWrite.ts` を re-export） |

**完了条件（PR-C1b）**

- [x] `eventWrite.ts` が common から import 可能
- [x] `eventDraft` 1 経路で write strict 化（判別フィールド: `event_payment` / `enterprise_id` / `enterprise_subsidy_settings`）
- [x] partner / PF / `Event.ts` read 経路は不変

PF / partner / `eventConverter` は **触らない**。

---

## 11. スコープ外（C-1 ではやらない）

- `Event.ts` / `User.ts` 本番クラス構造の変更
- `publish_scope` / `join_type` / `community_type` フィールド追加（G-5 / G-6）
- Db ネスト migrate・backfill
- partner / PF 一覧クエリ変更
- C-5 テストの H1 前提への全面書き換え（C-4 まで現行維持）

---

## 12. 実装順

| 順 | 作業 | 状態 |
|:--|:--|:--|
| 1 | `poc/eventSchemaPoC.ts` — H1 + A/B/C 試作 | ✅ PR-C1 |
| 2 | `poc/eventSchemaPoC.test.ts` — G1-1〜7 | ✅ PR-C1 |
| 3 | `npm -w common run test -- eventSchemaPoC` | ✅ |
| 4 | §7.3 G1 判定を本書末尾に追記 | ✅ |
| 5 | **PR-C1b** — `eventWrite.ts` 昇格 + `eventDraft` strict（§10.2） | ✅ |
| 6 | Phase 2 G-7 — User/Community 横展開 + `Event.ts` 整理 | Phase 2 |

WS-B / WS-D / WS-F と **並行可**。`common` のみ触るため PF デプロイリスクなし。

---

## G1 判定（C-1 PoC — 2026-06-27 実装完了）

- 採用方式: **H1**（App write union + Db flat）
- partner 互換: G1-1 ✅（C-5 fixture × 現行 `Event` / `EventDbSchema`）
- write strict: G1-2〜4 ✅（`EnterpriseEventWriteAppSchema` / `PfEventWriteAppSchema` / union）
- toFirestore 同等: G1-5 ✅（PF / Enterprise golden、`updated_at` 除く deepEqual）
- EventLog: G1-6 ✅（H1 は `EventDbSchema.partial()` 維持）
- null materialize: G1-7 ✅
- 却下 **A**（Db union）— `EventDbSchema.extend` による discriminatedUnion でも enterprise 分支の必須化と `.partial()` 非対応が EventLog / optionalDeleteField 系と両立しにくい。shape 複製は NonEmptyString transform 出力の再 parse 不可
- 却下 **B**（extend のみ）— `enterprise_subsidy` + `enterprise_id` 省略が parse 成功（optional 汚染残存）
- **C**（nest + flatten）— flatten 後 G1-5 同等 ✅。migrate コストあり Phase 2 再評価
- Pf `.strict()` — 未採用（draft 互換優先。判別 + `superRefine` で strict 化）
- Phase 2 C-4 への引き継ぎ: PR-C1b で `eventWrite.ts`、Phase 2 で User 判別子（§8）

実装（PR-C1）: [`eventSchemaPoC.ts`](../../../common/src/schemas/poc/eventSchemaPoC.ts)、[`eventSchemaPoC.test.ts`](../../../common/src/schemas/poc/eventSchemaPoC.test.ts)（A/B/C 比較 9 tests）  
実装（PR-C1b）: [`eventWrite.ts`](../../../common/src/schemas/eventWrite.ts)、[`eventWrite.test.ts`](../../../common/src/schemas/eventWrite.test.ts)（H1 回帰 10 tests）、[`eventDraft.ts`](../../../base/src/stores/eventDraft.ts)

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-06-27 | **PR-C1b 完了** — `eventWrite.ts` 昇格、`eventDraft` strict、`poc/` は A/B/C 比較のみ |
| 2026-06-27 | G1 通過 — PoC 実装・テスト追加（§G1 判定追記） |
| 2026-06-27 | 初版（H1 採用案・G1 条件・PoC スコープ・PR 構成。3 軸/publish_scope 延期後の C-1 MVP 前倒し） |
