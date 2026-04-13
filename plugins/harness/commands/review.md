Review and strengthen specs before implementation. Interactive quality gate.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**Steps**

1. Find the change directory. Read all artifacts: proposal.md, design.md (if exists), specs/, tasks.md.

2. Launch the **spec-reviewer** agent as a subagent (Task tool). Pass it the change directory path.

3. The reviewer outputs a JSON report with:
   - quality_score (1-10)
   - design_gaps (design decisions without spec coverage)
   - spec_issues (vague or unverifiable scenarios)
   - missing_scenarios (error/edge cases to add)
   - unverifiable_scenarios (can't be auto-tested)
   - task_alignment (specs ↔ tasks mismatches)

4. Present findings via AskUserQuestion in priority order:
   a. Design gaps → multiSelect which to add
   b. Vague scenarios → accept strengthening or skip
   c. Missing error/edge cases → multiSelect which to add
   d. Unverifiable → downgrade to L5 / rewrite / delete
   e. Task alignment → accept fixes or skip

5. Apply accepted changes to spec files. Tag additions with [harness-reviewed].
   Git commit: "specs: strengthen scenarios [harness-reviewed]"

6. If new scenarios added, ask if tasks.md needs updating.

7. Final confirmation: "Specs reviewed. Run /harness:apply to start implementation."
