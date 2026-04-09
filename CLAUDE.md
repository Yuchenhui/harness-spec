# Harness Spec

Claude Code plugin for harness engineering — verified, recoverable, self-healing development.

## Core Principle

**Separate generation from evaluation.** The agent that writes code must NOT evaluate its own work. Independent subagents verify implementation against pre-generated tests.

## Development Rules

- All hook scripts MUST be Node.js (.js), NOT bash (.sh) — cross-platform requirement (Windows + macOS + Linux)
- `node` is the only runtime dependency — guaranteed by Claude Code on all platforms
- Agent files are pure Markdown with YAML frontmatter — no build step
- Hooks use `${CLAUDE_PLUGIN_ROOT}` for portable paths when installed as plugin

## Plugin Structure

```
agents/       — 4 core + 16 specialist agent definitions
commands/     — harness-apply orchestrator + git-commit
hooks/        — Node.js hook scripts + hooks.json
docs/         — Documentation
.claude-plugin/ — Plugin manifest
```

## Agent Roles

| Agent | Phase | Key Constraint |
|-------|-------|----------------|
| spec-reviewer | Phase 0 | Outputs JSON report only — does NOT modify files |
| initializer | Phase 1 | Generates tests BEFORE coding — coding agent cannot modify them |
| evaluator | Phase 2 | Independent context (worktree isolation) — cannot see coding agent's reasoning |
| fixer | Phase 2 | Edit restricted to src/app/lib/pkg/cmd — cannot touch tests/ |

## Hooks

All hooks are `.js` files run via `node`. Never use bash/shell scripts.

| Hook | Event | Purpose |
|------|-------|---------|
| stop-check.js | Stop | Blocks exit until feature_tests.json all pass |
| session-init.js | SessionStart | Prints progress summary |
| post-tool-notify.js | PostToolUse | Reminds to evaluate after git commit |
| compact-handler.js | PreCompact/PostCompact | Saves and restores progress during compaction |

## Key Files

- `feature_tests.json` — Task verification state (passes: true/false per task)
- `claude-progress.txt` — Human-readable progress for session recovery
- `hooks.json` — Hook registration with `${CLAUDE_PLUGIN_ROOT}` paths
