#!/usr/bin/env node
// Harness SessionStart Hook — injects progress summary into Claude's context
// Cross-platform (Node.js). No bash dependency.
//
// SessionStart output schema:
//   {"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "text"}}

const fs = require('fs');
const path = require('path');

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
if (!featureTests) process.exit(0);

try {
  const data = JSON.parse(fs.readFileSync(featureTests, 'utf8'));
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

  // Use hookSpecificOutput to inject into Claude's context
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: lines.join('\n')
    }
  }));
} catch {
  // Silently fail — no output means no context injection
}
