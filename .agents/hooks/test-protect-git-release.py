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
    ("git push origin HEAD:refs/heads/main", "block"),
    ("git push origin refs/heads/development", "block"),
    ("git push origin v2.6.0", "block"),
    ("git push origin --tags", "block"),
    ("git push origin --follow-tags", "block"),
    ("git push origin refs/tags/v2.6.0", "block"),
    ("git push origin HEAD:release/2.6.0", "allow"),
    ("git push origin HEAD:sync/main-to-development", "allow"),
    ("git push origin HEAD:hotfix/1910", "allow"),
    ("git push origin feature:main", "block"),
    ("git push origin feature:development", "block"),
    ("git push origin feature:refs/heads/main", "block"),
    ("git push origin feature:release/2170", "allow"),
    ("git push origin :main", "block"),
    ("git push origin :refs/heads/development", "block"),
    ("git commit -a -m 'wip'", "block"),
    ("git commit --all", "block"),
    ("git commit -am 'wip'", "block"),
    ("/usr/bin/git push origin main", "block"),
    ("/usr/bin/git add .env.development", "block"),
    (
        'git commit -m "explain commit -a flag in docs"',
        "allow",
    ),
    ("git branch -f production v2.5.3", "block"),
    ("git commit -m 'wip'", "allow"),
    ("git add .env.development", "block"),
    ("git add partner/.secret", "block"),
    ("git add .firebaserc", "block"),
    ("git add .", "block"),
    ("git add -A", "block"),
    ("git add --all", "block"),
    ("git add -f .env.development", "block"),
    ("git add -N partner/.secret", "block"),
    ("git add ./", "block"),
    ("git add ..", "block"),
    ("git add -- .", "block"),
    ("git add :/", "block"),
    ("git add -u", "block"),
    ("git add --update", "block"),
    ("git add server.pem", "block"),
    ("git -C /tmp/repo add .env.development", "block"),
    ("git add user/src/foo.ts", "allow"),
    ("git add -N .env.development", "block"),
    ("git add -f partner/.secret", "block"),
    ("git -c core.quotepath=false add .env.development", "block"),
    ("GIT_DIR=/tmp/repo git add partner/.secret", "block"),
    ("false | git add .env.development", "block"),
    ("git add common/src/api.keys.ts", "allow"),
    (
        'git commit -m "explain; git add .env in docs"',
        "allow",
    ),
    (
        'git commit -m "git add . のブロックを説明"',
        "allow",
    ),
    ("false || git add .env.development", "block"),
    ("true || git add .secret", "block"),
    ("git add ../", "block"),
    ("git add -- ../", "block"),
    ('git commit -m \'fix || git add .env\'', "allow"),
    ("git --git-dir /tmp/repo add .env.development", "block"),
    ("git add partner/.secret user/src/foo.ts", "block"),
    ("git add .env otherfile", "block"),
    ("git add server.pem otherfile", "block"),
    ("git add -p", "block"),
    ("git add --patch", "block"),
    ("git add -p .env.development", "block"),
    ("grep -r git add .env", "allow"),
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
