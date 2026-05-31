---
name: git-fixup
description: 変更を過去の適切なコミットに fixup + autosquash で統合する。コミットメッセージはそのまま。fixup 向きでない差分がある場合は git-split-commit または git-commit-message に委譲する。「fixupして」「フィックスアップして」「過去のコミットにまとめて」と依頼された時に使用する。吸収先はいま作業中のブランチ上のコミットに限定する。すでに origin/development にマージ済みの古いコミットを吸収先にすると rebase 範囲が広がりリモートと乖離しやすい。
---

# fixup

レビュー修正など、既存コミットに吸収すべき変更を fixup コミット経由で統合する。コミットメッセージは変更しない。

## squash との使い分け

| 依頼の意図 | スキル |
|------------|--------|
| 過去コミットに足すだけ、メッセージはそのまま | **git-fixup**（本スキル） |
| 過去コミットに足し、統合後のメッセージも直す | **git-squash** |
| 新規・分割コミット | **git-split-commit** / **git-commit-message** |

## 適用範囲（必ず守る）

- fixup + autosquash は **現在チェックアウトしている作業ブランチ** に対してのみ行う。
- 吸収先コミットは **そのブランチの先端からたどれる範囲** に置く。`origin/development`（チームの既定統合先）**より手前の、ブランチ専用のコミット**に fixup する。
- すでに **`origin/development` に取り込まれた履歴のコミット** を吸収先にすると、`git rebase … <吸収先>~1` が共通祖先まで遡り、**全履歴の書き換え・リモートとの大幅乖離**につながる。ユーザーが明示しない限り、そのような吸収先は **選ばない**。迷う場合はユーザーに確認する。

**確認の目安**: `base=$(git merge-base HEAD origin/development)` を打ち、各吸収先が **`base` の子孫**（分岐後のブランチ上にだけあるコミット）であることを確認する。吸収先が `base` より **development 側の過去**にしかない場合は fixup 先を選び直す。

## 手順

1. 変更状況とコミット履歴を確認する

```
git status
git log --oneline --name-only
```

2. 各変更ファイルの吸収先コミットを特定する

変更ファイルごとに、その変更を論理的に含むべきコミットを吸収先とする。
`git log --oneline --name-only` の出力から、各ファイルが含まれるコミットを確認する。

**禁止**: `origin/development` にすでにマージ済みの過去コミットだけを吸収先にする（rebase 起点が共通祖先まで広がる）。吸収先は **いまのブランチに載っているコミット** に絞る。

3. fixup 前の分類（必須）

手順 2 のあと、**各未コミット変更**を次のいずれかに分類する。分類結果をユーザーに短く示してから進む。

| 分類 | 条件の目安 | 次のアクション |
|------|------------|----------------|
| **A. fixup** | ブランチ上の特定コミットがそのファイルを導入・変更しており、今回の差分がそのコミットの追修正・仕様追従である | 本スキル手順 5 以降 |
| **B. 新規コミット（複数）** | 責務が複数、または [doc]/[ai]/[common] を単独コミットにすべき（git-split-commit の順序・範囲） | **git-split-commit** スキルを読み、分割案とメッセージを出す。fixup は実行しない |
| **C. 新規コミット（1つ）** | 過去コミットに属さない新機能・方針変更で、先端に 1 コミット足す | **git-commit-message** スキルでメッセージ生成 → 通常の `git commit` |
| **D. 判断不能** | 吸収先が複数候補で同程度、または development 側の古いコミットしか候補がない | ユーザーに確認。fixup を進めない |

### fixup すべきでない典型（B または C）

- **git-split-commit の単独コミット規則**に当たる変更を、過去コミットへ fixup しない  
  - 例: 初出の [doc]/[ai] ファイル、common スキーマの新規追加、特定ファイルの削除・廃止方針
- **そのファイルを最後に触ったコミットと無関係**な変更（別 Issue・別機能の混在）
- **吸収先がブランチ上にない**（`git log --oneline --name-only` で当該パスが出てこない）
- **吸収先が `merge-base HEAD origin/development` より development 側だけ**（上記「適用範囲」）
- ユーザーが **新規コミット・分割コミット**を明示した場合

### fixup してよい典型（A）

- レビュー指摘の追随、文言・UI の微修正、同一 PR 内で導入したファイルの仕様書追記（ユーザーが「過去の doc コミットに fixup」と明示した場合を含む）

### 委譲の進め方

1. ワークツリーを分類表（A/B/C/D）で一覧化する
2. **B が 1 件でもある** → **git-split-commit** スキルで分割案を出す。ユーザー承認後に B（と必要なら C）をコミットし、残った A だけで本スキルの fixup を再開する
3. **B がなく C のみ** → **git-commit-message** でメッセージを生成し C をコミットしてから、A だけ fixup
4. **A のみ** → 本スキル手順 5 以降
5. ユーザーが「全部 fixup で」と明示した場合でも、**B の [ai]/[common] 単独規則**は git-split-commit 側を優先し、例外理由を 1 行で伝える

**禁止**: B/C を無理に `commit --fixup` する（履歴が読みにくく、メッセージも付けられない）。

### 出力（fixup 検討時）

```
### 分類
- A fixup: …
- B 分割: … → git-split-commit
- C 新規1件: … → git-commit-message

### 実行計画
1. …
2. …
```

B/C がある場合、autosquash は B/C を通常コミットしたあと、A だけ残ってから実施する。

4. ステージングをいったん全解除する

```
git restore --staged .
```

吸収先ごとに必要な差分だけを選んでステージするため、クリーンな状態から始める。

5. 吸収先ごとに fixup コミットを作成する（分類 A のみ）

B/C は手順 3 で委譲済みであること。未コミットの B/C が残っていたら fixup に進まない。

流れ: 1) 全解除 → 2) 必要な差分だけステージ（add または add -p）→ 3) commit --fixup

**ファイル単位で吸収する場合**

```
git add <対象ファイル...>
git commit --fixup <吸収先ハッシュ>
```

**同一ファイル内のハンク単位で吸収する場合**

```
git add -p <対象ファイル>
```

`y`（ステージ）/ `n`（スキップ）/ `s`（ハンク分割）で必要な差分だけを選択し、`git commit --fixup <吸収先ハッシュ>` を実行する。残りの差分は次の fixup コミット作成時に再度 `git add -p` で選択する。

`--fixup` はコミットメッセージを自動生成する（例: `fixup! 元のコミットメッセージ`）。統合後も元のメッセージはそのまま。

6. ワーキングツリーがクリーンであることを確認し、autosquash で rebase を実行する

`git status` で `Your branch is ahead of` と表示されている場合はそのまま進める。`have diverged` と表示されている場合は、ユーザーが force push を実行する必要がある。

複数の吸収先がある場合は最も古いコミットの一つ前を起点にする（例: `abc1234` と `def5678` へ fixup する場合、古い方の `abc1234~1` を指定）。

```
git status
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <最古の吸収先>~1
```

`GIT_SEQUENCE_EDITOR=true` でエディタを開かずに自動実行する。
コンフリクトが発生した場合は `git rebase --abort` で中断し、手動解決が必要な旨を報告する。

7. 結果を確認する

```
git log --oneline
git status
```

fixup コミットが消えて元のコミット数に戻っていることを確認する。

8. リモートへの push

rebase により履歴が書き換わっているため、リモートに反映する。

まず現在のブランチと upstream 設定を確認する。

```
current=$(git rev-parse --abbrev-ref HEAD)
```

`current` が `HEAD`（detached HEAD）の場合は **push を実行しない**。ユーザーに、通常ブランチにチェックアウトするか、push 先リモート・ブランチを明示してもらう。

```
remote_name=$(git config --get branch."$current".remote)
merge_ref=$(git config --get branch."$current".merge)
```

`remote_name` または `merge_ref` が空の場合（upstream 未設定）は **push を実行しない**。ユーザーに「`git branch -u <リモート>/<ブランチ>` で upstream を設定する」または「push 先を明示する」よう伝える。

続けて、**上記で得た `remote_name`** で URL を取得し、本番リポか判定する（`git remote get-url` の引数なし実行や、`push.default` に依存した引数なし `git push` は使わない）。

```
git remote get-url "$remote_name"
```

URL が `nijuniinc/bokudeli-event-new` を指している場合は **push を実行しない**。本番リポへの force push は危険なため、ユーザーに「rebase は完了したが、upstream が本番リポを指しているため自動 push は行わない。手動で push 先を指定してほしい」と伝える。

sandbox リモート等で問題ない場合、`merge_ref` からリモート上のブランチ名を得て push する。`merge_ref` は通常 `refs/heads/<ブランチ名>` 形式である。

```
remote_branch=${merge_ref#refs/heads/}
```

`merge_ref` が `refs/heads/` で始まらない場合は **push を実行せず**、手動確認を促す。

```
git push --force-with-lease "$remote_name" "HEAD:$remote_branch"
```

失敗した場合（他者の push でリモートが更新されている等）は、手動対応が必要な旨を報告する。

## 制約

- **作業ブランチ上のコミットにだけ fixup する**。`origin/development` より古い共通基底より前のコミットを吸収先にしない（履歴の巻き込み・remote 乖離を防ぐ）
- fixup 向きでない変更は本スキルでコミットしない。**git-split-commit** または **git-commit-message** を先に使う
- rebase 前に `git status` でワーキングツリーがクリーンであることを確認する
- push には `--force-with-lease` を使い、他者の push を上書きしないようにする
- main / development ブランチでは実行しない
- コミットメッセージも修正したい吸収先には **git-squash** スキルを使用する
