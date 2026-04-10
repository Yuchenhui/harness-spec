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

| Agent | Phase | Model | Key Constraint |
|-------|-------|-------|----------------|
| spec-reviewer | Phase 0 | opus | Outputs JSON report only — does NOT modify files |
| initializer | Phase 1 | opus | Generates tests BEFORE coding — coding agent should not modify them |
| evaluator | Phase 2 | **opus** | Adversarial, runs as independent subagent. Reads code only after coding agent commits. Outputs 0-5 score. |
| fixer | Phase 2 | sonnet | Reads raw test failures directly (not evaluator's interpretation). Edit restricted to src/app/lib/pkg/cmd via tools config. |

**Model assignment rationale**: Adversarial/review roles use Opus (more careful, catches more). Focused implementation roles use Sonnet (faster, cheaper). Inspired by specwright's pattern.

**Isolation note**: Evaluator independence is enforced by (1) running as a separate subagent with its own context, (2) the orchestrator requiring `git commit` before launching the evaluator, and (3) tool restrictions on the fixer. This is "commit isolation" — not true filesystem isolation. If the coding agent has uncommitted changes, the evaluator could still see them.

## Graded Scoring (0-5)

Tasks are evaluated on a 0-5 scale, not binary PASS/FAIL:

- **0** Broken — verification fails
- **1** Incomplete — spec not met
- **2** Happy path only — no edge cases
- **3** Acceptable — passes spec, thin (threshold to advance)
- **4** Solid — full coverage + edge cases
- **5** Exceeds — proactive hardening

Default threshold: score >= 3. Score 3 triggers user confirmation. Score 4-5 auto-advances.

## Pluggable Rubrics

Drop `.md` files into `.claude/harness-rubrics/` to add custom evaluation criteria.
The evaluator loads them at runtime and applies alongside the default scoring.
Example rubrics are in `rubrics/` — copy to your project's `.claude/harness-rubrics/` to activate.

## Hook Activation Pattern

Hooks are **dormant by default** — they do NOT interfere with normal Claude usage.
Activation is controlled by a state file: `.claude/harness-active`

- `/harness:apply` creates `.claude/harness-active` (contains path to feature_tests.json)
- All hooks check for this file first — if absent, `exit 0` immediately
- When all tasks pass, apply deletes the state file — hooks go dormant again
- This follows the same pattern as ralph-wiggum (which uses `.claude/ralph-loop.local.md`)

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
