# ブランチ fix/2297 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 5386596991 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `minimum_participants` の non-null assertion 不足<br>v-if 下で `!` を付与して型エラー解消 |
| [x] | RC-2 | 3838784150 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | EventDetailsCard の `target="_blank"` に rel 未設定<br>`noopener noreferrer` を付与 |
| [x] | RC-3 | 3838784125 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | cart.vue の外部リンクに rel 未設定<br>Maps / 会場 URL / X リンクすべてに付与 |
| [x] | RC-4 | 3838793513 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | RC-3 と同一指摘（Codex）<br>rel 付与で解消済み |
| [x] | RC-5 | 3838793512 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書, 👤 UX | 📋 仕様追加 | S | エンプラカートでハッシュタグ行が表示される<br>`hideShareSns` prop を Cart に追加し enterprise から有効化 |
| [ ] | RC-6 | 3843056636 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📋 仕様追加 | M | 公開イベント guard が Firestore 失敗を無条件許可<br>SPA 内遷移時の削除済みイベントで永久ローディング |
| [x] | RC-7 | 3843056638 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | Google Maps 検索 URL 未エンコード<br>`encodeURIComponent` で partner 同様に修正 |

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

## 評価セッション（2026-08-24 20:36・review-comments-evaluate）

- **評価日時**: 2026-08-24 20:36 JST
- **ブランチ名**: fix/2297
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2298
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼コメント 5394603557、Codex 接続案内 5394604742、Copilot 新規指摘なしサマリ）
- **手順 4a 自動修正**: RC-7（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-6 | 3843056636 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📑 仕様書 | 📋 仕様追加 | M | 公開イベント guard が Firestore 失敗を無条件許可<br>SPA 内遷移時の削除済みイベントで永久ローディング |
| [x] | RC-7 | 3843056638 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | Google Maps 検索 URL 未エンコード<br>`encodeURIComponent` で partner 同様に修正 |

---

**識別子**: RC-6（GitHub id: 3843056636）

**レビュワー**: Codex

**指摘箇所**: `user/src/router/eventRouteGuard.ts:16`

**該当コード（レビュー時点の diff）**:

```diff
+  if (isPublicEventDetailPath(path)) {
+    return undefined
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  公開イベントの読み込み失敗を無条件に許可しないでください**

公開イベントへの SPA 内遷移では `ogpRequest` の存在確認を経由しないため、一覧表示後にイベントが削除された場合や Firestore の購読が失敗した場合までここで遷移を許可すると、`user/src/pages/c/[communityAccount]/e/[eventId]/index.vue` の `event == null` が解消されず、404 やエラー表示ではなくローディング表示が永久に続きます。サーバー確認済みと判定できる初回ロードだけを例外にするか、未解決時はエラーへ分岐してください。チェックした範囲は `user` の公開イベント guard と `functions/default/src/ogpRequest.ts` の完全一致パス処理です。

**コメント要約**: #2301 の Googlebot 対策で公開パスの Firestore 失敗を許可したが、SPA 内遷移では ogpRequest を経由しないため削除済みイベント等で永久ローディングになり得る。<br>初回ロード（サーバー確認済み）のみ例外とする等の分岐が必要。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 指摘は妥当。#2301 は初回 HTML 取得（Googlebot）向けだが、SPA 内遷移との切り分けは仕様判断が必要。初回ロード判定（document referrer / navigation type 等）の設計を決めてから実装すべき。自動修正対象外。

---

**識別子**: RC-7（GitHub id: 3843056638）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/pages/cart.vue:625`

**該当コード（レビュー時点の diff）**:

```diff
+                    :href="`https://www.google.co.jp/maps/search/${cartItem.event.fullAddress} ${cartItem.event.event_place}`"
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Google Maps の検索文字列を URL エンコードしてください**

住所または会場名に ASCII の `#` や `?` が含まれるイベントでは、この新規リンクの後半がフラグメントやクエリとして解釈され、Google Maps に正しい検索文字列が渡りません。`partner/src/pages/order/[eventId].vue` の `eventMapsSearchUrl` と同様に、空文字を除いて組み立てた検索文字列全体を `encodeURIComponent` してから URL に埋め込んでください。

**コメント要約**: Maps 検索 URL に `#` / `?` 等が含まれると URL が壊れる。<br>partner と同様に `encodeURIComponent` でクエリをエンコードする。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 妥当なバグ修正。`eventMapsSearchUrl` ヘルパーを cart.vue に追加し partner と同パターンで修正済み。

---
