# Harness Spec

> **⚠️ UNDER ACTIVE DEVELOPMENT — NOT READY FOR PRODUCTION USE**
>
> **⚠️ NOT COMPATIBLE WITH OpenSpec projects.** Despite borrowing some concepts, harness-spec is an **independent** spec-driven workflow. It does not understand OpenSpec's delta spec format, uses a different directory layout (`changes/` not `openspec/changes/`), and `/harness:archive` does not merge deltas into baseline specs. Do not install both in the same project — see "Compatibility" below.

An independent Claude Code plugin for **harness engineering** — spec-driven development with independent evaluation and auto-fix loops.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/status-development-orange.svg)]()

## What is this?

> `AI Agent Output Quality = Model Capability + Harness Design`
>
> LangChain improved from rank 30+ to Top 5 by changing only their harness, not their model.

A Claude Code plugin that adds **harness engineering** to your development workflow:

- **Spec Review** — Interactive quality gate before coding (requires human, not headless)
- **Test-First** — Generates test skeletons from specs BEFORE implementation
- **Independent Evaluation** — Evaluator runs as a separate subagent with its own context, after the coding agent commits
- **Auto-Fix Loop** — Failed evaluations trigger automatic repair (max 3 attempts per task)
- **Exit Guard** — Stop hook prevents Claude from exiting until all tasks pass
- **Session Recovery** — Progress persisted to `feature_tests.json`, reloaded via SessionStart hook, preserved during context compaction via PreCompact hook
- **Graded Rubric** — 0-5 scoring instead of binary PASS/FAIL, with pluggable custom rubrics

## Requirements

- **Claude Code** (CLI, Desktop, Web, or IDE extension)
- **Node.js >= 20** (already required by Claude Code — no extra install)
- No bash, no Python, no build tools needed. All hooks are cross-platform Node.js scripts.

## Install

### Plugin Install (recommended)

```bash
# In Claude Code:
/plugin marketplace add yuchenhui/harness-spec@plugin
/plugin install harness@harness-spec
```

That's it. Hooks auto-load, agents auto-register. Works on **Windows, macOS, and Linux**.

### Manual Install (alternative)

```bash
git clone -b plugin https://github.com/yuchenhui/harness-spec.git /tmp/harness-spec

# Copy to your project
mkdir -p .claude/agents .claude/commands .claude/hooks
cp /tmp/harness-spec/agents/*.md .claude/agents/
cp /tmp/harness-spec/commands/*.md .claude/commands/
cp /tmp/harness-spec/hooks/*.js .claude/hooks/

# Merge hooks into your settings.json manually (see hooks/hooks.json)
```

### Local Plugin (development/testing)

```bash
git clone -b plugin https://github.com/yuchenhui/harness-spec.git ~/harness-spec
# In Claude Code:
/plugin install --path ~/harness-spec
```

## What You Get

```
9 commands (/harness:*):
  /harness:propose      — Create a change with all artifacts in one step
  /harness:explore      — Think through ideas without implementing
  /harness:new          — Create a change directory (step-by-step mode)
  /harness:continue     — Build the next artifact for a change
  /harness:review       — Interactive spec quality review (Phase 0)
  /harness:init-tests   — Generate tests from specs — TDD (Phase 1)
  /harness:apply        — Code → Evaluate → Fix loop (Phase 2)
  /harness:verify       — Verify implementation matches specs
  /harness:archive      — Archive a completed change
  /harness:commit       — Smart conventional commits with grouping

4 core agents (auto-registered):
  evaluator      — Independent verification (L1-L5), worktree-isolated, persistent memory
  fixer          — Auto-repair from evaluation reports (cannot modify test files)
  spec-reviewer  — Interactive spec quality review, persistent memory
  initializer    — TDD test generation from specs

6 hooks (auto-loaded):
  Stop           — Blocks exit until feature_tests.json all pass
  SessionStart   — Prints progress summary on new session
  PostToolUse    — Reminds to evaluate after git commit
  PreToolUse     — Blocks modification of test files (prompt-based)
  PreCompact     — Saves progress before context compaction
  PostCompact    — Restores context after compaction

16 specialist agents (optional, @-mention during development):
  backend-architect, frontend-architect, system-architect, devops-architect,
  python-expert, security-engineer, performance-engineer, quality-engineer,
  requirements-analyst, root-cause-analyst, refactoring-expert, technical-writer,
  ui-ux-designer, deep-research-agent, idempotent-db-script-generator, get-current-datetime
```

## Usage

### Quick Start (one-step mode)

```
/harness:propose "add-user-auth"    ← creates proposal + specs + design + tasks
/harness:review                     ← interactive spec quality check
/harness:apply add-user-auth        ← code → evaluate → fix loop
/harness:verify                     ← final verification
/harness:archive                    ← archive the change
```

### Step-by-Step Mode (more control)

```
/harness:explore "user authentication"    ← think through the approach
/harness:new add-user-auth               ← create change with proposal template
/harness:continue                        ← generate specs (can @backend-architect here)
/harness:continue                        ← generate design
/harness:continue                        ← generate tasks
/harness:review                          ← interactive spec review
/harness:apply add-user-auth             ← code → evaluate → fix loop
/harness:verify
/harness:archive
```

### Manual mode (skip the spec workflow)

If you already have a project with existing tests, you can skip propose/review/init-tests and go straight to the harness apply loop by creating `feature_tests.json` manually:

```json
{
  "change_id": "my-feature",
  "tasks": [{
    "id": "1",
    "description": "Add health check",
    "spec_scenarios": ["GET /health returns 200"],
    "verification_commands": ["pytest tests/test_health.py -v"],
    "verification_level": "L2",
    "passes": false,
    "evaluation_attempts": 0
  }]
}
```

Then: `/harness:apply my-feature`

## Compatibility

### With OpenSpec — ❌ NOT COMPATIBLE

harness-spec was originally inspired by OpenSpec but has diverged significantly:

| Aspect | OpenSpec | harness-spec |
|--------|----------|--------------|
| Directory | `openspec/changes/` | `changes/` |
| Specs | Multi-file `specs/<capability>/spec.md` | Single `specs.md` per change |
| Delta format | ADDED/MODIFIED/REMOVED/RENAMED blocks | No delta concept |
| Archive | Merges deltas into baseline specs | Just moves directory |
| Validation | `openspec validate` schema | None (relies on evaluator) |

**Do not install both in the same project.** If you have an OpenSpec project, harness-spec will create a parallel directory tree, ignore your delta specs, and break `openspec archive`.

**Recommendation**: use harness-spec on new projects OR on projects without OpenSpec. If you want harness's evaluation loop on an OpenSpec project, only use `/harness:apply`, `/harness:verify`, `/harness:commit` — avoid the spec-editing commands (`/harness:propose`, `/harness:new`, `/harness:continue`, `/harness:review`, `/harness:archive`).

### Interactive vs Headless

Phase 0 (Spec Review) uses `AskUserQuestion` for interactive confirmation — it is **not headless**. Long-running unattended harness use should skip Phase 0 by pre-creating `feature_tests.json` and running `/harness:apply` in continue mode.

## How It Works

```
/harness:apply
│
├── Phase 0: Spec Review
│   Spec Reviewer agent → JSON report → AskUserQuestion choices
│   User approves/rejects suggestions → writes back to specs
│
├── Phase 1: Test Initialization
│   Initializer agent → test skeletons, API contracts, browser scenarios
│   All tests FAIL initially (TDD red phase)
│
├── Phase 2: Code → Evaluate → Fix Loop
│   For each task (one at a time):
│   ├── Coding Agent implements (cannot modify tests)
│   ├── Evaluator subagent verifies (independent worktree)
│   ├── PASS → next task
│   └── FAIL → Fixer subagent → re-evaluate (max 3x)
│
├── Phase 3: Complete
│   Stop hook ensures all tasks pass before exit
│
└── Hooks (always active):
    PreCompact → saves progress before context compaction
    PostCompact → restores context after compaction
    SessionStart → prints status on new session
```

## Verification Levels

| Level | Tools | Use Case |
|-------|-------|----------|
| L1 | ruff, mypy, tsc | Static analysis |
| L2 | pytest, jest | Unit tests |
| L3 | pytest + curl/httpx | API integration |
| L4 | Playwright MCP | Browser E2E (black-box, evaluator has no code access) |
| L5 | Screenshots | Visual (human review, outputs NEEDS_HUMAN_REVIEW) |

## Advanced Features

| Feature | How | Benefit |
|---------|-----|---------|
| **Commit Isolation** | Orchestrator requires `git commit` before launching evaluator | Evaluator only sees committed state, not the coding agent's uncommitted changes. This is "commit isolation" — not full filesystem isolation. |
| **Role-specific models** | Evaluator/Reviewer/Initializer use **opus**; Fixer uses **sonnet** | Adversarial roles get the more thorough model; focused fixes use the faster one |
| **Graded rubric (0-5)** | Evaluator outputs SCORE, not PASS/FAIL | Score 3 triggers confirmation, 4-5 auto-advance |
| **Pluggable rubrics** | Drop `.md` files in `.claude/harness-rubrics/` | Add custom security/perf/a11y criteria per project |
| **Compaction Safety** | PreCompact hook saves progress to `claude-progress.txt` | Long sessions survive context compression |
| **Dormant-by-default** | All hooks check `.claude/harness-active` state file | Zero impact on normal Claude Code usage |

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/flow.md](docs/flow.md) | Complete workflow diagram with file timeline |
| [docs/verification-strategies.md](docs/verification-strategies.md) | L1-L5 verification, TDD, Playwright integration |
| [docs/agent-guide.md](docs/agent-guide.md) | Which agent to use in each phase |
| [docs/acceptance-criteria.md](docs/acceptance-criteria.md) | How to build sufficient review material from specs |
| [docs/best-practices.md](docs/best-practices.md) | Anthropic/OpenAI best practices applied |

## Acknowledgments

Core concepts inspired by:
- [Anthropic: Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps) — evaluation separation, three-agent harness
- [Anthropic: Effective Harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — feature_tests.json pattern
- [ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) — Stop hook pattern
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) — spec-driven workflow
- [TDAD Paper](https://arxiv.org/abs/2603.17973) — test-driven agentic development

## License

MIT
