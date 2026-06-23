---
name: git-squash
description: 変更を過去の適切なコミットに squash + autosquash で統合し、統合後のコミットメッセージを git-commit-message で生成する。分類は git-commit-workflow/references/classification.md に従う。squash 向きでない差分は git-split-commit または git-commit-message へ委譲。「squashして」「スカッシュして」「メッセージも直してまとめて」と依頼された時に使用。吸収先はいま作業中のブランチ上のコミットに限定する。
---

# squash

レビュー修正など、既存コミットに吸収すべき変更を squash コミット経由で統合する。統合後のコミットメッセージは **git-commit-message** で生成する。

## 他スキルとの使い分け

| 依頼の意図                                   | スキル                                        |
| -------------------------------------------- | --------------------------------------------- |
| 自律判断（fixup / squash / 分割 / 新規）     | **git-commit-workflow**                       |
| 過去コミットに足すだけ、メッセージはそのまま | **git-fixup**                                 |
| 過去コミットに足し、統合後のメッセージも直す | **git-squash**（本スキル）                    |
| 新規・分割コミット                           | **git-split-commit** / **git-commit-message** |

## 手順

1. 変更状況とコミット履歴を確認する

```
git status
git log --oneline --name-only
```

2. 各変更ファイルの吸収先コミットを特定する

**禁止**: `origin/development` にすでにマージ済みの過去コミットだけを吸収先にする。吸収先は **いまのブランチに載っているコミット** に絞る。

3. 分類（必須）

[git-commit-workflow/references/classification.md](../git-commit-workflow/references/classification.md) に従い、各未コミット変更を B / C / D / A0 / A1 / A2 に分類する。

**git-commit-workflow から呼ばれた場合**: 手順3は済みとしてスキップし、A2 のみ本スキル手順4以降を実行する。

**本スキル単独で呼ばれた場合の委譲**

- **B** → **git-split-commit**
- **C** → **git-commit-message** → `git commit`
- **D** → 停止してユーザー確認
- **A0** → **git-commit-workflow** の A0 amend 手順
- **A1** → **git-fixup** 手順6以降（メッセージ整合。ユーザーが squash 明示の場合は A2 として本スキルを続行）
- **A2** → 本スキル手順4以降

4. ステージングをいったん全解除する

```
git restore --staged .
```

5. 吸収先ごとに squash コミットを作成する（A2 のみ）

```
git add <対象ファイル...>
git commit --squash <吸収先ハッシュ>
```

同一ファイル内のハンク単位:

```
git add -p <対象ファイル>
git commit --squash <吸収先ハッシュ>
```

6. 統合後のコミットメッセージを生成する（A2 の吸収先のみ）

各吸収先について、[git-commit-message](../git-commit-message/SKILL.md) を **squash 書き換えコンテキスト**で呼ぶ。

**参照する情報**

- 元のメッセージ: `git log -1 --format=%B <吸収先ハッシュ>`
- squash の変更内容: `git show <squashコミット>` または `git diff <吸収先>^..<squashコミット>`

生成したメッセージを一時ファイルに書き出す。

- 吸収先が1つ: `/tmp/squash-msg.txt`
- 吸収先が複数: `/tmp/squash-msgs.txt`（各メッセージの後に `---` の単独行。最古の吸収先から順）

7. rebase 用の GIT_EDITOR を準備する

**吸収先が1つの場合**

```
GIT_EDITOR='sh -c "cp /tmp/squash-msg.txt \"\$1\""'
```

**吸収先が複数の場合**

`/tmp/git-editor-squash.sh` を作成し実行権限を付与する。

```bash
#!/bin/sh
msgfile="/tmp/squash-msgs.txt"
target="$1"
if [ -f "$msgfile" ] && [ -s "$msgfile" ]; then
  awk '/^---$/ {exit} {print}' "$msgfile" > "$target"
  awk '/^---$/ {skip=1; next} skip {print}' "$msgfile" > "${msgfile}.tmp"
  mv "${msgfile}.tmp" "$msgfile"
fi
```

8. ワーキングツリーがクリーンであることを確認し、autosquash で rebase を実行する

複数の吸収先がある場合は最も古いコミットの一つ前を起点にする。

**吸収先が1つの場合**

```
git status
GIT_SEQUENCE_EDITOR=true GIT_EDITOR='sh -c "cp /tmp/squash-msg.txt \"\$1\""' git rebase -i --autosquash <吸収先>~1
```

**吸収先が複数の場合**

```
git status
GIT_SEQUENCE_EDITOR=true GIT_EDITOR=/tmp/git-editor-squash.sh git rebase -i --autosquash <最古の吸収先>~1
```

コンフリクトが発生した場合は `git rebase --abort` で中断する。

9. 結果を確認する

```
git log --oneline
git log -1 --format=%B
git status
```

10. 使用した一時ファイルを削除する

```
rm -f /tmp/squash-msg.txt /tmp/squash-msgs.txt /tmp/git-editor-squash.sh
```

11. リモートへの push

```
current=$(git rev-parse --abbrev-ref HEAD)
remote_name=$(git config --get branch."$current".remote)
merge_ref=$(git config --get branch."$current".merge)
git remote get-url "$remote_name"
remote_branch=${merge_ref#refs/heads/}
git push --force-with-lease "$remote_name" "HEAD:$remote_branch"
```

`current` が detached HEAD、`remote_name` / `merge_ref` が空、URL が `nijuniinc/bokudeli-event-new` の場合は **push を実行しない**。

## 制約

- 適用範囲・分類の詳細は [classification.md](../git-commit-workflow/references/classification.md) を参照
- メッセージフォーマットの正本は **git-commit-message** のみ
- squash 向きでない変更は本スキルでコミットしない
- rebase 前にワーキングツリーがクリーンであることを確認する
- push には `--force-with-lease` を使う
- main / development ブランチでは実行しない
- メッセージを変えずに統合だけしたい場合は **git-fixup** を使用する

---

## コミット完了後の提案

squash と rebase が正常に完了し、working tree が clean になったら:

> コミットが完了しました。`/git-reflect-after-commit` で origin への PR 反映と sandbox デプロイをまとめて実行しますか？

- 未コミット変更が残っている・squash/rebase 失敗時は提案しない
