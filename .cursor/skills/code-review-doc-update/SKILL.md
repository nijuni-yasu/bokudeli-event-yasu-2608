---
name: code-review-doc-update
description: 現在のブランチ・PRの変更に基づき、shokujii-code-review を更新すべきか検討し、必要に応じて shokujii-code-review.md を更新する。PRマージ前に使用する。「レビュードキュメントを更新して」「shokujii-code-reviewをアップデートして」と依頼された時に使用する。
---

# コードレビュードキュメント更新

今回のブランチや PR で、shokujii-code-review をアップデートすべき内容がないか検討し、必要に応じてドキュメントを更新する。PR をマージする前に利用する想定。

## 手順

1. ブランチの変更差分を取得する

```
git diff development...HEAD --stat
git diff development...HEAD
git log development...HEAD --oneline
```

デフォルトブランチは development。リモートが基準の場合は `origin/development` に置き換える。

2. 更新要否を検討する
   - 新規パターン・よくある間違いが含まれていないか
   - 既存チェックリストでカバーできていない指摘はないか
   - 新機能・新規責務に応じたルール追加の要否
   - [shokujii-code-review.md](../../../documents/コードレビュー/shokujii-code-review.md) を参照

3. 更新が必要な場合
   - documents/コードレビュー/shokujii-code-review.md に追記・修正する
   - .cursor/skills/shokujii-code-review/SKILL.md のチェックリストも同期する（必要に応じて）
   - 変更内容を簡潔に報告する

4. 更新が不要な場合
   - その旨と理由を報告する

## 更新対象

- documents/コードレビュー/shokujii-code-review.md
- .cursor/skills/shokujii-code-review/SKILL.md（チェックリストが食い違う場合）

## 制約

- 既存ルールの意図を変えない
- 重複や矛盾を避ける
