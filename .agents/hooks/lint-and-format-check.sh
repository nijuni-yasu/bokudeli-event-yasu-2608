#!/usr/bin/env bash
# PR verify 相当の lint / format / 型 / test チェック（正本）
# 成功: exit 0 / 失敗: exit 2 + reason を stderr 末尾に出力
set -o pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if git rev-parse --show-toplevel >/dev/null 2>&1; then
  repo_root="$(git rev-parse --show-toplevel)"
else
  repo_root="$(cd "${script_dir}/../.." && pwd)"
fi
cd "${repo_root}" || exit 2

if ! bash "${script_dir}/source-change-detect.sh"; then
  exit 0
fi

PACKAGES=("common" "base" "user" "partner" "enterprise" "functions/default")
TYPE_PACKAGES=("base" "user" "partner" "enterprise")
TEST_PACKAGES=("common" "base" "user" "partner" "enterprise" "functions/default")

report=""
errors=""

append_fail() {
  local label="$1"
  local detail="$2"
  errors+="${label} "
  report+="${label}: FAIL
${detail}

"
}

append_ok() {
  local label="$1"
  report+="${label}: OK
"
}

# 0. verify:functions-deploy
verify_output=$(npm run verify:functions-deploy 2>&1)
verify_exit=$?
if [ "${verify_exit}" -ne 0 ]; then
  append_fail "verify:functions-deploy" "${verify_output}"
else
  append_ok "verify:functions-deploy"
fi

# 1. common build
build_output=$(npm -w common run build 2>&1)
build_exit=$?
if [ "${build_exit}" -ne 0 ]; then
  append_fail "common build" "${build_output}"
else
  append_ok "common build"
fi

# 2. lint
report+="
lint:
"
for pkg in "${PACKAGES[@]}"; do
  lint_output=$(npm -w "${pkg}" run lint 2>&1)
  lint_exit=$?
  if [ "${lint_exit}" -ne 0 ]; then
    append_fail "lint ${pkg}" "${lint_output}"
  else
    report+="- ${pkg}: OK
"
  fi
done

# 3. format:check (+ auto fix)
report+="
format:check:
"
format_errors=""
for pkg in "${PACKAGES[@]}"; do
  format_output=$(npm -w "${pkg}" run format:check 2>&1)
  format_exit=$?
  if [ "${format_exit}" -ne 0 ]; then
    report+="- ${pkg}: FAIL
"
    format_errors+="${pkg} "
  else
    report+="- ${pkg}: OK
"
  fi
done

if [ -n "${format_errors}" ]; then
  report+="
format 自動修正を実行中...
"
  for pkg in "${PACKAGES[@]}"; do
    npm -w "${pkg}" run format >/dev/null 2>&1 || true
  done

  recheck_errors=""
  report+="
format:check (再チェック):
"
  for pkg in "${PACKAGES[@]}"; do
    recheck_output=$(npm -w "${pkg}" run format:check 2>&1)
    recheck_exit=$?
    if [ "${recheck_exit}" -ne 0 ]; then
      report+="- ${pkg}: FAIL
${recheck_output}
"
      recheck_errors+="${pkg} "
    else
      report+="- ${pkg}: OK
"
    fi
  done

  if [ -n "${recheck_errors}" ]; then
    append_fail "format:check" "自動修正後もエラーが残っています: ${recheck_errors}"
  else
    report+="
format エラーは自動修正されました。
"
  fi
fi

# 4. build:types
report+="
build:types:
"
for pkg in "${TYPE_PACKAGES[@]}"; do
  types_output=$(npm -w "${pkg}" run build:types 2>&1)
  types_exit=$?
  if [ "${types_exit}" -ne 0 ]; then
    append_fail "build:types ${pkg}" "${types_output}"
  else
    report+="- ${pkg}: OK
"
  fi
done

# 5. functions build
functions_output=$(npm -w functions/default run build 2>&1)
functions_exit=$?
if [ "${functions_exit}" -ne 0 ]; then
  append_fail "functions build" "${functions_output}"
else
  append_ok "functions build"
fi

# 6. vitest
report+="
test:
"
for pkg in "${TEST_PACKAGES[@]}"; do
  test_output=$(npm -w "${pkg}" run test 2>&1)
  test_exit=$?
  if [ "${test_exit}" -ne 0 ]; then
    append_fail "test ${pkg}" "${test_output}"
  else
    report+="- ${pkg}: OK
"
  fi
done

if [ -n "${errors}" ]; then
  {
    echo "[lint-and-format] PR verify 相当チェックが失敗しました。"
    echo "失敗項目: ${errors}"
    echo ""
    echo -e "${report}"
  } >&2
  exit 2
fi

exit 0
