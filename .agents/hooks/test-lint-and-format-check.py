#!/usr/bin/env python3
"""lint-and-format-check / stop-gate / source-change-detect の開発用テスト。"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
HOOKS = REPO_ROOT / ".agents" / "hooks"
SCRIPTS = REPO_ROOT / ".agents" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import self_review_check_lib as lib  # noqa: E402
import self_review_wake as wake  # noqa: E402


def run(
    cmd: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
    input: str | None = None,
) -> subprocess.CompletedProcess[str]:
    merged = os.environ.copy()
    if env:
        merged.update(env)
    return subprocess.run(
        cmd,
        cwd=cwd,
        env=merged,
        input=input,
        capture_output=True,
        text=True,
        check=False,
    )


def init_git_repo(root: Path) -> None:
    subprocess.run(["git", "init", "-q"], cwd=root, check=True)
    subprocess.run(["git", "config", "user.email", "test@example.com"], cwd=root, check=True)
    subprocess.run(["git", "config", "user.name", "test"], cwd=root, check=True)
    (root / "README.md").write_text("hello\n", encoding="utf-8")
    subprocess.run(["git", "add", "README.md"], cwd=root, check=True)
    subprocess.run(["git", "commit", "-qm", "init"], cwd=root, check=True)


def test_source_change_detect_no_changes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        init_git_repo(root)
        result = run(["bash", str(HOOKS / "source-change-detect.sh")], cwd=root)
        assert result.returncode == 1


def test_source_change_detect_user_change() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        init_git_repo(root)
        user_dir = root / "user" / "src"
        user_dir.mkdir(parents=True)
        (user_dir / "index.ts").write_text("export const x = 1\n", encoding="utf-8")

        result = run(["bash", str(HOOKS / "source-change-detect.sh"), "lint"], cwd=root)
        assert result.returncode == 0


def test_source_change_detect_agents_hooks_review_scope() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        init_git_repo(root)
        hooks_dir = root / ".agents" / "hooks"
        hooks_dir.mkdir(parents=True)
        (hooks_dir / "stop-gate-check.sh").write_text("#!/bin/bash\n", encoding="utf-8")

        lint_result = run(["bash", str(HOOKS / "source-change-detect.sh"), "lint"], cwd=root)
        review_result = run(["bash", str(HOOKS / "source-change-detect.sh"), "review"], cwd=root)
        assert lint_result.returncode == 1
        assert review_result.returncode == 0


def test_lint_and_format_check_skips_without_source_changes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        init_git_repo(root)
        result = run(["bash", str(HOOKS / "lint-and-format-check.sh")], cwd=root)
        assert result.returncode == 0


def test_stop_gate_check_aborted_status() -> None:
    result = run(
        ["bash", str(HOOKS / "stop-gate-check.sh"), "aborted", "0", "conv-1"],
        cwd=REPO_ROOT,
    )
    assert result.returncode == 0
    assert result.stdout.strip() == ""


def test_stop_gate_check_self_review_only_scope() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        init_git_repo(root)
        hooks_dir = root / ".agents" / "hooks"
        hooks_dir.mkdir(parents=True)
        (hooks_dir / "example.sh").write_text("#!/bin/bash\n", encoding="utf-8")

        detect = HOOKS / "source-change-detect.sh"

        # review スコープのみ: gate 対象だが lint スコープ外
        assert run(["bash", str(detect), "review"], cwd=root).returncode == 0
        assert run(["bash", str(detect), "lint"], cwd=root).returncode == 1


def test_cursor_stop_gate_adapter_followup_on_block() -> None:
    adapter = REPO_ROOT / ".cursor" / "hooks" / "stop-gate.sh"
    stdin = json.dumps({"status": "completed", "loop_count": 0, "conversation_id": "conv-test"})

    with tempfile.TemporaryDirectory() as tmp:
        fake_check = Path(tmp) / "stop-gate-check.sh"
        fake_check.write_text(
            "#!/usr/bin/env bash\necho '[self-review] mock block reason'\nexit 2\n",
            encoding="utf-8",
        )
        os.chmod(fake_check, 0o755)

        env = os.environ.copy()
        env["PATH"] = "/usr/bin:/bin:/usr/sbin:/sbin"
        env.pop("JQ", None)

        # adapter 内 check パスは固定のため、stop-hook-json followup を直接検証
        followup = run(
            [sys.executable, str(HOOKS / "stop-hook-json.py"), "followup", "[self-review] mock"],
            cwd=REPO_ROOT,
        )
        assert followup.returncode == 0
        payload = json.loads(followup.stdout)
        assert payload["followup_message"] == "[self-review] mock"

        parse = run(
            [sys.executable, str(HOOKS / "stop-hook-json.py"), "parse"],
            cwd=REPO_ROOT,
            env=env,
            input=stdin,
        )
        assert parse.returncode == 0
        lines = parse.stdout.strip().splitlines()
        assert lines[0] == "completed"


def test_review_doc_session_detection() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-fix-1.md"
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:00・shokujii-code-review）\n\n指摘なし\n",
            encoding="utf-8",
        )
        assert lib.has_review_doc_session_since(review_doc, "2026-07-16T07:00:00+00:00")


def test_self_review_wake_write_consume() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        wake_path = Path(tmp) / "self-review-pending.json"
        wake.write_pending_wake(
            wake_path,
            branch="fix/1",
            since="2026-07-16T07:00:00+00:00",
            conversation_id="conv-1",
        )
        pending = wake.list_unconsumed_wakes(wake_path)
        assert len(pending) == 1
        assert wake.consume_wake(wake_path, "fix/1")
        assert wake.list_unconsumed_wakes(wake_path) == []


def main() -> int:
    tests = [
        test_source_change_detect_no_changes,
        test_source_change_detect_user_change,
        test_source_change_detect_agents_hooks_review_scope,
        test_lint_and_format_check_skips_without_source_changes,
        test_stop_gate_check_aborted_status,
        test_stop_gate_check_self_review_only_scope,
        test_cursor_stop_gate_adapter_followup_on_block,
        test_review_doc_session_detection,
        test_self_review_wake_write_consume,
    ]
    failed = 0
    for test in tests:
        name = test.__name__
        try:
            test()
            print(f"PASS {name}")
        except AssertionError as exc:
            failed += 1
            print(f"FAIL {name}: {exc}")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"ERROR {name}: {exc}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
