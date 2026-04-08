/**
 * Playwright MCP Integration
 *
 * Generates .mcp.json configuration for Playwright browser testing.
 * Used by L4 (E2E) and L5 (Visual) verification levels.
 *
 * Two modes:
 * - Snapshot mode (default): accessibility tree, fewer tokens
 * - Vision mode: screenshots with coordinates, for canvas/SVG
 */

export interface PlaywrightMcpConfig {
  mcpServers: {
    playwright: {
      command: string;
      args: string[];
    };
  };
}

/**
 * Generate Playwright MCP config for the project.
 * @param headless - Run in headless mode (default: true)
 * @param vision - Use vision mode instead of snapshot mode (default: false)
 */
export function generatePlaywrightConfig(
  headless = true,
  vision = false,
): PlaywrightMcpConfig {
  const args = ['@playwright/mcp@latest'];

  if (headless) {
    args.push('--headless');
  }
  if (vision) {
    args.push('--caps=vision');
  }

  return {
    mcpServers: {
      playwright: {
        command: 'npx',
        args,
      },
    },
  };
}

/**
 * Check if Playwright is available in the project.
 */
export async function detectPlaywright(projectRoot: string): Promise<{
  available: boolean;
  hasConfig: boolean;
  hasPackage: boolean;
}> {
  const { existsSync } = await import('node:fs');
  const { join } = await import('node:path');

  const hasConfig =
    existsSync(join(projectRoot, 'playwright.config.ts')) ||
    existsSync(join(projectRoot, 'playwright.config.js'));

  let hasPackage = false;
  try {
    const { readFile } = await import('node:fs/promises');
    const pkgPath = join(projectRoot, 'package.json');
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
      const allDeps = {
        ...pkg.dependencies,
        ...pkg.devDependencies,
      };
      hasPackage =
        '@playwright/test' in allDeps ||
        '@playwright/mcp' in allDeps ||
        'playwright' in allDeps;
    }
  } catch {
    // ignore
  }

  return {
    available: hasConfig || hasPackage,
    hasConfig,
    hasPackage,
  };
}

/**
 * Installation instructions for Playwright MCP.
 */
export const PLAYWRIGHT_INSTALL_INSTRUCTIONS = `
To enable L4 (E2E browser) and L5 (Visual) verification:

Option A: Install Playwright MCP globally for Claude Code
  claude mcp add playwright -- npx @playwright/mcp@latest --headless

Option B: Add to project .mcp.json
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest", "--headless"]
      }
    }
  }

Option C: Install Playwright test runner (for native test files)
  npm install -D @playwright/test
  npx playwright install chromium
`;
