#!/usr/bin/env bash
# Claude PostToolUse Bash — shell duration 記録
set -uo pipefail

export AGENT_USAGE_PLATFORM=claude
exec bash "$CLAUDE_PROJECT_DIR/.cursor/hooks/agent-usage-shell-record.sh"
