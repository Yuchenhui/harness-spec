/**
 * Skill Templates Parity Tests
 *
 * Ensures that every workflow that exports a SkillTemplate also exports a
 * CommandTemplate, and that the review/init-tests harness workflows are
 * properly defined.
 */

import { describe, it, expect } from 'vitest';
import {
  getExploreSkillTemplate,
  getOpsxExploreCommandTemplate,
  getNewChangeSkillTemplate,
  getOpsxNewCommandTemplate,
  getContinueChangeSkillTemplate,
  getOpsxContinueCommandTemplate,
  getApplyChangeSkillTemplate,
  getOpsxApplyCommandTemplate,
  getFfChangeSkillTemplate,
  getOpsxFfCommandTemplate,
  getSyncSpecsSkillTemplate,
  getOpsxSyncCommandTemplate,
  getArchiveChangeSkillTemplate,
  getOpsxArchiveCommandTemplate,
  getBulkArchiveChangeSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getVerifyChangeSkillTemplate,
  getOpsxVerifyCommandTemplate,
  getOnboardSkillTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxReviewSkillTemplate,
  getOpsxReviewCommandTemplate,
  getOpsxInitTestsSkillTemplate,
  getOpsxInitTestsCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';
import type { SkillTemplate, CommandTemplate } from '../../../src/core/templates/skill-templates.js';

// ---------------------------------------------------------------------------
// Helper: pair every workflow that has both a skill and command template
// ---------------------------------------------------------------------------

interface WorkflowPair {
  workflowId: string;
  getSkill: () => SkillTemplate;
  getCommand: () => CommandTemplate;
}

const WORKFLOW_PAIRS: WorkflowPair[] = [
  { workflowId: 'explore', getSkill: getExploreSkillTemplate, getCommand: getOpsxExploreCommandTemplate },
  { workflowId: 'new', getSkill: getNewChangeSkillTemplate, getCommand: getOpsxNewCommandTemplate },
  { workflowId: 'continue', getSkill: getContinueChangeSkillTemplate, getCommand: getOpsxContinueCommandTemplate },
  { workflowId: 'apply', getSkill: getApplyChangeSkillTemplate, getCommand: getOpsxApplyCommandTemplate },
  { workflowId: 'ff', getSkill: getFfChangeSkillTemplate, getCommand: getOpsxFfCommandTemplate },
  { workflowId: 'sync', getSkill: getSyncSpecsSkillTemplate, getCommand: getOpsxSyncCommandTemplate },
  { workflowId: 'archive', getSkill: getArchiveChangeSkillTemplate, getCommand: getOpsxArchiveCommandTemplate },
  { workflowId: 'bulk-archive', getSkill: getBulkArchiveChangeSkillTemplate, getCommand: getOpsxBulkArchiveCommandTemplate },
  { workflowId: 'verify', getSkill: getVerifyChangeSkillTemplate, getCommand: getOpsxVerifyCommandTemplate },
  { workflowId: 'onboard', getSkill: getOnboardSkillTemplate, getCommand: getOpsxOnboardCommandTemplate },
  { workflowId: 'propose', getSkill: getOpsxProposeSkillTemplate, getCommand: getOpsxProposeCommandTemplate },
  { workflowId: 'review', getSkill: getOpsxReviewSkillTemplate, getCommand: getOpsxReviewCommandTemplate },
  { workflowId: 'init-tests', getSkill: getOpsxInitTestsSkillTemplate, getCommand: getOpsxInitTestsCommandTemplate },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('skill-templates parity', () => {
  describe('every workflow has both SkillTemplate and CommandTemplate', () => {
    for (const pair of WORKFLOW_PAIRS) {
      it(`${pair.workflowId}: exports a SkillTemplate`, () => {
        const skill = pair.getSkill();
        expect(skill).toBeDefined();
        expect(skill.name).toBeTruthy();
        expect(skill.description).toBeTruthy();
        expect(skill.instructions).toBeTruthy();
      });

      it(`${pair.workflowId}: exports a CommandTemplate`, () => {
        const cmd = pair.getCommand();
        expect(cmd).toBeDefined();
        expect(cmd.name).toBeTruthy();
        expect(cmd.description).toBeTruthy();
        expect(cmd.category).toBeTruthy();
        expect(cmd.content).toBeTruthy();
      });
    }
  });

  describe('review workflow templates', () => {
    it('should have skill name openspec-review', () => {
      const skill = getOpsxReviewSkillTemplate();
      expect(skill.name).toBe('openspec-review');
    });

    it('should have command name review', () => {
      const cmd = getOpsxReviewCommandTemplate();
      expect(cmd.name).toBe('review');
    });

    it('should have command category harness', () => {
      const cmd = getOpsxReviewCommandTemplate();
      expect(cmd.category).toBe('harness');
    });

    it('should have review tags', () => {
      const cmd = getOpsxReviewCommandTemplate();
      expect(cmd.tags).toContain('review');
      expect(cmd.tags).toContain('harness');
    });
  });

  describe('init-tests workflow templates', () => {
    it('should have skill name openspec-init-tests', () => {
      const skill = getOpsxInitTestsSkillTemplate();
      expect(skill.name).toBe('openspec-init-tests');
    });

    it('should have command name init-tests', () => {
      const cmd = getOpsxInitTestsCommandTemplate();
      expect(cmd.name).toBe('init-tests');
    });

    it('should have command category harness', () => {
      const cmd = getOpsxInitTestsCommandTemplate();
      expect(cmd.category).toBe('harness');
    });

    it('should have init-tests tags', () => {
      const cmd = getOpsxInitTestsCommandTemplate();
      expect(cmd.tags).toContain('tests');
      expect(cmd.tags).toContain('harness');
    });

    it('should include license in skill template', () => {
      const skill = getOpsxInitTestsSkillTemplate();
      expect(skill.license).toBe('MIT');
    });

    it('should include metadata in skill template', () => {
      const skill = getOpsxInitTestsSkillTemplate();
      expect(skill.metadata).toBeDefined();
      expect(skill.metadata!.author).toBe('harness-spec');
    });
  });

  describe('template naming conventions', () => {
    it('all skill names should start with "openspec-"', () => {
      for (const pair of WORKFLOW_PAIRS) {
        const skill = pair.getSkill();
        expect(skill.name).toMatch(/^openspec-/);
      }
    });

    it('command names should be non-empty display names', () => {
      // Command names vary: "OPSX: Explore" for upstream workflows,
      // "review" / "init-tests" for harness-specific workflows.
      for (const pair of WORKFLOW_PAIRS) {
        const cmd = pair.getCommand();
        expect(cmd.name.length).toBeGreaterThan(0);
      }
    });

    it('all command templates should have tags as arrays', () => {
      for (const pair of WORKFLOW_PAIRS) {
        const cmd = pair.getCommand();
        expect(Array.isArray(cmd.tags)).toBe(true);
        expect(cmd.tags.length).toBeGreaterThan(0);
      }
    });
  });

  describe('total template count', () => {
    it('should have exactly 13 workflow pairs', () => {
      expect(WORKFLOW_PAIRS).toHaveLength(13);
    });
  });
});
