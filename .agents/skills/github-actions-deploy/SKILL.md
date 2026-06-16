---
name: github-actions-deploy
description: GitHub 上の指定リポジトリに対し、gh CLI でデプロイ系ワークフローを workflow_dispatch により手動発火する。fork や sandbox 向け。**ユーザーがリモート名とブランチ（例 sandbox2510/feat/960-v2）またはリポ URL・owner/repo とブランチを会話で明示したときだけ**使う。ローカル git の upstream（@{upstream}）だけを根拠に勝手に ref を決めて発火してはならない——明示がなければ gh workflow run は実行せず、指定を求める。bokudeli-event-yasu をデプロイ、nijuni-yasu のリポを Actions で走らせたい、workflow_dispatch で deploy、リモート sandbox に手動デプロイ などの文脈で参照する。本番リポジトリ nijuniinc/bokudeli-event-new ではこのスキルを使わず発火してはならない。push ではなく Actions の手動実行でデプロイしたいときに使う。デプロイ後は run の成否を監視し、失敗時はログから原因を解析する（解析のみ・修正はしない）。6 本一括は一括発火後に並列 watch がデフォルト。デプロイエラーの原因を調べたい・解析したいという文脈でも参照する。
---

# GitHub Actions デプロイ手動発火

## 目的

ユーザーが **どの GitHub リポジトリに対して** デプロイ用ワークフローを走らせるかを指示したとき、そのリポジトリで **workflow_dispatch** を発火する手順に従う。

本リポジトリのワークフロー定義は `.github/workflows/deploy_*.yml` である。fork や sandbox リポでも **同一ファイル名・同一 inputs** を前提にする。異なる場合はユーザーに確認する。

## 本番リポジトリは対象外（厳守）

次のリポジトリに対しては、このスキル経由で **`gh workflow run` を一切実行してはならない**。依頼が来ても **拒否し、理由をユーザーに伝える**。

- **本番リポジトリ**: `nijuniinc/bokudeli-event-new`  
  URL 例: `https://github.com/nijuniinc/bokudeli-event-new`

正規化のあと `OWNER/REPO` が上記と一致する場合はブロックする。大小文字は GitHub の慣例に合わせ小文字比較でもよいが、通常は `nijuniinc/bokudeli-event-new` のみを想定する。

**ローカル git の upstream が `origin/ブランチ名` のとき**、`git remote get-url origin` が本番リポを指していれば、同様に **gh workflow run は実行しない**。

本番のデプロイは **GitHub の Web UI からの手動実行**や **既定のブランチへの push** など、チームの運用に任せる。このスキルは **sandbox / fork 用の遠隔発火**に限定する。

## 前提

- **GitHub CLI** `gh` がインストール済みであること
- `gh auth login` 済みで、対象リポジトリに **actions:write** 相当の権限があること（リポジトリへの書き込み権限または fine-grained PAT の Workflows 権限）
- ネットワークが利用できる実行環境であること

権限不足で 403 になる場合は、ユーザーに PAT のスコープや org の GitHub Actions ポリシーを確認してもらう。

## 明示指定が必須（upstream だけでは発火しない）

**次を満たさない限り `gh workflow run` を実行してはならない。** 不足していれば発火せず、ユーザーに `リモート名/ブランチ名`（例: `sandbox2510/feat/960-v2`）または **リポ（URL または owner/repo）とブランチ**を書いてもらう。

### デプロイ対象として「明示された」とみなす例

- **リモート/ブランチ**: 会話に `sandbox2510/feat/960-v2`、`sandbox2603/ai/1842` のように **`既知の sandbox 系リモート名` + `/` + ブランチ** が含まれる（先頭の `/` だけで左右分割し、右側全体を ref とする）
- **リポ + ブランチ**: GitHub URL または `owner/repo` と、別にまたは同じ発話内で **ブランチ名**が指定されている
- **リモート名とブランチを別表現**: 例「sandbox2510 の feat/960-v2 にデプロイ」など、**どのリモートのどのブランチか**が一意に読み取れる

### 明示がない典型（このままでは発火しない）

- 「デプロイして」「sandbox にデプロイ」だけで **リモート/ブランチまたはリポ+ブランチが無い**
- **ローカルの `git rev-parse @{upstream}` や現在ブランチだけ**を根拠に、ユーザーが口頭でリモート・ブランチを言っていない

`@{upstream}` は **補助情報**（ユーザーが指定したリモート/ブランチと一致するか確認する、リモート URL から OWNER/REPO を取る）に使ってよいが、**ユーザー発話に無い ref で勝手に決めて発火してはならない**。

## トリガー例

次のような表現を検知したらこのスキルを使う（対象リポが本番でないこと、かつ **上記の明示指定があること**）。

- `sandbox2510/feat/960-v2` にデプロイして
- `https://github.com/nijuni-yasu/bokudeli-event-yasu-2603` のブランチ `ai/1842` をデプロイして
- `nijuni-yasu/bokudeli-event-yasu-2510` を Actions で走らせて（**ブランチも明示されている場合**）
- sandbox リポを workflow_dispatch で全部デプロイ（**リモート/ブランチまたはリポ+ref が「同じユーザー発話」に含まれるか、続く返信でユーザーがコピペ・引用・繰り返しなどで文字どおりに示した場合に限る。会話の要約や「さっきの」とだけの暗黙の文脈では発火しない**）

**NG**: リポ URL もリモート/ブランチも言わず「今のブランチを sandbox にデプロイ」だけ → **確認を求め、明示が取れるまで `gh workflow run` しない**。

## 手順

### 1. OWNER/REPO と ref を決める

次の **優先順** で決める。いずれの段でも **本番リポ**に当たったらそこで打ち切る。

#### 1a. ユーザーが `リモート名/ブランチ名` を明示している場合

会話から `sandbox2510/...` や `sandbox2603/...` など **既知の sandbox リモート名で始まる `A/B` 形式**を取り出す。ブランチ名に `/` が含まれ得るため、**先頭の最初の `/` だけ**で左右に分割する。

- 例: `sandbox2603/ai/1842` → リモート名 `sandbox2603`、ref `ai/1842`
- 例: `sandbox2510/feature/foo` → リモート名 `sandbox2510`、ref `feature/foo`

1. **リモート名が `origin` の場合**  
   `git remote get-url origin` をパースし、`nijuniinc/bokudeli-event-new` なら **拒否**（本番）。

2. **リモート名が sandbox 系など本番以外のとき**  
   `git remote get-url <リモート名>` の URL から `OWNER/REPO` を取る。ref は右側のブランチ名。

**リモート URL から OWNER/REPO を取る例**

- `git@github.com:nijuni-yasu/bokudeli-event-yasu-2603.git` → `nijuni-yasu/bokudeli-event-yasu-2603`
- `https://github.com/OWNER/REPO.git` → `OWNER/REPO`

#### 1b. ユーザーが URL または owner/repo とブランチを明示している場合

- 完全 URL または `owner/repo` から `OWNER/REPO` を抽出する。末尾の `.git` や `/` は除く
- **ref**: ユーザーが会話で指定したブランチ名のみを使う

**ここで `nijuniinc/bokudeli-event-new` と一致したら処理を打ち切る**。`gh workflow run` は実行しない。

#### 1c. 明示が不足している場合

- **`gh workflow run` は実行しない**
- ユーザーに **`リモート名/ブランチ名`（例: `sandbox2510/feat/960-v2`）** または **owner/repo（または URL）とブランチ**を書いてもらう
- ユーザーが **リモート名だけ**言った場合も、**ブランチが会話に無ければ** ref を推測せず確認する

デフォルトブランチを `gh repo view` で調べて ref にするのは、**ユーザーがリポを特定したうえでブランチを任せる**と明言した場合など **限定的**にのみ。upstream や「今のブランチ」だけを根拠にした自動投入はしない。

### 2. 本番ブロックの最終確認

`OWNER/REPO` が `nijuniinc/bokudeli-event-new` に正規化されたら **ここで中止**。ユーザーに「本番リポはこのスキルでは発火しない。GitHub の Actions 画面から操作してほしい」と伝える。

### 3. workflow_dispatch の environment 入力

ワークフローは `workflow_dispatch` の入力 **environment** に `development` または `production` が必須である。

このスキルが対象とするのは **本番リポ以外** のみである。**sandbox 系 fork** では setup ジョブ側でこの値は実質参照されず GitHub Environment は `sandbox` 固定だが、YAML 上は必須のため **`development` を渡す**のでよい。

```bash
-f environment=development
```

本番リポへの発火は行わないため、このスキル内で `production` を選ぶ場面は基本的にない。

### 4. 発火するワークフローを選ぶ

対象は **リポジトリ内のデプロイ用ワークフロー 6 本のみ**。Lint や他用途のワークフローは動かさない。

| ファイル名 | ざっくりした対象 |
|------------|------------------|
| deploy_user.yml | hosting user |
| deploy_partner.yml | hosting partner |
| deploy_functions.yml | functions |
| deploy_firestore.yml | firestore |
| deploy_storage.yml | storage |
| deploy_manager.yml | hosting manager |

- ユーザーが **特定パッケージだけ** と言ったら、対応する 1 本だけ `gh workflow run` する
- **全体デプロイ**や指定がなければ、上記 6 本を **一括発火**する（**デフォルト**）。`gh workflow run` は非同期のため、ループで連続実行すれば数秒で 6 本すべて発火できる
- **禁止**: 1 本ごとに `gh run watch` で完了を待ってから次を発火する直列パターン（user 完了後に partner が走る等、発火が遅くなる）
- 同一リポの負荷を抑えたい場合やユーザーが明示した場合のみ、6 本を **順次発火**してよい
- **6 本一括は負荷が大きい**ため、初回や迷いがあるときはユーザーに確認してもよい

### 5. gh で実行するコマンド形

**1 本だけ発火する場合**

```bash
gh workflow run deploy_user.yml --repo OWNER/REPO --ref BRANCH -f environment=development
```

**6 本一括発火する場合（デフォルト・発火のみ・監視は手順 6）**

一括発火の直前に **基準時刻 `SINCE` を 1 回だけ**控える（6 本共通。`--workflow` で run を区別するため）。

```bash
SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

for WF in deploy_user.yml deploy_partner.yml deploy_functions.yml \
          deploy_firestore.yml deploy_storage.yml deploy_manager.yml; do
  gh workflow run "$WF" --repo OWNER/REPO --ref BRANCH -f environment=development
done
```

`gh workflow run` は即座に返る。6 本を **watch 完了まで待たず** 連続発火する。

発火後の一覧確認:

```bash
gh run list --repo OWNER/REPO --limit 10
```

成否を監視する場合は、手順 6 で **RUN_ID 特定 → 並列 watch** を行う。

### 6. デプロイ結果の検知（成功/失敗の確認）

`gh workflow run` は発火するだけで結果を返さない。発火した各ワークフローについて **今回発火した run を確実に特定**し、完了まで監視する。

**手順の流れ（6 本一括の場合）**

1. **フェーズ A（一括発火）**: 手順 5 のとおり `SINCE` を控えて 6 本を連続 `gh workflow run`（watch はしない）
2. **フェーズ B（RUN_ID 特定）**: 各 workflow ファイルごとに、基準時刻以降の run をリトライ取得
3. **フェーズ C（並列監視）**: 取得できた run を **並列**に `gh run watch`（バックグラウンド起動 + `wait`）

**1 本だけ発火した場合**も、フェーズ B・C は同様（対象 WF が 1 件）。

**run 特定の注意（重要）**: 単純な `gh run list --limit 1` は危険である。

- 発火直後は run がまだ作成されておらず、`RUN_ID` が **空文字列**になり得る（空のまま `gh run watch` すると失敗する）。
- `--limit 1` は最新 run を返すだけで、**同一ブランチの過去に成功した run** を掴むことがある。この場合 `RUN_ID` は空でないため気付きにくく、`gh run watch --exit-status` が **古い成功 run を即座に成功と判定**し、今回の失敗を見逃す。

これを避けるため、**一括発火前に基準時刻 `SINCE` を 1 回控え**、各 WF について `workflow_dispatch` イベントかつ **基準時刻より後に作成された run** を、取得できるまで**リトライ**して特定する。

**フェーズ B: RUN_ID 特定（WF ごと）**

連想配列（`declare -A`）は bash 4+ 専用のため使わない。`WF:RUN_ID` ペアを通常配列に蓄積する（macOS 標準 bash 3.2 / zsh でもコピペ実行可）。

```bash
WORKFLOWS=(deploy_user.yml deploy_partner.yml deploy_functions.yml \
           deploy_firestore.yml deploy_storage.yml deploy_manager.yml)
RUN_ID_ENTRIES=()

for WF in "${WORKFLOWS[@]}"; do
  RUN_ID=""
  for i in $(seq 1 10); do
    RUN_ID=$(gh run list --repo OWNER/REPO --workflow "$WF" --branch BRANCH \
      --event workflow_dispatch --created ">$SINCE" \
      --limit 1 --json databaseId --jq '.[0].databaseId // empty')
    [ -n "$RUN_ID" ] && RUN_ID_ENTRIES+=("${WF}:${RUN_ID}") && break
    sleep 3
  done
  if [ -z "$RUN_ID" ]; then
    echo "[$WF] 今回の run を自動特定できませんでした。一覧から手動で特定してください:"
    gh run list --repo OWNER/REPO --workflow "$WF" --branch BRANCH --limit 10
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

- `RUN_ID` が取れなかった WF は watch しない（一覧提示にフォールバック）。
- 失敗した run（`FAIL=1`）は手順 7 で **WF ごとに** `gh run view "$RUN_ID" --log-failed` を実行して解析する。
- run の URL は `gh run view "$RUN_ID" --repo OWNER/REPO --json url --jq .url` で取得し、報告に含める。
- `RUN_ID` が空のまま `gh run watch` を実行しない。

**1 本だけ発火・監視する場合の例**

```bash
SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ)
WF=deploy_firestore.yml
gh workflow run "$WF" --repo OWNER/REPO --ref BRANCH -f environment=development

RUN_ID=""
for i in $(seq 1 10); do
  RUN_ID=$(gh run list --repo OWNER/REPO --workflow "$WF" --branch BRANCH \
    --event workflow_dispatch --created ">$SINCE" \
    --limit 1 --json databaseId --jq '.[0].databaseId // empty')
  [ -n "$RUN_ID" ] && break
  sleep 3
done

if [ -z "$RUN_ID" ]; then
  echo "今回の run を自動特定できませんでした。一覧から手動で run を特定してください:"
  gh run list --repo OWNER/REPO --workflow "$WF" --branch BRANCH --limit 10
else
  gh run watch "$RUN_ID" --repo OWNER/REPO --exit-status
fi
```

**補足**

- `--created ">$SINCE"` が使えない環境では、`gh run list` の `startedAt`／`createdAt` を確認し、基準時刻より後の run か目視で照合してから watch する。
- 6 本を一括発火しても、GitHub Actions の **同時実行枠**の都合で run が **Queued** になることはある（発火は並列・実行はキュー待ちになり得る）。

### 7. 失敗時のエラー解析（解析のみ・修正はしない）

`gh run watch` が失敗（非ゼロ終了）した場合、失敗ステップのログを取得して原因を解析する。

```bash
gh run view "$RUN_ID" --repo OWNER/REPO --log-failed
```

ログ末尾の `Error:` 行を中心に確認し、次の分類で原因を切り分けてユーザーに報告する。

| 分類 | ログの手がかり | 典型的な原因 | 推奨アクション（提案のみ） |
|------|----------------|--------------|----------------------------|
| 一時的エラー | `HTTP Error: 503` / `500` / `429`、`service is currently unavailable`、`ETIMEDOUT` / `ECONNRESET` | Firebase / Google API 側の一時障害・レート制限 | 同じワークフローの再実行で解消する可能性が高い |
| Rules コンパイルエラー | `compilation errors`、`firestore.rules` / `storage.rules` の行番号付きエラー | ルールの構文・参照ミス | 該当ルールの修正が必要（このスキルでは修正しない） |
| インデックス | `firestore.indexes.json` 関連の Error | indexes 定義の不整合 | indexes 定義の見直し |
| 権限・認証 | `403`、`PERMISSION_DENIED`、`GOOGLE_APPLICATION_CREDENTIALS`、IAM 系 | サービスアカウント権限・Secrets 設定 | リポの Secrets / IAM 設定確認 |
| API 未有効化 | `has not been used in project`、`API ... is disabled` | 必要 API が無効 | GCP で該当 API を有効化 |
| ビルド失敗 | `tsc`、`npm run build`、Functions のビルドエラー | アプリ側のビルド不良 | ソース修正（このスキルでは修正しない） |

- **重要**: このスキルは **解析までで止める**。ルール・コード・設定の修正や、ワークフローの自動再実行は行わない。一時的エラーで再実行が有効そうな場合でも、再実行の可否はユーザーに委ねる。
- 例: `firebaserules.googleapis.com ... HTTP Error: 503, The service is currently unavailable` → **一時的エラー**。Firebase Rules API の一時障害で、ブランチ内容に問題はない。`gh workflow run deploy_firestore.yml ...` の再実行を提案する。

### 8. 結果をユーザーに伝える

- 発火した **owner/repo**、**ref**、**workflow ファイル名**、**environment 入力の値** を列挙する
- 各 run の **成否** と **run の URL** を示す
- 失敗した run については、**手順 7 の分類と原因サマリ**、および推奨アクション（再実行が有効か / 修正が必要か）を伝える
- ユーザーが **`リモート名/ブランチ名` 形式**で依頼した場合は、解釈した **リモート・ref** をそのまま示し、意図と一致するか確認しやすくする
- それ以外の `gh` のエラー（発火自体の失敗）は、権限・ブランチ名・リポジトリ名の typo を疑う

## 注意

- このスキルは **ローカルの Cursor エージェントが gh を実行する**前提である。Cursor クラウドやサンドボックスのみでは gh や認証が無いことがある。その場合はユーザーに同じコマンドを端末で実行してもらう
- **本番 `nijuniinc/bokudeli-event-new` は必ず拒否**する。依頼の言い回しが本番 URL でも同様
- **upstream や現在ブランチだけ**ではデプロイ先 ref を決めない。**必ず会話での明示**（`リモート/ブランチ` または リポ + ブランチ）を待つ
- 6 本すべて発火すると Functions や Hosting がまとめて動く。ユーザーが「user だけ」と言った場合は絞る
- **6 本一括は一括発火 → 並列 watch がデフォルト**。1 本 watch 完了まで待ってから次を発火する直列パターンは使わない
- デプロイ後は run の成否を監視し、失敗時はログから **原因を解析するだけ**にとどめる。ルール・コード・設定の修正や自動再実行はしない（再実行の可否はユーザーに委ねる）

## 関連ドキュメント

sandbox や Environment の意味は `documents/実装メモ/sandboxデプロイのGitHub Actions.md` を参照する。
