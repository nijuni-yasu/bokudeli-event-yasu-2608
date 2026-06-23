#!/usr/bin/env python3
"""wait_ai_pr_review_state のユニットテスト（開発用・CI 非対象）"""

from __future__ import annotations

import json
import signal
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / ".agents/scripts"))

from wait_ai_pr_review_state import (  # noqa: E402
    WATCHER_SCRIPT,
    register_watcher,
    stop_existing_for_pr,
    unregister_watcher,
)


class WaitAiPrReviewStateTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.state_path = Path(self.tmp.name) / "pr-review-watch.json"

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_register_two_watchers(self) -> None:
        register_watcher(
            self.state_path,
            pr=100,
            since="2026-06-23T05:55:00Z",
            owner="owner",
            repo="repo",
            pid=111,
        )
        register_watcher(
            self.state_path,
            pr=200,
            since="2026-06-23T06:00:00Z",
            owner="owner",
            repo="repo",
            pid=222,
        )

        entries = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0]["pr"], 100)
        self.assertEqual(entries[0]["pid"], 111)
        self.assertEqual(entries[0]["status"], "running")
        self.assertEqual(entries[0]["command"], WATCHER_SCRIPT)
        self.assertEqual(entries[1]["pr"], 200)
        self.assertEqual(entries[1]["pid"], 222)

    @patch("wait_ai_pr_review_state.os.kill")
    @patch("wait_ai_pr_review_state._get_process_command")
    def test_stop_existing_for_pr(
        self,
        mock_get_process_command: unittest.mock.MagicMock,
        mock_kill: unittest.mock.MagicMock,
    ) -> None:
        mock_get_process_command.return_value = f"bash {WATCHER_SCRIPT} --pr 100"
        register_watcher(
            self.state_path,
            pr=100,
            since="2026-06-23T05:55:00Z",
            owner="owner",
            repo="repo",
            pid=111,
        )
        register_watcher(
            self.state_path,
            pr=100,
            since="2026-06-23T06:00:00Z",
            owner="owner",
            repo="repo",
            pid=112,
        )
        register_watcher(
            self.state_path,
            pr=200,
            since="2026-06-23T06:00:00Z",
            owner="owner",
            repo="repo",
            pid=222,
        )

        stop_existing_for_pr(self.state_path, 100)

        sigterm_calls = [
            call for call in mock_kill.call_args_list if call.args[1] == signal.SIGTERM
        ]
        self.assertEqual(len(sigterm_calls), 2)
        mock_kill.assert_any_call(111, signal.SIGTERM)
        mock_kill.assert_any_call(112, signal.SIGTERM)

        entries = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["pr"], 200)
        self.assertEqual(entries[0]["pid"], 222)

    def test_unregister_complete_removes_entry(self) -> None:
        register_watcher(
            self.state_path,
            pr=100,
            since="2026-06-23T05:55:00Z",
            owner="owner",
            repo="repo",
            pid=111,
        )
        register_watcher(
            self.state_path,
            pr=200,
            since="2026-06-23T06:00:00Z",
            owner="owner",
            repo="repo",
            pid=222,
        )

        unregister_watcher(self.state_path, pid=111, final_status="complete")

        entries = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]["pid"], 222)

    @patch("wait_ai_pr_review_state.os.kill")
    @patch("wait_ai_pr_review_state._get_process_command")
    def test_stop_skips_mismatched_process(
        self,
        mock_get_process_command: unittest.mock.MagicMock,
        mock_kill: unittest.mock.MagicMock,
    ) -> None:
        mock_get_process_command.return_value = "python3 unrelated.py"
        register_watcher(
            self.state_path,
            pr=100,
            since="2026-06-23T05:55:00Z",
            owner="owner",
            repo="repo",
            pid=111,
        )

        stop_existing_for_pr(self.state_path, 100)

        sigterm_calls = [
            call for call in mock_kill.call_args_list if call.args[1] == signal.SIGTERM
        ]
        self.assertEqual(sigterm_calls, [])
        entries = json.loads(self.state_path.read_text(encoding="utf-8"))
        self.assertEqual(entries, [])


def main() -> int:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(WaitAiPrReviewStateTest)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
