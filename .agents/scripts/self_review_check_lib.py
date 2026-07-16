"""セルフレビュー完了判定（Stop gate / テスト共用）。"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
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


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def list_review_scope_paths(repo_root: Path, scope: str = "review") -> list[str]:
    """source-change-detect.sh list-paths と同一のパス列挙。"""
    script = repo_root / ".agents/hooks/source-change-detect.sh"
    result = subprocess.run(
        ["bash", str(script), "list-paths", scope],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    return sorted(line.strip() for line in result.stdout.splitlines() if line.strip())


def path_change_signature(repo_root: Path, path: str) -> str:
    """review スコープ内 1 パスの working tree 変更シグネチャ。"""
    full = repo_root / path
    tracked = subprocess.run(
        ["git", "ls-files", "--error-unmatch", path],
        cwd=repo_root,
        capture_output=True,
        text=True,
    )
    if tracked.returncode != 0:
        if full.is_file():
            return _sha256_hex(full.read_bytes())
        return _sha256_hex(b"deleted-or-missing")

    diff_result = subprocess.run(
        ["git", "diff", "HEAD", "--", path],
        cwd=repo_root,
        capture_output=True,
        text=True,
    )
    return _sha256_hex(diff_result.stdout.encode())


def compute_review_scope_fingerprint(
    repo_root: Path,
    scope: str = "review",
) -> str:
    """consume 時点の review スコープ差分 fingerprint（SHA-256 hex）。"""
    parts: list[str] = []
    for path in list_review_scope_paths(repo_root, scope):
        signature = path_change_signature(repo_root, path)
        parts.append(f"{path}\0{signature}")
    return _sha256_hex("\n".join(parts).encode())


def consumed_covers_current_review_scope(
    wake_entry: dict[str, Any],
    repo_root: Path,
    scope: str = "review",
) -> bool:
    """consumed wake の fingerprint が現在の review スコープ差分と一致するか。"""
    saved = wake_entry.get("reviewed_scope_fingerprint")
    if not isinstance(saved, str) or not saved:
        return False
    current = compute_review_scope_fingerprint(repo_root, scope)
    return current == saved


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
    """review doc セッション、ledger、または consumed fingerprint 一致で合格。"""
    root = repo_root or Path.cwd()

    if wake_entry is not None and wake_entry.get("consumed"):
        if not consumed_covers_current_review_scope(wake_entry, root):
            return False
        wake_since = wake_entry.get("since")
        if not isinstance(wake_since, str) or not wake_since:
            return False
        if not is_recording_skipped_branch(branch):
            review_doc = root / review_doc_path_for_branch(branch)
            return has_review_doc_session_since(review_doc, wake_since)
        ledger_path = root / ".agents/state/agent-usage/ledger.jsonl"
        return has_ledger_self_review_since(
            ledger_path,
            conversation_id=conversation_id,
            since=wake_since,
        )

    # 通常ブランチ: 未消費 wake では review doc のみで合格させない（追加修正後の gate 迂回防止）
    if not is_recording_skipped_branch(branch):
        return False

    ledger_path = root / ".agents/state/agent-usage/ledger.jsonl"
    if has_ledger_self_review_since(
        ledger_path,
        conversation_id=conversation_id,
        since=since,
    ):
        return True

    return False
