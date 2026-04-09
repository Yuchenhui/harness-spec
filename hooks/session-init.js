#!/usr/bin/env node
// Harness SessionStart Hook — shows progress if harness was active
// ONLY outputs if .claude/harness-active exists

const fs = require('fs');
const path = require('path');

const stateFile = path.join(process.cwd(), '.claude', 'harness-active');
if (!fs.existsSync(stateFile)) process.exit(0);

let featureTestsPath;
try {
  featureTestsPath = fs.readFileSync(stateFile, 'utf8').trim();
} catch {
  process.exit(0);
}

if (!featureTestsPath || !fs.existsSync(featureTestsPath)) process.exit(0);

try {
  const data = JSON.parse(fs.readFileSync(featureTestsPath, 'utf8'));
  const tasks = data.tasks || [];
  const passed = tasks.filter(t => t.passes);
  const failed = tasks.filter(t => !t.passes);

  const lines = [`--- Harness Status: ${data.change_id || 'unknown'} ---`];
  lines.push(`Progress: ${passed.length}/${tasks.length} tasks passed`);

  if (passed.length > 0) {
    lines.push('Completed:');
    passed.forEach(t => lines.push(`  [x] ${t.id} ${t.description}`));
  }
  if (failed.length > 0) {
    lines.push('Remaining:');
    failed.forEach(t => {
      const a = t.evaluation_attempts || 0;
      const s = a > 0 ? ` (${a} attempts)` : '';
      lines.push(`  [ ] ${t.id} ${t.description}${s}`);
    });
    lines.push('');
    lines.push(`Next: Task ${failed[0].id} - ${failed[0].description}`);
  }
  lines.push('---');

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: lines.join('\n')
    }
  }));
} catch {}
