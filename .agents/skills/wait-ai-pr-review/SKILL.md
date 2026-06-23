---
name: wait-ai-pr-review
description: git-create-pull-request 手順 11 のレビュー依頼後、Copilot/Codex の応答完了（またはタイムアウト）をバックグラウンド監視し、完了時に review-comments-evaluate を自動起動する。create-pr 手順 12 から委譲される。Codex usage limits 時は partial evaluate。「評価待ちなし」「evaluate しない」「review wait しない」でスキップ。
---

# AI PR レビュー完了待ち → evaluate 自動起動

`git-create-pull-request` 手順 11 でレビュー依頼したあと、GitHub 上の Copilot / Codex 応答が落ち着くまで **非ブロッキング**で監視し、完了またはタイムアウト時に [`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) へ委譲する。

**入口は `git-create-pull-request` 手順 12 のみ**。`git-reflect-after-commit` は create-pr 経由で間接的に ON（二重起動しない）。

## 前提

- `gh` CLI が認証済み
- 呼び出し元から **PR 番号**と **`REVIEW_REQUEST_SINCE`**（ISO8601 UTC）を受け取る
- 対象リポジトリはデフォルト `nijuniinc/bokudeli-event-new`（手順 11 と同じ origin PR）

## オプトアウト（会話のみ）

次のいずれかが会話にあれば **手順 1 で即スキップ**（watcher 起動しない）:

- 「評価待ちなし」
- 「evaluate しない」
- 「review wait しない」

## 完了判定パラメータ（実測 16 PR ベース）

| パラメータ | 値 |
|-----------|-----|
| `MIN_WAIT_SEC` | 180（3 分） |
| `POLL_SEC` | 60 |
| `QUIET_SEC` | 120（2 分） |
| `CODEX_GIVEUP_SEC` | 720（12 分） |
| `TIMEOUT_SEC` | 1200（20 分） |

```
完了 =
  elapsed >= MIN_WAIT
  AND Copilot substantive あり（SINCE 以降）
  AND (
    Codex substantive あり
    OR Codex が limit/connect のみ & elapsed >= CODEX_GIVEUP
    OR Codex イベントなし & elapsed >= CODEX_GIVEUP
  )
  AND 直近 QUIET_SEC 間に AI レビュワーから新規イベントなし
```

**非 substantive（完了に数えない）** — [`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) と整合:

- `usage limits for code reviews`
- `Copilot encountered an error and was unable to review`
- `create a Codex account and connect` / `To use Codex here`
- `@copilot @codex review` で始まる依頼コメント

**レビュワー login**: `copilot` / `codex` / `chatgpt-codex` を部分一致（`Copilot` issue コメントも Copilot 扱い）。

## 手順

### 0. 入力確認

- `PR_NUM`: PR 番号（整数）
- `REVIEW_REQUEST_SINCE`: 手順 11 直前に記録した ISO8601 UTC

### 1. オプトアウト確認

会話にオプトアウト文言があれば **中断**し、スキップした旨を報告する。

### 2. 既存 watcher の停止

[`.agents/state/pr-review-watch.json`](../../state/pr-review-watch.json) を参照し、**同一 PR** の実行中 watcher PID があれば停止する（再依頼・force push 対応）。  
`wait-ai-pr-review-watch.sh` 起動時にも内部で実施されるが、スキル側でも重複起動に注意する。

### 3. バックグラウンド監視起動

```bash
.agents/scripts/wait-ai-pr-review-watch.sh \
  --pr "$PR_NUM" \
  --since "$REVIEW_REQUEST_SINCE"
```

- **`block_until_ms: 0`** でバックグラウンド実行（同ターンで 20 分ブロックしない）
- `notify_on_output` の正規表現: `^AGENT_LOOP_WAKE_pr_review`

### 4. 即時報告

ユーザーへ次を伝える（evaluate 結果はまだない）:

- PR 番号・`REVIEW_REQUEST_SINCE`
- 監視開始（typical 5〜8 分 / 最大 20 分）
- Codex limits 時は **partial evaluate** があり得る旨

### 5. sentinel 受信時 → evaluate 委譲

stdout の sentinel 例:

```
AGENT_LOOP_WAKE_pr_review {"prompt":"/review-comments-evaluate","pr":2099,"partial":false}
```

- JSON の `prompt` に従い [`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) を実行
- `partial: true` のときは報告に「Codex 未レビューまたは limits/connect のみ」を明記

### 6. セッション跨ぎ

watcher はバックグラウンドで動作する。エージェントセッションが切れた場合、完全自動復旧は保証しない。  
次回セッション開始時に `.agents/state/pr-review-watch.json` に `status: running` が残っていれば、ユーザーへ未完了 watcher の有無を伝え、必要なら手動で `/review-comments-evaluate` を案内する。

## スクリプト

| ファイル | 役割 |
|---------|------|
| [`.agents/scripts/wait-ai-pr-review-check.sh`](../../scripts/wait-ai-pr-review-check.sh) | 1 回分の完了判定（exit 0/1/2/3 + JSON stdout） |
| [`.agents/scripts/wait-ai-pr-review-watch.sh`](../../scripts/wait-ai-pr-review-watch.sh) | ポーリングループ + sentinel 出力 + PID 管理 |
| [`.agents/scripts/wait_ai_pr_review_state.py`](../../scripts/wait_ai_pr_review_state.py) | watcher PID の register/stop/unregister |

開発用テスト:

```bash
python3 .agents/hooks/test-wait-ai-pr-review-check.py
python3 .agents/hooks/test-wait-ai-pr-review-state.py
bash -n .agents/scripts/wait-ai-pr-review-watch.sh
```

## 注意

- evaluate 本体は **sentinel 受信時のみ**実行（手順 3 では起動しない）
- タイムアウト時も partial で evaluate を起動する（watch スクリプトが sentinel を出す）
- 委譲先（`review-comments-evaluate`）のルールを上書きしない
