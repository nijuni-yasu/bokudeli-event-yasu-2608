#!/usr/bin/env python3
"""wait_ai_pr_review_wake のユニットテスト（開発用・CI 非対象）"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / ".agents/scripts"))

from wait_ai_pr_review_wake import (  # noqa: E402
    consume_wake,
    list_unconsumed_wakes,
    write_pending_wake,
)


class WaitAiPrReviewWakeTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.wake_path = Path(self.tmp.name) / "pr-review-pending-wake.json"

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_write_and_list_unconsumed(self) -> None:
        write_pending_wake(
            self.wake_path,
            pr=2102,
            partial=True,
            since="2026-06-23T15:18:17Z",
            owner="nijuniinc",
            repo="bokudeli-event-new",
        )
        pending = list_unconsumed_wakes(self.wake_path)
        self.assertEqual(len(pending), 1)
        self.assertEqual(pending[0]["pr"], 2102)
        self.assertTrue(pending[0]["partial"])
        self.assertFalse(pending[0]["consumed"])

    def test_write_replaces_same_pr(self) -> None:
        write_pending_wake(
            self.wake_path,
            pr=2102,
            partial=True,
            since="2026-06-23T15:18:17Z",
            owner="nijuniinc",
            repo="bokudeli-event-new",
        )
        write_pending_wake(
            self.wake_path,
            pr=2102,
            partial=False,
            since="2026-06-23T16:00:00Z",
            owner="nijuniinc",
            repo="bokudeli-event-new",
        )
        pending = list_unconsumed_wakes(self.wake_path)
        self.assertEqual(len(pending), 1)
        self.assertFalse(pending[0]["partial"])

    def test_consume_wake(self) -> None:
        write_pending_wake(
            self.wake_path,
            pr=2102,
            partial=True,
            since="2026-06-23T15:18:17Z",
            owner="nijuniinc",
            repo="bokudeli-event-new",
        )
        self.assertTrue(consume_wake(self.wake_path, 2102))
        self.assertEqual(list_unconsumed_wakes(self.wake_path), [])
        data = json.loads(self.wake_path.read_text(encoding="utf-8"))
        self.assertTrue(data[0]["consumed"])
        self.assertIn("consumed_at", data[0])


def main() -> int:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(WaitAiPrReviewWakeTest)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
