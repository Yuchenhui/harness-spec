/**
 * Legacy Cleanup Stub
 *
 * Minimal stub for legacy cleanup functions removed during extraction.
 */

export interface LegacyDetectionResult {
  hasLegacyArtifacts: boolean;
  legacySlashCommands: string[];
  legacyConfigMarkers: string[];
  legacyToolDirs: string[];
}

export interface LegacyCleanupResult {
  removedSlashCommands: string[];
  removedConfigMarkers: string[];
  removedToolDirs: string[];
}

export async function detectLegacyArtifacts(
  _projectPath: string
): Promise<LegacyDetectionResult> {
  return {
    hasLegacyArtifacts: false,
    legacySlashCommands: [],
    legacyConfigMarkers: [],
    legacyToolDirs: [],
  };
}

export async function cleanupLegacyArtifacts(
  _projectPath: string,
  _detection: LegacyDetectionResult
): Promise<LegacyCleanupResult> {
  return {
    removedSlashCommands: [],
    removedConfigMarkers: [],
    removedToolDirs: [],
  };
}

export function formatCleanupSummary(_result: LegacyCleanupResult): string {
  return '';
}

export function formatDetectionSummary(_detection: LegacyDetectionResult): string {
  return '';
}

export function getToolsFromLegacyArtifacts(
  _detection: LegacyDetectionResult
): string[] {
  return [];
}
