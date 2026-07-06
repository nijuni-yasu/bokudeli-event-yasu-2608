#!/usr/bin/env python3
"""Parse GCP Cloud Logging ERROR entries for Shokujii triage."""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from typing import Any


CLIENT_ERROR_NOISE_PATTERNS = (
    "serviceworker",
    "service worker",
    "failed to fetch dynamically imported module",
    "connection failed.",
    "load failed",
    "failed to register a serviceworker",
)

CLIENT_ERROR_ACTIONABLE_PATTERNS = (
    "storage/unauthorized",
    "missing or insufficient permissions",
    "zoderror",
    "invalid_enum_value",
)


def is_serviceworker_standalone_rejected(message: str) -> bool:
    """ServiceWorker 登録失敗時の単体メッセージ。部分一致 rejected は正当 ERROR を誤除外するため使わない。"""
    return message.strip().lower() == "rejected"


def load_entries(source: str | None) -> list[dict[str, Any]]:
    if source is None or source == "-":
        raw = sys.stdin.read()
    else:
        with open(source, encoding="utf-8") as handle:
            raw = handle.read()
    data = json.loads(raw)
    if not isinstance(data, list):
        raise ValueError("Expected JSON array of log entries")
    return [entry for entry in data if entry.get("severity") == "ERROR"]


def log_type(entry: dict[str, Any]) -> str:
    log_name = entry.get("logName", "")
    if "cloudaudit" in log_name:
        return "audit"
    if "cloudscheduler" in log_name:
        return "scheduler"
    if entry.get("httpRequest"):
        return "http_request"
    if entry.get("jsonPayload"):
        return "json_payload"
    if entry.get("textPayload"):
        return "text_payload"
    return "other"


def extract_message(entry: dict[str, Any]) -> str:
    if "textPayload" in entry:
        return str(entry["textPayload"])
    json_payload = entry.get("jsonPayload") or {}
    if json_payload.get("error_message"):
        return str(json_payload["error_message"])
    if json_payload.get("message"):
        return str(json_payload["message"])
    proto = entry.get("protoPayload") or {}
    status = proto.get("status") or {}
    if status.get("message"):
        return str(status["message"])
    if json_payload.get("status"):
        return str(json_payload["status"])
    return ""


def service_name(entry: dict[str, Any]) -> str | None:
    labels = (entry.get("resource") or {}).get("labels") or {}
    return labels.get("service_name") or labels.get("function_name")


def project_id(entries: list[dict[str, Any]]) -> str | None:
    for entry in entries:
        labels = (entry.get("resource") or {}).get("labels") or {}
        if labels.get("project_id"):
            return str(labels["project_id"])
    return None


def classify_tier(entry: dict[str, Any], message: str) -> str:
    log_name = entry.get("logName", "")
    json_payload = entry.get("jsonPayload") or {}
    module = str(json_payload.get("module", ""))
    lower = message.lower()

    if "cloudaudit" in log_name or "cloudscheduler" in log_name:
        return "infra"

    if module == "clientError":
        if any(pattern in lower for pattern in CLIENT_ERROR_ACTIONABLE_PATTERNS):
            return "P1"
        if is_serviceworker_standalone_rejected(message):
            return "noise"
        if any(pattern in lower for pattern in CLIENT_ERROR_NOISE_PATTERNS):
            return "noise"
        return "P1"

    if module == "slackMessage" and json_payload.get("status") is not None:
        return "P1"

    if module == "userProfileBackfill":
        return "P1"

    if "requires an index" in lower or "failed_precondition" in lower:
        return "P1"

    if "slack webhook request failed" in lower or "failed to send slack message" in lower:
        return "P1"

    if entry.get("httpRequest", {}).get("status") == 500:
        return "P1"

    if "was not found" in lower and "functions/" in lower:
        return "infra"

    return "P1"


def group_key(entry: dict[str, Any], message: str) -> str:
    json_payload = entry.get("jsonPayload") or {}

    if json_payload.get("module") == "clientError" and json_payload.get("fingerprint"):
        return f"fingerprint:{json_payload['fingerprint']}"

    error_groups = entry.get("errorGroups") or []
    if error_groups and error_groups[0].get("id"):
        return f"errorGroup:{error_groups[0]['id']}"

    if json_payload.get("fingerprint"):
        return f"fingerprint:{json_payload['fingerprint']}"

    if json_payload.get("module") == "clientError" and json_payload.get("error_message"):
        return f"clientError:{json_payload['error_message'][:160]}"

    index_match = re.search(r"create_composite=[A-Za-z0-9_-]+", message)
    if index_match:
        return f"firestore_index:{index_match.group(0)}"

    if "requires an index" in message.lower():
        return "firestore_index:missing"

    proto = entry.get("protoPayload") or {}
    status_message = (proto.get("status") or {}).get("message")
    if status_message:
        return f"audit:{status_message[:160]}"

    if json_payload.get("module") == "slackMessage":
        status = json_payload.get("status")
        if json_payload.get("failedCount") is not None:
            return "slack:partial_bot_failure"
        return f"slack:webhook_status_{status}"

    if json_payload.get("module") == "userProfileBackfill":
        user_id = str(json_payload.get("userId", ""))
        if user_id.startswith("http"):
            return "backfill:invalid_user_id_url"
        return "backfill:failure"

    first_line = message.split("\n", 1)[0].strip()
    normalized = re.sub(r"\s+", " ", first_line)[:160]
    svc = service_name(entry) or "unknown"
    return f"{svc}:{normalized or log_type(entry)}"


def is_http_shell(entry: dict[str, Any], message: str) -> bool:
    return bool(entry.get("httpRequest")) and message.strip() == ""


def group_key_priority(key: str) -> int:
    if key.startswith("errorGroup:"):
        return 0
    if key.startswith("firestore_index:"):
        return 1
    if key.startswith("fingerprint:"):
        return 2
    if key.startswith("clientError:"):
        return 3
    if key.startswith("audit:"):
        return 4
    if key.startswith("slack:"):
        return 5
    if key.startswith("backfill:"):
        return 6
    return 9


def build_trace_canonical_keys(entries: list[dict[str, Any]]) -> dict[str, str]:
    by_trace: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for entry in entries:
        trace = entry.get("trace")
        if not trace:
            continue
        message = extract_message(entry)
        if is_http_shell(entry, message):
            continue
        raw_key = group_key(entry, message)
        by_trace[str(trace)].append((raw_key, message))

    canonical: dict[str, str] = {}
    for trace, candidates in by_trace.items():
        if not candidates:
            continue
        best_key = min(
            candidates,
            key=lambda item: (group_key_priority(item[0]), -len(item[1]), item[0]),
        )[0]
        canonical[trace] = best_key
    return canonical


def resolve_group_key(
    entry: dict[str, Any],
    message: str,
    trace_canonical: dict[str, str],
) -> str:
    raw_key = group_key(entry, message)
    trace = entry.get("trace")
    if is_http_shell(entry, message) and trace and str(trace) in trace_canonical:
        return trace_canonical[str(trace)]
    return raw_key


def mask_sensitive(value: str) -> str:
    if not value:
        return value
    masked = re.sub(
        r"(users/)[A-Za-z0-9_-]{8,}",
        r"\1***",
        value,
    )
    masked = re.sub(
        r"(communities/)[A-Za-z0-9_-]{8,}",
        r"\1***",
        masked,
    )
    masked = re.sub(
        r"gs://[A-Za-z0-9._-]+/[^\s\"']+",
        "gs://***/***",
        masked,
    )
    masked = re.sub(
        r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
        "***.***.***.***",
        masked,
    )
    masked = re.sub(
        r"\b(?:[0-9a-fA-F]{0,4}:){2,}[0-9a-fA-F:]{0,}\b",
        "****:****:****:****",
        masked,
    )
    return masked


def is_stderr_entry(entry: dict[str, Any]) -> bool:
    log_name = entry.get("logName", "")
    if "stderr" in log_name:
        return True
    if entry.get("textPayload"):
        return True
    return False


def build_trace_links(entries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_trace: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for entry in entries:
        trace = entry.get("trace")
        if trace:
            by_trace[trace].append(entry)

    links: list[dict[str, Any]] = []
    for trace, trace_entries in by_trace.items():
        http_entries = [e for e in trace_entries if e.get("httpRequest")]
        stderr_entries = [e for e in trace_entries if is_stderr_entry(e)]
        if not http_entries or not stderr_entries:
            continue
        stderr_entries.sort(key=lambda e: len(extract_message(e)), reverse=True)
        http_status = http_entries[0].get("httpRequest", {}).get("status")
        stderr_message = extract_message(stderr_entries[0])
        links.append(
            {
                "trace": trace,
                "http_status": http_status,
                "service_name": service_name(http_entries[0]),
                "stderr_summary": mask_sensitive(stderr_message.split("\n", 1)[0][:200]),
            }
        )
    return links


def summarize_client_errors(entries: list[dict[str, Any]]) -> dict[str, Any]:
    client_entries = [
        e
        for e in entries
        if (e.get("jsonPayload") or {}).get("module") == "clientError"
    ]
    if not client_entries:
        return {}

    noise_count = 0
    actionable_count = 0
    fingerprint_counts: Counter[str] = Counter()
    fingerprint_samples: dict[str, dict[str, Any]] = {}

    for entry in client_entries:
        message = extract_message(entry)
        tier = classify_tier(entry, message)
        json_payload = entry.get("jsonPayload") or {}
        fingerprint = str(json_payload.get("fingerprint", "unknown"))
        fingerprint_counts[fingerprint] += 1
        if tier == "noise":
            noise_count += 1
        else:
            actionable_count += 1
        if fingerprint not in fingerprint_samples:
            fingerprint_samples[fingerprint] = {
                "count": 0,
                "tier": tier,
                "error_message": mask_sensitive(str(json_payload.get("error_message", ""))[:160]),
                "route": str(json_payload.get("route", "")),
                "app": str(json_payload.get("app", "")),
            }
        fingerprint_samples[fingerprint]["count"] = fingerprint_counts[fingerprint]

    top_fingerprints = sorted(
        fingerprint_samples.values(),
        key=lambda item: (-item["count"], item["error_message"]),
    )[:15]

    return {
        "total": len(client_entries),
        "noise_count": noise_count,
        "actionable_count": actionable_count,
        "top_fingerprints": top_fingerprints,
    }


def parse_entries(entries: list[dict[str, Any]]) -> dict[str, Any]:
    timestamps = [entry.get("timestamp", "") for entry in entries if entry.get("timestamp")]
    groups: dict[str, dict[str, Any]] = {}
    entry_tier_counts: Counter[str] = Counter()
    trace_canonical = build_trace_canonical_keys(entries)

    for entry in entries:
        message = extract_message(entry)
        key = resolve_group_key(entry, message, trace_canonical)
        tier = classify_tier(entry, message)
        entry_tier_counts[tier] += 1
        if key not in groups:
            groups[key] = {
                "group_key": key,
                "count": 0,
                "severity_tier": tier,
                "service_names": Counter(),
                "log_types": Counter(),
                "sample_message": mask_sensitive(message.split("\n", 1)[0][:240]),
                "fingerprints": set(),
                "traces": set(),
                "error_group_ids": set(),
            }
        group = groups[key]
        group["count"] += 1
        if not group["sample_message"] and message.strip():
            group["sample_message"] = mask_sensitive(message.split("\n", 1)[0][:240])
        svc = service_name(entry)
        if svc:
            group["service_names"][svc] += 1
        group["log_types"][log_type(entry)] += 1
        json_payload = entry.get("jsonPayload") or {}
        if json_payload.get("fingerprint"):
            group["fingerprints"].add(str(json_payload["fingerprint"]))
        if entry.get("trace"):
            group["traces"].add(str(entry["trace"]))
        error_groups = entry.get("errorGroups") or []
        if error_groups and error_groups[0].get("id"):
            group["error_group_ids"].add(str(error_groups[0]["id"]))
        if tier == "P0" or (tier == "P1" and group["severity_tier"] == "noise"):
            group["severity_tier"] = tier
        elif tier == "P1" and group["severity_tier"] == "infra":
            group["severity_tier"] = "P1"

    grouped_list = []
    tier_order = {"P0": 0, "P1": 1, "infra": 2, "noise": 3}
    for group in groups.values():
        grouped_list.append(
            {
                "group_key": group["group_key"],
                "count": group["count"],
                "severity_tier": group["severity_tier"],
                "service_names": dict(group["service_names"]),
                "log_types": dict(group["log_types"]),
                "sample_message": group["sample_message"],
                "fingerprints": sorted(group["fingerprints"]),
                "traces": sorted(group["traces"])[:5],
                "error_group_ids": sorted(group["error_group_ids"]),
            }
        )
    grouped_list.sort(key=lambda item: (tier_order.get(item["severity_tier"], 9), -item["count"], item["group_key"]))

    group_tier_counts = Counter(item["severity_tier"] for item in grouped_list)
    client_error_summary = summarize_client_errors(entries)

    return {
        "project_id": project_id(entries),
        "time_range": {
            "start": min(timestamps) if timestamps else None,
            "end": max(timestamps) if timestamps else None,
        },
        "total_errors": len(entries),
        "unique_groups": len(grouped_list),
        "entry_tier_counts": dict(entry_tier_counts),
        "group_tier_counts": dict(group_tier_counts),
        "tier_counts": dict(group_tier_counts),
        "groups": grouped_list,
        "client_error_summary": client_error_summary,
        "trace_links": build_trace_links(entries),
    }


def render_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# GCP ERROR 解析サマリー",
        "",
        f"- Project: `{summary.get('project_id')}`",
        f"- 期間: {summary['time_range']['start']} .. {summary['time_range']['end']}",
        f"- ERROR 件数: {summary['total_errors']}（ユニークグループ: {summary['unique_groups']}）",
        f"- ERROR 件数 tier 内訳: {summary.get('entry_tier_counts')}",
        f"- グループ tier 内訳: {summary.get('group_tier_counts')}",
        "",
    ]

    client = summary.get("client_error_summary") or {}
    if client:
        lines.extend(
            [
                "## reportClientError",
                "",
                f"- 合計: {client.get('total')}（ノイズ: {client.get('noise_count')} / 要対応: {client.get('actionable_count')}）",
                "",
            ]
        )
        for item in client.get("top_fingerprints", [])[:8]:
            lines.append(
                f"- {item['count']}x [{item['tier']}] {item['error_message']} (route={item.get('route')})"
            )
        lines.append("")

    lines.append("## グループ一覧")
    lines.append("")
    for group in summary.get("groups", []):
        services = ", ".join(group.get("service_names", {}).keys()) or "-"
        lines.append(
            f"- **{group['severity_tier']}** x{group['count']} `{group['group_key']}` services={services}"
        )
        lines.append(f"  - {group['sample_message']}")
    lines.append("")

    trace_links = summary.get("trace_links") or []
    if trace_links:
        lines.append("## trace 紐付け")
        lines.append("")
        for link in trace_links[:10]:
            lines.append(
                f"- HTTP {link.get('http_status')} `{link.get('service_name')}` → {link.get('stderr_summary')}"
            )
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse GCP Cloud Logging ERROR entries")
    parser.add_argument(
        "file",
        nargs="?",
        default="-",
        help="JSON file path or '-' for stdin",
    )
    parser.add_argument(
        "--format",
        choices=("json", "md"),
        default="json",
        help="Output format",
    )
    args = parser.parse_args()

    entries = load_entries(None if args.file == "-" else args.file)
    summary = parse_entries(entries)

    if args.format == "md":
        print(render_markdown(summary))
    else:
        json.dump(summary, sys.stdout, ensure_ascii=False, indent=2)
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
