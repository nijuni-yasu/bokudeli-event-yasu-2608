---
name: github-actions-deploy
description: GitHub 上の指定リポジトリに対し、gh CLI でデプロイ系ワークフローを workflow_dispatch により手動発火する。fork や sandbox 向け。ローカルでは git の upstream が sandbox2510 や sandbox2603 などのリモートを指していれば、そのリモート URL と追跡ブランチで OWNER/REPO と ref を決める。bokudeli-event-yasu をデプロイ、nijuni-yasu のリポを Actions で走らせたい、workflow_dispatch で deploy、リモート sandbox に手動デプロイ などの文脈で参照する。本番リポジトリ nijuniinc/bokudeli-event-new ではこのスキルを使わず発火してはならない。push ではなく Actions の手動実行でデプロイしたいときに使う。
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

## トリガー例

次のような表現を検知したらこのスキルを使う（対象リポが本番でないこと）。

- `https://github.com/nijuni-yasu/bokudeli-event-yasu-2603` をデプロイして
- `github.com/nijuni-yasu/bokudeli-event-yasu-2510` を Actions で走らせて
- `nijuni-yasu/bokudeli-event-yasu-2603` の user をデプロイ
- sandbox リポを workflow_dispatch で全部デプロイ
- リポ URL を貼らず「今のブランチを sandbox にデプロイ」など、**ローカル upstream 前提**の依頼

## 手順

### 1. OWNER/REPO と ref を決める

次の **優先順** で決める。ユーザーが **URL とブランチの両方を明示**していれば 1a のみでよい。

#### 1a. ユーザーが URL または owner/repo を明示している場合

- 完全 URL: `https://github.com/OWNER/REPO` または `http://github.com/OWNER/REPO` から `OWNER/REPO` を抽出する。末尾の `.git` や `/` は除く
- すでに `owner/repo` 形式ならそのまま使う
- **ref**: ユーザーがブランチ名を言っていればそれを使う。無ければ 1c のフォールバックへ

**ここで `nijuniinc/bokudeli-event-new` と一致したら処理を打ち切る**。`gh workflow run` は実行しない。

#### 1b. ローカル git の upstream から決める（推奨パターン）

ワークスペースが **git リポジトリ**で、ユーザーが **リポ URL を貼っていない**、または **今追っている sandbox にデプロイでよい**と判断できるときに使う。

1. リポジトリルートで次を実行する:

```bash
git rev-parse --abbrev-ref @{upstream}
```

2. 出力は `リモート名/ブランチ名` の形である。ブランチ名に `/` が含まれ得るため、**先頭の最初の `/` だけ**で左右に分割する。  
   - 例: `sandbox2603/ai/1842` → リモート名 `sandbox2603`、ref `ai/1842`  
   - 例: `sandbox2510/feature/foo` → リモート名 `sandbox2510`、ref `feature/foo`

3. **リモート名が `origin` の場合**  
   `git remote get-url origin` をパースし、`nijuniinc/bokudeli-event-new` なら **本番のため gh workflow run は実行せず拒否**する。

4. **リモート名が `sandbox2510` / `sandbox2603` など本番以外のとき**  
   `git remote get-url <リモート名>` の URL から `OWNER/REPO` を取り出す。ref は手順 2 の右側のブランチ名。

**リモート URL から OWNER/REPO を取る例**

- `git@github.com:nijuni-yasu/bokudeli-event-yasu-2603.git` → `nijuni-yasu/bokudeli-event-yasu-2603`
- `https://github.com/OWNER/REPO.git` → `OWNER/REPO`

5. `@{upstream}` が失敗する、未設定の場合は **1c** へ。

**運用メモ**: `git push -u sandbox2603 ブランチ名` のように **sandbox 用リモートを upstream にした状態**だと、この手順でデプロイ先リポと ref が一意に決まりやすい。

#### 1c. フォールバック

- ユーザーに **どのリポ**（またはどのリモート名）と **どのブランチ**で発火するか確認する
- ユーザーが **リモート名だけ**（例: sandbox2603 でデプロイ）と言った場合は `git remote get-url sandbox2603` で OWNER/REPO を取り、ref は `git branch --show-current` または確認
- それでも決まらないときのみ、対象リポが既に分かっている前提でデフォルトブランチを調べる:

```bash
gh repo view OWNER/REPO --json defaultBranchRef --jq .defaultBranchRef.name
```

デフォルトブランチは **最後の手段**とし、可能な限り **upstream の追跡ブランチ**や **ユーザーの明示**を優先する。

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
- **1b を使った場合**は、解釈した **upstream**（例: `sandbox2603/ai/1842`）も伝え、ユーザーが意図と一致するか確認しやすくする
- 失敗時は `gh` のエラーメッセージを要約し、権限・ブランチ名・リポジトリ名の typo を疑う

## 注意

- このスキルは **ローカルの Cursor エージェントが gh を実行する**前提である。Cursor クラウドやサンドボックスのみでは gh や認証が無いことがある。その場合はユーザーに同じコマンドを端末で実行してもらう
- **本番 `nijuniinc/bokudeli-event-new` は必ず拒否**する。依頼の言い回しが本番 URL でも、**upstream が origin で本番 URL** でも同様
- **複数 sandbox リモート**（sandbox2510 / sandbox2603 等）があるとき、upstream が無いブランチではデプロイ先が曖昧になる。**push -u で upstream を付ける**か、ユーザーにリモート名や URL を確認する
- 6 本すべて発火すると Functions や Hosting がまとめて動く。ユーザーが「user だけ」と言った場合は絞る

## 関連ドキュメント

sandbox や Environment の意味は `documents/実装メモ/sandboxデプロイのGitHub Actions.md` を参照する。
