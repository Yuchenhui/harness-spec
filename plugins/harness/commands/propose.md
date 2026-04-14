Propose a new change. Create proposal + specs + design + tasks in one guided pass — with discovery, agent delegation, and review gates at each phase.

**Input**: $ARGUMENTS — a change name (kebab-case) or a description of what to build, or both.

**Philosophy**: `/harness:propose` is the **one-shot** mode, but "one-shot" does NOT mean "one prompt and blindly write four files". It means the user goes through all four artifacts in a single session instead of four separate commands — each artifact still gets discovery + drafting + review.

**When to use propose vs new**:
- `/harness:propose` → you already know roughly what you want and are willing to go through all four artifacts now
- `/harness:new` → you want to create the proposal, think about it, maybe explore more, then come back later via `/harness:continue` for specs/design/tasks

**IMPORTANT — harness-spec is NOT OpenSpec.** If the project has an `openspec/` directory, ignore it completely. Do not read `openspec/changes/`, do not run `npx openspec` commands, do not validate against OpenSpec schemas. Harness changes live only in `changes/` at the repo root. If the user is on an OpenSpec project and wants harness workflow, they should create a new harness change under `changes/` — the two workflows do not interoperate.

---

## Phase 0: Discover (REQUIRED — never skip)

Same three-track discovery as `/harness:new` Phase 0. Because `/harness:propose` produces four artifacts in one pass, discovery matters even more here — errors at the top propagate all the way to tasks.

### 0a. Project understanding (always)

1. Read `CLAUDE.md` if it exists
2. Identify tech stack via `package.json` / `pyproject.toml` / `go.mod` / etc.
3. Read `README.md` (first 100 lines) for project purpose + domain vocabulary
4. Map top-level directory structure; `ls` one level deeper into dirs relevant to the request
5. Scan existing `changes/` to avoid duplication

### 0b. Deep codebase search (when request touches existing code)

- **Targeted `Grep`** for keywords from the request
- **Launch the `Explore` subagent** with a narrow prompt: *"Map the parts of this codebase relevant to '<request>'. Find existing patterns, related modules, affected code. Read, don't write. Report in under 400 words."*
- For cross-cutting changes, launch `@deep-research-agent` to surface architectural context with citations

### 0c. External research (when domain expertise matters)

For any domain with established best practices (auth, payments, websockets, caching, migrations, i18n, accessibility, etc.), **actively look up authoritative sources** instead of guessing:

- **`WebSearch`** for "<domain> best practices <year>" and specific technical queries
- **`WebFetch`** for authoritative pages (official docs, RFCs, well-known engineering blogs)
- **MCP tools when available**:
  - **`context7`** — up-to-date library/framework docs on demand
  - **`exa`** — semantic search for deeper technical content
  - Other doc/search MCPs (check `/mcp`)
- **`@deep-research-agent`** — for comparing approaches, trade-off analysis, and evidence-cited reports

Skip 0c only when the request is purely project-internal with no external best practices to consult.

### 0d. Synthesize

Write yourself a memo answering: What does the project do? What existing code is relevant? What external context matters? Where does this change fit? What are the obvious risks? Every question needs a substantive answer before advancing.

---

## Phase 1: Understand the requirement

Parse `$ARGUMENTS` and pick the right path (same logic as `/harness:new` Phase 1):

### Case A — only a kebab-case name

Use AskUserQuestion to get a description. Don't proceed until you have one.

### Case B — short/vague description

Use AskUserQuestion to drill down on ambiguous parts. If still complex, **launch `@requirements-analyst` subagent** for structured discovery. Wait for its output.

### Case C — clear, specific description

Proceed. But sanity-check against Phase 0 — does it conflict with the existing project? Flag in drafts if so.

---

## Phase 2: Draft proposal.md

Same structure as `/harness:new` Phase 2:

```markdown
# Proposal: <name>

## Why
[Concrete problem grounded in what the project does]

## What Changes
- [Referencing existing modules]

## Impact
- **Affected code**:
- **APIs**:
- **Dependencies**:

## Alignment with project
[How it fits existing architecture]

## Open questions
[Unresolved items — these will inform specs/design decisions]
```

**Review gate**: Show the draft. AskUserQuestion:
- "Looks good, proceed to specs"
- "Revise proposal first"
- "Abandon"

Do NOT advance to Phase 3 until approved.

---

## Phase 3: Draft specs.md (Given/When/Then scenarios)

**Delegate this phase** unless the requirement is trivial:
- Launch **`@requirements-analyst` subagent** with the approved proposal + Phase 0 project summary
- Ask it to output a structured list of Given/When/Then scenarios covering happy path, error cases, and edge cases

Format each requirement as:
```markdown
### Requirement: <capability-name>

The system SHALL <normative statement>.

#### Scenario: <scenario-name>
- **Given** <concrete precondition with actual values>
- **When** <specific action>
- **Then** <verifiable outcome with concrete values>
```

**Specificity rule**: Instead of "Given valid data", write "Given email 'test@example.com' and password 'Pass123!'". Instead of "Then succeed", write "Then response status is 201 and body contains 'user_id'". This is what makes test generation work in Phase 1 of `/harness:apply`.

Every requirement must have at least one scenario. Error cases and edge cases are not optional — if the design says "passwords use bcrypt", there MUST be a scenario proving it.

**Review gate**: Show the specs draft. AskUserQuestion:
- "Looks good, proceed to design"
- "Revise specs first"
- "Skip design, go straight to tasks"
- "Abandon"

---

## Phase 4: Draft design.md (optional — skip for simple changes)

Simple changes (small CRUD, single function, config tweak) may not need a separate design doc — the proposal covers it.

**If design is needed**, delegate based on domain:
- Backend / API / DB → launch **`@backend-architect`** subagent
- Frontend / UI / UX → launch **`@frontend-architect`** subagent
- Cross-cutting / infra / architecture decisions → launch **`@system-architect`** subagent
- Security-sensitive → additionally launch **`@security-engineer`** for review

Design doc sections:
```markdown
# Design: <name>

## Context
[Why this approach — what constraints shape it]

## Goals / Non-Goals
- Goals: [...]
- Non-goals: [...]

## Decisions
- **Decision 1**: <what> — rationale: <why>
- **Decision 2**: ...

## Risks & Trade-offs
[Honest about what could go wrong or what we're giving up]

## Open questions
[Things still unresolved]
```

**Review gate**: Show the design draft. AskUserQuestion:
- "Looks good, proceed to tasks"
- "Revise design first"
- "Abandon"

---

## Phase 5: Draft tasks.md (numbered, checkbox-style)

Generate tasks from the approved specs + design. Each task should be:
- **Small enough for one session** (rough rule: <200 lines of diff, <1 hour of work)
- **Independently verifiable** (corresponds to at least one spec scenario)
- **Ordered by dependency** (earlier tasks unblock later ones)

Format:
```markdown
# Tasks: <name>

## 1. Setup
- [ ] 1.1 Create module structure
- [ ] 1.2 Add dependencies to package.json

## 2. Core
- [ ] 2.1 Implement <feature X> — covers Scenario: happy path
- [ ] 2.2 Handle <error case Y> — covers Scenario: duplicate email

## 3. Tests & Integration
- [ ] 3.1 Wire <feature> into existing <module>
```

Each task's description should point to the spec scenarios it implements — this is what the initializer in Phase 1 of `/harness:apply` uses to generate tests.

**Review gate**: Show the tasks draft. AskUserQuestion:
- "Looks good, create all files"
- "Revise tasks first"
- "Abandon"

---

## Phase 6: Write and commit

Only reach this phase after all previous review gates passed.

1. Create `changes/<name>/` directory
2. Write:
   - `proposal.md`
   - `specs.md`
   - `design.md` (only if Phase 4 ran)
   - `tasks.md`
3. Git commit:
   ```bash
   git add changes/<name>/
   git commit -m "propose: <name>"
   ```
4. Tell the user:
   ```
   ✓ Change created: changes/<name>/
     - proposal.md
     - specs.md ({N} requirements, {M} scenarios)
     - design.md  (if present)
     - tasks.md ({K} tasks)

   Next steps:
     /harness:review to run the spec quality gate (strongly recommended)
     /harness:apply <name> to start the code → evaluate → fix loop
   ```

---

## Rules

- **Never skip Phase 0.** No project understanding = wrong proposals.
- **Review gates are non-negotiable.** After each artifact is drafted, pause and confirm with the user.
- **Delegate to specialist agents** — requirements-analyst for specs, backend/frontend/system-architect for design. Don't try to do everything yourself from the orchestrator.
- **If `$ARGUMENTS` is empty**, start Phase 1 by asking "What do you want to build?"
- **If the user abandons at any phase**, stop cleanly — don't write partial files.
- **If a change with the same name exists**, ask how to proceed (different name, extend existing, abort).
- **For trivial changes** (one-liner fixes, config tweaks), the user should use `/harness:commit` directly, not this command.
