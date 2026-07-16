---
name: wait-ai-pr-review
description: git-create-pull-request 手順 11〜12 のレビュー依頼後、Copilot/Codex の応答完了（またはタイムアウト）をバックグラウンド監視し、完了時に review-comments-evaluate を自動起動する。create-pr 手順 13 から委譲される。Codex usage limits 時は partial evaluate。「評価待ちなし」「evaluate しない」「review wait しない」でスキップ。
---

# AI PR レビュー完了待ち → evaluate 自動起動

`git-create-pull-request` 手順 11（reviewer 追加）・手順 12（Codex 向けコメント）でレビュー依頼したあと、GitHub 上の Copilot / Codex 応答が落ち着くまで **非ブロッキング**で監視し、完了またはタイムアウト時に [`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) へ委譲する。

**入口は `git-create-pull-request` 手順 13 のみ**。`git-reflect-after-commit` は create-pr 経由で間接的に ON（二重起動しない）。

## 前提

- `gh` CLI が認証済み
- 呼び出し元から **PR 番号**と **`REVIEW_REQUEST_SINCE`**（ISO8601 UTC）を受け取る
- 対象リポジトリはデフォルト `nijuniinc/bokudeli-event-new`（手順 11〜12 と同じ origin PR）

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
| `CODEX_TERMINAL_QUIET_SEC` | 300（5 分） |
| `CODEX_GIVEUP_SEC` | 720（12 分） |
| `TIMEOUT_SEC` | 1200（20 分） |

```
完了 =
  elapsed >= MIN_WAIT
  AND Copilot reviewed あり（substantive または no_issues、SINCE 以降）
  AND (
    Codex reviewed あり（substantive または no_issues）
    OR Codex が limit/connect を返却済み & quiet 満了 & Codex terminal 後 300s 経過
    OR Codex イベントなし & elapsed >= CODEX_GIVEUP
  )
  AND 直近 QUIET_SEC 間に AI レビュワーから新規イベントなし
```

**reviewed（レビュー完了）** — substantive に加え、次も完了として数える（[`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) では RC スキップ対象のまま）:

- `Didn't find any major issues` を含む短い Codex/Copilot サマリ（`no_issues` カテゴリ）

**非 substantive（完了に数えない）** — evaluate のスキップ対象と整合:

- `usage limits for code reviews`
- `Copilot encountered an error and was unable to review`
- `create a Codex account and connect` / `To use Codex here`
- `@copilot @codex review` で始まる依頼コメント（旧手順 12・後方互換）
- `@codex この PR の Files changed をコードレビュー` で始まる依頼コメント（手順 12）
- `@copilot この PR の Files changed をコードレビュー` で始まる依頼コメント（手順 12・2 行固定文の 2 行目）
- Copilot の承知返信（書き方確認・次回厳守のみでコード未言及、`acknowledgment` カテゴリ）

**レビュワー login**: `copilot` / `codex` / `chatgpt-codex` を部分一致（`Copilot` issue コメントも Copilot 扱い）。

## 手順

### 0. 入力確認

- `PR_NUM`: PR 番号（整数）
- `REVIEW_REQUEST_SINCE`: 手順 11 直前（レビュー依頼開始時点）に記録した ISO8601 UTC

### 1. オプトアウト確認

会話にオプトアウト文言があれば **中断**し、スキップした旨を報告する。

### 2. 既存 watcher の停止

[`.agents/state/pr-review-watch.json`](../../state/pr-review-watch.json) を参照し、**同一 PR** の実行中 watcher PID があれば停止する（再依頼・force push 対応）。
`wait-ai-pr-review-watch.sh` 起動時にも内部で実施されるが、スキル側でも重複起動に注意する。停止前に PID が watcher プロセスであることを cmdline で検証する。

### 3. バックグラウンド監視起動（Shell 要件・厳守）

エージェントが Shell ツールで watcher を起動するとき、次を**すべて**満たす:

| パラメータ | 値 |
|-----------|-----|
| `block_until_ms` | `0` |
| `notify_on_output.pattern` | `^AGENT_LOOP_WAKE_pr_review` |
| `notify_on_output.reason` | `pr review wake` |

```bash
.agents/scripts/wait-ai-pr-review-watch.sh \
  --pr "$PR_NUM" \
  --since "$REVIEW_REQUEST_SINCE"
```

- **`notify_on_output` を付けない起動は未完成**とみなし、手順 3 完了と報告してはならない
- 同一ターンで sandbox デプロイ等を続ける場合も、watcher 起動時の Shell 呼び出しに上記を必ず付ける

### 4. 即時報告

ユーザーへ次を伝える（evaluate 結果はまだない）:

- PR 番号・`REVIEW_REQUEST_SINCE`
- **Copilot 実質レビュー typical**: 依頼後 4〜5 分
- **evaluate 自動起動の目安**（Copilot 完了 ≠ 即 evaluate）:
  - Codex substantive あり: Copilot 完了後 **quiet 2 分**
  - Codex limits/connect のみ: Copilot 完了後 **quiet 2 分** かつ **terminal 後 5 分**
  - Codex 無応答: 依頼から **最大 12 分**
- **全体タイムアウト**: 20 分
- Codex limits 時は **partial evaluate** があり得る旨
- evaluate 自動起動時は **`documents/レビューコメント/review-<slug>.md` 追記まで**行う（チャット要約のみでは完了しない）。slug は [review-doc-path.md](../review-comments-evaluate/references/review-doc-path.md) に従う

### 5. sentinel 受信時 → evaluate 委譲（auto 完走）

stdout の sentinel 例:

```
AGENT_LOOP_WAKE_pr_review {"prompt":"/review-comments-evaluate","pr":2099,"partial":false}
```

- [`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) を **auto モード**で実行する
- **手順 4（`review-<slug>.md` 追記）まで完走**すること。チャット要約のみで終了しない
- 委譲引数:
  - `PR_NUM`: sentinel JSON の `pr`
  - `REVIEW_REQUEST_SINCE`: wake JSON の `since`（sentinel 直前の pending wake と一致）
  - `partial`: sentinel JSON の `partial`
- **`notify_on_output` による wake 受信後、同一ターンで** evaluate を完走する（ファイル追記まで）
- `partial: true` のときは evaluate セッションのメタデータおよび報告に「Codex 未レビューまたは limits/connect のみ」を明記
- evaluate 側手順 5 で wake consume 済み。本スキル側では二重 consume しない

### 6. セッション跨ぎ・pending wake

watcher はバックグラウンドで動作する。エージェントセッションが切れた場合、完全自動復旧は保証しない。

**セッション開始時**（ユーザー依頼の最初のターン、または作業前確認）に次を確認する:

1. [`.agents/state/pr-review-pending-wake.json`](../../state/pr-review-pending-wake.json) — `consumed: false` があれば **evaluate 未処理**としてユーザーへ報告する
   - 対象 `review-<slug>.md`（またはレガシー `pr-<n>.md`）に当該 `since` 以降の評価セッションが無い場合は **auto evaluate 未完了**とみなし、[`review-comments-evaluate`](../review-comments-evaluate/SKILL.md) **auto モード**（手順 4 追記まで）の実行を提案する
   - ユーザーが evaluate 実行を依頼した場合は auto モードで完走する
2. [`.agents/state/pr-review-watch.json`](../../state/pr-review-watch.json) — 同一 PR の `status: running` があれば watcher 実行中と報告する

```bash
python3 .agents/scripts/wait_ai_pr_review_wake.py list \
  --wake-file .agents/state/pr-review-pending-wake.json
```

## スクリプト

| ファイル | 役割 |
|---------|------|
| [`.agents/scripts/wait-ai-pr-review-check.sh`](../../scripts/wait-ai-pr-review-check.sh) | 1 回分の完了判定（exit 0/1/2/3 + JSON stdout） |
| [`.agents/scripts/wait-ai-pr-review-watch.sh`](../../scripts/wait-ai-pr-review-watch.sh) | ポーリングループ + sentinel 出力 + PID 管理 |
| [`.agents/scripts/wait_ai_pr_review_state.py`](../../scripts/wait_ai_pr_review_state.py) | watcher PID の register/stop/unregister |
| [`.agents/scripts/wait_ai_pr_review_wake.py`](../../scripts/wait_ai_pr_review_wake.py) | evaluate 未処理 wake の記録・consume |

開発用テスト:

```bash
python3 .agents/hooks/test-wait-ai-pr-review-check.py
python3 .agents/hooks/test-wait-ai-pr-review-state.py
python3 .agents/hooks/test-wait-ai-pr-review-wake.py
bash -n .agents/scripts/wait-ai-pr-review-watch.sh
```

## 注意

- evaluate 本体は **sentinel 受信時のみ**実行（手順 3 では起動しない）
- タイムアウト時も partial で evaluate を起動する（watch スクリプトが sentinel を出す）
- 委譲先（`review-comments-evaluate`）のルールを上書きしない
- **Codex limits/connect 後の遅延 substantive**: 実測上は稀だが、limits/connect 返却後に substantive が届く可能性はゼロではない。`CODEX_TERMINAL_QUIET_SEC`（5 分）で猶予を設けるが、**partial 完了後 watcher は終了**するため、それ以降に届いた Codex substantive は自動 re-evaluate されない。必要なら手動で `/review-comments-evaluate` を再実行する

## トラブルシュート

### pending wake / sentinel が出ない（wake 書き込み失敗）

`wait-ai-pr-review-watch.sh` は `set -euo pipefail` のため、`emit_evaluate_wake` 内の `wait_ai_pr_review_wake.py write` が失敗すると **sentinel も stdout されず watcher が終了**する。この場合 pending wake も残らないため evaluate 自動起動は行われない。

**対処**: watcher のターミナルログと [`.agents/state/pr-review-watch.json`](../../state/pr-review-watch.json) を確認し、手動で `/review-comments-evaluate` を実行する。
