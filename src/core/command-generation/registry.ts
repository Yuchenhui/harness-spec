/**
 * Command Adapter Registry
 *
 * Simplified registry — only Claude Code adapter.
 * Other adapters removed (we focus on Claude Code only).
 * The adapter architecture is preserved for future additions.
 */

import type { ToolCommandAdapter } from './types.js';
import { claudeAdapter } from './adapters/claude.js';

/**
 * Registry for looking up tool command adapters.
 */
export class CommandAdapterRegistry {
  private static adapters: Map<string, ToolCommandAdapter> = new Map();

  // Static initializer - register built-in adapters
  static {
    // Only Claude Code adapter — others can be added back if needed
    CommandAdapterRegistry.register(claudeAdapter);
  }

  static register(adapter: ToolCommandAdapter): void {
    CommandAdapterRegistry.adapters.set(adapter.toolId, adapter);
  }

  static get(toolId: string): ToolCommandAdapter | undefined {
    return CommandAdapterRegistry.adapters.get(toolId);
  }

  static getAll(): ToolCommandAdapter[] {
    return Array.from(CommandAdapterRegistry.adapters.values());
  }

  static has(toolId: string): boolean {
    return CommandAdapterRegistry.adapters.has(toolId);
  }
}
