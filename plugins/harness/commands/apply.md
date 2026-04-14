You are the Harness Apply orchestrator. The user has provided arguments: $ARGUMENTS

**Parse arguments**:
- First positional argument (or first token before flags) = `change-id`
- `--yes` or `-y` flag = **headless mode**: auto-accept all spec review suggestions, no AskUserQuestion prompts
- `--interactive` or no flag = interactive mode (default)

If `--yes` is present in $ARGUMENTS, set INTERACTIVE=false. Otherwise INTERACTIVE=true.

**FIRST**: Activate harness mode by writing the feature_tests.json path to `.claude/harness-active`:
```bash
mkdir -p .claude
```
This state file tells all harness hooks to activate. Without it, hooks are dormant.

Follow this workflow strictly:

## Pre-flight Check (5 seconds)

Before anything else, quickly verify the project is in a healthy state:
```bash
git status --short
node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree.js prune
```
- If there are uncommitted changes: warn the user "Uncommitted changes detected. Commit or stash before starting harness."
- If a previous `.claude/harness-active` exists: ask "A previous harness session was interrupted. Resume it or start fresh?"
- Run the project's existing test command (if detectable) to confirm the baseline is green. If tests fail before we start, flag it.
- `worktree.js prune` cleans up any orphan evaluation worktrees from previous runs.

## Phase 0: Spec Review (Interactive Quality Gate)

**NOTE: This phase is interactive by default.** It requires a human to answer AskUserQuestion prompts.
For long-running unattended use, you have two options:
1. Pass `--yes` to auto-accept reviewer suggestions (see INTERACTIVE=false branch in step 4)
2. Pre-create `feature_tests.json` manually; `/harness:apply` will detect it and skip to Phase 2

1. Locate the change directory. Search in priority order:
   - `changes/$ARGUMENTS/tasks.md` (at repo root only)
   - If not found, ask the user where tasks.md is located

   **IMPORTANT — do NOT look in `openspec/` or invoke `npx openspec`.** If the project has an `openspec/` directory, it belongs to a separate OpenSpec workflow that harness-spec does not support or interoperate with. Do not read `openspec/changes/`, do not run `npx openspec validate`, do not run any `openspec` CLI command. Harness changes live **only** in `changes/` at the repo root. If the user references a change name that exists only under `openspec/changes/`, stop and tell them: *"harness-spec and OpenSpec are separate workflows. The change `$ARGUMENTS` appears to be an OpenSpec change under `openspec/changes/`. Please use OpenSpec's own tools for it, or create a new harness change under `changes/`."*

2. Write the feature_tests.json path to `.claude/harness-active`:
   ```bash
   echo "changes/$ARGUMENTS/feature_tests.json" > .claude/harness-active
   ```

3. Check whether `feature_tests.json` already exists (in the same directory):
   - If it exists and some entries have passes=true -> skip Phase 0 and Phase 1, enter recovery mode (Phase 2)
   - If it does not exist -> continue

3. **Launch the Spec Reviewer subagent to review the full set of change files.**

   First confirm which files exist in the change directory (ls the change directory), then launch the spec-reviewer agent:

   ---
   Please review the full file chain for the following change and output a structured JSON report:

   Change: $ARGUMENTS
   Change directory: {change directory path}
   (The directory may contain: proposal.md, design.md, specs.md, tasks.md)
   Project root: {pwd}
   ---

4. **Parse the Reviewer's JSON report. Branch on INTERACTIVE mode:**

   ### INTERACTIVE=false (headless, --yes mode)

   **Do NOT call AskUserQuestion.** Automatically apply all reviewer suggestions with these default rules:

   **Auto-accept:**
   - All `design_gaps` → add suggested scenarios to specs.md
   - All `spec_issues` where severity is `needs_improvement` → apply suggested_replacement
   - All `missing_scenarios` of type `error_case` or `edge_case` → add to specs.md
   - All `unverifiable_scenarios` → downgrade to L5 human review

   **Auto-escalate (still require user even in --yes mode):**
   - If `quality_score < 3` → STOP and ask user "Review found critical spec quality issues (score {score}/10). Cannot proceed in headless mode. Rerun without --yes."
   - If any `spec_issues` have severity `insufficient` AND no `suggested_replacement` → STOP and ask user
   - If `task_alignment.specs_without_tasks` has entries AND these would require new tasks → STOP and ask user (changing tasks.md is too risky to automate)

   **Audit log**: Write ALL auto-decisions to `changes/{change-id}/review-decisions.json`:
   ```json
   {
     "timestamp": "<ISO8601>",
     "mode": "auto (--yes)",
     "quality_score": 6,
     "decisions": {
       "strengthened": [
         {"original": "...", "applied": "..."}
       ],
       "added": [
         {"type": "error_case", "scenario": "...", "source": "design_gap"}
       ],
       "downgraded": [
         {"scenario": "...", "to": "L5_human_review"}
       ],
       "skipped": [
         {"scenario": "...", "reason": "no suggested_replacement"}
       ]
     }
   }
   ```

   Proceed directly to step 5 (write changes back) with the auto-decisions.
   In headless mode, skip steps 6 and 7 as well:
   - Step 6 (regenerate tasks?): auto-choose "no new tasks needed" — new error/edge scenarios are treated as additional verification for existing tasks
   - Step 7 (final confirmation): skip entirely
   Go straight from step 5 to Phase 1.

   ### INTERACTIVE=true (default)

   Call AskUserQuestion item by item in priority order as specified below.

   **4a. If quality_score >= 8 and there are no critical issues:**

   ```
   Question: "Spec quality score {score}/10, full chain check passed. Start now?"
   Options:
     - "Start (Recommended)"
     - "I want to see the detailed report first"
   ```

   **4b. If there are design_gaps (design decisions not covered by specs):**

   This is the highest-priority issue — the design has specified a technical approach, but specs have no corresponding verification scenarios.

   ```
   Question: "The following decisions in design.md have no corresponding test scenarios in specs. Add them to specs.md?"
   Options (multiSelect: true):
     - "Add: design says 'JWT 1h expiry' -> Add 'Given expired token, Then 401'"
     - "Add: design says 'email unique' -> Add 'Given duplicate email, Then 409'"
     - "Skip all"
   ```

   **4c. If there are spec_issues (vague or unverifiable scenarios in specs):**

   ```
   Question: "The following scenarios need strengthening. Accept the suggestions?"
   Options (multiSelect: true):
     - "Accept: '{original}' -> '{suggested}'"
     - "Skip, keep as-is"
     - "I'll modify it myself"
   ```

   **4d. If there are missing_scenarios (missing error/edge cases):**

   ```
   Question: "Suggest adding the following scenarios for '{feature}':"
   Options (multiSelect: true):
     - "[error] {scenario} (source: design_gap)"
     - "[edge] {scenario} (source: completeness)"
     - "Skip all"
   ```

   **4e. If there are unverifiable_scenarios:**

   ```
   Question: "'{scenario}' cannot be automatically verified. How should it be handled?"
   Options:
     - "Downgrade to L5 screenshot human review (Recommended)"
     - "Rewrite as a concrete assertion (I'll write it)"
     - "Remove this scenario"
   ```

   **4f. If there are task_alignment issues:**

   ```
   Question: "There are alignment issues between tasks and specs:"
   Options (multiSelect: true):
     - "Task 'Add logging' has no corresponding spec -> Add the suggested spec"
     - "Spec 'expired token -> 401' has no corresponding task -> Assign to task 'Add JWT middleware'"
     - "Skip, do not address"
   ```

5. **Based on user selections, write changes back to specs.md to maintain a single source of truth.**

   **Principle: specs.md is the sole source of spec data.** Review-approved modifications are written directly back to specs.md — no parallel files are created, avoiding gaps.

   Specific write-back operations:

   **5a. Strengthen** — replace vague scenarios in place:
   ```
   Original: - Given valid data, When register, Then succeed
   Updated:  - Given email 'test@example.com' and password 'SecurePass123!',
               When POST /auth/register with JSON body,
               Then response status is 201 and body contains 'user_id'
   ```
   Use the Edit tool for precise replacements — only modify the items the user confirmed.

   **5b. Supplement** — append at the end of the corresponding feature section, tagged `[harness-reviewed]`:
   ```markdown
   ## User Registration

   - Given valid email and password, When POST /auth/register, Then return 201
   - Given duplicate email, When POST /auth/register, Then return 409
     [harness-reviewed: error_case]
   - Given empty email, When POST /auth/register, Then return 422
     [harness-reviewed: edge_case]
   ```

   **5c. Downgrade annotation** — annotate unverifiable scenarios in place:
   ```
   - The login page should look professional
     [harness-reviewed: L5_human_review]
   ```

   Git commit: `git commit -m "specs: strengthen scenarios for $ARGUMENTS [harness-reviewed]"`

6. **If new scenarios were added, ask whether tasks need to be regenerated.**

   Use AskUserQuestion:
   ```
   Question: "specs.md has been updated ({n} strengthened, {m} added). New scenarios may require task updates. How to proceed?"
   Options:
     - "New scenarios are additional verifications for existing tasks, no new tasks needed (Recommended)"
       -> Most error/edge cases belong to existing tasks, e.g., "register returns 409" belongs to task "Add register endpoint"
     - "Re-run /harness:continue to update the task list"
       -> Appropriate when entirely new feature scenarios were added
     - "I'll adjust tasks.md manually"
   ```

7. Final confirmation before entering the test generation phase:

   Use AskUserQuestion:
   ```
   Question: "specs.md and tasks.md are aligned. Confirm entering the test generation phase?"
   Options:
     - "Confirm, start generating tests (Recommended)"
     - "I want to review the specs.md changes first"
     - "Re-run spec review"
   ```

   If the user selects "Re-run spec review", re-run Phase 0.

## Phase 1: Initialization (Generate Verification Material)

1. **Launch the Initializer subagent to generate verification material.**

   **The Initializer reads specs.md** (which now contains the complete, reviewed scenarios).

   Use the Task tool to launch the verification-initializer agent with the following prompt:

   ---
   Please generate complete verification material for the following change.

   Change: $ARGUMENTS
   Specs file: {path to specs.md} (contains complete scenarios after review)
   Tasks file: {path to tasks.md}
   Project root: {pwd}

   Please:
   1. Read specs.md (already reviewed and strengthened in Phase 0) and tasks.md
   2. Also read design.md if it exists — extract design constraints for rubric criteria
   3. Check the project tech stack (package.json / requirements.txt / go.mod)
   4. Determine verification_level (L1-L5) for each task
   5. Generate feature_tests.json — **including `evaluation_rubric` for every task**
      Each rubric should contain per-criterion entries derived from:
      - spec scenarios (the Given/When/Then conditions → one criterion each)
      - design constraints (e.g., "passwords use bcrypt" → criterion)
      - obvious edge cases (e.g., "empty input returns 422 not 500" → criterion)
   6. Generate test skeleton files for L2/L3 tasks (with real assertions, not empty shells)
   7. Generate API contract files for L3 tasks (optional)
   8. Generate browser scenario files for L4 tasks
   9. Generate necessary conftest/fixtures
   10. Report spec coverage and any quality issues
   ---

4. After the Initializer finishes, validate the generated material:
   - Confirm feature_tests.json was generated
   - Confirm every spec scenario has a corresponding test
   - Run the generated tests to confirm they all currently FAIL (since the implementation has not been written yet)
   - If tests are not all FAILing (e.g., some pass), the tests may be flawed or the implementation already exists

5. Create `claude-progress.txt`, listing all tasks with status pending.

6. Git commit all initialization files:
   ```bash
   git add changes/$ARGUMENTS/ tests/
   git commit -m "harness: initialize verification material for $ARGUMENTS"
   ```

## Phase 2: Per-Task Execution

For each task in feature_tests.json with `passes: false`, **execute one at a time in order** (do not do them all at once):

### 2a. Coding

Inform the user of the current task and verification level:
```
--- Task {id}: {description} [Level: {verification_level}] ---
Scenarios: {list spec_scenarios}
Pre-generated tests: {list corresponding test functions}
```

Write the implementation code. **Notes**:
- If `pre_generated_tests: true`, do not modify test files — only write implementation code to make the tests pass
- If it is an L4 task, ensure UI elements have data-testid attributes (for Playwright)

After completion:
```bash
git add <changed files>
git commit -m "feat($ARGUMENTS): task {id} - {description}"
```

### 2b. Setup worktree isolation (real, not theater)

Before launching the evaluator, create an isolated git worktree at the
coding agent's committed state. The evaluator will run tests inside
this worktree — it physically cannot see uncommitted changes.

```bash
WORKTREE_PATH=$(node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree.js setup {task_id})
```

Capture the path. If the output starts with `[harness]`, it's a fallback
warning — the script falls back to commit isolation (main cwd) if the
project isn't a git repo or git worktree fails.

### 2c. Independent Evaluation

**Critical: Use the Task tool to launch an independent subagent for evaluation — do not evaluate yourself.**

**Critical: Pass WORKTREE_PATH into the evaluator prompt so it runs commands in the isolated worktree.**

Adjust the evaluator's prompt based on verification_level:

**L1/L2/L3 tasks**:
---
You are a code evaluator. Please verify the implementation of the following task.

WORKING DIRECTORY: {WORKTREE_PATH}

**CRITICAL**: Prefix EVERY Bash call with `cd {WORKTREE_PATH} && ...`
This is an isolated git worktree at the committed state. You cannot see
uncommitted changes from the coding agent.

Task: {id} - {description}
Verification level: {verification_level}
Spec Scenarios:
{list spec_scenarios}

Evaluation rubric (score each criterion independently as PASS/FAIL):
{list evaluation_rubric from feature_tests.json — one criterion per line}

Steps:
1. If there are setup_commands, run them first (prefixed with cd)
2. For each verification command, run it prefixed with `cd {WORKTREE_PATH} &&`
   Example: `cd {WORKTREE_PATH} && pytest tests/test_auth.py -v`
3. For each rubric criterion, determine PASS or FAIL based on test output
4. If there are teardown_commands, run them
5. Output STATUS, SCORE (0-5), LEVEL, CRITERIA (per-criterion breakdown), RESULTS per the format in your system prompt.

**IMPORTANT: Regression check** — after running this task's verification_commands,
also re-run verification_commands from ALL previously passed tasks in feature_tests.json
(each also prefixed with `cd {WORKTREE_PATH}`).
If any previously passing test now fails, report as FAIL with "REGRESSION" in the reason.
---

**L4 tasks**:
---
You are a QA engineer performing black-box testing. Do not read code.

WORKING DIRECTORY: {WORKTREE_PATH}
**Start services FROM the worktree**: `cd {WORKTREE_PATH} && <setup_command>`

Task: {id} - {description}

Evaluation rubric (score each criterion independently as PASS/FAIL):
{list evaluation_rubric from feature_tests.json — one criterion per line}

First run setup_commands from the worktree: `cd {WORKTREE_PATH} && {setup_commands}`

Then use Playwright browser tools to test according to the following scenarios:
{paste browser_verification.scenarios}

For each scenario:
1. Follow the steps sequentially
2. Check assertions against rubric criteria
3. Take screenshots at key steps

After completion, run teardown_commands: `cd {WORKTREE_PATH} && {teardown_commands}`

Output STATUS, SCORE, LEVEL, CRITERIA (per-criterion breakdown), RESULTS per the format in your system prompt.
---

**L5 tasks**:
---
You are a QA engineer.

WORKING DIRECTORY: {WORKTREE_PATH}
Start services from the worktree: `cd {WORKTREE_PATH} && {setup_command}`
Take screenshots per the screenshots configuration: {browser_verification.screenshots}
Save screenshots in changes/$ARGUMENTS/evaluations/screenshots/

Output STATUS: NEEDS_HUMAN_REVIEW
Include the list of screenshot paths.
---

### 2d. Handle Evaluation Results

**PASS (score 4-5)**: Update feature_tests.json (passes=true, score), update claude-progress.txt, git commit, tear down worktree, continue to the next task.

**PASS (score 3)**: Threshold met but quality is thin. Use AskUserQuestion: "Task {id} passed with score 3/5 (acceptable but thin). Accept and continue, or review manually?"

**FAIL (score 0-2)**: Launch fixer subagent (see below). **Do NOT tear down the worktree yet** — the fixer runs against the main working tree (where it can edit), then we'll re-create the worktree for the next evaluation round.

When score 0-2 AND attempts < 3: Use the Task tool to launch a fixer subagent with the following prompt:

---
You are the fixer subagent. A task failed evaluation.

Failing verification commands (extracted from the evaluator report — NOT the evaluator's analysis):
{list only the commands that failed, with their exit codes. Do NOT include the evaluator's ROOT CAUSE, FAILURES description, or any interpretation.}

Task: {id} - {description}

Instructions:
1. Re-run each failing command yourself to get raw output
2. Read the traceback and error messages directly
3. Form your own diagnosis — do NOT look for "ROOT CAUSE" sections
4. Make a minimal fix
5. Re-run the same commands to confirm they pass
6. Git commit the fix with a message describing what YOU observed

Rules:
- Read only implementation code, never test files
- No refactoring, no reformatting, no type-ignore comments
---

After the Fixer finishes and commits:

1. Tear down the old worktree: `node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree.js cleanup {task_id}`
2. Create a fresh worktree at the new HEAD (post-fix): `WORKTREE_PATH=$(node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree.js setup {task_id})`
3. Return to 2c to re-evaluate with a fresh evaluator subagent.

### 2e. Tear down worktree

After the task is accepted (PASS) or abandoned (3 fix attempts failed):
```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/worktree.js cleanup {task_id}
```

This runs even on failure so we don't accumulate orphan worktrees.

**FAIL and attempts >= 3**: Do NOT immediately punt to the user. First, launch the spec-reviewer subagent in **escalation mode** to diagnose the root cause — it reads the proposal/design/specs/tasks plus the accumulated failing test output and categorizes the blocker.

Use the Task tool to launch the spec-reviewer with the following prompt:

---
**Escalation Mode** — Task {id} has failed 3 fix attempts. Diagnose the root cause.

Change: $ARGUMENTS
Change directory: {change directory path}
Task: {id} - {description}
Verification level: {verification_level}
Spec scenarios: {list spec_scenarios}

Accumulated evaluation failures (from each fix attempt):
{paste the last 3 evaluation reports, including raw test output}

Please determine which category this failure belongs to, and output an `escalation_report` JSON (see your system prompt for the schema). Categories:
- CODE_ISSUE — implementation bug, the spec is clear, fix should succeed with more context
- TEST_BUG — the pre-generated test itself is wrong (asserts something spec doesn't mandate)
- SPEC_UNCLEAR — spec is ambiguous/underspecified; no implementation can cleanly satisfy it
- TASK_TOO_BIG — one task conflates multiple features; should be split
---

After the reviewer returns its `escalation_report`, present the diagnosis to the user via AskUserQuestion with options tailored to the category:

- **CODE_ISSUE** → "Launch one more fixer attempt with the reviewer's additional context" / "Abandon this task" / "I'll debug manually"
- **TEST_BUG** → "Rewrite the offending test (exit harness briefly to edit the test file)" / "Mark task as blocked and continue" / "I'll fix it manually"
- **SPEC_UNCLEAR** → "Re-run Phase 0 to strengthen the spec" / "Downgrade to L5 human review" / "Mark task as blocked"
- **TASK_TOO_BIG** → "Split task and regenerate feature_tests.json (re-run Phase 1 for this task)" / "Keep as-is and mark blocked" / "I'll edit tasks.md manually"

In headless mode (`--yes`), do NOT auto-select — always pause and ask. 3 fix failures is a serious signal that warrants human judgement.

Paste the full escalation_report alongside the question so the user has context.

**NEEDS_HUMAN_REVIEW (L5)**: Tell the user the screenshot location, pause, and wait for human confirmation before continuing.

## Phase 3: Completion

**Deactivate harness mode**:
```bash
rm -f .claude/harness-active
```
This tells all hooks to go dormant — normal Claude usage is unaffected after this point.

Output a summary:
- Pass status of each task (level, which attempt it passed on)
- How many tests the Initializer generated and how many scenarios they covered
- Remind the user they can run `/harness:verify` and `/harness:archive`
