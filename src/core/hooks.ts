/**
 * Harness Hooks System
 *
 * Generates Claude Code hook configuration and writes hook scripts.
 * Hook scripts are read from the hooks/ directory at build/install time
 * rather than embedded as string literals (avoids escaping issues).
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
 */
export function generateHooksConfig(): HarnessHooksConfig {
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
 * Write hook scripts to the project's .claude/hooks/ directory.
 * Copies from the package's hooks/ directory rather than using embedded strings.
 */
export async function writeHookScripts(projectRoot: string): Promise<string[]> {
  const { writeFile, readFile, mkdir } = await import('node:fs/promises');
  const { join, dirname } = await import('node:path');
  const { fileURLToPath } = await import('node:url');

  const hooksDir = join(projectRoot, '.claude', 'hooks');
  await mkdir(hooksDir, { recursive: true });

  // Resolve the package's hooks/ directory
  const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const sourceHooksDir = join(packageRoot, 'hooks');

  const hookFiles = ['stop-check.sh', 'session-init.sh', 'post-tool-notify.sh'];
  const written: string[] = [];

  for (const file of hookFiles) {
    const sourcePath = join(sourceHooksDir, file);
    const destPath = join(hooksDir, file);
    try {
      const content = await readFile(sourcePath, 'utf8');
      await writeFile(destPath, content, { mode: 0o755 });
      written.push(destPath);
    } catch {
      // If source file not found, skip (e.g., running from plugin layout)
    }
  }

  return written;
}
