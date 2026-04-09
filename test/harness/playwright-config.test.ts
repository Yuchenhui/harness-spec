import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  generatePlaywrightConfig,
  detectPlaywright,
} from '../../src/core/playwright-config.js';

describe('playwright-config', () => {
  describe('generatePlaywrightConfig', () => {
    it('should return a valid MCP config structure', () => {
      const config = generatePlaywrightConfig();
      expect(config.mcpServers).toBeDefined();
      expect(config.mcpServers.playwright).toBeDefined();
      expect(config.mcpServers.playwright.command).toBe('npx');
      expect(config.mcpServers.playwright.args).toBeInstanceOf(Array);
    });

    it('should always include @playwright/mcp@latest as first arg', () => {
      const config = generatePlaywrightConfig();
      expect(config.mcpServers.playwright.args[0]).toBe('@playwright/mcp@latest');
    });

    describe('default (headless=true, vision=false)', () => {
      it('should include --headless flag', () => {
        const config = generatePlaywrightConfig();
        expect(config.mcpServers.playwright.args).toContain('--headless');
      });

      it('should not include --caps=vision flag', () => {
        const config = generatePlaywrightConfig();
        expect(config.mcpServers.playwright.args).not.toContain('--caps=vision');
      });
    });

    describe('headless mode', () => {
      it('should add --headless when headless=true', () => {
        const config = generatePlaywrightConfig(true);
        expect(config.mcpServers.playwright.args).toContain('--headless');
      });

      it('should not add --headless when headless=false', () => {
        const config = generatePlaywrightConfig(false);
        expect(config.mcpServers.playwright.args).not.toContain('--headless');
      });
    });

    describe('vision mode', () => {
      it('should add --caps=vision when vision=true', () => {
        const config = generatePlaywrightConfig(true, true);
        expect(config.mcpServers.playwright.args).toContain('--caps=vision');
      });

      it('should not add --caps=vision when vision=false', () => {
        const config = generatePlaywrightConfig(true, false);
        expect(config.mcpServers.playwright.args).not.toContain('--caps=vision');
      });
    });

    describe('combined modes', () => {
      it('should add both flags when headless=true and vision=true', () => {
        const config = generatePlaywrightConfig(true, true);
        const args = config.mcpServers.playwright.args;
        expect(args).toContain('--headless');
        expect(args).toContain('--caps=vision');
        expect(args).toHaveLength(3); // @playwright/mcp@latest, --headless, --caps=vision
      });

      it('should have only base arg when headless=false and vision=false', () => {
        const config = generatePlaywrightConfig(false, false);
        expect(config.mcpServers.playwright.args).toEqual(['@playwright/mcp@latest']);
      });
    });
  });

  describe('detectPlaywright', () => {
    let tempDir: string;

    beforeAll(() => {
      tempDir = path.join(os.tmpdir(), `openspec-pw-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      fs.mkdirSync(tempDir, { recursive: true });
    });

    afterAll(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should return not available for empty project', async () => {
      const emptyDir = path.join(tempDir, 'empty');
      fs.mkdirSync(emptyDir, { recursive: true });

      const result = await detectPlaywright(emptyDir);
      expect(result.available).toBe(false);
      expect(result.hasConfig).toBe(false);
      expect(result.hasPackage).toBe(false);
    });

    it('should detect playwright.config.ts', async () => {
      const dir = path.join(tempDir, 'with-ts-config');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'playwright.config.ts'), 'export default {}');

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(true);
      expect(result.hasConfig).toBe(true);
    });

    it('should detect playwright.config.js', async () => {
      const dir = path.join(tempDir, 'with-js-config');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'playwright.config.js'), 'module.exports = {}');

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(true);
      expect(result.hasConfig).toBe(true);
    });

    it('should detect @playwright/test in dependencies', async () => {
      const dir = path.join(tempDir, 'with-dep');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        dependencies: { '@playwright/test': '^1.40.0' },
      }));

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(true);
      expect(result.hasPackage).toBe(true);
    });

    it('should detect @playwright/mcp in devDependencies', async () => {
      const dir = path.join(tempDir, 'with-mcp-dep');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        devDependencies: { '@playwright/mcp': '^0.1.0' },
      }));

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(true);
      expect(result.hasPackage).toBe(true);
    });

    it('should detect playwright in dependencies', async () => {
      const dir = path.join(tempDir, 'with-playwright-dep');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        dependencies: { 'playwright': '^1.40.0' },
      }));

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(true);
      expect(result.hasPackage).toBe(true);
    });

    it('should return not available for project without playwright deps', async () => {
      const dir = path.join(tempDir, 'no-playwright');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        dependencies: { 'express': '^4.0.0' },
      }));

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(false);
      expect(result.hasConfig).toBe(false);
      expect(result.hasPackage).toBe(false);
    });

    it('should handle both config and package present', async () => {
      const dir = path.join(tempDir, 'both');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'playwright.config.ts'), 'export default {}');
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
        devDependencies: { '@playwright/test': '^1.40.0' },
      }));

      const result = await detectPlaywright(dir);
      expect(result.available).toBe(true);
      expect(result.hasConfig).toBe(true);
      expect(result.hasPackage).toBe(true);
    });

    it('should handle malformed package.json gracefully', async () => {
      const dir = path.join(tempDir, 'bad-pkg');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'package.json'), '{ not valid json }');

      const result = await detectPlaywright(dir);
      expect(result.hasPackage).toBe(false);
    });
  });
});
