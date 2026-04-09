#!/usr/bin/env node
// Harness PreToolUse Hook — blocks modification of test/harness files
// Cross-platform (Node.js). Deterministic regex check, no LLM call.
//
// PreToolUse output schema:
//   Allow: {} or {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}
//   Deny:  {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"..."}}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.tool_input?.file_path || data.tool_input?.path || '';

    // Normalize path separators (Windows uses \, Unix uses /)
    const normalized = filePath.replace(/\\/g, '/');

    // Check if this is a protected file
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
          permissionDecisionReason: `Cannot modify test/harness file: ${filePath}`
        }
      }));
    }
    // If not protected, output nothing — allow by default
  } catch {
    // Parse error — allow by default
  }
});
