Archive a completed change.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**Where changes live**: harness-spec uses `harness/changes/<name>/` (canonical v0.12+) or `changes/<name>/` (legacy). harness-spec coexists with OpenSpec — never touches `openspec/`.

**Steps**

1. Locate the change directory in priority order:
   - `harness/changes/$ARGUMENTS/` (canonical)
   - `changes/$ARGUMENTS/` (legacy)
   Bind the resolved path to `<change-dir>`. The archive root follows the same root:
   - If `<change-dir>` is under `harness/changes/` → archive root is `harness/changes/archive/`
   - If `<change-dir>` is under `changes/` → archive root is `changes/archive/`

2. **Pre-archive checks**:
   - All tasks in `tasks.md` marked complete (`- [x]`)
   - If `feature_tests.json` exists: every task has `passes: true`
   - If evaluation reports exist in `<change-dir>/evaluations/`: include them in the archive
   - `git status` is clean (no uncommitted changes) — if not, warn the user

3. Move the change directory to archive:
   ```
   <change-dir> → <archive-root>/YYYY-MM-DD-<name>/
   ```

4. Git commit: `archive: <name>`

5. Report what was archived:
   ```
   ✓ Archived: <name>
   Tasks: X/X complete
   Harness: Y evaluations, Z auto-fixes
   Location: <archive-root>/YYYY-MM-DD-<name>/
   ```

**Note**: In a future version, archive will offer to sync the change's specs into a baseline under `harness/specs/` — see the Level 1 baseline design. For now, archive is a pure directory move.
