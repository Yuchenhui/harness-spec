/**
 * Init Command Tests (harness-spec)
 *
 * Tests for the InitCommand class and the harness-specific customizations:
 * - DEFAULT_SCHEMA is 'harness-driven'
 * - Agent file installation for Claude Code
 * - Hook file installation for Claude Code
 * - settings.json merge logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// We test the InitCommand class structurally but avoid running execute()
// (which requires interactive prompts, spinners, and side effects).
// For the settings merge logic we replicate the merge function in isolation.

describe('InitCommand', () => {
  describe('class structure', () => {
    it('should be importable and instantiable', async () => {
      const { InitCommand } = await import('../../src/core/init.js');
      const cmd = new InitCommand();
      expect(cmd).toBeDefined();
      expect(typeof cmd.execute).toBe('function');
    });

    it('should accept options: tools, force, interactive, profile', async () => {
      const { InitCommand } = await import('../../src/core/init.js');
      const cmd = new InitCommand({
        tools: 'claude',
        force: true,
        interactive: false,
        profile: 'core',
      });
      expect(cmd).toBeDefined();
    });
  });

  describe('DEFAULT_SCHEMA constant', () => {
    it('should be harness-driven, not spec-driven', async () => {
      // We read the source file and verify the constant value.
      // This is important because harness-spec overrides the upstream default.
      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );
      // Match the const declaration
      const match = initSource.match(/const\s+DEFAULT_SCHEMA\s*=\s*['"]([^'"]+)['"]/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe('harness-driven');
    });

    it('should NOT be spec-driven (upstream default)', async () => {
      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );
      const match = initSource.match(/const\s+DEFAULT_SCHEMA\s*=\s*['"]([^'"]+)['"]/);
      expect(match![1]).not.toBe('spec-driven');
    });
  });

  describe('agent installation logic', () => {
    it('should reference the expected agent files', () => {
      // The init.ts installs these 4 agent files for Claude Code.
      const expectedAgentFiles = ['evaluator.md', 'fixer.md', 'spec-reviewer.md', 'initializer.md'];

      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );

      for (const agentFile of expectedAgentFiles) {
        expect(initSource).toContain(`'${agentFile}'`);
      }
    });

    it('should look in both package root and templates directory for agent files', () => {
      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );

      // Should have both candidate paths: packageRoot/agents/ and packageRoot/templates/.claude/agents/
      expect(initSource).toContain("path.join(packageRoot, 'agents', agentFile)");
      expect(initSource).toContain("path.join(packageRoot, 'templates', '.claude', 'agents', agentFile)");
    });

    it('should only install agents for Claude tool (not other tools)', () => {
      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );

      // The agent installation block is guarded by tool.value === 'claude'
      expect(initSource).toContain("tool.value === 'claude'");
    });
  });

  describe('hook installation logic', () => {
    it('should reference the expected hook scripts', () => {
      const expectedHookFiles = ['stop-check.sh', 'session-init.sh', 'post-tool-notify.sh'];

      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );

      for (const hookFile of expectedHookFiles) {
        expect(initSource).toContain(`'${hookFile}'`);
      }
    });

    it('should look in both package root and templates directory for hook files', () => {
      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );

      expect(initSource).toContain("path.join(packageRoot, 'hooks', hookFile)");
      expect(initSource).toContain("path.join(packageRoot, 'templates', '.claude', 'hooks', hookFile)");
    });
  });

  describe('WORKFLOW_TO_SKILL_DIR mapping', () => {
    it('should include review and init-tests in the mapping', () => {
      const initSource = fs.readFileSync(
        path.resolve(__dirname, '../../src/core/init.ts'),
        'utf-8',
      );

      expect(initSource).toContain("'review': 'openspec-review'");
      expect(initSource).toContain("'init-tests': 'openspec-init-tests'");
    });
  });
});

// ---------------------------------------------------------------------------
// settings.json merge logic (replicated from init.ts lines 614-652)
// ---------------------------------------------------------------------------

interface SettingsJson {
  hooks?: Record<string, unknown[]>;
  [key: string]: unknown;
}

function mergeHarnessHooks(
  existingSettings: SettingsJson,
  skillsDir = '.claude',
): SettingsJson {
  const merged = { ...existingSettings };
  const existingHooks = (merged.hooks ?? {}) as Record<string, unknown[]>;
  const hooksPrefix = `${skillsDir}/hooks`;

  const harnessHooks: Record<string, unknown[]> = {
    Stop: [{ hooks: [{ type: 'command', command: `${hooksPrefix}/stop-check.sh`, timeout: 30 }] }],
    SessionStart: [{ hooks: [{ type: 'command', command: `${hooksPrefix}/session-init.sh`, timeout: 10 }] }],
    PostToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: `${hooksPrefix}/post-tool-notify.sh`, timeout: 5 }] }],
    PreToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command: `node -e "const p = JSON.parse(process.argv[1]).tool_input?.file_path || ''; if (/\\\\/(tests|__tests__)\\\\//.test(p) || /feature_tests\\\\.json$/.test(p)) { process.stderr.write('BLOCKED: ' + p); process.exit(2); }" "$CLAUDE_TOOL_INPUT"`, timeout: 5 }] }],
  };

  for (const [event, hooks] of Object.entries(harnessHooks)) {
    const existing = existingHooks[event] ?? [];
    const harnessCmd = (hooks[0] as Record<string, unknown[]>).hooks?.[0] as Record<string, string> | undefined;
    const alreadyRegistered = Array.isArray(existing) && existing.some((h: unknown) => {
      const entry = h as Record<string, unknown[]>;
      const cmd = entry.hooks?.[0] as Record<string, string> | undefined;
      return cmd?.command === harnessCmd?.command;
    });
    if (!alreadyRegistered) {
      existingHooks[event] = [...(Array.isArray(existing) ? existing : []), ...hooks];
    }
  }

  merged.hooks = existingHooks;
  return merged;
}

describe('settings.json merge (init.ts harness hooks)', () => {
  describe('fresh merge (no existing hooks)', () => {
    it('should create all 4 hook categories', () => {
      const result = mergeHarnessHooks({});
      expect(result.hooks).toBeDefined();
      expect(Object.keys(result.hooks!)).toEqual(
        expect.arrayContaining(['Stop', 'SessionStart', 'PostToolUse', 'PreToolUse']),
      );
    });

    it('should set correct Stop hook command', () => {
      const result = mergeHarnessHooks({});
      const stopEntry = result.hooks!.Stop![0] as any;
      expect(stopEntry.hooks[0].command).toBe('.claude/hooks/stop-check.sh');
      expect(stopEntry.hooks[0].timeout).toBe(30);
    });

    it('should set correct SessionStart hook command', () => {
      const result = mergeHarnessHooks({});
      const entry = result.hooks!.SessionStart![0] as any;
      expect(entry.hooks[0].command).toBe('.claude/hooks/session-init.sh');
      expect(entry.hooks[0].timeout).toBe(10);
    });

    it('should set correct PostToolUse hook with Bash matcher', () => {
      const result = mergeHarnessHooks({});
      const entry = result.hooks!.PostToolUse![0] as any;
      expect(entry.matcher).toBe('Bash');
      expect(entry.hooks[0].command).toBe('.claude/hooks/post-tool-notify.sh');
    });

    it('should set PreToolUse hook with Edit|Write matcher', () => {
      const result = mergeHarnessHooks({});
      const entry = result.hooks!.PreToolUse![0] as any;
      expect(entry.matcher).toBe('Edit|Write');
    });
  });

  describe('merge with existing hooks', () => {
    it('should preserve user hooks and append harness hooks', () => {
      const existing: SettingsJson = {
        hooks: {
          Stop: [{ hooks: [{ type: 'command', command: 'my-stop.sh', timeout: 5 }] }],
        },
      };

      const result = mergeHarnessHooks(existing);
      expect(result.hooks!.Stop).toHaveLength(2);
      expect((result.hooks!.Stop![0] as any).hooks[0].command).toBe('my-stop.sh');
      expect((result.hooks!.Stop![1] as any).hooks[0].command).toBe('.claude/hooks/stop-check.sh');
    });

    it('should preserve non-hook properties', () => {
      const existing: SettingsJson = {
        allowedTools: ['Bash'],
        customProp: 42,
      };

      const result = mergeHarnessHooks(existing);
      expect(result.allowedTools).toEqual(['Bash']);
      expect(result.customProp).toBe(42);
    });
  });

  describe('idempotency', () => {
    it('should not duplicate hooks when run twice', () => {
      const first = mergeHarnessHooks({});
      const second = mergeHarnessHooks(first);

      expect(second.hooks!.Stop).toHaveLength(1);
      expect(second.hooks!.SessionStart).toHaveLength(1);
      expect(second.hooks!.PostToolUse).toHaveLength(1);
      expect(second.hooks!.PreToolUse).toHaveLength(1);
    });

    it('should not duplicate when user hooks also present', () => {
      const withUser: SettingsJson = {
        hooks: {
          Stop: [{ hooks: [{ type: 'command', command: 'user.sh', timeout: 5 }] }],
        },
      };

      const first = mergeHarnessHooks(withUser);
      const second = mergeHarnessHooks(first);

      // 1 user + 1 harness = 2 (not 3)
      expect(second.hooks!.Stop).toHaveLength(2);
    });
  });

  describe('edge cases', () => {
    it('should handle existing hooks being a non-array gracefully', () => {
      const broken: SettingsJson = {
        hooks: {
          Stop: 'not-an-array' as any,
        },
      };

      // The merge logic uses Array.isArray check; when it fails, starts fresh
      const result = mergeHarnessHooks(broken);
      expect(result.hooks!.Stop).toHaveLength(1);
    });

    it('should use custom skillsDir prefix when provided', () => {
      const result = mergeHarnessHooks({}, '.custom-dir');
      const stopCmd = (result.hooks!.Stop![0] as any).hooks[0].command;
      expect(stopCmd).toBe('.custom-dir/hooks/stop-check.sh');
    });
  });
});
