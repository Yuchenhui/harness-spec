# Harness Spec

> **⚠️ UNDER ACTIVE DEVELOPMENT — NOT READY FOR PRODUCTION USE**

Verified, recoverable, self-healing AI-assisted development for Claude Code.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/status-development-orange.svg)]()

## What is this?

A Claude Code plugin that adds **harness engineering** to your development workflow:

- **Spec Review** — Interactive quality gate before coding (AskUserQuestion-driven)
- **Test-First** — Generates test skeletons from specs BEFORE implementation
- **Independent Evaluation** — Separate subagent verifies code in isolated worktree (never self-evaluating)
- **Auto-Fix Loop** — Failed evaluations trigger automatic repair (max 3 attempts)
- **Exit Guard** — Stop hook prevents Claude from exiting until all tasks pass
- **Session Recovery** — Progress auto-loaded on new sessions, preserved during context compaction
- **Persistent Memory** — Evaluator and reviewer learn project patterns over time

## Requirements

- **Claude Code** (CLI, Desktop, Web, or IDE extension)
- **Node.js >= 20** (already required by Claude Code — no extra install)
- No bash, no Python, no build tools needed. All hooks are cross-platform Node.js scripts.

## Install

### Plugin Install (recommended)

```bash
# In Claude Code:
/plugin marketplace add yuchenhui/harness-spec@plugin-only
/plugin install harness-spec@harness-spec
```

That's it. Hooks auto-load, agents auto-register. Works on **Windows, macOS, and Linux**.

### Manual Install (alternative)

```bash
git clone -b plugin-only https://github.com/yuchenhui/harness-spec.git /tmp/harness-spec

# Copy to your project
mkdir -p .claude/agents .claude/commands .claude/hooks
cp /tmp/harness-spec/agents/evaluator.md .claude/agents/
cp /tmp/harness-spec/agents/fixer.md .claude/agents/
cp /tmp/harness-spec/agents/spec-reviewer.md .claude/agents/
cp /tmp/harness-spec/agents/initializer.md .claude/agents/
cp /tmp/harness-spec/commands/harness-apply.md .claude/commands/
cp /tmp/harness-spec/hooks/*.js .claude/hooks/

# Merge hooks into your settings.json manually (see hooks/hooks.json)
```

### Local Plugin (development/testing)

```bash
git clone -b plugin-only https://github.com/yuchenhui/harness-spec.git ~/harness-spec
# In Claude Code:
/plugin install --path ~/harness-spec
```

## What You Get

```
4 core agents:
  evaluator      — Independent verification (L1-L5), worktree-isolated, persistent memory
  fixer          — Auto-repair from evaluation reports (cannot modify test files)
  spec-reviewer  — Interactive spec quality review, persistent memory
  initializer    — TDD test generation from specs

2 commands:
  harness-apply  — Full workflow: review → test → code → evaluate → fix
  git-commit     — Smart conventional commits with grouping

6 hooks (auto-loaded via plugin):
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

### With OpenSpec (recommended)

```bash
npm install -g @fission-ai/openspec
openspec init --tools claude

# Then use the harness workflow:
/opsx:propose "add-user-auth"
/opsx:specs
/opsx:tasks
/harness-spec:harness-apply add-user-auth   # ← harness takes over
/opsx:verify
/opsx:archive
```

### Standalone (without OpenSpec)

Create `feature_tests.json` manually:

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

Then: `/harness-spec:harness-apply my-feature`

## How It Works

```
/harness-spec:harness-apply
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
| **Worktree Isolation** | `isolation: worktree` on evaluator | Evaluator physically cannot see uncommitted coding changes |
| **Persistent Memory** | `memory: project` on evaluator + reviewer | Learns failure patterns and project conventions over time |
| **Effort Levels** | `effort: high` on evaluator/reviewer/initializer | Thorough verification; fixer uses `effort: medium` for focused fixes |
| **Compaction Safety** | PreCompact/PostCompact hooks | Long sessions don't lose progress when context is compressed |
| **Prompt-Based Protection** | `type: prompt` PreToolUse hook | LLM judges file modifications, catches non-standard test paths |

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
