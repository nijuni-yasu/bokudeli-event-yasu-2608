#!/usr/bin/env bash
# Claude SessionEnd — session サマリ
set -uo pipefail

export AGENT_USAGE_PLATFORM=claude
exec bash "$CLAUDE_PROJECT_DIR/.cursor/hooks/agent-usage-session-end.sh"
