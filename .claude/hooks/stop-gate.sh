#!/usr/bin/env bash
# Claude Stop hook アダプタ: usage 記録 + セルフレビュー gate
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
check="${repo_root}/.agents/hooks/stop-gate-check.sh"
json_helper="${repo_root}/.agents/hooks/stop-hook-json.py"
hook_errors="${repo_root}/.agents/state/agent-usage/hook-errors.log"
mkdir -p "$(dirname "${hook_errors}")"

input=$(cat)

export AGENT_USAGE_PLATFORM=claude
python3 "${repo_root}/.agents/scripts/agent_usage.py" stop \
  --platform claude <<<"${input}" >/dev/null 2>>"${hook_errors}" || true

parse_hook_fields() {
  if command -v jq >/dev/null 2>&1; then
    status="$(echo "${input}" | jq -r '.status // .stop_reason // "completed"')"
    loop_count="$(echo "${input}" | jq -r '.loop_count // 0')"
    conversation_id="$(echo "${input}" | jq -r '.conversation_id // .session_id // empty')"
    return
  fi
  _fields=()
  while IFS= read -r line; do
    _fields+=("${line}")
  done < <(python3 "${json_helper}" parse <<<"${input}")
  status="${_fields[0]:-completed}"
  loop_count="${_fields[1]:-0}"
  conversation_id="${_fields[2]:-}"
}

json_escape() {
  if command -v jq >/dev/null 2>&1; then
    jq -Rs .
  else
    python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))'
  fi
}

parse_hook_fields

reason_file="$(mktemp)"

if bash "${check}" "${status}" "${loop_count}" "${conversation_id}" >"${reason_file}"; then
  rm -f "${reason_file}"
  exit 0
fi

full_reason="$(cat "${reason_file}")"
rm -f "${reason_file}"

reason_json=$(printf '%s' "${full_reason}" | json_escape)
printf '{"decision":"block","reason":%s}' "${reason_json}"
exit 2
