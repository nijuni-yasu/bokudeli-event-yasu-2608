#!/usr/bin/env bash
# PreToolUse (Bash) 用 Hook アダプタ（Claude Code）
# stdin JSON の .tool_input.command を取り出し、共通検査ロジックに委譲する。
# 検査ロジックの正本: .agents/hooks/protect-git-release-check.sh
set -uo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "Warning: jq が見つからないため、リリース系 git チェックをスキップします。" >&2
  exit 0
fi

# このスクリプトの位置から正本を解決（.claude/hooks → リポジトリルート → .agents/hooks）
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
check="${script_dir}/../../.agents/hooks/protect-git-release-check.sh"

if [[ ! -f "$check" ]]; then
  echo "Warning: 検査スクリプトが見つかりません（${check}）。スキップします。" >&2
  exit 0
fi

cmd=$(jq -r '.tool_input.command // ""')

reason=$(bash "$check" "$cmd")
rc=$?

if [[ "$rc" -eq 2 ]]; then
  echo "Blocked: ${reason}" >&2
  exit 2
fi

exit 0
