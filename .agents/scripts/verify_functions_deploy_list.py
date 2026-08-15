#!/usr/bin/env python3
"""Functions デプロイ設定の静的検証。

前提（正本: documents/実装メモ/functionsのCIデプロイ.md）:
- deploy_functions.yml は 1 ジョブ + `args: '--only functions'`（`--force` は CI では使わない）
- export 正本は functions/default/src/index.ts のみ（yml 手書きリスト不要）
- firebase.json の functions 配列に default codebase が 1 エントリ
"""

from __future__ import annotations

import json
import re
import sys
from collections.abc import Iterator
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INDEX_TS = REPO_ROOT / "functions/default/src/index.ts"
DEFAULT_DEPLOY_YML = REPO_ROOT / ".github/workflows/deploy_functions.yml"
DEFAULT_FIREBASE_JSON = REPO_ROOT / "firebase.json"

EXPORT_BLOCK_RE = re.compile(
    r"export\s+const\s+\{([\s\S]*?)\}\s*=\s*Object\.assign",
    re.MULTILINE,
)

FORBIDDEN_DEPLOY_PATTERNS = (
    (re.compile(r"\bstrategy\s*:"), "strategy.matrix（3 ジョブ並列）"),
    (re.compile(r"\bdeploy_group\b"), "workflow_dispatch.inputs.deploy_group"),
    (re.compile(r"--only functions:"), "旧グループ別 --only functions:<name>"),
    (re.compile(r"--force"), "--force 引数"),
)


def _iter_deploy_action_step_lines(lines: list[str]) -> Iterator[list[str]]:
    """`uses: ./.github/actions/deploy` を含むステップの子行を yield する。"""
    i = 0
    while i < len(lines):
        if not lines[i].strip().startswith("- name:"):
            i += 1
            continue

        base_indent = len(lines[i]) - len(lines[i].lstrip())
        step_lines: list[str] = []
        i += 1
        while i < len(lines):
            if lines[i].strip() == "":
                i += 1
                continue
            indent = len(lines[i]) - len(lines[i].lstrip())
            if indent <= base_indent:
                break
            step_lines.append(lines[i])
            i += 1

        block_stripped = {line.strip() for line in step_lines}
        if "uses: ./.github/actions/deploy" in block_stripped:
            yield step_lines


def _parse_with_args(step_lines: list[str]) -> str | None:
    """Deploy ステップの `with:` 直下にある `args:` の値を返す。"""
    in_with = False
    with_indent = -1
    for line in step_lines:
        stripped = line.strip()
        if not stripped:
            continue
        indent = len(line) - len(line.lstrip())
        if stripped == "with:":
            in_with = True
            with_indent = indent
            continue
        if not in_with:
            continue
        if indent <= with_indent:
            break
        if stripped.startswith("args:"):
            return stripped.split(":", 1)[1].strip().strip("'\"")
    return None


def parse_deploy_step_args_list(deploy_path: Path) -> list[str | None]:
    """./.github/actions/deploy ステップごとの with.args（未設定は None）を全件返す。"""
    lines = deploy_path.read_text(encoding="utf-8").splitlines()
    return [_parse_with_args(step_lines) for step_lines in _iter_deploy_action_step_lines(lines)]


def parse_index_exports(index_path: Path) -> set[str]:
    text = index_path.read_text(encoding="utf-8")
    match = EXPORT_BLOCK_RE.search(text)
    if match is None:
        raise ValueError(f"export const {{ ... }} ブロックが見つかりません: {index_path}")

    names: set[str] = set()
    for line in match.group(1).splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("//"):
            continue
        for part in stripped.split(","):
            name = re.sub(r"//.*", "", part).strip()
            if not name:
                continue
            if not re.fullmatch(r"[a-zA-Z_][a-zA-Z0-9_]*", name):
                raise ValueError(f"export 名の解析に失敗しました: {name!r} ({index_path})")
            names.add(name)
    return names


def parse_firebase_functions_config(firebase_path: Path) -> tuple[list[str], list[str]]:
    data = json.loads(firebase_path.read_text(encoding="utf-8"))
    functions = data.get("functions")
    if not isinstance(functions, list):
        raise ValueError(f"firebase.json に functions 配列がありません: {firebase_path}")

    codebases: list[str] = []
    sources: list[str] = []
    for entry in functions:
        if not isinstance(entry, dict):
            raise ValueError(f"firebase.json functions エントリが不正です: {firebase_path}")
        codebase = entry.get("codebase")
        if not isinstance(codebase, str) or not codebase:
            raise ValueError(f"firebase.json functions に codebase がありません: {firebase_path}")
        source = entry.get("source")
        if not isinstance(source, str) or not source:
            raise ValueError(f"firebase.json functions に source がありません: {firebase_path}")
        codebases.append(codebase)
        sources.append(source)
    return codebases, sources


def collect_deploy_config_errors(
    deploy_path: Path,
    index_path: Path,
    firebase_path: Path,
) -> list[str]:
    errors: list[str] = []
    deploy_text = deploy_path.read_text(encoding="utf-8")

    for pattern, label in FORBIDDEN_DEPLOY_PATTERNS:
        if pattern.search(deploy_text):
            errors.append(
                f"deploy_functions.yml に廃止された設定が残っています: {label}\n"
                f"  → 1 ジョブ + args: '--only functions'（--force なし）に統一してください。"
            )

    deploy_args_list = parse_deploy_step_args_list(deploy_path)
    if not deploy_args_list:
        errors.append(
            "deploy_functions.yml に `./.github/actions/deploy` を使う "
            "デプロイステップが見つかりません。"
        )
    elif len(deploy_args_list) != 1:
        errors.append(
            "deploy_functions.yml の `./.github/actions/deploy` ステップは "
            f"1 件である必要があります（実際: {len(deploy_args_list)} 件）。"
        )
    elif deploy_args_list[0] != "--only functions":
        errors.append(
            "Deploy to Firebase ステップの args が `--only functions` ではありません:\n"
            f"  → 実際の値: {deploy_args_list[0]!r}"
        )

    try:
        exports = parse_index_exports(index_path)
        if not exports:
            errors.append(f"index.ts に export がありません: {index_path}")
    except ValueError as exc:
        errors.append(str(exc))

    firebase_config_ok = False
    try:
        codebases, sources = parse_firebase_functions_config(firebase_path)
        firebase_config_ok = True
    except (ValueError, json.JSONDecodeError) as exc:
        errors.append(str(exc))
        codebases = []
        sources = []

    if firebase_config_ok:
        if not codebases:
            errors.append(f"firebase.json functions が空です: {firebase_path}")
        elif codebases != ["default"]:
            errors.append(
                "firebase.json の functions codebase が default 単一ではありません:\n"
                + "\n".join(f"  - {name}" for name in codebases)
            )

        if sources and sources != ["functions/default"]:
            errors.append(
                "firebase.json の functions source が functions/default 単一ではありません:\n"
                + "\n".join(f"  - {name}" for name in sources)
            )

    return errors


def verify(
    index_path: Path | None = None,
    deploy_path: Path | None = None,
    firebase_path: Path | None = None,
) -> int:
    index_path = index_path or DEFAULT_INDEX_TS
    deploy_path = deploy_path or DEFAULT_DEPLOY_YML
    firebase_path = firebase_path or DEFAULT_FIREBASE_JSON

    for path, label in (
        (index_path, "index.ts"),
        (deploy_path, "deploy_functions.yml"),
        (firebase_path, "firebase.json"),
    ):
        if not path.is_file():
            print(f"ERROR: {label} が見つかりません: {path}", file=sys.stderr)
            return 1

    errors = collect_deploy_config_errors(deploy_path, index_path, firebase_path)

    if errors:
        print("Functions deploy 設定チェックに失敗しました:\n", file=sys.stderr)
        for i, err in enumerate(errors, start=1):
            print(f"{i}. {err}\n", file=sys.stderr)
        print(
            "参照: .agents/skills/shokujii-functions-implementation/SKILL.md "
            "（CI デプロイ）",
            file=sys.stderr,
        )
        return 1

    exports = parse_index_exports(index_path)
    print(
        f"OK: deploy_functions.yml は 1 ジョブ + --only functions（--force なし）。"
        f" index.ts export {len(exports)} 件、firebase.json codebase: default。"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(verify())
