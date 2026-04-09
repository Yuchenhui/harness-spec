# Harness Spec

Spec-driven development with harness engineering verification. Built on OpenSpec.

## Core Principle

**Separate generation from evaluation.** The agent that writes code must NOT evaluate its own work. Independent subagents verify implementation against pre-generated tests.

## Workflow

```
/opsx:propose → /opsx:specs → /opsx:tasks → /opsx:review → /opsx:apply → /opsx:verify → /opsx:archive
```

`/opsx:apply` orchestrates: spec review → test generation → code → evaluate → fix loop.

## Key Rules

- Tests are generated BEFORE coding by the initializer agent — coding agent must NOT modify test files
- Evaluator runs in independent context — no access to coding agent's reasoning
- Stop hook blocks exit until all tasks in feature_tests.json pass
- One task at a time, git commit after each, progress tracked in feature_tests.json

## Tech Stack

- TypeScript / Node.js >= 20
- Build: `npx tsc`
- Test: `npx vitest run`

## Project Structure

- `src/` — TypeScript source (OpenSpec core + harness extensions)
- `agents/` — Agent definitions (4 core + specialist)
- `hooks/` — Claude Code hook scripts
- `schemas/` — Workflow schemas (harness-driven, spec-driven)
- `docs/` — Detailed documentation
- See `docs/agent-guide.md` for which agent to use in each phase
- See `docs/verification-strategies.md` for L1-L5 verification levels
