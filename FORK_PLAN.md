# Fork Transformation Plan

Based on OpenSpec v1.2.0. Tracks what we kept, changed, and still need to do.

## Phase 1: Extract Core — DONE

Extracted ~15,900 lines from OpenSpec's ~21,847 into `src/`.

**Removed (adapters):**
- [x] 23 non-Claude adapters deleted from `src/core/command-generation/adapters/`
- [x] `AI_TOOLS` in `config.ts` reduced from 24 to 1 (Claude Code only)

**Removed (features) → replaced with no-op stubs:**
- [x] `src/telemetry/index.ts` — PostHog telemetry → no-op stub (still imported by cli/index.ts)
- [x] `src/ui/welcome-screen.ts` — ASCII art → no-op stub (still imported by init.ts)
- [x] `src/prompts/searchable-multi-select.ts` — custom prompt → no-op stub (still imported by init.ts, update.ts)
- [x] `src/core/completions/` — shell completions → no-op stubs (still imported by commands/completion.ts)
- [x] `src/core/converters/json-converter.ts` — JSON converter → no-op stub (still imported by commands/change.ts)

**Note:** These stubs cannot be deleted without refactoring the import sites in `cli/index.ts`, `init.ts`, `update.ts`, `commands/completion.ts`, `commands/change.ts`. Tracked as future cleanup.

## Phase 2: Rename — NOT NEEDED

- [x] Decision: keep `/opsx:` prefix and `openspec/` directory name
- [x] `package.json` name: `harness-spec`
- [x] `bin/` registers both `harness` and `openspec` aliases

## Phase 3: Schema — DONE

- [x] Created `schemas/harness-driven/schema.yaml` with review + init-tests artifacts
- [x] Created `schemas/spec-driven/` directory with proper structure
- [x] Default schema changed to `harness-driven` in init.ts
- [x] `design` made optional for `review` artifact (not all changes need design.md)

## Phase 4: Workflow Templates — DONE

- [x] `propose.ts` — kept from OpenSpec
- [x] `explore.ts` — kept from OpenSpec
- [x] `new-change.ts` — kept from OpenSpec
- [x] `continue-change.ts` — kept from OpenSpec
- [x] `review.ts` — NEW: interactive spec quality review (Phase 0)
- [x] `init-tests.ts` — NEW: test generation from specs (Phase 1)
- [x] `apply-change.ts` — REPLACED: harness code→evaluate→fix loop (Phase 2)
- [x] `verify-change.ts` — ENHANCED: L1-L5 verification + feature_tests.json
- [x] `archive-change.ts` — kept from OpenSpec
- [x] All workflow templates translated to English
- [x] `review` and `init-tests` registered in profiles, skill-generation, tool-detection

## Phase 5: Hooks — DONE

- [x] `hooks/stop-check.sh` — blocks exit until tasks pass (uses Node.js, lockfile guard)
- [x] `hooks/session-init.sh` — auto-loads progress at session start
- [x] `hooks/post-tool-notify.sh` — reminds to evaluate after git commit
- [x] `hooks/hooks.json` — hook event definitions for Claude Code settings
- [x] `src/core/hooks.ts` — hook installation logic (reads files at runtime)
- [x] `init.ts` installs agents + hooks during `openspec init --tools claude`

## Phase 6: Playwright MCP — PARTIAL

- [x] `src/core/playwright-config.ts` — config generation and detection
- [x] Evaluator agent supports L4 browser tools (Playwright MCP)
- [x] `schemas/harness-driven/templates/test-strategy.yaml` — headed/headless config
- [ ] `init` does not auto-detect Playwright or prompt for installation
- [ ] No Playwright test runner integration in verification_commands generation

## Remaining Work

### Should Fix (quality)
- [ ] Refactor stub imports to allow deleting telemetry/UI/prompts/completions stubs
- [ ] Add test coverage for harness modules (hooks, init agent/hook installation)
- [ ] CI workflow files need manual push (GitHub App lacks workflows permission)

### Nice to Have
- [ ] `init` auto-detects if project needs Playwright and prompts installation
- [ ] CLI exposes `harness review` and `harness init-tests` as direct commands
- [ ] Plugin marketplace validation (`/plugin validate .`)
