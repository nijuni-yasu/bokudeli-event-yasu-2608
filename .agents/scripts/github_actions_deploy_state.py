#!/usr/bin/env python3
"""GitHub Actions deploy watcher の state ファイル操作。"""

from __future__ import annotations

import argparse
import fcntl
import json
import os
import signal
import subprocess
import sys
from collections.abc import Callable
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

WATCHER_SCRIPT = "github_actions_deploy_watch.sh"
STATE_LOCK_SUFFIX = ".lock"


@contextmanager
def _state_lock(*, state_path: Path):
    state_path.parent.mkdir(parents=True, exist_ok=True)
    lock_path = Path(f"{state_path}{STATE_LOCK_SUFFIX}")
    with lock_path.open("a", encoding="utf-8") as lock_fh:
        fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_fh.fileno(), fcntl.LOCK_UN)


def _load_entries(state_path: Path) -> list[dict[str, Any]]:
    if not state_path.exists():
        return []
    try:
        data = json.loads(state_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return data


def _save_entries(state_path: Path, entries: list[dict[str, Any]]) -> None:
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(
        json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def update_entries(
    state_path: Path,
    mutator: Callable[[list[dict[str, Any]]], Any],
) -> Any:
    with _state_lock(state_path=state_path):
        entries = _load_entries(state_path)
        result = mutator(entries)
        _save_entries(state_path, entries)
        return result


def _get_process_command(pid: int) -> str | None:
    proc_path = Path(f"/proc/{pid}/cmdline")
    if proc_path.exists():
        try:
            raw = proc_path.read_bytes()
        except OSError:
            return None
        if not raw:
            return None
        return raw.replace(b"\0", b" ").decode(errors="replace").strip()

    proc = subprocess.run(
        ["ps", "-p", str(pid), "-o", "args="],
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        return None
    cmdline = proc.stdout.strip()
    return cmdline or None


def _is_target_watcher(pid: int, entry: dict[str, Any]) -> bool:
    if not isinstance(pid, int) or pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except ProcessLookupError:
        return False
    except PermissionError:
        return False

    expected = entry.get("command") or WATCHER_SCRIPT
    cmdline = _get_process_command(pid)
    if cmdline is None:
        return False
    return expected in cmdline


def stop_existing_for_deploy(state_path: Path, deploy_id: str) -> None:
    def mutator(entries: list[dict[str, Any]]) -> None:
        kept: list[dict[str, Any]] = []
        for entry in entries:
            if entry.get("deploy_id") != deploy_id:
                kept.append(entry)
                continue
            if entry.get("status") == "running":
                pid = entry.get("pid")
                if isinstance(pid, int) and _is_target_watcher(pid, entry):
                    try:
                        os.kill(pid, signal.SIGTERM)
                    except ProcessLookupError:
                        pass
                    except PermissionError:
                        pass
        entries.clear()
        entries.extend(kept)

    update_entries(state_path, mutator)


def register_watcher(
    state_path: Path,
    *,
    deploy_id: str,
    since: str,
    owner: str,
    repo: str,
    ref: str,
    pid: int,
    command: str = WATCHER_SCRIPT,
) -> None:
    def mutator(entries: list[dict[str, Any]]) -> None:
        entries.append(
            {
                "deploy_id": deploy_id,
                "since": since,
                "owner": owner,
                "repo": repo,
                "ref": ref,
                "pid": pid,
                "command": command,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "status": "running",
            }
        )

    update_entries(state_path, mutator)


def unregister_watcher(state_path: Path, *, pid: int, final_status: str) -> None:
    def mutator(entries: list[dict[str, Any]]) -> None:
        kept: list[dict[str, Any]] = []
        for entry in entries:
            if entry.get("pid") == pid:
                entry["status"] = final_status
                entry["finished_at"] = datetime.now(timezone.utc).isoformat()
                if final_status != "running":
                    continue
            kept.append(entry)
        entries.clear()
        entries.extend(kept)

    update_entries(state_path, mutator)


def main() -> int:
    parser = argparse.ArgumentParser(description="GitHub Actions deploy watcher state")
    sub = parser.add_subparsers(dest="command", required=True)

    stop_p = sub.add_parser("stop", help="Stop running watchers for a deploy_id")
    stop_p.add_argument("--state-file", type=Path, required=True)
    stop_p.add_argument("--deploy-id", required=True)

    reg_p = sub.add_parser("register", help="Register a watcher PID")
    reg_p.add_argument("--state-file", type=Path, required=True)
    reg_p.add_argument("--deploy-id", required=True)
    reg_p.add_argument("--since", required=True)
    reg_p.add_argument("--owner", required=True)
    reg_p.add_argument("--repo", required=True)
    reg_p.add_argument("--ref", required=True)
    reg_p.add_argument("--pid", type=int, required=True)
    reg_p.add_argument("--watcher-command", default=WATCHER_SCRIPT, dest="watcher_command")

    unreg_p = sub.add_parser("unregister", help="Unregister a watcher PID")
    unreg_p.add_argument("--state-file", type=Path, required=True)
    unreg_p.add_argument("--pid", type=int, required=True)
    unreg_p.add_argument("--status", required=True)

    args = parser.parse_args()

    if args.command == "stop":
        stop_existing_for_deploy(args.state_file, args.deploy_id)
    elif args.command == "register":
        register_watcher(
            args.state_file,
            deploy_id=args.deploy_id,
            since=args.since,
            owner=args.owner,
            repo=args.repo,
            ref=args.ref,
            pid=args.pid,
            command=args.watcher_command,
        )
    elif args.command == "unregister":
        unregister_watcher(args.state_file, pid=args.pid, final_status=args.status)

    return 0


if __name__ == "__main__":
    sys.exit(main())
