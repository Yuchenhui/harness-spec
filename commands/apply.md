You are the Harness Apply orchestrator. The user has provided a change-id: $ARGUMENTS

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
```
- If there are uncommitted changes: warn the user "Uncommitted changes detected. Commit or stash before starting harness."
- If a previous `.claude/harness-active` exists: ask "A previous harness session was interrupted. Resume it or start fresh?"
- Run the project's existing test command (if detectable) to confirm the baseline is green. If tests fail before we start, flag it.

## Phase 0: Spec Review (Interactive Quality Gate)

1. Locate the change directory. Search in priority order:
   - `changes/$ARGUMENTS/tasks.md`
   - `**/changes/$ARGUMENTS/tasks.md`
   - If neither is found, ask the user where tasks.md is located

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

4. **Parse the Reviewer's JSON report and interact with the user item by item via AskUserQuestion, in priority order.**

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

5. **Based on user selections, write changes back to OpenSpec's specs.md to maintain a single source of truth.**

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
     - "Re-run /opsx:tasks to update the task list"
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
   2. Check the project tech stack (package.json / requirements.txt / go.mod)
   3. Determine verification_level (L1-L5) for each task
   4. Generate feature_tests.json
   5. Generate test skeleton files for L2/L3 tasks (with real assertions, not empty shells)
   6. Generate API contract files for L3 tasks (optional)
   7. Generate browser scenario files for L4 tasks
   8. Generate necessary conftest/fixtures
   9. Report spec coverage and any quality issues
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

### 2b. Independent Evaluation

**Critical: Use the Task tool to launch an independent subagent for evaluation — do not evaluate yourself.**

Adjust the evaluator's prompt based on verification_level:

**L1/L2/L3 tasks**:
---
You are a code evaluator. Please verify the implementation of the following task:

Task: {id} - {description}
Verification level: {verification_level}
Spec Scenarios:
{list spec_scenarios}

Steps:
1. Run verification commands: {list verification_commands}
2. If there are setup_commands, run them first
3. Check whether each spec scenario has a corresponding passing test
4. If there are teardown_commands, run them
5. Output STATUS: PASS or FAIL, and CONFIDENCE: high/medium/low.

**IMPORTANT: Regression check** — after running this task's verification_commands,
also re-run verification_commands from ALL previously passed tasks in feature_tests.json.
If any previously passing test now fails, report as FAIL with "REGRESSION" in the reason.
---

**L4 tasks**:
---
You are a QA engineer performing black-box testing. Do not read code.

Task: {id} - {description}

First run setup_commands to start services: {setup_commands}

Then use Playwright browser tools to test according to the following scenarios:
{paste browser_verification.scenarios}

For each scenario:
1. Follow the steps sequentially
2. Check assertions
3. Take screenshots at key steps

After completion, run teardown_commands: {teardown_commands}

Output STATUS: PASS or FAIL
---

**L5 tasks**:
---
You are a QA engineer.

First run setup_commands to start services.
Take screenshots per the screenshots configuration: {browser_verification.screenshots}
Save screenshots in changes/$ARGUMENTS/evaluations/screenshots/

Output STATUS: NEEDS_HUMAN_REVIEW
Include the list of screenshot paths.
---

### 2c. Handle Evaluation Results

**PASS (confidence: high/medium)**: Update feature_tests.json (passes=true), update claude-progress.txt, git commit, continue to the next task.

**PASS (confidence: low)**: Tests pass but evaluator has concerns. Use AskUserQuestion: "Evaluator says PASS but with low confidence: {reason}. Accept and continue, or review manually?"

**FAIL and attempts < 3**: Use the Task tool to launch a fixer subagent with the following prompt:

---
You are a code fixer. Please fix the code based on the following evaluation results:

Evaluation results:
{paste evaluator output}

Rules:
- Only fix the issues identified in the evaluation
- Do not modify test files generated by the Initializer
- Do not perform additional refactoring
- After fixing, run the previously failing tests to confirm they pass
- Git commit the fix
---

After the Fixer finishes, return to 2b to re-evaluate.

**FAIL and attempts >= 3**: Stop and tell the user this task has failed 3 fix attempts. Paste the latest evaluation results and ask the user how to proceed.

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
