# ブランチ fix/2260 レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3789185866 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `--force` 廃止で orphan Function が残る指摘<br>#2260 意図。非対話 deploy は abort し黙って成功しない |
| [x] | RC-2 | 3789185867 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空 export 判定が常に false のバグ<br>`not exports` に修正済み |
| [x] | RC-3 | 3789185868 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Deploy ステップ以外の decoy 文字列を通す<br>`parse_deploy_step_args` で厳密検証 |
| [x] | RC-8 | 5301909247 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `on.push.paths` に firebase.json 未包含<br>設定のみ変更 PR で Deploy functions 未起動 |
| [x] | RC-4 | 3789226937 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | env.args 等の decoy で false negative<br>`with:` 直下の args のみ解析 |
| [x] | RC-5 | 3789227550 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | ステップ名依存で brittle<br>`uses: ./.github/actions/deploy` 検出に変更 |
| [x] | RC-6 | 3789227556 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | firebase.json source 未検証<br>`functions/default` 単一を静的検証に追加 |
| [x] | RC-7 | 3789226936 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空 functions 配列が検証を通過<br>空配列をエラーに変更 |
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | parse 例外時に「functions が空」が重複<br>`firebase_config_ok` で空チェックを分離 |
| [x] | RC-10 | 3789259329 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 禁止パターンの単語一致で誤検知<br>hybrid/pf/enterprise 語を削除し構造検出に限定 |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 戻り値型注釈欠落 + 空行 1 行<br>`Iterator[list[str]]` 付与・空行 2 行に統一 |
| [x] | RC-12 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | テスト専用の未使用ラッパー残存<br>`parse_firebase_functions_codebases` を削除 |
| [x] | RC-13 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📄 ドキュメントのみ | S | `--force` 廃止で orphan 残存時にデプロイ abort<br>初回デプロイ前の明示削除を手順書に明記 |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | verify のユニットテストが CI 未実行<br>pr-verify・lint-and-format・hook に追加 |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | WS-A 実装設計の 3 job 記述が旧構成のまま<br>#2260 で 1 ジョブ化した旨を追記 |
| [x] | RC-16 | 3789259325 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 最初の deploy ステップのみ検証<br>全件収集し 1 件 + `--only functions` を厳密検証 |
| [x] | RC-17 | なし | 👌 修正不要 | — | — | 📏 規約 | 🔧 微修正 | S | retry_force 未設定の regression 検出なし<br>`--force` 再試行の撤去で検証対象自体が消滅 |
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `with:` 直下パーサが 2 関数でほぼ重複<br>retry_force パーサ削除で 1 本に |
| [x] | RC-19 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 後方互換ラッパーがテスト専用で残存<br>`parse_deploy_step_args` を削除 |
| [x] | RC-20 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 同一 yml を 2 回 read_text<br>`deploy_text.splitlines()` に統一 |
| [x] | RC-21 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | export parse 例外時にエラーが重複<br>RC-9 と同じ形に整理 |
| [x] | RC-22 | なし | 👌 修正不要 | — | — | 📏 規約 | 📄 ドキュメントのみ | S | 報告テンプレに force fallback 行が無い<br>fallback テストごと撤去し記述を削除 |
| [x] | RC-23 | なし | 🟡 修正提案 | 📤 #2273 別Issue化 | 📤 スコープ外 | 🔐 セキュリティ | 🔧 微修正 | S | inputs を run に直接展開<br>共通 action のため #2273 で対応 |
| [x] | RC-24 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📋 仕様追加 | M | orphan ガードが CLI の prompt 順序で無効化<br>`--force` 自動再試行を撤去し手動運用に統一 |
| [x] | RC-25 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | テストの未使用 `assert_exit`<br>デッドコードを削除（後にファイルごと撤去） |
| [x] | RC-26 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `orphan_and_failure_policy` モックが実挙動と乖離<br>テストファイルごと撤去で解消 |
| [ ] | RC-27 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 👀 確認のみ | — | 87 export を 1 ジョブ逐次で 30 分 timeout<br>実測に対する余裕の確認が必要 |
| [x] | RC-28 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📄 ドキュメントのみ | S | `--force` 廃止の副作用 2 件が手順書に無い<br>unsafe migration skip・cleanup policy を追記 |
| [x] | RC-29 | 3789316862 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | args 未設定 deploy ステップが件数検証をすり抜ける<br>全 deploy ステップをカウントするよう修正 |
| [x] | RC-30 | 3789316863 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | CI デプロイ検証ファイル変更で lint hook がスキップ<br>source-change-detect にパス追加 |
| [x] | RC-31 | 3789316864 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | orphan テストが exit code のみで再試行を未検証<br>後に fallback 撤去でテストごと削除 |
| [x] | RC-32 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | 新設した CI デプロイ仕様書への参照が無い<br>AGENTS.md・functions 実装スキルにリンクを追加 |
| [x] | RC-33 | 3789401935 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | チャット仕様書に旧 `--only` 更新手順が残存<br>index.ts 更新方式へ修正 |

---

## 評価セッション（2026-08-15 19:50・review-comments-evaluate）

- **評価日時**: 2026-08-15 19:50 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 1（Codex Review 接続案内 `<details>` のみ）
- **手順 4a 自動修正**: RC-2, RC-3（🟡 2 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3789185866 | 👌 修正不要 | — | — | — | 👀 確認のみ | — | `--force` 廃止で orphan Function が残る指摘<br>#2260 意図。非対話 deploy は abort し黙って成功しない |
| [x] | RC-2 | 3789185867 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空 export 判定が常に false のバグ<br>`not exports` に修正済み |
| [x] | RC-3 | 3789185868 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | Deploy ステップ以外の decoy 文字列を通す<br>`parse_deploy_step_args` で厳密検証 |

---

**識別子**: RC-1（GitHub id: 3789185866）

**レビュワー**: Codex

**指摘箇所**: `.github/workflows/deploy_functions.yml:64`

**該当コード（レビュー時点の diff）**:

```diff
@@ -71,29 +52,13 @@ jobs:
         run: |
           npm -w common run lint
           npm -w functions/default run lint
-      - name: Resolve deploy targets
-        id: targets
-        env:
-          GROUP: ${{ matrix.group }}
-        run: |
-          case "$GROUP" in
-            hybrid)
-              echo "args=--force --only functions:addToCart,..." >> "$GITHUB_OUTPUT"
-              ;;
-…（diff 先頭省略）
+      - name: Deploy to Firebase
+        uses: ./.github/actions/deploy
+        with:
+          project_id: ${{ vars.PROJECT_ID }}
+          args: '--only functions'
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Function 削除時の削除確認を自動化する**

`functions/default/src/index.ts` から export を削除するリリースでは、Firebase CLI の `deploy --help` が `--force` を「delete Cloud Functions missing from the current working directory without confirmation」と定義しているため、確認入力できないこの Actions から `--force` を外すと、対象 Function が GCP 上に残り、削除済みの Trigger や Scheduled Function が動作し続けます。追加・削除時は index.ts だけを更新すれば CI が反映するというプロジェクト運用を成立させるため、削除を明示的に処理するステップを追加するか `--force` を維持してください。

**コメント要約**: export 削除時に `--force` なしだと GCP 上に Function が残り Trigger が動き続ける懸念。削除ステップ追加か `--force` 維持を提案。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: Issue #2260 で `--force` 廃止は意図的トレードオフ。sandbox 検証では orphan Function 存在時、非対話 `firebase deploy --only functions` は **exit 非 0 で abort** し、デプロイ成功のまま旧 Function が動き続けることはない。export 削除リリースでは事前に `firebase functions:delete` 等で明示削除する運用とし、自動削除ステップは follow-up Issue 化が妥当（本 PR スコープ外）。

---

**識別子**: RC-2（GitHub id: 3789185867）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:107`

**該当コード（レビュー時点の diff）**:

```diff
+    if exports and len(exports) == 0:
+        errors.append(f"index.ts に export がありません: {index_path}")
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  空の export ブロックを検証エラーにする**

`exports and len(exports) == 0` は、集合が空なら左辺が false、空でなければ長さが 0 ではないため常に false です。そのため `index.ts` の export ブロックが誤って空になっても `verify()` は export 0 件を `OK` として終了し、PR verify が全 Function の export 漏れを検出できません。空集合を明示的にエラーにしてください。

**コメント要約**: `exports and len(exports) == 0` は論理バグで空 export を検出できない。`not exports` 等に修正すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘どおり常に false。`if not exports:` に修正しユニットテスト追加済み。

---

**識別子**: RC-3（GitHub id: 3789185868）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:98`

**該当コード（レビュー時点の diff）**:

```diff
+    if not DEPLOY_ARGS_RE.search(deploy_text):
+        errors.append(
+            "deploy_functions.yml に `args: '--only functions'` が見つかりません。\n"
+            "  → Deploy ステップで `--only functions` を指定してください。"
+        )
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  実際の Deploy ステップの引数を検証する**

workflow の実際の Deploy ステップを `--only hosting` や変数参照へ変更しても、コメントや無関係なステップに `args: '--only functions'` という文字列が残っていれば、このファイル全体への正規表現検索は成功して PR verify が通ります。その場合、CI が default codebase の全 export をデプロイするという保証が失われるため、YAML の対象 Deploy ステップにある `with.args` が厳密に `--only functions` かを検証してください。

**コメント要約**: ファイル全体の文字列検索では decoy を通す。Deploy ステップの `with.args` を厳密検証すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `parse_deploy_step_args` を追加し `./.github/actions/deploy` の Deploy ステップのみ検証。decoy コメント + 誤 args のテスト追加済み。

---

## 評価セッション（2026-08-15 20:02・review-comments-evaluate）

- **評価日時**: 2026-08-15 20:02 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` manual・2 回目）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（レビュー依頼定型文 id:5301902640、Codex 接続案内 id:5301909591）
- **手順 4a 自動修正**: RC-8（🚨 1 件）、RC-4〜RC-7（🟡 4 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-8 | 5301909247 | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `on.push.paths` に firebase.json 未包含<br>設定のみ変更 PR で Deploy functions 未起動 |
| [x] | RC-4 | 3789226937 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | env.args 等の decoy で false negative<br>`with:` 直下の args のみ解析 |
| [x] | RC-5 | 3789227550 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | ステップ名依存で brittle<br>`uses: ./.github/actions/deploy` 検出に変更 |
| [x] | RC-6 | 3789227556 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | firebase.json source 未検証<br>`functions/default` 単一を静的検証に追加 |
| [x] | RC-7 | 3789226936 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 空 functions 配列が検証を通過<br>空配列をエラーに変更 |

---

**識別子**: RC-8（GitHub id: 5301909247）

**レビュワー**: Copilot

**指摘箇所**: `PR トップレベル`（`.github/workflows/deploy_functions.yml` の `on.push.paths`）

**該当コード（レビュー時点の diff）**:

（インライン指摘なし）

**レビュワーのコメント（原文）**:

> @codex この PR の Files changed をコードレビューしてください。指摘は shokujii-code-review チェックリストに沿って日本語でお願いします。
>
> @copilot この PR の Files changed をコードレビューしてください。指摘は shokujii-code-review チェックリストに沿って日本語でお願いします。

🚨 **必須修正** [🔧 微修正 / S]: `.github/workflows/deploy_functions.yml` では `firebase.json` が `verify:functions-deploy` の検証対象かつ Functions デプロイ設定の正本になった一方で、`on.push.paths` に `firebase.json` が含まれていません。現状だと `firebase.json` の functions codebase / source 変更だけを含む PR は `Deploy functions` が自動起動せず、development / production に設定変更が反映されないままマージされます。→ `on.push.paths` に `firebase.json` を追加してください。

**コメント要約**: verify が firebase.json を正本とする一方、workflow の paths フィルタに含まれておらず、firebase.json のみ変更の PR では Deploy functions が走らない。paths に firebase.json を追加すべき。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 指摘どおり CI と verify の前提が矛盾していた。`on.push.paths` に `'firebase.json'` を追加済み。

---

**識別子**: RC-4（GitHub id: 3789226937）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:61`

**該当コード（レビュー時点の diff）**:

```diff
+        for step_line in block:
+            if step_line.startswith("args:"):
+                return step_line.split(":", 1)[1].strip().strip("'\"")
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  `with.args` の階層だけを解析する**

既存指摘への修正後も、新しい実装は Deploy ステップ配下をすべて平坦化し、最初の `args:` を返しています。たとえば `env.args: '--only functions'` の後に実際の `with.args: '--only hosting'` があると検証が成功するため、workflow の実際のデプロイ引数を保証できません。YAML を構造として読み、対象ステップの `with.args` のみに限定してください。

**コメント要約**: ステップ配下を平坦化すると env.args 等の decoy が先にマッチし false negative になる。`with:` 直下の `args` のみを解析すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `_parse_with_args` で `with:` ブロック内のみ走査するよう修正。env.args decoy のテスト追加済み。

---

**識別子**: RC-5（GitHub id: 3789227550）

**レビュワー**: Copilot

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:64`

**該当コード（レビュー時点の diff）**:

```diff
+        if line.strip() != "- name: Deploy to Firebase":
+            continue
```

**レビュワーのコメント（原文）**:

[must] `parse_deploy_step_args()` が `- name: Deploy to Firebase` というステップ名に依存しており、ステップ名の変更だけで `verify:functions-deploy` が落ちる（デプロイ設定自体は正しいのに false negative になる）状態です。`uses: ./.github/actions/deploy` を含む step ブロックを検出する方式にすると、意図した厳密検証を維持したまま brittle さを下げられます。

**コメント要約**: ステップ名固定は brittle。`uses: ./.github/actions/deploy` を含むブロック検出に変更すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `_iter_deploy_action_step_lines` で `uses: ./.github/actions/deploy` を検出。ステップ名変更でも通るテスト追加済み。

---

**識別子**: RC-6（GitHub id: 3789227556）

**レビュワー**: Copilot

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:102`

**該当コード（レビュー時点の diff）**:

```diff
+        codebases.append(codebase)
+    return codebases
```

**レビュワーのコメント（原文）**:

[must] `verify:functions-deploy` は `functions/default/src/index.ts` を export 正本として検証していますが、`firebase.json` 側の `functions[].source` が `functions/default` であることは検証していません。もし `source` が別ディレクトリに変更されても、現状だと codebase が `default` のままならチェックが通ってしまい、誤った Functions をデプロイする設定ミスを見逃します。`functions[].source` も `functions/default` 単一であることを静的検証に含めてください。

**コメント要約**: codebase のみ検証で source 変更を見逃す。`functions[].source` が `functions/default` 単一であることも検証すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `parse_firebase_functions_config` で source も取得し `functions/default` 単一を検証。不正 source のテスト追加済み。

---

**識別子**: RC-7（GitHub id: 3789226936）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:147`

**該当コード（レビュー時点の diff）**:

```diff
+    if codebases and codebases != ["default"]:
+        errors.append(
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  空の functions 配列を検証エラーにする**

`firebase.json` の `functions` が空配列の場合、`codebases` も空になってこの条件を通過するため、`verify:functions-deploy` は「codebase: default」と誤って成功します。この状態では default codebase が存在せず、PR verify が通った後に実デプロイが失敗するため、空配列も `['default']` 以外としてエラーにしてください。

**コメント要約**: 空 `functions` 配列だと `codebases and ...` が false のまま通過する。空配列もエラーにすべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `if not codebases:` で空配列をエラー化。ユニットテスト追加済み。

---

## 評価セッション（2026-08-15 20:03・shokujii-code-review）

- **評価日時**: 2026-08-15 20:03 JST
- **評価者**: Cursor Agent（`/shokujii-code-review` セルフレビュー）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a/3b 自動修正**: RC-9（🟡 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-9 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | parse 例外時に「functions が空」が重複<br>`firebase_config_ok` で空チェックを分離 |

---

**識別子**: RC-9（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:185`

**該当コード（レビュー時点の diff）**:

```diff
+    try:
+        codebases, sources = parse_firebase_functions_config(firebase_path)
+    except (ValueError, json.JSONDecodeError) as exc:
+        errors.append(str(exc))
+        codebases = []
+        sources = []
+
+    if not codebases:
+        errors.append(f"firebase.json functions が空です: {firebase_path}")
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `parse_firebase_functions_config` が `ValueError` / `JSONDecodeError` で失敗した場合も `codebases == []` となり、本来の parse エラーに加えて「functions が空です」が重複付与される。→ parse 成功時のみ空配列・codebase/source チェックを実行する。

**コメント要約**: firebase.json の parse 失敗時に誤った「空配列」エラーが追加される。成功フラグで後続チェックを分離すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `firebase_config_ok` フラグを導入し、parse 成功時のみ空配列・codebase/source 検証を実行。重複エラー防止のテスト追加済み。

---

## 評価セッション（2026-08-15 20:05・review-comments-evaluate）

- **評価日時**: 2026-08-15 20:05 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・wait-ai-pr-review wake）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **REVIEW_REQUEST_SINCE**: 2026-08-15T10:54:07Z
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **新規 RC なし**（`since` 以降の未評価コメントなし）
- **手順 4a 自動修正**: なし

### RC 一覧（サマリ）

（本セッションで新規 RC なし）

---

## 評価セッション（2026-08-15 20:20・shokujii-code-review）

- **評価日時**: 2026-08-15 20:20 JST
- **評価者**: Cursor Agent（`shokujii-code-review` セルフレビュー）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **レビュー範囲**: `git diff origin/development...HEAD` + RC-4〜RC-9 対応の未コミット差分
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3a / 3b 自動修正**: RC-13（🚨 1 件）、RC-11 / RC-12 / RC-15（🟡 3 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [ ] | RC-10 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 禁止パターンの単語一致で誤検知<br>hybrid / pf / enterprise の語だけで CI が落ちる |
| [x] | RC-11 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 戻り値型注釈欠落 + 空行 1 行<br>`Iterator[list[str]]` 付与・空行 2 行に統一 |
| [x] | RC-12 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | テスト専用の未使用ラッパー残存<br>`parse_firebase_functions_codebases` を削除 |
| [x] | RC-13 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📄 ドキュメントのみ | S | `--force` 廃止で orphan 残存時にデプロイ abort<br>初回デプロイ前の明示削除を手順書に明記 |
| [x] | RC-14 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | M | verify のユニットテストが CI 未実行<br>pr-verify・lint-and-format・hook に追加 |
| [x] | RC-15 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | WS-A 実装設計の 3 job 記述が旧構成のまま<br>#2260 で 1 ジョブ化した旨を追記 |

---

**識別子**: RC-10（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:30`

**該当コード（レビュー時点の diff）**:

```diff
+FORBIDDEN_DEPLOY_PATTERNS = (
+    (re.compile(r"\bstrategy\s*:"), "strategy.matrix（3 ジョブ並列）"),
+    (re.compile(r"\bdeploy_group\b"), "workflow_dispatch.inputs.deploy_group"),
+    (re.compile(r"\bhybrid\b"), "hybrid グループ"),
+    (re.compile(r"\bpf\b"), "pf グループ"),
+    (re.compile(r"\benterprise\b"), "enterprise グループ"),
+    (re.compile(r"--force"), "--force 引数"),
+)
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `\bhybrid\b` / `\bpf\b` / `\benterprise\b` を yml 全文に対する単語一致で禁止しているため、将来コメントや別ステップに同じ語が出ただけで「廃止された設定が残っています」と誤検知して PR verify が落ちます。旧構成の復活は `strategy:` / `deploy_group` / `--force` と `with.args` の厳密検証で検出できるので、グループ名 3 件は外すか `--only functions:`（明示リスト指定）の検出に置き換える方が安全です。

**コメント要約**: グループ名の単語一致は誤検知しやすい。構造的な検査（`strategy:` / `deploy_group` / `--only functions:`）に寄せるべき。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 「3 パターンを削除」「`--only functions:` 検出へ置換」「対象行スコープを限定」の複数案があり修正方針が一意でないため、[auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の条件付き自動修正の対象外。ガード強度の設計判断としてユーザー確認を待つ。

---

**識別子**: RC-11（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:36`

**該当コード（レビュー時点の diff）**:

```diff
 )
 
-def parse_deploy_step_args(deploy_path: Path) -> str | None:
+def _iter_deploy_action_step_lines(lines: list[str]):
+    """`uses: ./.github/actions/deploy` を含むステップの子行を yield する。"""
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `_iter_deploy_action_step_lines` だけ戻り値の型注釈がなく（同ファイルの他関数はすべて明示）、直前の空行も 1 行で他の top-level 定義（2 行）と不揃いです。→ `-> Iterator[list[str]]` を付与し、空行を 2 行に統一してください。

**コメント要約**: 新規ジェネレータ関数の戻り値型注釈欠落と空行の不統一。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `from collections.abc import Iterator` を追加し `-> Iterator[list[str]]` を付与。空行も 2 行に統一済み。

---

**識別子**: RC-12（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:137`

**該当コード（レビュー時点の diff）**:

```diff
+def parse_firebase_functions_codebases(firebase_path: Path) -> list[str]:
+    codebases, _ = parse_firebase_functions_config(firebase_path)
     return codebases
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-6 対応で `parse_firebase_functions_config` に置き換えた後、`parse_firebase_functions_codebases` は本体から呼ばれずユニットテスト 1 箇所からしか使われていません（刷新後に残った未使用ヘルパー）。→ 削除し、テストを `parse_firebase_functions_config` に寄せてください。

**コメント要約**: 置換後に残った未使用ラッパー。削除してテストを新関数に統一する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: ラッパーを削除し、`test_parse_firebase_functions_config` で codebase / source の両方を検証する形に更新。14 テスト green。

---

**識別子**: RC-13（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/workflows/deploy_functions.yml:64`

**該当コード（レビュー時点の diff）**:

```diff
-      - name: Deploy to Firebase (${{ matrix.group }})
+      - name: Deploy to Firebase
         uses: ./.github/actions/deploy
         with:
           project_id: ${{ vars.PROJECT_ID }}
-          args: ${{ steps.targets.outputs.args }}
+          args: '--only functions'
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📄ドキュメントのみ/S]: `--force` なし × `--only functions`（codebase 全体）では、`default` codebase の関数が GCP 上に残っていて `index.ts` に export が無い場合、Firebase CLI が削除確認を出し、非対話の Actions では `Command aborted.` で exit 非 0 になります。旧 CI は `--force --only functions:<明示リスト>` だったため、**リスト外の残存関数は削除対象にすらならず温存**されています。実際に [21_bot_legacy移行.md §7.5](../07_リファクタリング/21_bot_legacy移行.md) の「旧 Gen1 8 件の明示削除」「`--only functions` の exit 0 確認」は未実施 `[ ]`、§5.12 の旧 Gen2 名（`eventNotification` / `orderNotification`）と [デプロイ手順_v2.12 §C-1](../デプロイ手順/デプロイ手順_v2.12_260719.md) の旧 `backupFirestore` も削除チェックが `[ ]` のままです。→ マージ後の初回デプロイ前に各環境で orphan を明示削除する前提を手順書に明記してください。

**コメント要約**: `--force` 廃止により、GCP に残る default codebase の orphan があると初回デプロイが abort する。前提条件がどのドキュメントにも書かれていない。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: [21_bot_legacy移行.md](../07_リファクタリング/21_bot_legacy移行.md) §7.5 に「#2260 マージ後の初回デプロイ前に必須」の前提ブロックを追加し、[デプロイ手順_v2.11](../デプロイ手順/デプロイ手順_v2.11_260716.md) のトラブルシュートに `Command aborted` の症状・原因・`functions:delete` での対処を追加。**各環境の残存関数の実査（`firebase functions:list`）と削除は人手の運用作業**のため、ユーザーへ報告する。

---

**識別子**: RC-14（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/workflows/pr-verify.yml:74`

**該当コード（レビュー時点の diff）**:

```yaml
      - name: Verify Functions deploy list
        run: npm run verify:functions-deploy
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/M]: CI は `verify:functions-deploy` のみ実行し、本 PR で大幅に追加した `test:verify-functions-deploy`（ユニットテスト 14 件）はどのワークフローでも実行されません。CI ゲートを支える検証スクリプトのテストが無検証のまま腐ります。→ pr-verify の verify ジョブに追加してください。

**コメント要約**: verify スクリプトのユニットテストが CI 未実行。pr-verify に追加すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: M

**判断理由**: 工数 M のため条件付き自動修正の対象外としてユーザーに確認し、対応の指示を受けて実施。`pr-verify.yml` の verify ジョブに `Test Functions deploy verifier` ステップを追加し、[lint-and-format](../../.agents/skills/lint-and-format/SKILL.md)（手順 0・チェック内容・実行順・報告フォーマット）と `.agents/hooks/lint-and-format-check.sh` の項目一致も更新。

---

**識別子**: RC-15（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/08_エンタープライズ/30_リファクタ計画/03_WS-A実装設計.md:137`

**該当コード（レビュー時点の diff）**:

```markdown
- `functions/**` push 時: 3 job 並列（同一 codebase・選択 `--only functions:a,functions:b`）
- `workflow_dispatch` で個別 job も手動発火可
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 本 PR は [01_MVP全体計画.md](../08_エンタープライズ/00_計画/01_MVP全体計画.md) の A-6 に #2260 での 1 ジョブ化を追記していますが、同じ A-6 を扱う WS-A 実装設計の §A-6 は「3 job 並列」「`deploy_group` で個別発火」のまま残っており、現行 CI と矛盾します。→ 同様に #2260 での簡素化を追記してください。

**コメント要約**: A-6 を記述する別ドキュメントが旧構成のまま。#2260 の追記漏れ。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: §A-6 の運用節に「現行: #2260 で 1 ジョブ + `--only functions` に簡素化済み。3 job 分類・`deploy_group` は廃止（本節は設計当時の記録）」を追記。

---

## 評価セッション（2026-08-15 20:24・review-comments-evaluate auto）

- **評価日時**: 2026-08-15 20:24 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・wait-ai-pr-review wake）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **REVIEW_REQUEST_SINCE**: 2026-08-15T11:17:30Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 2（Copilot 問題なしサマリ、Codex 接続案内）
- **手順 4a 自動修正**: RC-10, RC-16（🟡 2 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-10 | 3789259329 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 禁止パターンの単語一致で誤検知<br>hybrid/pf/enterprise 語を削除し構造検出に限定 |
| [x] | RC-16 | 3789259325 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | 最初の deploy ステップのみ検証<br>全件収集し 1 件 + `--only functions` を厳密検証 |

---

**識別子**: RC-10（GitHub id: 3789259329）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:33`

**該当コード（レビュー時点の diff）**:

```python
    (re.compile(r"\bhybrid\b"), "hybrid グループ"),
    (re.compile(r"\bpf\b"), "pf グループ"),
    (re.compile(r"\benterprise\b"), "enterprise グループ"),
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  廃止構成ではなく構造を限定して検出する**

`hybrid`、`pf`、`enterprise` を YAML 全文で単語検索しているため、たとえばコメントに `enterprise rollout` と追記しただけでも `verify:functions-deploy` が失敗し、無関係な workflow 更新が PR verify でブロックされます。旧グループ構成を検出する場合は、単語そのものではなく `deploy_group` や旧 `--only functions:<name>` のような廃止された設定の構造に限定してください。

**コメント要約**: 禁止パターンの単語一致がコメント等で誤検知。構造的検出に限定すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-10 と同一指摘。`hybrid`/`pf`/`enterprise` の単語パターンを削除し、`--only functions:`（旧グループ別デプロイ）を追加。`strategy`/`deploy_group`/`--force` で廃止構成は引き続き検出。

---

**識別子**: RC-16（GitHub id: 3789259325）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:92`

**該当コード（レビュー時点の diff）**:

```python
    for step_lines in _iter_deploy_action_step_lines(lines):
        args = _parse_with_args(step_lines)
        if args is not None:
            return args
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  デプロイアクションを一件に限定して全件検証する**

既存指摘への修正後も、このループは最初に `args` が見つかった時点で返るため、正しい `--only functions` のステップの後に別ジョブまたは別ステップとして `./.github/actions/deploy` + `--only hosting` などが追加されても検証が成功します。これでは「1 ジョブ」も実際の全デプロイ引数も保証できず、PR verify 通過後に意図しない追加デプロイが実行されるため、対象アクションを全件収集し、件数が1件かつその `with.args` が厳密に `--only functions` であることを検証してください。

**コメント要約**: 最初の deploy ステップだけ見ており、追加 deploy ステップを見逃す。全件収集して 1 件のみ `--only functions` を検証すべき。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `parse_deploy_step_args_list` で全 deploy ステップの args を収集し、件数 1 かつ値が `--only functions` であることを検証。複数ステップ検出のユニットテストを追加。

---

## 評価セッション（2026-08-15 20:52・shokujii-code-review）

- **評価日時**: 2026-08-15 20:52 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-17（🟡 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-17 | なし | 👌 修正不要 | — | — | 📏 規約 | 🔧 微修正 | S | retry_force 未設定の regression 検出なし<br>`--force` 再試行の撤去で検証対象自体が消滅 |

---

**識別子**: RC-17（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/workflows/deploy_functions.yml:63`

**該当コード（レビュー時点の diff）**:

```yaml
      - name: Deploy to Firebase
        uses: ./.github/actions/deploy
        with:
          project_id: ${{ vars.PROJECT_ID }}
          args: '--only functions'
          retry_force_on_failure_policy: 'true'
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: failure policy 用 `--force` 再試行は `retry_force_on_failure_policy: 'true'` に依存するが、`verify_functions_deploy_list.py` は `args: '--only functions'` のみ検証し、この入力の有無を見ていない。将来 yml から外されても PR verify が通り、sandbox 初回デプロイが再び失敗する regression になる。→ `--only functions` 時は `retry_force_on_failure_policy: 'true'` を静的検証に追加してください。

**コメント要約**: fallback 有効化フラグの regression 検出が verify に無い。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: いったん `_parse_retry_force_on_failure_policy` で必須化したが、2026-08-15 21:30 セッションで `--force` 自動再試行そのものを撤去したため、検証対象の入力が存在しなくなった。verify 側の検証と関連テストも削除済み。

---

## 評価セッション（2026-08-15 20:58・shokujii-code-review）

- **評価日時**: 2026-08-15 20:58 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-19 / RC-20 / RC-21 / RC-22 / RC-23 / RC-25 / RC-28（🟡 7 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-18 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📐 リファクタ | S | `with:` 直下パーサが 2 関数でほぼ重複<br>retry_force パーサ削除で 1 本に |
| [x] | RC-19 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 後方互換ラッパーがテスト専用で残存<br>`parse_deploy_step_args` を削除 |
| [x] | RC-20 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | 同一 yml を 2 回 read_text<br>`deploy_text.splitlines()` に統一 |
| [x] | RC-21 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | export parse 例外時にエラーが重複<br>RC-9 と同じ形に整理 |
| [x] | RC-22 | なし | 👌 修正不要 | — | — | 📏 規約 | 📄 ドキュメントのみ | S | 報告テンプレに force fallback 行が無い<br>fallback テストごと撤去し記述を削除 |
| [x] | RC-23 | なし | 🟡 修正提案 | 📤 #2273 別Issue化 | 📤 スコープ外 | 🔐 セキュリティ | 🔧 微修正 | S | inputs を run に直接展開<br>共通 action のため #2273 で対応 |
| [x] | RC-24 | なし | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📋 仕様追加 | M | orphan ガードが CLI の prompt 順序で無効化<br>`--force` 自動再試行を撤去し手動運用に統一 |
| [x] | RC-25 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | テストの未使用 `assert_exit`<br>デッドコードを削除（後にファイルごと撤去） |
| [x] | RC-26 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | `orphan_and_failure_policy` モックが実挙動と乖離<br>テストファイルごと撤去で解消 |
| [ ] | RC-27 | なし | 🟡 修正提案 | 未着手 | 📌 スコープ内 | — | 👀 確認のみ | — | 87 export を 1 ジョブ逐次で 30 分 timeout<br>実測に対する余裕の確認が必要 |
| [x] | RC-28 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 📄 ドキュメントのみ | S | `--force` 廃止の副作用 2 件が手順書に無い<br>unsafe migration skip・cleanup policy を追記 |

---

**識別子**: RC-18（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:63`

**該当コード（レビュー時点の diff）**:

```python
def _parse_with_args(step_lines: list[str]) -> str | None:
def _parse_retry_force_on_failure_policy(step_lines: list[str]) -> bool:
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📐リファクタ/S]: `_parse_with_args` と `_parse_retry_force_on_failure_policy` は `with:` ブロックの走査ロジックが完全に同一で、末尾のキー名と戻り値型だけが違う。将来 `with:` 配下の検証キーが増えるたびに同じループが増える。→ `_parse_with_value(step_lines, key) -> str | None` に共通化し、呼び出し側で `== 'true'` 判定する形を検討してください。

**コメント要約**: `with:` パーサの重複。キー名引数で共通化できる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📐 リファクタ

**想定工数**: S

**判断理由**: 当初は 📐 リファクタのため [auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の自動修正対象外としたが、`--force` 自動再試行の撤去で `_parse_retry_force_on_failure_policy` を削除したため重複そのものが解消。`with:` 直下パーサは `_parse_with_args` の 1 本のみになった。

---

**識別子**: RC-19（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:119`

**該当コード（レビュー時点の diff）**:

```python
def parse_deploy_step_args(deploy_path: Path) -> str | None:
    """後方互換: 最初の deploy ステップの with.args を返す。"""
    args_list = parse_deploy_step_args_list(deploy_path)
    return args_list[0] if args_list else None
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: RC-16 で `parse_deploy_step_args_list` に置き換えた後、`parse_deploy_step_args` は本体から呼ばれずテストからのみ参照されている（RC-12 で削除した `parse_firebase_functions_codebases` と同じパターンの再発）。「最初の 1 件だけ返す」API が残ると、複数ステップを許さない現仕様と誤解を招く。→ ラッパーを削除し、テストを `parse_deploy_step_args_list` に寄せてください。

**コメント要約**: テスト専用の後方互換ラッパーが残存。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: ラッパーを削除し、`test_parse_deploy_step_args_list_ignores_step_name` として `parse_deploy_step_args_list` を検証する形に更新。17 件のユニットテストは全件成功。

---

**識別子**: RC-20（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:200`

**該当コード（レビュー時点の diff）**:

```python
    else:
        lines = deploy_path.read_text(encoding="utf-8").splitlines()
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: 同関数の冒頭で `deploy_text = deploy_path.read_text(...)` を読んでいるのに、retry_force 検証で同じファイルを再度 read_text している。読み込み途中でファイルが変わると検証対象が食い違う余地も残る。→ `lines = deploy_text.splitlines()` に置き換えてください。

**コメント要約**: 同一 yml を 2 回読み込んでいる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `deploy_text.splitlines()` に統一。

---

**識別子**: RC-21（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:213`

**該当コード（レビュー時点の diff）**:

```python
    try:
        exports = parse_index_exports(index_path)
    except ValueError as exc:
        errors.append(str(exc))
        exports = set()

    if not exports:
        errors.append(f"index.ts に export がありません: {index_path}")
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `export const { ... }` ブロックが見つからない場合、`ValueError` のメッセージと「export がありません」の 2 件が同時に出て、原因が 1 つなのにエラーが重複する（RC-9 で firebase.json 側は `firebase_config_ok` で分離済み）。→ 空判定を `try` 内に移し、parse 失敗時は 1 件だけ報告してください。

**コメント要約**: export parse 例外時にエラーが重複する。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: 空判定を `try` 内に移動。空 export のテスト（`test_collect_deploy_config_errors_empty_exports`）は従来どおり成功。

---

**識別子**: RC-22（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.agents/skills/lint-and-format/SKILL.md:144`

**該当コード（レビュー時点の diff）**:

```
0. verify:functions-deploy
- functions deploy 設定: ✅ 成功 / ❌ 失敗
- functions deploy verifier テスト: ✅ 成功 / ❌ 失敗
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: 手順 0 と「制約」の実行順には `test:firebase-deploy-force-fallback` が入っているが、手順 7 の報告テンプレートには行が無く、エージェントが 3 コマンド実行しても 2 行しか報告しない。→ 報告テンプレートにも force fallback テストの行を追加してください。

**コメント要約**: 報告テンプレートが実行コマンドと不一致。

**評価**: 👌 修正不要

**ステータス**: —

**PRスコープ**: —

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: いったんテンプレートに行を追加したが、`--force` 自動再試行の撤去で `test:firebase-deploy-force-fallback` 自体が無くなったため、手順 0・実行順・報告テンプレートの 3 箇所から記述を削除して不一致を解消した。

---

**識別子**: RC-23（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/actions/deploy/action.yml:28`

**該当コード（レビュー時点の diff）**:

```yaml
      run: |
        DEPLOY_SCRIPT="${{ github.workspace }}/.github/scripts/firebase-deploy-with-force-fallback.sh"
        DEPLOY_ARGS=()
        if [ -n "${{ inputs.args }}" ]; then
          DEPLOY_ARGS=(--args "${{ inputs.args }}")
        fi
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `inputs.args` / `inputs.project_id` を `run` 本文へ直接展開している。式展開はシェル解釈前にテキスト置換されるため、値にクォートが含まれると構文が壊れ、呼び出し元が変数由来の値を渡すようになった時点でコマンド注入になる（GitHub 公式も env 経由を推奨）。共通 composite action で全 deploy workflow が通る経路なので、影響範囲が広い。→ `env:` に渡してシェル変数として参照してください。

**コメント要約**: composite action の inputs を run に直接展開している。

**評価**: 🟡 修正提案

**ステータス**: 📤 #2273 別Issue化

**PRスコープ**: 📤 スコープ外

**ラベル**: 🔐 セキュリティ

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `action.yml` は 7 つの deploy workflow が共有する共通部品で、本 PR（functions の CI デプロイ簡素化）とは影響範囲が異なる。`--force` 自動再試行の撤去に伴い `action.yml` を `origin/development` の状態へ戻したため env 化も未実施。現状の呼び出し元は yml 直書きの固定文字列のみで実害はないため、単独 PR で対応する。
https://github.com/nijuniinc/bokudeli-event-new/issues/2273

---

**識別子**: RC-24（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/scripts/firebase-deploy-with-force-fallback.sh:70`

**該当コード（レビュー時点の diff）**:

```bash
if grep -q "do not exist in your local source" "$LOG"; then
  echo "::error::Orphan Cloud Functions remain in the project. ..." >&2
  exit "$code"
fi

if grep -q "Pass the --force option to deploy functions with a failure policy" "$LOG"; then
  run_deploy true
```

**レビュワーのコメント（原文）**:

🚨 **必須修正** [📋仕様追加/M]: firebase-tools 15.15.0 では failure policy の確認は **prepare フェーズ**（`deploy/functions/prepare.ts` の `promptForFailurePolicies`）、orphan 削除の確認は **release フェーズ**（`deploy/functions/release/index.ts` の `promptForFunctionDeletion`）で行われる。非対話で failure policy が引っかかると prepare で abort するため、**orphan が存在してもログに「do not exist in your local source」が出ない**。この状態で `--force` 再試行すると `promptForFunctionDeletion` が即 true を返し、**orphan 関数が無確認で削除される**（リネーム移行中なら旧関数が消えてイベントロスになりうる）。スクリプト冒頭コメントと手順書が謳う「orphan 検出時は再試行しない」という安全性が成立していない。→ 再試行前に orphan 不在を能動的に検査する（`functions:list` と index.ts export の比較を CI ステップ化する等）か、自動再試行をやめて手順書の手動 `--force` 運用に寄せるか、いずれかの方針を選んでください。

**コメント要約**: failure policy abort 時は orphan メッセージが出ないため、`--force` 再試行で orphan が黙って削除される。

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📋 仕様追加

**想定工数**: M

**判断理由**: 提示した 2 案のうちユーザー判断で「自動再試行をやめて手動 `--force` 運用に寄せる」を採用。`firebase-deploy-with-force-fallback.sh` とテスト・`retry_force_on_failure_policy` 入力を撤去し、CI は `--force` なしの `deploy --only functions` 1 コマンドのみとした。CLI の abort をそのまま CI 失敗として扱うため、orphan が無確認削除される経路自体が消えた。仕様は [functions の CI デプロイ](../実装メモ/functionsのCIデプロイ.md)に明文化。

---

**識別子**: RC-25（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/scripts/firebase-deploy-with-force-fallback.test.sh:12`

**該当コード（レビュー時点の diff）**:

```bash
assert_exit() {
  local expected=$1
  shift
  set +e
  "$@" >/dev/null 2>&1
  local actual=$?
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: `assert_exit` はどこからも呼ばれていないデッドコード（実際のアサーションは `run_script` が担当）。→ 削除してください。

**コメント要約**: テストの未使用ヘルパー関数。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `assert_exit` を削除。テストは 6 件成功のまま。その後 RC-24 の方針決定によりテストファイルごと撤去。

---

**識別子**: RC-26（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/scripts/firebase-deploy-with-force-fallback.test.sh:97`

**該当コード（レビュー時点の diff）**:

```bash
  orphan_and_failure_policy)
    echo "The following functions are found in your project but do not exist in your local source"
    echo "Pass the --force option to deploy functions with a failure policy"
    echo "Command aborted."
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🔧微修正/S]: このモックは 1 回の実行で両メッセージを出すが、実際の firebase-tools は failure policy（prepare）で abort するため orphan メッセージ（release）まで到達しない。RC-24 の穴を「テスト済み」に見せてしまう。→ RC-24 の方針決定後、実 CLI の出力順に合わせてモードを分けてください（failure policy のみ出力 + orphan は別モード）。

**コメント要約**: モックの出力が実 CLI の順序と乖離している。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-24 の方針決定（自動再試行の撤去）により `firebase-deploy-with-force-fallback.test.sh` ごと削除。実 CLI 挙動と乖離したモードは存在しなくなった。

---

**識別子**: RC-27（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `.github/workflows/deploy_functions.yml:30`

**該当コード（レビュー時点の diff）**:

```yaml
    timeout-minutes: 30
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [👀確認のみ/—]: 旧構成は 3 ジョブ並列 × 10 分だったが、新構成は 87 export を 1 ジョブで処理する。firebase-tools 側のリトライ（429 バックオフ最大 100 秒 × 最大 30 回）が効くと 30 分を超える可能性があり、timeout でジョブが切られると一部 Function だけ更新された状態になる。→ development での初回実測時間を確認し、余裕が薄い場合は timeout を引き上げてください。

**コメント要約**: 1 ジョブ化に対する 30 分 timeout の余裕確認。

**評価**: 🟡 修正提案

**ステータス**: 未着手

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 👀 確認のみ

**想定工数**: —

**判断理由**: 実測値に基づく値決めが必要なため自動修正しない（実測前に数値を変えると根拠のないマジックナンバーになる）。

---

**識別子**: RC-28（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `documents/デプロイ手順/デプロイ手順_v2.11_260716.md:412`

**該当コード（レビュー時点の diff）**:

```markdown
### `Deploy functions` が failure policy で `--force` を要求する
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: `--force` を常時付けていた旧 CI と比べ、`--force` なしでは (1) `promptForUnsafeMigration` が危険なトリガー変更を**警告のみでスキップ**して成功扱いにする（CI は緑のまま Function が旧トリガーで残る）、(2) `promptForCleanupPolicyDays` が cleanup policy 未設定リージョンでデプロイ成功後に失敗する、という 2 つの新しい失敗モードが生じる。どちらも自動 `--force` 再試行の対象外なのに手順書に記載が無い。→ トラブルシュートに追記してください。

**コメント要約**: `--force` 廃止で生じる副作用 2 件が手順書に無い。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: `デプロイ手順_v2.11` のトラブルシュートに「成功しているのにトリガーが更新されない」「デプロイ後に cleanup policy エラーで失敗する」の 2 節を追加（対処コマンド付き）。

---

## 評価セッション（2026-08-15 21:05・review-comments-evaluate auto）

- **評価日時**: 2026-08-15 21:05 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・PR review wake）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **REVIEW_REQUEST_SINCE**: 2026-08-15T11:55:38Z
- **Outdated 除外件数**: 0
- **手順 4a 自動修正**: RC-29, RC-30, RC-31（🟡 3 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-29 | 3789316862 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 🐛 実害 | 🔧 微修正 | S | args 未設定 deploy ステップが件数検証をすり抜ける<br>全 deploy ステップをカウントするよう修正 |
| [x] | RC-30 | 3789316863 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | CI デプロイ検証ファイル変更で lint hook がスキップ<br>source-change-detect にパス追加 |
| [x] | RC-31 | 3789316864 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 🔧 微修正 | S | orphan テストが exit code のみで再試行を未検証<br>後に fallback 撤去でテストごと削除 |

---

**識別子**: RC-29（GitHub id: 3789316862）

**レビュワー**: Codex

**指摘箇所**: `.agents/scripts/verify_functions_deploy_list.py:108`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [🐛実害/S]: `parse_deploy_step_args_list` が args 未設定の deploy ステップを除外しているため、2 件目に args なし `./.github/actions/deploy` を置くと件数 1 と誤判定する。→ deploy action ステップは args の有無に関わらず全件カウントしてください。

**コメント要約**: args 未設定の deploy ステップが件数検証を bypass できる。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🐛 実害

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `parse_deploy_step_args_list` が deploy action ステップ全件を返すよう変更。args なし decoy ステップ検出テストを追加。

---

**識別子**: RC-30（GitHub id: 3789316863）

**レビュワー**: Codex

**指摘箇所**: `.agents/hooks/source-change-detect.sh:29`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📏規約/S]: verify スクリプト・deploy action・fallback スクリプトのみ変更した PR で lint hook がスキップされる。→ `is_lint_relevant_path` に `.github/scripts/*`、`.github/actions/*`、verify スクリプトを追加してください。

**コメント要約**: CI デプロイ検証ファイル変更時に lint-and-format が走らない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: `source-change-detect.sh` の lint 対象に verify スクリプト・`.github/scripts/*`・`.github/actions/*` を追加。

---

**識別子**: RC-31（GitHub id: 3789316864）

**レビュワー**: Codex

**指摘箇所**: `.github/scripts/firebase-deploy-with-force-fallback.test.sh:79`

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📏規約/S]: orphan モードのテストが exit code のみを見ており、`--force` 再試行が発生しないこと（firebase 呼び出し 1 回）を検証していない。→ モックに呼び出しログを追加し、orphan 時に `--force` なし 1 回のみであることを assert してください。

**コメント要約**: orphan テストが再試行抑止を十分に検証していない。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: モック firebase に呼び出しログを追加。`assert_no_force_retry` で exit=1・呼び出し 1 回・`--force` なしを検証（orphan / orphan_and_failure_policy）。その後 RC-24 の方針決定により fallback スクリプトごと撤去したため、当該テストは削除済み（`--force` 再試行が存在しないため検証不要）。

---

## 方針変更セッション（2026-08-15 21:30・仕様簡素化）

- **実施日時**: 2026-08-15 21:30 JST
- **実施者**: Cursor Agent（ユーザー判断による仕様再検討）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **背景**: RC-24（orphan ガードのバイパス）の対応方針として、ユーザーが「CI から `--force` 自動再試行を撤去し、CLI の abort をそのまま失敗として扱う」を選択

### 変更内容

| 対象 | 変更 |
| :-- | :-- |
| `.github/scripts/firebase-deploy-with-force-fallback.sh` / `.test.sh` | 削除 |
| `.github/actions/deploy/action.yml` | `origin/development` の状態に復帰（`retry_force_on_failure_policy` 入力と env 化を撤回） |
| `.github/workflows/deploy_functions.yml` | `retry_force_on_failure_policy` と fallback スクリプトの paths を削除 |
| `.github/workflows/pr-verify.yml` / `package.json` / `.agents/hooks/lint-and-format-check.sh` | fallback テストの実行を削除 |
| `.agents/scripts/verify_functions_deploy_list.py` / `_test.py` | `_parse_retry_force_on_failure_policy` と関連テストを削除 |
| `documents/実装メモ/functionsのCIデプロイ.md` | 新規作成（CI デプロイ仕様の正本） |
| `documents/デプロイ手順/デプロイ手順_v2.11_260716.md` / `documents/07_リファクタリング/21_bot_legacy移行.md` | 自動再試行前提の記述を手動 `--force` 運用に修正 |

### RC ステータス変更

| RC | 変更前 | 変更後 | 理由 |
| :-- | :-- | :-- | :-- |
| RC-17 | 🟡 / ✅ 対応済み | 👌 修正不要 / — | 検証対象の入力が消滅 |
| RC-18 | 🟡 / 未着手 | 🟡 / ✅ 対応済み | 重複していたパーサを削除 |
| RC-22 | 🟡 / ✅ 対応済み | 👌 修正不要 / — | fallback テストごと撤去 |
| RC-23 | 🟡 / ✅ 対応済み | 🟡 / 📤 #2273 別Issue化 | 共通 action の変更は別 PR |
| RC-24 | 🚨 / 未着手 | 🚨 / ✅ 対応済み | 自動再試行を撤去 |
| RC-26 | 🟡 / 未着手 | 🟡 / ✅ 対応済み | 対象テストを削除 |

RC-27（30 分 timeout の妥当性）は未着手のまま。マージ後の初回デプロイ実測で確認する。

## 評価セッション（2026-08-15 21:40・shokujii-code-review）

- **評価日時**: 2026-08-15 21:40 JST
- **評価者**: Cursor Agent（`/shokujii-code-review`）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **Outdated 除外件数**: 該当なし
- **レビュー非該当スキップ件数**: 該当なし
- **手順 3b 自動修正**: RC-32（🟡 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-32 | なし | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | 新設した CI デプロイ仕様書への参照が無い<br>AGENTS.md・functions 実装スキルにリンクを追加 |

---

**識別子**: RC-32（GitHub id: なし・エージェントレビュー）

**レビュワー**: Cursor Agent（shokujii-code-review）

**指摘箇所**: `AGENTS.md:183`

**該当コード（レビュー時点の diff）**:

```markdown
export 漏れすると development / production では Trigger・Callable が未デプロイのままになる。詳細は `/shokujii-functions-implementation` を参照。PR verify は `npm run verify:functions-deploy` で deploy 設定を検証する。
```

**レビュワーのコメント（原文）**:

🟡 **修正提案** [📄ドキュメントのみ/S]: `documents/実装メモ/functionsのCIデプロイ.md` を CI デプロイ仕様の正本として新設したが、エージェントが最初に読む `AGENTS.md` と `/shokujii-functions-implementation` から参照されていない。デプロイ失敗時の対処法に到達できず、`--force` を安易に足す変更を招く。→ 両ファイルの「Functions 追加時の CI 連携」からリンクしてください。

**コメント要約**: 新設した仕様書への導線が無い。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 📌 スコープ内 + S + 📄 ドキュメントのみ + 修正方針が一意のため [auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の条件付き自動修正対象。`AGENTS.md` と `shokujii-functions-implementation/SKILL.md` の CI デプロイ節に相対リンクを追加。

---

## 評価セッション（2026-08-15 22:00・review-comments-evaluate auto）

- **評価日時**: 2026-08-15 22:00 JST
- **評価者**: Cursor Agent（`/review-comments-evaluate` auto・PR review wake）
- **ブランチ名**: fix/2260
- **PR**: https://github.com/nijuniinc/bokudeli-event-new/pull/2270
- **REVIEW_REQUEST_SINCE**: 2026-08-15T12:53:19Z
- **partial**: false
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 3（依頼コメント・Copilot サマリ・Codex 接続案内）
- **手順 4a 自動修正**: RC-33（🟡 1 件）

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-33 | 3789401935 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S | チャット仕様書に旧 `--only` 更新手順が残存<br>index.ts 更新方式へ修正 |

---

**識別子**: RC-33（GitHub id: 3789401935）

**レビュワー**: Codex（chatgpt-codex-connector[bot]）

**指摘箇所**: `AGENTS.md:184`（インライン。指摘内容は `documents/05_コミュニケーションと通知/04_チャット機能_v2.md:250`）

**レビュワーのコメント（原文）**:

🟡 **修正提案** [P2]: `index.ts` だけを更新する方式へ切り替えていますが、現役のチャット機能仕様書 `documents/05_コミュニケーションと通知/04_チャット機能_v2.md:250` に「export 追加時は `--only` 更新」という旧手順が残っています。今後この仕様書に従って Function を追加すると、不要な workflow 編集を促すうえ、新しい verifier が `--only functions:<name>` を拒否して PR verify を失敗させるため、この行も同じ PR で新方式へ更新してください。

**コメント要約**: チャット機能仕様書に deploy yml 手書きの旧手順が残っている。

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: [auto-fix-policy](../../.agents/skills/review-comments-evaluate/references/auto-fix-policy.md) の条件付き自動修正対象（📌 + S + 📄）。該当行を `functions/default/src/index.ts` の import / export 更新（deploy yml 手書き不要）に修正。リポジトリ内の同一文言は当該 1 箇所のみ。

---
