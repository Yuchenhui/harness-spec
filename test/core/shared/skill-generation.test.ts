/**
 * Skill Generation Tests
 *
 * Tests for getSkillTemplates(), getCommandTemplates(), getCommandContents(),
 * and generateSkillContent() in src/core/shared/skill-generation.ts.
 */

import { describe, it, expect } from 'vitest';
import {
  getSkillTemplates,
  getCommandTemplates,
  getCommandContents,
  generateSkillContent,
} from '../../../src/core/shared/skill-generation.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';

describe('skill-generation', () => {
  // -------------------------------------------------------------------------
  // getSkillTemplates()
  // -------------------------------------------------------------------------

  describe('getSkillTemplates()', () => {
    it('should return all templates when no filter is provided', () => {
      const templates = getSkillTemplates();
      // There are 13 workflows with skill templates (all from ALL_WORKFLOWS)
      expect(templates.length).toBeGreaterThanOrEqual(13);
    });

    it('should return templates for review and init-tests workflows', () => {
      const templates = getSkillTemplates();
      const workflowIds = templates.map((t) => t.workflowId);
      expect(workflowIds).toContain('review');
      expect(workflowIds).toContain('init-tests');
    });

    it('should return templates for all core workflows', () => {
      const templates = getSkillTemplates();
      const workflowIds = new Set(templates.map((t) => t.workflowId));

      // Every workflow in ALL_WORKFLOWS should have a skill template
      for (const wf of ALL_WORKFLOWS) {
        expect(workflowIds.has(wf)).toBe(true);
      }
    });

    it('should have correct dirName for review template', () => {
      const templates = getSkillTemplates();
      const review = templates.find((t) => t.workflowId === 'review');
      expect(review).toBeDefined();
      expect(review!.dirName).toBe('openspec-review');
    });

    it('should have correct dirName for init-tests template', () => {
      const templates = getSkillTemplates();
      const initTests = templates.find((t) => t.workflowId === 'init-tests');
      expect(initTests).toBeDefined();
      expect(initTests!.dirName).toBe('openspec-init-tests');
    });

    it('should filter templates by workflow IDs', () => {
      const filtered = getSkillTemplates(['review', 'init-tests']);
      expect(filtered).toHaveLength(2);
      const ids = filtered.map((t) => t.workflowId);
      expect(ids).toContain('review');
      expect(ids).toContain('init-tests');
    });

    it('should return empty array when filter matches nothing', () => {
      const filtered = getSkillTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });

    it('should have valid workflowIds that exist in ALL_WORKFLOWS', () => {
      const templates = getSkillTemplates();
      const allWorkflowSet = new Set<string>(ALL_WORKFLOWS);
      for (const entry of templates) {
        expect(allWorkflowSet.has(entry.workflowId)).toBe(true);
      }
    });

    it('should return templates with non-empty name and description', () => {
      const templates = getSkillTemplates();
      for (const entry of templates) {
        expect(entry.template.name).toBeTruthy();
        expect(entry.template.description).toBeTruthy();
        expect(entry.template.instructions).toBeTruthy();
      }
    });
  });

  // -------------------------------------------------------------------------
  // getCommandTemplates()
  // -------------------------------------------------------------------------

  describe('getCommandTemplates()', () => {
    it('should return all command templates when no filter is provided', () => {
      const templates = getCommandTemplates();
      expect(templates.length).toBeGreaterThanOrEqual(13);
    });

    it('should include review and init-tests commands', () => {
      const templates = getCommandTemplates();
      const ids = templates.map((t) => t.id);
      expect(ids).toContain('review');
      expect(ids).toContain('init-tests');
    });

    it('should filter command templates by workflow IDs', () => {
      const filtered = getCommandTemplates(['review', 'apply']);
      expect(filtered).toHaveLength(2);
      const ids = filtered.map((t) => t.id);
      expect(ids).toContain('review');
      expect(ids).toContain('apply');
    });

    it('should return empty array when filter matches nothing', () => {
      const filtered = getCommandTemplates(['nonexistent']);
      expect(filtered).toHaveLength(0);
    });

    it('should have non-empty name, description, category, and content for each template', () => {
      const templates = getCommandTemplates();
      for (const entry of templates) {
        expect(entry.template.name).toBeTruthy();
        expect(entry.template.description).toBeTruthy();
        expect(entry.template.category).toBeTruthy();
        expect(entry.template.content).toBeTruthy();
      }
    });
  });

  // -------------------------------------------------------------------------
  // getCommandContents()
  // -------------------------------------------------------------------------

  describe('getCommandContents()', () => {
    it('should return command contents for all workflows', () => {
      const contents = getCommandContents();
      expect(contents.length).toBeGreaterThanOrEqual(13);
    });

    it('should return contents with correct shape', () => {
      const contents = getCommandContents();
      for (const c of contents) {
        expect(c).toHaveProperty('id');
        expect(c).toHaveProperty('name');
        expect(c).toHaveProperty('description');
        expect(c).toHaveProperty('category');
        expect(c).toHaveProperty('tags');
        expect(c).toHaveProperty('body');
      }
    });

    it('should filter contents by workflow IDs', () => {
      const filtered = getCommandContents(['init-tests']);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('init-tests');
    });
  });

  // -------------------------------------------------------------------------
  // getSkillTemplates and getCommandTemplates parity
  // -------------------------------------------------------------------------

  describe('skill-command parity', () => {
    it('should have the same number of skill and command templates', () => {
      const skills = getSkillTemplates();
      const commands = getCommandTemplates();
      expect(skills.length).toBe(commands.length);
    });

    it('should have matching workflow IDs between skills and commands', () => {
      const skillIds = new Set(getSkillTemplates().map((t) => t.workflowId));
      const commandIds = new Set(getCommandTemplates().map((t) => t.id));
      expect(skillIds).toEqual(commandIds);
    });
  });

  // -------------------------------------------------------------------------
  // generateSkillContent()
  // -------------------------------------------------------------------------

  describe('generateSkillContent()', () => {
    it('should generate content with YAML frontmatter', () => {
      const template = getSkillTemplates().find((t) => t.workflowId === 'review')!.template;
      const content = generateSkillContent(template, '1.0.0');
      expect(content).toContain('---');
      expect(content).toContain('name: openspec-review');
      expect(content).toContain('generatedBy: "1.0.0"');
    });

    it('should apply instruction transformer when provided', () => {
      const template = getSkillTemplates().find((t) => t.workflowId === 'review')!.template;
      const transformer = (instructions: string) => instructions.toUpperCase();
      const content = generateSkillContent(template, '1.0.0', transformer);
      // The instructions portion should be uppercase
      expect(content).toContain('REVIEW AND STRENGTHEN SPECS');
    });

    it('should include license and compatibility fields', () => {
      const template = getSkillTemplates().find((t) => t.workflowId === 'init-tests')!.template;
      const content = generateSkillContent(template, '2.0.0');
      expect(content).toContain('license: MIT');
      expect(content).toContain('compatibility:');
    });
  });
});
