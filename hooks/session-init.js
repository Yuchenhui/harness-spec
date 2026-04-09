#!/usr/bin/env node
// Harness SessionStart Hook — prints progress summary on new session
// Cross-platform (Node.js). No bash dependency.

const fs = require('fs');
const path = require('path');

function findFeatureTests(dir) {
  for (const base of ['changes', path.join('openspec', 'changes')]) {
    const changesDir = path.join(dir, base);
    if (!fs.existsSync(changesDir)) continue;
    try {
      for (const entry of fs.readdirSync(changesDir)) {
        const ftPath = path.join(changesDir, entry, 'feature_tests.json');
        if (fs.existsSync(ftPath)) return ftPath;
      }
    } catch {}
  }
  return null;
}

const featureTests = findFeatureTests(process.cwd());
if (!featureTests) process.exit(0);

try {
  const data = JSON.parse(fs.readFileSync(featureTests, 'utf8'));
  const tasks = data.tasks || [];
  const passed = tasks.filter(t => t.passes);
  const failed = tasks.filter(t => !t.passes);

  console.log(`--- Harness Status: ${data.change_id || 'unknown'} ---`);
  console.log(`Progress: ${passed.length}/${tasks.length} tasks passed`);

  if (passed.length > 0) {
    console.log('Completed:');
    passed.forEach(t => console.log(`  [x] ${t.id} ${t.description}`));
  }
  if (failed.length > 0) {
    console.log('Remaining:');
    failed.forEach(t => {
      const a = t.evaluation_attempts || 0;
      const s = a > 0 ? ` (${a} attempts)` : '';
      console.log(`  [ ] ${t.id} ${t.description}${s}`);
    });
    console.log('');
    console.log(`Next: Task ${failed[0].id} - ${failed[0].description}`);
  }
  console.log('---');
} catch {
  // Silently fail
}
