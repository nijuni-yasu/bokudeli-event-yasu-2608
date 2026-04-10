#!/usr/bin/env bash
# PreToolUse (Edit|Write) 用 Hook: 機密ファイルへの編集をブロック
set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "Warning: jq が見つからないため、保護対象ファイルチェックをスキップします。" >&2
  exit 0
fi

file=$(jq -r '.tool_input.file_path // .tool_input.path // ""')

# 保護対象パターン（プロジェクトの CLAUDE.md セキュリティ要件に準拠）
protected_patterns=(
  '\.env$'
  '\.env\.'
  '\.secret$'
  '\.secret\.'
  '\.firebaserc$'
  '\.pem$'
  '\.key$'
)

for pattern in "${protected_patterns[@]}"; do
  if echo "$file" | grep -qE "$pattern"; then
    echo "Blocked: '$file' は保護対象ファイルです。このファイルの編集はセキュリティ上の理由でブロックされています。" >&2
    exit 2
  fi
done

exit 0
