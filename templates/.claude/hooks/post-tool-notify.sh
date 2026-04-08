#!/bin/bash
# Harness PostToolUse Hook (for Bash tool, specifically git commit)
#
# Fires after a Bash tool use. If the command was a git commit,
# reminds Claude to run the evaluator subagent.
#
# Input: receives tool use details via environment or stdin
# This hook is advisory — it doesn't block, just provides feedback.

# The tool input is passed via CLAUDE_TOOL_INPUT env var or stdin
INPUT="${CLAUDE_TOOL_INPUT:-$(cat)}"

# Check if this was a git commit command
if echo "$INPUT" | grep -q 'git commit'; then
  echo "Harness reminder: git commit detected. Launch evaluator subagent to verify the task before proceeding to the next one."
fi

exit 0
