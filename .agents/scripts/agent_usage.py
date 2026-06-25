#!/usr/bin/env python3
"""Agent 使用量トラッキング CLI。"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import agent_usage_lib as lib  # noqa: E402


def _read_stdin_json() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    return json.loads(raw)


def cmd_record(args: argparse.Namespace) -> int:
    payload = _read_stdin_json()
    platform = args.platform
    event = args.event

    if event == "task_start":
        lib.record_task_start(payload, platform=platform)
    elif event == "turn_end":
        lib.record_turn_end(payload, platform=platform)
    elif event == "shell":
        lib.record_shell(payload, platform=platform)
    elif event == "compact":
        lib.record_compact(payload, platform=platform)
    elif event == "session_end":
        lib.record_session_end(payload, platform=platform)
    else:
        print(f"Unknown event: {event}", file=sys.stderr)
        return 1

    return 0


def cmd_stop(args: argparse.Namespace) -> int:
    payload = _read_stdin_json()
    result = lib.process_stop_hook(payload, platform=args.platform)
    print(json.dumps(result, ensure_ascii=False))
    return 0


def cmd_report(args: argparse.Namespace) -> int:
    entries = lib.load_ledger()

    conversation_id = args.conversation
    if args.last_session:
        conversation_id = lib.last_session_id()
        if not conversation_id:
            print("No session found in ledger.", file=sys.stderr)
            return 1

    since = None
    if args.since:
        try:
            since = lib.parse_since(args.since)
        except ValueError as exc:
            print(f"Invalid --since: {exc}", file=sys.stderr)
            return 1

    filtered = lib.filter_entries(
        entries,
        conversation_id=conversation_id,
        task_id=args.task,
        task_skill=args.skill,
        since=since,
    )

    if not filtered:
        print("No matching ledger entries.", file=sys.stderr)
        return 1

    title = args.skill or args.task or conversation_id or "report"
    print(lib.render_report_markdown(title=str(title), entries=filtered))
    return 0


def cmd_summary(args: argparse.Namespace) -> int:
    payload = {"session_id": args.session_id, "conversation_id": args.session_id}
    if args.duration_ms is not None:
        payload["duration_ms"] = args.duration_ms
    path = lib.record_session_end(payload, platform=args.platform)
    if path:
        print(path)
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Agent usage tracking")
    sub = parser.add_subparsers(dest="command", required=True)

    record_p = sub.add_parser("record", help="Record a hook event from stdin JSON")
    record_p.add_argument(
        "--event",
        required=True,
        choices=("task_start", "turn_end", "shell", "compact", "session_end"),
    )
    record_p.add_argument("--platform", required=True, choices=("cursor", "claude"))

    report_p = sub.add_parser("report", help="Print usage report markdown")
    report_p.add_argument("--conversation")
    report_p.add_argument("--task")
    report_p.add_argument("--skill")
    report_p.add_argument("--since", help="e.g. 7d, 24h, or ISO8601")
    report_p.add_argument(
        "--last-session", action="store_true", help="Report the most recent session"
    )

    summary_p = sub.add_parser("summary", help="Write session summary report")
    summary_p.add_argument("--session-id", required=True)
    summary_p.add_argument("--platform", default="cursor", choices=("cursor", "claude"))
    summary_p.add_argument("--duration-ms", type=int)

    stop_p = sub.add_parser("stop", help="Process stop hook: record turn + optional followup_message")
    stop_p.add_argument("--platform", required=True, choices=("cursor", "claude"))

    args = parser.parse_args()

    if args.command == "record":
        return cmd_record(args)
    if args.command == "stop":
        return cmd_stop(args)
    if args.command == "report":
        return cmd_report(args)
    if args.command == "summary":
        return cmd_summary(args)

    return 1


if __name__ == "__main__":
    sys.exit(main())
