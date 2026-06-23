#!/usr/bin/env python3
"""AI PR レビュー watcher の state ファイル操作。"""

from __future__ import annotations

import argparse
import json
import os
import signal
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

WATCHER_SCRIPT = "wait-ai-pr-review-watch.sh"


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


def stop_existing_for_pr(state_path: Path, pr: int) -> None:
    entries = _load_entries(state_path)
    kept: list[dict[str, Any]] = []
    for entry in entries:
        if entry.get("pr") != pr:
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
    _save_entries(state_path, kept)


def register_watcher(
    state_path: Path,
    *,
    pr: int,
    since: str,
    owner: str,
    repo: str,
    pid: int,
    command: str = WATCHER_SCRIPT,
) -> None:
    entries = _load_entries(state_path)
    entries.append(
        {
            "pr": pr,
            "since": since,
            "owner": owner,
            "repo": repo,
            "pid": pid,
            "command": command,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "status": "running",
        }
    )
    _save_entries(state_path, entries)


def unregister_watcher(state_path: Path, *, pid: int, final_status: str) -> None:
    entries = _load_entries(state_path)
    kept: list[dict[str, Any]] = []
    for entry in entries:
        if entry.get("pid") == pid:
            entry["status"] = final_status
            entry["finished_at"] = datetime.now(timezone.utc).isoformat()
            if final_status != "running":
                continue
        kept.append(entry)
    _save_entries(state_path, kept)


def main() -> int:
    parser = argparse.ArgumentParser(description="AI PR review watcher state")
    sub = parser.add_subparsers(dest="command", required=True)

    stop_p = sub.add_parser("stop", help="Stop running watchers for a PR")
    stop_p.add_argument("--state-file", type=Path, required=True)
    stop_p.add_argument("--pr", type=int, required=True)

    reg_p = sub.add_parser("register", help="Register a watcher PID")
    reg_p.add_argument("--state-file", type=Path, required=True)
    reg_p.add_argument("--pr", type=int, required=True)
    reg_p.add_argument("--since", required=True)
    reg_p.add_argument("--owner", required=True)
    reg_p.add_argument("--repo", required=True)
    reg_p.add_argument("--pid", type=int, required=True)
    reg_p.add_argument("--command", default=WATCHER_SCRIPT)

    unreg_p = sub.add_parser("unregister", help="Unregister a watcher PID")
    unreg_p.add_argument("--state-file", type=Path, required=True)
    unreg_p.add_argument("--pid", type=int, required=True)
    unreg_p.add_argument("--status", required=True)

    args = parser.parse_args()

    if args.command == "stop":
        stop_existing_for_pr(args.state_file, args.pr)
    elif args.command == "register":
        register_watcher(
            args.state_file,
            pr=args.pr,
            since=args.since,
            owner=args.owner,
            repo=args.repo,
            pid=args.pid,
            command=args.command,
        )
    elif args.command == "unregister":
        unregister_watcher(args.state_file, pid=args.pid, final_status=args.status)

    return 0


if __name__ == "__main__":
    sys.exit(main())
