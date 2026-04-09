Archive a completed change.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**Steps**

1. Find the change directory.

2. Pre-archive checks:
   - All tasks marked complete (- [x])
   - If feature_tests.json exists: all passes: true
   - If evaluation reports exist: include them in archive

3. Move the change directory to archive:
   ```
   changes/<name>/ → changes/archive/YYYY-MM-DD-<name>/
   ```

4. Git commit: "archive: <name>"

5. Report what was archived:
   ```
   Archived: <name>
   Tasks: X/X complete
   Harness: Y evaluations, Z auto-fixes
   Location: changes/archive/YYYY-MM-DD-<name>/
   ```
