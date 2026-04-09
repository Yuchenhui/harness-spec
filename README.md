# Harness Spec

> **⚠️ UNDER ACTIVE DEVELOPMENT — NOT READY FOR PRODUCTION USE**

Verified, recoverable, self-healing AI-assisted development for Claude Code.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: Development](https://img.shields.io/badge/status-development-orange.svg)]()

## What is this?

A Claude Code plugin that adds **harness engineering** to your development workflow:

- **Spec Review** — Interactive quality gate before coding (AskUserQuestion-driven)
- **Test-First** — Generates test skeletons from specs BEFORE implementation
- **Independent Evaluation** — Separate subagent verifies code (never self-evaluating)
- **Auto-Fix Loop** — Failed evaluations trigger automatic repair (max 3 attempts)
- **Exit Guard** — Stop hook prevents Claude from exiting until all tasks pass
- **Session Recovery** — Progress auto-loaded on new sessions

## Install

```bash
/plugin marketplace add yuchenhui/harness-spec
/plugin install harness-spec@harness-spec
```

That's it. No npm, no CLI, no build step.

## What You Get

```
4 agents:
  /harness-spec:evaluator     — Independent code verification (L1-L5)
  /harness-spec:fixer         — Minimal auto-repair from evaluation reports
  /harness-spec:spec-reviewer — Review specs for verifiability
  /harness-spec:initializer   — Generate tests from specs (TDD)

2 commands:
  /harness-spec:harness-apply — Full workflow: review → test → code → evaluate → fix
  /harness-spec:git-commit    — Smart conventional commits with grouping

4 hooks (auto-loaded):
  Stop         — Blocks exit until feature_tests.json all pass
  SessionStart — Prints progress summary on new session
  PostToolUse  — Reminds to evaluate after git commit
  PreToolUse   — Blocks modification of test files
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

Create `changes/my-feature/feature_tests.json` manually:

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

Then run: `/harness-spec:harness-apply my-feature`

## How It Works

```
/harness-spec:harness-apply
│
├── Phase 0: Spec Review
│   Spec Reviewer agent → JSON report → AskUserQuestion choices
│   User approves/rejects suggestions → writes back to specs
│
├── Phase 1: Test Initialization
│   Initializer agent → test skeletons, API contracts
│   All tests FAIL initially (TDD red phase)
│
├── Phase 2: Code → Evaluate → Fix Loop
│   For each task:
│   ├── Coding Agent implements (cannot modify tests)
│   ├── Evaluator subagent verifies (independent context)
│   ├── PASS → next task
│   └── FAIL → Fixer subagent → re-evaluate (max 3x)
│
└── Phase 3: Complete
    Stop hook ensures all tasks pass before exit
```

## Verification Levels

| Level | Tools | Use Case |
|-------|-------|----------|
| L1 | ruff, mypy, tsc | Static checks |
| L2 | pytest, jest | Unit tests |
| L3 | pytest + curl | API integration |
| L4 | Playwright MCP | Browser E2E (black-box) |
| L5 | Screenshots | Visual (human review) |

## Specialist Agents (optional)

16 specialist agents for @-mention during development:

`backend-architect`, `frontend-architect`, `system-architect`, `devops-architect`,
`python-expert`, `security-engineer`, `performance-engineer`, `quality-engineer`,
`requirements-analyst`, `root-cause-analyst`, `refactoring-expert`, `technical-writer`,
`ui-ux-designer`, `deep-research-agent`, `idempotent-db-script-generator`, `get-current-datetime`

## Acknowledgments

Core harness concepts inspired by:
- [Anthropic: Harness Design](https://www.anthropic.com/engineering/harness-design-long-running-apps) — evaluation separation
- [ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum) — stop hook pattern
- [OpenSpec](https://github.com/Fission-AI/OpenSpec) — spec-driven workflow

## License

MIT
