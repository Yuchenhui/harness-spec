/**
 * Migration Stub
 *
 * Minimal stub for migration functions removed during extraction.
 */

import type { AIToolOption } from './config.js';

/**
 * Runs any needed one-time migrations for a project.
 */
export function migrateIfNeeded(
  _projectPath: string,
  _detectedTools: AIToolOption[]
): void {
  // no-op
}

/**
 * Scans installed workflow artifacts (skills and managed commands) across tools.
 * Returns the union of detected workflow IDs.
 */
export function scanInstalledWorkflows(
  _projectPath: string,
  _tools: AIToolOption[]
): string[] {
  return [];
}
