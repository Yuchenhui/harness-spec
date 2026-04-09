#!/bin/bash
# Harness SessionStart Hook — auto-loads progress state
# Uses Node.js (already required by this project)

FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' 2>/dev/null | head -1)

if [ -z "$FEATURE_TESTS" ]; then
  exit 0
fi

node -e "
const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
  const tasks = data.tasks || [];
  const total = tasks.length;
  const passed = tasks.filter(t => t.passes);
  const failed = tasks.filter(t => !t.passes);

  console.log('--- Harness Status: ' + (data.change_id || 'unknown') + ' ---');
  console.log('Progress: ' + passed.length + '/' + total + ' tasks passed');

  if (passed.length > 0) {
    console.log('Completed:');
    passed.forEach(t => console.log('  [x] ' + t.id + ' ' + t.description));
  }
  if (failed.length > 0) {
    console.log('Remaining:');
    failed.forEach(t => {
      const a = t.evaluation_attempts || 0;
      const s = a > 0 ? ' (' + a + ' attempts)' : '';
      console.log('  [ ] ' + t.id + ' ' + t.description + s);
    });
    console.log('');
    console.log('Next: Task ' + failed[0].id + ' - ' + failed[0].description);
  }
  console.log('---');
} catch (e) {
  // Silently fail if file can't be parsed
}
" "$FEATURE_TESTS" 2>/dev/null

exit 0
