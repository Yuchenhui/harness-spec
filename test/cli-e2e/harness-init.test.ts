/**
 * E2E Tests for `openspec init --tools claude`
 *
 * Verifies the full init pipeline produces the expected harness artifacts:
 * - .claude/agents/ with 4 agent files
 * - .claude/hooks/ with 3 hook scripts
 * - .claude/settings.json with merged hooks
 * - .claude/commands/opsx/ with harness commands (review, init-tests, etc.)
 * - .claude/skills/ with harness skill directories
 * - openspec/config.yaml with harness-driven schema
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { runCLI } from '../helpers/run-cli.js';

describe('harness init (e2e)', () => {
  let tempDir: string;
  let projectDir: string;

  beforeAll(async () => {
    tempDir = path.join(
      os.tmpdir(),
      `openspec-e2e-init-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });

    // Create a project directory inside tempDir
    projectDir = path.join(tempDir, 'test-project');
    fs.mkdirSync(projectDir, { recursive: true });

    // Run init --tools claude --force (non-interactive)
    const result = await runCLI(['init', projectDir, '--tools', 'claude', '--force'], {
      cwd: tempDir,
      timeoutMs: 30000,
    });

    // If init failed, dump output for debugging
    if (result.exitCode !== 0) {
      console.error('init stdout:', result.stdout);
      console.error('init stderr:', result.stderr);
    }
    expect(result.exitCode).toBe(0);
  }, 60000);

  afterAll(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ---------- Agent files ----------

  describe('.claude/agents/', () => {
    const expectedAgents = ['evaluator.md', 'fixer.md', 'spec-reviewer.md', 'initializer.md'];

    it('should create the agents directory', () => {
      const agentsDir = path.join(projectDir, '.claude', 'agents');
      expect(fs.existsSync(agentsDir)).toBe(true);
    });

    for (const agentFile of ['evaluator.md', 'fixer.md', 'spec-reviewer.md', 'initializer.md']) {
      it(`should create ${agentFile}`, () => {
        const filePath = path.join(projectDir, '.claude', 'agents', agentFile);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      });
    }

    it('should create exactly 4 agent files', () => {
      const agentsDir = path.join(projectDir, '.claude', 'agents');
      const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'));
      expect(files).toHaveLength(4);
      for (const agent of expectedAgents) {
        expect(files).toContain(agent);
      }
    });
  });

  // ---------- Hook scripts ----------

  describe('.claude/hooks/', () => {
    const expectedHooks = ['stop-check.sh', 'session-init.sh', 'post-tool-notify.sh'];

    it('should create the hooks directory', () => {
      const hooksDir = path.join(projectDir, '.claude', 'hooks');
      expect(fs.existsSync(hooksDir)).toBe(true);
    });

    for (const hookFile of ['stop-check.sh', 'session-init.sh', 'post-tool-notify.sh']) {
      it(`should create ${hookFile}`, () => {
        const filePath = path.join(projectDir, '.claude', 'hooks', hookFile);
        expect(fs.existsSync(filePath)).toBe(true);
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
      });
    }

    it('should create exactly 3 hook scripts', () => {
      const hooksDir = path.join(projectDir, '.claude', 'hooks');
      const files = fs.readdirSync(hooksDir).filter((f) => f.endsWith('.sh'));
      expect(files).toHaveLength(3);
      for (const hook of expectedHooks) {
        expect(files).toContain(hook);
      }
    });
  });

  // ---------- Settings.json ----------

  describe('.claude/settings.json', () => {
    it('should create settings.json', () => {
      const settingsPath = path.join(projectDir, '.claude', 'settings.json');
      expect(fs.existsSync(settingsPath)).toBe(true);
    });

    it('should contain valid JSON with hooks', () => {
      const settingsPath = path.join(projectDir, '.claude', 'settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(settings.hooks).toBeDefined();
    });

    it('should have Stop, SessionStart, PostToolUse, and PreToolUse hooks', () => {
      const settingsPath = path.join(projectDir, '.claude', 'settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      expect(settings.hooks.Stop).toBeDefined();
      expect(settings.hooks.Stop.length).toBeGreaterThanOrEqual(1);
      expect(settings.hooks.SessionStart).toBeDefined();
      expect(settings.hooks.SessionStart.length).toBeGreaterThanOrEqual(1);
      expect(settings.hooks.PostToolUse).toBeDefined();
      expect(settings.hooks.PostToolUse.length).toBeGreaterThanOrEqual(1);
      expect(settings.hooks.PreToolUse).toBeDefined();
      expect(settings.hooks.PreToolUse.length).toBeGreaterThanOrEqual(1);
    });

    it('should reference .claude/hooks/ in hook commands', () => {
      const settingsPath = path.join(projectDir, '.claude', 'settings.json');
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      const stopCmd = settings.hooks.Stop[0]?.hooks?.[0]?.command;
      expect(stopCmd).toContain('.claude/hooks/');
    });
  });

  // ---------- Commands ----------

  describe('.claude/commands/opsx/', () => {
    it('should create the opsx commands directory', () => {
      const opsxDir = path.join(projectDir, '.claude', 'commands', 'opsx');
      expect(fs.existsSync(opsxDir)).toBe(true);
    });

    it('should create review command', () => {
      const filePath = path.join(projectDir, '.claude', 'commands', 'opsx', 'review.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create init-tests command', () => {
      const filePath = path.join(projectDir, '.claude', 'commands', 'opsx', 'init-tests.md');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create core workflow commands', () => {
      // Core profile includes: propose, explore, new, continue, review,
      // init-tests, apply, verify, archive
      const coreCommands = [
        'propose', 'explore', 'new', 'continue',
        'review', 'init-tests', 'apply', 'verify', 'archive',
      ];
      const opsxDir = path.join(projectDir, '.claude', 'commands', 'opsx');
      const files = fs.readdirSync(opsxDir);
      for (const cmd of coreCommands) {
        expect(files).toContain(`${cmd}.md`);
      }
    });
  });

  // ---------- Skills ----------

  describe('.claude/skills/', () => {
    it('should create the skills directory', () => {
      const skillsDir = path.join(projectDir, '.claude', 'skills');
      expect(fs.existsSync(skillsDir)).toBe(true);
    });

    it('should create harness-specific skill directories', () => {
      const skillsDir = path.join(projectDir, '.claude', 'skills');
      const dirs = fs.readdirSync(skillsDir);
      expect(dirs).toContain('openspec-review');
      expect(dirs).toContain('openspec-init-tests');
    });

    it('should create SKILL.md in each skill directory', () => {
      const skillsDir = path.join(projectDir, '.claude', 'skills');
      const dirs = fs.readdirSync(skillsDir);
      for (const dir of dirs) {
        const skillFile = path.join(skillsDir, dir, 'SKILL.md');
        expect(fs.existsSync(skillFile)).toBe(true);
      }
    });
  });

  // ---------- Config.yaml ----------

  describe('openspec/config.yaml', () => {
    it('should create the openspec directory', () => {
      const openspecDir = path.join(projectDir, 'openspec');
      expect(fs.existsSync(openspecDir)).toBe(true);
    });

    it('should create config.yaml with harness-driven schema', () => {
      const configPath = path.join(projectDir, 'openspec', 'config.yaml');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('harness-driven');
    });
  });
});
