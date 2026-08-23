# ブランチ fix/2297 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5386596991 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `minimum_participants` の non-null assertion 不足<br>v-if 下で `!` を付与して型エラー解消 |
| [x] | RC-2 | 3838784150 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | EventDetailsCard の `target="_blank"` に rel 未設定<br>`noopener noreferrer` を付与 |
| [x] | RC-3 | 3838784125 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | cart.vue の外部リンクに rel 未設定<br>Maps / 会場 URL / X リンクすべてに付与 |
| [x] | RC-4 | 3838793513 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-3 と同一指摘（Codex）<br>rel 付与で解消済み |
| [x] | RC-5 | 3838793512 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 👤 UX | 📋 仕様追加 | S | エンプラカートでハッシュタグ行が表示される<br>`hideShareSns` prop を Cart に追加し enterprise から有効化 |

---

## 評価セッション（2026-08-23 23:52・review-comments-evaluate）

- **評価日時**: 2026-08-23 23:52 JST
- **ブランチ名**: fix/2297
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2298
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（Codex 接続案内 5386597480）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5386596991 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `minimum_participants` の non-null assertion 不足<br>v-if 下で `!` を付与して型エラー解消 |
| [x] | RC-2 | 3838784150 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | EventDetailsCard の `target="_blank"` に rel 未設定<br>`noopener noreferrer` を付与 |
| [x] | RC-3 | 3838784125 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | cart.vue の外部リンクに rel 未設定<br>Maps / 会場 URL / X リンクすべてに付与 |
| [x] | RC-4 | 3838793513 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-3 と同一指摘（Codex）<br>rel 付与で解消済み |
| [x] | RC-5 | 3838793512 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 👤 UX | 📋 仕様追加 | S | エンプラカートでハッシュタグ行が表示される<br>`hideShareSns` prop を Cart に追加し enterprise から有効化 |

---

**識別子**: RC-1（GitHub id: 5386596991）

**レビュワー**: Copilot

**指摘箇所**: PR トップレベル（cart.vue / EventDetailsCard.vue / UserEventCard.vue / ja.ts）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

（Copilot トップレベルレビュー全文 — [must] minimum_participants 型、[ask] hideShareSns、[nits] text-no-wrap、[fyi] i18n 追加）

**コメント要約**: Vue テンプレートでは v-if による narrowing が効かず `minimum_participants.count` で型エラーになり得る。<br>`!` 付与または関数引数型の緩和が必要。併せて hideShareSns 差分・text-no-wrap 統一が提案。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: shokujii-code-review の TypeScript 規約に照らし v-if 内でも non-null assertion が妥当。cart.vue / EventDetailsCard.vue に `!` を付与済み。[nits] text-no-wrap も UserEventCard に反映済み。

---

**識別子**: RC-2（GitHub id: 3838784150）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventDetailsCard.vue:251`

**該当コード（レビュー時点の diff）**:

```diff
+                    target="_blank"
```

**レビュワーのコメント（原文）**:

[must] `target="_blank"` の外部リンクに `rel="noopener noreferrer"` が付いていないため、`window.opener` 経由のタブ乗っ取りリスクがあります。`rel` を付与してください。

This issue also appears on line 349 of the same file.

**コメント要約**: EventDetailsCard の新規/既存外部リンクに rel 属性がない。<br>tabnabbing 対策として `noopener noreferrer` を付与する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: セキュリティ上の必須対応。Maps・会場 URL・X リンクすべてに rel を付与済み。

---

**識別子**: RC-3（GitHub id: 3838784125）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/pages/cart.vue:623`

**該当コード（レビュー時点の diff）**:

```diff
+                    target="_blank"
```

**レビュワーのコメント（原文）**:

[must] `target="_blank"` の外部リンクに `rel="noopener noreferrer"` が付いていないため、`window.opener` 経由のタブ乗っ取りリスクがあります。`rel` を付与してください。

This issue also appears in the following locations of the same file:
- line 631
- line 727

**コメント要約**: cart.vue の外部リンク（Maps / 会場 URL / ハッシュタグ）に rel 未設定。<br>すべての `target="_blank"` に `noopener noreferrer` を付与する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-2 と同様の tabnabbing 対策。3 箇所すべてに rel を付与済み。

---

**識別子**: RC-4（GitHub id: 3838793513）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/pages/cart.vue:631`

**該当コード（レビュー時点の diff）**:

```diff
+                    <a :href="cartItem.event.event_place_url" target="_blank">
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  新しい外部リンクに rel 属性を付与する**

（本文略 — RC-3 と同一内容）

**コメント要約**: Codex からの P2 指摘。cart.vue 新規外部リンクの rel 不足。<br>RC-3 対応で解消。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-3 と重複指摘。同一修正で解消済みのため個別対応不要。

---

**識別子**: RC-5（GitHub id: 3838793512）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/pages/cart.vue:721`

**該当コード（レビュー時点の diff）**:

```diff
+            <tr v-if="typeof cartItem.event.event_sns_hash_tag === 'string' && ...">
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  エンプラのカートではハッシュタグ行を非表示にする**

（本文略 — enterprise Cart 共有によりハッシュタグ表示が仕様違反）

**コメント要約**: enterprise が base Cart をそのまま使うためハッシュタグ行が表示される。<br>仕様書 §2.3.1 に従い `hideShareSns` prop でガードする。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書, 👤 UX

**変更種別**: 📋 仕様追加

**想定工数**: S

**判断理由**: `documents/08_エンタープライズ/10_仕様/04_詳細_イベント管理.md` §2.3.1 でエンプラ UI はハッシュタグ非表示。EventDetailsCard と同様の prop を Cart に追加し `enterprise/src/pages/cart.vue` から `hide-share-sns` を渡した。

---
