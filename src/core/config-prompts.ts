/**
 * Config Prompts Stub
 *
 * Minimal stub for config prompt functions removed during extraction.
 */

/**
 * Serializes a config object to YAML string.
 */
export function serializeConfig(config: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(config)) {
    lines.push(`${key}: ${JSON.stringify(value)}`);
  }
  return lines.join('\n') + '\n';
}
