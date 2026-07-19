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

# loop_count が非数値のときは 0 扱い（JSON 型ずれで gate 迂回しない）
case "${loop_count}" in
  '' | *[!0-9]*) loop_count=0 ;;
esac

if [ "${status}" = "aborted" ] || [ "${status}" = "error" ]; then
  # Stop hook 自体が異常終了したターンは gate をかけない（二重ブロック回避）
  exit 0
fi

# review スコープ: lint 対象 + エージェント設定変更。該当なしなら gate 全体をスキップ
if ! bash "${script_dir}/source-change-detect.sh" review; then
  exit 0
fi

# 案 A/C: Ask（composer_mode=chat）または self-review followup 注入ターンは gate しない
if [ -n "${conversation_id}" ]; then
  if python3 "${repo_root}/.agents/scripts/agent_usage.py" self-review-gate-skip \
    --conversation-id "${conversation_id}" >/dev/null 2>&1; then
    exit 0
  fi
fi

if [ "${loop_count}" -ge "${MAX_LOOP}" ]; then
  echo "[self-review] Stop gate: loop_count=${loop_count} に達しました。セルフレビュー未完了の可能性があります。/shokujii-code-review を完走してください。"
  exit 2
fi

review_reason_file="$(mktemp)"
if ! bash "${script_dir}/self-review-check.sh" "${conversation_id}" 2>"${review_reason_file}"; then
  cat "${review_reason_file}"
  rm -f "${review_reason_file}"
  exit 2
fi
rm -f "${review_reason_file}"

exit 0
