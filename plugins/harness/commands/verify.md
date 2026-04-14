Verify that an implementation matches its specs, design, and tasks. Final gate before archiving. Delegates quality and security audit to specialist agents.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**IMPORTANT — harness-spec is NOT OpenSpec.** Only look for changes under `changes/` at the repo root. Do not read `openspec/changes/`, do not run `npx openspec` commands, do not validate against OpenSpec schemas.

---

## Steps

### 1. Locate the change

1. Find `changes/<name>/` at the repo root. If `$ARGUMENTS` is empty, auto-detect the most recently-modified active change under `changes/` (ignoring `openspec/changes/`) or use **AskUserQuestion** to pick.
2. Read all artifacts: `proposal.md`, `specs.md`, `design.md` (if present), `tasks.md`, `feature_tests.json` (if present).

### 2. Schema compliance — Layer 1 validator (pre-flight, blocking)

Run the schema validator as the first dimension of verification:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.js changes/$ARGUMENTS --json
```
- Parse the JSON result.
- **If errors > 0**: this is a CRITICAL issue. Flag every error in the final report. Verify fails regardless of other dimensions — the change cannot be archived with a structurally broken set of artifacts.
- **If only warnings**: include them in the final report under WARNING but do not block archiving.
- **If clean**: record "Schema: clean" and proceed.

### 3. Completeness — checklist audit

Parse `tasks.md` for checkboxes (`- [ ]` vs `- [x]`).
- Count complete vs total.
- List any unchecked tasks by ID.
- If `feature_tests.json` exists, cross-check: every task should have either `passes: true` OR a checked checkbox with explanation in commits.

### 4. Correctness — code evidence

For each `### Requirement` in specs.md:
- Search the codebase (via Glob/Grep) for implementation evidence using keywords from the scenario
- Check if tests exist covering each scenario (look in test files for scenario keywords)
- Flag any requirement with no evidence of implementation OR no test coverage

### 5. Coherence — design alignment

If `design.md` exists:
- Read each **Decision** section
- For each decision, search the code for evidence the decision was followed
- Flag decisions that appear to have been ignored or reversed without explanation

### 6. Harness verification — run the tests

If `feature_tests.json` exists:
1. Run every `verification_commands` entry from every task
2. Record pass/fail per task
3. Check `passes: true` on every task. If any `false`, this verify fails.
4. If `evaluation_rubric` is present, also verify each criterion passes (re-using the rubric from feature_tests.json).

### 7. Specialist review (delegate)

Always launch **`@quality-engineer`** with this prompt:

---
You are doing a final code quality audit for change `<name>` before it ships.

Change directory: {change-dir}
Artifacts: {list which ones exist}

Please review the code implementing this change and report:
1. **Quality issues**: test coverage gaps, error handling gaps, unused code, obvious bugs
2. **Consistency**: does the implementation follow the project's existing patterns (check CLAUDE.md, similar existing modules)
3. **Missing edges**: obvious edge cases the current tests don't cover

Do not fix anything — produce a structured report only:
```
## Quality Report
### Critical (must fix before ship)
### Warning (should fix)
### Suggestion (nice to fix)
```
---

**Additionally**, if the change touches **security-sensitive** code (auth, crypto, PII, payments, permissions, file uploads, user input handling), launch **`@security-engineer`** with a similar prompt focused on security issues. Detect sensitivity by scanning specs.md and design.md for keywords: auth, password, token, session, crypto, encrypt, hash, PII, payment, card, upload, permission, role.

**Additionally**, if the change has **performance implications** (caching, throughput, latency, queries, concurrency), launch **`@performance-engineer`** for a perf-focused review.

Wait for all launched agents to return before proceeding.

### 8. Lessons learned (if evaluations/ dir exists)

If `changes/<name>/evaluations/` has evaluator reports from the apply loop, scan them for recurring fix patterns and suggest rules for the user's CLAUDE.md. Example:

```
## Lessons from this change

During Phase 2 the fixer repeatedly had to fix:
- 2x IntegrityError not caught (duplicate email → 500 instead of 409)
- 1x Missing auth middleware on /admin routes

Suggested rules for CLAUDE.md (optional — user decides):
  "All database writes that use UNIQUE constraints must handle IntegrityError explicitly"
  "All /admin/* routes require auth middleware"
```

This is a suggestion only. Never auto-edit CLAUDE.md.

### 9. Generate the final report

```markdown
## Verification Report: <name>

| Dimension    | Status                                 |
|--------------|----------------------------------------|
| Schema       | clean / N errors / N warnings          |
| Completeness | X/Y tasks done                         |
| Correctness  | M/N specs covered with tests           |
| Coherence    | Followed / N decisions violated        |
| Harness      | All pass / N failures                  |
| Quality      | (from @quality-engineer report)        |
| Security     | (from @security-engineer, if launched) |
| Performance  | (from @performance-engineer, if launched) |

### CRITICAL (must fix before archive)
- ...

### WARNING (should fix)
- ...

### SUGGESTION (nice to fix)
- ...

### Lessons learned (optional CLAUDE.md rules)
- ...
```

### 10. Next action

- If CRITICAL is empty → "Ready to archive. Run `/harness:archive <name>`"
- If CRITICAL has items → "Verification failed. Fix the critical items first, then re-run `/harness:verify`"
- If only WARNING/SUGGESTION → ask the user via **AskUserQuestion**: "Verification has warnings but no critical issues. Proceed to archive, or address warnings first?"

---

## Rules

- **Schema compliance (Step 2) is blocking.** If validate.js reports errors, verify fails regardless of other dimensions.
- **Always launch @quality-engineer.** This is the non-negotiable baseline.
- **Launch @security-engineer and @performance-engineer conditionally** based on change content detection (see Step 7).
- **Never modify code during verify.** Read-only audit.
- **Never auto-edit CLAUDE.md.** Lessons are suggestions only.
- **The Harness dimension is blocking.** If feature_tests.json shows failures, verify fails regardless of other dimensions.
