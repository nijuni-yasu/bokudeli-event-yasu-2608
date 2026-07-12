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

  if echo "$command" | grep -qE "(^|[[:space:]])HEAD:refs/heads/(${protected_refs})([[:space:]]|$)"; then
    block "git push 先が保護ブランチです。feature / release / sync ブランチ + PR 経由で更新してください。"
  fi

  # 単独 ref 引数（git push origin main 等）。部分一致は使わない（sync/main-to-development は通す）
  if echo "$command" | grep -qE "(^|[[:space:]])(${protected_refs})([[:space:]]|$)"; then
    block "git push 先が保護ブランチです。feature / release / sync ブランチ + PR 経由で更新してください。"
  fi

  if echo "$command" | grep -qE "(^|[[:space:]])refs/heads/(${protected_refs})([[:space:]]|$)"; then
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
# コミットメッセージ等の文中 git add 文字列は対象外（; / && で分割した各シェル断片のみ）
# git remote add 等は除外（git … add サブコマンドのみ。git -C / --git-dir 付きも対象）
git_add_cmd='^git([[:space:]]+(-C([[:space:]]+[^[:space:]]+|[^[:space:]]+)|--git-dir=[^[:space:]]+))*[[:space:]]+add[[:space:]]'
sensitive_add_pattern='(\.env(\.|$)|\.secret(\.|$)|\.firebaserc($|[^/])|\.pem($|\.)|\.key($|[^/]))'
bulk_add_msg='git add の一括ステージ（. / -A / -u 等）は機密ファイル混入リスクがあるため禁止です。対象ファイルを明示指定してください。'

while IFS= read -r part; do
  part="${part#"${part%%[![:space:]]*}"}"
  if ! echo "$part" | grep -qE "${git_add_cmd}"; then
    continue
  fi

  add_args=$(echo "$part" | sed -E 's/^git([[:space:]]+(-C([[:space:]]+[^[:space:]]+|[^[:space:]]+)|--git-dir=[^[:space:]]+))*[[:space:]]+add[[:space:]]+//')

  # オプション（-f / -N 等）を挟んでも add 引数全体から機密パスを検出
  if echo "$add_args" | grep -qE "${sensitive_add_pattern}"; then
    block "機密ファイル（.env / .secret / .firebaserc / .pem / .key）の git add は禁止です。"
  fi

  # 一括ステージ: -A / --all / -u / --update / . / ./ / .. / -- . / :/
  if echo "$add_args" | grep -qE '(^|[[:space:]])(-A|--all|-u|--update)($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
  if echo "$add_args" | grep -qE '(^|[[:space:]])(\./|\.\.|:/)($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
  if echo "$add_args" | grep -qE '(^|[[:space:]])--[[:space:]]+\.?\.?($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
  if echo "$add_args" | grep -qE '(^|[[:space:]])\.($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
done < <(echo "$command" | sed 's/&&/\n/g; s/;/\n/g')

exit 0
