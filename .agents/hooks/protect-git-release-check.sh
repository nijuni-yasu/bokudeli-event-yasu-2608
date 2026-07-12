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
# 引用符を考慮して ; / && で分割（commit -m 内の ; 誤分割を防止）。git commit 断片は検査対象外
# git … add は断片内の任意位置（GIT_DIR= 前置・パイプ・global option 付き）を検出
git_global_opt='(-C[[:space:]]+[^[:space:]]+|--git-dir=[^[:space:]]+|--git-dir[[:space:]]+[^[:space:]]+|-c[[:space:]]+[^[:space:]]+|--work-tree=[^[:space:]]+|--work-tree[[:space:]]+[^[:space:]]+)'
git_add_match="(^|[[:space:]]|[|])(GIT_DIR=[^[:space:]]+[[:space:]]+)?git([[:space:]]+${git_global_opt})*[[:space:]]+add[[:space:]]"
git_add_strip='.*(^|[[:space:]]|[|]|GIT_DIR=[^[:space:]]+[[:space:]]+)git([[:space:]]+('"${git_global_opt}"'))*[[:space:]]+add[[:space:]]+'
# 各引数トークン境界（空白）でも機密パスを検出（git add .secret otherfile 等）
sensitive_add_pattern='(^|[[:space:]])([^[:space:]]+/)*\.env(\.|$|[[:space:]])|(^|[[:space:]])([^[:space:]]+/)*\.secret($|[[:space:]]|\.)|(^|[[:space:]])([^[:space:]]+/)*\.firebaserc($|[[:space:]])|(^|[[:space:]])([^[:space:]]+/)*[^/[:space:]]+\.pem($|[[:space:]])|(^|[[:space:]])([^[:space:]]+/)*[^/[:space:]]+\.key($|[[:space:]])'
bulk_add_msg='git add の一括ステージ（. / -A / -u 等）は機密ファイル混入リスクがあるため禁止です。対象ファイルを明示指定してください。'

split_shell_commands() {
  SPLIT_SHELL_INPUT="$1" python3 <<'PY'
import os

def split_commands(text: str) -> list[str]:
    parts: list[str] = []
    cur: list[str] = []
    in_sq = in_dq = False
    i = 0
    n = len(text)
    while i < n:
        if not in_sq and not in_dq and i + 1 < n and text[i : i + 2] in ("&&", "||"):
            p = "".join(cur).strip()
            if p:
                parts.append(p)
            cur = []
            i += 2
            continue
        if not in_sq and not in_dq and text[i] == ";":
            p = "".join(cur).strip()
            if p:
                parts.append(p)
            cur = []
            i += 1
            continue
        c = text[i]
        if c == "'" and not in_dq:
            in_sq = not in_sq
        elif c == '"' and not in_sq:
            in_dq = not in_dq
        cur.append(c)
        i += 1
    p = "".join(cur).strip()
    if p:
        parts.append(p)
    return parts

for part in split_commands(os.environ.get("SPLIT_SHELL_INPUT", "")):
    print(part)
PY
}

while IFS= read -r part; do
  [[ -z "$part" ]] && continue

  # git commit 断片はメッセージ内 git add 文字列の誤検知防止のためスキップ
  if echo "$part" | grep -qE '(^|[[:space:]]|[|])(GIT_DIR=[^[:space:]]+[[:space:]]+)?git[[:space:]]+commit([[:space:]]|$)'; then
    continue
  fi

  if ! echo "$part" | grep -qE "${git_add_match}"; then
    continue
  fi

  add_args=$(echo "$part" | sed -E "s/${git_add_strip}//")

  if echo "$add_args" | grep -qE "${sensitive_add_pattern}"; then
    block "機密ファイル（.env / .secret / .firebaserc / .pem / .key）の git add は禁止です。"
  fi

  if echo "$add_args" | grep -qE '(^|[[:space:]])(-A|--all|-u|--update)($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
  if echo "$add_args" | grep -qE '(^|[[:space:]])(\./|\.\./|\.\.|:/)($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
  if echo "$add_args" | grep -qE '(^|[[:space:]])--[[:space:]]+\.?\.?($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
  if echo "$add_args" | grep -qE '(^|[[:space:]])\.($|[[:space:]])'; then
    block "${bulk_add_msg}"
  fi
done < <(split_shell_commands "$command")

exit 0
