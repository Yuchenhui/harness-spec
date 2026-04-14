Review and strengthen specs before implementation. Interactive quality gate.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**Where changes live**: harness-spec uses `harness/changes/<name>/` (canonical) or `changes/<name>/` (legacy pre-v0.12, still supported for backward compat). harness-spec coexists with OpenSpec — never touches `openspec/`.

**Steps**

1. Locate the change directory in priority order:
   - `harness/changes/$ARGUMENTS/` (canonical)
   - `changes/$ARGUMENTS/` (legacy fallback)
   Bind to `<change-dir>`. Read all artifacts: proposal.md, design.md (if exists), specs.md, tasks.md.

2. **Layer 1 pre-check — run the schema validator first** (fast, deterministic, LLM-free):
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.js <change-dir> --json
   ```
   - Parse the JSON output.
   - **If validation fails (exit 1, errors present)**: STOP. Do NOT launch spec-reviewer yet — it would waste an expensive LLM call on structurally broken files. Present the errors to the user via AskUserQuestion: "Schema validation failed with N errors. Fix them now, skip validation and run spec-reviewer anyway, or abort?" Default: Fix now. Walk through each error, offer fixes, then re-run validate until clean.
   - **If validation passes (exit 0) but has warnings**: show them briefly, then proceed to step 3. Warnings don't block spec-reviewer.
   - **If validation passes with no warnings**: proceed silently to step 3.

3. **Layer 2 — content quality review**: launch the **spec-reviewer** agent as a subagent (Task tool). Pass it the change directory path.

4. The reviewer outputs a JSON report with:
   - quality_score (1-10)
   - design_gaps (design decisions without spec coverage)
   - spec_issues (vague or unverifiable scenarios)
   - missing_scenarios (error/edge cases to add)
   - unverifiable_scenarios (can't be auto-tested)
   - task_alignment (specs ↔ tasks mismatches)

5. Present findings via AskUserQuestion in priority order:
   a. Design gaps → multiSelect which to add
   b. Vague scenarios → accept strengthening or skip
   c. Missing error/edge cases → multiSelect which to add
   d. Unverifiable → downgrade to L5 / rewrite / delete
   e. Task alignment → accept fixes or skip

6. Apply accepted changes to spec files. Tag additions with [harness-reviewed].
   Git commit: "specs: strengthen scenarios [harness-reviewed]"

7. **Re-run validate** after edits to confirm we didn't break structure while strengthening content:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/validate.js <change-dir>
   ```
   If it now fails (rare but possible), fix immediately before committing.

8. If new scenarios added, ask if tasks.md needs updating.

9. Final confirmation: "Specs reviewed (Layer 1 + Layer 2 passed). Run /harness:apply to start implementation."
