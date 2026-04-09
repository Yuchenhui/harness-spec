#!/usr/bin/env node
// Harness Compact Handler — saves/restores progress during context compaction
// Cross-platform (Node.js). No bash dependency.

const fs = require('fs');
const path = require('path');

const event = process.argv[2] || 'precompact';

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

  if (event === 'precompact') {
    const lines = [
      `# Progress: ${data.change_id || 'unknown'}`,
      `## Last Updated: ${new Date().toISOString()}`,
      `## Status: IN_PROGRESS (${passed.length}/${tasks.length} tasks completed)`,
      '',
      '### Completed',
      ...passed.map(t => `- [x] ${t.id} ${t.description}`),
      '',
      '### Remaining',
      ...failed.map(t => {
        const a = t.evaluation_attempts || 0;
        return `- [ ] ${t.id} ${t.description}${a > 0 ? ` (${a} attempts)` : ''}`;
      }),
    ];
    if (failed.length > 0) {
      lines.push('', '### Next Task', `Task ${failed[0].id}: ${failed[0].description}`);
    }
    const progressPath = featureTests.replace('feature_tests.json', 'claude-progress.txt');
    fs.writeFileSync(progressPath, lines.join('\n') + '\n');
  }

  if (event === 'postcompact') {
    console.log('--- Harness Context (restored after compaction) ---');
    console.log(`Change: ${data.change_id || 'unknown'}`);
    console.log(`Progress: ${passed.length}/${tasks.length}`);
    if (failed.length > 0) {
      console.log(`Next: Task ${failed[0].id} - ${failed[0].description}`);
      console.log(`Level: ${failed[0].verification_level || 'L2'}`);
      if (failed[0].evaluation_attempts > 0) {
        console.log(`Previous attempts: ${failed[0].evaluation_attempts}`);
      }
    }
    console.log('---');
  }
} catch {
  // Silently fail
}
