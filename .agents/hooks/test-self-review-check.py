#!/usr/bin/env python3
"""self-review-check / self_review_check_lib の開発用テスト。"""

from __future__ import annotations

import json
import shutil
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


def _setup_minimal_git_repo(root: Path, branch: str = "fix/1") -> None:
    subprocess.run(["git", "init", "-q"], cwd=root, check=True)
    subprocess.run(["git", "config", "user.email", "t@e.com"], cwd=root, check=True)
    subprocess.run(["git", "config", "user.name", "t"], cwd=root, check=True)
    hooks_dst = root / ".agents" / "hooks"
    hooks_dst.mkdir(parents=True, exist_ok=True)
    shutil.copy(
        REPO_ROOT / ".agents/hooks/source-change-detect.sh",
        hooks_dst / "source-change-detect.sh",
    )
    (root / "README.md").write_text("init\n", encoding="utf-8")
    subprocess.run(["git", "add", "."], cwd=root, check=True)
    subprocess.run(["git", "commit", "-qm", "init"], cwd=root, check=True)
    subprocess.run(["git", "checkout", "-q", "-b", branch], cwd=root, check=True)


def test_is_self_review_complete_via_review_doc() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "feat/1")
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-feat-1.md"
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
            encoding="utf-8",
        )
        since = "2026-07-16T07:00:00+00:00"
        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        wake.write_pending_wake(wake_path, branch="feat/1", since=since)
        wake.consume_wake(wake_path, "feat/1", repo_root=root)
        wake_entry = wake.get_wake_for_branch(wake_path, "feat/1")
        assert wake_entry is not None
        assert lib.is_self_review_complete(
            branch="feat/1",
            since=since,
            conversation_id=None,
            wake_entry=wake_entry,
            repo_root=root,
        )


def test_unconsumed_wake_old_review_doc_does_not_pass() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "feat/1")
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-feat-1.md"
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
            encoding="utf-8",
        )
        since = "2026-07-16T07:00:00+00:00"
        wake_entry = {"consumed": False, "since": since}
        assert not lib.is_self_review_complete(
            branch="feat/1",
            since=since,
            conversation_id=None,
            wake_entry=wake_entry,
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


def test_naive_since_treated_as_utc() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-feat-1.md"
        # 16:30 JST = 07:30 UTC >= naive since 07:00 UTC
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
            encoding="utf-8",
        )
        since = "2026-07-16T07:00:00"
        assert lib.has_review_doc_session_since(review_doc, since)


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
            branch="tree/4",
            since="2020-01-01T00:00:00+00:00",
            conversation_id="conv-abc",
            wake_entry=None,
            repo_root=root,
        )


def test_normal_branch_ledger_alone_does_not_pass() -> None:
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

        assert not lib.is_self_review_complete(
            branch="ai/1",
            since="2020-01-01T00:00:00+00:00",
            conversation_id="conv-abc",
            wake_entry=None,
            repo_root=root,
        )


def test_review_doc_same_minute_passes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-feat-1.md"
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
            encoding="utf-8",
        )
        since = "2026-07-16T07:30:45+00:00"
        assert lib.has_review_doc_session_since(review_doc, since)


def test_consume_alone_does_not_pass() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        review_doc = review_dir / "review-fix-1.md"
        review_doc.write_text(
            "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
            encoding="utf-8",
        )
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
            repo_root=root,
        )


def test_list_paths_review_excludes_review_doc() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root)
        review_dir = root / "documents" / "レビューコメント"
        review_dir.mkdir(parents=True)
        (review_dir / "review-x.md").write_text("session\n", encoding="utf-8")
        paths = lib.list_review_scope_paths(root, "review")
        assert not any(p.startswith("documents/レビューコメント/") for p in paths)


def _write_review_doc_session(root: Path, branch: str, since: str) -> None:
    review_dir = root / "documents" / "レビューコメント"
    review_dir.mkdir(parents=True, exist_ok=True)
    slug = branch.replace("/", "-")
    (review_dir / f"review-{slug}.md").write_text(
        "## 評価セッション（2026-07-16 16:30・shokujii-code-review）\n",
        encoding="utf-8",
    )


def test_consumed_same_fingerprint_passes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "ai/1")
        scripts = root / ".agents" / "scripts"
        scripts.mkdir(parents=True, exist_ok=True)
        (scripts / "helper.py").write_text("x = 1\n", encoding="utf-8")

        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        since = "2026-07-16T07:00:00+00:00"
        wake.write_pending_wake(wake_path, branch="ai/1", since=since)
        _write_review_doc_session(root, "ai/1", since)
        assert wake.consume_wake(wake_path, "ai/1", repo_root=root)

        entry = wake.get_wake_for_branch(wake_path, "ai/1")
        assert entry is not None
        assert entry.get("reviewed_scope_fingerprint")

        assert lib.is_self_review_complete(
            branch="ai/1",
            since=since,
            conversation_id=None,
            wake_entry=entry,
            repo_root=root,
        )


def test_consumed_changed_fingerprint_fails() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "ai/1")
        scripts = root / ".agents" / "scripts"
        scripts.mkdir(parents=True, exist_ok=True)
        helper = scripts / "helper.py"
        helper.write_text("x = 1\n", encoding="utf-8")

        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        since = "2026-07-16T07:00:00+00:00"
        wake.write_pending_wake(wake_path, branch="ai/1", since=since)
        wake.consume_wake(wake_path, "ai/1", repo_root=root)
        entry = wake.get_wake_for_branch(wake_path, "ai/1")
        assert entry is not None

        helper.write_text("x = 2\n", encoding="utf-8")
        assert not lib.is_self_review_complete(
            branch="ai/1",
            since=since,
            conversation_id=None,
            wake_entry=entry,
            repo_root=root,
        )


def test_consumed_fingerprint_without_doc_passes() -> None:
    """指摘 0 件: review doc 未作成でも consumed + fingerprint で合格。"""
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "feat/1")
        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        since = "2026-07-16T07:00:00+00:00"
        wake.write_pending_wake(wake_path, branch="feat/1", since=since)
        wake.consume_wake(wake_path, "feat/1", repo_root=root)
        entry = wake.get_wake_for_branch(wake_path, "feat/1")
        assert entry is not None
        assert lib.is_self_review_complete(
            branch="feat/1",
            since=since,
            conversation_id=None,
            wake_entry=entry,
            repo_root=root,
        )


def test_self_review_check_cli_consumed_same_fp_passes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "fix/9")
        scripts = root / ".agents" / "scripts"
        scripts.mkdir(parents=True, exist_ok=True)
        (scripts / "helper.py").write_text("y = 1\n", encoding="utf-8")

        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        since = "2026-07-16T07:00:00+00:00"
        wake.write_pending_wake(wake_path, branch="fix/9", since=since)
        _write_review_doc_session(root, "fix/9", since)
        wake.consume_wake(wake_path, "fix/9", repo_root=root)

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
        assert result.returncode == 0, result.stderr


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


def test_tree_branch_consumed_fingerprint_ok_without_ledger() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        _setup_minimal_git_repo(root, "tree/4")
        wake_path = root / ".agents" / "state" / "self-review-pending.json"
        since = "2026-07-16T07:00:00+00:00"
        wake.write_pending_wake(wake_path, branch="tree/4", since=since)
        wake.consume_wake(wake_path, "tree/4", repo_root=root)
        entry = wake.get_wake_for_branch(wake_path, "tree/4")
        assert entry is not None
        assert lib.is_self_review_complete(
            branch="tree/4",
            since=since,
            conversation_id=None,
            wake_entry=entry,
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


def test_self_review_check_cli_fails_without_since() -> None:
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
        wake_path.parent.mkdir(parents=True, exist_ok=True)
        wake_path.write_text(
            json.dumps([{"branch": "fix/9", "consumed": False}], ensure_ascii=False) + "\n",
            encoding="utf-8",
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
        assert "since" in result.stderr


def main() -> int:
    tests = [
        test_is_self_review_complete_via_review_doc,
        test_review_doc_session_jst_before_since_fails,
        test_naive_since_treated_as_utc,
        test_review_doc_same_minute_passes,
        test_is_self_review_complete_via_ledger,
        test_normal_branch_ledger_alone_does_not_pass,
        test_consume_alone_does_not_pass,
        test_unconsumed_wake_old_review_doc_does_not_pass,
        test_list_paths_review_excludes_review_doc,
        test_consumed_same_fingerprint_passes,
        test_consumed_changed_fingerprint_fails,
        test_consumed_fingerprint_without_doc_passes,
        test_self_review_check_cli_consumed_same_fp_passes,
        test_tree_branch_skips_doc_but_ledger_ok,
        test_tree_branch_consumed_fingerprint_ok_without_ledger,
        test_self_review_check_cli_fails_without_wake,
        test_self_review_check_cli_fails_without_since,
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
