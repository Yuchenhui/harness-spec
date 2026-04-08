/**
 * JSON Converter Stub
 *
 * Minimal stub for the JsonConverter class removed during extraction.
 */

export class JsonConverter {
  async convertChangeToJson(filePath: string): Promise<string> {
    const fs = await import('fs');
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.stringify({ name: '', deltas: [], raw: content });
  }
}
