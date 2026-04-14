Run schema validation on a change's artifacts. Fast, deterministic, LLM-free. Layer 1 of harness-spec's two-layer compliance strategy.

**Input**: $ARGUMENTS — change name (optional, auto-detect if only one active change).

**What this command does**: runs `scripts/validate.js` to check structural and format compliance across `proposal.md`, `specs.md`, `design.md`, `tasks.md`, and `feature_tests.json` (if present). Takes milliseconds, no LLM calls, no API cost. Catches mechanical errors that would otherwise only surface in `/harness:apply` Phase 1 or Phase 2.

**IMPORTANT — harness-spec is NOT OpenSpec.** Only look for changes under `changes/` at the repo root. Do not read `openspec/changes/`, do not run `npx openspec` commands.

---

## Steps

### 1. Locate the change

1. If `$ARGUMENTS` is given, use `changes/$ARGUMENTS/`. If not found, stop and tell the user.
2. If `$ARGUMENTS` is empty, scan `changes/` at repo root for active (non-archived) changes. Use exactly one, or use **AskUserQuestion** to pick if multiple.

### 2. Run the validator

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.js changes/<change-id>
```

Capture stdout and exit code.

For programmatic / structured handling, use `--json`:
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.js changes/<change-id> --json
```

### 3. Report to the user

Parse the output and present it cleanly:

- **Exit code 0 (no errors)**: tell the user validation passed. If there are warnings, list them briefly and suggest they may want to address them but are not blocking.
- **Exit code 1 (errors present)**: list all errors with file + rule + message. Warnings are secondary — show them under a separate heading. Be actionable: for each error, mention what fix is needed.
- **Exit code 2 (usage error)**: something is wrong with the command invocation itself (change dir not found). Report it plainly.

### 4. Offer next actions

After reporting:

- **If passed (no errors)**:
  - If warnings exist → ask via **AskUserQuestion**: "Validation passed with N warnings. Proceed to /harness:review for content quality check, or address warnings first?"
  - If no warnings → tell the user: "Validation clean. Next: `/harness:review` to run the content quality check (spec-reviewer agent)."

- **If failed (errors present)**:
  - Offer to help fix: "I can fix the structural errors now — e.g., add missing sections to proposal.md, add missing Given/When/Then lines to specs.md. Want me to go through them?"
  - Do NOT auto-fix without confirmation. Use **AskUserQuestion** and walk through each error with the user's approval.
  - For errors requiring content decisions (e.g., "add User experience section" for frontend), draft the content first, show it, then write.

---

## What the validator checks

**`proposal.md`**
- Required sections: Classification, Why, What Changes, Impact, Alignment
- Classification value must be one of: Frontend / Backend / Full-stack / Infra / Cross-cutting
- If Classification includes Frontend or Full-stack → User experience section required
- If Classification includes Backend or Full-stack → API & data section required
- Warns on missing Specialist input / Research & references / Open questions

**`specs.md`**
- ≥1 `### Requirement:` section
- Every Requirement has ≥1 `#### Scenario:` subsection
- Every Scenario has **Given** / **When** / **Then** lines
- Warns on vague phrases ("valid data", "some input", etc.) — prefer concrete values
- Warns if no SHALL/MUST normative language is used

**`design.md` (optional)**
- If present: Context / Decisions sections required
- Warns on missing Goals / Risks

**`tasks.md`**
- ≥1 checkbox task (`- [ ]` or `- [x]`)
- Warns if no numbered groups

**`feature_tests.json` (optional, exists after `/harness:apply` Phase 1)**
- Valid JSON
- Has `tasks` array
- Each task has: id, description, spec_scenarios, verification_commands, verification_level, passes
- verification_level is one of L1/L2/L3/L4/L5
- Warns if evaluation_rubric is missing (initializer should always generate it)

**Cross-file references**
- Warns if `feature_tests.json` references spec_scenarios that don't match any Scenario name in `specs.md`

---

## When to use this command

- **Manually**: when you're midway through drafting artifacts and want a quick check that structure is OK
- **Automatically**: `/harness:review`, `/harness:apply`, and `/harness:verify` already call this as a pre-flight check
- **Pre-commit hook**: users can wire it into git pre-commit if they want commit-time enforcement

## Relationship to other commands

- **This command (Layer 1)** — fast, deterministic, structural / format only. Milliseconds. Use frequently.
- **`/harness:review` (Layer 2)** — slow, LLM-based content quality check via spec-reviewer agent. Use once per change before implementation.
- **`/harness:verify`** — runs both layers + `@quality-engineer` audit. Use as the final gate before `/harness:archive`.
