#!/usr/bin/env bash
# Claude UserPromptSubmit — タスク開始記録
set -uo pipefail

export AGENT_USAGE_PLATFORM=claude
exec bash "$CLAUDE_PROJECT_DIR/.cursor/hooks/agent-usage-task-start.sh"
