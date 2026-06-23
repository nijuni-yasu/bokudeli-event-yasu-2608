#!/usr/bin/env python3
"""wait-ai-pr-review-check の擬似入力テスト（開発用・CI 非対象）"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECK = REPO_ROOT / ".agents/scripts/wait-ai-pr-review-check.sh"
FIXTURES = REPO_ROOT / ".agents/hooks/fixtures/wait-ai-pr-review"
SINCE = "2026-06-23T05:55:00Z"

CASES: list[tuple[str, str, int, int | None]] = [
    ("codex_limit_only.json", "waiting before min wait", 1, 200),
    ("codex_limit_only.json", "waiting before codex giveup", 1, 600),
    ("codex_limit_only.json", "waiting without copilot", 1, 800),
    ("codex_limit_only.json", "timeout without copilot", 2, 1300),
    ("copilot_only.json", "waiting without quiet", 1, 300),
    ("copilot_only.json", "waiting codex giveup pending", 1, 600),
    ("copilot_only.json", "complete copilot + codex silent", 0, 800),
    ("both_reviewers.json", "complete both reviewers", 0, 820),
    ("codex_connect_copilot_ok.json", "complete copilot + codex skipped", 0, 800),
    ("request_only.json", "waiting request ignored", 1, 300),
    ("request_only.json", "timeout no substantive", 2, 1300),
]


def run_check(fixture: str, elapsed_sec: int | None) -> tuple[int, dict]:
    cmd = [
        str(CHECK),
        "--pr",
        "9999",
        "--since",
        SINCE,
        "--fixtures",
        str(FIXTURES / fixture),
    ]
    if elapsed_sec is not None:
        cmd.extend(["--elapsed-sec", str(elapsed_sec)])
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    payload = json.loads(proc.stdout.strip())
    return proc.returncode, payload


def main() -> int:
    failed = 0
    for fixture, label, expected_code, elapsed in CASES:
        code, payload = run_check(fixture, elapsed)
        ok = code == expected_code
        if (
            fixture == "copilot_only.json"
            and label == "complete copilot + codex silent"
            and code == 0
        ):
            ok = (
                payload.get("partial") is True
                and payload.get("codex_silent") is True
            )
        status = "OK" if ok else "NG"
        print(f"[{status}] {fixture} / {label}: expected={expected_code} actual={code} status={payload.get('status')}")
        if not ok:
            failed += 1
            print(f"  payload={json.dumps(payload, ensure_ascii=False)}")

    if failed:
        print(f"\n{failed} case(s) failed", file=sys.stderr)
        return 1
    print(f"\nAll {len(CASES)} cases passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
