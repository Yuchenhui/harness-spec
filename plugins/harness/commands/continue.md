Continue building artifacts for an existing change, one step at a time. Each artifact is delegated to the right specialist agent — the orchestrator only coordinates, it does not draft alone.

**Input**: $ARGUMENTS — change name (optional, auto-detect if only one active change exists).

**Philosophy**: `/harness:continue` is the step-by-step alternative to `/harness:propose`. It generates ONE missing artifact per invocation, so users can review each piece, think, and optionally revise before moving on. Discovery and delegation still apply — the orchestrator never dumps a template.

**IMPORTANT — harness-spec is NOT OpenSpec.** If the project has an `openspec/` directory, ignore it completely. Do not read `openspec/changes/`, do not run `npx openspec` commands, do not validate against OpenSpec schemas. Harness changes live only in `changes/` at the repo root.

---

## Step 1: Locate the change

1. If `$ARGUMENTS` was given, look for `changes/$ARGUMENTS/` at repo root. If not found, stop and tell the user. **Do not search in `openspec/changes/`** — even if a directory with the same name exists there, it belongs to a different workflow.
2. If `$ARGUMENTS` is empty, scan `changes/` (repo root only, not `openspec/changes/`) for directories. If exactly one exists and isn't archived, use that one. If multiple, use **AskUserQuestion** to pick.
3. Read all existing artifacts in the change directory (`proposal.md`, `specs.md`, `design.md`, `tasks.md` — whichever are present). You'll need them as context for the next artifact.

---

## Step 2: Determine the next missing artifact

Order: `proposal → specs → design (optional) → tasks`

Find the first one missing. That's the target.

- If **proposal.md is missing**: something's wrong — `/harness:continue` is for extending existing changes. Tell the user to run `/harness:new` or `/harness:propose` first.
- If **tasks.md exists**: everything is done. Tell the user to run `/harness:review` (if they haven't) or `/harness:apply` to start implementation.
- Otherwise: **proceed to Step 3 with the target artifact**.

---

## Step 3: Discovery before generation

Even in continue mode, never skip discovery. But the scope depends on what you already have:

- **If proposal.md exists**: you already have most of the context. Skim it, note the scope, note the **Classification** section (Frontend / Backend / Full-stack / Infra / Cross-cutting).
- **If Phase 0-style research was already done** (look for "Research & references" section): trust it, but still read relevant code via `Glob` + `Grep` for the specific artifact you're about to generate.
- **If research is thin**: launch a narrow **Explore subagent** or `@deep-research-agent` to fill the gap BEFORE generating. Don't draft without grounding.

**If the proposal has NO Classification section** (older proposal created before Phase 1.5 existed): infer the classification from the content. If ambiguous, use **AskUserQuestion** to confirm with the user before proceeding. Write the classification into the proposal before advancing — specs and design need it.

**The classification drives everything downstream**:
- Frontend/Full-stack → specs MUST cover UI scenarios (error/empty/loading/success states, accessibility, responsive)
- Backend/Full-stack → specs MUST cover API contracts, error responses, auth/authz, performance bounds
- Design phase will pull in different specialists based on classification

---

## Step 4: Generate the target artifact via the right specialist

### Target = specs.md

Delegate to **`@requirements-analyst`** with this prompt:

---
Read `changes/<name>/proposal.md` for scope and context. Generate a complete `specs.md` in Given/When/Then format.

Classification (from proposal): <classification>

Required:
- Each requirement as `### Requirement: <name>` with at least one `#### Scenario`
- WHEN/THEN with concrete values (not "valid data" — actual values like 'test@example.com')
- SHALL/MUST for normative language
- Include happy path + error cases + edge cases
- Every design decision from proposal must have a corresponding verifiable scenario
- If the proposal references best practices or external standards, make those scenarios too

**Domain-specific coverage requirements based on classification**:

If **Frontend** or **Full-stack**: every user-facing feature MUST have scenarios covering:
  - Entry point / initial state
  - Happy path interaction
  - Error state (validation errors, network failures)
  - Empty state (no data yet, filter returns nothing)
  - Loading state (with latency threshold if relevant)
  - Success feedback (toast, redirect, inline confirmation)
  - Keyboard navigation (where relevant)
  - Responsive behavior (if mobile matters)
  - Missing any of these is a spec quality issue.

If **Backend** or **Full-stack**: every API endpoint MUST have scenarios covering:
  - Happy path (valid input, expected output)
  - Input validation errors (4xx responses)
  - Auth / authz failures (401 / 403)
  - Rate limiting or throttling (if applicable)
  - Performance bounds (if specified in proposal)
  - Observability (log entries, metrics emitted)
  - Backward compat (if proposal flags breaking changes)
  - Missing any of these for a non-trivial endpoint is a spec quality issue.

If **Infra / DevOps**: scenarios MUST cover:
  - Rollback procedure works as documented
  - Monitoring/alert fires on the documented conditions
  - Secrets are not leaked in logs/errors

Output the full specs.md content. Do not write the file yourself — the orchestrator will handle that.
---

When the analyst returns, review the draft yourself for obvious gaps against the classification checklist, then proceed to Step 5.

### Target = design.md

Pick specialists based on the **Classification** field in proposal.md (set in Phase 1.5 of new/propose). Launch relevant specialists **in parallel** — multiple specialists can contribute to one design:

| Classification | Specialists to launch in parallel |
|---|---|
| Frontend only | `@frontend-architect` + `@ui-ux-designer` |
| Backend only | `@backend-architect` |
| Full-stack | `@frontend-architect` + `@ui-ux-designer` + `@backend-architect` + `@system-architect` |
| Infra / DevOps | `@devops-architect` |
| Cross-cutting | `@system-architect` + relevant domain specialists |
| **Overlay** | |
| + auth / crypto / PII / payments / permissions | add `@security-engineer` |
| + performance-critical (caching, throughput, latency, queries, concurrency) | add `@performance-engineer` |
| + heavy testing / CI concerns | add `@quality-engineer` |

Delegate with this prompt:

---
Read `changes/<name>/proposal.md` and `changes/<name>/specs.md` for context. Generate a complete `design.md`.

Required sections:
- Context (why this approach given constraints)
- Goals / Non-goals
- Decisions (with rationale for each — name the alternative and why it was rejected)
- Risks & Trade-offs (honest about what could go wrong)
- Open questions (anything unresolved)

Reference specific files/modules from the existing codebase when relevant. Do not write the file — the orchestrator will.
---

When the architect returns, if you launched a second agent (security-engineer, performance-engineer), send them the draft for a review pass and merge feedback before Step 5.

### Target = tasks.md

The orchestrator drafts tasks itself (no specialist needed) — but it must ground every task in the approved specs + design.

Read `proposal.md` + `specs.md` + `design.md` (if present), then draft tasks following these rules:
- **Each task maps to at least one spec scenario** (list them in the task description)
- **Each task is small**: <200 lines of diff, <1 hour of work. If bigger, split.
- **Order by dependency**: setup → core → integration → polish
- **Checkbox format**: `- [ ] 1.1 Task description`
- **Number groups**: `## 1. Setup`, `## 2. Core`, etc.

---

## Step 5: Review gate (REQUIRED — never skip)

Show the full draft to the user. Then **AskUserQuestion**:

```
Question: "<target artifact> draft ready. What next?"
Options:
  - "Looks good, save it"
  - "Revise — I'll tell you what to change"
  - "Abandon this artifact (don't save)"
```

- **"Looks good"** → proceed to Step 6
- **"Revise"** → take the feedback, either re-prompt the specialist with the feedback or revise directly. Re-show and loop Step 5.
- **"Abandon"** → stop. Don't write the file.

---

## Step 6: Write and commit

1. Write the approved draft to `changes/<name>/<target>.md`
2. Git commit:
   ```bash
   git add changes/<name>/<target>.md
   git commit -m "<target>: <name>"
   ```
   (e.g., `"specs: add-user-auth"`, `"design: add-user-auth"`, `"tasks: add-user-auth"`)

3. Tell the user what was created and what's next:

   ```
   ✓ Created: changes/<name>/<target>.md
     {summary — e.g., "5 requirements, 18 scenarios"}

   Next:
     /harness:continue  (generates the next missing artifact)
     /harness:review    (strongly recommended after specs, before tasks)
     /harness:apply <name>  (start implementation, when all artifacts ready)
   ```

---

## Rules

- **Always delegate specs and design** to specialists. Orchestrator drafts only tasks.md and only after specs + design are approved.
- **Always run the review gate** before writing the file.
- **One artifact per invocation.** The user runs `/harness:continue` multiple times.
- **Research before drafting** if proposal.md didn't already cover it.
- **If an artifact already exists but is thin/bad**, the user should delete it or use `/harness:review` + manual edits. This command only generates missing artifacts, it doesn't overwrite.
- **If `$ARGUMENTS` is empty and multiple changes exist**, use AskUserQuestion to pick one.
- **Users can still @-mention specialists** during the review loop if they want additional review (e.g., `@security-engineer review this design`).
