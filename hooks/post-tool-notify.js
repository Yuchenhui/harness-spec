#!/usr/bin/env node
// Harness PostToolUse Hook — reminds to evaluate after git commit
// ONLY active when a harness workflow is running (feature_tests.json exists)
// When not in harness mode: does nothing, zero impact on normal usage.

const fs = require('fs');
const path = require('path');

// Quick check: is harness mode active?
function isHarnessActive() {
  for (const base of ['changes', path.join('openspec', 'changes')]) {
    const changesDir = path.join(process.cwd(), base);
    if (!fs.existsSync(changesDir)) continue;
    try {
      for (const entry of fs.readdirSync(changesDir)) {
        if (entry === 'archive') continue;
        if (fs.existsSync(path.join(changesDir, entry, 'feature_tests.json'))) return true;
      }
    } catch {}
  }
  return false;
}

// Not in harness mode — do nothing
if (!isHarnessActive()) process.exit(0);

// In harness mode — check if this was a git commit
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const cmd = data.tool_input?.command || '';
    if (/^\s*git\s+commit\b/.test(cmd)) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: 'Harness: git commit detected. Launch evaluator subagent to verify before proceeding to the next task.'
        }
      }));
    }
  } catch {
    // ignore
  }
});
