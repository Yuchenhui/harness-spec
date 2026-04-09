#!/bin/bash
# Harness PostToolUse Hook — reminds to evaluate after git commit
# No external dependencies needed for this one

INPUT="${CLAUDE_TOOL_INPUT:-$(cat)}"

if echo "$INPUT" | grep -qE '^\s*git\s+commit\b'; then
  echo "Harness: git commit detected. Launch evaluator subagent to verify before proceeding."
fi

exit 0
