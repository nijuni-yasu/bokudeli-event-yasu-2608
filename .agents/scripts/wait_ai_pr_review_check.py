#!/usr/bin/env python3
"""AI PR レビュー完了判定（1 回分）。wait-ai-pr-review-check.sh から呼ぶ。"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

MIN_WAIT_SEC = 180
QUIET_SEC = 120
CODEX_TERMINAL_QUIET_SEC = 300
CODEX_GIVEUP_SEC = 720
TIMEOUT_SEC = 1200
POLL_SEC = 60

DEFAULT_OWNER = "nijuniinc"
DEFAULT_REPO = "bokudeli-event-new"

REQUEST_PREFIX = "@copilot @codex review"


@dataclass
class Event:
    reviewer: str  # copilot | codex
    created_at: datetime
    kind: str  # issue | inline | review
    body: str
    category: str  # substantive | no_issues | limit | connect | request | boilerplate


def parse_ts(value: str) -> datetime:
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def classify_reviewer(login: str) -> str | None:
    lower = (login or "").lower()
    if "copilot" in lower:
        return "copilot"
    if "codex" in lower:
        return "codex"
    return None


def classify_body(body: str) -> str:
    text = body or ""
    stripped = text.strip()
    if stripped.startswith(REQUEST_PREFIX):
        return "request"
    if re.search(r"usage limits for code reviews", text, re.I):
        return "limit"
    if re.search(
        r"Copilot encountered an error and was unable to review", text, re.I
    ):
        return "limit"
    if re.search(r"create a Codex account and connect|To use Codex here", text, re.I):
        return "connect"
    if re.search(r"About Codex in GitHub", text) and not re.search(
        r"P[0-3]|must|should|recommend|bug|issue|problem|修正|問題|指摘|generated \d+ comment",
        text,
        re.I,
    ):
        return "boilerplate"
    if "Didn't find any major issues" in text and len(text) < 700:
        return "no_issues"
    return "substantive"


def gh_api(path: str, *, paginate: bool = False) -> list[dict[str, Any]]:
    cmd = ["gh", "api", path]
    if paginate:
        cmd.extend(["--paginate", "--slurp"])
    proc = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"gh api failed: {path}")
    try:
        data = json.loads(proc.stdout or "[]")
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"gh api returned invalid JSON: {path}") from exc
    if paginate:
        if not isinstance(data, list):
            raise RuntimeError(f"gh api paginate expected list: {path}")
        return [item for page in data for item in page]
    if isinstance(data, dict):
        return [data]
    return data


def fetch_live_events(owner: str, repo: str, pr: int) -> list[Event]:
    events: list[Event] = []
    base = f"repos/{owner}/{repo}"

    for item in gh_api(f"{base}/issues/{pr}/comments", paginate=True):
        rev = classify_reviewer((item.get("user") or {}).get("login", ""))
        if rev:
            events.append(
                Event(
                    reviewer=rev,
                    created_at=parse_ts(item["created_at"]),
                    kind="issue",
                    body=item.get("body") or "",
                    category=classify_body(item.get("body") or ""),
                )
            )

    for item in gh_api(f"{base}/pulls/{pr}/comments", paginate=True):
        rev = classify_reviewer((item.get("user") or {}).get("login", ""))
        if rev:
            events.append(
                Event(
                    reviewer=rev,
                    created_at=parse_ts(item["created_at"]),
                    kind="inline",
                    body=item.get("body") or "",
                    category=classify_body(item.get("body") or ""),
                )
            )

    for item in gh_api(f"{base}/pulls/{pr}/reviews", paginate=True):
        rev = classify_reviewer((item.get("user") or {}).get("login", ""))
        submitted = item.get("submitted_at")
        if rev and submitted:
            events.append(
                Event(
                    reviewer=rev,
                    created_at=parse_ts(submitted),
                    kind="review",
                    body=item.get("body") or "",
                    category=classify_body(item.get("body") or ""),
                )
            )

    return events


def load_fixture_events(path: Path) -> list[Event]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    events: list[Event] = []
    for item in raw:
        rev = item.get("reviewer") or classify_reviewer(item.get("login", ""))
        if not rev:
            continue
        body = item.get("body") or ""
        events.append(
            Event(
                reviewer=rev,
                created_at=parse_ts(item["created_at"]),
                kind=item.get("kind", "issue"),
                body=body,
                category=item.get("category") or classify_body(body),
            )
        )
    return events


def reviewer_summary(events: list[Event], reviewer: str) -> dict[str, Any]:
    subs = [e for e in events if e.reviewer == reviewer and e.category == "substantive"]
    no_issues = [e for e in events if e.reviewer == reviewer and e.category == "no_issues"]
    limits = [e for e in events if e.reviewer == reviewer and e.category == "limit"]
    connects = [e for e in events if e.reviewer == reviewer and e.category == "connect"]
    reviewed = len(subs) > 0 or len(no_issues) > 0
    return {
        "substantive": len(subs) > 0,
        "substantive_count": len(subs),
        "no_issues": len(no_issues) > 0,
        "reviewed": reviewed,
        "limit_only": len(limits) > 0 and not reviewed,
        "connect_only": len(connects) > 0 and not reviewed,
        "last_event_at": max((e.created_at for e in events if e.reviewer == reviewer), default=None),
    }


def evaluate(
    since: datetime,
    events: list[Event],
    *,
    now: datetime | None = None,
    elapsed_override: int | None = None,
) -> tuple[int, dict[str, Any]]:
    now = now or datetime.now(timezone.utc)
    since = since.astimezone(timezone.utc)

    if elapsed_override is not None:
        now = since + timedelta(seconds=elapsed_override)

    filtered = [e for e in events if e.created_at >= since and e.category != "request"]
    filtered.sort(key=lambda e: e.created_at)

    elapsed_sec = (
        elapsed_override
        if elapsed_override is not None
        else int((now - since).total_seconds())
    )

    copilot = reviewer_summary(filtered, "copilot")
    codex = reviewer_summary(filtered, "codex")

    ai_events = [
        e
        for e in filtered
        if e.category in ("substantive", "no_issues", "limit", "connect", "boilerplate")
    ]
    last_ai_at = max((e.created_at for e in ai_events), default=None)
    quiet_ok = (
        last_ai_at is None
        or int((now - last_ai_at).total_seconds()) >= QUIET_SEC
    )

    codex_events = [e for e in filtered if e.reviewer == "codex"]
    codex_silent = len(codex_events) == 0
    codex_has_terminal = any(
        e.reviewer == "codex" and e.category in ("limit", "connect") for e in filtered
    )
    codex_terminal_events = [
        e for e in filtered if e.reviewer == "codex" and e.category in ("limit", "connect")
    ]
    last_codex_terminal_at = max((e.created_at for e in codex_terminal_events), default=None)
    codex_terminal_quiet_ok = (
        not codex_has_terminal
        or last_codex_terminal_at is None
        or int((now - last_codex_terminal_at).total_seconds()) >= CODEX_TERMINAL_QUIET_SEC
    )

    codex_done = (
        codex["reviewed"]
        or (codex_has_terminal and quiet_ok and codex_terminal_quiet_ok)
        or (codex_silent and elapsed_sec >= CODEX_GIVEUP_SEC)
    )

    complete = (
        elapsed_sec >= MIN_WAIT_SEC
        and copilot["reviewed"]
        and codex_done
        and quiet_ok
    )

    partial = codex_done and not codex["substantive"]

    result: dict[str, Any] = {
        "status": "waiting",
        "elapsed_sec": elapsed_sec,
        "partial": False,
        "copilot": {
            "substantive": copilot["substantive"],
            "substantive_count": copilot["substantive_count"],
            "no_issues": copilot["no_issues"],
            "reviewed": copilot["reviewed"],
        },
        "codex_silent": codex_silent,
        "codex_has_terminal": codex_has_terminal,
        "codex": {
            "substantive": codex["substantive"],
            "substantive_count": codex["substantive_count"],
            "no_issues": codex["no_issues"],
            "reviewed": codex["reviewed"],
            "limit_only": codex["limit_only"],
            "connect_only": codex["connect_only"],
            "silent": codex_silent,
            "skipped": partial and codex_done,
        },
        "quiet_ok": quiet_ok,
        "codex_terminal_quiet_ok": codex_terminal_quiet_ok,
        "min_wait_ok": elapsed_sec >= MIN_WAIT_SEC,
        "timeout_ok": elapsed_sec >= TIMEOUT_SEC,
    }

    if complete:
        result["status"] = "complete"
        result["partial"] = partial
        return 0, result

    if elapsed_sec >= TIMEOUT_SEC:
        result["status"] = "timeout"
        result["partial"] = partial or not codex["substantive"]
        return 2, result

    return 1, result


def print_shell_constants() -> None:
    print(f"MIN_WAIT_SEC={MIN_WAIT_SEC}")
    print(f"POLL_SEC={POLL_SEC}")
    print(f"TIMEOUT_SEC={TIMEOUT_SEC}")


def elapsed_since_request(since_str: str) -> int:
    since = parse_ts(since_str)
    return int((datetime.now(timezone.utc) - since).total_seconds())


def main() -> int:
    if "--print-shell-constants" in sys.argv:
        print_shell_constants()
        return 0

    parser = argparse.ArgumentParser(description="AI PR review completion check")
    parser.add_argument("--print-elapsed-sec", action="store_true")
    parser.add_argument("--pr", type=int)
    parser.add_argument("--since", required=True, help="ISO8601 UTC review request time")
    parser.add_argument("--owner", default=DEFAULT_OWNER)
    parser.add_argument("--repo", default=DEFAULT_REPO)
    parser.add_argument(
        "--fixtures",
        type=Path,
        help="Fixture JSON path (test mode; skips gh api)",
    )
    parser.add_argument(
        "--now",
        help="Override current time ISO8601 (tests)",
    )
    parser.add_argument(
        "--elapsed-sec",
        type=int,
        help="Override elapsed seconds (tests)",
    )
    args = parser.parse_args()

    if args.print_elapsed_sec:
        print(elapsed_since_request(args.since))
        return 0

    if args.pr is None:
        parser.error("--pr is required unless --print-elapsed-sec is set")

    since = parse_ts(args.since)

    try:
        if args.fixtures:
            events = load_fixture_events(args.fixtures)
        else:
            events = fetch_live_events(args.owner, args.repo, args.pr)
    except RuntimeError as exc:
        out = {"status": "error", "message": str(exc)}
        print(json.dumps(out, ensure_ascii=False))
        return 3

    now = parse_ts(args.now) if args.now else None
    code, result = evaluate(
        since,
        events,
        now=now,
        elapsed_override=args.elapsed_sec,
    )
    result["pr"] = args.pr
    result["since"] = since.isoformat()
    print(json.dumps(result, ensure_ascii=False))
    return code


if __name__ == "__main__":
    sys.exit(main())
