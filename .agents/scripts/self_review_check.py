#!/usr/bin/env python3
"""セルフレビュー完了判定 CLI（Stop gate 用）。"""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import self_review_check_lib as lib  # noqa: E402
import self_review_wake as wake  # noqa: E402

DEFAULT_WAKE_FILE = wake.DEFAULT_WAKE_FILE


def current_branch(repo_root: Path) -> str:
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=repo_root,
        check=True,
        capture_output=True,
        text=True,
    )
    branch = result.stdout.strip()
    if not branch:
        raise RuntimeError("git branch --show-current が空です")
    return branch


def ensure_pending_wake(
    wake_path: Path,
    *,
    branch: str,
    conversation_id: str | None,
) -> dict:
    """テスト用: pending wake を明示的に作成する。"""
    entry = wake.get_wake_for_branch(wake_path, branch)
    if entry is not None and not entry.get("consumed"):
        return entry

    since = datetime.now(timezone.utc).isoformat()
    wake.write_pending_wake(
        wake_path,
        branch=branch,
        since=since,
        conversation_id=conversation_id,
    )
    entry = wake.get_wake_for_branch(wake_path, branch)
    if entry is None:
        raise RuntimeError("pending wake の write に失敗しました")
    return entry


def resolve_since(entry: dict) -> str:
    for key in ("since", "lint_passed_at"):
        value = entry.get(key)
        if isinstance(value, str) and value:
            return value
    raise RuntimeError(
        "pending wake に since / lint_passed_at がありません。"
        "self_review_wake.py write で since を設定してください。"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Self-review completion check")
    parser.add_argument("--repo-root", type=Path, default=Path.cwd())
    parser.add_argument("--wake-file", type=Path, default=DEFAULT_WAKE_FILE)
    parser.add_argument("--branch")
    parser.add_argument("--conversation-id")
    parser.add_argument(
        "--ensure-pending",
        action="store_true",
        help="テスト用: 未作成なら pending wake を write する（Stop hook では使わない）",
    )
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    wake_path = (repo_root / args.wake_file).resolve()

    try:
        branch = args.branch or current_branch(repo_root)
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    entry = wake.get_wake_for_branch(wake_path, branch)
    if args.ensure_pending:
        entry = ensure_pending_wake(
            wake_path,
            branch=branch,
            conversation_id=args.conversation_id,
        )

    if entry is None:
        print(
            "[self-review] pending wake がありません。"
            "/shokujii-code-review 手順 0（self_review_wake.py write）を先に実行してください。",
            file=sys.stderr,
        )
        return 2

    try:
        since = resolve_since(entry)
    except RuntimeError as exc:
        print(f"[self-review] {exc}", file=sys.stderr)
        return 2

    if lib.is_self_review_complete(
        branch=branch,
        since=since,
        conversation_id=args.conversation_id,
        wake_entry=entry,
        repo_root=repo_root,
    ):
        return 0

    if entry.get("consumed"):
        print(
            "[self-review] wake は consume 済みです。"
            "ソース変更後は /shokujii-code-review 手順 0 から再実行してください。",
            file=sys.stderr,
        )
        return 2

    slug = lib.branch_to_slug(branch)
    review_doc = lib.review_doc_path_for_branch(branch)
    skip_doc = lib.is_recording_skipped_branch(branch)

    lines = [
        "[self-review] /shokujii-code-review が未完了です。",
        "shokujii-code-review スキルを完走し、指摘があれば修正してください。",
    ]
    if skip_doc:
        lines.append(
            "（記録対象外ブランチのため review doc への追記は任意。ledger 上のスキル完走で可）"
        )
    else:
        lines.append(
            f"review doc: {review_doc} に「## 評価セッション（…・shokujii-code-review）」を追記してください。"
        )
    lines.append(f"branch: {branch} (slug: {slug})")

    print("\n".join(lines), file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
