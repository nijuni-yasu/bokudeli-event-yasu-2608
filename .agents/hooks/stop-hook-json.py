#!/usr/bin/env python3
"""Stop hook 用 JSON ヘルパ（jq 未インストール環境のフォールバック）。"""

from __future__ import annotations

import json
import sys


def cmd_parse() -> None:
    data = json.load(sys.stdin)
    status = data.get("status") or data.get("stop_reason") or "completed"
    loop_count = data.get("loop_count", 0)
    conversation_id = data.get("conversation_id") or data.get("session_id") or ""
    print(status)
    print(loop_count)
    print(conversation_id)


def cmd_followup() -> None:
    message = sys.argv[2] if len(sys.argv) > 2 else sys.stdin.read()
    print(json.dumps({"followup_message": message}, ensure_ascii=False))


def cmd_extract_followup() -> None:
    data = json.load(sys.stdin)
    followup = data.get("followup_message") or ""
    if followup:
        print(followup)


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: stop-hook-json.py {parse|followup|extract-followup}", file=sys.stderr)
        return 1
    command = sys.argv[1]
    if command == "parse":
        cmd_parse()
    elif command == "followup":
        cmd_followup()
    elif command == "extract-followup":
        cmd_extract_followup()
    else:
        print(f"unknown command: {command}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
