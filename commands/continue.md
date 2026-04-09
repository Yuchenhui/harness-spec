Continue building artifacts for an existing change, one step at a time.

**Input**: $ARGUMENTS — change name (optional, auto-detect if only one active change).

**Steps**

1. Find the change directory. Check what artifacts already exist:
   - proposal.md exists? → Move to next missing artifact
   - specs.md missing? → Generate specs from proposal
   - design.md missing? → Generate design (or skip if simple change)
   - tasks.md missing? → Generate tasks from specs

2. Generate the NEXT missing artifact only (not all at once).

3. After generating, show what was created and what's next:
   ```
   ✓ Created: specs.md (12 scenarios)
   Next: /harness:continue to generate design.md (or skip to tasks)
         /harness:review to check spec quality before proceeding
   ```

**Artifact generation order**: proposal → specs → design (optional) → tasks

**HARNESS TIP**: After specs are done, run /harness:review before generating tasks. The reviewer will strengthen your specs with concrete values and add missing error/edge cases.

The user can @-mention specialist agents during this process:
- @requirements-analyst for requirements discovery
- @backend-architect or @frontend-architect for design
- @system-architect for architecture decisions
