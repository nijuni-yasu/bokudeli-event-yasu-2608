#!/usr/bin/env bash
# 本番・リリース系 git 操作の検査ロジック（正本）
# 03_branch_protection.md §5.2 ③ — ref は末尾完全一致で判定（部分一致は使わない）
#
# 使い方: protect-git-release-check.sh "<コマンド文字列>"
#   - 許可: exit 0
#   - ブロック: exit 2、理由を stdout に出力（呼び出し側がそのまま利用）
#
# Claude / Cursor の各 Hook アダプタから呼ばれる。stdin/JSON の解釈はアダプタ側で行う。
set -euo pipefail

command="${1:-}"

if [[ -z "$command" ]]; then
  exit 0
fi

block() {
  echo "$1"
  exit 2
}

# npm version（リリース用バージョン bump — 任意引数を一律ブロック）
if echo "$command" | grep -qE '(^|[[:space:]])npm[[:space:]]+version[[:space:]]+[^[:space:]]'; then
  block "npm version は人間のリリース作業専用です。エージェントは実行できません。"
fi

# git branch -f main|production（ブランチ名完全一致）
if echo "$command" | grep -qE 'git[[:space:]]+branch[[:space:]]+(-f|--force)[[:space:]]+(main|production)([[:space:]]|$)'; then
  block "git branch -f main|production は人間のリリース作業専用です。エージェントは実行できません。"
fi

# git push — 保護 ref / リリースタグ（ref 完全一致のみ）
if echo "$command" | grep -qE '(^|[[:space:]])git[[:space:]]+push'; then
  protected_refs='development|main|production'

  if echo "$command" | grep -qE "(^|[[:space:]])HEAD:(${protected_refs})([[:space:]]|$)"; then
    block "git push 先が保護ブランチです。feature / release / sync ブランチ + PR 経由で更新してください。"
  fi

  # 単独 ref 引数（git push origin main 等）。部分一致は使わない（sync/main-to-development は通す）
  if echo "$command" | grep -qE "(^|[[:space:]])(${protected_refs})([[:space:]]|$)"; then
    block "git push 先が保護ブランチです。feature / release / sync ブランチ + PR 経由で更新してください。"
  fi

  if echo "$command" | grep -qE '(^|[[:space:]])--tags([[:space:]]|$)'; then
    block "git push --tags は人間のリリース作業専用です。エージェントは実行できません。"
  fi

  if echo "$command" | grep -qE '(^|[[:space:]])--follow-tags([[:space:]]|$)'; then
    block "git push --follow-tags は人間のリリース作業専用です。エージェントは実行できません。"
  fi

  if echo "$command" | grep -qE '(^|[[:space:]])HEAD:(v[0-9][^[:space:]]*)([[:space:]]|$)'; then
    block "git push 先がリリースタグです。人間のリリース作業専用です。"
  fi

  if echo "$command" | grep -qE '(^|[[:space:]])(v[0-9][^[:space:]]*)([[:space:]]|$)'; then
    block "git push 先がリリースタグです。人間のリリース作業専用です。"
  fi

  if echo "$command" | grep -qE '(^|[[:space:]])refs/tags/v[0-9]'; then
    block "git push 先がリリースタグです。人間のリリース作業専用です。"
  fi
fi

# git add — 機密ファイルの staging を拒否（protect-files.sh は Edit|Write のみ）
# コミットメッセージ等の文中 git add 文字列は対象外（シェル行頭または && / ; 直後の git add のみ）
# オプション（-N, -f 等）やパス prefix（dir/.secret 等）が付いた場合も [^;&]* でセグメント全体をスキャン
git_add_prefix='(^|[;&][[:space:]]*|&&[[:space:]]*)git[[:space:]]+add[[:space:]]'

if echo "$command" | grep -qE "${git_add_prefix}"; then
  if echo "$command" | grep -qE "${git_add_prefix}[^;&]*(\.env(\.|[[:space:]]|$)|\.secret(\.|[[:space:]]|$)|\.firebaserc([[:space:]]|$))"; then
    block "機密ファイル（.env / .secret / .firebaserc）の git add は禁止です。"
  fi

  if echo "$command" | grep -qE "${git_add_prefix}(-A|--all|\.)($|[[:space:]])"; then
    block "git add . / -A / --all は機密ファイル混入リスクがあるため禁止です。対象ファイルを明示指定してください。"
  fi
fi

exit 0
