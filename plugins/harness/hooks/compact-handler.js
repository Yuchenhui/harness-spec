#!/usr/bin/env node
// Harness Compact Handler — saves/restores progress during context compaction
// ONLY active when harness-apply is running (.claude/harness-active exists)
//
// PreCompact: saves progress to claude-progress.txt (file write, no JSON output)
// PostCompact: writes systemMessage (docs say "no decision control" for this event,
//   so hookSpecificOutput may be ignored. systemMessage is a universal field but
//   may also be ignored. The real fallback is claude-progress.txt from PreCompact.)

const fs = require('fs');
const path = require('path');

const event = process.argv[2] || 'precompact';

// Check state file — same pattern as all other hooks
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

  if (event === 'precompact') {
    // Save progress to file before compaction — this is the reliable fallback
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
    const progressPath = featureTestsPath.replace('feature_tests.json', 'claude-progress.txt');
    fs.writeFileSync(progressPath, lines.join('\n') + '\n');
    // No JSON output needed — PreCompact is for side effects only
  }

  if (event === 'postcompact') {
    // Best effort: systemMessage is a universal field, but docs say PostCompact
    // has "no decision control" so this may be silently ignored.
    // The real fallback is claude-progress.txt written by PreCompact above.
    const contextLines = [
      `--- Harness Context (restored after compaction) ---`,
      `Change: ${data.change_id || 'unknown'}`,
      `Progress: ${passed.length}/${tasks.length}`,
    ];
    if (failed.length > 0) {
      contextLines.push(`Next: Task ${failed[0].id} - ${failed[0].description}`);
    }
    contextLines.push('---');

    console.log(JSON.stringify({
      systemMessage: contextLines.join('\n')
    }));
  }
} catch {
  // Silently fail
}
