#!/usr/bin/env python3
"""セルフレビュー pending wake（lint 成功 → review 完了まで）。"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_WAKE_FILE = Path(".agents/state/self-review-pending.json")


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


def branch_to_slug(branch: str) -> str:
    return branch.replace("/", "-")


def write_pending_wake(
    wake_path: Path,
    *,
    branch: str,
    since: str,
    conversation_id: str | None = None,
) -> None:
    slug = branch_to_slug(branch)
    wakes = _load_wakes(wake_path)
    kept = [w for w in wakes if w.get("branch") != branch]
    kept.append(
        {
            "branch": branch,
            "slug": slug,
            "since": since,
            "conversation_id": conversation_id,
            "consumed": False,
            "lint_passed_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    _save_wakes(wake_path, kept)


def list_unconsumed_wakes(wake_path: Path) -> list[dict[str, Any]]:
    return [w for w in _load_wakes(wake_path) if not w.get("consumed")]


def get_wake_for_branch(wake_path: Path, branch: str) -> dict[str, Any] | None:
    for entry in reversed(_load_wakes(wake_path)):
        if entry.get("branch") == branch:
            return entry
    return None


def consume_wake(wake_path: Path, branch: str) -> bool:
    wakes = _load_wakes(wake_path)
    found = False
    for entry in wakes:
        if entry.get("branch") == branch and not entry.get("consumed"):
            entry["consumed"] = True
            entry["consumed_at"] = datetime.now(timezone.utc).isoformat()
            found = True
    if found:
        _save_wakes(wake_path, wakes)
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description="Self-review pending wake state")
    sub = parser.add_subparsers(dest="command", required=True)

    write_p = sub.add_parser("write", help="Record pending self-review wake")
    write_p.add_argument("--wake-file", type=Path, default=DEFAULT_WAKE_FILE)
    write_p.add_argument("--branch", required=True)
    write_p.add_argument("--since", required=True)
    write_p.add_argument("--conversation-id")

    list_p = sub.add_parser("list", help="List unconsumed wakes as JSON")
    list_p.add_argument("--wake-file", type=Path, default=DEFAULT_WAKE_FILE)

    consume_p = sub.add_parser("consume", help="Mark wake consumed for a branch")
    consume_p.add_argument("--wake-file", type=Path, default=DEFAULT_WAKE_FILE)
    consume_p.add_argument("--branch", required=True)

    args = parser.parse_args()

    if args.command == "write":
        write_pending_wake(
            args.wake_file,
            branch=args.branch,
            since=args.since,
            conversation_id=args.conversation_id,
        )
    elif args.command == "list":
        print(json.dumps(list_unconsumed_wakes(args.wake_file), ensure_ascii=False))
    elif args.command == "consume":
        if not consume_wake(args.wake_file, args.branch):
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
