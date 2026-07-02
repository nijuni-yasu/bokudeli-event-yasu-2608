#!/usr/bin/env python3
"""agent-usage フック・ライブラリの開発用テスト。"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = REPO_ROOT / ".agents" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import agent_usage_lib as lib  # noqa: E402

CURSOR_TURN = {
    "conversation_id": "conv-cursor-1",
    "generation_id": "gen-1",
    "model_id": "claude-4.6-sonnet-medium-thinking",
    "input_tokens": 120000,
    "output_tokens": 3500,
    "cache_read_tokens": 80000,
    "cache_write_tokens": 10000,
    "status": "completed",
    "loop_count": 0,
}

# followup_min_jpy (100) 以上になるよう fresh input を多めにした payload
CURSOR_TURN_HIGH_COST = {
    **CURSOR_TURN,
    "input_tokens": 600000,
    "cache_read_tokens": 380000,
    "cache_write_tokens": 0,
}

CLAUDE_TURN = {
    "session_id": "sess-claude-1",
    "usage": {
        "input_tokens": 50000,
        "output_tokens": 1200,
        "cache_read_input_tokens": 30000,
        "cache_creation_input_tokens": 5000,
    },
    "model": "claude-sonnet-4-20250514",
    "stop_reason": "end_turn",
}

CURSOR_ADAPTER = REPO_ROOT / ".cursor/hooks/agent-usage-turn-record.sh"
CLAUDE_ADAPTER = REPO_ROOT / ".claude/hooks/agent-usage-turn-record.sh"


def test_normalize_cursor_tokens() -> None:
    tokens = lib.normalize_tokens_from_cursor(CURSOR_TURN)
    assert tokens["input"] == 120000
    assert tokens["fresh_input"] == 30000


def test_normalize_tokens_from_cursor_nested_usage() -> None:
    payload = {
        "conversation_id": "c-nested",
        "usage": {
            "input_tokens": 10000,
            "output_tokens": 500,
            "cache_read_tokens": 8000,
            "cache_write_tokens": 0,
        },
    }
    tokens = lib.normalize_tokens_from_cursor(payload)
    assert tokens["input"] == 10000
    assert tokens["fresh_input"] == 2000


def test_normalize_tokens_from_cursor_transcript_fallback() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        transcript = Path(tmp) / "transcript.jsonl"
        transcript.write_text(
            json.dumps(
                {
                    "message": {
                        "usage": {
                            "input_tokens": 42000,
                            "output_tokens": 900,
                            "cache_read_input_tokens": 30000,
                            "cache_creation_input_tokens": 0,
                        }
                    }
                }
            )
            + "\n",
            encoding="utf-8",
        )
        payload = {
            "conversation_id": "c-transcript",
            "status": "completed",
            "transcript_path": str(transcript),
        }
        tokens = lib.normalize_tokens_from_cursor(payload)
        assert tokens["input"] == 42000
        assert tokens["output"] == 900


def test_normalize_tokens_from_cursor_no_tokens_returns_none() -> None:
    payload = {
        "conversation_id": "c-meta-only",
        "generation_id": "gen-x",
        "status": "aborted",
    }
    tokens = lib.normalize_tokens_from_cursor(payload)
    assert tokens["input"] is None
    assert tokens["output"] is None


def test_patch_active_tasks_path_isolated() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        active = Path(tmp) / "active.json"
        real_active = lib.ACTIVE_TASKS_PATH
        with patch.object(lib, "ACTIVE_TASKS_PATH", active):
            payload = {"conversation_id": "c-isolated", "prompt": "/github-actions-deploy"}
            lib.start_task(payload, platform="cursor", prompt=payload["prompt"])
            assert active.exists()
            if real_active.exists():
                real_data = json.loads(real_active.read_text(encoding="utf-8"))
                assert "c-isolated" not in real_data
            else:
                assert not real_active.exists() or "c-isolated" not in real_active.read_text(
                    encoding="utf-8"
                )


def test_normalize_claude_tokens() -> None:
    tokens = lib.normalize_tokens_from_claude(CLAUDE_TURN)
    assert tokens["input"] == 50000
    assert tokens["fresh_input"] == 50000


def test_detect_skill_prompt() -> None:
    skill, phase, _ = lib.detect_task_from_prompt("/github-actions-deploy sandbox2603/ai/1842")
    assert skill == "github-actions-deploy"
    assert phase is None


def test_detect_wake_deploy() -> None:
    prompt = 'AGENT_LOOP_WAKE_deploy {"prompt":"/github-actions-deploy","mode":"report","deploy_id":"abc"}'
    skill, phase, mode = lib.detect_task_from_prompt(prompt)
    assert skill == "github-actions-deploy"
    assert phase == "deploy_report"
    assert mode == "report"


def test_estimate_cost() -> None:
    tokens = lib.normalize_tokens_from_cursor(CURSOR_TURN)
    cost = lib.estimate_cost_usd(tokens, "claude-4.6-sonnet-medium-thinking")
    assert cost is not None
    assert cost > 0


def test_usd_to_jpy() -> None:
    assert lib.usd_to_jpy(1.0) == 150
    assert lib.usd_to_jpy(None) is None


def test_build_turn_usage_followup() -> None:
    msg = lib.build_turn_usage_followup(CURSOR_TURN_HIGH_COST, platform="cursor")
    assert msg is not None
    assert msg.startswith(lib.USAGE_REPORT_PREFIX)
    assert "input" in msg
    assert "output" in msg
    assert "¥" in msg
    assert "応答・思考不要" in msg
    assert "今回のトークン使用量" not in msg


def test_build_turn_usage_followup_below_threshold() -> None:
    msg = lib.build_turn_usage_followup(CURSOR_TURN, platform="cursor")
    assert msg is None


def test_process_stop_hook_skips_usage_ack() -> None:
    ack_payload = {
        **CURSOR_TURN_HIGH_COST,
        "prompt": f"{lib.USAGE_REPORT_PREFIX} input 1.0k、推定 ¥50（参考）。応答・思考不要。",
    }
    with patch.object(lib, "record_turn_end") as mock_record:
        result = lib.process_stop_hook(ack_payload, platform="cursor")
        assert result == {}
        mock_record.assert_called_once()


def test_process_stop_hook_emits_followup() -> None:
    with patch.object(lib, "record_turn_end"):
        result = lib.process_stop_hook(CURSOR_TURN_HIGH_COST, platform="cursor")
        assert "followup_message" in result
        assert result["followup_message"].startswith(lib.USAGE_REPORT_PREFIX)


def test_process_stop_hook_skips_followup_below_threshold() -> None:
    with patch.object(lib, "record_turn_end"):
        result = lib.process_stop_hook(CURSOR_TURN, platform="cursor")
        assert result == {}


def test_usage_report_preserves_active_task() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        active = Path(tmp) / "active.json"
        with patch.object(lib, "ACTIVE_TASKS_PATH", active):
            payload = {"conversation_id": "c-usage", "prompt": "/github-actions-deploy"}
            lib.start_task(payload, platform="cursor", prompt=payload["prompt"])
            before = lib.get_active_task(payload)

            report_prompt = {
                "conversation_id": "c-usage",
                "prompt": f"{lib.USAGE_REPORT_PREFIX} 推定 ¥10",
            }
            lib.record_task_start(report_prompt, platform="cursor")
            after = lib.get_active_task(payload)

            assert after.get("task_skill") == before.get("task_skill")
            assert after.get("task_id") == before.get("task_id")
            assert after.get("phase") == before.get("phase")
            assert after.get(lib.SKIP_NEXT_FOLLOWUP_KEY) is True


def test_followup_resumes_after_usage_report_ack() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        active = Path(tmp) / "active.json"
        with patch.object(lib, "ACTIVE_TASKS_PATH", active):
            payload = {"conversation_id": "c-usage", "prompt": "/github-actions-deploy"}
            lib.start_task(payload, platform="cursor", prompt=payload["prompt"])

            report_prompt = {
                "conversation_id": "c-usage",
                "prompt": f"{lib.USAGE_REPORT_PREFIX} 推定 ¥10",
            }
            lib.record_task_start(report_prompt, platform="cursor")

            with patch.object(lib, "record_turn_end"):
                ack_turn = {**CURSOR_TURN, **report_prompt}
                result = lib.process_stop_hook(ack_turn, platform="cursor")
            assert result == {}
            assert lib.get_active_task(payload).get(lib.SKIP_NEXT_FOLLOWUP_KEY) is None

            with patch.object(lib, "record_turn_end"):
                result = lib.process_stop_hook(
                    {**CURSOR_TURN_HIGH_COST, "conversation_id": "c-usage"},
                    platform="cursor",
                )
            assert "followup_message" in result


def test_is_usage_report_prompt() -> None:
    assert lib.is_usage_report_prompt(f"{lib.USAGE_REPORT_PREFIX} 使用量...")
    assert not lib.is_usage_report_prompt("/lint-and-format")


def test_last_session_id_prefers_session_end() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        ledger = Path(tmp) / "ledger.jsonl"
        lib.append_ledger(
            {"event": "session_end", "conversation_id": "session-closed"},
            ledger_path=ledger,
        )
        lib.append_ledger(
            {"event": "turn_end", "conversation_id": "turn-only"},
            ledger_path=ledger,
        )
        assert lib.last_session_id(ledger_path=ledger) == "session-closed"


def test_parse_since_invalid() -> None:
    for bad in ("", "abc", "7x", "-1d"):
        try:
            lib.parse_since(bad)
            raise AssertionError(f"expected ValueError for {bad!r}")
        except ValueError:
            pass

    assert lib.parse_since("7d").tzinfo is not None
    assert lib.parse_since("24h").tzinfo is not None


def test_parse_since_iso8601_utc() -> None:
    parsed = lib.parse_since("2026-06-26T00:00:00Z")
    assert parsed.tzinfo is not None
    assert parsed.year == 2026
    assert parsed.month == 6
    assert parsed.day == 26


def test_parse_since_iso8601_naive_utc() -> None:
    parsed = lib.parse_since("2026-06-26T00:00:00")
    assert parsed.tzinfo is not None
    assert parsed.tzinfo == lib.timezone.utc


def test_filter_entries_with_naive_since() -> None:
    entries = [
        {
            "ts": "2026-06-26T12:00:00+00:00",
            "conversation_id": "c1",
            "event": "turn_end",
        }
    ]
    since = lib.parse_since("2026-06-26T00:00:00")
    filtered = lib.filter_entries(entries, since=since)
    assert len(filtered) == 1


def test_record_task_start_skips_non_skill() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        ledger = Path(tmp) / "ledger.jsonl"
        active = Path(tmp) / "active.json"
        original_append = lib.append_ledger

        def append_temp(entry: dict, *, ledger_path: Path = ledger) -> None:
            original_append(entry, ledger_path=ledger)

        with patch.object(lib, "ACTIVE_TASKS_PATH", active), patch.object(lib, "append_ledger", append_temp):
            skill_payload = {"conversation_id": "c1", "prompt": "/github-actions-deploy"}
            lib.record_task_start(skill_payload, platform="cursor")
            assert (
                sum(1 for e in lib.load_ledger(ledger_path=ledger) if e.get("event") == "task_start") == 1
            )

            plain_payload = {"conversation_id": "c1", "prompt": "通常のユーザー発言です"}
            lib.record_task_start(plain_payload, platform="cursor")
            assert (
                sum(1 for e in lib.load_ledger(ledger_path=ledger) if e.get("event") == "task_start") == 1
            )


def test_cmd_report_invalid_since() -> None:
    proc = subprocess.run(
        [
            sys.executable,
            str(SCRIPTS / "agent_usage.py"),
            "report",
            "--since",
            "not-a-date",
        ],
        capture_output=True,
        text=True,
        check=False,
        cwd=str(REPO_ROOT),
    )
    assert proc.returncode == 1
    assert "Invalid --since" in proc.stderr


def test_ledger_round_trip() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        ledger = Path(tmp) / "ledger.jsonl"
        active = Path(tmp) / "active.json"

        lib.append_ledger({"event": "test", "value": 1}, ledger_path=ledger)
        lib.append_ledger({"event": "test", "value": 2}, ledger_path=ledger)

        entries = lib.load_ledger(ledger_path=ledger)
        assert len(entries) == 2

        payload = {"conversation_id": "c1", "prompt": "/git-reflect-after-commit"}
        lib.start_task(payload, platform="cursor", prompt=payload["prompt"], path=active)
        task = lib.get_active_task(payload, path=active)
        assert task.get("task_skill") == "git-reflect-after-commit"


def test_classify_shell() -> None:
    assert lib.classify_shell_command("gh run watch 123 --repo o/r") == "deploy_watch"
    assert lib.classify_shell_command(".agents/scripts/wait-ai-pr-review-watch.sh") == "pr_review_watch"


def test_hook_adapter_smoke() -> None:
    for adapter in (CURSOR_ADAPTER, CLAUDE_ADAPTER):
        proc = subprocess.run(
            ["bash", str(adapter)],
            input=json.dumps(
                CURSOR_TURN_HIGH_COST if adapter == CURSOR_ADAPTER else CLAUDE_TURN
            ),
            capture_output=True,
            text=True,
            check=False,
            cwd=str(REPO_ROOT),
            env={**os.environ, "CLAUDE_PROJECT_DIR": str(REPO_ROOT)},
        )
        assert proc.returncode == 0, proc.stderr
        out = json.loads(proc.stdout.strip() or "{}")
        if adapter == CURSOR_ADAPTER:
            assert "followup_message" in out
        else:
            assert out == {}


def main() -> int:
    tests = [
        test_normalize_cursor_tokens,
        test_normalize_tokens_from_cursor_nested_usage,
        test_normalize_tokens_from_cursor_transcript_fallback,
        test_normalize_tokens_from_cursor_no_tokens_returns_none,
        test_patch_active_tasks_path_isolated,
        test_normalize_claude_tokens,
        test_detect_skill_prompt,
        test_detect_wake_deploy,
        test_estimate_cost,
        test_usd_to_jpy,
        test_build_turn_usage_followup,
        test_build_turn_usage_followup_below_threshold,
        test_process_stop_hook_skips_usage_ack,
        test_process_stop_hook_emits_followup,
        test_process_stop_hook_skips_followup_below_threshold,
        test_usage_report_preserves_active_task,
        test_followup_resumes_after_usage_report_ack,
        test_is_usage_report_prompt,
        test_last_session_id_prefers_session_end,
        test_parse_since_invalid,
        test_parse_since_iso8601_utc,
        test_parse_since_iso8601_naive_utc,
        test_filter_entries_with_naive_since,
        test_record_task_start_skips_non_skill,
        test_cmd_report_invalid_since,
        test_ledger_round_trip,
        test_classify_shell,
        test_hook_adapter_smoke,
    ]
    failed = 0
    for test in tests:
        name = test.__name__
        try:
            test()
            print(f"OK {name}")
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL {name}: {exc}")
            failed += 1
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
