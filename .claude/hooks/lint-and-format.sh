#!/bin/bash
# Stop イベント用 Hook: 全パッケージの lint + format チェック
set -o pipefail

cd "$CLAUDE_PROJECT_DIR" || exit 2

if ! command -v jq >/dev/null 2>&1; then
  echo "Warning: jq が見つからないため、JSON エスケープに sed を使用します。" >&2
  json_escape() { sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g' | tr '\n' ' ' | sed 's/^/"/; s/$/"/'; }
else
  json_escape() { jq -Rs .; }
fi

PACKAGES=("common" "base" "user" "partner" "enterprise" "functions/default")

lint_errors=""
format_errors=""
build_errors=""
report=""

# 1. common ビルド
build_output=$(npm -w common run build 2>&1)
build_exit=$?
if [ $build_exit -ne 0 ]; then
  report+="common build: FAIL\n$build_output\n\n"
  build_errors="common"
else
  report+="common build: OK\n"
fi

# 2. lint
report+="\nlint:\n"
for pkg in "${PACKAGES[@]}"; do
  lint_output=$(npm -w "$pkg" run lint 2>&1)
  lint_exit=$?
  if [ $lint_exit -ne 0 ]; then
    report+="- $pkg: FAIL\n$lint_output\n"
    lint_errors+="$pkg "
  else
    report+="- $pkg: OK\n"
  fi
done

# 3. format:check
report+="\nformat:check:\n"
for pkg in "${PACKAGES[@]}"; do
  format_output=$(npm -w "$pkg" run format:check 2>&1)
  format_exit=$?
  if [ $format_exit -ne 0 ]; then
    report+="- $pkg: FAIL\n"
    format_errors+="$pkg "
  else
    report+="- $pkg: OK\n"
  fi
done

# 4. format エラーがあれば自動修正
if [ -n "$format_errors" ]; then
  report+="\nformat 自動修正を実行中...\n"
  for pkg in "${PACKAGES[@]}"; do
    npm -w "$pkg" run format >/dev/null 2>&1
  done

  # 再チェック
  recheck_errors=""
  report+="\nformat:check (再チェック):\n"
  for pkg in "${PACKAGES[@]}"; do
    recheck_output=$(npm -w "$pkg" run format:check 2>&1)
    recheck_exit=$?
    if [ $recheck_exit -ne 0 ]; then
      report+="- $pkg: FAIL\n$recheck_output\n"
      recheck_errors+="$pkg "
    else
      report+="- $pkg: OK\n"
    fi
  done

  if [ -z "$recheck_errors" ]; then
    report+="\nformat エラーは自動修正されました。\n"
    format_errors=""
  else
    report+="\nformat 自動修正後もエラーが残っています: $recheck_errors\n"
  fi
fi

# 5. 結果を JSON で出力
errors=""
if [ -n "$build_errors" ]; then
  errors+="common ビルドが失敗しました。"
fi
if [ -n "$lint_errors" ]; then
  errors+="lint エラーがあります。修正してください。対象パッケージ: $lint_errors"
fi
if [ -n "$format_errors" ]; then
  errors+="format エラーが解消されていません。対象パッケージ: $format_errors"
fi

if [ -n "$errors" ]; then
  full_reason="${errors}\n\n詳細:\n${report}"
  reason_json=$(echo -e "$full_reason" | json_escape)
  printf '{"decision":"block","reason":%s}' "$reason_json"
  exit 2
fi

exit 0
