---
name: git-reflect-after-commit
description: コミット完了後の次ステップ。origin へ push して PR 作成/更新（git-create-pull-request へ委譲）し、ブランチに紐づく sandbox へ push・デプロイ（github-actions-deploy へ委譲）する。git-commit-message / git-split-commit / git-fixup / git-squash でコミットが完了した直後、エージェントはユーザーへ「/git-reflect-after-commit を実行しますか？」と提案する。ユーザーが「して」「お願い」「反映して」等と答えたら本スキルを実行する。「push して PR 作って sandbox にもデプロイ」「コミット後の反映」でも使用。本番 nijuniinc/bokudeli-event-new へはデプロイ発火しない。
---

# コミット後の反映（PR + sandbox デプロイ）

ローカルのコミット完了を起点に、PR 反映と sandbox デプロイをまとめて行うオーケストレーター。
コミット作成自体（新規/分割/fixup/squash）はこのスキルの範囲外で、完了済みを前提とする。
それぞれの詳細手順は委譲先スキルに従い、本スキルはルールを上書きしない。

## 本番リポジトリは対象外（厳守）

本番リポ `nijuniinc/bokudeli-event-new` には **デプロイ発火を一切行わない**。
A の PR 用 push（origin への通常 push）は許可するが、B のデプロイ発火対象に origin/本番を選んではならない。
B では必ず `git remote get-url <remote>` で URL を実検証し、本番を指す場合は中止する。

## 手順

### 1. 前提確認

- `git status` で未コミット変更が無いか確認する（このスキルはコミット完了が前提）。
- 直前が git-fixup / git-squash の場合は rebase により履歴が書き換わっていることがある。
  upstream（本番 origin）へは fixup/squash 側で push していないことが多い（本番 upstream ブロックのため）。

### 2. 実行範囲の決定

- ユーザー指定が無ければ **A・B の両方**を実行する。
- 「PR だけ」「sandbox だけ」と指定された場合はその片方に絞る。

### 3. lint・format チェック（A・B 両方の push 前に一度だけ実施）

`lint-and-format` スキルの手順に従い、全パッケージで lint と format をチェックする。

- **lint エラーがある場合**: ユーザーに報告して **中断する**（push もデプロイもしない）。
- **format エラーがある場合**: `lint-and-format` の自動修正手順に従い修正して続行する。
  - 自動修正で生じた変更の扱い（追加コミット / amend 等）はユーザーに確認する。
    勝手に既存コミットを書き換えない。

### 4. A) origin へ push して PR 作成/更新

- 現在ブランチを `ref` とする（`git branch --show-current`）。
- **push の方法**（`ref` はリモート上のブランチ名。通常は現在ブランチ名）:

  - **履歴書き換え時**（git-fixup / git-squash の直後、または会話文脈で rebase 済みと分かる場合）:

    ```bash
    git push --force-with-lease origin HEAD:<ref>
    ```

  - **通常**（新規コミット・分割コミット等）:

    ```bash
    git push origin HEAD:<ref>
    ```

    non-fast-forward で reject された場合は `--force-with-lease` で再試行する。
    それでも失敗した場合はリモートが他で更新された可能性を伝え、`-f` で強制するか確認する。

- `git-create-pull-request` スキルの手順に従い PR を作成/更新し、
  **固定文のレビュー依頼コメント**まで実行する。

### 5. B) ブランチに紐づく sandbox へ push してデプロイ

git-fixup / git-squash の upstream push（`branch.<branch>.remote`）とは **別系統**である。
PR 用は **origin**（手順 4）、動作確認用は **`sandboxRemote`**（本手順）とする。

- 現在ブランチを取得: `git branch --show-current`
- 紐づく sandbox remote を取得:

  ```bash
  git config --get branch.<branch>.sandboxRemote
  ```

- **未設定の場合**: `git remote -v` から `sandbox*` 候補を提示してユーザーに選んでもらい、
  確認のうえ保存する（次回以降は自動）。

  ```bash
  git config branch.<branch>.sandboxRemote <選択した remote>
  ```

- **本番ブロック**: `git remote get-url <remote>` の URL が
  `nijuniinc/bokudeli-event-new` を指す場合は **中止**する。
- push:

  ```bash
  git push --force-with-lease <remote> HEAD:<ref>
  ```

  - `ref` はリモート上の対象ブランチ名（通常は現在ブランチ名）。
  - `-u`（`--set-upstream`）は付けない（追跡設定を変えないため）。
  - 失敗時はリモートが他で更新された可能性を伝え、`-f` で強制するか確認する。

- デプロイ発火: `github-actions-deploy` スキルの environment 入力〜結果報告の手順に従い、
  ここで確定した **OWNER/REPO・ref** を使う。
  OWNER/REPO 決定と本番ブロックは本スキルで実施済みのため繰り返さない。

### 6. 結果報告

- PR の URL（A 実行時）
- sandbox の remote 名・OWNER/REPO・ref、発火したワークフロー（B 実行時）
- `branch.<branch>.sandboxRemote` を新規保存した場合はその旨

## 注意

- 委譲先（`git-create-pull-request` / `github-actions-deploy` / `lint-and-format`）のルールを上書きしない。
- origin / sandbox への push は、履歴書き換え時（fixup/squash 直後等）は **`--force-with-lease`** を使う。
  本番への **デプロイ発火**は行わない（origin への PR 用 push は許可）。
- このスキルは Cursor / Claude エージェントがローカルで `git` と `gh` を実行する前提。
