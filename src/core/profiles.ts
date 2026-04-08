/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */

import type { Profile } from './global-config.js';

/**
 * Core workflows included in the 'core' profile.
 * These provide the streamlined experience for new users.
 */
export const CORE_WORKFLOWS = [
  'propose',     // 一步到位创建所有 artifacts
  'explore',     // 自由探索
  'new',         // 分步：先建 change
  'continue',    // 分步：逐个生成 artifact（可以 @agent 介入）
  'review',      // Harness: 交互式 spec 审查
  'init-tests',  // Harness: 从 specs 生成测试骨架
  'apply',       // Harness: code → evaluate → fix 循环
  'verify',      // Harness: L1-L5 分层验证
  'archive',     // 归档
] as const;

/**
 * All available workflows in the system.
 */
export const ALL_WORKFLOWS = [
  'propose',
  'explore',
  'review',
  'new',
  'continue',
  'apply',
  'init-tests',
  'ff',
  'sync',
  'archive',
  'bulk-archive',
  'verify',
  'onboard',
] as const;

export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];

/**
 * Resolves which workflows should be active for a given profile configuration.
 *
 * - 'core' profile always returns CORE_WORKFLOWS
 * - 'custom' profile returns the provided customWorkflows, or empty array if not provided
 */
export function getProfileWorkflows(
  profile: Profile,
  customWorkflows?: string[]
): readonly string[] {
  if (profile === 'custom') {
    return customWorkflows ?? [];
  }
  return CORE_WORKFLOWS;
}
