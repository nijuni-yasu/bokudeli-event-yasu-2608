#!/usr/bin/env python3
"""AI PR レビュー完了後の pending wake（evaluate 未処理）を記録する。"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_PROMPT = "/review-comments-evaluate"


def _load_wakes(wake_path: Path) -> list[dict[str, Any]]:
    if not wake_path.exists():
        return []
    try:
        data = json.loads(wake_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    if isinstance(data, dict):
        return [data]
    if isinstance(data, list):
        return data
    return []


def _save_wakes(wake_path: Path, wakes: list[dict[str, Any]]) -> None:
    wake_path.parent.mkdir(parents=True, exist_ok=True)
    wake_path.write_text(
        json.dumps(wakes, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def write_pending_wake(
    wake_path: Path,
    *,
    pr: int,
    partial: bool,
    since: str,
    owner: str,
    repo: str,
    prompt: str = DEFAULT_PROMPT,
) -> None:
    wakes = _load_wakes(wake_path)
    kept = [w for w in wakes if w.get("pr") != pr]
    kept.append(
        {
            "pr": pr,
            "partial": partial,
            "prompt": prompt,
            "since": since,
            "owner": owner,
            "repo": repo,
            "emitted_at": datetime.now(timezone.utc).isoformat(),
            "consumed": False,
        }
    )
    _save_wakes(wake_path, kept)


def list_unconsumed_wakes(wake_path: Path) -> list[dict[str, Any]]:
    return [w for w in _load_wakes(wake_path) if not w.get("consumed")]


def consume_wake(wake_path: Path, pr: int) -> bool:
    wakes = _load_wakes(wake_path)
    found = False
    for entry in wakes:
        if entry.get("pr") == pr and not entry.get("consumed"):
            entry["consumed"] = True
            entry["consumed_at"] = datetime.now(timezone.utc).isoformat()
            found = True
    if found:
        _save_wakes(wake_path, wakes)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description="AI PR review pending wake state")
    sub = parser.add_subparsers(dest="command", required=True)

    write_p = sub.add_parser("write", help="Record pending evaluate wake")
    write_p.add_argument("--wake-file", type=Path, required=True)
    write_p.add_argument("--pr", type=int, required=True)
    write_p.add_argument("--since", required=True)
    write_p.add_argument("--owner", required=True)
    write_p.add_argument("--repo", required=True)
    write_p.add_argument("--partial", choices=("true", "false"), required=True)
    write_p.add_argument("--prompt", default=DEFAULT_PROMPT)

    list_p = sub.add_parser("list", help="List unconsumed wakes as JSON")
    list_p.add_argument("--wake-file", type=Path, required=True)

    consume_p = sub.add_parser("consume", help="Mark wake consumed for a PR")
    consume_p.add_argument("--wake-file", type=Path, required=True)
    consume_p.add_argument("--pr", type=int, required=True)

    args = parser.parse_args()

    if args.command == "write":
        write_pending_wake(
            args.wake_file,
            pr=args.pr,
            partial=args.partial == "true",
            since=args.since,
            owner=args.owner,
            repo=args.repo,
            prompt=args.prompt,
        )
    elif args.command == "list":
        print(json.dumps(list_unconsumed_wakes(args.wake_file), ensure_ascii=False))
    elif args.command == "consume":
        if not consume_wake(args.wake_file, args.pr):
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
