#!/usr/bin/env node
// Harness Stop Hook — blocks exit until all tasks in feature_tests.json pass
// Cross-platform (Node.js). No bash dependency.

const fs = require('fs');
const path = require('path');

const LOCKFILE = path.join(require('os').tmpdir(), 'harness-stop-hook-blocked');

// Infinite loop guard: if we blocked within 30 seconds, allow exit
if (fs.existsSync(LOCKFILE)) {
  const age = (Date.now() - fs.statSync(LOCKFILE).mtimeMs) / 1000;
  if (age < 30) {
    console.log(JSON.stringify({ decision: 'allow' }));
    fs.unlinkSync(LOCKFILE);
    process.exit(0);
  }
}

// Find feature_tests.json
function findFeatureTests(dir) {
  const changesDir = path.join(dir, 'changes');
  if (!fs.existsSync(changesDir)) {
    // Try openspec/changes/
    const altDir = path.join(dir, 'openspec', 'changes');
    if (!fs.existsSync(altDir)) return null;
    return searchChanges(altDir);
  }
  return searchChanges(changesDir);
}

function searchChanges(changesDir) {
  try {
    for (const entry of fs.readdirSync(changesDir)) {
      const ftPath = path.join(changesDir, entry, 'feature_tests.json');
      if (fs.existsSync(ftPath)) return ftPath;
    }
  } catch {}
  return null;
}

const featureTests = findFeatureTests(process.cwd());

if (!featureTests) {
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

try {
  const data = JSON.parse(fs.readFileSync(featureTests, 'utf8'));
  const tasks = data.tasks || [];
  const total = tasks.length;
  const passed = tasks.filter(t => t.passes).length;
  const failed = tasks.filter(t => !t.passes);

  if (passed === total) {
    console.log(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }

  const remaining = failed.map(t => `  - Task ${t.id}: ${t.description}`).join('\n');
  const reason = `Harness: ${passed}/${total} tasks passed. Remaining:\n${remaining}\nContinue working on the next failing task.`;
  console.log(JSON.stringify({ decision: 'block', reason }));
  fs.writeFileSync(LOCKFILE, '');
  process.exit(2);
} catch {
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}
