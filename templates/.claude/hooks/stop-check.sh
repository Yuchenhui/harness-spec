#!/bin/bash
# Harness Stop Hook
# Inspired by ralph-wiggum (Anthropic official plugin)
#
# This hook fires when Claude tries to stop/exit.
# It checks if all tasks in feature_tests.json have passed.
# If not, it blocks the exit and tells Claude to continue.
#
# Returns:
#   exit 0 + JSON {"decision":"allow"} → Claude can stop
#   exit 2 + JSON {"decision":"block","reason":"..."} → Claude must continue
#
# Safety: checks stop_hook_active to prevent infinite loops.
# On the second pass (Claude was already blocked once and tried to stop again),
# we allow exit to avoid getting stuck.

# Read stdin for event data (contains stop_hook_active field)
INPUT=$(cat)

# CRITICAL: Infinite loop guard
# If stop_hook_active is true, Claude was already blocked once in this turn.
# Allow exit to prevent infinite block loops.
STOP_HOOK_ACTIVE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(str(data.get('stop_hook_active', False)).lower())
except:
    print('false')
" 2>/dev/null)

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Find the active feature_tests.json
FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' -newer .git/HEAD 2>/dev/null | head -1)

# If no feature_tests.json exists, allow exit (not in harness mode)
if [ -z "$FEATURE_TESTS" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Check if all tasks pass
TOTAL=$(python3 -c "
import json, sys
with open('$FEATURE_TESTS') as f:
    data = json.load(f)
tasks = data.get('tasks', [])
print(len(tasks))
" 2>/dev/null)

PASSED=$(python3 -c "
import json, sys
with open('$FEATURE_TESTS') as f:
    data = json.load(f)
tasks = data.get('tasks', [])
passed = [t for t in tasks if t.get('passes')]
print(len(passed))
" 2>/dev/null)

FAILED_TASKS=$(python3 -c "
import json, sys
with open('$FEATURE_TESTS') as f:
    data = json.load(f)
tasks = data.get('tasks', [])
failed = [t for t in tasks if not t.get('passes')]
for t in failed:
    print(f\"  - Task {t['id']}: {t['description']}\")
" 2>/dev/null)

# If parsing failed, allow exit
if [ -z "$TOTAL" ] || [ -z "$PASSED" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# All passed → allow exit
if [ "$PASSED" = "$TOTAL" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Not all passed → block exit, tell Claude to continue
REASON="Harness: $PASSED/$TOTAL tasks passed. Remaining tasks:\n$FAILED_TASKS\n\nContinue working on the next failing task. Run evaluator subagent after implementation."

echo "{\"decision\":\"block\",\"reason\":\"$REASON\"}"
exit 2
