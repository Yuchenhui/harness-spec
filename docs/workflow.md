# 完整工作流指南

## 概览

完整的 OpenSpec + Harness 工作流分为 6 个阶段：

```
提案 → 规约 → 任务拆解 → 增强执行 → 验证 → 归档
 │       │        │          │          │       │
 └ OpenSpec ───────┘    └ Harness ┘    └ OpenSpec ┘
```

## 阶段 1: 提案 (Propose)

**工具**: OpenSpec `/opsx:propose`

```
/opsx:propose "add-user-authentication"
```

OpenSpec 会在 `changes/add-user-authentication/` 目录下创建提案文件，包含变更的高层描述、动机和范围。

**Harness 在此阶段不介入。**

## 阶段 2: 规约 (Specs)

**工具**: OpenSpec `/opsx:specs`

```
/opsx:specs
```

OpenSpec 将提案展开为详细的 spec scenarios（Given/When/Then 格式）。这些 scenarios 将成为后续 harness 评估的依据。

**重要**：确保 scenarios 是可验证的。避免模糊描述如"用户体验良好"，使用具体断言如"响应时间 < 200ms"。

## 阶段 3: 任务拆解 (Tasks)

**工具**: OpenSpec `/opsx:tasks`

```
/opsx:tasks
```

OpenSpec 将 specs 拆解为具体的开发任务，写入 `tasks.md`。

**Harness 在此阶段不介入。**

## 阶段 4: 增强执行 (Harness Apply)

**工具**: Harness `/harness-apply`

这是 Harness 的核心阶段，替代直接使用 `/opsx:apply`。

```
/harness-apply add-user-authentication
```

### 4.1 初始化 (Initialize)

Harness 首先读取 tasks.md，为每个任务生成可验证的 feature_tests.json：

```json
{
  "change_id": "add-user-authentication",
  "tasks": [
    {
      "id": "1.1",
      "description": "Create User model with password hashing",
      "spec_scenarios": [
        "Given a new user registration, When password is provided, Then it is stored as bcrypt hash",
        "Given User model, When queried by email, Then returns user object or None"
      ],
      "verification_commands": [
        "pytest tests/models/test_user.py -v",
        "python -c \"from app.models import User; print(User.__tablename__)\""
      ],
      "passes": false
    },
    {
      "id": "1.2",
      "description": "Add /auth/register endpoint",
      "spec_scenarios": [
        "Given valid email and password, When POST /auth/register, Then return 201 with user_id",
        "Given duplicate email, When POST /auth/register, Then return 409 Conflict"
      ],
      "verification_commands": [
        "pytest tests/api/test_auth.py::test_register -v",
        "pytest tests/api/test_auth.py::test_register_duplicate -v"
      ],
      "passes": false
    }
  ]
}
```

### 4.2 逐任务执行循环

对每个任务，执行以下循环：

```
┌─────────────────────────────────────────┐
│            Task 1.1                      │
│                                          │
│  ┌──────────┐     ┌──────────────┐       │
│  │  Coding  │────→│   git commit │       │
│  │  Agent   │     └──────┬───────┘       │
│  └──────────┘            │               │
│                          ▼               │
│                 ┌──────────────┐         │
│                 │  Evaluator   │         │
│                 │  (subagent)  │         │
│                 └──────┬───────┘         │
│                        │                 │
│              ┌─────────┴─────────┐       │
│              │                   │       │
│          PASS ▼               FAIL ▼     │
│     ┌──────────┐         ┌──────────┐   │
│     │  Update   │         │  Fixer   │   │
│     │ progress  │         │ (subagent)│  │
│     │ & next    │         └────┬─────┘   │
│     └──────────┘              │          │
│                          retry < 3?      │
│                          yes → evaluator │
│                          no  → 暂停      │
└─────────────────────────────────────────┘
```

### 4.3 Coding Agent 执行

主 session 的 Claude Code 执行当前任务：

- 只关注当前任务的 spec scenarios
- 编写实现代码
- 编写对应的测试
- 完成后 `git commit`

**关键约束**：不要让 coding agent 自行判断是否完成，也不要让它跳到下一个任务。

### 4.4 Evaluator 验证

启动独立的 evaluator subagent：

```
Task: 验证任务 1.1 "Create User model with password hashing" 的实现

读取 feature_tests.json 中任务 1.1 的验证步骤：
1. 运行 pytest tests/models/test_user.py -v
2. 运行 python -c "from app.models import User; print(User.__tablename__)"

检查每个 spec scenario 是否被测试覆盖：
- "Given a new user registration, When password is provided, Then it is stored as bcrypt hash"
- "Given User model, When queried by email, Then returns user object or None"

输出 PASS 或 FAIL，如果 FAIL 写明具体原因。
```

Evaluator 的输出格式：

```
## Evaluation Report: Task 1.1

**Status: FAIL**

### Verification Results
- pytest tests/models/test_user.py: 2 passed, 1 failed
  - FAIL: test_password_is_bcrypt_hashed — AssertionError: password stored as plaintext

### Scenario Coverage
- ✅ "Given User model, When queried by email, Then returns user object or None"
- ❌ "Given a new user registration, When password is provided, Then it is stored as bcrypt hash"
  - Issue: User.set_password() stores raw password, not bcrypt hash

### Suggested Fix
- In app/models/user.py, User.set_password() method needs to use bcrypt.hashpw()
```

### 4.5 Fixer 修复（如需要）

如果评估失败，启动 fixer subagent：

```
Task: 修复任务 1.1 的评估失败

评估报告：
- User.set_password() 存储了明文密码，应使用 bcrypt hash

修复要求：
1. 修改 app/models/user.py 的 set_password 方法
2. 确保 pytest tests/models/test_user.py 全部通过
3. git commit 修复
```

修复完成后，再次启动 evaluator 验证。最多重试 3 次。

### 4.6 进度更新

每个任务通过后，更新两个文件：

1. **feature_tests.json** — 标记 `passes: true`
2. **claude-progress.txt** — 更新完成列表和当前状态

## 阶段 5: 验证 (Verify)

**工具**: OpenSpec `/opsx:verify`

```
/opsx:verify
```

所有任务通过 harness 评估后，使用 OpenSpec 的 verify 做最终确认。

## 阶段 6: 归档 (Archive)

**工具**: OpenSpec `/opsx:archive`

```
/opsx:archive
```

将完成的变更归档。harness 的 feature_tests.json 和 evaluation reports 可以一并归档，作为实现质量的证据。

## 跨 Session 恢复

当你开启新的 Claude Code session 继续之前的工作时：

1. Agent 读取 `claude-progress.txt` 了解当前状态
2. 读取 `feature_tests.json` 找到下一个 `passes: false` 的任务
3. 读取最近的 git log 理解代码变更历史
4. 从断点处继续执行

**示例恢复流程**：

```
> 继续 add-user-authentication 的开发

Claude: 读取 claude-progress.txt...
  状态: 3/7 任务完成
  最后完成: 2.1 Update header component (commit: ghi9012)
  下一个任务: 2.2 Update sidebar component

继续执行任务 2.2...
```

## 异常处理

### 评估 3 次仍失败

```
⚠️ 任务 1.1 "Create User model" 经过 3 次修复仍未通过评估。

最近的评估报告：
- test_password_complexity_validation 持续失败
- 可能原因：需求理解偏差，password complexity 规则未在 spec 中明确

建议：
1. 检查 specs.md 中关于密码复杂度的描述
2. 手动审查 evaluator 的报告
3. 决定是修改 spec 还是手动修复代码

继续下一个任务？还是先解决这个问题？
```

### 上下文窗口接近耗尽

```
⚠️ 上下文使用率 > 80%，当前在任务 4/7。

自动操作：
1. 保存 claude-progress.txt（已完成任务 1-3）
2. git commit 当前进度
3. 建议开启新 session 继续

新 session 启动后运行：
/harness-apply add-user-authentication --resume
```
