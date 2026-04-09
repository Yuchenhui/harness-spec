#!/usr/bin/env node
// Harness PreToolUse Hook — blocks modification of test/harness files
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

// Not in harness mode — do nothing, allow everything
if (!isHarnessActive()) process.exit(0);

// In harness mode — check the file being modified
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';
    const normalized = filePath.replace(/\\/g, '/');

    const isProtected =
      /\/(tests|__tests__)\//.test(normalized) ||
      /\/test\//.test(normalized) ||
      /feature_tests\.json$/.test(normalized) ||
      /claude-progress\.txt$/.test(normalized);

    if (isProtected) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason: `Harness: cannot modify test/harness file: ${filePath}`
        }
      }));
    }
    // Not protected — no output, default allow
  } catch {
    // Parse error — allow
  }
});
