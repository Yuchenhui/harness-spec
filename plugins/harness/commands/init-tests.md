Generate test skeletons from specs before coding begins (TDD red phase). Delegates to the `verification-initializer` subagent.

**Input**: $ARGUMENTS — change name (optional, auto-detect if only one active change).

Usually invoked automatically by `/harness:apply` Phase 1. Run it manually when you want to inspect or iterate on the generated tests *before* starting implementation — useful when you're unsure whether the specs will produce good tests.

---

## Steps

### 1. Locate the change

1. If `$ARGUMENTS` is given, use `changes/$ARGUMENTS/`. If not found, stop.
2. If `$ARGUMENTS` is empty, scan `changes/` for active (non-archived) changes. Use exactly one, or use **AskUserQuestion** to pick.
3. Verify required artifacts exist: `proposal.md`, `specs.md`, `tasks.md`. `design.md` is optional but recommended.
4. Check for existing `feature_tests.json`:
   - **If it exists and has `passes: true` entries** → STOP. Tell the user: "feature_tests.json already has passing tasks. Running init-tests would overwrite verification state. Use /harness:apply to continue, or delete feature_tests.json to regenerate from scratch."
   - **If it exists but all entries are `passes: false`** → ask the user via AskUserQuestion: "feature_tests.json exists but nothing has passed yet. Regenerate?" (Options: "Regenerate from scratch" / "Keep existing" / "Abort")
   - **If it does not exist** → proceed.

### 2. Delegate to the `verification-initializer` subagent

Use the Task tool to launch the initializer agent with this prompt:

---
Please generate complete verification material for the following change.

Change: {change-id}
Change directory: {change-dir-path}
Specs file: {change-dir-path}/specs.md
Tasks file: {change-dir-path}/tasks.md
Design file (if present): {change-dir-path}/design.md
Project root: {pwd}

Please:
1. Read specs.md and tasks.md (and design.md if present) — extract spec scenarios and design constraints
2. Check the project tech stack (package.json / requirements.txt / go.mod / Cargo.toml / etc.)
3. Determine verification_level (L1-L5) for each task based on spec scenario content:
   - UI/browser interaction → L4 (Playwright E2E)
   - Visual/styling only → L5 (human review)
   - API endpoints → L3 (integration)
   - Database with constraints → L3 with fixtures
   - Pure logic/utilities → L2 (unit)
   - Lint/typecheck only → L1 (static)
4. Generate `feature_tests.json` — **including `evaluation_rubric` for every task** (see initializer system prompt for format)
5. Generate test skeleton files for L2/L3 tasks with real assertions (not empty shells)
6. Generate API contract files for L3 tasks where applicable
7. Generate browser scenario files for L4 tasks
8. Generate conftest/fixtures if the project doesn't already have test infrastructure
9. Report spec coverage and any quality issues you noticed
---

Wait for the initializer to finish before proceeding.

### 3. Validate the generated material

After the initializer reports back:

1. Confirm `changes/<id>/feature_tests.json` exists and parses as valid JSON
2. Confirm every spec scenario listed in specs.md has at least one corresponding test
3. Confirm every task has an `evaluation_rubric` with at least one criterion
4. **Run the generated tests to confirm they all currently FAIL** (TDD red phase):
   ```bash
   # Pick the appropriate runner for the stack, e.g.:
   pytest changes/<id>/tests/ -v --tb=short
   # or
   npm test -- --listTests; npm test
   ```
5. If ANY test passes before implementation exists, that's a red flag — either the test is wrong (doesn't actually check anything) or the feature is already implemented. Flag it to the user.

### 4. Git commit

```bash
git add changes/<id>/ tests/ conftest.py  # or equivalent
git commit -m "init-tests: <change-id>"
```

### 5. Report

```
✓ Generated verification material for <change-id>:
  - feature_tests.json ({N} tasks)
  - {M} test files with {K} test functions
  - {P} contract files (L3)
  - {Q} browser scenarios (L4)

Coverage: {all spec scenarios covered / X scenarios uncovered: [...]}
TDD state: {all tests FAIL as expected / warnings: ...}

Next: /harness:apply <change-id> to start the code → evaluate → fix loop.
```

---

## Rules

- **Never draft tests yourself.** Always delegate to the initializer subagent. This command is a thin wrapper.
- **Never overwrite existing passing state.** If feature_tests.json has passing tasks, stop and ask.
- **TDD red phase is non-negotiable.** If generated tests don't fail, there's a bug to investigate before proceeding.
- **One change per invocation.** Don't batch multiple changes.
