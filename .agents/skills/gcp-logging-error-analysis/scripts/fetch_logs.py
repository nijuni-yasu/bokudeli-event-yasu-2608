#!/usr/bin/env python3
"""Fetch GCP Cloud Logging ERROR entries via gcloud logging read."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

JST = ZoneInfo("Asia/Tokyo")
DEFAULT_LIMIT = 200
GCLOUD_TIMEOUT_SEC = 120
PARSE_TIMEOUT_SEC = 60


def parse_jst_datetime(value: str) -> datetime:
    """Parse YYYY-MM-DD HH:MM or YYYY-MM-DDTHH:MM in JST."""
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            naive = datetime.strptime(value, fmt)
            return naive.replace(tzinfo=JST)
        except ValueError:
            continue
    raise ValueError(f"Invalid JST datetime: {value!r}. Use YYYY-MM-DD HH:MM")


def to_utc_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def build_filter(
    base_filter: str,
    start_utc: datetime | None,
    end_utc: datetime | None,
) -> str:
    parts = [base_filter]
    if start_utc is not None:
        parts.append(f'timestamp>="{to_utc_iso(start_utc)}"')
    if end_utc is not None:
        parts.append(f'timestamp<"{to_utc_iso(end_utc)}"')
    return " AND ".join(parts)


def fetch_logs(
    project_id: str,
    log_filter: str,
    limit: int,
    freshness: str | None,
) -> list[dict]:
    cmd = [
        "gcloud",
        "logging",
        "read",
        log_filter,
        f"--project={project_id}",
        f"--limit={limit}",
        "--format=json",
    ]
    if freshness is not None:
        cmd.insert(-2, f"--freshness={freshness}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=False,
            timeout=GCLOUD_TIMEOUT_SEC,
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError(
            f"gcloud logging read timed out after {GCLOUD_TIMEOUT_SEC}s",
        ) from exc
    if result.returncode != 0:
        stderr = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"gcloud logging read failed: {stderr}")

    raw = result.stdout.strip()
    if raw == "" or raw == "[]":
        return []
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("gcloud output is not a JSON array")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch ERROR logs from GCP Cloud Logging via gcloud",
    )
    parser.add_argument("--project", required=True, help="GCP project ID")
    parser.add_argument(
        "--filter",
        default='severity="ERROR"',
        help='Logging filter (default: severity="ERROR")',
    )
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument(
        "--freshness",
        help='Relative window e.g. 1h, 1d. Ignored when --from-utc/--to-utc or --jst-* set',
    )
    parser.add_argument("--from-utc", help="Start inclusive UTC ISO8601 e.g. 2026-07-02T06:00:00Z")
    parser.add_argument("--to-utc", help="End exclusive UTC ISO8601 e.g. 2026-07-02T07:00:00Z")
    parser.add_argument("--jst-from", help="Start inclusive JST e.g. 2026-07-02 15:00")
    parser.add_argument("--jst-to", help="End exclusive JST e.g. 2026-07-02 16:00")
    parser.add_argument(
        "-o",
        "--output",
        help="Write JSON to file (default: stdout)",
    )
    parser.add_argument(
        "--parse",
        action="store_true",
        help="Run parse_logs.py on fetched JSON and print markdown summary",
    )
    args = parser.parse_args()

    start_utc: datetime | None = None
    end_utc: datetime | None = None
    freshness = args.freshness

    if args.jst_from or args.jst_to:
        if not args.jst_from or not args.jst_to:
            parser.error("--jst-from and --jst-to must be used together")
        start_utc = parse_jst_datetime(args.jst_from)
        end_utc = parse_jst_datetime(args.jst_to)
        freshness = None
    elif args.from_utc or args.to_utc:
        if args.from_utc:
            start_utc = datetime.fromisoformat(args.from_utc.replace("Z", "+00:00"))
        if args.to_utc:
            end_utc = datetime.fromisoformat(args.to_utc.replace("Z", "+00:00"))
        freshness = None

    log_filter = build_filter(args.filter, start_utc, end_utc)

    entries = fetch_logs(args.project, log_filter, args.limit, freshness)

    payload = json.dumps(entries, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).write_text(payload + "\n", encoding="utf-8")
        print(f"Wrote {len(entries)} entries to {args.output}", file=sys.stderr)
        print(f"Filter: {log_filter}", file=sys.stderr)
        if start_utc and end_utc:
            print(
                f"JST window: {start_utc.strftime('%Y-%m-%d %H:%M')} .. "
                f"{(end_utc - timedelta(seconds=1)).strftime('%Y-%m-%d %H:%M')} "
                f"(UTC {to_utc_iso(start_utc)} .. {to_utc_iso(end_utc)})",
                file=sys.stderr,
            )
    else:
        print(payload)

    if args.parse:
        parse_script = Path(__file__).resolve().parent / "parse_logs.py"
        parse_input = args.output
        if parse_input is None:
            raise SystemExit("--parse requires --output")
        subprocess.run(
            [sys.executable, str(parse_script), parse_input, "--format", "md"],
            check=True,
            timeout=PARSE_TIMEOUT_SEC,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
