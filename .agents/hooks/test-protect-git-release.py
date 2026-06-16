#!/usr/bin/env python3
"""protect-git-release の擬似入力テスト（開発用・CI 非対象）

検査ロジック正本（.agents/hooks/protect-git-release-check.sh）と、
Claude / Cursor 各アダプタの両方を検証する。
"""
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CHECK = REPO_ROOT / ".agents/hooks/protect-git-release-check.sh"
CLAUDE_ADAPTER = REPO_ROOT / ".claude/hooks/protect-git-release.sh"
CURSOR_ADAPTER = REPO_ROOT / ".cursor/hooks/protect-git-release.sh"

CASES: list[tuple[str, str]] = [
    ("npm version minor", "block"),
    ("npm version patch", "block"),
    ("npm version prerelease", "block"),
    ("npm version 2.7.0", "block"),
    ("git push origin production", "block"),
    ("git push origin main production v2.6.0", "block"),
    ("git push origin HEAD:development", "block"),
    ("git push origin v2.6.0", "block"),
    ("git push origin --tags", "block"),
    ("git push origin --follow-tags", "block"),
    ("git push origin refs/tags/v2.6.0", "block"),
    ("git push origin HEAD:release/2.6.0", "allow"),
    ("git push origin HEAD:sync/main-to-development", "allow"),
    ("git push origin HEAD:hotfix/1910", "allow"),
    ("git branch -f production v2.5.3", "block"),
    ("git commit -m 'wip'", "allow"),
]


def run_check(cmd: str) -> int:
    proc = subprocess.run(
        ["bash", str(CHECK), cmd], capture_output=True, text=True, check=False
    )
    return proc.returncode


def run_claude(cmd: str) -> int:
    proc = subprocess.run(
        ["bash", str(CLAUDE_ADAPTER)],
        input=json.dumps({"tool_input": {"command": cmd}}),
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.returncode


def run_cursor(cmd: str) -> str:
    """Cursor アダプタは exit 0 + JSON permission を返す。permission を返す。"""
    proc = subprocess.run(
        ["bash", str(CURSOR_ADAPTER)],
        input=json.dumps({"command": cmd}),
        capture_output=True,
        text=True,
        check=False,
    )
    try:
        return json.loads(proc.stdout).get("permission", "?")
    except json.JSONDecodeError:
        return f"INVALID_JSON(rc={proc.returncode})"


def main() -> int:
    failed = 0
    for cmd, expect in CASES:
        # 共通 check: block→2 / allow→0
        check_rc = run_check(cmd)
        check_ok = (expect == "block" and check_rc == 2) or (
            expect == "allow" and check_rc == 0
        )

        # Claude アダプタ: block→2 / allow→0
        claude_rc = run_claude(cmd)
        claude_ok = (expect == "block" and claude_rc == 2) or (
            expect == "allow" and claude_rc == 0
        )

        # Cursor アダプタ: block→deny / allow→allow
        cursor_perm = run_cursor(cmd)
        cursor_ok = (expect == "block" and cursor_perm == "deny") or (
            expect == "allow" and cursor_perm == "allow"
        )

        ok = check_ok and claude_ok and cursor_ok
        if not ok:
            failed += 1
        status = "OK" if ok else "FAIL"
        print(
            f"{status} [{expect}] check={check_rc} claude={claude_rc} "
            f"cursor={cursor_perm}: {cmd}"
        )

    print(f"\n{'PASS' if failed == 0 else 'FAIL'}: {len(CASES) - failed}/{len(CASES)}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
