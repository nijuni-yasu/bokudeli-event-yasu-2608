#!/usr/bin/env bash
# stop / Stop 用 — ターン終了記録 + 使用量 followup_message（Cursor）
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
hook_errors="${repo_root}/.agents/state/agent-usage/hook-errors.log"
mkdir -p "$(dirname "${hook_errors}")"
input=$(cat)

output=$(
  python3 "${repo_root}/.agents/scripts/agent_usage.py" stop \
    --platform "${AGENT_USAGE_PLATFORM:-cursor}" <<<"${input}" 2>>"${hook_errors}" || echo '{}'
)

if [[ -z "${output}" ]]; then
  echo '{}'
else
  echo "${output}"
fi
exit 0
