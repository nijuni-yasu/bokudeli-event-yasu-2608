#!/usr/bin/env python3
"""self-review-check / self_review_check_lib の開発用テスト。"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = REPO_ROOT / ".agents" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import self_review_check_lib as lib  # noqa: E402
import self_review_wake as wake  # noqa: E402


def test_is_self_review_complete_via_review_doc() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-feat-1.md"
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
            encoding="utf-8",
        )
        since = "2026-07-16T07:00:00+00:00"
        assert lib.is_self_review_complete(
            branch="feat/1",
            since=since,
            conversation_id=None,
            wake_entry=None,
            repo_root=root,
        )


def test_review_doc_session_jst_before_since_fails() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-feat-1.md"
        # 15:00 JST = 06:00 UTC < since 07:00 UTC
        review_doc.write_text(
            "## 評価セッション（2026-07-16 15:00・shokujii-code-review）\n",
            encoding="utf-8",
        )
        since = "2026-07-16T07:00:00+00:00"
        assert not lib.has_review_doc_session_since(review_doc, since)


def test_is_self_review_complete_via_ledger() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        ledger_dir = root / ".agents" / "state" / "agent-usage"
        ledger_dir.mkdir(parents=True)
        ledger_path = ledger_dir / "ledger.jsonl"
        since = datetime.now(timezone.utc).isoformat()
        entry = {
            "ts": since,
            "event": "turn_end",
            "conversation_id": "conv-abc",
            "task_skill": "shokujii-code-review",
        }
        ledger_path.write_text(json.dumps(entry) + "\n", encoding="utf-8")

        assert lib.is_self_review_complete(
            branch="ai/1",
            since="2020-01-01T00:00:00+00:00",
            conversation_id="conv-abc",
            wake_entry=None,
            repo_root=root,
        )


def test_consume_alone_does_not_pass() -> None:
    since = "2026-07-16T07:00:00+00:00"
    wake_entry = {
        "consumed": True,
        "consumed_at": "2026-07-16T08:00:00+00:00",
    }
    assert not lib.is_self_review_complete(
        branch="fix/1",
        since=since,
        conversation_id=None,
        wake_entry=wake_entry,
        repo_root=Path("/tmp"),
    )


def test_tree_branch_skips_doc_but_ledger_ok() -> None:
    assert lib.is_recording_skipped_branch("tree/4")
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        ledger_dir = root / ".agents" / "state" / "agent-usage"
        ledger_dir.mkdir(parents=True)
        ledger_path = ledger_dir / "ledger.jsonl"
        since = "2026-07-16T07:00:00+00:00"
        entry = {
            "ts": "2026-07-16T08:00:00+00:00",
            "event": "turn_end",
            "conversation_id": "conv-tree",
            "task_skill": "shokujii-code-review",
        }
        ledger_path.write_text(json.dumps(entry) + "\n", encoding="utf-8")
        assert lib.is_self_review_complete(
            branch="tree/4",
            since=since,
            conversation_id="conv-tree",
            wake_entry=None,
            repo_root=root,
        )


def test_self_review_check_cli_fails_without_wake() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        subprocess.run(["git", "init", "-q"], cwd=root, check=True)
        subprocess.run(["git", "config", "user.email", "t@e.com"], cwd=root, check=True)
        subprocess.run(["git", "config", "user.name", "t"], cwd=root, check=True)
        (root / "README.md").write_text("x\n", encoding="utf-8")
        subprocess.run(["git", "add", "README.md"], cwd=root, check=True)
        subprocess.run(["git", "commit", "-qm", "init"], cwd=root, check=True)
        subprocess.run(["git", "checkout", "-q", "-b", "fix/9"], cwd=root, check=True)

        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPTS / "self_review_check.py"),
                "--repo-root",
                str(root),
                "--wake-file",
                str(wake_path.relative_to(root)),
                "--branch",
                "fix/9",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 2
        assert "pending wake" in result.stderr


def test_self_review_check_cli_fails_without_completion() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        subprocess.run(["git", "init", "-q"], cwd=root, check=True)
        subprocess.run(["git", "config", "user.email", "t@e.com"], cwd=root, check=True)
        subprocess.run(["git", "config", "user.name", "t"], cwd=root, check=True)
        (root / "README.md").write_text("x\n", encoding="utf-8")
        subprocess.run(["git", "add", "README.md"], cwd=root, check=True)
        subprocess.run(["git", "commit", "-qm", "init"], cwd=root, check=True)
        subprocess.run(["git", "checkout", "-q", "-b", "fix/9"], cwd=root, check=True)

        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        wake.write_pending_wake(
            wake_path,
            branch="fix/9",
            since="2026-07-16T07:00:00+00:00",
        )
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPTS / "self_review_check.py"),
                "--repo-root",
                str(root),
                "--wake-file",
                str(wake_path.relative_to(root)),
                "--branch",
                "fix/9",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        assert result.returncode == 2
        assert "[self-review]" in result.stderr


def main() -> int:
    tests = [
        test_is_self_review_complete_via_review_doc,
        test_review_doc_session_jst_before_since_fails,
        test_is_self_review_complete_via_ledger,
        test_consume_alone_does_not_pass,
        test_tree_branch_skips_doc_but_ledger_ok,
        test_self_review_check_cli_fails_without_wake,
        test_self_review_check_cli_fails_without_completion,
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
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
