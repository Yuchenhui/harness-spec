/**
 * Completion Factory Stub
 *
 * Minimal stub for the CompletionFactory class removed during extraction.
 */

import type { SupportedShell } from '../../utils/shell-detection.js';

interface CompletionGenerator {
  generate(registry: unknown): string;
}

interface CompletionInstaller {
  install(script: string): Promise<{
    success: boolean;
    message: string;
    installedPath?: string;
    backupPath?: string;
    zshrcConfigured?: boolean;
    bashrcConfigured?: boolean;
    profileConfigured?: boolean;
    warnings?: string[];
    instructions?: string[];
  }>;
  uninstall(): Promise<{ success: boolean; message: string }>;
}

export class CompletionFactory {
  static isSupported(_shell: string): _shell is SupportedShell {
    return false;
  }

  static getSupportedShells(): string[] {
    return [];
  }

  static createGenerator(_shell: SupportedShell): CompletionGenerator {
    return {
      generate() {
        return '';
      },
    };
  }

  static createInstaller(_shell: SupportedShell): CompletionInstaller {
    return {
      async install() {
        return { success: false, message: 'Completion support not available (stub)' };
      },
      async uninstall() {
        return { success: false, message: 'Completion support not available (stub)' };
      },
    };
  }
}
