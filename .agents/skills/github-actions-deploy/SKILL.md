---
name: github-actions-deploy
description: sandbox / fork 向け。ローカル HEAD を branch.<branch>.sandboxRemote で決まった sandbox へ push してから、gh CLI で deploy_*.yml を workflow_dispatch 発火する。監視はバックグラウンド watch + wake 1 回（エージェントは gh run watch でブロックしない）。mode=report は sentinel / pending wake から結果報告のみ。sandbox 先は git-reflect-after-commit と同じ branch.<branch>.sandboxRemote で記憶。git-reflect-after-commit / github-sandbox-wip-deploy から委譲時は会話に sandbox と書かなくてよい。「sandbox にデプロイ」で sandboxRemote 設定済みなら現在ブランチで実行可。1a のリモート/ブランチ明示は sandbox 系 remote のみ。repo+ブランチの明示指定は上書き（発火のみ）。「push せず」「再デプロイだけ」で push 省略。本番 nijuniinc/bokudeli-event-new では push も発火も拒否。6 本一括（deploy_enterprise 含む）は一括発火後にバックグラウンド並列 watch がデフォルト。
---

# GitHub Actions デプロイ（push + 手動発火）

## 目的

sandbox / fork 向けに、**ローカル HEAD を sandbox リモートへ push してから**、対象リポジトリで **workflow_dispatch** を発火する。

push なしでリモート上の既存 ref を再デプロイしたい場合は、ユーザーが **「push せず」「再デプロイだけ」** と明示したときのみ push を省略する。

本リポジトリのワークフロー定義は `.github/workflows/deploy_*.yml` である。fork や sandbox リポでも **同一ファイル名・同一 inputs** を前提にする。異なる場合はユーザーに確認する。

## 本番リポジトリは対象外（厳守）

次のリポジトリに対しては、このスキル経由で **push も `gh workflow run` も一切実行してはならない**。依頼が来ても **拒否し、理由をユーザーに伝える**。

- **本番リポジトリ**: `nijuniinc/bokudeli-event-new`  
  URL 例: `https://github.com/nijuniinc/bokudeli-event-new`

正規化のあと `OWNER/REPO` が上記と一致する場合はブロックする。

**リモート URL**（`git remote get-url <remote>`）が本番を指す場合も、**push もデプロイ発火も中止**する。

本番のデプロイは **GitHub の Web UI からの手動実行**や **既定のブランチへの push** など、チームの運用に任せる。

## 前提

- **GitHub CLI** `gh` がインストール済みであること
- `gh auth login` 済みで、対象リポジトリに **actions:write** 相当の権限があること
- ネットワークが利用できる実行環境であること

権限不足で 403 になる場合は、ユーザーに PAT のスコープや org の GitHub Actions ポリシーを確認してもらう。

## sandbox 先の決定（優先順）

**REMOTE**（ローカル git remote 名）・**OWNER/REPO**・**ref** を次の優先順で決める。いずれの段でも **本番リポ**に当たったらそこで打ち切る。

### 1a. ユーザーが `リモート名/ブランチ名` を明示している場合（最優先）

会話から `sandbox2510/...` や `sandbox2603/...` など **`sandbox` で始まるリモート名**の **`A/B` 形式**を取り出す。ブランチ名に `/` が含まれ得るため、**先頭の最初の `/` だけ**で左右に分割する。**sandbox 系以外の remote 名は 1a では使わない**（1b / 1c を検討）。

- 例: `sandbox2603/ai/1842` → REMOTE `sandbox2603`、ref `ai/1842`
- 例: `sandbox2510/feature/foo` → REMOTE `sandbox2510`、ref `feature/foo`

`git remote get-url <REMOTE>` の URL から `OWNER/REPO` を取る。

### 1b. `branch.<branch>.sandboxRemote` + 現在ブランチ（`git-reflect-after-commit` と同じ）

会話に 1a の明示が無く、次の **いずれか** に該当する場合:

1. 会話に「sandbox にデプロイ」等の依頼がある
2. **`git-reflect-after-commit` または `github-sandbox-wip-deploy` から委譲されている**（会話に sandbox と書かなくてよい）
3. `branch.<branch>.sandboxRemote` が**設定済み**で、会話にデプロイ依頼がある（「デプロイして」「sandbox だけ」等。リモート/ブランチの明示が無い場合）

```bash
BRANCH=$(git branch --show-current)
REMOTE=$(git config --get branch."$BRANCH".sandboxRemote)
REF="$BRANCH"
```

- **未設定の場合**: `git remote -v` から **`sandbox*` 候補のみ**提示してユーザーに選んでもらい、確認のうえ保存する（次回以降は自動）。

  ```bash
  git config branch."$BRANCH".sandboxRemote <選択した remote>
  ```

- `git remote get-url "$REMOTE"` の URL から `OWNER/REPO` を取る。

### 1c. ユーザーが URL または owner/repo とブランチを明示している場合（発火のみ）

- 完全 URL または `owner/repo` から `OWNER/REPO` を抽出する
- **ref**: ユーザーが会話で指定したブランチ名のみを使う
- **push は行わない**（ローカル remote との対応が不明なため）。**`SKIP_PUSH=true`** として手順 3 を省略し、手順 4 以降（発火のみ）に進む

### 1d. 上記いずれも満たさない場合

- **実行しない**
- ユーザーに **`リモート名/ブランチ名`（例: `sandbox2510/feat/960-v2`）**、**owner/repo + ブランチ**、または sandbox remote の初回設定を求める

`@{upstream}` は **補助情報**（指定したリモート/ブランチと一致するか確認する）に使ってよいが、**ユーザー発話に無い ref で勝手に決めて実行してはならない**（1b の委譲・`sandboxRemote` 設定済みの場合を除く）。

## トリガー例

- `sandbox2510/feat/960-v2` にデプロイして
- sandbox にデプロイして（**`branch.<branch>.sandboxRemote` 設定済み**）
- `/git-reflect-after-commit` 実行時（**B: sandbox デプロイ**。会話に sandbox と書かなくてよい）
- `/github-sandbox-wip-deploy` 実行時（同上）
- `https://github.com/nijuni-yasu/bokudeli-event-yasu-2603` のブランチ `ai/1842` を再デプロイ（**push 省略・発火のみ**）
- sandbox リポを workflow_dispatch で全部デプロイ（**リモート/ブランチまたは repo+ref が会話に含まれる場合**）

**NG**: `sandboxRemote` 未設定かつ 1a/1c も無い「デプロイして」だけ → 指定または sandbox remote の初回設定を求める。

## 手順

### 0. 前提確認・モード判定

**mode=report**（結果報告のみ）に該当する場合は **手順 1〜7 をスキップ**し、**手順 9** へ:

- 会話または sentinel に `mode":"report"` がある
- `AGENT_LOOP_WAKE_deploy` sentinel を受信した
- `.agents/state/deploy-pending-wake.json` の未処理 wake を処理する（`deploy_id` を特定）

```bash
git status   # mode=report 以外では未コミット変更があれば中断
```

- **未コミット変更がある場合**（通常モード）: **中断**する（WIP 含めてデプロイしたい場合は `github-sandbox-wip-deploy` を案内）。
- 委譲元（`git-reflect-after-commit`）で clean 確認済みの場合は省略してよい。

pending wake 一覧:

```bash
python3 .agents/scripts/github_actions_deploy_wake.py list \
  --wake-file .agents/state/deploy-pending-wake.json
```

### 1. REMOTE・OWNER/REPO・ref の決定

上記 **sandbox 先の決定（優先順）** に従う。

### 2. 本番ブロックの最終確認

- `OWNER/REPO` が `nijuniinc/bokudeli-event-new` なら **中止**
- 1a / 1b で REMOTE を使う場合、`git remote get-url "$REMOTE"` が本番 URL なら **中止**

### 3. sandbox へ push（デフォルト）

**次のいずれかに該当する場合は push を省略**し、手順 4 へ:

- ユーザーが **「push せず」「再デプロイだけ」** と明示した
- 手順 1c（owner/repo + ブランチのみ・発火のみモード）

**それ以外は必ず push してから発火する**（リモートの古いコミットをデプロイしないため）。

```bash
git push --force-with-lease "$REMOTE" HEAD:"$REF"
```

- `-u`（`--set-upstream`）は付けない（追跡設定を変えないため）
- `--force-with-lease` 失敗時はリモートが他で更新された場合の可能性を伝え、`-f` で強制 push するか確認する

### 4. workflow_dispatch の environment 入力

ワークフローは `workflow_dispatch` の入力 **environment** に `development` または `production` が必須である。

**sandbox 系 fork** では setup ジョブ側でこの値は実質参照されず GitHub Environment は `sandbox` 固定だが、YAML 上は必須のため **`development` を渡す**。

```bash
-f environment=development
```

### 5. 発火するワークフローを選ぶ

対象は **リポジトリ内のデプロイ用ワークフロー 6 本のみ**。Lint や他用途のワークフローは動かさない。`deploy_manager.yml`（hosting manager）は #2087 で削除済み（フェーズ5で `deploy_support.yml` として新規追加予定）。

| ファイル名 | ざっくりした対象 |
|------------|------------------|
| deploy_user.yml | hosting user |
| deploy_partner.yml | hosting partner |
| deploy_enterprise.yml | hosting enterprise |
| deploy_functions.yml | functions |
| deploy_firestore.yml | firestore |
| deploy_storage.yml | storage |

- ユーザーが **特定パッケージだけ** と言ったら、対応する 1 本だけ `gh workflow run` する（例: user だけ → `deploy_user.yml`、enterprise / エンプラ だけ → `deploy_enterprise.yml`）
- **全体デプロイ**や指定がなければ、上記 6 本を **一括発火**する（**デフォルト**）
- **禁止**: 1 本ごとに `gh run watch` で完了を待ってから次を発火する直列パターン
- 同一リポの負荷を抑えたい場合やユーザーが明示した場合のみ、6 本を **順次発火**してよい
- sandbox fork に `deploy_enterprise.yml` が無い場合、その WF の `gh workflow run` は 404 等で失敗し得る。**他 WF は続行**し、失敗した WF だけユーザーに報告する

### 6. gh で実行するコマンド形

**1 本だけ発火する場合**

```bash
gh workflow run deploy_user.yml --repo OWNER/REPO --ref REF -f environment=development
```

**6 本一括発火する場合（デフォルト・発火のみ・監視は手順 7）**

一括発火の直前に **基準時刻 `SINCE` を 1 回だけ**控える。

```bash
SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for WF in deploy_user.yml deploy_partner.yml deploy_enterprise.yml \
          deploy_functions.yml deploy_firestore.yml deploy_storage.yml; do
  gh workflow run "$WF" --repo OWNER/REPO --ref REF -f environment=development
done
```

`gh workflow run` は即座に返る。6 本を **watch 完了まで待たず** 連続発火する。

### 7. バックグラウンド監視起動（Shell 要件・厳守）

手順 6 の発火後、**エージェント内で `gh run watch` してはならない**。バックグラウンド watcher に委譲する。

発火前に **`DEPLOY_ID`**（UUID）と **`SINCE`**（手順 6 で控えた値）、発火した **`WORKFLOWS`**（カンマ区切り）を控える。

| パラメータ | 値 |
|-----------|-----|
| `block_until_ms` | `0` |
| `notify_on_output.pattern` | `^AGENT_LOOP_WAKE_deploy` |
| `notify_on_output.reason` | `deploy wake` |

手順 6 と連続実行する場合、**`SINCE` は手順 6 の値をそのまま使う**（手順 7 で再取得しない）。

```bash
DEPLOY_ID=$(python3 -c 'import uuid; print(uuid.uuid4())')
WORKFLOWS="deploy_user.yml,deploy_partner.yml,deploy_enterprise.yml,deploy_functions.yml,deploy_firestore.yml,deploy_storage.yml"

.agents/scripts/github_actions_deploy_watch.sh \
  --owner "$OWNER" \
  --repo "$REPO" \
  --ref "$REF" \
  --since "$SINCE" \
  --workflows "$WORKFLOWS" \
  --deploy-id "$DEPLOY_ID"
```

- **`notify_on_output` を付けない起動は未完成**とみなし、手順 7 完了と報告してはならない
- 1 本だけ発火した場合は `WORKFLOWS` をその 1 ファイルにする
- `--created ">=$SINCE"` が使えない環境では、`gh run list` の `startedAt`／`createdAt` を確認し、基準時刻より後の run か目視で照合してから watch する
- 6 本を一括発火しても、GitHub Actions の **同時実行枠**の都合で run が **Queued** になることはある（発火は並列・実行はキュー待ちになり得る）

### 8. 即時報告

ユーザーへ次を伝える（各 run の成否はまだ確定しない）:

- **OWNER/REPO**・**ref**・**DEPLOY_ID**
- 発火した **workflow ファイル名**
- **バックグラウンド監視中**である旨（完了後 sentinel で自動 wake）
- push 省略時はその旨

### 9. sentinel 受信時 → 結果読み取り・失敗解析

stdout の sentinel 例:

```
AGENT_LOOP_WAKE_deploy {"prompt":"/github-actions-deploy","mode":"report","deploy_id":"<uuid>"}
```

- 結果 JSON: `.agents/state/deploy-results/<deploy_id>.json`

- **`notify_on_output` による wake 受信後、同一ターンで** 手順 10（報告 + consume）まで完走する
- 各 run の **成否** と **run URL** を results JSON から報告
- 失敗 run について `gh run view "$RUN_ID" --repo OWNER/REPO --log-failed` で解析（修正はしない）

**results JSON スキーマ（概要）**:

| フィールド | 説明 |
|-----------|------|
| `overall_status` | `success` / `failure` / `partial` |
| `runs[].workflow` | ワークフローファイル名 |
| `runs[].run_id` | GitHub run ID（特定失敗時は null） |
| `runs[].url` | run URL |
| `runs[].success` | 成否 |

### 10. 結果をユーザーに伝える

- push した **REMOTE**・**OWNER/REPO**・**ref**（push 省略時はその旨）
- 発火した **workflow ファイル名**、**environment 入力の値**
- 各 run の **成否** と **run の URL**
- 失敗時は **手順 9 の分類と原因サマリ**（下表）
- `branch.<branch>.sandboxRemote` を新規保存した場合はその旨

| 分類 | ログの手がかり | 典型的な原因 | 推奨アクション（提案のみ） |
|------|----------------|--------------|----------------------------|
| 一時的エラー | `HTTP Error: 503` / `500` / `429`、`service is currently unavailable` | Firebase / Google API 側の一時障害 | 再実行を提案 |
| Rules コンパイルエラー | `compilation errors`、`firestore.rules` / `storage.rules` | ルールの構文・参照ミス | 該当ルールの修正が必要 |
| インデックス | `firestore.indexes.json` 関連の Error | indexes 定義の不整合 | indexes 定義の見直し |
| 権限・認証 | `403`、`PERMISSION_DENIED`、`GOOGLE_APPLICATION_CREDENTIALS`、IAM 系 | サービスアカウント権限・Secrets 設定 | リポの Secrets / IAM 設定確認 |
| API 未有効化 | `has not been used in project`、`API ... is disabled` | 必要 API が無効 | GCP で該当 API を有効化 |
| ビルド失敗 | `tsc`、`npm run build`、Functions のビルドエラー、`npm -w enterprise run build` | アプリ側のビルド不良 | ソース修正（このスキルでは修正しない） |

- **重要**: 解析までで止める。修正や自動再実行は行わない

**報告完了後**に pending wake を consume する（中断時の復旧のため、報告前に consume しない）:

```bash
python3 .agents/scripts/github_actions_deploy_wake.py consume \
  --wake-file .agents/state/deploy-pending-wake.json \
  --deploy-id "$DEPLOY_ID"
```

## スクリプト

| ファイル | 役割 |
|---------|------|
| [`.agents/scripts/github_actions_deploy_watch.sh`](../../scripts/github_actions_deploy_watch.sh) | バックグラウンド RUN_ID 特定 + 並列 watch + sentinel |
| [`.agents/scripts/github_actions_deploy_state.py`](../../scripts/github_actions_deploy_state.py) | watcher PID 管理 |
| [`.agents/scripts/github_actions_deploy_wake.py`](../../scripts/github_actions_deploy_wake.py) | 結果報告 pending wake |
| [`.agents/scripts/github_actions_deploy_check.py`](../../scripts/github_actions_deploy_check.py) | RUN_ID 特定・results JSON 構築 |

開発用テスト:

```bash
python3 .agents/hooks/test-github-actions-deploy-watch.py
bash -n .agents/scripts/github_actions_deploy_watch.sh
```

## トラブルシュート

### pending wake / sentinel が出ない

watcher ログと [`.agents/state/deploy-watch.json`](../../state/deploy-watch.json) を確認し、手動で mode=report（results JSON 参照）を実行する。

## 注意

- このスキルは **ローカルの Cursor エージェントが `git` と `gh` を実行する**前提
- **本番 `nijuniinc/bokudeli-event-new` は必ず拒否**（push も発火も）
- **デフォルトは push → 発火**。push 省略はユーザー明示または 1c（発火のみ）のみ
- **`branch.<branch>.sandboxRemote`** は `git-reflect-after-commit` と共有する。ブランチごとに sandbox 先を記憶する
- 6 本すべて発火すると Functions や Hosting（user / partner / enterprise）がまとめて動く。ユーザーが「user だけ」「enterprise だけ」と言った場合は絞る
- 6 本一括は **一括発火 → バックグラウンド並列 watch → wake 1 回で結果報告** がデフォルト
- デプロイ失敗時は **原因を解析するだけ**。修正・自動再実行はユーザーに委ねる

## 関連ドキュメント

sandbox や Environment の意味は `documents/実装メモ/sandboxデプロイのGitHub Actions.md` を参照する。
