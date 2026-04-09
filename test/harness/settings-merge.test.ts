/**
 * Settings Merge Tests
 *
 * Tests the settings.json merge logic used during `openspec init --tools claude`.
 * This is the most critical harness test — ensures hooks are merged idempotently
 * without overwriting user-defined hooks or permissions.
 *
 * We replicate the merge logic from src/core/init.ts lines 614-652 in a
 * self-contained helper so the tests are fast and don't depend on the full
 * init pipeline (interactive prompts, spinner, etc.).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// ---------------------------------------------------------------------------
// Minimal reproduction of the merge logic from init.ts (lines 614-652)
// ---------------------------------------------------------------------------

interface SettingsJson {
  hooks?: Record<string, unknown[]>;
  permissions?: Record<string, unknown>;
  [key: string]: unknown;
}

function mergeHarnessHooks(
  existingSettings: SettingsJson,
  skillsDir = '.claude',
): SettingsJson {
  const merged = { ...existingSettings };
  const existingHooks = ((merged.hooks ?? {}) as Record<string, unknown[]>);
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

// ---------------------------------------------------------------------------
// Full disk-round-trip helper (simulates the init.ts write path)
// ---------------------------------------------------------------------------

async function mergeSettingsOnDisk(settingsPath: string, skillsDir = '.claude'): Promise<void> {
  let existingSettings: SettingsJson = {};
  if (fs.existsSync(settingsPath)) {
    try {
      existingSettings = JSON.parse(await fs.promises.readFile(settingsPath, 'utf8'));
    } catch {
      existingSettings = {};
    }
  }
  const merged = mergeHarnessHooks(existingSettings, skillsDir);
  await fs.promises.writeFile(settingsPath, JSON.stringify(merged, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('settings-merge', () => {
  let tempDir: string;

  beforeAll(() => {
    tempDir = path.join(
      os.tmpdir(),
      `openspec-settings-merge-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ---------- Scenario 1: no settings.json → creates one with harness hooks ----------

  describe('fresh project (no settings.json)', () => {
    it('should create settings.json with all harness hook categories', async () => {
      const dir = path.join(tempDir, 'fresh');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      await mergeSettingsOnDisk(settingsPath);

      expect(fs.existsSync(settingsPath)).toBe(true);
      const settings: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks!.Stop).toHaveLength(1);
      expect(settings.hooks!.SessionStart).toHaveLength(1);
      expect(settings.hooks!.PostToolUse).toHaveLength(1);
      expect(settings.hooks!.PreToolUse).toHaveLength(1);
    });

    it('should set correct command paths', async () => {
      const dir = path.join(tempDir, 'fresh-paths');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      await mergeSettingsOnDisk(settingsPath);

      const settings: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const stopCmd = (settings.hooks!.Stop![0] as any).hooks[0].command;
      expect(stopCmd).toBe('.claude/hooks/stop-check.sh');

      const sessionCmd = (settings.hooks!.SessionStart![0] as any).hooks[0].command;
      expect(sessionCmd).toBe('.claude/hooks/session-init.sh');

      const postCmd = (settings.hooks!.PostToolUse![0] as any).hooks[0].command;
      expect(postCmd).toBe('.claude/hooks/post-tool-notify.sh');
    });
  });

  // ---------- Scenario 2: existing settings.json with user hooks → merges ----------

  describe('existing settings.json with user hooks', () => {
    it('should preserve user hooks and append harness hooks', async () => {
      const dir = path.join(tempDir, 'existing-hooks');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      const userSettings: SettingsJson = {
        hooks: {
          Stop: [
            { hooks: [{ type: 'command', command: 'my-custom-stop.sh', timeout: 15 }] },
          ],
        },
      };
      fs.writeFileSync(settingsPath, JSON.stringify(userSettings, null, 2));

      await mergeSettingsOnDisk(settingsPath);

      const settings: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      // User hook should still be first
      expect(settings.hooks!.Stop).toHaveLength(2);
      expect((settings.hooks!.Stop![0] as any).hooks[0].command).toBe('my-custom-stop.sh');
      // Harness hook appended
      expect((settings.hooks!.Stop![1] as any).hooks[0].command).toBe('.claude/hooks/stop-check.sh');

      // Other categories created fresh
      expect(settings.hooks!.SessionStart).toHaveLength(1);
      expect(settings.hooks!.PostToolUse).toHaveLength(1);
      expect(settings.hooks!.PreToolUse).toHaveLength(1);
    });

    it('should preserve non-hook properties in settings.json', async () => {
      const dir = path.join(tempDir, 'other-props');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      const userSettings = {
        allowedTools: ['Bash', 'Read'],
        customKey: 'custom-value',
      };
      fs.writeFileSync(settingsPath, JSON.stringify(userSettings, null, 2));

      await mergeSettingsOnDisk(settingsPath);

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(settings.allowedTools).toEqual(['Bash', 'Read']);
      expect(settings.customKey).toBe('custom-value');
      expect(settings.hooks).toBeDefined();
    });
  });

  // ---------- Scenario 3: idempotency — run twice, hooks not duplicated ----------

  describe('idempotent merge (run twice)', () => {
    it('should not duplicate hooks when run twice', async () => {
      const dir = path.join(tempDir, 'idempotent');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      // First merge
      await mergeSettingsOnDisk(settingsPath);
      const afterFirst: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      // Second merge
      await mergeSettingsOnDisk(settingsPath);
      const afterSecond: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

      // Same number of hooks
      expect(afterSecond.hooks!.Stop).toHaveLength(afterFirst.hooks!.Stop!.length);
      expect(afterSecond.hooks!.SessionStart).toHaveLength(afterFirst.hooks!.SessionStart!.length);
      expect(afterSecond.hooks!.PostToolUse).toHaveLength(afterFirst.hooks!.PostToolUse!.length);
      expect(afterSecond.hooks!.PreToolUse).toHaveLength(afterFirst.hooks!.PreToolUse!.length);
    });

    it('should not duplicate when user hooks are also present', async () => {
      const dir = path.join(tempDir, 'idempotent-user');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      const userSettings: SettingsJson = {
        hooks: {
          Stop: [{ hooks: [{ type: 'command', command: 'user-hook.sh', timeout: 10 }] }],
        },
      };
      fs.writeFileSync(settingsPath, JSON.stringify(userSettings, null, 2));

      // Merge twice
      await mergeSettingsOnDisk(settingsPath);
      await mergeSettingsOnDisk(settingsPath);

      const settings: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      // 1 user + 1 harness = 2 (not 3)
      expect(settings.hooks!.Stop).toHaveLength(2);
    });
  });

  // ---------- Scenario 4: existing permissions are preserved ----------

  describe('preserving existing permissions', () => {
    it('should preserve permissions property', async () => {
      const dir = path.join(tempDir, 'permissions');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      const userSettings = {
        permissions: {
          allow: ['Bash(git *)'],
          deny: ['Bash(rm -rf *)'],
        },
        hooks: {},
      };
      fs.writeFileSync(settingsPath, JSON.stringify(userSettings, null, 2));

      await mergeSettingsOnDisk(settingsPath);

      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(settings.permissions).toEqual({
        allow: ['Bash(git *)'],
        deny: ['Bash(rm -rf *)'],
      });
    });
  });

  // ---------- Scenario 5: malformed settings.json ----------

  describe('malformed settings.json', () => {
    it('should handle malformed JSON gracefully and create hooks', async () => {
      const dir = path.join(tempDir, 'malformed');
      fs.mkdirSync(dir, { recursive: true });
      const settingsPath = path.join(dir, 'settings.json');

      fs.writeFileSync(settingsPath, '{ this is not valid json !!!');

      await mergeSettingsOnDisk(settingsPath);

      const settings: SettingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks!.Stop).toHaveLength(1);
    });
  });
});
