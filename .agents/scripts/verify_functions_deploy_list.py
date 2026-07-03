#!/usr/bin/env python3
"""index.ts の export と deploy_functions.yml の --only リストの整合性を検証する。

前提:
- index.ts は `export const { ... } = Object.assign` 形式で export を列挙している
- deploy_functions.yml は hybrid / pf / enterprise の case 内に
  `echo "args=--force --only functions:..."` がある
  （インデント変更には追従するが、echo 行の文言形式変更時は本スクリプトの更新が必要）
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INDEX_TS = REPO_ROOT / "functions/default/src/index.ts"
DEFAULT_DEPLOY_YML = REPO_ROOT / ".github/workflows/deploy_functions.yml"

EXPORT_BLOCK_RE = re.compile(
    r"export\s+const\s+\{([\s\S]*?)\}\s*=\s*Object\.assign",
    re.MULTILINE,
)
DEPLOY_FUNCTION_RE = re.compile(r"functions:([a-zA-Z_][a-zA-Z0-9_]*)")
# deploy_functions.yml の case ラベル直後の echo 行を抽出（行頭固定は使わない）
GROUP_CASE_RE = re.compile(
    r"(hybrid|pf|enterprise)\)\s*\n\s*echo \"args=--force --only ([^\"]+)\"",
    re.MULTILINE,
)


def parse_index_exports(index_path: Path) -> set[str]:
    text = index_path.read_text(encoding="utf-8")
    match = EXPORT_BLOCK_RE.search(text)
    if match is None:
        raise ValueError(f"export const {{ ... }} ブロックが見つかりません: {index_path}")

    names: set[str] = set()
    for part in match.group(1).split(","):
        name = part.strip()
        if not name or name.startswith("//"):
            continue
        if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", name):
            raise ValueError(f"export 名の解析に失敗しました: {name!r} ({index_path})")
        names.add(name)
    return names


def parse_deploy_targets(deploy_path: Path) -> tuple[set[str], dict[str, list[str]]]:
    text = deploy_path.read_text(encoding="utf-8")
    all_names: set[str] = set()
    by_group: dict[str, list[str]] = {}

    for group, only_arg in GROUP_CASE_RE.findall(text):
        names = [m.group(1) for m in DEPLOY_FUNCTION_RE.finditer(only_arg)]
        by_group[group] = names
        all_names.update(names)

    if not by_group:
        raise ValueError(
            f"deploy グループ (hybrid / pf / enterprise) が見つかりません: {deploy_path}"
        )

    expected_groups = {"hybrid", "pf", "enterprise"}
    missing_groups = expected_groups - set(by_group)
    if missing_groups:
        raise ValueError(
            f"deploy グループが不足しています ({deploy_path}): "
            + ", ".join(sorted(missing_groups))
        )

    return all_names, by_group


def collect_mismatch_errors(
    exports: set[str],
    deployed: set[str],
    by_group: dict[str, list[str]],
) -> list[str]:
    errors: list[str] = []

    missing = sorted(exports - deployed)
    if missing:
        errors.append(
            "index.ts に export があるが deploy_functions.yml の --only に未登録:\n"
            + "\n".join(f"  - {name}" for name in missing)
            + "\n  → hybrid / pf / enterprise のいずれかに functions:<name> を追加してください。"
        )

    stale = sorted(deployed - exports)
    if stale:
        errors.append(
            "deploy_functions.yml にあるが index.ts に export がない（削除漏れの可能性）:\n"
            + "\n".join(f"  - {name}" for name in stale)
        )

    seen: dict[str, str] = {}
    for group, names in by_group.items():
        for name in names:
            if name in seen:
                errors.append(
                    f"deploy_functions.yml で重複登録: {name} "
                    f"({seen[name]} と {group})"
                )
            else:
                seen[name] = group

    return errors


def verify(
    index_path: Path | None = None,
    deploy_path: Path | None = None,
) -> int:
    index_path = index_path or DEFAULT_INDEX_TS
    deploy_path = deploy_path or DEFAULT_DEPLOY_YML

    if not index_path.is_file():
        print(f"ERROR: {index_path} が見つかりません", file=sys.stderr)
        return 1
    if not deploy_path.is_file():
        print(f"ERROR: {deploy_path} が見つかりません", file=sys.stderr)
        return 1

    try:
        exports = parse_index_exports(index_path)
        deployed, by_group = parse_deploy_targets(deploy_path)
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    errors = collect_mismatch_errors(exports, deployed, by_group)

    if errors:
        print("Functions deploy list の整合性チェックに失敗しました:\n", file=sys.stderr)
        for i, err in enumerate(errors, start=1):
            print(f"{i}. {err}\n", file=sys.stderr)
        print(
            "参照: .agents/skills/shokujii-functions-implementation/SKILL.md "
            "（CI デプロイ）",
            file=sys.stderr,
        )
        return 1

    print(
        f"OK: index.ts export {len(exports)} 件と "
        f"deploy_functions.yml {len(deployed)} 件が一致しました。"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(verify())
