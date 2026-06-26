#!/usr/bin/env python3
"""github-actions-deploy watch の開発用テスト。"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = REPO_ROOT / ".agents" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import github_actions_deploy_check as deploy_chk  # noqa: E402
import github_actions_deploy_state as deploy_state  # noqa: E402
import github_actions_deploy_wake as deploy_wake  # noqa: E402


def test_build_results_payload() -> None:
    runs = [
        {"workflow": "deploy_user.yml", "run_id": 1, "url": "https://example/run/1", "success": True},
        {"workflow": "deploy_partner.yml", "run_id": 2, "url": "https://example/run/2", "success": False},
    ]
    payload = deploy_chk.build_results_payload(
        deploy_id="dep-1",
        owner="o",
        repo="r",
        ref="feature/x",
        since="2026-01-01T00:00:00Z",
        workflows=["deploy_user.yml", "deploy_partner.yml"],
        runs=runs,
    )
    assert payload["overall_status"] == "failure"
    errors = deploy_chk.validate_results_payload(payload)
    assert errors == []


def test_build_results_partial() -> None:
    runs = [
        {"workflow": "deploy_user.yml", "run_id": None, "url": None, "success": None, "error": "run_id_not_found"},
    ]
    payload = deploy_chk.build_results_payload(
        deploy_id="dep-2",
        owner="o",
        repo="r",
        ref="feature/x",
        since="2026-01-01T00:00:00Z",
        workflows=["deploy_user.yml"],
        runs=runs,
    )
    assert payload["overall_status"] == "partial"


def test_discover_run_id_mock() -> None:
    def fake_gh(*_args: object, **_kwargs: object) -> subprocess.CompletedProcess[str]:
        return subprocess.CompletedProcess(
            args=[],
            returncode=0,
            stdout=json.dumps([{"databaseId": 999}]),
            stderr="",
        )

    import github_actions_deploy_check as mod

    original = subprocess.run
    try:
        subprocess.run = fake_gh  # type: ignore[assignment]
        run_id = mod.discover_run_id(
            owner="o",
            repo="r",
            ref="main",
            since="2026-01-01T00:00:00Z",
            workflow="deploy_user.yml",
            retries=1,
            sleep_sec=0,
        )
        assert run_id == 999
    finally:
        subprocess.run = original  # type: ignore[assignment]


def test_wake_round_trip() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        wake_file = Path(tmp) / "wake.json"
        deploy_wake.write_pending_wake(
            wake_file,
            deploy_id="dep-3",
            owner="o",
            repo="r",
            ref="main",
            since="2026-01-01T00:00:00Z",
            results_file=".agents/state/deploy-results/dep-3.json",
        )
        pending = deploy_wake.list_unconsumed_wakes(wake_file)
        assert len(pending) == 1
        assert pending[0]["deploy_id"] == "dep-3"
        assert deploy_wake.consume_wake(wake_file, "dep-3")
        assert deploy_wake.list_unconsumed_wakes(wake_file) == []


def test_wake_multiple_writes() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        wake_file = Path(tmp) / "wake.json"
        for deploy_id in ("dep-a", "dep-b"):
            deploy_wake.write_pending_wake(
                wake_file,
                deploy_id=deploy_id,
                owner="o",
                repo="r",
                ref="main",
                since="2026-01-01T00:00:00Z",
                results_file=f".agents/state/deploy-results/{deploy_id}.json",
            )
        pending = deploy_wake.list_unconsumed_wakes(wake_file)
        assert {w["deploy_id"] for w in pending} == {"dep-a", "dep-b"}


def test_state_multiple_registers() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        state_file = Path(tmp) / "deploy-watch.json"
        for deploy_id, pid in (("dep-a", 1001), ("dep-b", 1002)):
            deploy_state.register_watcher(
                state_file,
                deploy_id=deploy_id,
                since="2026-01-01T00:00:00Z",
                owner="o",
                repo="r",
                ref="main",
                pid=pid,
            )
        entries = json.loads(state_file.read_text(encoding="utf-8"))
        assert {e["deploy_id"] for e in entries} == {"dep-a", "dep-b"}


def test_watch_sh_bash32_compatible() -> None:
    """RC-24: local -n は macOS bash 3.2 非対応のため watch.sh に含めない。"""
    watch_sh = SCRIPTS / "github_actions_deploy_watch.sh"
    content = watch_sh.read_text(encoding="utf-8")
    assert "local -n" not in content
    assert "WATCH_LAST_PID" in content


def test_write_results_cli() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        runs_path = Path(tmp) / "runs.json"
        out_path = Path(tmp) / "results.json"
        runs_path.write_text(
            json.dumps(
                [
                    {
                        "workflow": "deploy_user.yml",
                        "run_id": 1,
                        "url": "https://example/run/1",
                        "success": True,
                    }
                ]
            ),
            encoding="utf-8",
        )
        proc = subprocess.run(
            [
                sys.executable,
                str(SCRIPTS / "github_actions_deploy_check.py"),
                "write-results",
                "--output",
                str(out_path),
                "--deploy-id",
                "dep-cli",
                "--owner",
                "o",
                "--repo",
                "r",
                "--ref",
                "main",
                "--since",
                "2026-01-01T00:00:00Z",
                "--runs-json",
                str(runs_path),
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        assert proc.returncode == 0, proc.stderr
        payload = json.loads(out_path.read_text(encoding="utf-8"))
        assert payload["overall_status"] == "success"


def main() -> int:
    tests = [
        test_build_results_payload,
        test_build_results_partial,
        test_discover_run_id_mock,
        test_wake_round_trip,
        test_wake_multiple_writes,
        test_state_multiple_registers,
        test_watch_sh_bash32_compatible,
        test_write_results_cli,
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
