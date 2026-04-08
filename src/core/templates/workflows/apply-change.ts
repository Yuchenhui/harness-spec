/**
 * Harness Apply Workflow
 *
 * Enhanced version of OpenSpec's apply workflow.
 * Adds: Spec Review (Phase 0), Test Initialization (Phase 1),
 * independent evaluation, auto-fix loop, and cross-session recovery.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const HARNESS_APPLY_INSTRUCTIONS = `Implement tasks from a change with harness engineering verification.

**Input**: Optionally specify a change name. If omitted, auto-detect.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Auto-select if only one active change exists
   - If ambiguous, run \`openspec list --json\` and use **AskUserQuestion** to let the user select

   Always announce: "Using change: <name>"

2. **Check status**
   \`\`\`bash
   openspec status --change "<name>" --json
   \`\`\`
   Parse the JSON to understand current state and which artifacts exist.

3. **Check for existing feature_tests.json (resume mode)**

   Look for \`feature_tests.json\` in the change directory.
   - If exists with some \`passes: true\` → **Resume mode**: skip to Phase 2, continue from first \`passes: false\` task
   - If exists with all \`passes: false\` → **Continue mode**: skip to Phase 2
   - If not exists → **Full mode**: run Phase 0, Phase 1, then Phase 2

---

## Phase 0: Spec Review (interactive quality gate)

**Skip if**: feature_tests.json already exists (resuming).

4. **Run spec review**

   Read all change files (proposal.md, design.md, specs/, tasks.md).

   Review each spec scenario for:
   - Specificity (concrete values?)
   - Verifiability (can be tested automatically?)
   - Completeness (error/edge cases?)
   - Design coverage (design decisions reflected in specs?)
   - Task alignment (specs ↔ tasks match?)

5. **Present findings via AskUserQuestion**

   Priority order:

   **a. Design gaps** (design decisions without spec coverage):
   \`\`\`
   AskUserQuestion (multiSelect: true):
   "design.md 中的以下决策在 specs 中没有对应的测试场景。要补充吗？"
   \`\`\`

   **b. Vague scenarios** (need strengthening):
   \`\`\`
   AskUserQuestion (multiSelect: true):
   "以下 scenario 建议补强："
   Options: "接受: '{original}' → '{suggested}'"
   \`\`\`

   **c. Missing error/edge cases**:
   \`\`\`
   AskUserQuestion (multiSelect: true):
   "建议新增以下场景："
   \`\`\`

   **d. Unverifiable scenarios**:
   \`\`\`
   AskUserQuestion:
   "'{scenario}' 无法自动验证，怎么处理？"
   Options: "降级为 L5", "改写", "删除"
   \`\`\`

6. **Apply approved changes to spec files**

   Strengthen in-place (Edit tool). Append new scenarios with [harness-reviewed] tag.
   Git commit: "specs: strengthen scenarios for <name> [harness-reviewed]"

---

## Phase 1: Test Initialization (generate verification material)

**Skip if**: feature_tests.json already exists (resuming).

7. **Detect project tech stack**

   Check for package.json, requirements.txt, go.mod, etc.
   Determine test framework (pytest, jest, go test, etc.)

8. **Assign verification_level per task**
   - Model/utility → L2 (Unit)
   - API endpoint → L3 (Integration)
   - UI page → L4 (E2E/Browser)
   - Pure styling → L5 (Visual)

9. **Generate test skeleton files**

   For L2/L3 tasks: create test files with real assertions from spec scenarios.
   Follow existing test conventions in the project.
   Each spec scenario → at least one test function with assert statements.
   Add edge case tests (empty input, duplicates, etc.)

10. **Generate feature_tests.json**

    \`\`\`json
    {
      "change_id": "<name>",
      "evaluation_config": {"max_retries": 3, "tdd_mode": true},
      "tasks": [{
        "id": "1.1", "description": "...",
        "spec_scenarios": ["..."],
        "verification_level": "L2",
        "pre_generated_tests": true,
        "verification_commands": ["pytest tests/test_xxx.py -v"],
        "passes": false, "evaluation_attempts": 0
      }]
    }
    \`\`\`

11. **Generate claude-progress.txt**

12. **Verify all tests FAIL** (TDD red phase)

    Run the generated tests. They should ALL fail because no implementation exists yet.
    If any pass → the test has no real assertion, fix it.

13. **Git commit** initialization files.

---

## Phase 2: Code → Evaluate → Fix Loop

14. **For each task with passes: false, execute sequentially:**

    **a. Show task info:**
    \`\`\`
    --- Task {id}: {description} [Level: {verification_level}] ---
    Scenarios: {list}
    Pre-generated tests: {list test functions}
    \`\`\`

    **b. Implement the task**

    Write implementation code. If pre_generated_tests is true, do NOT modify test files.
    For L4 tasks, ensure UI elements have data-testid attributes.

    **Available agents during coding** (user can @mention if needed):
    - @python-expert, @backend-architect, @frontend-architect (language/domain help)
    - @idempotent-db-script-generator (database migration tasks)
    - @security-engineer (auth/permission tasks)

    Git commit using /git-commit (smart grouping + conventional format),
    or manually: "feat(<name>): task {id} - {description}"

    **c. Evaluate independently**

    **CRITICAL: Use the Task tool to launch an evaluator subagent. Do NOT evaluate yourself.**

    The evaluator subagent prompt depends on verification_level:

    For L1/L2/L3:
    ---
    You are a code evaluator. Verify the following task:
    Task: {id} - {description}
    Level: {verification_level}
    Run these commands: {verification_commands}
    If there are setup_commands, run them first.
    Check each spec scenario has a passing test.
    Output: STATUS: PASS or FAIL with details.
    ---

    For L4 (Browser):
    ---
    You are a QA engineer doing black-box testing. Do NOT read source code.
    Task: {id} - {description}
    Start the app: {setup_commands}
    Use Playwright browser tools to test: {browser_verification.scenarios}
    Take screenshots at key steps.
    Output: STATUS: PASS or FAIL
    ---

    For L5 (Visual):
    ---
    Start the app: {setup_commands}
    Take screenshots: {browser_verification.screenshots}
    Save to evaluations/screenshots/
    Output: STATUS: NEEDS_HUMAN_REVIEW
    ---

    **d. Handle result**

    **PASS**: Update feature_tests.json (passes: true), update claude-progress.txt, git commit. Next task.

    **FAIL (attempts < 3)**: Launch fixer subagent (Task tool):
    ---
    Fix the code based on this evaluation report: {report}
    Rules: only fix what failed, don't modify test files, git commit.
    ---
    After fix, re-evaluate (go to step c).

    **FAIL (attempts >= 3)**: Pause. Show evaluation report. Ask user:
    \`\`\`
    AskUserQuestion:
    "Task {id} 经过 3 次修复仍未通过。"
    Options: "我来手动修复", "跳过继续下一个", "查看完整报告"
    \`\`\`

    **NEEDS_HUMAN_REVIEW (L5)**: Show screenshot paths. Ask user to confirm.

---

## Phase 3: Completion

15. **When all tasks pass**, show summary:

    \`\`\`
    ## Implementation Complete (Harness Verified)

    **Change:** <name>
    **Progress:** {n}/{n} tasks complete ✓

    ### Results
    - Task 1.1 [L2] PASS (1st attempt)
    - Task 1.2 [L3] PASS (2nd attempt, 1 auto-fix)
    - Task 2.1 [L4] PASS (1st attempt, browser verified)
    ...

    ### Stats
    - Pre-generated tests: {n}
    - Auto-fixes: {n}
    - Evaluation reports: changes/<name>/evaluations/

    ### Next Steps
    - /opsx:verify — final verification
    - /opsx:archive — archive the change
    \`\`\`

**Guardrails**
- Execute tasks ONE AT A TIME, never batch
- Always use Task tool for evaluation (independent context)
- Never modify pre-generated test files during coding
- Update progress files after each task completion
- The Stop hook will prevent exiting if tasks remain incomplete`;

export function getApplyChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-apply-change',
    description: 'Implement tasks from a change with harness engineering verification — spec review, test generation, independent evaluation, and auto-fix loop.',
    instructions: HARNESS_APPLY_INSTRUCTIONS,
    license: 'MIT',
    compatibility: 'Requires openspec CLI and Claude Code.',
    metadata: { author: 'harness-spec', version: '2.0' },
  };
}

export function getOpsxApplyCommandTemplate(): CommandTemplate {
  return {
    name: 'OPSX: Apply',
    description: 'Implement tasks with harness verification (review → tests → code → evaluate → fix)',
    category: 'Workflow',
    tags: ['workflow', 'harness', 'apply', 'verification'],
    content: HARNESS_APPLY_INSTRUCTIONS,
  };
}
