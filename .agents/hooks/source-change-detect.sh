#!/usr/bin/env bash
# ソース変更検知（Stop gate / lint-and-format-check 共用）
# 用法:
#   source-change-detect.sh [lint|review]
#     lint   = PR verify 対象（アプリソース等）のみ — デフォルト
#     review = lint 対象 + エージェント設定（Stop gate 用）
#     exit 0 = 対象スコープの変更あり / exit 1 = 変更なし
#   source-change-detect.sh list-paths [lint|review]
#     対象パスを sort -u で 1 行 1 件出力（0 件でも exit 0）
set -uo pipefail

mode="${1:-lint}"
list_mode=0
scope="${mode}"

if [ "${mode}" = "list-paths" ]; then
  list_mode=1
  scope="${2:-lint}"
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  repo_root="$(git rev-parse --show-toplevel)"
else
  repo_root="$(cd "${script_dir}/../.." && pwd)"
fi
cd "${repo_root}" || exit 1

is_lint_relevant_path() {
  local path="$1"

  case "${path}" in
    .agents/state/* | documents/レビューコメント/*)
      return 1
      ;;
    */typed-router.d.ts | */auto-imports.d.ts | */components.d.ts)
      return 1
      ;;
    common/* | base/* | user/* | partner/* | enterprise/* | functions/* | terms/*)
      return 0
      ;;
    firebase.json | .firebaserc | firestore.rules | storage.rules | firestore.indexes.json)
      return 0
      ;;
    .github/workflows/*)
      return 0
      ;;
    package.json | package-lock.json)
      return 0
      ;;
    eslint.config.mjs | .prettierrc | tsconfig.base.json | tsconfig.json)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_review_infra_path() {
  local path="$1"

  case "${path}" in
    .agents/state/*)
      return 1
      ;;
    documents/レビューコメント/review-*)
      case "${path}" in
        documents/レビューコメント/review-xxxx_template.md)
          return 0
          ;;
        *)
          return 1
          ;;
      esac
      ;;
    documents/レビューコメント/pr-*)
      case "${path}" in
        documents/レビューコメント/pr-xxxx_template.md)
          return 0
          ;;
        *)
          return 1
          ;;
      esac
      ;;
    .agents/hooks/* | .agents/scripts/* | .agents/skills/* | .agents/config/*)
      return 0
      ;;
    AGENTS.md | CLAUDE.md | .github/copilot-instructions.md)
      return 0
      ;;
    documents/AIエージェント/*)
      return 0
      ;;
    .cursor/hooks/* | .cursor/hooks.json | .claude/hooks/* | .claude/settings.json)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

is_relevant_for_scope() {
  local path="$1"

  if is_lint_relevant_path "${path}"; then
    return 0
  fi
  if [ "${scope}" = "review" ] && is_review_infra_path "${path}"; then
    return 0
  fi
  return 1
}

matched_paths=()
found=0
while IFS= read -r path; do
  [ -z "${path}" ] && continue
  if is_relevant_for_scope "${path}"; then
    matched_paths+=("${path}")
    found=1
    if [ "${list_mode}" -eq 0 ]; then
      break
    fi
  fi
done < <(
  {
    git diff --name-only 2>/dev/null || true
    git diff --cached --name-only 2>/dev/null || true
    git ls-files --others --exclude-standard 2>/dev/null || true
  } | sort -u
)

if [ "${list_mode}" -eq 1 ]; then
  if [ "${#matched_paths[@]}" -gt 0 ]; then
    printf '%s\n' "${matched_paths[@]}" | sort -u
  fi
  exit 0
fi

if [ "${found}" -eq 1 ]; then
  exit 0
fi

exit 1
