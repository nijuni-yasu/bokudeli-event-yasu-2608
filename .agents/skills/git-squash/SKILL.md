---
name: git-squash
description: 変更を過去の適切なコミットに squash + autosquash で統合する。統合後のコミットメッセージを AI が生成する。「squashして」「スカッシュして」「メッセージも直してまとめて」と依頼された時に使用する。
---

# squash

レビュー修正など、既存コミットに吸収すべき変更を squash コミット経由で統合する。統合後のコミットメッセージを AI が生成して反映する。

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

4. 吸収先ごとに squash コミットを作成する

流れ: 1) 全解除 → 2) 必要な差分だけステージ（add または add -p）→ 3) commit --squash

**ファイル単位で吸収する場合**

```
git add <対象ファイル...>
git commit --squash <吸収先ハッシュ>
```

**同一ファイル内のハンク単位で吸収する場合**

```
git add -p <対象ファイル>
```

`y`（ステージ）/ `n`（スキップ）/ `s`（ハンク分割）で必要な差分だけを選択し、`git commit --squash <吸収先ハッシュ>` を実行する。残りの差分は次の squash コミット作成時に再度 `git add -p` で選択する。

5. 統合後のコミットメッセージを生成する

各吸収先コミットについて、元のメッセージと squash の変更内容を踏まえて、統合後のコミットメッセージを生成する。git-commit-message スキルのフォーマット・制約に従う（バッククォート・丸括弧・ダブルクォートは使用しない等）。

**参照する情報**
- 元のメッセージ: `git log -1 --format=%B <吸収先ハッシュ>`
- squash の変更内容: `git show <squashコミット>` または `git diff <吸収先>^..<squashコミット>`

**メッセージの書き出し**
- 吸収先が1つの場合: メッセージを `/tmp/squash-msg.txt` に書き出す（複数行の場合は cat やヒアドキュメントを使用）
- 吸収先が複数の場合: 各メッセージを順番に `/tmp/squash-msgs.txt` に書き出す。各メッセージの後に `---` の単独行を入れる。最後のメッセージの後には不要。

```
# 1つの場合
cat > /tmp/squash-msg.txt << 'EOF'
[common] #1800 スキーマ変更の説明

本文...
EOF

# 複数の場合（最古の吸収先から順）
cat > /tmp/squash-msgs.txt << 'EOF'
[common] #1800 スキーマ変更の説明

本文...
---
[user] #1800 機能追加の説明

本文...
EOF
```

6. rebase 用の GIT_EDITOR を準備する

**吸収先が1つの場合**

```
GIT_EDITOR='sh -c "cp /tmp/squash-msg.txt \"\$1\""'
```

**吸収先が複数の場合**

以下のスクリプトを `/tmp/git-editor-squash.sh` に作成し、実行権限を付与してから使用する。

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

```
chmod +x /tmp/git-editor-squash.sh
GIT_EDITOR=/tmp/git-editor-squash.sh
```

7. ワーキングツリーがクリーンであることを確認し、autosquash で rebase を実行する

`git status` で Your branch is ahead of と表示されている場合はそのまま進める。have diverged と表示されている場合は、ユーザーが force push を実行する必要がある。

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

コンフリクトが発生した場合は `git rebase --abort` で中断し、手動解決が必要な旨を報告する。

8. 結果を確認する

```
git log --oneline
git log -1 --format=%B
git status
```

squash コミットが消えて元のコミット数に戻り、`git log` で各コミットのメッセージが意図どおり更新されていることを確認する。

9. 使用した一時ファイルを削除する

```
rm -f /tmp/squash-msg.txt /tmp/squash-msgs.txt /tmp/git-editor-squash.sh
```

10. `git push --force-with-lease` を実行する

rebase により履歴が書き換わっているため、リモートに反映する。

```
git push --force-with-lease
```

失敗した場合（他者の push でリモートが更新されている等）は、手動対応が必要な旨を報告する。

## 制約

- rebase 前に `git status` でワーキングツリーがクリーンであることを確認する
- push には `--force-with-lease` を使い、他者の push を上書きしないようにする
- main / development ブランチでは実行しない
- コミットメッセージを変更しない場合は git-fixup スキルを使用する
