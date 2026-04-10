#!/usr/bin/env node
// scripts/worktree.js — Git worktree management for evaluator isolation
//
// Creates a detached git worktree at the current HEAD so the evaluator
// subagent can run verification commands against only committed state.
//
// Usage:
//   node worktree.js setup <task_id>    → create worktree, print path
//   node worktree.js cleanup <task_id>  → remove worktree
//   node worktree.js prune              → clean up all stale worktrees
//
// Cross-platform: uses fs.symlink with 'junction' for Windows compatibility.

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Directories commonly gitignored that evaluator may need to run tests.
// We symlink these from the main worktree into the isolated worktree.
const DEPENDENCY_DIRS = [
  'node_modules',
  'venv',
  '.venv',
  'env',
  '.env-venv',
  'target',          // Rust
  'build',           // Many
  '__pycache__',     // Python
  '.pytest_cache',   // Python
  '.tox',            // Python
  'vendor',          // Go, PHP
];

function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], encoding: 'utf8', ...opts }).trim();
}

function tryRun(cmd, opts = {}) {
  try {
    return { ok: true, output: run(cmd, opts) };
  } catch (e) {
    return { ok: false, error: e.message, stderr: e.stderr?.toString() };
  }
}

function isGitRepo() {
  return tryRun('git rev-parse --is-inside-work-tree').ok;
}

function getWorktreePath(taskId) {
  // Sanitize task_id for filesystem
  const safe = String(taskId).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(os.tmpdir(), `harness-eval-${safe}`);
}

function setupWorktree(taskId) {
  // Fallback: not a git repo
  if (!isGitRepo()) {
    console.error('[harness] Not a git repo — falling back to commit isolation (main working directory).');
    console.log(process.cwd());
    return;
  }

  const wtPath = getWorktreePath(taskId);

  // Clean up any orphan at this path
  tryRun(`git worktree remove --force "${wtPath}"`);
  if (fs.existsSync(wtPath)) {
    try { fs.rmSync(wtPath, { recursive: true, force: true }); } catch {}
  }

  // Get current HEAD — this should be the coding agent's commit
  const shaResult = tryRun('git rev-parse HEAD');
  if (!shaResult.ok) {
    console.error('[harness] Cannot get HEAD — falling back to commit isolation.');
    console.log(process.cwd());
    return;
  }
  const sha = shaResult.output;

  // Create detached worktree at this commit
  const createResult = tryRun(`git worktree add --detach "${wtPath}" "${sha}"`);
  if (!createResult.ok) {
    console.error(`[harness] git worktree add failed: ${createResult.stderr || createResult.error}`);
    console.error('[harness] Falling back to commit isolation.');
    console.log(process.cwd());
    return;
  }

  // Symlink gitignored dependency directories from main worktree
  const mainRoot = process.cwd();
  for (const dir of DEPENDENCY_DIRS) {
    const src = path.join(mainRoot, dir);
    const dest = path.join(wtPath, dir);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      try {
        // 'junction' works on Windows (junction) and falls back to dir symlink on Unix
        fs.symlinkSync(src, dest, 'junction');
      } catch {
        try {
          fs.symlinkSync(src, dest, 'dir');
        } catch {
          // Give up silently — dependency may be re-installed or missing
        }
      }
    }
  }

  // Output the worktree path (this is what apply.md captures)
  console.log(wtPath);
}

function cleanupWorktree(taskId) {
  if (!isGitRepo()) return;

  const wtPath = getWorktreePath(taskId);

  // Remove via git first
  tryRun(`git worktree remove --force "${wtPath}"`);

  // Manual cleanup if still exists
  if (fs.existsSync(wtPath)) {
    try { fs.rmSync(wtPath, { recursive: true, force: true }); } catch {}
  }
}

function pruneWorktrees() {
  if (!isGitRepo()) return;

  // Prune git's internal worktree registry
  tryRun('git worktree prune');

  // Also clean up any harness-eval-* directories in tmp that are orphaned
  const tmpDir = os.tmpdir();
  try {
    for (const entry of fs.readdirSync(tmpDir)) {
      if (entry.startsWith('harness-eval-')) {
        const fullPath = path.join(tmpDir, entry);
        tryRun(`git worktree remove --force "${fullPath}"`);
        try { fs.rmSync(fullPath, { recursive: true, force: true }); } catch {}
      }
    }
  } catch {}
}

const cmd = process.argv[2];
const taskId = process.argv[3];

if (cmd === 'setup' && taskId) setupWorktree(taskId);
else if (cmd === 'cleanup' && taskId) cleanupWorktree(taskId);
else if (cmd === 'prune') pruneWorktrees();
else {
  console.error('Usage: node worktree.js setup|cleanup <task_id>  |  prune');
  process.exit(1);
}
