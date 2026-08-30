# ブランチ feat/2340-sandbox2606-2608-setup レビュー記録

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3889247201 | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>CORS に web.app を追加 |
| [x] | RC-2 | 3889247206 | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>bootstrap メッセージ修正 |
| [x] | RC-3 | 3889249240 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>RC-1 同一 |
| [x] | RC-4 | 3889249246 | chatgpt-codex-connector[bot] | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📄 ドキュメントのみ | S<br>0004 必須化 |
| [x] | RC-5 | 3889249247 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>NUM 許可リスト |
| [x] | RC-6 | 3889249250 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>Slack コマンド名 |
| [x] | RC-7 | なし | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S<br>FIREBASERC 説明 |
| [x] | RC-8 | なし | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S<br>0004 実行リポジトリ |
| [x] | RC-9 | 3889269445 | chatgpt-codex-connector[bot] | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📄 ドキュメントのみ | S<br>Functions は 0004 後 |
| [x] | RC-10 | 3889269456 | chatgpt-codex-connector[bot] | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S<br>Auth ユーザー用意 |
| [x] | RC-11 | 3889269458 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S<br>RC 記録ブロック補完 |
| [x] | RC-12 | 3889269450 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>tfvars 先行作成 |

---

## 評価セッション（2026-08-30 21:12・review-comments-evaluate）

- **評価日時**: 2026-08-30 21:12 JST
- **評価者**: Cursor Agent（review-comments-evaluate manual）
- **ブランチ名**: feat/2340-sandbox2606-2608-setup
- **PR**: #2343
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 0
- **手順 4a 自動修正**: RC-9〜RC-12

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-9 | 3889269445 | chatgpt-codex-connector[bot] | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📄 ドキュメントのみ | S<br>Functions は 0004 後 |
| [x] | RC-10 | 3889269456 | chatgpt-codex-connector[bot] | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 📑 仕様書 | 📄 ドキュメントのみ | S<br>Auth ユーザー用意 |
| [x] | RC-11 | 3889269458 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | 📏 規約 | 📄 ドキュメントのみ | S<br>RC 記録ブロック補完 |
| [x] | RC-12 | 3889269450 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>tfvars 先行作成 |


**識別子**: RC-9（GitHub id: 3889269445）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `documents/firebaseプロジェクト/sandbox2606-2608_環境構築手順.md:153`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+| `PARTNER_ENV` | `partner/.env` 相当 |
+| `FUNCTIONS_ENV` | `functions/default/.env` 相当（`ENTERPRISE_BASE_DOMAIN` は enterprise 未デプロイでも **Functions デプロイに必須**。例: `sandbox2606.tabete.co`。`setup-sandbox-github-vars.sh` が設定） |
+
+#### Secrets
+
+| Secret | 内容 |
+| ------ | ---- |
+| `GCLOUD_SERVICE_KEY` | `firebase-deploy@<PROJECT_ID>.iam.gserviceaccount.com` の JSON キー |
+| SendGrid / Slack / LINE 等 | 使う機能分（development と同系統で可） |
+
+#### GCP Secret Manager（Functions 用）
+
+[firebaseプロジェクト新規作成.md §7](./firebaseプロジェクト新規作成.md) の 12 件に**値のみ**登録。Stripe は Test mode で統一（[Stripe 環境構築手順](../07_リファクタリング/03_stripe決済の環境構築手順.md)）。
+
+**PF 版で不要なもの**
+
+- `ENTERPRISE_ENV`
+- `deploy_enterprise.yml`
+- `tabete.co` DNS / Hosting カスタムドメイン
+
+---
+
+## 5. Phase 2: 初回デプロイ（環境ごと）
+
+推奨順:
+
+```text
+firestore → storage → functions → user → partner
+```
+
+```bash
+# development ブランチ未作成時は --ref release/sandbox-initial
+gh workflow run deploy_firestore.yml --repo nijuni-yasu/bokudeli-event-yasu-2606 --ref development
+gh workflow run deploy_storage.yml  --repo nijuni-yasu/bokudeli-event-yasu-2606 --ref development
+gh workflow run deploy_functions.yml --repo nijuni-yasu/bokudeli-event-yasu-2606 --ref development
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  メール送信 Functions はデータ削除後に有効化する**

既存指摘後の現行手順でも、ここで `pollingTask` を含む全 Functions をデプロイしてから Phase 3 のデータ import と 0004 を行う順序は変わっていません。`functions/default/src/pollingTask.ts` は SendGrid Secret を使用して毎分実行されるため、import からメール削除完了までの間に期限条件へ一致する移行データがあれば実ユーザーへ送信されます。手順自身が認めるとおり `SENDGRID_SUPPRESS` は未参照なので、注意書きだけでなく、0004 と `pass_code.user_email` の削除完了後に Functions をデプロイするか、Scheduler を明示的に停止・再開する順序にしてください。

Useful? React with 👍 / 👎.

**コメント要約**: Functions は 0004 後。pollingTask 誤送信防止

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: Phase 2 から functions 削除、Phase 3 #9 に移動。§5 冒頭注意書き追加。

---


**識別子**: RC-10（GitHub id: 3889269456）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `documents/firebaseプロジェクト/sandbox2606-2608_環境構築手順.md:238`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+git remote add sandbox2608 git@github.com:nijuni-yasu/bokudeli-event-yasu-2608.git
+```
+
+ローカル `.env`（**コミットしない**）:
+
+| ファイル | 用途 |
+| -------- | ---- |
+| `user/.env.sandbox2606` | user ローカル DEV |
+| `partner/.env.sandbox2606` | partner ローカル DEV |
+| `functions/default/.env.sandbox2606` | Functions ローカル |
+
+起動確認:
+
+```bash
+npm -w user run dev -- -m sandbox2606
+```
+
+---
+
+## 8. Phase 5: 並行開発での使い方
+
+| やり方 | 内容 |
+| ------ | ---- |
+| 明示 push | `git push sandbox2606 HEAD:feature/xxx` |
+| ブランチ記憶 | `git config branch.feature/xxx.sandboxRemote sandbox2606` |
+| WIP デプロイ | `/github-sandbox-wip-deploy` スキル |
+
+3 本は用途固定ではなく、**空いている sandbox に push** する運用でよい。
+
+---
+
+## 9. 動作確認（環境ごと）
+
+- [ ] user / partner が表示される
+- [ ] ログイン（test データのユーザー）
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  Auth ユーザーを用意してからログイン検証する**

この手順で新規作成した Firebase プロジェクトに移行するのは Firestore と Storage だけで、正本の `firestoreデータ移行手順_手動.md` も Authentication は移行対象外と明記しています。そのため partner の既存メール・パスワードユーザーは存在せず、user 側も必須の 0004 で移行ユーザーのメールを削除した後は既存ユーザーとしてログインできないので、この検証項目は3環境とも実行できません。Auth の export/import、または Firestore と同じ UID を持つ sandbox 用 Auth ユーザーの作成手順を Phase 3 に追加してください。

Useful? React with 👍 / 👎.

**コメント要約**: Auth ユーザー用意。Phase 3 #8 追加

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📑 仕様書

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: Phase 3 #8 Auth ユーザー用意、§9 ログイン確認を更新。

---


**識別子**: RC-11（GitHub id: 3889269458）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `documents/レビューコメント/review-feat-2340-sandbox2606-2608-setup.md:7`

**該当コード（レビュー時点の diff）**:

```diff
@@ -0,0 +1,72 @@
+# ブランチ feat/2340-sandbox2606-2608-setup レビュー記録
+
+### RC 一覧（サマリ）
+
+| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
+|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
+| [x] | RC-1 | 3889247201 | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S | CORS に web.app を追加<br>flyer 等の Origin 拒否を防止 |
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  すべての RC に詳細記録を残す**

サマリには RC-1〜RC-8 が登録されていますが、必須13項目の記録ブロックがあるのは RC-4 だけで、RC-1〜3・RC-5〜8の指摘箇所、diff_hunk、原文、判断理由が失われています。さらに RC-4 の「該当コード」も実際の diff_hunk ではなく参照文だけです。この状態では後続対応時に指摘根拠を監査できないため、各 RC の記録ブロックを所定形式で補完してください。

AGENTS.md reference: [AGENTS.md:L263-L263](https://github.com/nijuniinc/bokudeli-event-new/blob/77571189cf3aee49019294bf09d7dcb00b2c60d0/AGENTS.md#L263-L263)

Useful? React with 👍 / 👎.

**コメント要約**: RC 記録ブロック補完。13 項目形式で RC-1〜12

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 📏 規約

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 本ファイルに RC-1〜12 の 13 項目ブロックを補完。

---


**識別子**: RC-12（GitHub id: 3889269450）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `terraform/scripts/bootstrap-sandbox-terraform.sh:32`

**該当コード（レビュー時点の diff）**:

```diff
@@ -0,0 +1,44 @@
+#!/usr/bin/env bash
+# sandbox 1 本の Terraform 初期化〜 apply まで（PF 版）。
+# 前提: gcloud / gh / terraform ログイン済み、Firebase Blaze 化済み。
+#
+# 用法:
+#   ./bootstrap-sandbox-terraform.sh 2606
+#   ./bootstrap-sandbox-terraform.sh 2607
+#   ./bootstrap-sandbox-terraform.sh 2608
+set -euo pipefail
+
+NUM="${1:?usage: $0 <2606|2607|2608>}"
+
+case "$NUM" in
+  2606|2607|2608) ;;
+  *) echo "unsupported: $NUM (allowed: 2606, 2607, 2608)"; exit 1 ;;
+esac
+
+PROJECT_ID="bokudeli-event-yasu-${NUM}"
+GITHUB_REPO="nijuni-yasu/bokudeli-event-yasu-${NUM}"
+
+SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
+TERRAFORM_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
+
+cd "${TERRAFORM_DIR}"
+
+if [[ -d .terraform ]]; then
+  echo "Removing existing .terraform (switching project)"
+  rm -rf .terraform
+fi
+
+chmod +x init.sh
+printf '%s\n%s\n\n' "${PROJECT_ID}" "${GITHUB_REPO}" | ./init.sh
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  初回 import に github_repo を渡す**

バックエンド bucket も `terraform.tfvars` も存在しないクリーンな初回実行では、このパイプが3つの `read` を終えた時点で stdin を閉じます。その後 `init.sh` は `terraform import -var="project=..."` を実行しますが、`terraform/main.tf` の必須変数 `github_repo` はまだ tfvars に書かれていないため入力を要求し、EOF で失敗して `set -e` により plan 前に終了します。初回構築でも動くよう、import 前に tfvars を作るか `github_repo` も `-var` で渡してください。

Useful? React with 👍 / 👎.

**コメント要約**: tfvars 先行作成。初回 import 失敗防止

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: init.sh 前に terraform.tfvars 生成を bootstrap に追加。

---

## 評価セッション（2026-08-30 20:38・review-comments-evaluate）

- **評価日時**: 2026-08-30 20:38 JST
- **評価者**: Cursor Agent（review-comments-evaluate auto）
- **ブランチ名**: feat/2340-sandbox2606-2608-setup
- **PR**: #2343
- **Outdated 除外件数**: 0
- **レビュー非該当スキップ件数**: 4
- **手順 4a 自動修正**: RC-4〜RC-8

### RC 一覧（サマリ）

| 対応 | RC | GitHub id | 評価 | ステータス | PRスコープ | ラベル | 種別 | 工数 | 要約 |
|:----:|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| [x] | RC-1 | 3889247201 | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>CORS に web.app を追加 |
| [x] | RC-2 | 3889247206 | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>bootstrap メッセージ修正 |
| [x] | RC-3 | 3889249240 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>RC-1 同一 |
| [x] | RC-4 | 3889249246 | chatgpt-codex-connector[bot] | 🚨 必須修正 | ✅ 対応済み | 📌 スコープ内 | 🔒 セキュリティ | 📄 ドキュメントのみ | S<br>0004 必須化 |
| [x] | RC-5 | 3889249247 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>NUM 許可リスト |
| [x] | RC-6 | 3889249250 | chatgpt-codex-connector[bot] | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 🔧 微修正 | S<br>Slack コマンド名 |
| [x] | RC-7 | なし | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S<br>FIREBASERC 説明 |
| [x] | RC-8 | なし | Copilot | 🟡 修正提案 | ✅ 対応済み | 📌 スコープ内 | — | 📄 ドキュメントのみ | S<br>0004 実行リポジトリ |


**識別子**: RC-1（GitHub id: 3889247201）

**レビュワー**: Copilot

**指摘箇所**: `terraform/scripts/setup-sandbox-github-vars.sh`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
+USER_ENV_FILE="${ROOT}/user/.env.sandbox${NUM}"
+PARTNER_ENV_FILE="${ROOT}/partner/.env.sandbox${NUM}"
+
+if [[ ! -f "$USER_ENV_FILE" ]]; then
+  echo "missing $USER_ENV_FILE"
+  exit 1
+fi
+
+if [[ ! -f "$PARTNER_ENV_FILE" ]]; then
+  echo "missing $PARTNER_ENV_FILE"
+  exit 1
+fi
+
+FIREBASERC="$(cat <<EOF
+{
+  "targets": {
+    "${PROJECT_ID}": {
+      "hosting": {
+        "partner": ["${PROJECT_ID}-admin"],
+        "manager": ["${PROJECT_ID}-manager"],
+        "user": ["${PROJECT_ID}"],
+        "terms": ["${PROJECT_ID}-terms"]
+      }
+    }
+  }
+}
+EOF
+)"
+
+FUNCTIONS_ENV="$(cat <<EOF
+EVENT_HOST=${PROJECT_ID}.firebaseapp.com
+ADMIN_HOST=${PROJECT_ID}-admin.firebaseapp.com
+PARTNER_HOST=${PROJECT_ID}-admin.firebaseapp.com
+CORS=["https://${PROJECT_ID}.firebaseapp.com","https://${PROJECT_ID}-admin.firebaseapp.com"]
```

**レビュワーのコメント（原文）**:

[must] `CORS` が `firebaseapp.com` のみだと、Hosting を `web.app` 側で開いた場合に onRequest 系（flyer 等）の CORS 判定で 403 になり得ます。`web.app` と `firebaseapp.com` の両方を許可する値にしておくのが安全です。

**コメント要約**: CORS に web.app を追加。flyer 等の Origin 拒否を防止

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Hosting 既定 URL が web.app。CORS に web.app オリジン追加（0235f6d15 / 88c6d0aa7）。

---


**識別子**: RC-2（GitHub id: 3889247206）

**レビュワー**: Copilot

**指摘箇所**: `terraform/scripts/bootstrap-sandbox-terraform.sh:29`

**該当コード（レビュー時点の diff）**:

```diff
@@ -0,0 +1,38 @@
+#!/usr/bin/env bash
+# sandbox 1 本の Terraform 初期化〜 apply まで（PF 版）。
+# 前提: gcloud / gh / terraform ログイン済み、Firebase Blaze 化済み。
+#
+# 用法:
+#   ./bootstrap-sandbox-terraform.sh 2606
+#   ./bootstrap-sandbox-terraform.sh 2607
+#   ./bootstrap-sandbox-terraform.sh 2608
+set -euo pipefail
+
+NUM="${1:?usage: $0 <2606|2607|2608>}"
+PROJECT_ID="bokudeli-event-yasu-${NUM}"
+GITHUB_REPO="nijuni-yasu/bokudeli-event-yasu-${NUM}"
+
+SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
+TERRAFORM_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
+
+cd "${TERRAFORM_DIR}"
+
+if [[ -d .terraform ]]; then
+  echo "Remove existing .terraform first (switching project)"
+  rm -rf .terraform
+fi
```

**レビュワーのコメント（原文）**:

`"Remove existing .terraform first"` というメッセージの直後にスクリプト自身が `rm -rf .terraform` を実行しているので、実際の挙動とメッセージが矛盾しています（ユーザーが手動削除する必要があるように見える）。

**コメント要約**: bootstrap メッセージ修正。自動削除であることを明示

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: Removing existing .terraform に文言変更（0235f6d15）。

---


**識別子**: RC-3（GitHub id: 3889249240）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `terraform/scripts/setup-sandbox-github-vars.sh`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
+USER_ENV_FILE="${ROOT}/user/.env.sandbox${NUM}"
+PARTNER_ENV_FILE="${ROOT}/partner/.env.sandbox${NUM}"
+
+if [[ ! -f "$USER_ENV_FILE" ]]; then
+  echo "missing $USER_ENV_FILE"
+  exit 1
+fi
+
+if [[ ! -f "$PARTNER_ENV_FILE" ]]; then
+  echo "missing $PARTNER_ENV_FILE"
+  exit 1
+fi
+
+FIREBASERC="$(cat <<EOF
+{
+  "targets": {
+    "${PROJECT_ID}": {
+      "hosting": {
+        "partner": ["${PROJECT_ID}-admin"],
+        "manager": ["${PROJECT_ID}-manager"],
+        "user": ["${PROJECT_ID}"],
+        "terms": ["${PROJECT_ID}-terms"]
+      }
+    }
+  }
+}
+EOF
+)"
+
+FUNCTIONS_ENV="$(cat <<EOF
+EVENT_HOST=${PROJECT_ID}.firebaseapp.com
+ADMIN_HOST=${PROJECT_ID}-admin.firebaseapp.com
+PARTNER_HOST=${PROJECT_ID}-admin.firebaseapp.com
+CORS=["https://${PROJECT_ID}.firebaseapp.com","https://${PROJECT_ID}-admin.firebaseapp.com"]
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  web.app オリジンも CORS に許可する**

同じ差分の環境構築手順では user / partner の既定 URL を `.web.app` と案内していますが、この設定は `.firebaseapp.com` しか許可していません。`.web.app` でアプリを開いた場合、`base/src/utils/flyer.ts`、`pdf.ts`、`namesPrint.ts` から Cloud Functions へ送るブラウザーリクエストの Origin は `.web.app` のままなので、`flyer`・`eventBillInvoice`・`namesprint` の CORS 判定で拒否され、PDFをダウンロードできません。両アプリの `.web.app` オリジンも `CORS` に追加してください。

Useful? React with 👍 / 👎.

**コメント要約**: RC-1 同一。web.app を CORS に追加

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: RC-1 と同一対応。

---


**識別子**: RC-4（GitHub id: 3889249246）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `documents/firebaseプロジェクト/sandbox2606-2608_環境構築手順.md`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+
+---
+
+## 6. Phase 3: データ移行（`bokudeli-event-test` → 各 sandbox）
+
+正本: [firestoreデータ移行手順_手動.md](./firestoreデータ移行手順_手動.md) / [storageデータ移行手順_手動.md](./storageデータ移行手順_手動.md)
+
+### 6.1 移行元（全環境共通）
+
+| 変数 | 値 |
+| ---- | -- |
+| `PROJECT_A` | `bokudeli-event-test` |
+| `BUCKET_A`（Firestore） | `bokudeli-event-test-firestore-backups` |
+| `BUCKET_A`（Storage） | Console で確認（`*.appspot.com` または `*.firebasestorage.app`） |
+
+### 6.2 効率化（3 環境まとめて）
+
+1. **Firestore export は 1 回だけ**（test から最新取得、または既存 backup フォルダ利用）
+2. export を **2606 / 2607 / 2608 各 import バケット**へアップロード
+3. 各 sandbox で import → rules/indexes → 0004 → Storage コピー
+
+### 6.3 環境ごとのチェックリスト（2606 を例）
+
+| # | タスク | メモ |
+| - | ------ | ---- |
+| 1 | B の import バケット + Firestore SA IAM | `{project}-firestore-imports` |
+| 2 | A の export を B へ import | import 前に B の Firestore は空 |
+| 3 | rules + indexes デプロイ | CI or `firebase deploy` |
+| 4 | **0004 メール削除** | `yarn run util -- -m sandbox2606`（Storage **前**） |
+| 5 | `pass_code.user_email` 手動削除 | 0004 対象外 |
+| 6 | Storage A→B コピー | B バケット空にしてから。バケット名は Console 実値 |
+| 7 | `storage.rules` デプロイ | |
+| 8 | 検証 | ログイン・イベント・画像・注文 |
+
+> development データは本番 PII よりリスクは低いが、**0004 は引き続き推奨**（誤送信防止）。test データに `/enterprises` があっても PF 版のみなら無視してよい。
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P1 Badge](https://img.shields.io/badge/P1-orange?style=flat)</sub></sub>  インポート後のメール削除を必須にする**

Phase 2 で全 Functions と SendGrid の Secret を先に有効化してから development データをインポートする手順なのに、ここで 0004 を「推奨」としてスキップ可能にすると、`eventInformationMail.ts` などのスケジュール Function が移行データ内の宛先へ実メールを送る可能性があります。スクリプトが設定する `SENDGRID_SUPPRESS=true` はリポジトリ内の Functions コードから一度も参照されておらず抑止策にならないため、正本の移行手順どおり 0004 と `pass_code.user_email` の削除を必須化し、完了までメール送信 Function を動かさない手順にしてください。

Useful? React with 👍 / 👎.

**コメント要約**: 0004 必須化。誤送信防止

**評価**: 🚨 必須修正

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: 🔒 セキュリティ

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: 0004 必須化・batch 実行・SENDGRID_SUPPRESS 非参照を Runbook 明記（88c6d0aa7）。

---


**識別子**: RC-5（GitHub id: 3889249247）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `terraform/scripts/bootstrap-sandbox-terraform.sh:19`

**該当コード（レビュー時点の diff）**:

```diff
@@ -0,0 +1,38 @@
+#!/usr/bin/env bash
+# sandbox 1 本の Terraform 初期化〜 apply まで（PF 版）。
+# 前提: gcloud / gh / terraform ログイン済み、Firebase Blaze 化済み。
+#
+# 用法:
+#   ./bootstrap-sandbox-terraform.sh 2606
+#   ./bootstrap-sandbox-terraform.sh 2607
+#   ./bootstrap-sandbox-terraform.sh 2608
+set -euo pipefail
+
+NUM="${1:?usage: $0 <2606|2607|2608>}"
+PROJECT_ID="bokudeli-event-yasu-${NUM}"
+GITHUB_REPO="nijuni-yasu/bokudeli-event-yasu-${NUM}"
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  Terraform の対象番号を許可リストで検証する**

この引数は空でないことしか検証されないため、たとえば既存環境の `2605` を誤入力しても、そのプロジェクトの backend を初期化して最新構成を適用します。さらに保存済み plan を渡すモードは、[Terraform の `apply` ドキュメント](https://developer.hashicorp.com/terraform/cli/commands/apply#saved-plan-mode)どおり承認プロンプトなしで plan の操作を実行するため、タイプミスだけで別 sandbox のリソースが変更・削除され得ます。副作用を開始する前に `2606|2607|2608` のみを受け付ける検証を追加してください。

Useful? React with 👍 / 👎.

**コメント要約**: NUM 許可リスト。2606-2608 のみ

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: case 2606|2607|2608 許可リスト追加（88c6d0aa7）。

---


**識別子**: RC-6（GitHub id: 3889249250）

**レビュワー**: chatgpt-codex-connector[bot]

**指摘箇所**: `terraform/scripts/setup-sandbox-github-vars.sh`

**該当コード（レビュー時点の diff）**:

```diff
…（diff 先頭省略）
+USER_ENV_FILE="${ROOT}/user/.env.sandbox${NUM}"
+PARTNER_ENV_FILE="${ROOT}/partner/.env.sandbox${NUM}"
+
+if [[ ! -f "$USER_ENV_FILE" ]]; then
+  echo "missing $USER_ENV_FILE"
+  exit 1
+fi
+
+if [[ ! -f "$PARTNER_ENV_FILE" ]]; then
+  echo "missing $PARTNER_ENV_FILE"
+  exit 1
+fi
+
+FIREBASERC="$(cat <<EOF
+{
+  "targets": {
+    "${PROJECT_ID}": {
+      "hosting": {
+        "partner": ["${PROJECT_ID}-admin"],
+        "manager": ["${PROJECT_ID}-manager"],
+        "user": ["${PROJECT_ID}"],
+        "terms": ["${PROJECT_ID}-terms"]
+      }
+    }
+  }
+}
+EOF
+)"
+
+FUNCTIONS_ENV="$(cat <<EOF
+EVENT_HOST=${PROJECT_ID}.firebaseapp.com
+ADMIN_HOST=${PROJECT_ID}-admin.firebaseapp.com
+PARTNER_HOST=${PROJECT_ID}-admin.firebaseapp.com
+CORS=["https://${PROJECT_ID}.firebaseapp.com","https://${PROJECT_ID}-admin.firebaseapp.com"]
+SLACK_COMMAND_NAME=shokujii_test2510
```

**レビュワーのコメント（原文）**:

**<sub><sub>![P2 Badge](https://img.shields.io/badge/P2-yellow?style=flat)</sub></sub>  sandbox ごとの Slack コマンド名を設定する**

2606〜2608 のどれを指定しても `SLACK_COMMAND_NAME` が旧 sandbox2510 の値になるため、新しい Slack App を環境番号に合わせて `/shokujii_test2606` 等で設定するとコマンドを処理できません。`functions/default/src/slackbot.ts` はこの環境変数と完全一致する 1 コマンドだけを登録しており、Slack 側のコマンド名との一致が必須です。`${NUM}` を使うか引数で明示指定し、各 sandbox の Slack 設定と一致させてください。

Useful? React with 👍 / 👎.

**コメント要約**: Slack コマンド名。shokujii_test${NUM}

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 🔧 微修正

**想定工数**: S

**判断理由**: SLACK_COMMAND_NAME=shokujii_test${NUM}（88c6d0aa7）。

---


**識別子**: RC-7（GitHub id: なし・Copilot overview 内指摘）

**レビュワー**: Copilot

**指摘箇所**: `documents/firebaseプロジェクト/sandbox2606-2608_環境構築手順.md`

**該当コード（レビュー時点の diff）**:

```diff
（Copilot Pull request overview 内・インラインなし）
```

**レビュワーのコメント（原文）**:

FIREBASERC に manager / terms target が含まれるが PF 版では deploy しない。説明を追記するか、PF 版向けに user+partner のみに絞ることを検討。

**コメント要約**: FIREBASERC 説明。PF 版未使用 target 注記

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: §4.3 FIREBASERC に manager/terms は PF 版未使用と注記（88c6d0aa7）。

---


**識別子**: RC-8（GitHub id: なし・Copilot overview 内指摘）

**レビュワー**: Copilot

**指摘箇所**: `documents/firebaseプロジェクト/sandbox2606-2608_環境構築手順.md`

**該当コード（レビュー時点の diff）**:

```diff
（Copilot Pull request overview 内・インラインなし）
```

**レビュワーのコメント（原文）**:

0004 は bokudeli-event-batch リポジトリで実行する旨を Runbook に明記すべき。

**コメント要約**: 0004 実行リポジトリ。bokudeli-event-batch 明記

**評価**: 🟡 修正提案

**ステータス**: ✅ 対応済み

**PRスコープ**: 📌 スコープ内

**ラベル**: —

**変更種別**: 📄 ドキュメントのみ

**想定工数**: S

**判断理由**: §6.3 注記で bokudeli-event-batch 実行を明記（88c6d0aa7）。

---
