"""セルフレビュー完了判定（Stop gate / テスト共用）。"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

REVIEW_DOC_DIR = Path("documents/レビューコメント")
SESSION_HEADING_RE = re.compile(
    r"^##\s+評価セッション（.+?・shokujii-code-review）",
    re.MULTILINE,
)
RECORDING_SKIP_PREFIXES = ("release/", "sync/", "hotfix/", "backup/", "tree/")
# 評価セッション見出しの日時は JST ローカル（Phase 1 日本語 UI 前提）
SESSION_TZ = ZoneInfo("Asia/Tokyo")


def branch_to_slug(branch: str) -> str:
    return branch.replace("/", "-")


def review_doc_path_for_branch(branch: str) -> Path:
    return REVIEW_DOC_DIR / f"review-{branch_to_slug(branch)}.md"


def is_recording_skipped_branch(branch: str) -> bool:
    return any(branch.startswith(prefix) for prefix in RECORDING_SKIP_PREFIXES)


def parse_iso8601(value: str) -> datetime | None:
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def to_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=SESSION_TZ).astimezone(timezone.utc)
    return dt.astimezone(timezone.utc)


def _session_timestamp_from_heading(heading: str) -> datetime | None:
    # ## 評価セッション（2026-07-16 16:00・shokujii-code-review）
    match = re.search(r"評価セッション（(.+?)・shokujii-code-review）", heading)
    if match is None:
        return None
    raw = match.group(1).strip()
    for fmt in (
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
    ):
        try:
            parsed = datetime.strptime(raw, fmt)
            if parsed.tzinfo is None and "%z" not in fmt:
                parsed = parsed.replace(tzinfo=SESSION_TZ)
            return parsed
        except ValueError:
            continue
    iso = parse_iso8601(raw)
    if iso is not None and iso.tzinfo is None:
        return iso.replace(tzinfo=SESSION_TZ)
    return iso


def has_review_doc_session_since(review_doc: Path, since: str) -> bool:
    if not review_doc.exists():
        return False

    since_dt = parse_iso8601(since)
    if since_dt is None:
        return False

    since_utc = to_utc(since_dt).replace(second=0, microsecond=0)
    text = review_doc.read_text(encoding="utf-8")
    for match in SESSION_HEADING_RE.finditer(text):
        session_dt = _session_timestamp_from_heading(match.group(0))
        if session_dt is None:
            continue
        session_utc = to_utc(session_dt).replace(second=0, microsecond=0)
        if session_utc >= since_utc:
            return True
    return False


def has_ledger_self_review_since(
    ledger_path: Path,
    *,
    conversation_id: str | None,
    since: str,
) -> bool:
    if conversation_id is None or not ledger_path.exists():
        return False

    since_dt = parse_iso8601(since)
    if since_dt is None:
        return False

    since_utc = to_utc(since_dt)
    for line in ledger_path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            entry: dict[str, Any] = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("event") != "turn_end":
            continue
        if entry.get("conversation_id") != conversation_id:
            continue
        if entry.get("task_skill") != "shokujii-code-review":
            continue
        ts = parse_iso8601(str(entry.get("ts", "")))
        if ts is not None and to_utc(ts) >= since_utc:
            return True
    return False


def is_self_review_complete(
    *,
    branch: str,
    since: str,
    conversation_id: str | None,
    wake_entry: dict[str, Any] | None,
    repo_root: Path | None = None,
) -> bool:
    """review doc セッションまたは ledger の shokujii-code-review 完走で合格。"""
    if wake_entry is not None and wake_entry.get("consumed"):
        return False

    root = repo_root or Path.cwd()

    if not is_recording_skipped_branch(branch):
        review_doc = root / review_doc_path_for_branch(branch)
        if has_review_doc_session_since(review_doc, since):
            return True
        return False

    ledger_path = root / ".agents/state/agent-usage/ledger.jsonl"
    if has_ledger_self_review_since(
        ledger_path,
        conversation_id=conversation_id,
        since=since,
    ):
        return True

    return False
