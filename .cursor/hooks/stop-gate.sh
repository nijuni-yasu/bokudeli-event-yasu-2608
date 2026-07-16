#!/usr/bin/env bash
# Cursor Stop hook アダプタ: usage 記録 + セルフレビュー gate
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
check="${repo_root}/.agents/hooks/stop-gate-check.sh"
json_helper="${repo_root}/.agents/hooks/stop-hook-json.py"

input=$(cat)
hook_errors="${repo_root}/.agents/state/agent-usage/hook-errors.log"
mkdir -p "$(dirname "${hook_errors}")"

usage_json="$(
  python3 "${repo_root}/.agents/scripts/agent_usage.py" stop \
    --platform "${AGENT_USAGE_PLATFORM:-cursor}" <<<"${input}" 2>>"${hook_errors}" || echo '{}'
)"

parse_hook_fields() {
  if command -v jq >/dev/null 2>&1; then
    status="$(echo "${input}" | jq -r '.status // "completed"')"
    loop_count="$(echo "${input}" | jq -r '.loop_count // 0')"
    conversation_id="$(echo "${input}" | jq -r '.conversation_id // empty')"
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

parse_hook_fields

reason_file="$(mktemp)"

if bash "${check}" "${status}" "${loop_count}" "${conversation_id}" >"${reason_file}"; then
  rm -f "${reason_file}"
  if command -v jq >/dev/null 2>&1; then
    followup="$(echo "${usage_json}" | jq -r '.followup_message // empty')"
    if [ -n "${followup}" ]; then
      jq -n --arg msg "${followup}" '{followup_message: $msg}'
    else
      echo '{}'
    fi
  else
    followup="$(python3 "${json_helper}" extract-followup <<<"${usage_json}")"
    if [ -n "${followup}" ]; then
      python3 "${json_helper}" followup "${followup}"
    else
      echo '{}'
    fi
  fi
  exit 0
fi

reason="$(cat "${reason_file}")"
rm -f "${reason_file}"

if command -v jq >/dev/null 2>&1; then
  jq -n --arg msg "${reason}" '{followup_message: $msg}'
else
  python3 "${json_helper}" followup "${reason}"
fi
