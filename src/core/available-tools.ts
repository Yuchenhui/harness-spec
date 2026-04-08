/**
 * Available Tools Stub
 *
 * Minimal stub for tool detection removed during extraction.
 */

import type { AIToolOption } from './config.js';
import { AI_TOOLS } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Detects AI tools available in the project based on directory presence.
 */
export function getAvailableTools(projectPath: string): AIToolOption[] {
  const available: AIToolOption[] = [];
  for (const tool of AI_TOOLS) {
    if (!tool.skillsDir) continue;
    const toolDir = path.join(projectPath, tool.skillsDir);
    if (fs.existsSync(toolDir)) {
      available.push(tool);
    }
  }
  return available;
}
