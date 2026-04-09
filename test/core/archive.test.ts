/**
 * Archive Command Tests (harness-spec)
 *
 * Tests for the ArchiveCommand class. Adapted from upstream patterns
 * but focused on the harness-spec fork's specifics.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ArchiveCommand } from '../../src/core/archive.js';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock @inquirer/prompts to avoid interactive prompts in tests
vi.mock('@inquirer/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn(),
}));

describe('ArchiveCommand', () => {
  let tempDir: string;
  let archiveCommand: ArchiveCommand;
  const originalConsoleLog = console.log;

  beforeEach(async () => {
    tempDir = path.join(os.tmpdir(), `harness-archive-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await fs.mkdir(tempDir, { recursive: true });
    process.chdir(tempDir);

    // Create standard OpenSpec structure
    const openspecDir = path.join(tempDir, 'openspec');
    await fs.mkdir(path.join(openspecDir, 'changes'), { recursive: true });
    await fs.mkdir(path.join(openspecDir, 'specs'), { recursive: true });
    await fs.mkdir(path.join(openspecDir, 'changes', 'archive'), { recursive: true });

    console.log = vi.fn();
    archiveCommand = new ArchiveCommand();
  });

  afterEach(async () => {
    console.log = originalConsoleLog;
    vi.clearAllMocks();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('class structure', () => {
    it('should be instantiable', () => {
      expect(archiveCommand).toBeInstanceOf(ArchiveCommand);
    });

    it('should have an execute method', () => {
      expect(typeof archiveCommand.execute).toBe('function');
    });
  });

  describe('validation: changes must exist', () => {
    it('should throw when openspec/changes directory does not exist', async () => {
      await fs.rm(path.join(tempDir, 'openspec'), { recursive: true });

      await expect(
        archiveCommand.execute('any-change', { yes: true })
      ).rejects.toThrow("No OpenSpec changes directory found. Run 'openspec init' first.");
    });

    it('should throw when the named change does not exist', async () => {
      await expect(
        archiveCommand.execute('non-existent', { yes: true })
      ).rejects.toThrow("Change 'non-existent' not found.");
    });

    it('should throw when change path is a file, not a directory', async () => {
      // Create a file instead of directory
      await fs.writeFile(path.join(tempDir, 'openspec', 'changes', 'a-file'), 'not a dir');

      await expect(
        archiveCommand.execute('a-file', { yes: true })
      ).rejects.toThrow("Change 'a-file' not found.");
    });
  });

  describe('task completion check', () => {
    it('should archive without warnings when all tasks are complete', async () => {
      const changeName = 'all-done';
      const changeDir = path.join(tempDir, 'openspec', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Task 1\n- [x] Task 2\n');

      await archiveCommand.execute(changeName, { yes: true });

      // Should not warn about incomplete tasks
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('incomplete task(s)')
      );

      // Should have archived
      const archives = await fs.readdir(path.join(tempDir, 'openspec', 'changes', 'archive'));
      expect(archives.length).toBe(1);
      expect(archives[0]).toContain(changeName);
    });

    it('should warn about incomplete tasks and continue with --yes', async () => {
      const changeName = 'partial';
      const changeDir = path.join(tempDir, 'openspec', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'tasks.md'), '- [x] Done\n- [ ] Not done\n');

      await archiveCommand.execute(changeName, { yes: true });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Warning: 1 incomplete task(s) found')
      );

      // Should still archive
      const archives = await fs.readdir(path.join(tempDir, 'openspec', 'changes', 'archive'));
      expect(archives.length).toBe(1);
    });

    it('should archive changes without tasks.md (no tasks = zero incomplete)', async () => {
      const changeName = 'no-tasks';
      const changeDir = path.join(tempDir, 'openspec', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });

      await archiveCommand.execute(changeName, { yes: true });

      const archives = await fs.readdir(path.join(tempDir, 'openspec', 'changes', 'archive'));
      expect(archives.length).toBe(1);
    });
  });

  describe('archive naming', () => {
    it('should create archive with YYYY-MM-DD prefix', async () => {
      const changeName = 'dated-change';
      const changeDir = path.join(tempDir, 'openspec', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });

      await archiveCommand.execute(changeName, { yes: true });

      const archives = await fs.readdir(path.join(tempDir, 'openspec', 'changes', 'archive'));
      expect(archives[0]).toMatch(/^\d{4}-\d{2}-\d{2}-dated-change$/);
    });

    it('should throw when archive already exists', async () => {
      const changeName = 'dup';
      const changeDir = path.join(tempDir, 'openspec', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });

      const date = new Date().toISOString().split('T')[0];
      const archivePath = path.join(tempDir, 'openspec', 'changes', 'archive', `${date}-${changeName}`);
      await fs.mkdir(archivePath, { recursive: true });

      await expect(
        archiveCommand.execute(changeName, { yes: true })
      ).rejects.toThrow(`Archive '${date}-${changeName}' already exists.`);
    });
  });

  describe('original directory removal', () => {
    it('should remove the original change directory after archiving', async () => {
      const changeName = 'to-archive';
      const changeDir = path.join(tempDir, 'openspec', 'changes', changeName);
      await fs.mkdir(changeDir, { recursive: true });
      await fs.writeFile(path.join(changeDir, 'proposal.md'), '# Proposal');

      await archiveCommand.execute(changeName, { yes: true });

      await expect(fs.access(changeDir)).rejects.toThrow();
    });
  });
});
