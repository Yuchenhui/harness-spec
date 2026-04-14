Archive a completed change. Optionally sync its specs into the `harness/specs/` baseline.

**Input**: $ARGUMENTS — change name (optional, auto-detect).

**Where changes live**: harness-spec uses `harness/changes/<name>/` (canonical v0.12+) or `changes/<name>/` (legacy). harness-spec coexists with OpenSpec — never touches `openspec/`.

---

## Concept: what archive + sync means

harness-spec has two tiers of specs (introduced in v0.12):

1. **`harness/specs/<capability>.md`** — the **baseline**, the authoritative description of "what the system does right now". Accumulated over time.
2. **`harness/changes/<name>/specs.md`** — a **change proposal**, the specs for one focused unit of work.

When you archive a change, you have two independent decisions:

- **Where does the change directory go?** → always moves to `<archive-root>/YYYY-MM-DD-<name>/` (frozen historical copy)
- **Should the change's specs be synced into the baseline?** → user choice, asked interactively

**Sync = Yes** means "this change was implemented and deployed; update the baseline to reflect the new reality." Each Requirement in the change's specs.md is merged into `harness/specs/<capability>.md`:
- Requirement with same name → REPLACED in baseline
- Requirement that doesn't exist in baseline → APPENDED
- Requirements in baseline that aren't mentioned → KEPT AS-IS (no removal in Level 1)

**Sync = No** means "this change was abandoned, reverted, or we don't want to touch the baseline for some reason." Only the directory move happens.

---

## Steps

### 1. Locate the change

Look for the change directory in priority order:
- `harness/changes/$ARGUMENTS/` (canonical)
- `changes/$ARGUMENTS/` (legacy)

Bind the resolved path to `<change-dir>`. The archive root follows the same root:
- If `<change-dir>` is under `harness/changes/` → archive root is `harness/changes/archive/`
- If `<change-dir>` is under `changes/` → archive root is `changes/archive/`

If `$ARGUMENTS` is empty, auto-detect the most recently-modified active change or use **AskUserQuestion** to pick.

### 2. Pre-archive checks

Before doing anything destructive:

- **Tasks complete**: parse `<change-dir>/tasks.md` — every checkbox should be `- [x]`. If any are `- [ ]`, refuse to archive and tell the user.
- **Harness pass**: if `<change-dir>/feature_tests.json` exists, every task must have `passes: true`. If any are false, refuse to archive.
- **Git clean**: `git status --short` should be empty. If there are uncommitted changes, warn the user to commit or stash first.
- **Evaluations included**: if `<change-dir>/evaluations/` exists, include it in the archive (the move in step 5 handles this naturally since it moves the whole directory).

If any pre-check fails, STOP and tell the user what to fix. Do not proceed to step 3.

### 3. Ask about baseline sync

Use **AskUserQuestion**:

```
Question: "Sync this change's specs into the harness/specs/ baseline?

The baseline is the source of truth for 'what the system does now'.
Syncing will merge this change's Requirements into the relevant
capability files under harness/specs/."

Options:
  - "Yes — sync (the change was implemented and deployed)"
  - "No  — archive only (the change was abandoned or reverted)"
  - "Dry run first — show me what would be merged, then ask again"
```

### 4. If "Dry run first"

Run the merge script in dry-run mode:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/merge-specs.js <change-dir>/specs.md --baseline-dir <baseline-dir> --dry-run
```

Where `<baseline-dir>` is:
- `harness/specs/` if `<change-dir>` is under `harness/`
- `.harness-specs/` — NO, wrong. Use `specs/` parallel to the change root:
  - `<change-dir>` under `harness/changes/` → baseline at `harness/specs/`
  - `<change-dir>` under `changes/` (legacy) → baseline at `harness-specs/` (or skip baseline for legacy projects entirely and warn the user to migrate)

Actually for legacy (`changes/` at root) keep it simple: baseline is always `harness/specs/`. If the user is on legacy layout, the first archive with sync will create `harness/specs/` as their new baseline directory.

Show the dry-run output to the user and re-ask the Yes/No question (without the "Dry run first" option this time).

### 5. Perform the sync (if Yes)

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/merge-specs.js <change-dir>/specs.md --baseline-dir harness/specs
```

Capture the output. Report per-capability what was added / replaced / kept. If the script exits non-zero, STOP — don't proceed to the directory move. Show the user the error.

### 6. Move the change directory to archive

Regardless of whether sync happened:

```bash
mkdir -p <archive-root>
mv <change-dir> <archive-root>/$(date +%Y-%m-%d)-<name>/
```

### 7. Git commit

```bash
git add harness/specs/ <archive-root>/  # (adjust if legacy layout)
git commit -m "archive: <name> [synced]"    # if sync=Yes
# OR
git commit -m "archive: <name> [not-synced]" # if sync=No
```

### 8. Report

```
✓ Archived: <name>

Change:
  Tasks:       X/X complete
  Harness:     Y evaluations, Z auto-fixes
  From:        <change-dir>
  To:          <archive-root>/YYYY-MM-DD-<name>/

Baseline sync: YES / NO
  If YES:
    Capabilities touched: <list>
    + added N requirements: <names>
    ~ replaced M requirements: <names>
    = kept K existing baseline requirements as-is
  If NO:
    Baseline (harness/specs/) untouched.

Next:
  - /harness:review on a new change to see baseline-aware review
  - Browse harness/specs/ to see the cumulative source of truth
```

---

## Rules

- **Never modify `openspec/specs/`** — that belongs to OpenSpec, a different tool.
- **Sync only on explicit user approval.** Never auto-sync.
- **Sync happens before the directory move.** If sync fails, the change is NOT archived — user can fix and retry.
- **Pre-checks are blocking.** No partial archives — either everything checks out or we refuse.
- **No REMOVED semantics in Level 1.** If a change needs to drop a Requirement from the baseline, the user edits `harness/specs/<cap>.md` manually after archive. We will add REMOVED support in a later version if demand exists.
- **Merge is Requirement-name-based.** Two Requirements with identical names in different places will collide. requirements-analyst is responsible for giving Requirements clear, unique names.

---

## Troubleshooting

**"Missing Capability metadata" error from merge-specs.js**
The change's specs.md is missing its `**Capability**:` line or `## Capability:` headers. Edit the file manually to add it, then re-run `/harness:archive`. See `agents/requirements-analyst.md` for the format.

**"Cannot merge" / parse error**
The specs.md has non-standard structure that the parser can't understand. Run `/harness:validate <name>` first to catch structural issues before archive.

**Baseline file gets messy after several archives**
Level 1 merge is append-for-new, replace-for-existing. If your baseline gets cluttered, manually reorganize it — `harness/specs/*.md` are just markdown files, nothing stops you from editing them directly. The next archive will merge cleanly against whatever shape you leave it in.
