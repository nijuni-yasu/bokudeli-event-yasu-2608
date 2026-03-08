---
name: fixup-squash
description: 変更を過去の適切なコミットに fixup + autosquash で統合する。「fixupして」「過去のコミットにまとめて」「squashして」と依頼された時に使用する。
---

# fixup + autosquash

レビュー修正など、既存コミットに吸収すべき変更を fixup コミット経由で統合する。

## 手順

1. 変更状況とコミット履歴を確認する

```
git status
git log --oneline --name-only
```

2. 各変更ファイルの吸収先コミットを特定する

変更ファイルごとに、その変更を論理的に含むべきコミットを吸収先とする。
`git log --oneline --name-only` の出力から、各ファイルが含まれるコミットを確認する。

3. ステージングを解除する（既にステージング済みの場合）

```
git restore --staged .
```

4. 吸収先ごとにファイルをまとめて fixup コミットを作成する

```
git add <対象ファイル...>
git commit --fixup <吸収先ハッシュ>
```

`--fixup` はコミットメッセージを自動生成する（例: `fixup! 元のコミットメッセージ`）。

#### 同一ファイル内を分けて吸収したい場合

`git add -p` でハンク単位にステージングする：

```
git add -p <対象ファイル>
```

`y`（ステージ）/ `n`（スキップ）/ `s`（ハンク分割）で必要な差分だけを選択し、`git commit --fixup <吸収先ハッシュ>` を実行する。残りの差分は次の fixup コミット作成時に再度 `git add -p` で選択する。

5. ワーキングツリーがクリーンであることを確認し、autosquash で rebase を実行する

`git status` で `Your branch is ahead of` と表示されている場合はそのまま進める。`have diverged` と表示されている場合は force push が必要になる（手順7参照）。

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

7. リモートに push 済みの場合は force push する

```
git push --force-with-lease
```

## 制約

- rebase 前に `git status` でワーキングツリーがクリーンであることを確認する
- `--force-with-lease` を使い、他者の push を上書きしないようにする
- main / development ブランチでは実行しない
