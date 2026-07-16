# ブランチ ai/2186 レビュー記録

セルフレビュー Stop gate 強化（B→C→A）および review-<slug>.md 正本化。

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | source-change-detect を lint/review スコープ分離<br>`.agents/` 変更でも self-review gate が走る |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | consume 単体では Hook 合格しない<br>review doc または ledger 必須 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Hook から ensure_pending 自動 write 廃止<br>lint-and-format 手順 8 必須 |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 評価セッション見出し日時を JST として since と比較 |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq 未インストール時 stop-hook-json.py で gate 継続 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | review スコープ・JST・consume 不合格のテスト追加 |
| [x] | RC-7 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | review-xxxx_template 見出しが Stop gate regex と不一致<br>日時・shokujii-code-review サフィックスを追記 |
| [x] | RC-8 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | evaluate 手順4の見出し記述が shokujii と不一致<br>同一形式に揃える |
| [x] | RC-9 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | resolve_since の now() フォールバック<br>フェイルファストまたは明示エラーに |
| [x] | RC-10 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | tree/ 等で conversation_id 未提供時 ledger 不可<br>AGENTS.md に注釈追加を提案 |
| [x] | RC-11 | 3593956660 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | stop-hook-json cmd_parse の JSONDecodeError<br>decode 失敗時は {} 扱いに修正済み |
| [x] | RC-12 | 3593956696 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | extract-followup の JSONDecodeError<br>followup なしで継続するよう修正済み |
| [x] | RC-13 | 3593998972 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | consume 済み wake + 古い review doc で合格<br>consumed 時は即不合格に修正済み |
| [x] | RC-14 | 3593998998 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 分単位見出しと秒付き since の比較ずれ<br>分単位に丸めて比較するよう修正済み |
| [x] | RC-15 | 3593999005 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 通常ブランチで ledger のみ合格<br>記録対象外ブランチに ledger 限定 |
| [ ] | RC-16 | 3593998981 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | コミット済み変更が review 検知外<br>clean 作業ツリーで gate スキップの懸念 |
| [x] | RC-17 | 3593998994 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Cursor jq 分岐が stop_reason/session_id 未対応<br>フォールバックと同キーに揃え済み |
| [ ] | RC-18 | 3593998988 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 📏 規約 | 🔧 微修正 | S | Claude stop-gate が usage followup を破棄<br>Cursor 同様 capture が必要 |
| [x] | RC-19 | 3593999009 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | manual evaluate で PR URL 時 headRefName 未使用<br>checkout ブランチと保存先がずれる |
| [x] | RC-20 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | reveal.scss の :deep() がグローバル SCSS で無効<br>カバー・ホバー・CTA アニメが効かない |
| [x] | RC-21 | 3594333551 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 未消費 wake で古い review doc が合格<br>consume + fingerprint のみ合格に修正 |
| [x] | RC-22 | 3594333556 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | terms 変更が lint 検知外<br>source-change-detect と lint に terms 追加 |
| [x] | RC-23 | 3594752055 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | consume のみで gate 合格<br>fingerprint + review doc / ledger 必須化 |
| [x] | RC-24 | 3594752087 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | staged のみで fingerprint 変化<br>git diff HEAD のみに簡素化 |
| [x] | RC-25 | 3594752107 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq なし followup を argv 渡し<br>stdin 経由に変更 |
| [x] | RC-26 | 3594752124 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq なし block reason も argv<br>stdin 経由に変更 |
| [x] | RC-27 | 3594971167 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | clean 作業ツリーで gate スキップの明記<br>AGENTS.md に追記 |
| [x] | RC-28 | 3594971193 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | lint-and-format の echo -e<br>printf に変更 |
| [x] | RC-29 | 3594990672 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 記録対象外ブランチ consumed 時<br>ledger 不要で fingerprint 合格 |
| [x] | RC-30 | 3594971226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | consume 時 fingerprint を<br>マッチ時のみ計算 |
| [ ] | RC-31 | 3594990666 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | コミット済み差分の gate 検知<br>RC-16 と同一指摘 |
| [x] | RC-32 | 3594971089 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count 上限で gate skip 廃止<br>exit 2 でブロック |
| [x] | RC-33 | 3594990680 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | self_review_wake list に --branch<br>git-create-pull-request 手順更新 |
| [x] | RC-34 | 3594971134 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | usage_json の `\|\| echo '{}'` 廃止<br>exit code で分岐 |
| [ ] | RC-35 | 3595187861 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | コミット済み差分の lint 検知<br>RC-16 / RC-31 と同一 |
| [x] | RC-36 | 3595187851 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | ルート eslint/prettier/tsconfig<br>を lint スコープに追加 |
| [x] | RC-37 | 3595187857 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count 判定を review スコープ<br>チェック後に移動 |
| [x] | RC-38 | 3595164131 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count ブロック理由を stdout<br>に出力（stderr 廃止） |
| [x] | RC-39 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | lint-and-format スキルに terms 手順が未記載<br>hook 正本と手順 1b/2/3/7 を揃える |
| [x] | RC-40 | 3595296822 | 👌 修正不要 | — | 📌 スコープ内 | 📏 規約 | 👀 確認のみ | — | since 分単位丸めの fail-open<br>RC-14 意図どおり |
| [x] | RC-41 | 3595296860 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | stop-gate ブロック時 reason 空<br>フォールバック文言を追加 |
| [x] | RC-42 | 3595296880 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count 非数値時 0 扱い<br>gate 迂回を防止 |
| [x] | RC-43 | 3595336319 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | shokujii-code-review 手順0<br>list に --branch 追加 |
| [x] | RC-44 | 3595336326 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | auto 記録順を 4a 後に修正<br>手順2直後の誤記を削除 |
| [x] | RC-45 | 3595336331 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | review-xxxx_template の<br>自動修正方針を現行に更新 |
| [x] | RC-46 | 3595336334 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | evaluate 手順3の 12→13 項目<br>表記を修正 |
| [ ] | RC-47 | 3595336338 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | コミット済み差分の lint 検知<br>RC-16/31/35 と同一 |

---

## 評価セッション（2026-07-16 16:55・shokujii-code-review）

- **評価日時**: 2026-07-16 16:55 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: ai/2186
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | M | source-change-detect を lint/review スコープ分離<br>`.agents/` 変更でも self-review gate が走る |
| [x] | RC-2 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | consume 単体では Hook 合格しない<br>review doc または ledger 必須 |
| [x] | RC-3 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Hook から ensure_pending 自動 write 廃止<br>lint-and-format 手順 8 必須 |
| [x] | RC-4 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 評価セッション見出し日時を JST として since と比較 |
| [x] | RC-5 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq 未インストール時 stop-hook-json.py で gate 継続 |
| [x] | RC-6 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | review スコープ・JST・consume 不合格のテスト追加 |

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

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

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

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

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

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

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

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

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

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

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

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 回帰防止。`test-protect-git-release.py` 88/88 も継続 PASS。

---

## 評価セッション（2026-07-16 17:26・shokujii-code-review）

- **評価日時**: 2026-07-16 17:26 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: ai/2186
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（評価 + ステータス分離: `review-comments-evaluate` / `shokujii-code-review` / `AGENTS.md` / テンプレート / `review-ai-2186.md` 移行。ドキュメント・スキルのみ）

---

## 評価セッション（2026-07-16 17:45・shokujii-code-review）

- **評価日時**: 2026-07-16 17:45 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: ai/2186
- **PR**: 未作成
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（`pr-xxxx_template.md` を stub 化し `review-xxxx_template.md` に統一、`review-doc-path.md` 更新）

---

## 評価セッション（2026-07-16 18:00・review-comments-evaluate）

- **評価日時**: 2026-07-16 18:00 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文×1、Codex 接続案内×1、Copilot overview サマリ×1）
- **手順 4a 自動修正**: RC-11〜15（🚨 + 📌 5件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-7 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | template 見出しが gate regex 非一致<br>サフィックス形式へ揃える |
| [x] | RC-8 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | evaluate 手順4見出し記述の不一致<br>shokujii-code-review と統一 |
| [x] | RC-9 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | resolve_since の暗黙 now() フォールバック<br>診断可能なエラーへ |
| [x] | RC-10 | 4989960182 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | conversation_id 未提供時の ledger 制限<br>記録スキップブランチ向け注釈 |
| [x] | RC-11 | 3593956660 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | cmd_parse JSONDecodeError で hook 落ち<br>{} フォールバックで修正 |
| [x] | RC-12 | 3593956696 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | extract-followup decode 失敗<br>followup なし継続に修正 |
| [x] | RC-13 | 3593998972 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | consumed wake + 古い doc で合格<br>consumed 即不合格に修正 |
| [x] | RC-14 | 3593998998 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 分見出しと秒付き since の誤ブロック<br>分単位比較に修正 |
| [x] | RC-15 | 3593999005 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 通常ブランチの ledger のみ合格<br>記録対象外のみ ledger 許可 |
| [ ] | RC-16 | 3593998981 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | コミット後 clean で review 検知漏れ<br>base 差分検知の検討 |
| [x] | RC-17 | 3593998994 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Cursor jq が stop_reason/session_id 未読<br>キー揃え済み |
| [ ] | RC-18 | 3593998988 | 🟡 修正提案 | 未着手 | 📤 スコープ外 | 📏 規約 | 🔧 微修正 | S | Claude usage followup 未返却<br>Cursor 同様の capture が必要 |
| [x] | RC-19 | 3593999009 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | PR URL 時 headRefName で slug 決定<br>manual でも PR 基準の保存先へ |

---

## 対応セッション（2026-07-16 18:05 JST）

RC-7〜10・19 を同一作業で対応。テンプレート／evaluate スキル／review-doc-path の見出し・保存先ルール統一、`resolve_since` フェイルファスト、AGENTS.md に tree/ ledger 注釈。テスト 10 件 PASS。

---

## 評価セッション（2026-07-16 18:05・shokujii-code-review）

- **評価日時**: 2026-07-16 18:05 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（RC-7〜10・19 対応後の差分確認。ドキュメント・スキル・self_review_check.py・テスト）

---

## 評価セッション（2026-07-16 18:06・shokujii-code-review）

- **評価日時**: 2026-07-16 18:06 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（consume 済み wake 再発行後のセルフレビュー。ソース変更は RC-7〜19 対応分のみ）

---

## 評価セッション（2026-07-16 18:17・shokujii-code-review）

- **評価日時**: 2026-07-16 18:17 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（reviewed_scope_fingerprint 導入。consume 後の同一未コミット差分で Stop gate 合格）

---

## 評価セッション（2026-07-16 18:21・shokujii-code-review）

- **評価日時**: 2026-07-16 18:21 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（イベントページへの段階表示・カバーズーム・メニューカードホバー・注文 CTA シマーアニメーション追加）

---

## 評価セッション（2026-07-16 18:23・shokujii-code-review）

- **評価日時**: 2026-07-16 18:23 JST
- **評価者**: Cursor Agent（shokujii-code-review）
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-20 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 👤 UX | 🔧 微修正 | S | reveal.scss の :deep() がグローバル SCSS で無効<br>カバー・ホバー・CTA アニメが効かない |

---

**識別子**: RC-20（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `base/src/styles/motion/reveal.scss:85`

**該当コード（レビュー時点の diff）**:

```diff
+    :deep(.v-img__img),
+    :deep(.v-img__placeholder) {
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [🔧微修正/S]: `reveal.scss` は `base.scss` 経由のグローバル SCSS として読み込まれるため、Vue SFC 専用の `:deep()` が効かずカバー画像のズームイン・メニュー画像ホバー・注文 CTA の z-index 調整が適用されない → 通常の子孫セレクタ（`.event-motion-cover .v-img__img` 等）に置き換える

**コメント要約**:

グローバル SCSS に `:deep()` を書いても Vue のスコープ変換が走らないためアニメーション用セレクタが無効になる。通常の子孫セレクタへ修正し、カバー・ホバー・CTA の視覚効果を有効化する。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 👤 UX

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: アニメーション追加が本 PR の主目的であり、セレクタ無効はユーザー向け機能欠落に直結するため必須修正。`:deep()` 除去は挙動変更を伴わない機械的修正。

---

## 評価セッション（2026-07-16 18:29・shokujii-code-review）

- **評価日時**: 2026-07-16 18:29 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（🟡 条件付き自動修正ポリシーを 3b / 4a / AGENTS.md / auto-fix-policy.md に反映。ドキュメント・スキルのみ）

---

## 評価セッション（2026-07-16 18:29・review-comments-evaluate）

- **評価日時**: 2026-07-16 18:29 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **新規 RC なし**（`since` 2026-07-16T09:00:23Z 以降のインラインコメント 0 件）
- **手順 4a 自動修正**: 該当なし

### RC 一覧（サマリ）

（本セッションで新規 RC なし）

---

## 評価セッション（2026-07-16 19:39・review-comments-evaluate）

- **評価日時**: 2026-07-16 19:39 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文・Codex 接続案内・Copilot サマリは既評価分）
- **手順 4a 自動修正**: RC-21（🚨 1件）/ RC-22（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-21 | 3594333551 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 未消費 wake で古い review doc が合格<br>通常ブランチは consume + fingerprint のみ合格 |
| [x] | RC-22 | 3594333556 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | terms 変更が lint 検知外<br>pr-verify と揃え terms を追加 |

---

**識別子**: RC-21（GitHub id: 3594333551）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `.agents/scripts/self_review_check_lib.py:211`

**該当コード（レビュー時点の diff）**:

```diff
+    if not is_recording_skipped_branch(branch):
+        review_doc = root / review_doc_path_for_branch(branch)
+        if has_review_doc_session_since(review_doc, since):
+            return True
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  未消費 wake で古いレビュー記録を再利用しないでください**

レビュー doc 追記後に `consume` が失敗または漏れたまま同じブランチで追加修正した場合、wake は古い `since` のまま未消費なので、ここで過去の `shokujii-code-review` セッションだけを見て合格します。`reviewed_scope_fingerprint` の比較に進まないため、追加修正後に再レビューしていなくても Stop gate を通過できるので、未消費 wake でも現在の review スコープ差分を記録時点と照合するか、doc 合格後は consume 済みであることを必須にしてください。

**コメント要約**:

未消費 wake のまま過去の review doc セッションだけで Stop gate が合格する抜け道がある。
追加修正後の再レビュー漏れを防ぐため、通常ブランチでは consume + fingerprint 一致のみ合格とする。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: gate 迂回はセルフレビュー必須化の目的に反する必須修正。`is_self_review_complete` から未消費時の review doc 合格経路を削除し、テスト `test_unconsumed_wake_old_review_doc_does_not_pass` を追加。

---

**識別子**: RC-22（GitHub id: 3594333556）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `.agents/hooks/source-change-detect.sh:40`

**該当コード（レビュー時点の diff）**:

```diff
+    common/* | base/* | user/* | partner/* | enterprise/* | functions/*)
+      return 0
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  terms 変更を PR verify 対象に含めてください**

`terms/**` だけを変更した PR では、この lint スコープ判定が一致しないため `lint-and-format-check.sh` が変更なしとして即成功します。一方、確認した `.github/workflows/pr-verify.yml` では `terms` フィルタがあり、`terms` 変更時に `npm -w terms run lint` / `format:check` / `build` を実行するため、push 前のローカル verify を通過しても CI で初めて失敗します。`terms/*` を検知対象に追加し、lint-and-format 側でも `terms` の lint/format/build を実行してください。

**コメント要約**:

`terms/**` 単独変更がローカル lint 検知外となり CI とずれる。
`source-change-detect.sh` に `terms/*` を追加し `lint-and-format-check.sh` で terms の lint/format/build を実行。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: pr-verify.yml とローカル hook の対象パッケージを揃える改善。条件付き自動修正（S・🔧・📌）に該当し対応済み。

---

## 評価セッション（2026-07-16 19:40・shokujii-code-review）

- **評価日時**: 2026-07-16 19:40 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（RC-21/22 自動修正差分。未消費 wake の gate 迂回防止・terms lint 対象追加・テスト 15 件 PASS）

---

## 評価セッション（2026-07-16 19:50・review-comments-evaluate）

- **評価日時**: 2026-07-16 19:50 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（レビュー依頼定型文・Codex 接続案内・Copilot サマリ）
- **partial**: Codex 未レビュー（connect 案内のみ）
- **手順 4a 自動修正**: RC-23〜26（🚨 3件 / 🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-23 | 3594752055 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | consume のみで gate 合格<br>fingerprint + doc/ledger 必須に修正 |
| [x] | RC-24 | 3594752087 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | staged のみで fingerprint 変化<br>git diff HEAD のみに簡素化 |
| [x] | RC-25 | 3594752107 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq なし followup の argv 渡し<br>stdin 経由に変更 |
| [x] | RC-26 | 3594752124 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | jq なし block reason の argv 渡し<br>stdin 経由に変更 |

---

## 評価セッション（2026-07-16 20:16・review-comments-evaluate）

- **評価日時**: 2026-07-16 20:16 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **since**: 2026-07-16T11:16:31Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **partial**: Codex 未レビュー（connect 案内のみ）
- **手順 4a 自動修正**: RC-27〜30, RC-32〜34（🚨 3件 / 🟡 4件）。RC-31 は RC-16 重複のため未着手

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-27 | 3594971167 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | clean 作業ツリーで gate スキップの明記 |
| [x] | RC-28 | 3594971193 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | echo -e → printf |
| [x] | RC-29 | 3594990672 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 記録対象外 consumed は fingerprint のみで合格 |
| [x] | RC-30 | 3594971226 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | consume 時 fingerprint 遅延計算 |
| [ ] | RC-31 | 3594990666 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | RC-16 と同一（コミット済み差分検知） |
| [x] | RC-32 | 3594971089 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count 上限で skip 廃止 |
| [x] | RC-33 | 3594990680 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | list --branch 追加 |
| [x] | RC-34 | 3594971134 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | usage_json 取得の exit code 分岐 |

---

## 評価セッション（2026-07-16 20:20・shokujii-code-review）

- **評価日時**: 2026-07-16 20:20 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0

指摘なし（RC-27〜34 自動修正差分。テスト 17 件 PASS）

---

## 評価セッション（2026-07-16 21:00・review-comments-evaluate）

- **評価日時**: 2026-07-16 21:00 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **since**: 2026-07-16T11:49:37Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **partial**: false（Copilot + Codex とも substantive）
- **手順 4a 自動修正**: RC-36〜38（🚨 2件 / 🟡 1件）。RC-35 は RC-16/31 重複のため未着手

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-35 | 3595187861 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | RC-16/31 と同一（コミット済み lint） |
| [x] | RC-36 | 3595187851 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | ルート設定ファイルを lint スコープに |
| [x] | RC-37 | 3595187857 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count をスコープ判定後に |
| [x] | RC-38 | 3595164131 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | ブロック理由を stdout に |

---

## 評価セッション（2026-07-16 21:03・shokujii-code-review）

- **評価日時**: 2026-07-16 21:03 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 0
- **手順 3b 自動修正**: RC-39（🟡 1件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-39 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | lint-and-format スキルに terms 手順が未記載<br>hook 正本と手順 1b/2/3/7 を揃える |

---

**識別子**: RC-39（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/skills/lint-and-format/SKILL.md:49`

**該当コード（レビュー時点の diff）**:

```diff
 ### 2. lint
 
 ```
 npm -w common run lint
 ...
 npm -w enterprise run lint
 npm -w functions/default run lint
 ```
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: `lint-and-format-check.sh` 正本は `terms` の build / lint / format を実行するが、`lint-and-format` スキル手順 2・3・3a・7 の報告形式に `terms` が無い → 手順 1b（terms build）と各ステップに `npm -w terms` を追記し、実行順の制約行も更新する

**コメント要約**:

hook 正本に terms が含まれる一方、スキル手順書に terms が欠落。
手順 1b・2・3・3a・7 と実行順制約に terms を追記して整合。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: RC-22 で hook 側に terms を追加済みだがスキル正本の追従漏れ。エージェントが `/lint-and-format` 単体実行時に terms を省略しうる。条件付き自動修正（S・📄・📌）に該当し対応済み。

---

## 評価セッション（2026-07-16 21:23・review-comments-evaluate）

- **評価日時**: 2026-07-16 21:23 JST
- **ブランチ名**: ai/2186
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2187
- **since**: 2026-07-16T12:09:50Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文・Codex 接続案内）
- **partial**: false
- **手順 4a 自動修正**: RC-41〜46（🚨 2件 / 🟡 4件）。RC-47 は RC-35 重複のため未着手

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-40 | 3595296822 | 👌 修正不要 | — | 📌 スコープ内 | 📏 規約 | 👀 確認のみ | — | since 分単位丸めの fail-open<br>RC-14 意図どおり |
| [x] | RC-41 | 3595296860 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | stop-gate ブロック時 reason 空<br>フォールバック文言を追加 |
| [x] | RC-42 | 3595296880 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | loop_count 非数値時 0 扱い<br>gate 迂回を防止 |
| [x] | RC-43 | 3595336319 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | shokujii-code-review 手順0<br>list に --branch 追加 |
| [x] | RC-44 | 3595336326 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | auto 記録順を 4a 後に修正 |
| [x] | RC-45 | 3595336331 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | review-xxxx_template の<br>自動修正方針を現行に更新 |
| [x] | RC-46 | 3595336334 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | evaluate 手順3の 12→13 項目 |
| [ ] | RC-47 | 3595336338 | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 📋 仕様追加 | M | RC-16/31/35 と同一 |

---
