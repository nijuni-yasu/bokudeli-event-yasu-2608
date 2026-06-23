#!/usr/bin/env bash
# AI PR レビュー完了判定（1 回分）。JSON を stdout、exit code で結果を返す。
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "${SCRIPT_DIR}/wait_ai_pr_review_check.py" "$@"
