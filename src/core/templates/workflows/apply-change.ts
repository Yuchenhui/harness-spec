/**
 * Harness Apply Workflow
 *
 * Orchestrator pattern: coordinates phases, delegates details to agents.
 * Each agent (spec-reviewer, initializer, evaluator, fixer) has its own
 * instruction file. This workflow only manages flow control and transitions.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const HARNESS_APPLY_INSTRUCTIONS = `Implement tasks from a change with harness engineering verification.

**Input**: Change name (optional — auto-detects if only one active change).

## 1. Select Change and Detect Mode

Run \`openspec status --json\` to find active changes. If ambiguous, use AskUserQuestion.

Check for \`feature_tests.json\` in the change directory:
- **Exists with some passes:true** → Resume mode: skip to Phase 2, first \`passes:false\` task
- **Exists with all passes:false** → Continue mode: skip to Phase 2
- **Does not exist** → Full mode: Phase 0 → Phase 1 → Phase 2

---

## Phase 0: Spec Review

**Skip if**: feature_tests.json already exists.

Launch the **spec-reviewer** agent as a subagent (Task tool). Pass it:
- The change directory path
- proposal.md, design.md (if exists), specs/, tasks.md paths

The reviewer outputs a JSON report. Parse it and use AskUserQuestion to present findings:
1. Design gaps → multiSelect which to add as specs
2. Vague scenarios → accept strengthening or skip
3. Missing error/edge cases → multiSelect which to add
4. Unverifiable scenarios → downgrade to L5 / rewrite / delete
5. Task alignment issues → accept fixes or skip

Apply accepted changes to specs files (Edit tool). Tag additions with [harness-reviewed].
If new scenarios added, ask if tasks.md needs regeneration.
Git commit: "specs: strengthen scenarios [harness-reviewed]"

---

## Phase 1: Test Initialization

**Skip if**: feature_tests.json already exists.

Launch the **initializer** agent as a subagent. Pass it:
- The change directory path with reviewed specs and tasks
- The project root for tech stack detection

The initializer generates: feature_tests.json, test skeleton files, API contracts, browser scenarios.
Verify all generated tests currently FAIL (red phase). Git commit initialization files.

---

## Phase 2: Code → Evaluate → Fix Loop

For each task in feature_tests.json with \`passes: false\`, sequentially:

**a. Code**: Show the task info (id, description, verification_level, pre-generated tests).
Write implementation code. Do NOT modify test files if pre_generated_tests is true.
Git commit: "feat(<change>): task <id> - <description>"

**b. Evaluate**: Launch the **evaluator** agent as a subagent. Pass it:
- Task id, description, verification_level
- spec_scenarios and verification_commands
- setup_commands and teardown_commands (if any)
- browser_verification (if L4)
The evaluator returns STATUS: PASS, FAIL, or NEEDS_HUMAN_REVIEW.

**c. Handle result**:
- PASS → update feature_tests.json (passes:true), update claude-progress.txt, git commit, next task
- FAIL (attempts < 3) → launch **fixer** agent with the evaluation report, then re-evaluate
- FAIL (attempts >= 3) → pause, show report, AskUserQuestion: manual fix / skip / view report
- NEEDS_HUMAN_REVIEW (L5) → show screenshot paths, wait for user confirmation

---

## Phase 3: Completion

All tasks passed. Show summary:
- Each task: level, pass/fail, attempt count
- Total pre-generated tests, auto-fixes, evaluation reports
- Next steps: /opsx:verify → /opsx:archive

---

## Guardrails
- Execute tasks ONE AT A TIME
- Always use Task tool for evaluation (independent context)
- Never modify pre-generated test files
- The Stop hook prevents exiting if tasks remain incomplete`;

export function getApplyChangeSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-apply-change',
    description: 'Implement tasks with harness engineering: spec review, test generation, independent evaluation, and auto-fix loop.',
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
