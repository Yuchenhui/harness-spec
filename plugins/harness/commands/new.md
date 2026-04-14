Create a new change with a thoughtful, discovery-driven proposal.

**Input**: $ARGUMENTS — change name (kebab-case) OR a free-form description OR both.

**Philosophy**: Before writing any file, understand BOTH the project AND the requirement. A proposal written without context is usually wrong in a way that isn't obvious until Phase 2 of harness:apply — expensive to fix late. Spend the cheap time upfront.

**Where changes live**: harness-spec stores all its artifacts under `harness/` at the repo root:
```
harness/
├── specs/           ← baseline (accumulated source of truth)
└── changes/         ← active and archived change proposals
    ├── <name>/      ← this command creates one of these
    └── archive/
```
harness-spec coexists peacefully with OpenSpec. If the project has an `openspec/` directory, we do not touch it — different workflow, different tool. Do not read `openspec/`, do not invoke `npx openspec` commands. The two tools can live in the same repo without collision.

**Legacy path**: older harness-spec versions used `changes/` at the repo root. If a project already has `changes/<name>/` directories, this command will still find and use them — but new changes are always created under `harness/changes/`.

---

## Phase 0: Discover (REQUIRED — never skip)

Build real grounding before touching anything. Phase 0 has **three parallel tracks** — run as many as are applicable. Do NOT settle for just "read package.json and call it a day".

### 0a. Project understanding (always)

1. **Read `CLAUDE.md`** if it exists — project-specific rules override your defaults
2. **Identify tech stack** — Glob for `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `composer.json`, `Gemfile`, etc. Read the first one found.
3. **Read `README.md`** (first 100 lines if large) for project purpose and domain vocabulary
4. **Map top-level structure** — `ls` the repo root; for any directory that looks relevant to the user's request, `ls` one level deeper
5. **Scan existing changes** — check both `harness/changes/` (canonical) and `changes/` (legacy) — see what proposals already exist; the user may be duplicating or extending something

### 0b. Deep codebase search (when request touches existing code)

Simple globbing isn't enough when the request likely intersects existing functionality. Do one or both:

- **Targeted `Grep`** for keywords from the request (e.g., if request is "add rate limiting", grep for `rate|limit|throttle|quota|429`). Follow hits into their call graphs.
- **Launch the `Explore` subagent** with a narrow, request-specific prompt: *"Map the parts of this codebase relevant to '<user's request>'. Find existing patterns, related modules, and any code that would be affected. Read, don't write. Report back in under 400 words."*
- For cross-cutting or poorly understood codebases, launch `@deep-research-agent` with the request and ask it to surface architectural context + existing patterns with citations.

**The goal**: know what code already exists that the request would touch, conflict with, or extend. A proposal that says "add JWT auth" without noticing there's already an `auth/session.ts` is a broken proposal.

### 0c. External research (when domain expertise matters)

If the request involves a well-known domain (auth, payments, websockets, caching, migrations, i18n, accessibility, etc.), **actively look up best practices** instead of guessing from training data:

- **`WebSearch`** — search for "<domain> best practices <year>" and "<specific tech> <specific problem>". Prefer recent sources.
- **`WebFetch`** — read authoritative pages found via WebSearch (official docs, RFCs, well-known engineering blogs).
- **MCP tools if available**:
  - **`context7`** — fetch up-to-date library/framework docs on demand. Use this for any library in the project's dependency graph that the change touches.
  - **`exa`** — deeper semantic search for technical content when WebSearch isn't precise enough.
  - Other MCP doc/search tools the user has installed — check `/mcp` if unsure.
- **`@deep-research-agent`** — for comparing approaches, understanding trade-offs, or when the decision space is unclear. It will use WebSearch/WebFetch/MCP tools autonomously and return an evidence-cited report.

**Skip 0c** only when the request is genuinely project-specific with no external domain expertise required (e.g., "rename this internal helper").

### 0d. Synthesize

Write yourself a short memo (don't show the user yet) that answers:
- What does this project do? What's the stack?
- What existing code is relevant to this request?
- What best practices / external context are relevant?
- Where would a change like this naturally fit?
- Any obvious risks, conflicts, or existing solutions I should know about?

If all four questions have substantive answers, you're ready for Phase 1. If any are blank, Phase 0 wasn't thorough enough — go back.

---

## Phase 1: Understand the requirement

Parse `$ARGUMENTS` and pick the right path:

### Case A — only a kebab-case name (e.g. `add-user-auth`)

The name alone tells you almost nothing. Use **AskUserQuestion**:

```
Question: "I see a name '$ARGUMENTS' but need more context. How do you want to proceed?"
Options:
  - "I'll describe what I want in a follow-up message"
  - "It's a small, self-explanatory change — just use the name"
  - "Actually, let me cancel and explore first (/harness:explore)"
```

If they pick the first option, wait for their description, then jump to Case C.
If they pick the second option, proceed to Phase 2 with just the name (proposal will be thin but acceptable for genuinely trivial changes).

### Case B — short/vague description

Fewer than ~20 words, or no concrete behavior/user/outcome mentioned. Use **AskUserQuestion** to drill down on the ambiguous parts. Pick 2-4 of these based on what's missing:

- "**What problem does this solve?** (who hits it, how often)"
- "**What does 'done' look like?** (concrete user-visible outcome)"
- "**Scope boundaries** — what's explicitly out of scope?"
- "**Does it replace or extend** `<existing thing you saw in Phase 0>`?"
- "**Any constraints** — performance, compatibility, security?"

After answering, if the description is still genuinely complex and ambiguous (multi-subsystem, cross-cutting concerns, unclear trade-offs), **launch the `@requirements-analyst` subagent** with the gathered info to do structured discovery. Wait for its output before drafting.

### Case C — clear, specific description

Proceed directly, but do ONE sanity check against Phase 0: does the requirement **conflict** with anything in the existing project? If yes, flag it in the proposal under "Open questions" or "Alignment risks" — don't silently ignore.

---

## Phase 1.5: Classify domain & surface concerns (REQUIRED — never skip)

Before drafting, actively classify what kind of change this is and walk the user through the **domain-specific concerns** they probably haven't thought about yet. This is the step that prevents "I asked for an auth endpoint and got a proposal with no mention of error UI states" kinds of failures.

### Step A — Classify

Pick one (or more, if full-stack) based on Phase 0 + Phase 1 signals. If ambiguous, use **AskUserQuestion**:

```
Question: "What kind of change is this?"
Options (multiSelect allowed):
  - "Frontend — UI, component, page, form, interaction, visual"
  - "Backend — API, database, service, cron/job, integration"
  - "Full-stack — crosses UI ↔ server boundary"
  - "Infra / DevOps — CI/CD, deploy, env, monitoring, tooling"
  - "Cross-cutting — auth, permissions, i18n, shared library, refactor"
```

Record the classification — you'll use it to gate Step B and Step C.

### Step B — Walk through domain-specific concerns via AskUserQuestion

**DO NOT SKIP THIS.** These are the concerns most users forget to mention when describing a change. Ask them explicitly, in the domain relevant to the classification. Use AskUserQuestion with multi-select or sequential prompts. Accept "not applicable" / "skip" as valid answers — the point is that the orchestrator _asked_, not that every item gets a detailed answer.

#### If classification includes **Frontend** or **Full-stack**:

Walk through these with AskUserQuestion (batch 3-5 at a time, not one by one):

- **User & device** — who's the user? Device context? Desktop / mobile / both?
- **Entry point** — where does the user enter this flow? (nav link, modal, deep link, etc.)
- **Happy-path flow** — describe it step by step from user's POV
- **Error states** — what can go wrong from the user's POV? How should it be shown?
- **Empty states** — first-time user / no data yet / filter returns nothing
- **Loading states** — spinner / skeleton / optimistic UI / what duration counts as "slow"
- **Success feedback** — toast / redirect / inline confirmation / nothing
- **Visual design source** — reuse existing design system, Figma link, or new design needed
- **Accessibility** — keyboard nav requirements, screen reader needs, WCAG target
- **Responsive behavior** — breakpoints, mobile-only differences, touch vs mouse
- **i18n / l10n** — does copy need translation? RTL layout?

If the user says "I don't know" to visual design or flow details, offer: *"Should I launch **`@ui-ux-designer`** to propose a flow and we iterate on that?"* Launch it when they agree.

#### If classification includes **Backend** or **Full-stack**:

Walk through via AskUserQuestion (batch):

- **API contract** — REST / GraphQL / RPC / internal only? Verb, path, request/response shape
- **Data model** — new tables/columns? Migrations? Indexes? Constraints?
- **Transactional requirements** — atomicity needed? Across what boundary?
- **Consistency model** — strong / eventual / best-effort
- **Performance** — expected load, latency target, p99 budget
- **Caching** — needed? invalidation strategy? TTL?
- **Security** — auth required? authz rules? PII? rate limiting? input validation?
- **Observability** — what to log, what metrics to expose, what alerts
- **Backward compatibility** — is this a breaking change? Deprecation plan?
- **Background work** — any queues, jobs, scheduled tasks, retries, DLQ?

#### If classification includes **Infra / DevOps**:

- **Environments affected** — dev / staging / prod
- **Rollback plan** — how to revert, how fast
- **Monitoring / alerting** — what to watch after rollout
- **Secrets** — new secrets? rotation? where stored?
- **Cost implications** — additional infra cost?
- **Downtime** — any? maintenance window?

#### If classification includes **Cross-cutting**:

- **Scope** — which subsystems/modules affected (list them)
- **Migration path** — gradual rollout or flag day?
- **Feature flag** — needed? which system (LaunchDarkly / env var / custom)?
- **Backward compat** — deprecate old path first, or break immediately?
- **Docs impact** — CLAUDE.md / README / API docs need updates?

### Step C — Proactive specialist invocation (parallel)

Based on the classification, **launch the relevant specialist agents in parallel** to enrich the draft with domain expertise. They run read-only and return "concerns / references / pitfalls" — they don't draft the proposal themselves.

| Classification | Specialists to invoke in parallel |
|---|---|
| Frontend only | `@frontend-architect` + `@ui-ux-designer` |
| Backend only | `@backend-architect` |
| Full-stack | `@frontend-architect` + `@ui-ux-designer` + `@backend-architect` + `@system-architect` |
| Infra / DevOps | `@devops-architect` |
| Cross-cutting | `@system-architect` + relevant domain specialists |
| **Overlay** (add on top of above) | |
| Touches auth / crypto / PII / payments / permissions | `+ @security-engineer` |
| Performance-critical (caching, throughput, latency, queries, concurrency) | `+ @performance-engineer` |
| Quality / testability concerns | `+ @quality-engineer` |

Prompt each with:

```
You are being asked for early-phase concerns on a change under consideration.
It has NOT been designed yet — we're drafting the proposal.

Change: <name>
User's description: <user's words>
Classification: <frontend/backend/...>
Project summary: <Phase 0 memo>

Please return in under 300 words:
1. Top 3-5 concerns I should flag in the proposal
2. Any existing code/patterns you know about that this should align with
3. Known pitfalls in this domain I should avoid
4. Anything the user probably didn't think to mention

Do NOT draft the proposal. Do NOT write any files. Advisory only.
```

Wait for their responses (they run in parallel, so you wait for the slowest). Merge their concerns into your Phase 2 draft.

---

## Phase 2: Draft the proposal (in memory — do NOT write the file yet)

Write a proposal that **reflects Phase 0 + Phase 1** findings. Required sections:

```markdown
# Proposal: <change-name>

## Classification
**<Frontend / Backend / Full-stack / Infra / Cross-cutting>**
(from Phase 1.5)

## Why
[The problem, grounded in what the project actually does.
 Reference concrete pain points, not hypothetical ones.]

## What Changes
- [Specific change, referencing existing modules/files when relevant]
- [Another change]

## User experience (Frontend / Full-stack only)
[Walk the reader through the user's journey.
 Cover: entry point, happy path, error states, empty states, loading, success feedback.
 Include device/responsive notes and accessibility requirements.
 Reference existing design system if applicable.]

## API & data (Backend / Full-stack only)
[API contract (verb + path + shape), data model changes, migrations,
 transactional requirements, performance targets, auth/authz rules.]

## Impact
- **Affected code**: [files/modules that will change — use real paths from Phase 0]
- **APIs**: [what changes for callers]
- **Dependencies**: [new deps, if any]
- **Backward compatibility**: [breaking? deprecation plan?]

## Alignment with project
[How it fits the existing architecture — reference patterns you saw in Phase 0.
 If it doesn't fit cleanly, say so here.]

## Specialist input
[Bullet list summarizing what each specialist agent returned in Phase 1.5 Step C.
 Format: "- @<agent>: <1-2 sentence summary of their top concern>"
 Example: "- @ui-ux-designer: error state needs inline, not toast, so user can correct in place"
 Example: "- @backend-architect: existing auth uses express-session — don't add a parallel JWT path"]

## Research & references
[2-5 bullet points citing what Phase 0 found externally.
 Format: "- <claim>: <source URL or agent name>"
 Example: "- JWT rotation: OWASP Session Management Cheat Sheet (owasp.org/...)"
 Empty only if Phase 0c was genuinely inapplicable.]

## Open questions
[Anything unresolved from Phase 1 or 1.5 that needs a decision before specs.
 Empty if everything is clear.]
```

**Quality bar**: a good proposal has
- **3-5 concrete references to existing code** (Phase 0b findings)
- **2-5 external references** when applicable (Phase 0c findings)
- **Specialist input** from at least 1 agent (Phase 1.5 Step C)
- **Domain-specific section filled in** (UX section for frontend/full-stack, API section for backend/full-stack) — not left empty with "TBD"

If any of these are missing without a good reason, go back and complete the relevant phase.

---

## Phase 3: Review before committing (REQUIRED — never skip)

Show the full draft to the user. Then **AskUserQuestion**:

```
Question: "Proposal draft ready. What next?"
Options:
  - "Looks good, create the change"
  - "Let me revise it — I'll tell you what to change"
  - "Abandon, this isn't what I want"
```

- **"Looks good"** → proceed to Phase 4
- **"Revise"** → take the user's feedback and loop back to Phase 2. After revising, re-run Phase 3.
- **"Abandon"** → stop. Don't write anything. Don't commit.

---

## Phase 4: Create the change

Only reach this phase after Phase 3 approval.

1. Create `harness/changes/<name>/` directory (creates `harness/` + `harness/changes/` if they don't exist yet)
2. Write the approved draft to `harness/changes/<name>/proposal.md`
3. Git commit:
   ```bash
   git add harness/changes/<name>/
   git commit -m "propose: <name>"
   ```
4. Tell the user:
   ```
   ✓ Change created: harness/changes/<name>/
   Next steps:
     /harness:continue to generate specs.md (requirements-analyst can help)
     /harness:review later to check spec quality before implementation
   ```

---

## Rules

- **Never skip Phase 0.** If you can't find anything useful to read, explicitly say "Project context is minimal, proceeding with limited grounding" — don't pretend you understood.
- **Never skip Phase 3.** Writing files is cheap; rewriting bad files is expensive. The review gate is the point.
- **Only write `proposal.md` in Phase 4.** This command creates proposal only. Specs/design/tasks come via `/harness:continue`.
- **If `$ARGUMENTS` is empty**, start Phase 1 by asking: "What do you want to build?" — don't guess a name.
- **If a change with the same name already exists**, stop and ask the user whether to use a different name, extend the existing one, or abort.
