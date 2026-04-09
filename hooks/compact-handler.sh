#!/bin/bash
# Harness Compact Handler
# Fires on PreCompact: saves progress state before context compaction
# Fires on PostCompact: re-injects essential state after compaction

EVENT="${1:-precompact}"

FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' 2>/dev/null | head -1)

if [ -z "$FEATURE_TESTS" ]; then
  exit 0
fi

CHANGE_DIR=$(dirname "$FEATURE_TESTS")

if [ "$EVENT" = "precompact" ]; then
  # Save current state to progress file before compaction
  node -e "
  const fs = require('fs');
  try {
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const tasks = data.tasks || [];
    const passed = tasks.filter(t => t.passes);
    const failed = tasks.filter(t => !t.passes);
    const next = failed[0];
    const lines = [
      '# Progress: ' + (data.change_id || 'unknown'),
      '## Last Updated: ' + new Date().toISOString(),
      '## Status: IN_PROGRESS (' + passed.length + '/' + tasks.length + ' tasks completed)',
      '',
      '### Completed',
      ...passed.map(t => '- [x] ' + t.id + ' ' + t.description),
      '',
      '### Remaining',
      ...failed.map(t => '- [ ] ' + t.id + ' ' + t.description + (t.evaluation_attempts > 0 ? ' (' + t.evaluation_attempts + ' attempts)' : '')),
    ];
    if (next) lines.push('', '### Next Task', 'Task ' + next.id + ': ' + next.description);
    const progressPath = process.argv[1].replace('feature_tests.json', 'claude-progress.txt');
    fs.writeFileSync(progressPath, lines.join('\n') + '\n');
  } catch (e) {}
  " "$FEATURE_TESTS" 2>/dev/null
fi

if [ "$EVENT" = "postcompact" ]; then
  # Re-inject essential context after compaction
  node -e "
  const fs = require('fs');
  try {
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const tasks = data.tasks || [];
    const passed = tasks.filter(t => t.passes);
    const failed = tasks.filter(t => !t.passes);
    console.log('--- Harness Context (restored after compaction) ---');
    console.log('Change: ' + (data.change_id || 'unknown'));
    console.log('Progress: ' + passed.length + '/' + tasks.length);
    if (failed.length > 0) {
      console.log('Next: Task ' + failed[0].id + ' - ' + failed[0].description);
      console.log('Level: ' + (failed[0].verification_level || 'L2'));
      if (failed[0].evaluation_attempts > 0) {
        console.log('Previous attempts: ' + failed[0].evaluation_attempts);
      }
    }
    console.log('---');
  } catch (e) {}
  " "$FEATURE_TESTS" 2>/dev/null
fi

exit 0
