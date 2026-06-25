#!/usr/bin/env bash
# stop / Stop 用 — ターン終了トークン記録（常に exit 0）
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
input=$(cat)

python3 "${repo_root}/.agents/scripts/agent_usage.py" record \
  --event turn_end \
  --platform "${AGENT_USAGE_PLATFORM:-cursor}" <<<"${input}" 2>/dev/null || true

echo '{}'
exit 0
