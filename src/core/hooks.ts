/**
 * Harness Hooks System
 *
 * Generates Claude Code hook configuration for the harness workflow:
 * - Stop hook: prevents exit until all tasks pass
 * - SessionStart hook: auto-loads progress state
 * - PostToolUse hook: reminds to evaluate after git commit
 *
 * Inspired by ralph-wiggum (Anthropic official plugin).
 */

export interface HarnessHooksConfig {
  hooks: {
    Stop: HookEntry[];
    SessionStart: HookEntry[];
    PostToolUse: HookEntry[];
  };
}

interface HookEntry {
  matcher?: string;
  hooks: HookDefinition[];
}

interface HookDefinition {
  type: 'command';
  command: string;
  timeout: number;
}

/**
 * Generate the hooks configuration for a project.
 * This is written to .claude/settings.json (merged with existing config).
 */
export function generateHooksConfig(projectRoot: string): HarnessHooksConfig {
  const hooksDir = '.claude/hooks';

  return {
    hooks: {
      Stop: [
        {
          hooks: [
            {
              type: 'command',
              command: `${hooksDir}/stop-check.sh`,
              timeout: 30,
            },
          ],
        },
      ],
      SessionStart: [
        {
          hooks: [
            {
              type: 'command',
              command: `${hooksDir}/session-init.sh`,
              timeout: 10,
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Bash',
          hooks: [
            {
              type: 'command',
              command: `${hooksDir}/post-tool-notify.sh`,
              timeout: 5,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Stop hook script content.
 * Checks feature_tests.json — blocks exit if any task has passes: false.
 * Includes infinite loop guard (stop_hook_active check).
 */
export const STOP_CHECK_SCRIPT = `#!/bin/bash
# Harness Stop Hook — blocks exit until all tasks pass
# Inspired by ralph-wiggum (Anthropic official plugin)

INPUT=$(cat)

# Infinite loop guard: if we already blocked once this turn, allow exit
STOP_HOOK_ACTIVE=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(str(data.get('stop_hook_active', False)).lower())
except:
    print('false')
" 2>/dev/null)

if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Find active feature_tests.json
FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' -newer .git/HEAD 2>/dev/null | head -1)

if [ -z "$FEATURE_TESTS" ]; then
  echo '{"decision":"allow"}'
  exit 0
fi

# Parse progress
RESULT=$(python3 -c "
import json, sys
with open('$FEATURE_TESTS') as f:
    data = json.load(f)
tasks = data.get('tasks', [])
total = len(tasks)
passed = len([t for t in tasks if t.get('passes')])
failed = [t for t in tasks if not t.get('passes')]

if passed == total:
    print('ALLOW')
else:
    reasons = []
    for t in failed:
        reasons.append(f'  - Task {t[\"id\"]}: {t[\"description\"]}')
    reason = f'Harness: {passed}/{total} tasks passed. Remaining:\\n' + '\\n'.join(reasons)
    reason += '\\n\\nContinue working on the next failing task.'
    print('BLOCK')
    print(reason)
" 2>/dev/null)

DECISION=$(echo "$RESULT" | head -1)

if [ "$DECISION" = "ALLOW" ]; then
  echo '{"decision":"allow"}'
  exit 0
else
  REASON=$(echo "$RESULT" | tail -n +2)
  echo "{\\"decision\\":\\"block\\",\\"reason\\":\\"$REASON\\"}"
  exit 2
fi
`;

/**
 * Session init hook script content.
 * Prints harness progress summary at session start.
 */
export const SESSION_INIT_SCRIPT = `#!/bin/bash
# Harness SessionStart Hook — auto-loads progress state

FEATURE_TESTS=$(find . -path '*/changes/*/feature_tests.json' 2>/dev/null | head -1)

if [ -z "$FEATURE_TESTS" ]; then
  exit 0
fi

python3 -c "
import json
with open('$FEATURE_TESTS') as f:
    data = json.load(f)
tasks = data.get('tasks', [])
total = len(tasks)
passed = [t for t in tasks if t.get('passes')]
failed = [t for t in tasks if not t.get('passes')]

print(f'--- Harness Status: {data.get(\"change_id\", \"unknown\")} ---')
print(f'Progress: {len(passed)}/{total} tasks passed')
if passed:
    print('Completed:')
    for t in passed:
        print(f'  [x] {t[\"id\"]} {t[\"description\"]}')
if failed:
    print('Remaining:')
    for t in failed:
        a = t.get('evaluation_attempts', 0)
        s = f' ({a} attempts)' if a > 0 else ''
        print(f'  [ ] {t[\"id\"]} {t[\"description\"]}{s}')
    print(f'\\nNext: Task {failed[0][\"id\"]} - {failed[0][\"description\"]}')
print('---')
" 2>/dev/null

exit 0
`;

/**
 * Post-tool-use hook script content.
 * Reminds to run evaluator after git commit.
 */
export const POST_TOOL_NOTIFY_SCRIPT = `#!/bin/bash
# Harness PostToolUse Hook — reminds to evaluate after git commit

INPUT="\${CLAUDE_TOOL_INPUT:-$(cat)}"

if echo "$INPUT" | grep -q 'git commit'; then
  echo "Harness: git commit detected. Launch evaluator subagent to verify before proceeding."
fi

exit 0
`;

/**
 * Write hook scripts to the project's .claude/hooks/ directory.
 */
export async function writeHookScripts(projectRoot: string): Promise<string[]> {
  const { writeFile, mkdir } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const hooksDir = join(projectRoot, '.claude', 'hooks');
  await mkdir(hooksDir, { recursive: true });

  const files = [
    { name: 'stop-check.sh', content: STOP_CHECK_SCRIPT },
    { name: 'session-init.sh', content: SESSION_INIT_SCRIPT },
    { name: 'post-tool-notify.sh', content: POST_TOOL_NOTIFY_SCRIPT },
  ];

  const written: string[] = [];
  for (const file of files) {
    const path = join(hooksDir, file.name);
    await writeFile(path, file.content, { mode: 0o755 });
    written.push(path);
  }

  return written;
}
