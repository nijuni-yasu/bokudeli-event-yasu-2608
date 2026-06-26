#!/usr/bin/env bash
# Claude Stop — ターン終了トークン記録（lint-and-format より前に実行）
set -uo pipefail

export AGENT_USAGE_PLATFORM=claude
exec bash "$CLAUDE_PROJECT_DIR/.cursor/hooks/agent-usage-turn-record.sh"
