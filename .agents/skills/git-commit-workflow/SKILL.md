---
name: git-commit-workflow
description: 未コミット変更を分析し fixup / squash / 分割 / 新規 / amend を自律判断して実行する。メッセージは git-commit-message に委譲。「コミット整理して」「変更を適切なコミットに反映して」「レビュー修正をコミットに反映して」と依頼された時に使用。吸収先はいま作業中のブランチ上のコミットに限定する。
---

# git-commit-workflow

未コミット変更に対し、fixup / squash / 分割 / 新規1件 / amend を自律的に選び実行するオーケストレーター。判断ロジックの正本は [classification.md](references/classification.md)。rebase 等の実行手順は leaf スキルに委譲する。

## 他スキルとの関係

| ユーザー依頼                        | 使うスキル                                        |
| ----------------------------------- | ------------------------------------------------- |
| コミット整理 / レビュー修正反映     | **git-commit-workflow**（本スキル）               |
| fixup のみ / squash のみ / 分割のみ | 各 leaf スキル（分類は classification.md を参照） |
| メッセージのみ                      | **git-commit-message**                            |

| leaf スキル                                                      | 役割                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| [git-split-commit](../git-split-commit/SKILL.md)                 | B: 分割案と実行                                                |
| [git-commit-message](../git-commit-message/SKILL.md)             | メッセージ生成（C / A2 / A0 / 分割各コミット。Issue 解決含む） |
| [git-fixup](../git-fixup/SKILL.md)                               | A1: fixup + autosquash                                         |
| [git-squash](../git-squash/SKILL.md)                             | A2: squash + autosquash                                        |
| [git-reflect-after-commit](../git-reflect-after-commit/SKILL.md) | 完了後の PR / sandbox 反映                                     |

## 手順

1. [classification.md](references/classification.md) を読む

2. 分類を実行する
   - 事前コマンドを実行する
   - 各未コミット変更を B / C / D / A0 / A1 / A2 に分類する
   - A 系は **メッセージ整合性チェックを必須** とする（classification.md 参照。A1 は Issue coherence 含む）

3. 分類・メッセージ整合性・イシュー解決・実行計画をユーザーに提示する（classification.md の出力フォーマット）

4. **D がある場合は停止**し、ユーザー確認を待つ

5. 実行計画どおりに leaf スキルを **読んで従う**（本スキル内に rebase 手順を複製しない）

   **順序**: B → C → A0 / A1 / A2

   | 分類 | 実行                                                                                                                                     |
   | ---- | ---------------------------------------------------------------------------------------------------------------------------------------- |
   | B    | [git-split-commit](../git-split-commit/SKILL.md) 手順1〜4で分割案提示 → ユーザー承認後コミット実行（各コミットで issue-resolution full） |
   | C    | 対象を stage → [git-commit-message](../git-commit-message/SKILL.md)（issue-resolution full）→ `git commit`                               |
   | A0   | 下記「A0 amend」                                                                                                                         |
   | A1   | [git-fixup](../git-fixup/SKILL.md) **手順5以降**（Issue coherence 済み。手順3は本スキルで済みとしてスキップ可）                          |
   | A2   | [git-squash](../git-squash/SKILL.md) **手順4以降**（issue-resolution full 含む。手順3は本スキルで済みとしてスキップ可）                  |

6. working tree が clean になったら [git-reflect-after-commit](../git-reflect-after-commit/SKILL.md) を提案する（勝手に実行しない）

## A0 amend（HEAD 向け）

吸収先が **HEAD** のときのみ。非 HEAD では amend 不可（A1 fixup または A2 squash を使う）。

1. `git restore --staged .` でいったん全解除する
2. 対象差分を stage する
3. メッセージ整合性を確認する
   - 整合: `git commit --amend --no-edit`
   - 乖離: [git-commit-message](../git-commit-message/SKILL.md) を **amend + full** コンテキストで呼び（issue-resolution 含む）、`git commit --amend -F` または `-m` で反映
4. `git log -1 --oneline` で確認する

## 制約

- main / development ブランチでは実行しない
- 分類の正本は classification.md。本スキルに分類表を重複記述しない
- メッセージフォーマット・イシュー解決の正本は git-commit-message / issue-resolution のみ
- B/C を無理に fixup/squash しない
- A2 squash は計画提示後 **自動実行**（D のみユーザー確認）

---

## コミット完了後の提案

すべての実行が正常に完了し、working tree が clean になったら:

> コミットが完了しました。`/git-reflect-after-commit` で origin への PR 反映と sandbox デプロイをまとめて実行しますか？

- 未コミット変更が残っている・途中失敗時は提案しない
