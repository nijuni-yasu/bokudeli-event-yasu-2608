#!/usr/bin/env bash
# Stop gate 検査正本（セルフレビューのみ。lint は create-pr / reflect 前）
# 成功: exit 0 / ブロック: exit 2 + reason を stdout
set -uo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  repo_root="$(git rev-parse --show-toplevel)"
else
  repo_root="$(cd "${script_dir}/../.." && pwd)"
fi

status="${1:-completed}"
loop_count="${2:-0}"
conversation_id="${3:-}"

MAX_LOOP=3

if [ "${status}" = "aborted" ] || [ "${status}" = "error" ]; then
  exit 0
fi

if [ "${loop_count}" -ge "${MAX_LOOP}" ]; then
  echo "Stop gate: loop_count=${loop_count} のため検証をスキップします。" >&2
  exit 0
fi

# review スコープ: lint 対象 + エージェント設定変更。該当なしなら gate 全体をスキップ
if ! bash "${script_dir}/source-change-detect.sh" review; then
  exit 0
fi

review_reason_file="$(mktemp)"
if ! bash "${script_dir}/self-review-check.sh" "${conversation_id}" 2>"${review_reason_file}"; then
  cat "${review_reason_file}"
  rm -f "${review_reason_file}"
  exit 2
fi
rm -f "${review_reason_file}"

exit 0
