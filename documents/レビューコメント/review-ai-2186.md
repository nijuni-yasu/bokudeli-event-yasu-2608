# ブランチ ai/2186 レビュー記録

セルフレビュー Stop gate 強化（B→C→A）および review-<slug>.md 正本化。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 判断 | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | source-change-detect を lint/review スコープ分離<br>`.agents/` 変更でも self-review gate が走る |
| [x] | RC-2 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | consume 単体では Hook 合格しない<br>review doc または ledger 必須 |
| [x] | RC-3 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Hook から ensure_pending 自動 write 廃止<br>lint-and-format 手順 8 必須 |
| [x] | RC-4 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 評価セッション見出し日時を JST として since と比較 |
| [x] | RC-5 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq 未インストール時 stop-hook-json.py で gate 継続 |
| [x] | RC-6 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | review スコープ・JST・consume 不合格のテスト追加 |

---

## 評価セッション（2026-07-16 16:55・shokujii-code-review）

- **評価日時**: 2026-07-16 16:55 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: ai/2186
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

| 対応 | RC | GitHub id | 判断 | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | source-change-detect を lint/review スコープ分離<br>`.agents/` 変更でも self-review gate が走る |
| [x] | RC-2 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | consume 単体では Hook 合格しない<br>review doc または ledger 必須 |
| [x] | RC-3 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Hook から ensure_pending 自動 write 廃止<br>lint-and-format 手順 8 必須 |
| [x] | RC-4 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 評価セッション見出し日時を JST として since と比較 |
| [x] | RC-5 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq 未インストール時 stop-hook-json.py で gate 継続 |
| [x] | RC-6 | なし | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | review スコープ・JST・consume 不合格のテスト追加 |

---

**識別子**: RC-1（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/hooks/source-change-detect.sh:1`

**該当コード（レビュー時点の diff）**:

```diff
+# 用法: source-change-detect.sh [lint|review]
+is_review_infra_path() { ... .agents/hooks/* ... }
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📐リファクタ/M]: `source-change-detect` が `.agents/` 変更を検知しない → lint/review スコープ分離し、Stop gate は review スコープで self-review を維持

**コメント要約**:

1行目: `.agents/` のみの PR では Stop gate が完全スキップされていた。
2行目: `lint` / `review` スコープ分離と stop-gate の条件分岐で解消。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: M

**判断理由**: 本 PR の受け入れ条件（エージェント設定変更でもセルフレビュー強制）を満たすため必須。`stop-gate-check.sh` で lint 対象外かつ review 対象のとき vitest をスキップし self-review のみ実行。

---

**識別子**: RC-2（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/self_review_check_lib.py:110`

**該当コード（レビュー時点の diff）**:

```diff
-    if wake_entry is not None and wake_entry.get("consumed"):
-        ... return True
+    # consume 単体では合格しない（wake は since 解決用）
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `consume` だけで Hook 合格になる → review doc または ledger 必須に変更

**コメント要約**:

1行目: `self_review_wake.py consume` のみで bypass 可能だった。
2行目: 合格条件を doc セッション / ledger の `task_skill=shokujii-code-review` に限定。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: Hook の強制力を維持。consume は SKILL 手順どおり記録後の後片付けとして残す。

---

**識別子**: RC-3（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/hooks/self-review-check.sh:11`

**該当コード（レビュー時点の diff）**:

```diff
-args=(--repo-root "${repo_root}" --ensure-pending)
+args=(--repo-root "${repo_root}")
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `ensure_pending` が Hook 実行時に `since` を上書き生成 → 廃止し pending 未作成時は block

**コメント要約**:

1行目: Hook が wake を自動作成し since が lint 成功時刻とずれる問題。
2行目: `/lint-and-format` 手順 8 の write を必須とするエラーメッセージに変更。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: since 基準の review doc 判定を正しく保つ。`--ensure-pending` はテスト用に CLI に残置。

---

**識別子**: RC-4（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/self_review_check_lib.py:39`

**該当コード（レビュー時点の diff）**:

```diff
+from zoneinfo import ZoneInfo
+SESSION_TZ = ZoneInfo("Asia/Tokyo")
+def to_utc(dt: datetime) -> datetime: ...
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: review doc 日時と since（UTC）の TZ ずれ → 見出し日時を JST として比較

**コメント要約**:

1行目: naive 日時を UTC 扱いすると JST 見出しと 9 時間ずれる。
2行目: `Asia/Tokyo` 固定と UTC 正規化で比較。SKILL に JST 明記。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Phase 1 日本語 UI 前提で評価セッション見出しは JST ローカルが自然。

---

**識別子**: RC-5（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.cursor/hooks/stop-gate.sh:18`

**該当コード（レビュー時点の diff）**:

```diff
+json_helper="${repo_root}/.agents/hooks/stop-hook-json.py"
+# jq なしでも parse_hook_fields → gate 実行
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: jq 未インストール時 fail-open → `stop-hook-json.py` フォールバック

**コメント要約**:

1行目: jq 不在時に lint/review gate をスキップしていた。
2行目: Python で stdin パースと followup JSON 生成。Claude アダプタも同様。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: macOS 等 jq 未導入環境でも gate を維持。

---

**識別子**: RC-6（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/hooks/test-lint-and-format-check.py:1`

**該当コード（レビュー時点の diff）**:

```diff
+test_source_change_detect_agents_hooks_review_scope
+test_review_doc_session_jst_before_since_fails
+test_consume_alone_does_not_pass
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: アダプタ統合テストが弱い → review スコープ・JST・consume・parse stdin を追加

**コメント要約**:

1行目: 実リポ dirty 依存のテストと parse stdin 欠落によるハングがあった。
2行目: 9+7 件 PASS。`stop-hook-json.py parse` に stdin を渡すよう修正。

**判断結果**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 回帰防止。`test-protect-git-release.py` 88/88 も継続 PASS。

---
