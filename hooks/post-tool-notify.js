#!/usr/bin/env node
// Harness PostToolUse Hook — reminds to evaluate after git commit
// Cross-platform (Node.js). No bash dependency.
//
// PostToolUse output schema:
//   {"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": "text"}}

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
    // Not JSON or no command — ignore
  }
});
