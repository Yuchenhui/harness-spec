# Harness Apply

> 增强版的 OpenSpec apply，集成评估-修复循环和进度追踪。

## 使用方式

```
/harness-apply <change-id>
```

或恢复之前中断的执行：

```
/harness-apply <change-id> --resume
```

## 执行流程

当用户调用 `/harness-apply <change-id>` 时，按以下步骤执行：

### Phase 1: 初始化

1. **定位 change 目录**: 读取 `changes/<change-id>/tasks.md`
2. **检查是否有 feature_tests.json**:
   - 如果存在且有 `passes: true` 的任务 → 进入恢复模式
   - 如果不存在 → 进入初始化模式

3. **初始化模式 — 生成 feature_tests.json**:

   读取 `tasks.md` 和 `specs.md`，为每个任务生成可验证的条目：

   ```json
   {
     "change_id": "<change-id>",
     "created_at": "<timestamp>",
     "evaluation_config": {
       "max_retries": 3,
       "require_test_coverage": true,
       "require_lint_pass": true
     },
     "tasks": [
       {
         "id": "1.1",
         "description": "从 tasks.md 中的任务描述",
         "spec_scenarios": ["从 specs.md 中提取的相关 scenarios"],
         "verification_commands": ["根据项目类型生成的测试命令"],
         "passes": false,
         "last_evaluated": null,
         "evaluation_attempts": 0
       }
     ]
   }
   ```

   **生成 verification_commands 的规则**:
   - Python/pytest 项目: `pytest tests/test_xxx.py -v`
   - Node/Jest 项目: `npx jest tests/xxx.test.ts`
   - Go 项目: `go test ./pkg/xxx/...`
   - 如果 scenario 涉及 API: 添加 curl 命令
   - 如果 scenario 涉及 CLI: 添加命令行验证

4. **初始化 claude-progress.txt**:

   ```
   # Progress: <change-id>
   ## Last Updated: <timestamp>
   ## Status: IN_PROGRESS (0/<total> tasks completed)

   ### Completed
   (none)

   ### Remaining
   - [ ] 1.1 <description>
   - [ ] 1.2 <description>
   ...
   ```

5. **Git commit 初始化文件**:
   ```bash
   git add changes/<change-id>/feature_tests.json changes/<change-id>/claude-progress.txt
   git commit -m "harness: initialize feature_tests for <change-id>"
   ```

### Phase 2: 逐任务执行

对 feature_tests.json 中每个 `passes: false` 的任务，按顺序执行：

#### 2a. 执行任务 (Coding)

告知用户当前任务：
```
📋 Task {id}: {description}
   Scenarios: {列出 spec_scenarios}
   开始编码...
```

执行编码工作：
- 只关注当前任务的 spec scenarios
- 编写实现代码
- 编写对应测试（如果还没有）
- 完成后 git commit:
  ```bash
  git add <changed-files>
  git commit -m "feat(<change-id>): implement task {id} - {short-description}"
  ```

#### 2b. 评估 (Evaluate)

启动 evaluator subagent:

```
使用 Task 工具启动 implementation-evaluator agent:

输入:
- task_id: {id}
- description: {description}
- spec_scenarios: {scenarios}
- verification_commands: {commands}
- attempt: {evaluation_attempts + 1}
- project_root: {pwd}
- change_dir: changes/<change-id>/

要求: 生成评估报告并返回 PASS 或 FAIL
```

保存评估报告:
```bash
# 保存报告到 evaluations 目录
mkdir -p changes/<change-id>/evaluations/
# 报告内容写入 task-{id}-attempt-{n}.md
```

#### 2c. 判定与处理

**如果 PASS:**
```
✅ Task {id}: PASS (attempt {n})

更新 feature_tests.json:
- passes: true
- last_evaluated: <timestamp>
- evaluation_attempts: {n}

更新 claude-progress.txt:
- 移动到 Completed 列表
- 记录 commit hash

Git commit 进度更新
→ 进入下一个任务
```

**如果 FAIL 且 attempts < max_retries:**
```
❌ Task {id}: FAIL (attempt {n}/3)
   原因: {来自评估报告的摘要}
   启动修复...

启动 fixer subagent:
- 输入: 评估报告内容
- 任务: 根据报告修复问题
- 完成后: 重新触发评估 (2b)
```

**如果 FAIL 且 attempts >= max_retries:**
```
⚠️ Task {id}: 经过 {max_retries} 次修复仍未通过

最近的评估报告:
{报告摘要}

选项:
1. 查看完整评估报告
2. 手动修复后继续
3. 跳过此任务继续下一个
4. 修改 spec scenarios 后重试
```

暂停等待用户决策。

### Phase 3: 完成

所有任务通过后：

```
🎉 所有 {total} 个任务已通过评估

Summary:
- Task 1.1: PASS (1st attempt)
- Task 1.2: PASS (2nd attempt, 1 fix applied)
- Task 2.1: PASS (1st attempt)
...

评估报告保存在: changes/<change-id>/evaluations/

下一步:
- /opsx:verify  — 最终验证
- /opsx:archive — 归档变更
```

### 恢复模式 (--resume)

当使用 `--resume` 或检测到已有 feature_tests.json 时：

1. 读取 `claude-progress.txt` 和 `feature_tests.json`
2. 找到第一个 `passes: false` 的任务
3. 读取最近的 git log 了解上下文
4. 从该任务的 Phase 2 开始执行

```
🔄 恢复执行: <change-id>
   状态: {completed}/{total} 任务已完成
   上次完成: Task {last_id} (commit: {hash})
   继续: Task {next_id} — {description}
```

## 上下文管理

### 上下文窗口监控

如果感知到上下文窗口使用率较高（对话很长），主动：

1. 保存当前进度到 claude-progress.txt
2. Git commit 所有未提交的改动
3. 提示用户:
   ```
   ⚠️ 上下文窗口接近上限，建议开启新 session。

   当前进度已保存。新 session 中运行:
   /harness-apply <change-id> --resume
   ```

### 每个任务后的清理

完成一个任务后，在开始下一个之前：
- 确保所有改动已 commit
- progress.txt 已更新
- 不要在内存中保留上一个任务的详细代码内容
