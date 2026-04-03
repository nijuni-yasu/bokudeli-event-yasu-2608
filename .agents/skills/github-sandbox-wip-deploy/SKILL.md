---
name: github-sandbox-wip-deploy
description: WIP コミットで sandbox に仮デプロイする。lint・format → WIP コミット → --force-with-lease push → Actions デプロイ発火を一括実行。「WIP でコミットして sandbox にデプロイして」など WIP + sandbox デプロイを明示された時に使用する。WIP に言及がない単なるデプロイには github-actions-deploy を使う。本番 nijuniinc/bokudeli-event-new には push しない。
---

# sandbox WIP デプロイ

作業中の変更を WIP コミットで sandbox 環境にデプロイし、動作確認を行うためのワークフロー。

lint・format チェックを先に通すことで、CI で落ちるコードを sandbox に上げないようにしている。また、WIP コミットの後始末（reset 等）はこのスキルの範囲外とし、ユーザーが自身のタイミングで行う。

## 本番リポジトリは対象外（厳守）

本番リポジトリ `nijuniinc/bokudeli-event-new` に対しては **push もデプロイ発火も一切行わない**。

手順 3 で `git remote get-url` により実際の URL を取得し、本番リポを指している場合は即座にブロックする。リモート名が `origin` であっても `sandbox` であっても、URL が本番を指していれば拒否する。

## 手順

### 1. lint・format チェック

`lint-and-format` スキルの手順に従い、全パッケージで lint と format をチェックする。

- **lint エラーがある場合**: ユーザーに報告して **中断する**。修正後に再度依頼してもらう
- **format エラーがある場合**: `lint-and-format` スキルの手順 5 に従い自動修正して続行する

### 2. push 先リモートの決定

`github-actions-deploy` スキルの手順 1（1a / 1b / 1c）に従い、**リモート名**・**OWNER/REPO**・**ref（ブランチ名）** を決定する。

手順 3 では、必ず次で実際の URL を検証する（文字列だけの OWNER/REPO 判断だけでは、ローカルの `git remote` 設定と意図がずれていても気づけないため）。

### 3. 本番ブロックの確認

手順 2 で決めた **リモート名** について、次を実行する。

```bash
git remote get-url <リモート名>
```

出力 URL から `owner/repo` を解釈する（例: `https://github.com/owner/repo.git` / `git@github.com:owner/repo.git`）。次のいずれかに当てはまる場合は **即座に中止** する。

- URL が `nijuniinc/bokudeli-event-new` を指している
- 手順 2 で決めた OWNER/REPO と、URL から読み取った owner/repo が一致しない

中止時はユーザーに「本番リポへの WIP push は行わない。sandbox リモートを指定してほしい」と伝える。

### 4. 変更のステージングとコミット

まず `git status` で変更の有無を確認する。変更がない場合（clean）は **WIP コミットは作成せず** 手順 5 の push のみ行う。既存のコミットが未 push であればそれを push する。

変更がある場合、追跡済みファイルの変更のみをステージする（未追跡の `.env` 等を誤ってコミットしないため）。

```bash
git add -u
git commit -m "WIP 動作確認コミット"
```

**新規で Git の追跡を開始するファイル**を WIP に含める必要がある場合は、上記のあと `git add <パス>` で明示的に追加する。

format 自動修正（手順 1）で生じた変更も、追跡済みであれば `git add -u` でステージされる。

手順 4 で `git commit` まで実行した場合のみ「WIP コミットを新規作成した」とみなし、手順 7 の reset 案内の対象とする。clean でコミットをスキップした場合は作成していない。

### 5. sandbox への push

手順 2 で決めた **ref（リモート上のブランチ名）** に、現在の `HEAD` をそのまま載せる。ローカルブランチ名と追跡先ブランチ名が異なる場合でも、手順 6 の `workflow_dispatch` で使う ref と push 先が一致するようにする。

```bash
git push --force-with-lease <リモート名> HEAD:<ref>
```

例: ref が `ai/1885` のとき `HEAD:ai/1885`。

`-f` ではなく `--force-with-lease` を使う。リモート側が予期せず更新されていた場合に上書きを防ぐためである。

`git push` に `-u`（`--set-upstream`）は付けない。upstream の追跡設定を変えないようにする（`git add -u` とは別物である）。

`--force-with-lease` が失敗した場合は、リモートが他で更新されている可能性をユーザーに伝え、`-f` で強制 push するかどうか確認する。

### 6. デプロイ発火

`github-actions-deploy` スキルの手順 3〜6 に従い、手順 2 で決定した OWNER/REPO と ref を使って workflow_dispatch を発火する。

手順 2 で OWNER/REPO と ref が既に確定しているため、`github-actions-deploy` の手順 1（検出ロジック）は改めて実行しない。手順 3（environment 入力）から開始する。

### 7. 結果の報告

以下を報告する:

- push 先リモート名と OWNER/REPO
- push したブランチ名（ref）
- 発火したワークフロー
- 手順 4 で WIP コミットを新規作成した場合のみ: WIP コミットがローカルに残っていること

**手順 4 で `git commit` により WIP コミットを新規作成した場合のみ**、後始末として次を案内する。clean でコミットをスキップした場合は **案内しない**（直前の通常コミットを誤って `reset` するのを防ぐ）。

> WIP コミットはローカルに残っています。動作確認が完了したら `git reset --soft HEAD~1` で解除できます。

## 注意

- WIP コミットの解除はこのスキルでは行わない。動作確認の結果を見てからユーザーが判断する
- `--force-with-lease` を使うため、sandbox 上で他の作業が進んでいる場合は push が失敗する可能性がある。その場合はユーザーに確認する
- lint エラーがある状態では sandbox にデプロイしない。format エラーは自動修正する
- このスキルは Cursor エージェントがローカルで `git` と `gh` を実行する前提である
