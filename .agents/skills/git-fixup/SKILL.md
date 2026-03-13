---
name: git-fixup
description: 変更を過去の適切なコミットに fixup + autosquash で統合する。コミットメッセージはそのまま。「fixupして」「フィックスアップして」「過去のコミットにまとめて」と依頼された時に使用する。
---

# fixup

レビュー修正など、既存コミットに吸収すべき変更を fixup コミット経由で統合する。コミットメッセージは変更しない。

## 手順

1. 変更状況とコミット履歴を確認する

```
git status
git log --oneline --name-only
```

2. 各変更ファイルの吸収先コミットを特定する

変更ファイルごとに、その変更を論理的に含むべきコミットを吸収先とする。
`git log --oneline --name-only` の出力から、各ファイルが含まれるコミットを確認する。

3. ステージングをいったん全解除する

```
git restore --staged .
```

吸収先ごとに必要な差分だけを選んでステージするため、クリーンな状態から始める。

4. 吸収先ごとに fixup コミットを作成する

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

5. ワーキングツリーがクリーンであることを確認し、autosquash で rebase を実行する

`git status` で `Your branch is ahead of` と表示されている場合はそのまま進める。`have diverged` と表示されている場合は、ユーザーが force push を実行する必要がある。

複数の吸収先がある場合は最も古いコミットの一つ前を起点にする（例: `abc1234` と `def5678` へ fixup する場合、古い方の `abc1234~1` を指定）。

```
git status
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <最古の吸収先>~1
```

`GIT_SEQUENCE_EDITOR=true` でエディタを開かずに自動実行する。
コンフリクトが発生した場合は `git rebase --abort` で中断し、手動解決が必要な旨を報告する。

6. 結果を確認する

```
git log --oneline
git status
```

fixup コミットが消えて元のコミット数に戻っていることを確認する。

7. `git push --force-with-lease` を実行する

rebase により履歴が書き換わっているため、リモートに反映する。

```
git push --force-with-lease
```

失敗した場合（他者の push でリモートが更新されている等）は、手動対応が必要な旨を報告する。

## 制約

- rebase 前に `git status` でワーキングツリーがクリーンであることを確認する
- push には `--force-with-lease` を使い、他者の push を上書きしないようにする
- main / development ブランチでは実行しない
- コミットメッセージも修正したい場合は git-squash スキルを使用する
