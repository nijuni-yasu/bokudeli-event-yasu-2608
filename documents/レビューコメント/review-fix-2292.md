# ブランチ fix/2292 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3838280516 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Google Maps リンクに rel 追加・event_place 未設定対策・encodeURIComponent |
| [x] | RC-2 | 5385582056 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | minimumParticipants 表示条件を EventDetailsCard と同様 enabled に統一 |

---

## 評価セッション（2026-08-23 19:33・review-comments-evaluate auto）

- **評価日時**: 2026-08-23 19:33 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・`partial: true`）
- **ブランチ名**: fix/2292
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2294
- **REVIEW_REQUEST_SINCE**: 2026-08-23T10:27:58Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文×1、Codex 問題なしサマリ×1、Copilot Pull request overview×1）
- **手順 4a 自動修正**: RC-1（🚨 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3838280516 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Google Maps リンクに rel 追加・event_place 未設定対策・encodeURIComponent |
| [x] | RC-2 | 5385582056 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | minimumParticipants 表示条件を EventDetailsCard と同様 enabled に統一 |

---

**識別子**: RC-1（GitHub id: 3838280516）

**レビュワー**: Copilot

**指摘箇所**: `partner/src/pages/order/[eventId].vue:173`

**該当コード（レビュー時点の diff）**:

```diff
+              <a
+                :href="`https://www.google.co.jp/maps/search/${eventStore.event.fullAddress} ${eventStore.event.event_place}`"
+                target="_blank"
+              >
```

**レビュワーのコメント（原文）**:

[must] `target="_blank"` の外部リンクに `rel="noopener noreferrer"` が無いため、tabnabbing のリスクがあります。また `event_place` は optional のため、未設定時に URL が `... undefined` になり得ます。Google Maps の query は `encodeURIComponent` でエンコードしつつ、未設定時は空文字扱いにしてください。

**コメント要約**: Maps 外部リンクのセキュリティ属性不足、optional な event_place による URL 不正、クエリ未エンコード。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: tabnabbing 対策と URL 組み立ての安全性は本 PR スコープ内で即時修正可能。`eventMapsSearchUrl` computed で encodeURIComponent・空文字フィルタ・rel 属性を追加した。

---

## 評価セッション（2026-08-23 19:43・review-comments-evaluate auto）

- **評価日時**: 2026-08-23 19:43 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・`partial: true`）
- **ブランチ名**: fix/2292
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2294
- **REVIEW_REQUEST_SINCE**: 2026-08-23T10:36:32Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文×0・Codex 問題なしサマリ×1・Copilot 確認のみ×0。Codex 2 件目は接続案内のみ）
- **手順 4a 自動修正**: RC-2（🟡 1件）
- **新規 RC**: RC-2 のみ（RC-1 は Copilot 確認済みとして再採番なし）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-2 | 5385582056 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | minimumParticipants 表示条件を EventDetailsCard と同様 enabled に統一 |

---

**識別子**: RC-2（GitHub id: 5385582056）

**レビュワー**: Copilot

**指摘箇所**: `partner/src/pages/order/[eventId].vue:213`

**該当コード（レビュー時点の diff）**:

```diff
-            <template v-if="minimumParticipants != null">
+            <template v-if="minimumParticipants?.enabled">
```

**レビュワーのコメント（原文）**:

[nits] 表示条件の記述が `EventDetailsCard.vue` と異なる。`v-if="minimumParticipants != null"` は `v-if="minimumParticipants?.enabled"` に揃えると読みやすい。

**コメント要約**: 最小催行人数の表示条件を base の EventDetailsCard と同じ enabled チェックに統一する nits。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: スキーマ上 enabled: true のみが有効値のため等価だが、意図の明示と base 側との一貫性のため enabled に統一した。
