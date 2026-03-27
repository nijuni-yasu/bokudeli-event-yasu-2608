---
name: review-comments-reply
description: PRのレビューコメント（Copilot・Codex・kokufu等）に対して、実装内容を返信する。レビュー修正後に使用する。「レビューコメントに返信して」「実装内容をコメントして」と依頼された時に使用する。
---

# レビューコメント返信

PR のレビューコメントに対して、実装内容（対応済み・対応内容・意図的な不採用等）を返信する。レビュー修正を push した後に利用する想定。

## 手順

1. PR のインラインコメントを取得する

   **取得対象**
   - インラインコメント（コード上のレビューコメント）のみ。トップレベルコメントは対象外。
   - `position != null` のコメントのみ（Outdated を除外）

   **取得方法**

   - **PR URL が渡された場合**

     ```
     PR_NUM=$(gh pr view <URL> --json number -q '.number')
     gh api repos/:owner/:repo/pulls/$PR_NUM/comments --jq 'map(select(.position != null))'
     ```

   - **URL が渡されていない場合（現在のブランチの PR）**

     ```
     PR_NUM=$(gh pr view --json number -q '.number')
     gh api repos/:owner/:repo/pulls/$PR_NUM/comments --jq 'map(select(.position != null))'
     ```

   ※ 現在のブランチに PR が紐づいていない場合は、PR 番号または URL の入力を促す

2. 各コメントに対する返信文を生成する

   現在のコード（`git diff` や該当ファイルの内容）とレビュー指摘を照らし合わせ、以下を判断して返信文を生成する。

   - **対応済み**: 指摘通りに修正した場合 → 「対応済みです。〇〇に変更しました。」等
   - **仕様・意図で不採用**: 仕様書修正や意図的な判断で指摘と異なる場合 → 理由を簡潔に説明
   - **その他**: 実装の意図や補足を伝える

   返信文は日本語で、簡潔に（1〜3文程度）記述する。

3. 各コメントに返信を投稿する

   GitHub API で返信を投稿する。

   **パス（必須）**: `repos/<OWNER>/<REPO>/pulls/<PR番号>/comments/<COMMENT_ID>/replies`

   - `COMMENT_ID` は手順 1 で取得した各コメントの `id` フィールド。
   - **PR 番号をパスに含めること**。`repos/<OWNER>/<REPO>/pulls/comments/<COMMENT_ID>/replies` のように PR 番号を省略すると、`gh api` では `404 Not Found` になることがある（公式 REST のパス表記と異なる挙動のため、実装は必ず PR 番号入りを使う）。

   例（`OWNER/REPO` は対象リポジトリ、`PR_NUM` と `COMMENT_ID` は変数または具体値）:

   ```
   gh api --method POST "repos/OWNER/REPO/pulls/${PR_NUM}/comments/${COMMENT_ID}/replies" -f body="返信本文"
   ```

   `gh` のカレントリポジトリが対象と一致する場合は、`OWNER/REPO` を `$(gh repo view --json nameWithOwner -q .nameWithOwner)` 等で埋めてもよい。

   ※ トップレベルコメントへの返信はサポートされていない（インラインコメントのみ）

4. 結果を報告する

   返信したコメント数と、返信できなかったコメント（あれば）を報告する。

## 制約

- インラインコメントのみ対象。トップレベルコメントには返信しない
- 返信は GitHub に直接書き込むため、実行前にユーザーの意図を確認済みであること
- 返信対象はトップレベルのインラインコメントのみ（返信への返信は API でサポートされていない）
- ネットワークアクセスが必要（`gh api`）

## 参照

- [review-comments-evaluate](../review-comments-evaluate/SKILL.md) — コメント取得方法は同様
- [GitHub API: Create a reply for a review comment](https://docs.github.com/en/rest/pulls/comments#create-a-reply-for-a-review-comment)（ドキュメント上のパスに PR 番号が無い場合があるが、`gh api` では本スキル記載の PR 番号入りパスを使うこと）
