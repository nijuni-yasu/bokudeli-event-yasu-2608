# Phase 2 機能拡張計画（WS-H）

MVP 出荷後（2026-07 以降）の **第 2 波** 機能拡張タスク索引。設計正本は [90_アーカイブ/v0.4_機能拡張/02_設計.md](../90_アーカイブ/v0.4_機能拡張/02_設計.md)。

> **既存 Phase 2（3 軸・publish_scope・ゲスト等）** は [01_MVP全体計画.md](./01_MVP全体計画.md) **WS-G**（G-1〜G-8）を参照。本書 WS-H は UX 改善・画面再構成・テンプレート等で、WS-G と独立して先行可能なものを含む。

---

## 正本マップ

| 領域 | 正本 |
|:--|:--|
| 論点バックログ | [v0.4/01_機能拡張案バックログ.md](../90_アーカイブ/v0.4_機能拡張/01_機能拡張案バックログ.md) |
| 設計（ワーキング） | [v0.4/02_設計.md](../90_アーカイブ/v0.4_機能拡張/02_設計.md) |
| 実装仕様（確定後） | [10_仕様/](../10_仕様/) |
| 3 軸モデル（凍結） | [v0.3/02_設計.md §1](../90_アーカイブ/v0.3_機能拡張/02_設計.md) |

---

## 進捗の見方

| 記法 | 意味 |
|:--|:--|
| `- [ ]` | 未完了 |
| `✅` | 完了 |

---

## 推奨着手順

```
H-2（RC-20 ロゴ URL）→ H-1（ヘッダーロゴ）→ H-9（login ヒーロー UI）
H-5（/orders 移行）— H-3（UI 同期）と並行可
H-7（テンプレ設計 doc）→ H-8（テンプレ UI）
G-5 / G-6（WS-G）— コミュニティ承認・限定表示
```

---

## WS-H: Phase 2 第 2 波

### WS-H-A: ブランディング・未ログイン体験

| 状態 | ID | タスク | 出所 | 依存 | パッケージ | Issue |
|:--|:--|:--|:--|:--|:--|:--|
| ✅ | H-2 | **RC-20 確定** — 未ログイン時ロゴ URL 方針（Storage 公開 read / signed URL） | D-13 / [02_設計 §1](../90_アーカイブ/v0.4_機能拡張/02_設計.md) | — | doc, firebase | [#2205](https://github.com/nijuniinc/bokudeli-event-new/issues/2205) |
| ✅ | H-1 | ヘッダー常時表示に `company_logo_url` を反映 | D-13 / §1 | H-2 推奨 | enterprise, base | [#2206](https://github.com/nijuniinc/bokudeli-event-new/issues/2206) |
| ~~—~~ | ~~H-2a~~ | ~~エンプラトップ `/` の未ログイン閲覧（authGuards + Rules）~~ | ~~D-14~~ | — | — | ~~[#2207](https://github.com/nijuniinc/bokudeli-event-new/issues/2207)~~ **不採用・クローズ予定** |
| ✅ | H-9 | login / pass-code を背景画像 + 中央 v-card レイアウト化 | D-14 / §2 | H-2 推奨 | enterprise | [#2213](https://github.com/nijuniinc/bokudeli-event-new/issues/2213) |
| - [ ] | H-2b | **ログイン後**トップに `publish_scope: community` イベント表示（非メンバー閲覧のみ） | §2-5 / §5 | **G-6** | enterprise, common |

### WS-H-B: マイページ・UI

| 状態 | ID | タスク | 出所 | 依存 | パッケージ | Issue |
|:--|:--|:--|:--|:--|:--|:--|
| ✅ | H-3 | enterprise マイページ UI を user 版に同期（v-card 等） | D-15 / §3 | — | enterprise | [#2210](https://github.com/nijuniinc/bokudeli-event-new/issues/2210) |
| ✅ | H-4 | `UserProfilePage` の base 共通化（パネル分割） | D-15 / §3 | H-3 推奨 | base, user, enterprise | [#2224](https://github.com/nijuniinc/bokudeli-event-new/issues/2224) |

### WS-H-C: 注文履歴・利用状況（`/orders`）

| 状態 | ID | タスク | 出所 | 依存 | パッケージ | Issue |
|:--|:--|:--|:--|:--|:--|:--|
| ✅ | H-5 | `/orders` 専用画面（PF: 注文のみ）。マイページタブ削除・redirect | D-16 / §4 | — | base, user, enterprise | [#2208](https://github.com/nijuniinc/bokudeli-event-new/issues/2208) |
| ✅ | H-6 | enterprise `/orders` に福利厚生利用状況セクション追加 | D-16 / §4 | H-5 | enterprise | [#2209](https://github.com/nijuniinc/bokudeli-event-new/issues/2209) |
| ✅ | H-5d | `10_仕様/04_詳細_マイページ・友人.md` EP-24/25 更新（タブ → `/orders`） | §4-7 | H-5 | doc |

### WS-H-D: イベントテンプレート

| 状態 | ID | タスク | 出所 | 依存 | パッケージ | Issue |
|:--|:--|:--|:--|:--|:--|:--|
| - [ ] | H-7 | イベントテンプレ設計確定 → `10_仕様/04_詳細_イベントテンプレート.md` 新規 | D-17 / §6 | — | doc | [#2211](https://github.com/nijuniinc/bokudeli-event-new/issues/2211) |
| - [ ] | H-8 | テンプレイベント + コピー UI（enterprise）。全社デフォルトコミュニティ | D-17 / §6 | H-7 | enterprise, base | [#2212](https://github.com/nijuniinc/bokudeli-event-new/issues/2212) |
| - [ ] | H-8p | PF グローバルテンプレ（任意） | §6-2 | H-8 | user, base |

### WS-H-E: コミュニティ承認（WS-G 連携）

| 状態 | ID | タスク | 出所 | 依存 | パッケージ |
|:--|:--|:--|:--|:--|:--|
| - [ ] | — | 参加承認 `join_type` 実装 | v0.3 §1 / [01 WS-G G-5](./01_MVP全体計画.md) | G2 | common, base, enterprise |
| - [ ] | — | `publish_scope` Migrate + community 一覧 | [ADR-003](../20_設計判断_ADR/ADR-003_publish_scope移行.md) / G-6 | G-5 推奨 | 横断 |

> H-2b・コミュニティ承認の実装 Issue は **WS-G（G-5/G-6）を更新**するか、本 WS-H からリンクする。新規 duplicate Issue は避ける。

---

## WS-G との関係

| WS-H | WS-G | 関係 |
|:--|:--|:--|
| ~~H-2a（未ログイントップ）~~ | G-1 | **不採用**（#2207 クローズ予定） |
| H-9（login ヒーロー UI） | G-1 | 独立。G-1 は外部ゲスト向け |
| H-2b（community トップ表示） | G-6 | **G-6 依存**（ログイン後トップ） |
| H-5/H-6（/orders） | — | 独立 |
| §5 コミュニティ承認 | G-5, G-6 | **G-5/G-6 が本体** |

---

## GitHub Issue 対応表

| ID | Issue | 状態 |
|:--|:--|:--|
| H-2 | [#2205](https://github.com/nijuniinc/bokudeli-event-new/issues/2205) | ✅ |
| H-1 | [#2206](https://github.com/nijuniinc/bokudeli-event-new/issues/2206) | ✅ |
| ~~H-2a~~ | ~~[#2207](https://github.com/nijuniinc/bokudeli-event-new/issues/2207)~~ | **不採用** |
| H-9 | [#2213](https://github.com/nijuniinc/bokudeli-event-new/issues/2213) | ✅ |
| H-5 | [#2208](https://github.com/nijuniinc/bokudeli-event-new/issues/2208) | ✅ |
| H-6 | [#2209](https://github.com/nijuniinc/bokudeli-event-new/issues/2209) | ✅ |
| H-3 | [#2210](https://github.com/nijuniinc/bokudeli-event-new/issues/2210) | ✅ |
| H-4 | [#2224](https://github.com/nijuniinc/bokudeli-event-new/issues/2224) | ✅ |
| H-7 | [#2211](https://github.com/nijuniinc/bokudeli-event-new/issues/2211) | - [ ] |
| H-8 | [#2212](https://github.com/nijuniinc/bokudeli-event-new/issues/2212) | - [ ] |

---

## 変更履歴

| 日付 | 内容 |
|:--|:--|
| 2026-07-23 | 初版（WS-H 新設。v0.4 設計と連動） |
| 2026-07-23 | `03_` → `04_` にリネーム（`03_developmentデプロイ手順` との番号衝突回避） |
| 2026-07-23 | WS-H Issue 起票（#2205〜#2212） |
| 2026-07-23 | H-2a（#2207 未ログイントップ）不採用 → H-9（#2213 login ヒーロー UI）に差し替え。§2 設計更新 |
| 2026-07-24 | 実装済みタスクの状態表記を `- [x]` から `✅` に統一（進捗の見方に準拠） |
