#!/usr/bin/env bash
# セルフレビュー完了判定（正本）
# 成功: exit 0 / 未完了: exit 2 + reason を stderr
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  repo_root="$(git rev-parse --show-toplevel)"
else
  repo_root="$(cd "${script_dir}/../.." && pwd)"
fi

conversation_id="${1:-}"

args=(--repo-root "${repo_root}")
if [ -n "${conversation_id}" ]; then
  args+=(--conversation-id "${conversation_id}")
fi

python3 "${repo_root}/.agents/scripts/self_review_check.py" "${args[@]}"
