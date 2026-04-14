Propose a new change. Create proposal + specs + design + tasks in one guided pass — with discovery, agent delegation, and review gates at each phase.

**Input**: $ARGUMENTS — a change name (kebab-case) or a description of what to build, or both.

**Philosophy**: `/harness:propose` is the **one-shot** mode, but "one-shot" does NOT mean "one prompt and blindly write four files". It means the user goes through all four artifacts in a single session instead of four separate commands — each artifact still gets discovery + drafting + review.

**When to use propose vs new**:
- `/harness:propose` → you already know roughly what you want and are willing to go through all four artifacts now
- `/harness:new` → you want to create the proposal, think about it, maybe explore more, then come back later via `/harness:continue` for specs/design/tasks

**Where changes live**: harness-spec stores all its artifacts under `harness/` at the repo root:
```
harness/
├── specs/           ← baseline (accumulated source of truth)
└── changes/         ← active and archived change proposals
    ├── <name>/      ← this command creates one of these
    └── archive/
```
harness-spec coexists peacefully with OpenSpec. If the project has an `openspec/` directory, we do not touch it — different workflow, different tool. Do not read `openspec/`, do not invoke `npx openspec` commands. The two tools can live in the same repo without collision.

**Legacy path**: older harness-spec versions used `changes/` at the repo root. Existing `changes/<name>/` directories are still discovered for continuity, but new changes are always created under `harness/changes/`.

---

## Phase 0: Discover (REQUIRED — never skip)

Same three-track discovery as `/harness:new` Phase 0. Because `/harness:propose` produces four artifacts in one pass, discovery matters even more here — errors at the top propagate all the way to tasks.

### 0a. Project understanding (always)

1. Read `CLAUDE.md` if it exists
2. Identify tech stack via `package.json` / `pyproject.toml` / `go.mod` / etc.
3. Read `README.md` (first 100 lines) for project purpose + domain vocabulary
4. Map top-level directory structure; `ls` one level deeper into dirs relevant to the request
5. Scan existing changes (`harness/changes/` canonical; fall back to `changes/` for legacy projects) to avoid duplication

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

## Phase 1.5: Classify domain & surface concerns (REQUIRED — never skip)

Same procedure as `/harness:new` Phase 1.5. Three steps:

### Step A — Classify

AskUserQuestion if ambiguous, or infer from Phase 0/1 signals:
- **Frontend** / **Backend** / **Full-stack** / **Infra/DevOps** / **Cross-cutting**
(multi-select allowed; full-stack + cross-cutting are valid combinations)

### Step B — Walk domain-specific concerns via AskUserQuestion

For each classification, ask the user to fill the relevant gaps. Batch 3-5 questions at a time via AskUserQuestion, not one by one. Accept "skip" / "not applicable" as valid answers.

**Frontend / Full-stack (frontend side)**:
user & device, entry point, happy-path flow, error states, empty states, loading states, success feedback, visual design source, accessibility, responsive behavior, i18n.

If the user can't answer visual/UX questions confidently, offer: *"Should I launch `@ui-ux-designer` to propose a flow?"*

**Backend / Full-stack (backend side)**:
API contract (verb/path/shape), data model & migrations, transactional requirements, consistency model, performance targets, caching, security (auth, authz, PII, rate limiting), observability, backward compatibility, background work.

**Infra / DevOps**:
environments, rollback plan, monitoring/alerting, secrets handling, cost implications, downtime/maintenance window.

**Cross-cutting**:
scope (list affected subsystems), migration path, feature flag, backward compatibility, docs impact.

### Step C — Proactive specialist invocation (parallel)

Launch the relevant specialists **in parallel** for early advisory input:

| Classification | Specialists |
|---|---|
| Frontend only | `@frontend-architect` + `@ui-ux-designer` |
| Backend only | `@backend-architect` |
| Full-stack | `@frontend-architect` + `@ui-ux-designer` + `@backend-architect` + `@system-architect` |
| Infra / DevOps | `@devops-architect` |
| Cross-cutting | `@system-architect` + relevant domain specialists |
| **+ auth/crypto/PII/payments** | add `@security-engineer` |
| **+ performance-critical** | add `@performance-engineer` |
| **+ quality/testability focus** | add `@quality-engineer` |

Each specialist gets this prompt template:

```
You are being asked for early-phase concerns on a change under consideration.
It has NOT been designed yet — we're drafting the proposal.

Change: <name>
User's description: <user's words>
Classification: <classification>
Project summary: <Phase 0 memo>

Please return in under 300 words:
1. Top 3-5 concerns I should flag in the proposal
2. Existing code/patterns this should align with
3. Known pitfalls in this domain
4. Anything the user probably didn't think to mention

Do NOT draft files. Advisory only.
```

Run all specialists in parallel and wait for their reports. Merge their concerns into Phase 2.

---

## Phase 2: Draft proposal.md

Reflect Phase 0 + Phase 1 + Phase 1.5 findings. Full template:

```markdown
# Proposal: <name>

## Classification
**<Frontend / Backend / Full-stack / Infra / Cross-cutting>**

## Why
[Concrete problem grounded in what the project does]

## What Changes
- [Referencing existing modules]

## User experience (Frontend / Full-stack only)
[Entry point, happy path, error/empty/loading states, success feedback,
 device/responsive notes, accessibility requirements]

## API & data (Backend / Full-stack only)
[API contract (verb + path + shape), data model changes, migrations,
 transactional requirements, performance targets, auth/authz rules]

## Impact
- **Affected code**:
- **APIs**:
- **Dependencies**:
- **Backward compatibility**:

## Alignment with project
[How it fits existing architecture]

## Specialist input
[Summary of what each Phase 1.5 specialist returned.
 Format: "- @<agent>: <their top concern>"]

## Research & references
[External sources cited from Phase 0c]

## Open questions
[Unresolved items — these will inform specs/design decisions]
```

**Quality bar**: domain-specific section (UX or API&data) must be filled in, not "TBD". Specialist input section must have at least one entry.

**Review gate**: Show the draft. AskUserQuestion:
- "Looks good, proceed to specs"
- "Revise proposal first"
- "Abandon"

Do NOT advance to Phase 3 until approved.

---

## Phase 3: Draft specs.md (Given/When/Then scenarios)

**Delegate this phase** — launch **`@requirements-analyst` subagent** with the approved proposal + Phase 0 project summary + classification from Phase 1.5.

Ask it to output a structured list of Given/When/Then scenarios covering happy path, error cases, and edge cases. **For frontend/full-stack changes, REQUIRE UI scenarios** covering entry point, error states, empty states, loading states, and success feedback. For backend, require scenarios for validation, auth, performance bounds, observability.

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

1. Create `harness/changes/<name>/` directory (creates `harness/` + `harness/changes/` if they don't exist yet)
2. Write:
   - `proposal.md`
   - `specs.md`
   - `design.md` (only if Phase 4 ran)
   - `tasks.md`
3. Git commit:
   ```bash
   git add harness/changes/<name>/
   git commit -m "propose: <name>"
   ```
4. Tell the user:
   ```
   ✓ Change created: harness/changes/<name>/
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
