#!/usr/bin/env node
// Harness PostToolUse Hook — reminds to evaluate after git commit
// ONLY active when harness-apply is running (.claude/harness-active exists)

const fs = require('fs');
const path = require('path');

const stateFile = path.join(process.cwd(), '.claude', 'harness-active');
if (!fs.existsSync(stateFile)) process.exit(0);

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
  } catch {}
});
