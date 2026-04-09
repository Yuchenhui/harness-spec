import { describe, it, expect } from 'vitest';

import {
  CORE_WORKFLOWS,
  ALL_WORKFLOWS,
  getProfileWorkflows,
} from '../../src/core/profiles.js';

describe('profiles', () => {
  describe('CORE_WORKFLOWS', () => {
    it('should contain exactly 9 workflows', () => {
      expect(CORE_WORKFLOWS).toHaveLength(9);
    });

    it('should include all expected core workflows in order', () => {
      expect([...CORE_WORKFLOWS]).toEqual([
        'propose',
        'explore',
        'new',
        'continue',
        'review',
        'init-tests',
        'apply',
        'verify',
        'archive',
      ]);
    });

    it('should include harness-specific workflows: review and init-tests', () => {
      expect(CORE_WORKFLOWS).toContain('review');
      expect(CORE_WORKFLOWS).toContain('init-tests');
    });

    it('should include upstream workflows: propose, explore, new, continue, apply, verify, archive', () => {
      for (const wf of ['propose', 'explore', 'new', 'continue', 'apply', 'verify', 'archive']) {
        expect(CORE_WORKFLOWS).toContain(wf);
      }
    });
  });

  describe('ALL_WORKFLOWS', () => {
    it('should contain exactly 13 workflows', () => {
      expect(ALL_WORKFLOWS).toHaveLength(13);
    });

    it('should contain all core workflows', () => {
      for (const wf of CORE_WORKFLOWS) {
        expect(ALL_WORKFLOWS).toContain(wf);
      }
    });

    it('should contain additional non-core workflows', () => {
      const extras = ['ff', 'sync', 'bulk-archive', 'onboard'];
      for (const wf of extras) {
        expect(ALL_WORKFLOWS).toContain(wf);
      }
    });

    it('should include harness-specific workflows: review and init-tests', () => {
      expect(ALL_WORKFLOWS).toContain('review');
      expect(ALL_WORKFLOWS).toContain('init-tests');
    });
  });

  describe('getProfileWorkflows', () => {
    it('should return CORE_WORKFLOWS for "core" profile', () => {
      const result = getProfileWorkflows('core');
      expect(result).toBe(CORE_WORKFLOWS);
    });

    it('should return CORE_WORKFLOWS for "core" profile even when custom list is provided', () => {
      const result = getProfileWorkflows('core', ['propose']);
      expect(result).toBe(CORE_WORKFLOWS);
    });

    it('should return the custom list for "custom" profile', () => {
      const customList = ['propose', 'review', 'init-tests'];
      const result = getProfileWorkflows('custom', customList);
      expect(result).toEqual(customList);
    });

    it('should return empty array for "custom" profile without custom list', () => {
      const result = getProfileWorkflows('custom');
      expect(result).toEqual([]);
    });

    it('should return empty array for "custom" profile with undefined', () => {
      const result = getProfileWorkflows('custom', undefined);
      expect(result).toEqual([]);
    });
  });
});
