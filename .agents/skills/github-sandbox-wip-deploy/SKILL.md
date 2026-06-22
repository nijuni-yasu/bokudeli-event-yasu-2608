---
name: github-sandbox-wip-deploy
description: WIP コミットで sandbox に仮デプロイする。lint・format・型・test チェック（lint-and-format）→ WIP コミット → github-actions-deploy（push + デプロイ発火）を実行。「WIP でコミットして sandbox にデプロイして」など WIP + sandbox デプロイを明示された時に使用する。WIP に言及がない単なるデプロイには github-actions-deploy を使う。本番 nijuniinc/bokudeli-event-new には push しない。
---

# sandbox WIP デプロイ

作業中の変更を WIP コミットで sandbox 環境にデプロイし、動作確認を行うためのワークフロー。

lint・format・型・test チェック（`lint-and-format` スキル）を先に通すことで、PR verify で落ちるコードを sandbox に上げないようにしている。また、WIP コミットの後始末（reset 等）はこのスキルの範囲外とし、ユーザーが自身のタイミングで行う。

## 本番リポジトリは対象外（厳守）

本番リポジトリ `nijuniinc/bokudeli-event-new` に対しては **push もデプロイ発火も一切行わない**。
push・本番ブロックは **`github-actions-deploy`** が実施する。

## 手順

### 1. lint・format・型・test チェック（PR verify 相当）

`lint-and-format` スキルの手順に従い、build / lint / format / 型 / vitest をローカルで実行する（format 失敗時は自動修正）。

- **build・lint・build:types・test エラーがある場合**: ユーザーに報告して **中断する**。修正後に再度依頼してもらう
- **format エラーがある場合**: `lint-and-format` スキルの format 自動修正手順に従い自動修正して続行する

### 2. 変更のステージングとコミット

まず `git status` で変更の有無を確認する。変更がない場合（clean）は **WIP コミットは作成せず** 手順 3 へ進む。既存のコミットが未 push であれば、手順 3 で push される。

変更がある場合、追跡済みファイルの変更のみをステージする（未追跡の `.env` 等を誤ってコミットしないため）。

```bash
git add -u
git commit -m "WIP 動作確認コミット"
```

**新規で Git の追跡を開始するファイル**を WIP に含める必要がある場合は、上記のあと `git add <パス>` で明示的に追加する。

format 自動修正（手順 1）で生じた変更も、追跡済みであれば `git add -u` でステージされる。

手順 2 で `git commit` まで実行した場合のみ「WIP コミットを新規作成した」とみなし、手順 4 の reset 案内の対象とする。clean でコミットをスキップした場合は作成していない。

### 3. sandbox へ push してデプロイ

**`github-actions-deploy` スキルの手順 0〜9** に委譲する。

- 委譲時は `github-actions-deploy` の **1b** がトリガーとして成立する（会話に sandbox と書かなくてよい）
- sandbox 先は `branch.<branch>.sandboxRemote` で解決・記憶（`git-reflect-after-commit` と同じ）。候補は **`sandbox*` のみ**
- ユーザーが **`リモート名/ブランチ名` を明示**している場合は上書き指定として優先
- push（手順 3）→ workflow_dispatch 発火 → 監視 → 報告までを一括実行
- 本スキルでは push 手順を **重複実施しない**

### 4. 結果の報告

以下を報告する（`github-actions-deploy` 手順 9 の内容を含む）:

- push 先リモート名と OWNER/REPO
- push したブランチ名（ref）
- 発火したワークフローと各 run の成否・URL
- 手順 2 で WIP コミットを新規作成した場合のみ: WIP コミットがローカルに残っていること
- `branch.<branch>.sandboxRemote` を新規保存した場合はその旨

**手順 2 で `git commit` により WIP コミットを新規作成した場合のみ**、後始末として次を案内する。clean でコミットをスキップした場合は **案内しない**（直前の通常コミットを誤って `reset` するのを防ぐ）。

> WIP コミットはローカルに残っています。動作確認が完了したら `git reset --soft HEAD~1` で解除できます。

## 注意

- WIP コミットの解除はこのスキルでは行わない。動作確認の結果を見てからユーザーが判断する
- `--force-with-lease` を使うため、sandbox 上で他の作業が進んでいる場合は push が失敗する可能性がある。その場合はユーザーに確認する
- lint エラーがある状態では sandbox にデプロイしない。format エラーは自動修正する
- このスキルは Cursor エージェントがローカルで `git` と `gh` を実行する前提である
