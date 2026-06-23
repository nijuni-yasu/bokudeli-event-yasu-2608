#!/usr/bin/env bash
# AI PR レビュー完了までバックグラウンド監視。完了/タイムアウト時に sentinel を stdout へ出力。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${REPO_ROOT}/.agents/state"
STATE_FILE="${STATE_DIR}/pr-review-watch.json"
CHECK="${SCRIPT_DIR}/wait-ai-pr-review-check.sh"
STATE="${SCRIPT_DIR}/wait_ai_pr_review_state.py"

eval "$(python3 "${SCRIPT_DIR}/wait_ai_pr_review_check.py" --print-shell-constants)"

usage() {
  echo "Usage: $0 --pr NUM --since ISO8601 [--owner OWNER] [--repo REPO]" >&2
  exit 2
}

PR=""
SINCE=""
OWNER="nijuniinc"
REPO="bokudeli-event-new"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr)
      PR="$2"
      shift 2
      ;;
    --since)
      SINCE="$2"
      shift 2
      ;;
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --repo)
      REPO="$2"
      shift 2
      ;;
    -h | --help)
      usage
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      ;;
  esac
done

if [[ -z "${PR}" || -z "${SINCE}" ]]; then
  usage
fi

mkdir -p "${STATE_DIR}"

stop_existing_watchers() {
  if [[ ! -f "${STATE_FILE}" ]]; then
    echo "[]" >"${STATE_FILE}"
    return
  fi
  python3 "${STATE}" stop --state-file "${STATE_FILE}" --pr "${PR}"
}

register_pid() {
  local pid="$1"
  python3 "${STATE}" register \
    --state-file "${STATE_FILE}" \
    --pr "${PR}" \
    --since "${SINCE}" \
    --owner "${OWNER}" \
    --repo "${REPO}" \
    --pid "${pid}"
}

unregister_pid() {
  local pid="$1"
  local final_status="$2"
  python3 "${STATE}" unregister \
    --state-file "${STATE_FILE}" \
    --pid "${pid}" \
    --status "${final_status}"
}

cleanup() {
  unregister_pid "$$" "stopped"
}

stop_existing_watchers
trap cleanup EXIT INT TERM

register_pid "$$"

START_EPOCH=$(date -u +%s)

while true; do
  NOW_EPOCH=$(date -u +%s)
  ELAPSED=$((NOW_EPOCH - START_EPOCH))

  if [[ "${ELAPSED}" -lt "${MIN_WAIT_SEC}" ]]; then
    sleep "${POLL_SEC}"
    continue
  fi

  set +e
  OUTPUT="$("${CHECK}" --pr "${PR}" --since "${SINCE}" --owner "${OWNER}" --repo "${REPO}" --elapsed-sec "${ELAPSED}")"
  CODE=$?
  set -e

  PARTIAL=false
  if [[ "${CODE}" -eq 0 || "${CODE}" -eq 2 ]]; then
    PARTIAL=$(python3 -c 'import json,sys; print("true" if json.loads(sys.argv[1]).get("partial") else "false")' "${OUTPUT}")
    unregister_pid "$$" "$([[ "${CODE}" -eq 0 ]] && echo complete || echo timeout)"
    trap - EXIT INT TERM
    echo "AGENT_LOOP_WAKE_pr_review {\"prompt\":\"/review-comments-evaluate\",\"pr\":${PR},\"partial\":${PARTIAL}}"
    exit 0
  fi

  if [[ "${ELAPSED}" -ge "${TIMEOUT_SEC}" ]]; then
    unregister_pid "$$" "timeout"
    trap - EXIT INT TERM
    echo "AGENT_LOOP_WAKE_pr_review {\"prompt\":\"/review-comments-evaluate\",\"pr\":${PR},\"partial\":true}"
    exit 0
  fi

  if [[ "${CODE}" -eq 3 ]]; then
    unregister_pid "$$" "error"
    trap - EXIT INT TERM
    echo "wait-ai-pr-review-watch: check error: ${OUTPUT}" >&2
    exit 1
  fi

  sleep "${POLL_SEC}"
done
