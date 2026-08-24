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
| [x] | RC-8 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | CrUX 反映期間「最短 4 週・完全反映 8 週」が誤り<br>28 日ローリング窓のため約 4 週。SEO 文書・#2302・#2199 を修正 |
| [x] | RC-9 | なし | 🚨 必須修正 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | #2303 の Storage パス分類・ヘルパー名の誤り<br>`avatar_thumb_*` は上書きされる。`getCommunityAlbumItemStoragePath` に修正 |
| [x] | RC-10 | なし | 👌 修正不要 | — | 📤 スコープ外 | 📏 規約 | 📄 ドキュメントのみ | S | SEO 文書の変更が `fix/2297` に混在<br>ユーザー判断により分離せず同一ブランチにコミット |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | #2302 の Phase 割り当てで A2 が全 Phase から欠落<br>A2 を Phase 1 に追加し A4 との同時実施を明記 |
| [x] | RC-12 | 3843427247 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | EventDetailsCard の Maps URL 未エンコード<br>cart と同様に `eventMapsSearchUrl` を追加 |
| [x] | RC-13 | 3843427285 | 👌 修正不要 | — | 📌 スコープ内 | 📑 仕様書 | 👀 確認のみ | — | RC-6 と同一（公開イベント guard の SPA ローディング）<br>個別 RC 化せず RC-6 で追跡 |
| [x] | RC-14 | 3843475662 | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | SEO タスク 85 行目が Rich Results Test 未実施と矛盾<br>GSC 未完了のみ残す表現に修正 |
| [x] | RC-15 | 3843475667 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | カート概要テーブルがモバイルで横はみ出し<br>`mx-2` + モバイル `width: 100%` |
| [x] | RC-16 | 3843475674 | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | SEO-04/06 を未実施なのに完了扱い<br>ブラウザ・`/c/xxx` 未確認のため [ ] に戻す |

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

## 評価セッション（2026-08-24 21:10・shokujii-code-review）

- **評価日時**: 2026-08-24 21:10 JST
- **ブランチ名**: fix/2297
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2298
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **対象差分**: PageSpeed Insights 結果に基づく SEO 文書 P3-2 計測記録の追加、および Issue #2302 / #2303 / #820 / #448-450 / #2199 の作成・更新
- **手順 3a/3b 自動修正**: RC-8・RC-9（🚨 2 件）、RC-11（🟡 1 件）
- **レビュー周回**: 2 周（1 周目 RC-8・RC-9・RC-10、2 周目 RC-11）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-8 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📄 ドキュメント | 📄 ドキュメントのみ | S | CrUX 反映期間「最短 4 週・完全反映 8 週」が誤り<br>28 日ローリング窓のため約 4 週。SEO 文書・#2302・#2199 を修正 |
| [x] | RC-9 | なし | 🚨 必須修正 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | #2303 の Storage パス分類・ヘルパー名の誤り<br>`avatar_thumb_*` は上書きされる。`getCommunityAlbumItemStoragePath` に修正 |
| [x] | RC-10 | なし | 👌 修正不要 | — | 📤 スコープ外 | 📏 規約 | 📄 ドキュメントのみ | S | SEO 文書の変更が `fix/2297` に混在<br>ユーザー判断により分離せず同一ブランチにコミット |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | #2302 の Phase 割り当てで A2 が全 Phase から欠落<br>A2 を Phase 1 に追加し A4 との同時実施を明記 |

---

**識別子**: RC-8（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/12_SEO対策/01_SEO対策_タスク.md:415`

**該当コード（レビュー時点の diff）**:

```diff
+個別ページの CrUX データが存在しないため、修正してもページ単位で効果検証できない。オリジン集計も 28 日ローリング窓のため、反映まで最短 4 週・完全反映に 8 週。
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📄ドキュメントのみ/S]: CrUX は 28 日ローリング窓なので、修正後に窓が完全に入れ替わるのは約 4 週であり、「完全反映に 8 週」には根拠がない。また「最短 4 週」も誤りで、窓に新しいデータが混ざり始めるため効果は数日〜1 週で部分的に見え始める。→ 「効果が見え始めるまで数日〜1 週、窓が完全に入れ替わるまで約 4 週（PSI の集計ラグ 3 日程度を含め約 1 ヶ月）」に修正する。

**コメント要約**: CrUX 反映期間の記述が誤り（28 日窓に対し「完全反映 8 週」は倍の値）。<br>SEO 文書・#2302 本文・#2199 コメントの 3 箇所で同一の誤りを修正。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: PSI レポート（2026-08-24）の収集期間が Jul 25〜Aug 21 の 28 日窓であることは PSI 表示から確認済み。窓長が 28 日なら完全入れ替わりは 4 週であり、8 週は明確な誤り。改善効果の判定期日を誤らせるため必須修正とし、3 箇所すべて修正した。

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: GitHub Issue #2303 本文（リポジトリ外）

**該当コード（レビュー時点の diff）**:

```diff
+追記のみで上書きされないパス（チャット添付・アルバム・`avatar_thumb_*`）は `public, max-age=31536000, immutable` を付与して問題ない。
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📄ドキュメントのみ/S]: `getUserImageStoragePath(userId, size)` は `users/{userId}/avatar_thumb_{size}` を返す固定パスであり、アバター差し替え時に `userImage.ts` の `onObjectFinalized` が同一パスへ上書き保存する。`immutable` を付けると新しいサムネイルが反映されない。またアルバムのヘルパー名は `getAlbumItemStoragePath` ではなく `getCommunityAlbumItemStoragePath`。→ 固定パスと追記のみを判定ルールで区分し直し、ヘルパー名を実装と一致させる。

**コメント要約**: `avatar_thumb_*` を「追記のみ」と誤分類。`immutable` 付与でサムネ差し替えが反映されなくなる。<br>ヘルパー名 `getAlbumItemStoragePath` も実在せず `getCommunityAlbumItemStoragePath` が正。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📤 スコープ外

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: `common/src/utils/storagePaths.ts:52-54` と `functions/default/src/userImage.ts:66` を確認し誤りを確定。誤った分類のまま実装されるとアバターサムネイルが更新されない不具合に直結するため必須修正。#2303 本文を判定ルール方式に書き換え、代表例のみ列挙して「実装時に全ヘルパーを棚卸しする」旨を明記した（網羅列挙は再発リスクが高いため）。

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/12_SEO対策/01_SEO対策_タスク.md:372`

**該当コード（レビュー時点の diff）**:

```diff
+#### P3-2 Core Web Vitals 計測記録（2026-08-24）
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 本ブランチ `fix/2297` と PR #2298 はカート・レビュー指摘対応のスコープであり、SEO / CWV の計測記録は責務が異なる。チェックリスト「1つの PR に複数の責務を混在させていないか」に抵触する。→ SEO 文書の変更は別ブランチ（例 `doc/2302`）または少なくとも別コミットに分離することを検討する。

**コメント要約**: SEO P3-2 計測記録の追加が `fix/2297` に混在。<br>PR #2298 の責務外なので別ブランチ・別コミットへの分離が望ましい。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📤 スコープ外

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 指摘自体は妥当だが、ブランチ運用の選択はユーザー判断事項のため確認した結果、**分離せず `fix/2297` にまとめてコミットする**方針となった。ドキュメントのみの追加で PR #2298 のコード差分には影響しないため、対応不要と確定。

---

**識別子**: RC-11（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: GitHub Issue #2302 本文「推奨実施順」（リポジトリ外）

**該当コード（レビュー時点の diff）**:

```diff
+Phase 1: A4（スケルトン UI）+ B1（cover preload）+ #2303（キャッシュ）
+Phase 2: A1 + A3 + A5 + B3 → CLS 仕上げ
+Phase 3: B2（#820）+ B4 → LCP 裾の削り込み
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: A 系施策のうち **A2（loader をスケルトン UI に置換）がどの Phase にも割り当てられていない**。さらに A2 と A4 は同一の作業ストリームで、`index.html` の loader だけをスケルトン化しても Vue マウント後の `v-if` ゲートが残ればシフトは消えず、逆も同様。→ A2 を Phase 1 に追加し、A4 との同時実施と骨格寸法の一致（A1 含む）を明記する。

**コメント要約**: A2 が全 Phase から欠落しており、実施漏れになる。<br>A2 と A4 は同時に出さないと CLS が消えないため、Phase 1 にまとめて明記。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📤 スコープ外

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 📌 相当（本タスクで自分が作成した Issue 本文）+ 工数 S + 📄 ドキュメントのみ + 修正方針が一意のため自動修正対象と判断。Phase 1 を `A2 + A4` に変更し、同時実施が必要な理由と骨格寸法の一致要件を追記した。

---

## 評価セッション（2026-08-24 21:36・review-comments-evaluate）

- **評価日時**: 2026-08-24 21:36 JST
- **ブランチ名**: fix/2297
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2298
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼 5395125002、Codex 接続案内 5395197190、Copilot Maps 対応報告 5395195906）
- **手順 4a 自動修正**: RC-12, RC-14, RC-15, RC-16（🟡 4件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-12 | 3843427247 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | EventDetailsCard の Maps URL 未エンコード<br>cart と同様に `eventMapsSearchUrl` を追加 |
| [x] | RC-13 | 3843427285 | 👌 修正不要 | — | 📌 スコープ内 | 📑 仕様書 | 👀 確認のみ | — | RC-6 と同一論点 |
| [x] | RC-14 | 3843475662 | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | SEO タスク Rich Results Test 表記の矛盾を修正 |
| [x] | RC-15 | 3843475667 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | カート概要テーブルのモバイル横はみ出しを修正 |
| [x] | RC-16 | 3843475674 | 🟡 修正提案 | ✅ 対応済み | 📤 スコープ外 | 📄 ドキュメント | 📄 ドキュメントのみ | S | SEO-04/06 を未完了に戻す |

---

**識別子**: RC-12（GitHub id: 3843427247）

**レビュワー**: Copilot

**指摘箇所**: `base/src/components/EventDetailsCard.vue:265`

**該当コード（レビュー時点の diff）**:

```diff
+                    :href="`https://www.google.co.jp/maps/search/${event.fullAddress} ${event.event_place}`"
```

**レビュワーのコメント（原文）**:

[must] Google Maps の検索 URL が `event.fullAddress` / `event.event_place` をそのまま埋め込んでおり、`event_place` が未設定（optional）だと `undefined` が混ざる可能性があります。また `#`/`?` 等を含む住所・会場名だと URL が壊れます。cart.vue / partner の `eventMapsSearchUrl` と同様に、クエリ全体を `encodeURIComponent` しつつ `event_place ?? ''` で組み立ててください。

**コメント要約**: EventDetailsCard の Maps リンクが RC-7 修正前の cart と同じ問題を持つ。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-7 と同種の妥当な指摘。`eventMapsSearchUrl` を EventDetailsCard に追加し v-if で空クエリ時非表示にした。

---

**識別子**: RC-13（GitHub id: 3843427285）

**レビュワー**: Copilot

**指摘箇所**: `user/src/router/eventRouteGuard.ts:17`

**レビュワーのコメント（原文）**:

[must] 公開イベント詳細パスで `getLoadedEvent` が失敗した場合に無条件で遷移を許可すると、ページ側が `event == null` のままになりローディング表示が永久に続く可能性があります（SPA 内遷移や Firestore リッスン失敗時など）。ogpRequest 経由の初回ロードだけ例外にする／一定時間後にエラー画面へフォールバックする等、"失敗時も必ずユーザーに終端状態を返す" 分岐を入れてください。

**コメント要約**: RC-6（Codex）と同一論点。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: RC-6 で未着手として記録済み。重複 RC として個別対応は不要。

---

**識別子**: RC-14（GitHub id: 3843475662）

**レビュワー**: Codex

**指摘箇所**: `documents/12_SEO対策/01_SEO対策_タスク.md:85`

**レビュワーのコメント（原文）**:

**<sub><sub>![P3 Badge](https://img.shields.io/badge/P3-lightgrey?style=flat)</sub></sub>  Rich Results Test を未実施扱いから外す**

（本文略 — 326〜342 行の本番 Rich Results Test 実施記録と矛盾）

**コメント要約**: サマリー行だけ Rich Results Test が「未」のまま残り誤認を招く。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📤 スコープ外

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 85 行目を Rich Results Test ✅ / GSC 未完了に分離して修正。

---

**識別子**: RC-15（GitHub id: 3843475667）

**レビュワー**: Codex

**指摘箇所**: `base/src/components/pages/cart.vue:601`

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  モバイル幅でカート概要テーブルを収める**

（本文略 — width 90% + mx-5 で 360px 幅を超過）

**コメント要約**: モバイルでカート概要テーブルが横はみ出し・水平スクロール。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `mx-2 mx-sm-5` とモバイル時 `width: 100%` / `box-sizing: border-box` で修正。

---

**識別子**: RC-16（GitHub id: 3843475674）

**レビュワー**: Codex

**指摘箇所**: `documents/テスト方針・テスト項目書/v2.12/v2.12_テスト項目書.md:246`

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  未実施のSEOテストを完了扱いにしない**

（本文略 — SEO-04 ブラウザ未実施、SEO-06 `/c/xxx` 未確認）

**コメント要約**: curl のみで SEO-04/06 を完了にするとリリース確認を誤認する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📤 スコープ外

**ラベル**: 📄 ドキュメント

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: SEO-04 / SEO-06 を `[ ]` に戻し、SEO-05（Rich Results Test）のみ完了のまま維持。

---
