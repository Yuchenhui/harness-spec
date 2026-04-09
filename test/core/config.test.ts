import { describe, it, expect } from 'vitest';

import {
  AI_TOOLS,
  OPENSPEC_DIR_NAME,
  OPENSPEC_MARKERS,
} from '../../src/core/config.js';
import type { AIToolOption } from '../../src/core/config.js';

describe('config', () => {
  describe('AI_TOOLS', () => {
    it('should have exactly 1 entry (Claude Code only)', () => {
      expect(AI_TOOLS).toHaveLength(1);
    });

    it('should have Claude Code as the only entry', () => {
      const claude = AI_TOOLS[0];
      expect(claude.name).toBe('Claude Code');
      expect(claude.value).toBe('claude');
    });

    it('should mark Claude Code as available', () => {
      expect(AI_TOOLS[0].available).toBe(true);
    });

    it('should have correct successLabel', () => {
      expect(AI_TOOLS[0].successLabel).toBe('Claude Code');
    });

    it('should use .claude as skillsDir', () => {
      expect(AI_TOOLS[0].skillsDir).toBe('.claude');
    });
  });

  describe('OPENSPEC_DIR_NAME', () => {
    it('should be "openspec"', () => {
      expect(OPENSPEC_DIR_NAME).toBe('openspec');
    });
  });

  describe('OPENSPEC_MARKERS', () => {
    it('should have start and end markers', () => {
      expect(OPENSPEC_MARKERS.start).toBe('<!-- OPENSPEC:START -->');
      expect(OPENSPEC_MARKERS.end).toBe('<!-- OPENSPEC:END -->');
    });
  });
});
