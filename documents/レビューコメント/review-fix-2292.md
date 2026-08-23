# ブランチ fix/2292 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3838280516 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 🔧 微修正 | S | Google Maps リンクに rel 追加・event_place 未設定対策・encodeURIComponent |

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
