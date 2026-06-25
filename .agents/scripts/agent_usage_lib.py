#!/usr/bin/env python3
"""Agent 使用量トラッキング — 正本ロジック。"""

from __future__ import annotations

import fcntl
import json
import re
import uuid
from collections.abc import Callable
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
STATE_DIR = REPO_ROOT / ".agents" / "state" / "agent-usage"
LEDGER_PATH = STATE_DIR / "ledger.jsonl"
ACTIVE_TASKS_PATH = STATE_DIR / "active-tasks.json"
REPORTS_DIR = STATE_DIR / "reports"
PRICING_PATH = REPO_ROOT / ".agents" / "config" / "agent-usage-pricing.json"
HOOK_ERRORS_PATH = STATE_DIR / "hook-errors.log"
ACTIVE_TASKS_LOCK_SUFFIX = ".lock"

SKILL_PATTERN = re.compile(r"^/([a-zA-Z0-9][\w-]*)")
WAKE_PR_REVIEW = re.compile(r"^AGENT_LOOP_WAKE_pr_review\s+(\{.*\})", re.DOTALL)
WAKE_DEPLOY = re.compile(r"^AGENT_LOOP_WAKE_deploy\s+(\{.*\})", re.DOTALL)

SHELL_PHASE_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("deploy_watch", re.compile(r"github_actions_deploy_watch|gh run watch")),
    ("deploy_fire", re.compile(r"gh workflow run")),
    ("pr_review_watch", re.compile(r"wait-ai-pr-review-watch")),
]

USAGE_REPORT_PREFIX = "[agent-usage-report]"
SKIP_NEXT_FOLLOWUP_KEY = "skip_next_followup"


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_state_dirs() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)


def _active_tasks_path(path: Path | None) -> Path:
    return path if path is not None else ACTIVE_TASKS_PATH


def _ledger_path(ledger_path: Path | None) -> Path:
    return ledger_path if ledger_path is not None else LEDGER_PATH


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_ledger(entry: dict[str, Any], *, ledger_path: Path | None = None) -> None:
    resolved = _ledger_path(ledger_path)
    ensure_state_dirs()
    resolved.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(entry, ensure_ascii=False) + "\n"
    with resolved.open("a", encoding="utf-8") as fh:
        fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
        try:
            fh.write(line)
        finally:
            fcntl.flock(fh.fileno(), fcntl.LOCK_UN)


def load_ledger(*, ledger_path: Path | None = None) -> list[dict[str, Any]]:
    resolved = _ledger_path(ledger_path)
    if not resolved.exists():
        return []
    entries: list[dict[str, Any]] = []
    for line in resolved.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return entries


@contextmanager
def _active_tasks_lock(*, path: Path | None = None):
    resolved = _active_tasks_path(path)
    ensure_state_dirs()
    lock_path = Path(f"{resolved}{ACTIVE_TASKS_LOCK_SUFFIX}")
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a", encoding="utf-8") as lock_fh:
        fcntl.flock(lock_fh.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(lock_fh.fileno(), fcntl.LOCK_UN)


def load_active_tasks(*, path: Path | None = None) -> dict[str, dict[str, Any]]:
    resolved = _active_tasks_path(path)
    with _active_tasks_lock(path=resolved):
        data = _read_json(resolved, {})
        return data if isinstance(data, dict) else {}


def save_active_tasks(tasks: dict[str, dict[str, Any]], *, path: Path | None = None) -> None:
    resolved = _active_tasks_path(path)
    with _active_tasks_lock(path=resolved):
        _write_json(resolved, tasks)


def update_active_tasks(
    mutator: Callable[[dict[str, dict[str, Any]]], Any],
    *,
    path: Path | None = None,
) -> Any:
    resolved = _active_tasks_path(path)
    with _active_tasks_lock(path=resolved):
        tasks = _read_json(resolved, {})
        if not isinstance(tasks, dict):
            tasks = {}
        result = mutator(tasks)
        _write_json(resolved, tasks)
        return result


def session_key(payload: dict[str, Any]) -> str:
    return str(
        payload.get("conversation_id")
        or payload.get("session_id")
        or payload.get("sessionId")
        or "unknown"
    )


def prompt_from_payload(payload: dict[str, Any]) -> str:
    return str(payload.get("prompt") or payload.get("user_message") or "")


def is_usage_report_prompt(prompt: str) -> bool:
    return prompt.strip().startswith(USAGE_REPORT_PREFIX)


def is_usage_report_ack_turn(payload: dict[str, Any], *, path: Path | None = None) -> bool:
    """True when this turn should not emit another usage followup."""
    if is_usage_report_prompt(prompt_from_payload(payload)):
        return True
    task = get_active_task(payload, path=path)
    return bool(task.get(SKIP_NEXT_FOLLOWUP_KEY))


def detect_task_from_prompt(prompt: str) -> tuple[str | None, str | None, str | None]:
    """Returns (task_skill, phase, wake_mode)."""
    text = prompt.strip()
    if not text:
        return None, None, None

    m = WAKE_PR_REVIEW.match(text)
    if m:
        try:
            data = json.loads(m.group(1))
            skill = str(data.get("prompt", "/review-comments-evaluate")).lstrip("/")
            return skill, "pr_review_evaluate", None
        except json.JSONDecodeError:
            return "review-comments-evaluate", "pr_review_evaluate", None

    m = WAKE_DEPLOY.match(text)
    if m:
        try:
            data = json.loads(m.group(1))
            skill = str(data.get("prompt", "/github-actions-deploy")).lstrip("/")
            mode = data.get("mode")
            phase = "deploy_report" if mode == "report" else "deploy_wake"
            return skill, phase, str(mode) if mode else None
        except json.JSONDecodeError:
            return "github-actions-deploy", "deploy_report", "report"

    m = SKILL_PATTERN.match(text)
    if m:
        return m.group(1), None, None

    return None, None, None


def classify_shell_command(command: str) -> str | None:
    for phase, pattern in SHELL_PHASE_PATTERNS:
        if pattern.search(command):
            return phase
    return None


def _optional_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _tokens_from_ints(
    inp: int | None,
    out: int | None,
    cache_read: int | None,
    cache_write: int | None,
    *,
    fresh_equals_input: bool = False,
) -> dict[str, int | None]:
    fresh: int | None = None
    if inp is not None:
        if fresh_equals_input:
            fresh = inp
        else:
            fresh = inp - (cache_read or 0) - (cache_write or 0)
            if fresh < 0:
                fresh = inp

    return {
        "input": inp,
        "output": out,
        "cache_read": cache_read,
        "cache_write": cache_write,
        "fresh_input": fresh,
    }


def _tokens_from_usage_dict(usage: dict[str, Any], *, cursor_field_names: bool) -> dict[str, int | None]:
    if cursor_field_names:
        inp = _optional_int(usage.get("input_tokens"))
        out = _optional_int(usage.get("output_tokens"))
        cache_read = _optional_int(usage.get("cache_read_tokens"))
        cache_write = _optional_int(usage.get("cache_write_tokens"))
    else:
        inp = _optional_int(usage.get("input_tokens"))
        out = _optional_int(usage.get("output_tokens"))
        cache_read = _optional_int(usage.get("cache_read_input_tokens"))
        cache_write = _optional_int(usage.get("cache_creation_input_tokens"))

    if all(v is None for v in (inp, out, cache_read, cache_write)):
        return _tokens_from_ints(None, None, None, None)

    return _tokens_from_ints(
        inp,
        out,
        cache_read,
        cache_write,
        fresh_equals_input=not cursor_field_names,
    )


def normalize_tokens_from_cursor(payload: dict[str, Any]) -> dict[str, int | None]:
    tokens = _tokens_from_usage_dict(payload, cursor_field_names=True)
    if tokens.get("input") is not None or tokens.get("output") is not None:
        return tokens

    usage = payload.get("usage")
    if isinstance(usage, dict):
        nested = _tokens_from_usage_dict(usage, cursor_field_names=True)
        if nested.get("input") is not None or nested.get("output") is not None:
            return nested

    transcript = payload.get("transcript_path")
    if isinstance(transcript, str):
        return _usage_from_transcript(transcript)

    return _tokens_from_ints(None, None, None, None)


def _usage_from_transcript(transcript_path: str | None) -> dict[str, int | None]:
    if not transcript_path:
        return {
            "input": None,
            "output": None,
            "cache_read": None,
            "cache_write": None,
            "fresh_input": None,
        }

    path = Path(transcript_path)
    if not path.exists():
        return {
            "input": None,
            "output": None,
            "cache_read": None,
            "cache_write": None,
            "fresh_input": None,
        }

    usage: dict[str, Any] | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
        except json.JSONDecodeError:
            continue
        msg = obj.get("message")
        if not isinstance(msg, dict):
            continue
        u = msg.get("usage")
        if isinstance(u, dict):
            usage = u

    if not usage:
        return _tokens_from_ints(None, None, None, None, fresh_equals_input=True)

    return _tokens_from_usage_dict(usage, cursor_field_names=False)


def normalize_tokens_from_claude(payload: dict[str, Any]) -> dict[str, int | None]:
    usage = payload.get("usage")
    if isinstance(usage, dict):
        return _tokens_from_usage_dict(usage, cursor_field_names=False)

    transcript = payload.get("transcript_path")
    if isinstance(transcript, str):
        return _usage_from_transcript(transcript)

    return _tokens_from_ints(None, None, None, None, fresh_equals_input=True)


def resolve_model_id(payload: dict[str, Any]) -> str | None:
    for key in ("model_id", "model"):
        val = payload.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


def load_pricing(*, path: Path = PRICING_PATH) -> dict[str, Any]:
    return _read_json(path, {"default": {}, "models": {}})


def followup_min_jpy(*, path: Path = PRICING_PATH) -> int | None:
    """Minimum estimated JPY to emit stop-hook followup. None disables threshold."""
    pricing = load_pricing(path=path)
    val = pricing.get("followup_min_jpy")
    if val is None:
        return None
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


def estimate_cost_usd(tokens: dict[str, int | None], model_id: str | None) -> float | None:
    pricing = load_pricing()
    models = pricing.get("models", {})
    default = pricing.get("default", {})

    rates: dict[str, Any] = default if isinstance(default, dict) else {}
    if model_id and isinstance(models, dict):
        if model_id in models:
            rates = models[model_id]
        else:
            for key, val in models.items():
                if key in model_id or model_id in key:
                    if isinstance(val, dict):
                        rates = val
                    break

    if not isinstance(rates, dict):
        rates = default if isinstance(default, dict) else {}

    fresh = tokens.get("fresh_input")
    output = tokens.get("output")
    cache_read = tokens.get("cache_read")
    cache_write = tokens.get("cache_write")

    if all(v is None for v in (fresh, output, cache_read, cache_write)):
        return None

    cost = 0.0
    has_component = False

    if fresh is not None:
        cost += fresh / 1_000_000 * float(rates.get("input_per_mtok", 0))
        has_component = True
    if output is not None:
        cost += output / 1_000_000 * float(rates.get("output_per_mtok", 0))
        has_component = True
    if cache_read is not None:
        cost += cache_read / 1_000_000 * float(rates.get("cache_read_per_mtok", 0))
        has_component = True
    if cache_write is not None:
        cost += cache_write / 1_000_000 * float(rates.get("cache_write_per_mtok", 0))
        has_component = True

    return round(cost, 4) if has_component else None


def usd_to_jpy(usd: float | None, *, path: Path = PRICING_PATH) -> float | None:
    if usd is None:
        return None
    pricing = load_pricing(path=path)
    rate = pricing.get("usd_jpy_rate")
    if rate is None:
        return None
    try:
        return round(usd * float(rate))
    except (TypeError, ValueError):
        return None


def start_task(
    payload: dict[str, Any],
    *,
    platform: str,
    prompt: str,
    path: Path | None = None,
) -> dict[str, Any]:
    key = session_key(payload)
    skill, phase, wake_mode = detect_task_from_prompt(prompt)

    if skill:
        task_id = str(uuid.uuid4())
        task = {
            "task_id": task_id,
            "task_skill": skill,
            "phase": phase,
            "wake_mode": wake_mode,
            "started_at": utc_now_iso(),
            "platform": platform,
        }

        def mutator(tasks: dict[str, dict[str, Any]]) -> dict[str, Any]:
            tasks[key] = task
            return task

        return update_active_tasks(mutator, path=path)

    return load_active_tasks(path=path).get(key, {})


def get_active_task(payload: dict[str, Any], *, path: Path | None = None) -> dict[str, Any]:
    key = session_key(payload)
    return load_active_tasks(path=path).get(key, {})


def clear_active_task(session_id: str, *, path: Path | None = None) -> None:
    def mutator(tasks: dict[str, dict[str, Any]]) -> None:
        tasks.pop(session_id, None)
        return None

    update_active_tasks(mutator, path=path)


def clear_skip_next_followup(payload: dict[str, Any], *, path: Path | None = None) -> None:
    key = session_key(payload)

    def mutator(tasks: dict[str, dict[str, Any]]) -> None:
        task = tasks.get(key)
        if not task or SKIP_NEXT_FOLLOWUP_KEY not in task:
            return None
        del task[SKIP_NEXT_FOLLOWUP_KEY]
        tasks[key] = task
        return None

    update_active_tasks(mutator, path=path)


def record_task_start(payload: dict[str, Any], *, platform: str) -> None:
    prompt = prompt_from_payload(payload)

    if is_usage_report_prompt(prompt):
        key = session_key(payload)

        def mutator(tasks: dict[str, dict[str, Any]]) -> None:
            task = tasks.get(key)
            if task:
                task[SKIP_NEXT_FOLLOWUP_KEY] = True
                tasks[key] = task
            return None

        update_active_tasks(mutator)
        return

    skill, _, _ = detect_task_from_prompt(prompt)
    if not skill:
        return

    task = start_task(payload, platform=platform, prompt=prompt)
    if not task:
        return

    append_ledger(
        {
            "ts": utc_now_iso(),
            "platform": platform,
            "event": "task_start",
            "conversation_id": session_key(payload),
            "task_id": task.get("task_id"),
            "task_skill": task.get("task_skill"),
            "phase": task.get("phase"),
            "prompt_preview": prompt[:200],
        }
    )


def record_turn_end(payload: dict[str, Any], *, platform: str) -> None:
    if platform == "cursor":
        tokens = normalize_tokens_from_cursor(payload)
    else:
        tokens = normalize_tokens_from_claude(payload)

    model_id = resolve_model_id(payload)
    est_cost = estimate_cost_usd(tokens, model_id)
    task = get_active_task(payload)
    status = payload.get("status") or payload.get("stop_reason") or "completed"

    append_ledger(
        {
            "ts": utc_now_iso(),
            "platform": platform,
            "event": "turn_end",
            "conversation_id": session_key(payload),
            "generation_id": payload.get("generation_id"),
            "task_id": task.get("task_id"),
            "task_skill": task.get("task_skill"),
            "phase": task.get("phase"),
            "model_id": model_id,
            "tokens": tokens,
            "est_cost_usd": est_cost,
            "status": status,
            "loop_count": payload.get("loop_count"),
        }
    )


def record_shell(payload: dict[str, Any], *, platform: str) -> None:
    command = str(payload.get("command") or "")
    if not command:
        tool_input = payload.get("tool_input")
        if isinstance(tool_input, dict):
            command = str(tool_input.get("command") or "")

    phase = classify_shell_command(command)
    task = get_active_task(payload)
    duration = _optional_int(payload.get("duration"))

    append_ledger(
        {
            "ts": utc_now_iso(),
            "platform": platform,
            "event": "shell",
            "conversation_id": session_key(payload),
            "task_id": task.get("task_id"),
            "task_skill": task.get("task_skill"),
            "phase": phase or task.get("phase"),
            "command_preview": command[:300],
            "duration_ms": duration,
        }
    )


def record_compact(payload: dict[str, Any], *, platform: str) -> None:
    task = get_active_task(payload)
    append_ledger(
        {
            "ts": utc_now_iso(),
            "platform": platform,
            "event": "compact",
            "conversation_id": session_key(payload),
            "task_id": task.get("task_id"),
            "task_skill": task.get("task_skill"),
            "trigger": payload.get("trigger"),
            "context_usage_percent": payload.get("context_usage_percent"),
            "context_tokens": payload.get("context_tokens"),
            "messages_to_compact": payload.get("messages_to_compact"),
        }
    )


def parse_since(value: str) -> datetime:
    value = value.strip()
    if not value:
        raise ValueError("empty value")
    lower = value.lower()
    try:
        if lower.endswith("d") and lower[:-1].isdigit():
            days = int(lower[:-1])
            if days < 0:
                raise ValueError("negative duration")
            return datetime.now(timezone.utc) - timedelta(days=days)
        if lower.endswith("h") and lower[:-1].isdigit():
            hours = int(lower[:-1])
            if hours < 0:
                raise ValueError("negative duration")
            return datetime.now(timezone.utc) - timedelta(hours=hours)
        iso = value.replace("Z", "+00:00").replace("z", "+00:00")
        dt = datetime.fromisoformat(iso)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError as exc:
        if exc.args and exc.args[0] in ("empty value", "negative duration"):
            raise
        raise ValueError(f"unsupported since format: {value!r}") from exc


def _format_tokens(n: int | None) -> str:
    if n is None:
        return "—"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}k"
    return str(n)


def _format_usd(v: float | None) -> str:
    if v is None:
        return "—"
    return f"${v:.2f}"


def _format_jpy(v: float | None) -> str:
    if v is None:
        return "—"
    return f"¥{v:,.0f}"


def build_turn_usage_followup(payload: dict[str, Any], *, platform: str) -> str | None:
    if platform == "cursor":
        tokens = normalize_tokens_from_cursor(payload)
    else:
        tokens = normalize_tokens_from_claude(payload)

    inp = tokens.get("input")
    out = tokens.get("output")
    if inp is None and out is None:
        return None

    model_id = resolve_model_id(payload)
    cost_usd = estimate_cost_usd(tokens, model_id)
    cost_jpy = usd_to_jpy(cost_usd)

    parts: list[str] = []
    if inp is not None:
        parts.append(f"input {_format_tokens(inp)}")
    fresh = tokens.get("fresh_input")
    if fresh is not None and inp is not None and fresh != inp:
        parts.append(f"fresh {_format_tokens(fresh)}")
    if out is not None:
        parts.append(f"output {_format_tokens(out)}")

    cost_str = _format_jpy(cost_jpy) if cost_jpy is not None else _format_usd(cost_usd)
    token_str = " / ".join(parts)

    min_jpy = followup_min_jpy()
    if min_jpy is not None:
        threshold_jpy = cost_jpy if cost_jpy is not None else usd_to_jpy(cost_usd)
        if threshold_jpy is None or threshold_jpy < min_jpy:
            return None

    return (
        f"{USAGE_REPORT_PREFIX} {token_str}、"
        f"推定 {cost_str}（参考）。応答・思考不要。"
    )


def process_stop_hook(payload: dict[str, Any], *, platform: str) -> dict[str, Any]:
    """stop hook: ledger 記録 + Cursor 向け followup_message（必要時）。"""
    skip_followup = is_usage_report_ack_turn(payload)
    record_turn_end(payload, platform=platform)

    if skip_followup:
        clear_skip_next_followup(payload)
        return {}

    status = str(payload.get("status") or payload.get("stop_reason") or "completed")
    if status in ("aborted", "error"):
        return {}

    if platform != "cursor":
        return {}

    followup = build_turn_usage_followup(payload, platform=platform)
    if not followup:
        return {}

    return {"followup_message": followup}


def aggregate_entries(entries: list[dict[str, Any]]) -> dict[str, Any]:
    by_phase: dict[str, dict[str, Any]] = {}
    totals = {
        "turns": 0,
        "fresh_input": 0,
        "output": 0,
        "est_cost_usd": 0.0,
        "has_cost": False,
    }

    for e in entries:
        if e.get("event") != "turn_end":
            continue

        phase = e.get("phase") or e.get("task_skill") or "unknown"
        bucket = by_phase.setdefault(
            phase,
            {
                "turns": 0,
                "fresh_input": 0,
                "output": 0,
                "est_cost_usd": 0.0,
                "has_cost": False,
            },
        )
        bucket["turns"] += 1
        totals["turns"] += 1

        tokens = e.get("tokens") or {}
        fresh = tokens.get("fresh_input")
        out = tokens.get("output")
        cost = e.get("est_cost_usd")

        if isinstance(fresh, int):
            bucket["fresh_input"] += fresh
            totals["fresh_input"] += fresh
        if isinstance(out, int):
            bucket["output"] += out
            totals["output"] += out
        if isinstance(cost, (int, float)):
            bucket["est_cost_usd"] += float(cost)
            bucket["has_cost"] = True
            totals["est_cost_usd"] += float(cost)
            totals["has_cost"] = True

    return {"by_phase": by_phase, "totals": totals}


def render_report_markdown(
    *,
    title: str,
    entries: list[dict[str, Any]],
    session_id: str | None = None,
    duration_ms: int | None = None,
) -> str:
    agg = aggregate_entries(entries)
    lines = [f"## 使用量: {title}", ""]

    if session_id:
        lines.append(f"- session: `{session_id}`")
    if duration_ms is not None:
        lines.append(f"- duration: {duration_ms / 1000:.0f}s")
    lines.append("")

    lines.extend(
        [
            "| phase | turns | fresh_input | output | est_usd |",
            "| --- | ---: | ---: | ---: | ---: |",
        ]
    )

    for phase, bucket in sorted(agg["by_phase"].items()):
        cost = _format_usd(bucket["est_cost_usd"]) if bucket["has_cost"] else "—"
        lines.append(
            f"| {phase} | {bucket['turns']} | {_format_tokens(bucket['fresh_input'])} | "
            f"{_format_tokens(bucket['output'])} | {cost} |"
        )

    totals = agg["totals"]
    total_cost = _format_usd(totals["est_cost_usd"]) if totals["has_cost"] else "—"
    lines.append(
        f"| **total** | **{totals['turns']}** | **{_format_tokens(totals['fresh_input'])}** | "
        f"**{_format_tokens(totals['output'])}** | **{total_cost}** |"
    )
    lines.append("")
    lines.append(
        "_推定金額は `.agents/config/agent-usage-pricing.json` に基づく参考値です。_"
    )
    return "\n".join(lines)


def filter_entries(
    entries: list[dict[str, Any]],
    *,
    conversation_id: str | None = None,
    task_id: str | None = None,
    task_skill: str | None = None,
    since: datetime | None = None,
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for e in entries:
        if conversation_id and e.get("conversation_id") != conversation_id:
            continue
        if task_id and e.get("task_id") != task_id:
            continue
        if task_skill and e.get("task_skill") != task_skill:
            continue
        if since:
            ts = e.get("ts")
            if not isinstance(ts, str):
                continue
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            except ValueError:
                continue
            if dt < since:
                continue
        result.append(e)
    return result


def record_session_end(payload: dict[str, Any], *, platform: str) -> Path | None:
    sid = session_key(payload)
    entries = filter_entries(load_ledger(), conversation_id=sid)
    if not entries:
        clear_active_task(sid)
        return None

    task = get_active_task(payload)
    title = task.get("task_skill") or sid[:8]
    duration = _optional_int(payload.get("duration_ms"))

    report = render_report_markdown(
        title=str(title),
        entries=entries,
        session_id=sid,
        duration_ms=duration,
    )

    ts_slug = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    sid_short = sid[:8] if len(sid) >= 8 else sid
    report_path = REPORTS_DIR / f"{ts_slug}-{sid_short}.md"
    report_path.write_text(report + "\n", encoding="utf-8")

    append_ledger(
        {
            "ts": utc_now_iso(),
            "platform": platform,
            "event": "session_end",
            "conversation_id": sid,
            "task_id": task.get("task_id"),
            "task_skill": task.get("task_skill"),
            "report_path": str(report_path.relative_to(REPO_ROOT)),
            "duration_ms": duration,
            "reason": payload.get("reason") or payload.get("final_status"),
        }
    )

    clear_active_task(sid)
    return report_path


def last_session_id(*, ledger_path: Path | None = None) -> str | None:
    entries = load_ledger(ledger_path=ledger_path)
    for e in reversed(entries):
        if e.get("event") == "session_end":
            sid = e.get("conversation_id")
            if isinstance(sid, str):
                return sid
    for e in reversed(entries):
        sid = e.get("conversation_id")
        if isinstance(sid, str):
            return sid
    return None
