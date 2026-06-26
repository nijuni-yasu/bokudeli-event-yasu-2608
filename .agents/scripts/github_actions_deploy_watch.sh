#!/usr/bin/env bash
# GitHub Actions deploy — バックグラウンド watch + sentinel 出力
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${REPO_ROOT}/.agents/state"
STATE_FILE="${STATE_DIR}/deploy-watch.json"
WAKE_FILE="${STATE_DIR}/deploy-pending-wake.json"
RESULTS_DIR="${STATE_DIR}/deploy-results"
STATE="${SCRIPT_DIR}/github_actions_deploy_state.py"
WAKE="${SCRIPT_DIR}/github_actions_deploy_wake.py"
CHECK="${SCRIPT_DIR}/github_actions_deploy_check.py"

usage() {
  echo "Usage: $0 --owner OWNER --repo REPO --ref REF --since ISO8601 --workflows CSV --deploy-id UUID" >&2
  exit 2
}

OWNER=""
REPO=""
REF=""
SINCE=""
WORKFLOWS=""
DEPLOY_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner)
      OWNER="$2"
      shift 2
      ;;
    --repo)
      REPO="$2"
      shift 2
      ;;
    --ref)
      REF="$2"
      shift 2
      ;;
    --since)
      SINCE="$2"
      shift 2
      ;;
    --workflows)
      WORKFLOWS="$2"
      shift 2
      ;;
    --deploy-id)
      DEPLOY_ID="$2"
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

if [[ -z "${OWNER}" || -z "${REPO}" || -z "${REF}" || -z "${SINCE}" || -z "${WORKFLOWS}" || -z "${DEPLOY_ID}" ]]; then
  usage
fi

mkdir -p "${STATE_DIR}" "${RESULTS_DIR}"

IFS=',' read -r -a WORKFLOW_LIST <<<"${WORKFLOWS}"

stop_existing_watchers() {
  python3 "${STATE}" stop --state-file "${STATE_FILE}" --deploy-id "${DEPLOY_ID}"
}

register_pid() {
  python3 "${STATE}" register \
    --state-file "${STATE_FILE}" \
    --deploy-id "${DEPLOY_ID}" \
    --since "${SINCE}" \
    --owner "${OWNER}" \
    --repo "${REPO}" \
    --ref "${REF}" \
    --pid "$$" \
    --watcher-command "github_actions_deploy_watch.sh"
}

unregister_pid() {
  local final_status="$1"
  python3 "${STATE}" unregister \
    --state-file "${STATE_FILE}" \
    --pid "$$" \
    --status "${final_status}"
}

emit_deploy_wake() {
  local results_file="$1"
  python3 "${WAKE}" write \
    --wake-file "${WAKE_FILE}" \
    --deploy-id "${DEPLOY_ID}" \
    --since "${SINCE}" \
    --owner "${OWNER}" \
    --repo "${REPO}" \
    --ref "${REF}" \
    --results-file "${results_file}" \
    --mode report
  echo "AGENT_LOOP_WAKE_deploy {\"prompt\":\"/github-actions-deploy\",\"mode\":\"report\",\"deploy_id\":\"${DEPLOY_ID}\"}"
}

cleanup() {
  unregister_pid "stopped"
}

discover_run_id() {
  local wf="$1"
  python3 "${CHECK}" discover-run-id \
    --owner "${OWNER}" \
    --repo "${REPO}" \
    --ref "${REF}" \
    --since "${SINCE}" \
    --workflow "${wf}"
}

fetch_run_url() {
  local run_id="$1"
  python3 "${CHECK}" fetch-run-url \
    --owner "${OWNER}" \
    --repo "${REPO}" \
    --run-id "${run_id}"
}

# bash 3.2 互換: nameref は使わずモジュール変数 WATCH_LAST_PID で PID を返す
WATCH_LAST_PID=0

watch_run_bg() {
  local run_id="$1"
  local out_file="$2"
  (
    if gh run watch "${run_id}" --repo "${OWNER}/${REPO}" --exit-status; then
      echo "success" >"${out_file}"
    else
      echo "failure" >"${out_file}"
    fi
  ) &
  WATCH_LAST_PID=$!
}

stop_existing_watchers
trap cleanup EXIT INT TERM
register_pid

RUNS_TMP="$(mktemp)"
echo "[]" >"${RUNS_TMP}"

WATCH_PIDS=()
WATCH_META=()

for WF in "${WORKFLOW_LIST[@]}"; do
  WF="$(echo "${WF}" | xargs)"
  [[ -z "${WF}" ]] && continue

  RUN_ID="$(discover_run_id "${WF}")"
  if [[ -z "${RUN_ID}" ]]; then
    python3 - "${WF}" "${RUNS_TMP}" <<'PY'
import json
import sys
from pathlib import Path

wf, path = sys.argv[1], Path(sys.argv[2])
runs = json.loads(path.read_text(encoding="utf-8"))
runs.append({
    "workflow": wf,
    "run_id": None,
    "url": None,
    "success": None,
    "error": "run_id_not_found",
})
path.write_text(json.dumps(runs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
    continue
  fi

  RUN_URL="$(fetch_run_url "${RUN_ID}")"
  STATUS_FILE="$(mktemp)"
  watch_run_bg "${RUN_ID}" "${STATUS_FILE}"
  WATCH_PIDS+=("${WATCH_LAST_PID}")
  WATCH_META+=("${WF}|${RUN_ID}|${RUN_URL}|${STATUS_FILE}")
done

for pid in "${WATCH_PIDS[@]}"; do
  wait "${pid}" || true
done

for meta in "${WATCH_META[@]}"; do
  IFS='|' read -r WF RUN_ID RUN_URL STATUS_FILE <<<"${meta}"
  RESULT="failure"
  if [[ -f "${STATUS_FILE}" ]] && [[ "$(cat "${STATUS_FILE}")" == "success" ]]; then
    RESULT="success"
  fi
  rm -f "${STATUS_FILE}"

  python3 - "${WF}" "${RUN_ID}" "${RUN_URL}" "${RESULT}" "${RUNS_TMP}" <<'PY'
import json
import sys
from pathlib import Path

wf, run_id, run_url, result, path = sys.argv[1:6]
runs = json.loads(Path(path).read_text(encoding="utf-8"))
runs.append({
    "workflow": wf,
    "run_id": int(run_id),
    "url": run_url or None,
    "success": result == "success",
})
Path(path).write_text(json.dumps(runs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
done

RESULTS_FILE="${RESULTS_DIR}/${DEPLOY_ID}.json"
python3 "${CHECK}" write-results \
  --output "${RESULTS_FILE}" \
  --deploy-id "${DEPLOY_ID}" \
  --owner "${OWNER}" \
  --repo "${REPO}" \
  --ref "${REF}" \
  --since "${SINCE}" \
  --runs-json "${RUNS_TMP}"

rm -f "${RUNS_TMP}"

unregister_pid "complete"
trap - EXIT INT TERM

emit_deploy_wake "${RESULTS_FILE}"
exit 0
