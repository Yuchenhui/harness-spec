#!/usr/bin/env node
// Harness Stop Hook — blocks exit until all tasks in feature_tests.json pass
// Cross-platform (Node.js). No bash dependency.
//
// Output schema:
//   Allow exit: {} (empty JSON) + exit 0
//   Block exit: {"decision": "block", "reason": "..."} + exit 2

const fs = require('fs');
const path = require('path');

const LOCKFILE = path.join(require('os').tmpdir(), 'harness-stop-hook-blocked');

// Infinite loop guard: if we blocked within 30 seconds, allow exit
if (fs.existsSync(LOCKFILE)) {
  const age = (Date.now() - fs.statSync(LOCKFILE).mtimeMs) / 1000;
  if (age < 30) {
    console.log(JSON.stringify({}));
    try { fs.unlinkSync(LOCKFILE); } catch {}
    process.exit(0);
  }
}

// Find feature_tests.json
function findFeatureTests(dir) {
  for (const base of ['changes', path.join('openspec', 'changes')]) {
    const changesDir = path.join(dir, base);
    if (!fs.existsSync(changesDir)) continue;
    try {
      for (const entry of fs.readdirSync(changesDir)) {
        if (entry === 'archive') continue;
        const ftPath = path.join(changesDir, entry, 'feature_tests.json');
        if (fs.existsSync(ftPath)) return ftPath;
      }
    } catch {}
  }
  return null;
}

const featureTests = findFeatureTests(process.cwd());

if (!featureTests) {
  console.log(JSON.stringify({}));
  process.exit(0);
}

try {
  const data = JSON.parse(fs.readFileSync(featureTests, 'utf8'));
  const tasks = data.tasks || [];
  const total = tasks.length;
  const passed = tasks.filter(t => t.passes).length;
  const failed = tasks.filter(t => !t.passes);

  if (passed === total) {
    console.log(JSON.stringify({}));
    process.exit(0);
  }

  const remaining = failed.map(t => `  - Task ${t.id}: ${t.description}`).join('\n');
  const reason = `Harness: ${passed}/${total} tasks passed. Remaining:\n${remaining}\nContinue working on the next failing task.`;
  console.log(JSON.stringify({ decision: 'block', reason }));
  fs.writeFileSync(LOCKFILE, '');
  process.exit(2);
} catch {
  console.log(JSON.stringify({}));
  process.exit(0);
}
