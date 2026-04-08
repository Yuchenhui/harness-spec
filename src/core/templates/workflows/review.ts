/**
 * Harness Spec Review Workflow
 *
 * Phase 0: Interactive spec quality review.
 * Reviews proposal → design → specs → tasks chain for verifiability.
 * Presents findings to user via AskUserQuestion for confirmation.
 * Writes approved changes back to specs files.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getOpsxReviewSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-review',
    description: 'Review and strengthen specs before implementation. Checks specificity, verifiability, completeness, and alignment with design decisions. Interactive — you choose which suggestions to accept.',
    instructions: `Review and strengthen specs for a change before implementation begins.

This is an interactive quality gate. The reviewer checks your specs and asks you to confirm improvements.

---

**Input**: Change name or path. If not provided, auto-detect the active change.

**Steps**

1. **Locate the change directory**
   \`\`\`bash
   openspec status --json
   \`\`\`
   Find the change directory with proposal.md, specs/, design.md, and tasks.md.

2. **Read all change files for context**
   - Read proposal.md (extract intent, scope, non-functional requirements)
   - Read design.md if it exists (extract technical decisions, data model constraints)
   - Read all specs files in specs/ (the scenarios to review)
   - Read tasks.md (check alignment with specs)

3. **Review each spec scenario on 5 dimensions**

   For each scenario, evaluate:
   - **Specificity**: Does it have concrete input values, HTTP methods, paths, status codes?
   - **Verifiability**: Can the THEN condition be checked by automated tests?
   - **Completeness**: Are there error cases and edge cases for this feature?
   - **Testability type**: Can we determine L2/L3/L4/L5 verification level?
   - **Independence**: Are dependencies on other scenarios explicit?

4. **Check design-to-spec coverage**

   For each decision in design.md, check if specs have a corresponding scenario.
   Example: design says "email field is unique" → specs should have "Given duplicate email, Then 409".
   Flag gaps as design_gaps.

5. **Check spec-to-task alignment**

   - Are there tasks without corresponding spec scenarios?
   - Are there spec scenarios not covered by any task?

6. **Present findings to user via AskUserQuestion**

   Present in priority order:

   **a. Design gaps** (highest priority):
   Use AskUserQuestion (multiSelect: true):
   "design.md 中的以下决策在 specs 中没有对应的测试场景。要补充吗？"
   Options: each gap as a selectable item, plus "全部跳过"

   **b. Insufficient/vague scenarios**:
   Use AskUserQuestion (multiSelect: true):
   "以下 scenario 建议补强，接受哪些？"
   Options: "接受: '{original}' → '{suggested}'", "跳过", "我自己改"

   **c. Missing error/edge cases**:
   Use AskUserQuestion (multiSelect: true):
   "建议新增以下场景："
   Options: each missing scenario, plus "全部跳过"

   **d. Unverifiable scenarios**:
   Use AskUserQuestion:
   "'{scenario}' 无法自动验证，怎么处理？"
   Options: "降级为 L5 截图人工审查", "改写为具体断言", "删除"

   **e. Task alignment issues**:
   Use AskUserQuestion (multiSelect: true):
   "tasks 和 specs 存在对齐问题："
   Options: suggested fixes, "跳过"

7. **Apply approved changes to spec files**

   For accepted strengthening: use Edit tool to replace the original scenario in-place.
   For accepted new scenarios: append to the relevant spec file with [harness-reviewed] tag.
   For unverifiable downgrades: add [harness-reviewed: L5_human_review] tag.

   Git commit: "specs: strengthen scenarios for <change-name> [harness-reviewed]"

8. **Ask if tasks need regeneration**

   If new scenarios were added:
   Use AskUserQuestion:
   "specs 已更新。新增的场景需要更新 tasks 吗？"
   Options:
   - "不需要，新增场景属于已有 task 的额外验证 (Recommended)"
   - "重新运行 /opsx:tasks 更新任务列表"
   - "我手动调整 tasks.md"

9. **Final confirmation**

   Use AskUserQuestion:
   "Specs 已审查完毕。确认进入下一阶段？"
   Options:
   - "确认 (Recommended)"
   - "我想再看看修改"
   - "重新审查"

After review is complete, the next step is /opsx:apply (which includes test initialization).
`,
  };
}

export function getOpsxReviewCommandTemplate(): CommandTemplate {
  return {
    name: 'review',
    description: 'Review and strengthen specs before implementation',
    category: 'harness',
    tags: ['review', 'specs', 'quality', 'harness'],
    content: `Review and strengthen specs for change: $ARGUMENTS

Run the spec review workflow to check specificity, verifiability,
completeness, and design-to-spec coverage. Interactive — you choose
which suggestions to accept.

After review, run /opsx:apply to start implementation.`,
  };
}
