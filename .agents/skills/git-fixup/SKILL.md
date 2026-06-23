---
name: git-fixup
description: 変更を過去の適切なコミットに fixup + autosquash で統合する。コミットメッセージはそのまま。A1-fast（軽量判定）で通し、昇格時のみ A2 squash へ委譲。分類は git-commit-workflow/references/classification.md に従う。fixup 向きでない差分は git-split-commit または git-commit-message へ委譲。「fixupして」「フィックスアップして」と明示依頼された時に使用。吸収先はいま作業中のブランチ上のコミットに限定する。
---

# fixup

レビュー修正など、既存コミットに吸収すべき変更を fixup コミット経由で統合する。コミットメッセージは変更しない。

## 他スキルとの使い分け

| 依頼の意図                                   | スキル                                        |
| -------------------------------------------- | --------------------------------------------- |
| 自律判断（fixup / squash / 分割 / 新規）     | **git-commit-workflow**                       |
| 過去コミットに足すだけ、メッセージはそのまま | **git-fixup**（本スキル）                     |
| 過去コミットに足し、統合後のメッセージも直す | **git-squash**                                |
| 新規・分割コミット                           | **git-split-commit** / **git-commit-message** |

## 手順

1. 変更状況とコミット履歴を確認する

```
git status
git log --oneline --name-only
```

2. 各変更ファイルの吸収先コミットを特定する

変更ファイルごとに、その変更を論理的に含むべきコミットを吸収先とする。
`git log --oneline --name-only` の出力から、各ファイルが含まれるコミットを確認する。

**禁止**: `origin/development` にすでにマージ済みの過去コミットだけを吸収先にする。吸収先は **いまのブランチに載っているコミット** に絞る。

3. 分類（必須）

[git-commit-workflow/references/classification.md](../git-commit-workflow/references/classification.md) に従い、各未コミット変更を B / C / D / A0 / A1 / A2 に分類する。分類結果をユーザーに短く示してから進む。

**git-commit-workflow から呼ばれた場合**: 手順3は済みとしてスキップし、A1 のみ本スキル手順5以降を実行する。

**本スキル単独で呼ばれた場合の委譲**

- **B** → **git-split-commit**（fixup は実行しない）
- **C** → **git-commit-message** → `git commit`
- **D** → 停止してユーザー確認
- **A0** → **git-commit-workflow** の A0 amend 手順
- **A2** → **git-squash** 手順5以降（メッセージ乖離）
- **A1 のみ** → 本スキル手順4以降

4. A1 判定（A1 のみ、手順5の前）

[classification.md の A1 判定](../git-commit-workflow/references/classification.md#a1-判定fixup-向きか) に従う。

- **A1-fast OK** → 手順5以降（`gh issue view`・意味チェックは **スキップ**）
- **A1-full 昇格** → [coherence-full](../git-commit-message/references/issue-resolution.md#coherence-full-フローa1-full-昇格時) を実行
  - OK → 手順5以降
  - NG（メッセージ更新必要）→ **git-squash** 手順5以降（理由1行）
  - NG（別 Issue）→ **B/C** へ委譲

5. ステージングをいったん全解除する

```
git restore --staged .
```

6. 吸収先ごとに fixup コミットを作成する（A1 のみ）

B/C/D/A2 が残っていたら fixup に進まない。吸収先が HEAD の場合は fixup ではなく A0 amend を使う。

```
git add <対象ファイル...>
git commit --fixup <吸収先ハッシュ>
```

同一ファイル内のハンク単位:

```
git add -p <対象ファイル>
git commit --fixup <吸収先ハッシュ>
```

7. ワーキングツリーがクリーンであることを確認し、autosquash で rebase を実行する

複数の吸収先がある場合は最も古いコミットの一つ前を起点にする。

```
git status
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <最古の吸収先>~1
```

コンフリクトが発生した場合は `git rebase --abort` で中断し、手動解決が必要な旨を報告する。

8. 結果を確認する

```
git log --oneline
git status
```

9. リモートへの push

rebase により履歴が書き換わっているため、リモートに反映する。

```
current=$(git rev-parse --abbrev-ref HEAD)
remote_name=$(git config --get branch."$current".remote)
merge_ref=$(git config --get branch."$current".merge)
```

`current` が detached HEAD、`remote_name` / `merge_ref` が空の場合は **push を実行しない**。

```
git remote get-url "$remote_name"
```

URL が `nijuniinc/bokudeli-event-new` を指している場合は **push を実行しない**。

```
remote_branch=${merge_ref#refs/heads/}
git push --force-with-lease "$remote_name" "HEAD:$remote_branch"
```

## 制約

- 適用範囲・分類の詳細は [classification.md](../git-commit-workflow/references/classification.md) を参照
- fixup 向きでない変更は本スキルでコミットしない
- rebase 前に `git status` でワーキングツリーがクリーンであることを確認する
- push には `--force-with-lease` を使う
- main / development ブランチでは実行しない
- A1-fast 合格後はメッセージを変更しない。A1-full / A2 で乖離が判明した吸収先には fixup しない

---

## コミット完了後の提案

fixup と rebase が正常に完了し、working tree が clean になったら:

> コミットが完了しました。`/git-reflect-after-commit` で origin への PR 反映と sandbox デプロイをまとめて実行しますか？

- 未コミット変更が残っている・fixup/rebase 失敗時は提案しない
