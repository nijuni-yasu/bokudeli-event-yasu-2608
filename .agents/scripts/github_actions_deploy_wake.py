#!/usr/bin/env python3
"""GitHub Actions deploy 完了後の pending wake（結果報告未処理）を記録する。"""

from __future__ import annotations

import argparse
import fcntl
import json
import sys
from collections.abc import Callable
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_PROMPT = "/github-actions-deploy"
WAKE_LOCK_SUFFIX = ".lock"


@contextmanager
def _wake_lock(*, wake_path: Path):
    wake_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = Path(f"{wake_path}{WAKE_LOCK_SUFFIX}")
    with lock_path.open("a", encoding="utf-8") as lock_fh:
        fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_fh.fileno(), fcntl.LOCK_UN)


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


def update_wakes(
    wake_path: Path,
    mutator: Callable[[list[dict[str, Any]]], Any],
) -> Any:
    with _wake_lock(wake_path=wake_path):
        wakes = _load_wakes(wake_path)
        result = mutator(wakes)
        _save_wakes(wake_path, wakes)
        return result


def write_pending_wake(
    wake_path: Path,
    *,
    deploy_id: str,
    owner: str,
    repo: str,
    ref: str,
    since: str,
    results_file: str,
    prompt: str = DEFAULT_PROMPT,
    mode: str = "report",
) -> None:
    def mutator(wakes: list[dict[str, Any]]) -> None:
        kept = [w for w in wakes if w.get("deploy_id") != deploy_id]
        kept.append(
            {
                "deploy_id": deploy_id,
                "owner": owner,
                "repo": repo,
                "ref": ref,
                "since": since,
                "results_file": results_file,
                "prompt": prompt,
                "mode": mode,
                "emitted_at": datetime.now(timezone.utc).isoformat(),
                "consumed": False,
            }
        )
        wakes.clear()
        wakes.extend(kept)
        return None

    update_wakes(wake_path, mutator)


def list_unconsumed_wakes(wake_path: Path) -> list[dict[str, Any]]:
    with _wake_lock(wake_path=wake_path):
        return [w for w in _load_wakes(wake_path) if not w.get("consumed")]


def consume_wake(wake_path: Path, deploy_id: str) -> bool:
    def mutator(wakes: list[dict[str, Any]]) -> bool:
        found = False
        for entry in wakes:
            if entry.get("deploy_id") == deploy_id and not entry.get("consumed"):
                entry["consumed"] = True
                entry["consumed_at"] = datetime.now(timezone.utc).isoformat()
                found = True
        return found

    return bool(update_wakes(wake_path, mutator))


def main() -> int:
    parser = argparse.ArgumentParser(description="GitHub Actions deploy pending wake state")
    sub = parser.add_subparsers(dest="command", required=True)

    write_p = sub.add_parser("write", help="Record pending deploy report wake")
    write_p.add_argument("--wake-file", type=Path, required=True)
    write_p.add_argument("--deploy-id", required=True)
    write_p.add_argument("--since", required=True)
    write_p.add_argument("--owner", required=True)
    write_p.add_argument("--repo", required=True)
    write_p.add_argument("--ref", required=True)
    write_p.add_argument("--results-file", required=True)
    write_p.add_argument("--prompt", default=DEFAULT_PROMPT)
    write_p.add_argument("--mode", default="report")

    list_p = sub.add_parser("list", help="List unconsumed wakes as JSON")
    list_p.add_argument("--wake-file", type=Path, required=True)

    consume_p = sub.add_parser("consume", help="Mark wake consumed for a deploy_id")
    consume_p.add_argument("--wake-file", type=Path, required=True)
    consume_p.add_argument("--deploy-id", required=True)

    args = parser.parse_args()

    if args.command == "write":
        write_pending_wake(
            args.wake_file,
            deploy_id=args.deploy_id,
            since=args.since,
            owner=args.owner,
            repo=args.repo,
            ref=args.ref,
            results_file=args.results_file,
            prompt=args.prompt,
            mode=args.mode,
        )
    elif args.command == "list":
        print(json.dumps(list_unconsumed_wakes(args.wake_file), ensure_ascii=False))
    elif args.command == "consume":
        if not consume_wake(args.wake_file, args.deploy_id):
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
