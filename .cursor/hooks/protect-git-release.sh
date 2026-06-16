#!/usr/bin/env bash
# beforeShellExecution 用 Hook アダプタ（Cursor）
# stdin JSON の .command を取り出し、共通検査ロジックに委譲する。
# ブロック時は { "permission": "deny", ... } を stdout に出力する。
# 検査ロジックの正本: .agents/hooks/protect-git-release-check.sh
set -uo pipefail

emit_allow() {
  echo '{ "permission": "allow" }'
  exit 0
}

if ! command -v jq >/dev/null 2>&1; then
  # jq 不在時はソフトガード（AGENTS.md / スキル）にフォールバック
  emit_allow
fi

# このスクリプトの位置から正本を解決（.cursor/hooks → リポジトリルート → .agents/hooks）
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
check="${script_dir}/../../.agents/hooks/protect-git-release-check.sh"

if [[ ! -f "$check" ]]; then
  emit_allow
fi

input=$(cat)
cmd=$(echo "$input" | jq -r '.command // ""')

reason=$(bash "$check" "$cmd")
rc=$?

if [[ "$rc" -eq 2 ]]; then
  jq -n --arg msg "$reason" \
    '{permission: "deny", user_message: $msg, agent_message: ("03_branch_protection §5.2: リリース系 git 操作は人間専用。\n" + $msg)}'
  exit 0
fi

emit_allow
