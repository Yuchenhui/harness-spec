/**
 * Tool Detection Tests
 *
 * Tests for SKILL_NAMES, COMMAND_IDS, and the detection/status functions
 * in src/core/shared/tool-detection.ts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  SKILL_NAMES,
  COMMAND_IDS,
  getToolsWithSkillsDir,
  getToolSkillStatus,
  getToolStates,
  extractGeneratedByVersion,
  getToolVersionStatus,
  getConfiguredTools,
  getAllToolVersionStatus,
} from '../../../src/core/shared/tool-detection.js';

// ---------------------------------------------------------------------------
// SKILL_NAMES and COMMAND_IDS constants
// ---------------------------------------------------------------------------

describe('SKILL_NAMES', () => {
  it('should include openspec-review', () => {
    expect(SKILL_NAMES).toContain('openspec-review');
  });

  it('should include openspec-init-tests', () => {
    expect(SKILL_NAMES).toContain('openspec-init-tests');
  });

  it('should include all core skill names', () => {
    const expected = [
      'openspec-explore',
      'openspec-new-change',
      'openspec-continue-change',
      'openspec-apply-change',
      'openspec-ff-change',
      'openspec-sync-specs',
      'openspec-archive-change',
      'openspec-bulk-archive-change',
      'openspec-verify-change',
      'openspec-onboard',
      'openspec-propose',
      'openspec-review',
      'openspec-init-tests',
    ];
    for (const name of expected) {
      expect(SKILL_NAMES).toContain(name);
    }
  });

  it('should have exactly 13 entries', () => {
    expect(SKILL_NAMES).toHaveLength(13);
  });

  it('should be a readonly array', () => {
    // TypeScript enforces `as const`, but at runtime we just verify it is an array
    expect(Array.isArray(SKILL_NAMES)).toBe(true);
  });
});

describe('COMMAND_IDS', () => {
  it('should include review', () => {
    expect(COMMAND_IDS).toContain('review');
  });

  it('should include init-tests', () => {
    expect(COMMAND_IDS).toContain('init-tests');
  });

  it('should include all core command IDs', () => {
    const expected = [
      'explore',
      'new',
      'continue',
      'apply',
      'ff',
      'sync',
      'archive',
      'bulk-archive',
      'verify',
      'onboard',
      'propose',
      'review',
      'init-tests',
    ];
    for (const id of expected) {
      expect(COMMAND_IDS).toContain(id);
    }
  });

  it('should have exactly 13 entries', () => {
    expect(COMMAND_IDS).toHaveLength(13);
  });
});

// ---------------------------------------------------------------------------
// getToolsWithSkillsDir()
// ---------------------------------------------------------------------------

describe('getToolsWithSkillsDir()', () => {
  it('should return an array of tool IDs', () => {
    const tools = getToolsWithSkillsDir();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should include claude as a tool with skills support', () => {
    const tools = getToolsWithSkillsDir();
    expect(tools).toContain('claude');
  });
});

// ---------------------------------------------------------------------------
// getToolSkillStatus()
// ---------------------------------------------------------------------------

describe('getToolSkillStatus()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `tool-detection-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return unconfigured status when no skills exist', () => {
    const status = getToolSkillStatus(tempDir, 'claude');
    expect(status.configured).toBe(false);
    expect(status.fullyConfigured).toBe(false);
    expect(status.skillCount).toBe(0);
  });

  it('should detect configured skills when SKILL.md files exist', () => {
    // Create a skill directory for claude (.claude/skills/openspec-explore/SKILL.md)
    const skillDir = path.join(tempDir, '.claude', 'skills', 'openspec-explore');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Skill');

    const status = getToolSkillStatus(tempDir, 'claude');
    expect(status.configured).toBe(true);
    expect(status.skillCount).toBe(1);
    expect(status.fullyConfigured).toBe(false); // Only 1 of 13
  });

  it('should return fullyConfigured when all skills exist', () => {
    for (const skillName of SKILL_NAMES) {
      const skillDir = path.join(tempDir, '.claude', 'skills', skillName);
      fs.mkdirSync(skillDir, { recursive: true });
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Skill');
    }

    const status = getToolSkillStatus(tempDir, 'claude');
    expect(status.configured).toBe(true);
    expect(status.fullyConfigured).toBe(true);
    expect(status.skillCount).toBe(SKILL_NAMES.length);
  });

  it('should return unconfigured for unknown tool ID', () => {
    const status = getToolSkillStatus(tempDir, 'unknown-tool');
    expect(status.configured).toBe(false);
    expect(status.skillCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getToolStates()
// ---------------------------------------------------------------------------

describe('getToolStates()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `tool-states-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return a Map of tool states', () => {
    const states = getToolStates(tempDir);
    expect(states).toBeInstanceOf(Map);
    expect(states.size).toBeGreaterThan(0);
  });

  it('should include claude in the states map', () => {
    const states = getToolStates(tempDir);
    expect(states.has('claude')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// extractGeneratedByVersion()
// ---------------------------------------------------------------------------

describe('extractGeneratedByVersion()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `version-extract-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should extract version from valid YAML frontmatter', () => {
    const skillFile = path.join(tempDir, 'SKILL.md');
    fs.writeFileSync(
      skillFile,
      `---
name: openspec-explore
description: Explore specs
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "0.25.0"
---

# Instructions
`,
    );

    const version = extractGeneratedByVersion(skillFile);
    expect(version).toBe('0.25.0');
  });

  it('should return null when file does not exist', () => {
    const version = extractGeneratedByVersion(path.join(tempDir, 'nonexistent.md'));
    expect(version).toBeNull();
  });

  it('should return null when generatedBy field is missing', () => {
    const skillFile = path.join(tempDir, 'SKILL.md');
    fs.writeFileSync(skillFile, '---\nname: test\n---\n# Test');

    const version = extractGeneratedByVersion(skillFile);
    expect(version).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getToolVersionStatus()
// ---------------------------------------------------------------------------

describe('getToolVersionStatus()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `version-status-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should report needsUpdate=false for unknown tool', () => {
    const status = getToolVersionStatus(tempDir, 'unknown-tool', '1.0.0');
    expect(status.configured).toBe(false);
    expect(status.needsUpdate).toBe(false);
  });

  it('should report needsUpdate=true when version mismatches', () => {
    // Create one skill file with an old version
    const skillDir = path.join(tempDir, '.claude', 'skills', 'openspec-explore');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---
name: openspec-explore
metadata:
  generatedBy: "0.20.0"
---
# Instructions
`,
    );

    const status = getToolVersionStatus(tempDir, 'claude', '0.25.0');
    expect(status.configured).toBe(true);
    expect(status.generatedByVersion).toBe('0.20.0');
    expect(status.needsUpdate).toBe(true);
  });

  it('should report needsUpdate=false when version matches', () => {
    const skillDir = path.join(tempDir, '.claude', 'skills', 'openspec-explore');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---
name: openspec-explore
metadata:
  generatedBy: "1.0.0"
---
# Instructions
`,
    );

    const status = getToolVersionStatus(tempDir, 'claude', '1.0.0');
    expect(status.configured).toBe(true);
    expect(status.needsUpdate).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getConfiguredTools() / getAllToolVersionStatus()
// ---------------------------------------------------------------------------

describe('getConfiguredTools()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `configured-tools-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return empty array when no tools are configured', () => {
    const tools = getConfiguredTools(tempDir);
    expect(tools).toEqual([]);
  });

  it('should detect configured tools', () => {
    const skillDir = path.join(tempDir, '.claude', 'skills', 'openspec-explore');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Skill');

    const tools = getConfiguredTools(tempDir);
    expect(tools).toContain('claude');
  });
});

describe('getAllToolVersionStatus()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(
      os.tmpdir(),
      `all-version-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return empty array when nothing is configured', () => {
    const statuses = getAllToolVersionStatus(tempDir, '1.0.0');
    expect(statuses).toEqual([]);
  });

  it('should return version status for configured tools', () => {
    const skillDir = path.join(tempDir, '.claude', 'skills', 'openspec-explore');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---\nmetadata:\n  generatedBy: "1.0.0"\n---\n# Test`,
    );

    const statuses = getAllToolVersionStatus(tempDir, '1.0.0');
    expect(statuses.length).toBeGreaterThan(0);
    const claude = statuses.find((s) => s.toolId === 'claude');
    expect(claude).toBeDefined();
    expect(claude!.needsUpdate).toBe(false);
  });
});
