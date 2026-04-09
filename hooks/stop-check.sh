#!/bin/bash
# Harness Stop Hook — blocks exit until all tasks pass
# Uses Node.js for JSON parsing (project already requires Node >= 20)

# Infinite loop guard: lockfile with 30-second cooldown
LOCKFILE="/tmp/harness-stop-hook-blocked"
if [ -f "$LOCKFILE" ]; then
  LOCK_AGE=$(( $(date +%s) - $(stat -c %Y "$LOCKFILE" 2>/dev/null || echo 0) ))
  if [ "$LOCK_AGE" -lt 30 ]; then
    echo '{"decision":"allow"}'
    rm -f "$LOCKFILE"
    exit 0
  fi
fi

# Find active feature_tests.json
FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' 2>/dev/null | head -1)

if [ -z "$FEATURE_TESTS" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Use Node.js (already required by this project) for reliable JSON handling
RESULT=$(node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
  const tasks = data.tasks || [];
  const total = tasks.length;
  const passed = tasks.filter(t => t.passes).length;
  const failed = tasks.filter(t => !t.passes);

  if (passed === total) {
    console.log(JSON.stringify({ decision: 'allow' }));
  } else {
    const remaining = failed.map(t => '  - Task ' + t.id + ': ' + t.description).join('\n');
    const reason = 'Harness: ' + passed + '/' + total + ' tasks passed. Remaining:\n' + remaining + '\nContinue working on the next failing task.';
    console.log(JSON.stringify({ decision: 'block', reason }));
  }
} catch (e) {
  console.log(JSON.stringify({ decision: 'allow' }));
}
" "$FEATURE_TESTS" 2>/dev/null)

# If node failed, allow exit
if [ -z "$RESULT" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Check decision and manage lockfile
DECISION=$(node -e "console.log(JSON.parse(process.argv[1]).decision || 'allow')" "$RESULT" 2>/dev/null)
if [ "$DECISION" = "block" ]; then
  touch "$LOCKFILE"
  echo "$RESULT"
  exit 2
else
  rm -f "$LOCKFILE"
  echo "$RESULT"
  exit 0
fi
