---
name: github-actions-deploy
description: sandbox / fork 向け。ローカル HEAD を branch.<branch>.sandboxRemote で決まった sandbox へ push してから、gh CLI で deploy_*.yml を workflow_dispatch 発火する。sandbox 先は git-reflect-after-commit と同じ branch.<branch>.sandboxRemote で記憶。git-reflect-after-commit / github-sandbox-wip-deploy から委譲時は会話に sandbox と書かなくてよい。「sandbox にデプロイ」で sandboxRemote 設定済みなら現在ブランチで実行可。1a のリモート/ブランチ明示は sandbox 系 remote のみ。repo+ブランチの明示指定は上書き（発火のみ）。「push せず」「再デプロイだけ」で push 省略。本番 nijuniinc/bokudeli-event-new では push も発火も拒否。5 本一括は一括発火後に並列 watch がデフォルト。
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

### 0. 前提確認

```bash
git status
```

- **未コミット変更がある場合**: **中断**する（WIP 含めてデプロイしたい場合は `github-sandbox-wip-deploy` を案内）。
- 委譲元（`git-reflect-after-commit`）で clean 確認済みの場合は省略してよい。

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
- `--force-with-lease` 失敗時はリモートが他で更新された可能性を伝え、`-f` で強制 push するか確認する

### 4. workflow_dispatch の environment 入力

ワークフローは `workflow_dispatch` の入力 **environment** に `development` または `production` が必須である。

**sandbox 系 fork** では setup ジョブ側でこの値は実質参照されず GitHub Environment は `sandbox` 固定だが、YAML 上は必須のため **`development` を渡す**。

```bash
-f environment=development
```

### 5. 発火するワークフローを選ぶ

対象は **リポジトリ内のデプロイ用ワークフロー 5 本のみ**。Lint や他用途のワークフローは動かさない。

| ファイル名 | ざっくりした対象 |
|------------|------------------|
| deploy_user.yml | hosting user |
| deploy_partner.yml | hosting partner |
| deploy_functions.yml | functions |
| deploy_firestore.yml | firestore |
| deploy_storage.yml | storage |

- ユーザーが **特定パッケージだけ** と言ったら、対応する 1 本だけ `gh workflow run` する
- **全体デプロイ**や指定がなければ、上記 5 本を **一括発火**する（**デフォルト**）
- **禁止**: 1 本ごとに `gh run watch` で完了を待ってから次を発火する直列パターン
- 同一リポの負荷を抑えたい場合やユーザーが明示した場合のみ、5 本を **順次発火**してよい

### 6. gh で実行するコマンド形

**1 本だけ発火する場合**

```bash
gh workflow run deploy_user.yml --repo OWNER/REPO --ref REF -f environment=development
```

**5 本一括発火する場合（デフォルト・発火のみ・監視は手順 7）**

一括発火の直前に **基準時刻 `SINCE` を 1 回だけ**控える。

```bash
SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for WF in deploy_user.yml deploy_partner.yml deploy_functions.yml \
          deploy_firestore.yml deploy_storage.yml; do
  gh workflow run "$WF" --repo OWNER/REPO --ref REF -f environment=development
done
```

`gh workflow run` は即座に返る。5 本を **watch 完了まで待たず** 連続発火する。

### 7. デプロイ結果の検知（成功/失敗の確認）

`gh workflow run` は発火するだけで結果を返さない。発火した各ワークフローについて **今回発火した run を確実に特定**し、完了まで監視する。

**手順の流れ（5 本一括の場合）**

1. **フェーズ A（一括発火）**: 手順 6 のとおり `SINCE` を控えて 5 本を連続 `gh workflow run`
2. **フェーズ B（RUN_ID 特定）**: 各 workflow ファイルごとに、基準時刻以降の run をリトライ取得
3. **フェーズ C（並列監視）**: 取得できた run を **並列**に `gh run watch`

**run 特定の注意（重要）**: 単純な `gh run list --limit 1` は危険である。

- 発火直後は run がまだ作成されておらず、`RUN_ID` が **空文字列**になり得る
- `--limit 1` は **同一ブランチの過去に成功した run** を掴むことがある

**一括発火前に基準時刻 `SINCE` を 1 回控え**、各 WF について `workflow_dispatch` イベントかつ **基準時刻以降（`>=`）に作成された run** を、取得できるまで**リトライ**して特定する。

**フェーズ B: RUN_ID 特定（WF ごと）**

```bash
WORKFLOWS=(deploy_user.yml deploy_partner.yml deploy_functions.yml \
           deploy_firestore.yml deploy_storage.yml)
RUN_ID_ENTRIES=()

for WF in "${WORKFLOWS[@]}"; do
  RUN_ID=""
  for i in $(seq 1 10); do
    RUN_ID=$(gh run list --repo OWNER/REPO --workflow "$WF" --branch REF \
      --event workflow_dispatch --created ">=$SINCE" \
      --limit 1 --json databaseId --jq '.[0].databaseId // empty')
    [ -n "$RUN_ID" ] && RUN_ID_ENTRIES+=("${WF}:${RUN_ID}") && break
    sleep 3
  done
  if [ -z "$RUN_ID" ]; then
    echo "[$WF] 今回の run を自動特定できませんでした。一覧から手動で特定してください:"
    gh run list --repo OWNER/REPO --workflow "$WF" --branch REF --limit 10
  fi
done
```

**フェーズ C: 並列監視**

```bash
PIDS=()
FAIL=0
for ENTRY in "${RUN_ID_ENTRIES[@]}"; do
  WF=${ENTRY%%:*}
  RUN_ID=${ENTRY#*:}
  (
    if gh run watch "$RUN_ID" --repo OWNER/REPO --exit-status; then
      exit 0
    else
      exit 1
    fi
  ) &
  PIDS+=($!)
done

for pid in "${PIDS[@]}"; do
  wait "$pid" || FAIL=1
done
```

- `RUN_ID` が空のまま `gh run watch` を実行しない
- 失敗した run は手順 8 で `gh run view "$RUN_ID" --log-failed` を解析する

**1 本だけ発火・監視する場合の例**

```bash
SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
WF=deploy_firestore.yml
gh workflow run "$WF" --repo OWNER/REPO --ref REF -f environment=development

RUN_ID=""
for i in $(seq 1 10); do
  RUN_ID=$(gh run list --repo OWNER/REPO --workflow "$WF" --branch REF \
    --event workflow_dispatch --created ">=$SINCE" \
    --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  [ -n "$RUN_ID" ] && break
  sleep 3
done

if [ -z "$RUN_ID" ]; then
  echo "今回の run を自動特定できませんでした。一覧から手動で run を特定してください:"
  gh run list --repo OWNER/REPO --workflow "$WF" --branch REF --limit 10
else
  gh run watch "$RUN_ID" --repo OWNER/REPO --exit-status
fi
```

**補足**

- `--created ">=$SINCE"` が使えない環境では、`gh run list` の `startedAt`／`createdAt` を確認し、基準時刻より後の run か目視で照合してから watch する。
- 5 本を一括発火しても、GitHub Actions の **同時実行枠**の都合で run が **Queued** になることはある（発火は並列・実行はキュー待ちになり得る）。

### 8. 失敗時のエラー解析（解析のみ・修正はしない）

```bash
gh run view "$RUN_ID" --repo OWNER/REPO --log-failed
```

| 分類 | ログの手がかり | 典型的な原因 | 推奨アクション（提案のみ） |
|------|----------------|--------------|----------------------------|
| 一時的エラー | `HTTP Error: 503` / `500` / `429`、`service is currently unavailable` | Firebase / Google API 側の一時障害 | 再実行を提案 |
| Rules コンパイルエラー | `compilation errors`、`firestore.rules` / `storage.rules` | ルールの構文・参照ミス | 該当ルールの修正が必要 |
| インデックス | `firestore.indexes.json` 関連の Error | indexes 定義の不整合 | indexes 定義の見直し |
| 権限・認証 | `403`、`PERMISSION_DENIED` | Secrets / IAM | リポの Secrets 確認 |
| API 未有効化 | `API ... is disabled` | 必要 API が無効 | GCP で API 有効化 |
| ビルド失敗 | `tsc`、`npm run build` | アプリ側のビルド不良 | ソース修正 |

- **重要**: 解析までで止める。修正や自動再実行は行わない

### 9. 結果をユーザーに伝える

- push した **REMOTE**・**OWNER/REPO**・**ref**（push 省略時はその旨）
- 発火した **workflow ファイル名**、**environment 入力の値**
- 各 run の **成否** と **run の URL**
- 失敗時は **手順 8 の分類と原因サマリ**
- `branch.<branch>.sandboxRemote` を新規保存した場合はその旨

## 注意

- このスキルは **ローカルの Cursor エージェントが `git` と `gh` を実行する**前提
- **本番 `nijuniinc/bokudeli-event-new` は必ず拒否**（push も発火も）
- **デフォルトは push → 発火**。push 省略はユーザー明示または 1c（発火のみ）のみ
- **`branch.<branch>.sandboxRemote`** は `git-reflect-after-commit` と共有する。ブランチごとに sandbox 先を記憶する
- 5 本一括は **一括発火 → 並列 watch** がデフォルト
- デプロイ失敗時は **原因を解析するだけ**。修正・自動再実行はユーザーに委ねる

## 関連ドキュメント

sandbox や Environment の意味は `documents/実装メモ/sandboxデプロイのGitHub Actions.md` を参照する。
