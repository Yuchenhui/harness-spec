#!/bin/bash
# Harness SessionStart Hook
#
# Fires when a new Claude Code session starts.
# Detects active harness work and prints progress summary
# so Claude immediately knows the current state.

# Find active feature_tests.json files
FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' 2>/dev/null | head -1)

if [ -z "$FEATURE_TESTS" ]; then
  exit 0
fi

CHANGE_DIR=$(dirname "$FEATURE_TESTS")
CHANGE_ID=$(basename "$CHANGE_DIR")

# Parse progress
SUMMARY=$(python3 -c "
import json, sys
with open('$FEATURE_TESTS') as f:
    data = json.load(f)
tasks = data.get('tasks', [])
total = len(tasks)
passed = [t for t in tasks if t.get('passes')]
failed = [t for t in tasks if not t.get('passes')]

print(f'Active harness: {data.get(\"change_id\", \"unknown\")}')
print(f'Progress: {len(passed)}/{total} tasks passed')
print()
if passed:
    print('Completed:')
    for t in passed:
        print(f'  [x] {t[\"id\"]} {t[\"description\"]}')
if failed:
    print('Remaining:')
    for t in failed:
        attempts = t.get('evaluation_attempts', 0)
        suffix = f' ({attempts} attempts)' if attempts > 0 else ''
        print(f'  [ ] {t[\"id\"]} {t[\"description\"]}{suffix}')
    print()
    next_task = failed[0]
    print(f'Next: Task {next_task[\"id\"]} - {next_task[\"description\"]}')
" 2>/dev/null)

# Also check for progress notes
PROGRESS_TXT="$CHANGE_DIR/claude-progress.txt"
NOTES=""
if [ -f "$PROGRESS_TXT" ]; then
  NOTES=$(grep -A 100 '### Notes' "$PROGRESS_TXT" 2>/dev/null | tail -n +2 | head -10)
fi

if [ -n "$SUMMARY" ]; then
  echo "--- Harness Status ---"
  echo "$SUMMARY"
  if [ -n "$NOTES" ]; then
    echo ""
    echo "Notes from last session:"
    echo "$NOTES"
  fi
  echo "---"
fi

exit 0
