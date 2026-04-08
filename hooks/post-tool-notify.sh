#!/bin/bash
# Harness PostToolUse Hook — reminds to evaluate after git commit
# No external dependencies needed for this one

INPUT="${CLAUDE_TOOL_INPUT:-$(cat)}"

if echo "$INPUT" | grep -q 'git commit'; then
  echo "Harness: git commit detected. Launch evaluator subagent to verify before proceeding."
fi

exit 0
