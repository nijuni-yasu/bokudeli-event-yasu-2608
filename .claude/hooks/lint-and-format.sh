#!/bin/bash
# Claude Stop 用 Hook アダプタ: lint-and-format-check 正本を呼ぶ
set -o pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
check="${repo_root}/.agents/hooks/lint-and-format-check.sh"

cd "${repo_root}" || exit 2

if ! command -v jq >/dev/null 2>&1; then
  json_escape() { sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | tr '\n' ' ' | sed 's/^/"/; s/$/"/'; }
else
  json_escape() { jq -Rs .; }
fi

reason_file="$(mktemp)"
if bash "${check}" 2>"${reason_file}"; then
  rm -f "${reason_file}"
  exit 0
fi

full_reason="$(cat "${reason_file}")"
rm -f "${reason_file}"
reason_json=$(printf '%s' "${full_reason}" | json_escape)
printf '{"decision":"block","reason":%s}' "${reason_json}"
exit 2
