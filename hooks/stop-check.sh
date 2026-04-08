#!/bin/bash
# Harness Stop Hook
# Inspired by ralph-wiggum (Anthropic official plugin)
#
# Checks feature_tests.json — blocks exit if any task has passes: false.
# Uses python3 for JSON generation to avoid escaping issues.
#
# Returns JSON to stdout:
#   {"decision":"allow"}              → Claude can stop (exit 0)
#   {"decision":"block","reason":"…"} → Claude must continue (exit 2)

# Infinite loop guard: use a lockfile to detect repeated blocking.
# If we blocked within the last 30 seconds, allow exit to prevent infinite loops.
LOCKFILE="/tmp/harness-stop-hook-blocked"
if [ -f "$LOCKFILE" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo 0) ))
  if [ "$LOCK_AGE" -lt 30 ]; then
    echo '{"decision":"allow"}'
    rm -f "$LOCKFILE"
    exit 0
  fi
fi

# Find active feature_tests.json (no -newer filter — avoid race conditions)
FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' 2>/dev/null | head -1)

# If no feature_tests.json exists, allow exit (not in harness mode)
if [ -z "$FEATURE_TESTS" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Use python3 to parse AND produce valid JSON (avoids shell escaping issues)
RESULT=$(python3 -c "
import json, sys

try:
    with open('$FEATURE_TESTS') as f:
        data = json.load(f)
except:
    print(json.dumps({'decision': 'allow'}))
    sys.exit(0)

tasks = data.get('tasks', [])
total = len(tasks)
passed = [t for t in tasks if t.get('passes')]
failed = [t for t in tasks if not t.get('passes')]

if len(passed) == total:
    print(json.dumps({'decision': 'allow'}))
else:
    remaining = []
    for t in failed:
        remaining.append(f\"  - Task {t['id']}: {t['description']}\")
    reason = f\"Harness: {len(passed)}/{total} tasks passed. Remaining:\\n\" + '\\n'.join(remaining) + '\\nContinue working on the next failing task.'
    print(json.dumps({'decision': 'block', 'reason': reason}))
" 2>/dev/null)

# If python3 failed, allow exit
if [ -z "$RESULT" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Check if we're blocking — if so, create lockfile for loop guard
DECISION=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('decision','allow'))" 2>/dev/null)
if [ "$DECISION" = "block" ]; then
  touch "$LOCKFILE"
  echo "$RESULT"
  exit 2
else
  rm -f "$LOCKFILE"
  echo "$RESULT"
  exit 0
fi
