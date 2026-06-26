#!/usr/bin/env bash
# afterShellExecution / PostToolUse Bash 用 — shell duration 記録
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
hook_errors="${repo_root}/.agents/state/agent-usage/hook-errors.log"
mkdir -p "$(dirname "${hook_errors}")"
input=$(cat)

python3 "${repo_root}/.agents/scripts/agent_usage.py" record \
  --event shell \
  --platform "${AGENT_USAGE_PLATFORM:-cursor}" <<<"${input}" 2>>"${hook_errors}" || true

exit 0
