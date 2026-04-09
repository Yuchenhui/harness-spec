import { describe, it, expect } from 'vitest';

import { generateHooksConfig } from '../../src/core/hooks.js';
import type { HarnessHooksConfig } from '../../src/core/hooks.js';

describe('hooks', () => {
  describe('generateHooksConfig', () => {
    let config: HarnessHooksConfig;

    it('should return a valid config object', () => {
      config = generateHooksConfig();
      expect(config).toBeDefined();
      expect(config.hooks).toBeDefined();
    });

    it('should have Stop, SessionStart, and PostToolUse hook categories', () => {
      config = generateHooksConfig();
      expect(config.hooks.Stop).toBeDefined();
      expect(config.hooks.SessionStart).toBeDefined();
      expect(config.hooks.PostToolUse).toBeDefined();
    });

    it('should have exactly one entry per hook category', () => {
      config = generateHooksConfig();
      expect(config.hooks.Stop).toHaveLength(1);
      expect(config.hooks.SessionStart).toHaveLength(1);
      expect(config.hooks.PostToolUse).toHaveLength(1);
    });

    describe('Stop hook', () => {
      it('should reference .claude/hooks/stop-check.sh', () => {
        config = generateHooksConfig();
        const hook = config.hooks.Stop[0].hooks[0];
        expect(hook.command).toBe('.claude/hooks/stop-check.sh');
      });

      it('should have type "command"', () => {
        config = generateHooksConfig();
        expect(config.hooks.Stop[0].hooks[0].type).toBe('command');
      });

      it('should have timeout of 30 seconds', () => {
        config = generateHooksConfig();
        expect(config.hooks.Stop[0].hooks[0].timeout).toBe(30);
      });

      it('should not have a matcher', () => {
        config = generateHooksConfig();
        expect(config.hooks.Stop[0].matcher).toBeUndefined();
      });
    });

    describe('SessionStart hook', () => {
      it('should reference .claude/hooks/session-init.sh', () => {
        config = generateHooksConfig();
        const hook = config.hooks.SessionStart[0].hooks[0];
        expect(hook.command).toBe('.claude/hooks/session-init.sh');
      });

      it('should have timeout of 10 seconds', () => {
        config = generateHooksConfig();
        expect(config.hooks.SessionStart[0].hooks[0].timeout).toBe(10);
      });
    });

    describe('PostToolUse hook', () => {
      it('should reference .claude/hooks/post-tool-notify.sh', () => {
        config = generateHooksConfig();
        const hook = config.hooks.PostToolUse[0].hooks[0];
        expect(hook.command).toBe('.claude/hooks/post-tool-notify.sh');
      });

      it('should have timeout of 5 seconds', () => {
        config = generateHooksConfig();
        expect(config.hooks.PostToolUse[0].hooks[0].timeout).toBe(5);
      });

      it('should have matcher set to "Bash"', () => {
        config = generateHooksConfig();
        expect(config.hooks.PostToolUse[0].matcher).toBe('Bash');
      });
    });

    describe('all hook commands', () => {
      it('should all reference paths under .claude/hooks/', () => {
        config = generateHooksConfig();
        const allCommands = [
          config.hooks.Stop[0].hooks[0].command,
          config.hooks.SessionStart[0].hooks[0].command,
          config.hooks.PostToolUse[0].hooks[0].command,
        ];
        for (const cmd of allCommands) {
          expect(cmd).toMatch(/^\.claude\/hooks\//);
        }
      });

      it('should all have type "command"', () => {
        config = generateHooksConfig();
        const allHooks = [
          config.hooks.Stop[0].hooks[0],
          config.hooks.SessionStart[0].hooks[0],
          config.hooks.PostToolUse[0].hooks[0],
        ];
        for (const h of allHooks) {
          expect(h.type).toBe('command');
        }
      });

      it('should all have reasonable timeouts (5-30 seconds)', () => {
        config = generateHooksConfig();
        const allTimeouts = [
          config.hooks.Stop[0].hooks[0].timeout,
          config.hooks.SessionStart[0].hooks[0].timeout,
          config.hooks.PostToolUse[0].hooks[0].timeout,
        ];
        for (const t of allTimeouts) {
          expect(t).toBeGreaterThanOrEqual(5);
          expect(t).toBeLessThanOrEqual(30);
        }
      });
    });
  });
});
