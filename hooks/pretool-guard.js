#!/usr/bin/env node
// Harness PreToolUse Hook — blocks modification of test/harness files
// ONLY active when harness-apply is running (.claude/harness-active exists)
// Pattern follows ralph-wiggum: state file controls activation.

const fs = require('fs');
const path = require('path');

// Check for activation state file (created by /harness:apply, deleted on completion)
const stateFile = path.join(process.cwd(), '.claude', 'harness-active');
if (!fs.existsSync(stateFile)) process.exit(0);

// Harness is active — check the file being modified
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
  } catch {}
});
