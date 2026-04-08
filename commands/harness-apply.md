你是 Harness Apply 编排器。用户提供了一个 change-id: $ARGUMENTS

请严格按以下流程执行：

## Phase 0: Spec Review（交互式质量把关）

1. 查找 change 目录。按优先级搜索：
   - `changes/$ARGUMENTS/tasks.md`
   - `**/changes/$ARGUMENTS/tasks.md`
   - 如果都找不到，问用户 tasks.md 在哪里

2. 检查是否已有 `feature_tests.json`（同目录下）：
   - 如果有且部分 passes=true → 跳过 Phase 0 和 Phase 1，进入恢复模式（Phase 2）
   - 如果没有 → 继续

3. **启动 Spec Reviewer subagent 审查 specs。**

   用 Task 工具启动 spec-reviewer agent，prompt 如下：

   ---
   请审查以下 change 的 specs 质量，输出结构化 JSON 报告：

   Change: $ARGUMENTS
   Specs 文件: {specs.md 的路径}
   Tasks 文件: {tasks.md 的路径}
   Proposal 文件: {proposal.md 的路径}
   项目根目录: {pwd}
   ---

4. **解析 Reviewer 的 JSON 报告，用 AskUserQuestion 逐项交互。**

   按以下顺序处理：

   **4a. 如果 quality_score >= 8 且没有 insufficient 问题：**

   用 AskUserQuestion 问用户：

   ```
   问题: "Spec 质量评分 {score}/10，{total} 条 scenario 全部合格。直接开始？"
   选项:
     - "开始 (Recommended)" → 进入 Phase 1
     - "我想先看详细报告" → 展示完整报告后再问
   ```

   **4b. 如果有 issues（需要修改的 scenario）：**

   对每个 issue，用 AskUserQuestion 问用户（可以批量，最多 4 个一组）：

   ```
   问题: "以下 scenario 需要补强，接受建议的修改吗？"
   选项（multiSelect: true）:
     - "接受: '{原始}' → '{建议修改}'" 
     - "接受: '{原始}' → '{建议修改}'"
     - "跳过，保留原样"
     - "我自己改"
   ```

   如果用户选 "我自己改"，等用户提供修改后继续。

   **4c. 如果有 missing_scenarios（建议新增的场景）：**

   用 AskUserQuestion 问用户：

   ```
   问题: "Reviewer 建议为 '{feature}' 新增以下场景，要添加哪些？"
   选项（multiSelect: true）:
     - "[error] {建议的 scenario}" 
     - "[edge] {建议的 scenario}"
     - "[edge] {建议的 scenario}"
     - "全部跳过"
   ```

   **4d. 如果有 unverifiable_scenarios：**

   用 AskUserQuestion 问用户：

   ```
   问题: "以下 scenario 无法自动验证，怎么处理？"
   选项:
     - "降级为 L5 截图人工审查 (Recommended)"
     - "改写为具体断言（我来写）"
     - "删除这条 scenario"
   ```

5. **根据用户选择，回写到 OpenSpec 的 specs.md，保持单一来源。**

   **原则：specs.md 是唯一的 spec 来源。** 审查通过的修改直接写回 specs.md，不创建平行文件，避免 gap。

   回写的具体操作：

   **5a. 补强（strengthen）** — 在原位替换模糊的 scenario：
   ```
   原: - Given valid data, When register, Then succeed
   改: - Given email 'test@example.com' and password 'SecurePass123!',
         When POST /auth/register with JSON body,
         Then response status is 201 and body contains 'user_id'
   ```
   使用 Edit 工具做精确替换，只改用户确认的那些。

   **5b. 新增（supplement）** — 在对应 feature 段落末尾追加，标记 `[harness-reviewed]`：
   ```markdown
   ## User Registration

   - Given valid email and password, When POST /auth/register, Then return 201
   - Given duplicate email, When POST /auth/register, Then return 409
     [harness-reviewed: error_case]
   - Given empty email, When POST /auth/register, Then return 422
     [harness-reviewed: edge_case]
   ```

   **5c. 降级标注（downgrade）** — 无法自动验证的 scenario 原位标注：
   ```
   - The login page should look professional
     [harness-reviewed: L5_human_review]
   ```

   Git commit: `git commit -m "specs: strengthen scenarios for $ARGUMENTS [harness-reviewed]"`

6. **如果新增了 scenario，询问是否需要重新生成 tasks。**

   用 AskUserQuestion：
   ```
   问题: "specs.md 已更新（补强 {n} 条，新增 {m} 条）。新增的场景可能需要更新 tasks。怎么处理？"
   选项:
     - "新增场景属于已有 task 的额外验证，不需要新 task (Recommended)"
       → 大多数 error/edge case 属于已有 task，比如 "register 返回 409" 属于 task "Add register endpoint"
     - "重新运行 /opsx:tasks 更新任务列表"
       → 适用于新增了全新功能场景的情况
     - "我手动调整 tasks.md"
   ```

7. 最终确认进入测试生成阶段：

   用 AskUserQuestion：
   ```
   问题: "specs.md 和 tasks.md 已对齐。确认进入测试生成阶段？"
   选项:
     - "确认，开始生成测试 (Recommended)"
     - "我想再看看 specs.md 的修改"
     - "重新审查 specs"
   ```

   如果用户选 "重新审查"，重新运行 Phase 0。

## Phase 1: 初始化（生成验证材料）

1. **启动 Initializer subagent 生成验证材料。**

   **Initializer 读取 specs.md**（此时已包含审查后的完整 scenarios）。

   用 Task 工具启动 verification-initializer agent，prompt 如下：

   ---
   请为以下 change 生成完整的验证材料。

   Change: $ARGUMENTS
   Specs 文件: {specs.md 的路径}（已包含审查后的完整 scenarios）
   Tasks 文件: {tasks.md 的路径}
   项目根目录: {pwd}

   请：
   1. 读取 specs.md（已经过 Phase 0 审查补强）和 tasks.md
   2. 检查项目技术栈（package.json / requirements.txt / go.mod）
   3. 为每个任务判断 verification_level (L1-L5)
   4. 生成 feature_tests.json
   5. 为 L2/L3 任务生成测试骨架文件（有具体断言，不是空壳）
   6. 为 L3 任务生成 API 契约文件（可选）
   7. 为 L4 任务生成浏览器场景文件
   8. 生成必要的 conftest/fixtures
   9. 报告 spec 覆盖率和任何质量问题
   ---

4. Initializer 完成后，验证生成的材料：
   - 确认 feature_tests.json 已生成
   - 确认每个 spec scenario 有对应测试
   - 运行生成的测试确认它们当前全部 FAIL（因为实现还没写）
   - 如果测试不是全部 FAIL（比如有些 pass 了），说明测试有问题或者实现已存在

5. 创建 `claude-progress.txt`，列出所有任务，状态为 pending。

6. Git commit 所有初始化文件：
   ```bash
   git add changes/$ARGUMENTS/ tests/
   git commit -m "harness: initialize verification material for $ARGUMENTS"
   ```

## Phase 2: 逐任务执行

对 feature_tests.json 中每个 `passes: false` 的任务，**按顺序逐个执行**（不要一次全做）：

### 2a. 编码

告诉用户当前任务和验证级别：
```
--- Task {id}: {description} [Level: {verification_level}] ---
Scenarios: {列出 spec_scenarios}
Pre-generated tests: {列出对应的测试函数}
```

编写实现代码。**注意**：
- 如果 `pre_generated_tests: true`，不要修改测试文件，只写实现让测试通过
- 如果是 L4 任务，确保 UI 元素有 data-testid 属性（给 Playwright 用）

完成后：
```bash
git add <改动的文件>
git commit -m "feat($ARGUMENTS): task {id} - {描述}"
```

### 2b. 独立评估

**关键：用 Task 工具启动一个独立的 subagent 做评估，不要自己评估。**

根据 verification_level 调整 evaluator 的 prompt：

**L1/L2/L3 任务**：
---
你是代码评估者。请验证以下任务的实现：

任务: {id} - {description}
验证级别: {verification_level}
Spec Scenarios:
{列出 spec_scenarios}

步骤：
1. 运行验证命令：{列出 verification_commands}
2. 如果有 setup_commands，先运行它们
3. 检查每个 spec scenario 是否有对应的通过测试
4. 如果有 teardown_commands，运行它们
5. 输出 STATUS: PASS 或 FAIL
---

**L4 任务**：
---
你是 QA 工程师，做黑盒测试。不要读代码。

任务: {id} - {description}

先运行 setup_commands 启动服务：{setup_commands}

然后使用 Playwright 浏览器工具按以下场景测试：
{粘贴 browser_verification.scenarios}

对每个场景：
1. 按 steps 逐步操作
2. 检查 assertions
3. 关键步骤截图

完成后运行 teardown_commands：{teardown_commands}

输出 STATUS: PASS 或 FAIL
---

**L5 任务**：
---
你是 QA 工程师。

先运行 setup_commands 启动服务。
按 screenshots 配置截图：{browser_verification.screenshots}
将截图保存在 changes/$ARGUMENTS/evaluations/screenshots/

输出 STATUS: NEEDS_HUMAN_REVIEW
附上截图路径列表。
---

### 2c. 根据评估结果处理

**PASS**: 更新 feature_tests.json（passes=true），更新 claude-progress.txt，git commit，继续下一个任务。

**FAIL 且 attempts < 3**: 用 Task 工具启动 fixer subagent，prompt 如下：

---
你是代码修复者。请根据以下评估结果修复代码：

评估结果：
{粘贴 evaluator 的输出}

规则：
- 只修改评估中指出的问题
- 不要修改 Initializer 生成的测试文件
- 不要做额外重构
- 修复后运行失败的测试确认通过
- git commit 修复
---

Fixer 完成后，回到 2b 重新评估。

**FAIL 且 attempts >= 3**: 停下来，告诉用户这个任务 3 次修复都没过，贴出最新的评估结果，问用户怎么处理。

**NEEDS_HUMAN_REVIEW (L5)**: 告诉用户截图位置，暂停等待人工确认后继续。

## Phase 3: 完成

所有任务 PASS 后（L5 任务需要人工确认），输出汇总：
- 每个任务的通过情况（级别、第几次通过）
- Initializer 生成了多少测试，覆盖了多少 scenarios
- 提示用户可以运行 `/opsx:verify` 和 `/opsx:archive`
