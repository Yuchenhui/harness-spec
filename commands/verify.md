Verify that implementation matches specs, design, and tasks.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**Steps**

1. Find the change. Read all artifacts.

2. **Completeness**: Check task checkboxes (- [ ] vs - [x]). Count complete vs total.

3. **Correctness**: For each spec requirement, search codebase for implementation evidence. Check if tests exist covering each scenario.

4. **Coherence**: If design.md exists, verify implementation follows design decisions.

5. **Harness verification** (if feature_tests.json exists):
   - Run all verification_commands from feature_tests.json
   - Check all tasks have passes: true
   - Report per-task results with attempt counts

6. Generate report:
   ```
   ## Verification Report: <name>

   | Dimension    | Status |
   |-------------|--------|
   | Completeness | X/Y tasks done |
   | Correctness  | M/N specs covered |
   | Coherence    | Followed/Issues |
   | Harness      | All pass / N failures |

   CRITICAL: [issues that must be fixed]
   WARNING: [should fix]
   SUGGESTION: [nice to fix]
   ```

7. **Lessons learned** (if evaluations/ directory exists):
   Scan evaluation reports for patterns — what kept failing and how it was fixed.
   Suggest rules the user might want to add to their CLAUDE.md:
   ```
   ## Lessons from this change

   During implementation, the fixer had to fix:
   - 2x IntegrityError not handled (duplicate email)
   - 1x Missing auth middleware on /admin routes

   Consider adding to your project's CLAUDE.md:
     "Always handle database unique constraint errors with try/except"
     "All /admin/* routes must have auth middleware"
   ```
   This is a suggestion — the user decides whether to add these rules.

8. If all clear: "Ready to archive. Run /harness:archive"
