---
name: review-comments-evaluate
description: PRのレビューコメント（Copilot・Codex・kokufu等）を読み込み、各コメントについて修正すべきか・修正不要かをフラットに検討し、検討結果をユーザーに伝える。「レビューコメントを読んで」「レビューを検討して」と依頼された時に使用する。
---

# レビューコメント検討

PR でレビュー依頼した Copilot、Codex、kokufu によるレビューを全て読み込み、各コメントについて修正すべきか・修正不要かをフラットに検討し、**検討結果をユーザーに伝える**までを行う。読み込み・検討・結果伝達の一連のタスクを本スキルで完結させる。

## 手順

1. PR のレビューコメントを全て取得する

   **取得対象**
   - トップレベルコメント（PR 本文へのコメント）
   - インラインコメント（コード上のレビューコメント）
   - Copilot・Codex・kokufu・その他のレビュワーを区別せず全て対象とする
     - Copilot: AI レビュワー
     - Codex: AI レビュワー
     - kokufu: エンジニアのレビュワー

   **除外対象**
   - Outdated（修正済み）のインラインコメントは読み込まない。該当コードが push 等で変更されたため、GitHub 上で「Outdated」と表示されるコメントは検討対象から除外する。API レスポンスで `position` が `null` のコメントは Outdated とみなす。

   **取得方法**

   - **PR URL が渡された場合**: 渡された URL を `gh pr view` の引数に渡し、その PR のコメントを取得する
   - **URL が渡されていない場合**: 現在のブランチに対応する PR を対象にする

   **PR URL が渡された場合**

   ```
   # PR 番号を取得（URL で指定した PR）
   gh pr view <URL> --json number -q '.number'

   # インラインコメントを取得（GitHub API）。Outdated を除外する場合は jq で position が null でないものを抽出
   gh api "repos/{owner}/{repo}/pulls/$(gh pr view <URL> --json number -q '.number')/comments" | jq 'map(select(.position != null))'

   # トップレベルコメントを取得
   gh pr view <URL> --comments
   ```

   **URL が渡されていない場合（現在のブランチの PR）**

   ```
   # PR 番号を取得（現在のブランチの PR）
   gh pr view --json number -q '.number'

   # インラインコメントを取得（GitHub API）。Outdated を除外する場合は jq で position が null でないものを抽出
   gh api "repos/{owner}/{repo}/pulls/$(gh pr view --json number -q '.number')/comments" | jq 'map(select(.position != null))'

   # トップレベルコメントを取得
   gh pr view --comments
   ```

   ※ `position` が `null` のコメントは、該当行が修正済みで GitHub 上で「Outdated」と表示される。これらは検討対象から除外する。
   ※ 現在のブランチに PR が紐づいていない場合は、PR 番号または URL の入力を促す
   ※ ユーザーが貼り付けたテキストを読み込む方法も可

2. 各コメントについて以下を検討する
   - 指摘内容の妥当性（プロジェクトの規約・shokujii-code-review に照らして）
   - 修正すべきか、修正不要か
   - 修正不要の場合、その理由（誤解・プロジェクト固有の判断・過剰指摘等）

3. 検討結果をユーザーに伝える
   - 各コメントについて、出力形式に従って結果を出力する
   - ユーザーが判断を把握しやすいよう、5点セットを漏れなく記載する

## 出力形式

表ではなく、各コメントごとに以下の5点を必ず記載する。

**レビュワー**: Copilot / Codex / kokufu 等を明記

**レビュワーのコメント**: 元のコメント本文（長い場合は要約を併記）

**コメント要約**: 指摘内容を簡潔に要約

**判断結果**: 修正推奨 / 修正不要

**判断理由**: プロジェクト規約・妥当性に基づく理由を記述

---

（複数コメントがある場合は、上記5点セットをコメントごとに繰り返す）

## 参照

- [shokujii-code-review.md](../../../documents/コードレビュー/shokujii-code-review.md) を参照してプロジェクト規約に照らす

## 制約

- レビュワー（Copilot/Codex/kokufu 等）に依らず、指摘内容の妥当性のみで判断する
- プロジェクトのコーディング規約に基づいて客観的に評価する
