---
name: git-create-issue
description: GitHub イシューを作成する。作成時に必ず projects を shokujii-all-task に追加し、Project の Status を Todo に設定する。milestone は前回リリースタグの次のマイナーバージョン（例 v2.9.0 → v2.10）に紐づける。「イシューを作って」「issue を作成して」「これを issue にして」「タスクとして起票して」と依頼された時に使用する。単に gh issue create を素で叩かず、必ず本スキルの projects / Status / milestone 付与手順に従うこと。
---

# GitHub イシュー作成

Shokujii プロジェクトのイシューを、projects・Status・milestone を正しく紐づけて作成する。

## 前提

- gh CLI がインストール済みであること
- リポジトリは `nijuniinc/bokudeli-event-new`
- projects 操作には gh トークンに **project** と **read:project** スコープが必要
  - 不足時は対話的に付与: `gh auth refresh -h github.com -s project,read:project`
- `jq` がインストール済みであること（Project の Status 設定で使用）
- イシュー本文・コメントは日本語で記述する

## 固定値

| 項目 | 値 |
|:-----|:---|
| project owner | `nijuniinc` |
| project タイトル | `shokujii-all-task`（必ず付与する） |
| project Status | `Todo`（新規イシューの初期ステータス） |
| リポジトリ | `nijuniinc/bokudeli-event-new` |

## 手順

1. **イシューのタイトル・本文を用意する**
   - 会話の文脈や対応中の作業から AI が下書きする
   - タイトルは [/git-commit-message](../git-commit-message/SKILL.md) のタグ運用に揃える（例: `[functions] stripeWebhook の 504 対策`）
     - 使用可能なタグ: `[user]` `[partner]` `[base]` `[common]` `[functions]` `[doc]` `[ai]`
     - `firestore.rules` のみ等、アプリパッケージを変更しない場合はタグ省略可（commit-message スキル参照）
     - イシュー番号はまだ存在しないため、タイトルに `#番号` は含めない
   - 本文は [イシュー本文テンプレート](#イシュー本文テンプレート) に沿って記述する
   - ラベルが明らかな場合は `--label` を検討する（例: `bug`）

2. **前回リリースバージョンからマイルストーン名を決定する**

   タグだけに頼らず、**タグと `origin/production` の両方**を参照し、より新しい minor を基準に +1 する（hotfix タグのみが最新のときやタグ未 fetch 時のずれを防ぐ）。

   ```bash
   git fetch --tags origin 2>/dev/null || true
   git fetch origin production 2>/dev/null || true

   # 最新リリースタグ（例: v2.9.0）
   git tag -l 'v*' --sort=-version:refname | head -1

   # production 先頭のバージョンコミット（例: 2.9.0）
   git log origin/production -1 --format='%s' 2>/dev/null
   ```

   - タグから major.minor を取り出す: `v2.9.0` → `2.9`（パッチは無視）
   - production コミットメッセージが `X.Y.Z` 形式なら同様に major.minor を取り出す
   - **タグと production のうち、より新しい minor を採用**する
   - 採用した minor を +1 し、接頭辞 `v` を付ける → マイルストーン名（例: `2.9` → **`v2.10`**）
   - 既存マイルストーンは `v2.X` 形式（パッチ番号なし）

   例:

   | 最新タグ | production 先頭 | 採用 minor | マイルストーン |
   |:---------|:------------------|:-----------|:---------------|
   | `v2.9.0` | `2.9.0` | `2.9` | `v2.10` |
   | `v2.8.1` | `2.9.0` | `2.9`（production が新しい） | `v2.10` |
   | `v2.8.1` | （取得不可） | `2.8` | `v2.9` |

3. **マイルストーンの存在を確認する**（**open** のみ対象）

   ```bash
   gh api repos/nijuniinc/bokudeli-event-new/milestones \
     --jq '.[] | select(.title=="v2.10" and .state=="open") | .number'
   ```

   - open で存在する → そのまま使う
   - 存在しない → 作成する

   ```bash
   gh api -X POST repos/nijuniinc/bokudeli-event-new/milestones \
     -f title="v2.10"
   ```

4. **gh の project スコープを確認する**

   ```bash
   gh auth status
   ```

   - `read:project` / `project` が不足していれば `gh auth refresh -h github.com -s project,read:project` を案内する
   - 非対話環境ではユーザーがターミナルで実行する必要がある

5. **ユーザーにタイトル・本文・マイルストーンを提示し、確認を取る**

6. **イシューを作成する**（milestone のみ。project は手順 7 で付与）

   `gh issue create --project` だけでは **Status を Todo に設定できない**ため、イシュー作成と project 追加は分ける。

   本文が短い場合:

   ```bash
   gh issue create \
     --repo nijuniinc/bokudeli-event-new \
     --title "タイトル" \
     --body "本文" \
     --milestone "v2.10"
   ```

   本文が長い場合は HEREDOC を使う（zsh では `'EOF'` で囲む）:

   ```bash
   gh issue create \
     --repo nijuniinc/bokudeli-event-new \
     --title "タイトル" \
     --body "$(cat <<'EOF'
   ## 概要

   ## 発生事象 / 背景

   ## 原因

   ## 対応方針

   ## 完了条件
   EOF
   )" \
     --milestone "v2.10"
   ```

   コマンド出力の URL（例: `https://github.com/nijuniinc/bokudeli-event-new/issues/2076`）を `ISSUE_URL` として控える。

7. **project に追加し、Status を Todo に設定する**

   ```bash
   PROJECT_OWNER=nijuniinc
   PROJECT_TITLE=shokujii-all-task
   STATUS_NAME=Todo
   ISSUE_URL='https://github.com/nijuniinc/bokudeli-event-new/issues/XXXX'

   PROJECT_NUMBER=$(gh project list --owner "$PROJECT_OWNER" --format json \
     --jq ".projects[] | select(.title==\"$PROJECT_TITLE\") | .number")

   if [ -z "$PROJECT_NUMBER" ]; then
     echo "project not found: $PROJECT_TITLE"
     exit 1
   fi

   # item-add の JSON 出力から item ID を直接取得する（推奨）
   # item-list で URL 検索すると件数が多い project では見つからないことがある
   ITEM_ID=$(gh project item-add "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --url "$ISSUE_URL" \
     --format json --jq .id)

   PROJECT_ID=$(gh project view "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json --jq .id)

   STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
     --jq '.fields[] | select(.name=="Status") | .id')

   TODO_OPTION_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$PROJECT_OWNER" --format json \
     --jq ".fields[] | select(.name==\"Status\") | .options[] | select(.name==\"$STATUS_NAME\") | .id")

   gh project item-edit \
     --id "$ITEM_ID" \
     --project-id "$PROJECT_ID" \
     --field-id "$STATUS_FIELD_ID" \
     --single-select-option-id "$TODO_OPTION_ID"
   ```

   - `STATUS_NAME` は Project 上の選択肢名と**完全一致**させる（既定は `Todo`。`todo` とは別扱い）
   - `item-add --format json --jq .id` で item ID を取得する。`item-list` による URL 検索は project 件数が多いと失敗しやすいため使わない

8. **作成された URL と付与した project・Status・milestone を報告する**

---

## イシュー本文テンプレート

以下のセクション構成で記述する。不要なセクションは省略してよい。

```markdown
## 概要

1〜2文で何のイシューか。

## 発生事象 / 背景

- いつ・どこで・何が起きたか
- ログ・trace・イベント ID 等があれば記載

## 原因

分かっている範囲で記載。未確定なら「調査中」と明記。

## 対応方針

- 段階1（止血）: ...
- 段階2（恒久）: ...（別イシュー化を検討、等）

## 完了条件

- [ ] チェックリスト形式で受け入れ基準を列挙
```

---

## 制約

- project は必ず `shokujii-all-task`（owner: `nijuniinc`）に追加する（省略しない）
- project の Status は必ず `Todo` に設定する
- milestone は必ず手順 2 で計算した値（前回リリースの次マイナー）を使う
- `gh issue create` を実行する前にタイトル・本文・milestone をユーザーに提示し、確認を取る

## よくある誤り

**NG**: `gh issue create --project` だけで完了とみなす  
**OK**: 手順 7 で `item-add` 後に `item-edit` で Status を `Todo` に設定する

**NG**: `gh issue create` を projects / milestone なしで実行する  
**OK**: milestone は手順 6、project と Status は手順 7 で付与する

**NG**: milestone をパッチ込み（`v2.9.0`）や前回そのまま（`v2.9`）にする  
**OK**: 前回リリースの minor を +1 した `v2.10` にする

**NG**: タグのみ参照し、hotfix タグ `v2.8.1` が最新のときに `v2.9` を付ける（本番は `v2.9.0` 済みの可能性）  
**OK**: `origin/production` も参照し、より新しい minor を基準に +1 する

**NG**: closed のマイルストーンに紐づけようとする  
**OK**: 手順 3 で `state=="open"` のみを対象にする

**NG**: Status を `todo`（小文字）で指定する  
**OK**: Project の選択肢名 `Todo` と完全一致させる（`field-list` で確認）

**NG**: `item-list` で URL 検索して item ID を取得する  
**OK**: `gh project item-add --format json --jq .id` で item ID を直接取得する（件数の多い project でも確実）

**NG**: project スコープ不足のまま実行して失敗する  
**OK**: 事前に `gh auth status` を確認し、不足時は `gh auth refresh -h github.com -s project,read:project` を案内する

## 出力例

```
Issue #2076 を作成しました。
https://github.com/nijuniinc/bokudeli-event-new/issues/2076

- project: shokujii-all-task（owner: nijuniinc）
- Status: Todo
- milestone: v2.10（前回リリース v2.9.0 の次）
```
