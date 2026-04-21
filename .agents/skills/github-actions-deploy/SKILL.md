---
name: github-actions-deploy
description: GitHub 上の指定リポジトリに対し、gh CLI でデプロイ系ワークフローを workflow_dispatch により手動発火する。fork や sandbox 向け。**ユーザーがリモート名とブランチ（例 sandbox2510/feat/960-v2）またはリポ URL・owner/repo とブランチを会話で明示したときだけ**使う。ローカル git の upstream（@{upstream}）だけを根拠に勝手に ref を決めて発火してはならない——明示がなければ gh workflow run は実行せず、指定を求める。bokudeli-event-yasu をデプロイ、nijuni-yasu のリポを Actions で走らせたい、workflow_dispatch で deploy、リモート sandbox に手動デプロイ などの文脈で参照する。本番リポジトリ nijuniinc/bokudeli-event-new ではこのスキルを使わず発火してはならない。push ではなく Actions の手動実行でデプロイしたいときに使う。
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
| deploy_admin.yml | hosting admin |
| deploy_functions.yml | functions |
| deploy_firestore.yml | firestore |
| deploy_storage.yml | storage |
| deploy_manager.yml | hosting manager |

- ユーザーが **特定パッケージだけ** と言ったら、対応する 1 本だけ `gh workflow run` する
- **全体デプロイ**や指定がなければ、上記 6 本を順に発火する。並列で走らせてよいが、同一リポで負荷を抑えたい場合は順次実行でもよい
- **6 本一括は負荷が大きい**ため、初回や迷いがあるときはユーザーに確認してもよい

### 5. gh で実行するコマンド形

```bash
gh workflow run deploy_user.yml --repo OWNER/REPO --ref BRANCH -f environment=development
```

他の yml も同様にファイル名だけ変える。

実行後、一覧で確認する例:

```bash
gh run list --repo OWNER/REPO --limit 10
```

### 6. 結果をユーザーに伝える

- 発火した **owner/repo**、**ref**、**workflow ファイル名**、**environment 入力の値** を列挙する
- ユーザーが **`リモート名/ブランチ名` 形式**で依頼した場合は、解釈した **リモート・ref** をそのまま示し、意図と一致するか確認しやすくする
- 失敗時は `gh` のエラーメッセージを要約し、権限・ブランチ名・リポジトリ名の typo を疑う

## 注意

- このスキルは **ローカルの Cursor エージェントが gh を実行する**前提である。Cursor クラウドやサンドボックスのみでは gh や認証が無いことがある。その場合はユーザーに同じコマンドを端末で実行してもらう
- **本番 `nijuniinc/bokudeli-event-new` は必ず拒否**する。依頼の言い回しが本番 URL でも同様
- **upstream や現在ブランチだけ**ではデプロイ先 ref を決めない。**必ず会話での明示**（`リモート/ブランチ` または リポ + ブランチ）を待つ
- 6 本すべて発火すると Functions や Hosting がまとめて動く。ユーザーが「user だけ」と言った場合は絞る

## 関連ドキュメント

sandbox や Environment の意味は `documents/実装メモ/sandboxデプロイのGitHub Actions.md` を参照する。
