#!/usr/bin/env node
// Harness Stop Hook — blocks exit until all tasks pass
// ONLY active when harness-apply is running (.claude/harness-active exists)
// Pattern follows ralph-wiggum: state file controls activation.

const fs = require('fs');
const path = require('path');

const stateFile = path.join(process.cwd(), '.claude', 'harness-active');
if (!fs.existsSync(stateFile)) process.exit(0);

// Read state file to find feature_tests.json path
let featureTestsPath;
try {
  featureTestsPath = fs.readFileSync(stateFile, 'utf8').trim();
} catch {
  process.exit(0);
}

if (!featureTestsPath || !fs.existsSync(featureTestsPath)) process.exit(0);

// Lockfile for infinite loop guard
const LOCKFILE = path.join(require('os').tmpdir(), 'harness-stop-hook-blocked');
if (fs.existsSync(LOCKFILE)) {
  const age = (Date.now() - fs.statSync(LOCKFILE).mtimeMs) / 1000;
  if (age < 30) {
    try { fs.unlinkSync(LOCKFILE); } catch {}
    process.exit(0);
  }
}

try {
  const data = JSON.parse(fs.readFileSync(featureTestsPath, 'utf8'));
  const tasks = data.tasks || [];
  const total = tasks.length;
  const passed = tasks.filter(t => t.passes).length;
  const failed = tasks.filter(t => !t.passes);

  if (passed === total) {
    // All done — clean up state file and allow exit
    try { fs.unlinkSync(stateFile); } catch {}
    process.exit(0);
  }

  const remaining = failed.map(t => `  - Task ${t.id}: ${t.description}`).join('\n');
  const reason = `Harness: ${passed}/${total} tasks passed. Remaining:\n${remaining}\nContinue working on the next failing task.`;

  console.log(JSON.stringify({ decision: 'block', reason }));
  fs.writeFileSync(LOCKFILE, '');
  process.exit(0);
} catch {
  process.exit(0);
}
