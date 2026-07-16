---
name: git-reflect-after-commit
description: コミット完了後の次ステップ。origin へ push して PR 作成/更新（git-create-pull-request 全手順・手順 13 の AI レビュー待ち含む）し、ブランチに紐づく sandbox へ push・デプロイ（github-actions-deploy へ委譲）する。git-commit-workflow / git-commit-message / git-split-commit / git-fixup / git-squash でコミットが完了した直後、エージェントはユーザーへ「/git-reflect-after-commit を実行しますか？」と提案する。ユーザーが「して」「お願い」「反映して」等と答えたら本スキルを実行する。「push して PR 作って sandbox にもデプロイ」「コミット後の反映」でも使用。本番 nijuniinc/bokudeli-event-new へはデプロイ発火しない。
---

# コミット後の反映（PR + sandbox デプロイ）

ローカルのコミット完了を起点に、PR 反映と sandbox デプロイをまとめて行うオーケストレーター。
コミット作成自体（新規/分割/fixup/squash）はこのスキルの範囲外で、完了済みを前提とする。
それぞれの詳細手順は委譲先スキルに従い、本スキルはルールを上書きしない。

## 本番リポジトリは対象外（厳守）

本番リポ `nijuniinc/bokudeli-event-new` には **デプロイ発火を一切行わない**。
A の PR 用 push（origin への通常 push）は許可するが、B のデプロイ対象に origin/本番を選んではならない。
B は `github-actions-deploy` に委譲し、同スキル内で本番ブロックを実施する。

## 手順

### 1. 前提確認

- `git status` で未コミット変更が無いか確認する（このスキルはコミット完了が前提）。
- 直前が git-commit-workflow / git-fixup / git-squash の場合は rebase により履歴が書き換わっていることがある。
  upstream（本番 origin）へは fixup/squash 側で push していないことが多い（本番 upstream ブロックのため）。

### 2. 実行範囲の決定

- ユーザー指定が無ければ **A・B の両方**を実行する。
- 「PR だけ」「sandbox だけ」と指定された場合はその片方に絞る。
- **AI レビュー待ち → evaluate** は `git-create-pull-request` 手順 13 で **デフォルト ON**（create-pr 内で `wait-ai-pr-review` を起動。本スキルで二重起動しない）。
- 会話に「評価待ちなし」「evaluate しない」「review wait しない」があれば create-pr 手順 13 もスキップする（手順 4 委譲時に伝播）。

### 3. lint・format・型・test チェック（PR verify 相当・A・B 両方の push 前に一度だけ実施）

`lint-and-format` スキルの手順に従い、build / lint / format / 型 / vitest をローカルで実行する（format 失敗時は自動修正）。

- **build・lint・build:types・test エラーがある場合**: ユーザーに報告して **中断する**（push もデプロイもしない）。
- **format エラーがある場合**: `lint-and-format` の自動修正手順に従い修正して続行する。
  - 自動修正で生じた変更の扱い（追加コミット / amend 等）はユーザーに確認する。
    勝手に既存コミットを書き換えない。

### 4. A) origin へ push して PR 作成/更新

- 現在ブランチを `ref` とする（`git branch --show-current`）。
- **push 先 ref の検証（厳守）** — push 実行前に必ず確認する:
  - **拒否**（ref の**完全一致**）: `development` / `main` / `production`、または `v` + 数字で始まるタグ ref（例: `v2.6.0`）
  - **許可**: 上記以外の作業ブランチ（feature / `release/*` / `sync/*` / `hotfix/*` 等）。ブランチ名への部分一致では判定しない（`sync/main-to-development` は許可）
  - 拒否条件に該当する場合は **push せず中断**し、保護 ref への直 push は人間のリリース手順に従う旨をユーザーに伝える
- **push の方法**（`ref` はリモート上のブランチ名。通常は現在ブランチ名）:
  - **履歴書き換え時**（git-commit-workflow / git-fixup / git-squash の直後、または会話文脈で rebase 済みと分かる場合）:

    ```bash
    git push --force-with-lease origin HEAD:<ref>
    ```

  - **通常**（新規コミット・分割コミット等）:

    ```bash
    git push origin HEAD:<ref>
    ```

    non-fast-forward で reject された場合、または diverge / behind で履歴書き換え未確認の場合は **push せず中断**し、リモート更新の可能性をユーザーに伝えて確認する。`--force-with-lease` の自動再試行はしない（`-f` も勝手に使わない）。

  - **`--force-with-lease` を実行してよい条件**（いずれか）:

    1. git-commit-workflow / git-fixup / git-squash の直後など、当該会話内で履歴書き換えが完了している
    2. ユーザーが force push / `--force-with-lease` を明示指示した

- [`git-create-pull-request`](../git-create-pull-request/SKILL.md) スキルの**全手順**を実行する（手順 0 lint は本手順 3 済みのため create-pr 側でスキップ。**手順 11 reviewer 追加 + 手順 12 Copilot/Codex 依頼 + 手順 13 の wait 委譲**を含む）。
  **手順 9（origin push）は本手順 4 で push 済みのため create-pr 側でスキップ**される。
- 手順 13 委譲時は **wait-ai-pr-review 手順 3** の Shell 要件（`block_until_ms: 0` + `notify_on_output: ^AGENT_LOOP_WAKE_pr_review`）を満たすこと（reflect 側で watcher を二重起動しないが、Shell 要件は省略しない）。

### 5. B) sandbox へ push してデプロイ

git-commit-workflow / git-fixup / git-squash の upstream push（`branch.<branch>.remote`）とは **別系統**である。
PR 用は **origin**（手順 4）、動作確認用は **`branch.<branch>.sandboxRemote`**（`github-actions-deploy` が解決・記憶）とする。

**`github-actions-deploy` スキルの手順 0〜10** に委譲する（sandboxRemote 解決・push・本番ブロック・発火・**バックグラウンド watch**・wake 時結果報告を含む）。
本スキルでは B 専用の push 手順を **重複実施しない**。

- 手順 1 で clean 確認済みのため、`github-actions-deploy` 手順 0 は省略してよい
- B 実行時は `github-actions-deploy` の **1b** が委譲をトリガーとして成立する（会話に sandbox と書かなくてよい）
- ユーザーが sandbox 向けに **`sandbox*` リモート名/ブランチ名** を明示している場合は、`github-actions-deploy` 手順 1a がそれを優先する
- デプロイが失敗した場合は **解析結果をユーザーに報告するに留め、修正や自動再実行はしない**

### 6. 結果報告

- PR の URL（A 実行時）
- AI レビュー監視（A 実行時・手順 13）:
  - PR 番号、`REVIEW_REQUEST_SINCE`、watcher 起動済み（Shell に `notify_on_output` 付与済みであること）
  - Copilot 実質レビュー typical: 依頼後 4〜5 分
  - evaluate 開始目安: Copilot 完了後 quiet 2 分 + Codex 条件（limits/connect は quiet 後、無応答は最大 12 分）。**Copilot 完了 ≠ evaluate 開始**
  - 全体タイムアウト 20 分、Codex limits 時は partial evaluate あり得る旨
  - オプトアウト時はスキップした旨
- sandbox の remote 名・OWNER/REPO・ref、発火したワークフロー（B 実行時・`github-actions-deploy` 手順 8 の内容を含む）
- sandbox デプロイは **reflect 完了時点では監視中**になり得る（wake 後に手順 9〜10 で結果報告）
- sandbox デプロイの各ワークフローの **成否・run URL**（wake 受信後・`github-actions-deploy` 手順 10）、失敗時は **エラー分類と原因サマリ**（B 実行時）
- `branch.<branch>.sandboxRemote` を新規保存した場合はその旨（B 実行時）

## 注意

- 委譲先（`git-create-pull-request` / `wait-ai-pr-review` / `github-actions-deploy` / `lint-and-format`）のルールを上書きしない。
- AI レビュー wait は **create-pr 手順 13 のみ**から起動する（本スキルで wait を重複起動しない）。
- origin への push の **`--force-with-lease`** は履歴書き換え確認またはユーザー明示承認時のみ。diverge 時の自動 force は禁止。
  sandbox への push は **`github-actions-deploy` 手順 3** に委譲する。
- 本番への **デプロイ発火**は行わない（origin への PR 用 push は許可）。
- このスキルは Cursor / Claude エージェントがローカルで `git` と `gh` を実行する前提。
