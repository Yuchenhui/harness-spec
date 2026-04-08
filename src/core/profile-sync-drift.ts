/**
 * Profile Sync Drift Stub
 *
 * Minimal stub for profile sync drift functions removed during extraction.
 */

import type { AIToolOption } from './config.js';
import type { Delivery } from './global-config.js';
import { AI_TOOLS } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Mapping from workflow ID to skill directory name.
 */
export const WORKFLOW_TO_SKILL_DIR: Record<string, string> = {
  'explore': 'openspec-explore',
  'new': 'openspec-new-change',
  'continue': 'openspec-continue-change',
  'apply': 'openspec-apply-change',
  'ff': 'openspec-ff-change',
  'sync': 'openspec-sync-specs',
  'archive': 'openspec-archive-change',
  'bulk-archive': 'openspec-bulk-archive-change',
  'verify': 'openspec-verify-change',
  'onboard': 'openspec-onboard',
  'propose': 'openspec-propose',
};

/**
 * Check whether a project's installed workflows/delivery differ from global config.
 */
export function hasProjectConfigDrift(
  _projectDir: string,
  _workflows: readonly string[],
  _delivery: Delivery
): boolean {
  return false;
}

/**
 * Returns tool IDs that have command files configured in the project.
 */
export function getCommandConfiguredTools(_projectPath: string): string[] {
  return [];
}

/**
 * Returns tool IDs that have skills or commands configured in the project.
 */
export function getConfiguredToolsForProfileSync(projectPath: string): string[] {
  const configured: string[] = [];
  for (const tool of AI_TOOLS) {
    if (!tool.skillsDir) continue;
    const skillsDir = path.join(projectPath, tool.skillsDir, 'skills');
    if (fs.existsSync(skillsDir)) {
      configured.push(tool.value);
    }
  }
  return configured;
}

/**
 * Returns tool IDs that need profile sync (their installed workflows don't match desired).
 */
export function getToolsNeedingProfileSync(
  _projectPath: string,
  _desiredWorkflows: readonly string[],
  _delivery: Delivery,
  _configuredTools: string[]
): string[] {
  return [];
}
