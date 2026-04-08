# 完整使用指南

## TL;DR

```bash
# 一次性安装（plugin 方式或手动复制）
/plugin marketplace add yuchenhui/harness-spec
/plugin install harness-spec@harness-spec

# 日常使用：只有一个命令不同
/opsx:propose "add-xxx"                    # ← OpenSpec（不变）
/opsx:specs                                # ← OpenSpec（不变）
/opsx:tasks                                # ← OpenSpec（不变）
/project:harness-apply add-xxx             # ← 用这个替代 /opsx:apply
/opsx:verify                               # ← OpenSpec（不变）
/opsx:archive                              # ← OpenSpec（不变）
```

---

## 安装（一次性）

### 方式 A：Plugin 安装

```bash
/plugin marketplace add yuchenhui/harness-spec
/plugin install harness-spec@harness-spec
```

### 方式 B：手动复制

```bash
cd ~/your-project
cp -r /path/to/harness-spec/templates/.claude/ .claude/
chmod +x .claude/hooks/*.sh
git add .claude/ && git commit -m "chore: add harness templates"
```

### 方式 C：如果需要 UI 验证，额外安装 Playwright MCP

```bash
npm install -D @playwright/mcp
claude mcp add playwright -- npx @playwright/mcp@latest --headless
```

安装后你的项目多了这些文件：

```
.claude/
├── agents/
│   ├── initializer.md     ← 从 specs 生成测试骨架（编码前运行）
│   ├── evaluator.md       ← 独立验证实现
│   └── fixer.md           ← 根据评估报告修复
├── commands/
│   └── harness-apply.md   ← /project:harness-apply 命令
├── hooks/
│   ├── stop-check.sh      ← 任务没完成不让退出
│   ├── session-init.sh    ← 新 session 自动显示进度
│   └── post-tool-notify.sh ← commit 后提醒评估
└── skills/
    └── progress-tracker/
        └── SKILL.md       ← 跨 session 恢复
```

---

## 完整使用流程

### 第 1 步：用 OpenSpec 定义需求（不变）

```
你: /opsx:propose "add-user-auth"
```

OpenSpec 生成 proposal.md。你审查、调整。

```
你: /opsx:specs
```

OpenSpec 生成 specs.md，包含 Given/When/Then 场景。

**提示**：specs 写得越具体，Initializer 生成的测试越好。好的 spec：

```markdown
# 好 — Initializer 能生成精确测试
- Given valid email "test@example.com" and password "Pass123!"
  When POST /auth/register with JSON body
  Then response status is 201
  And response body contains "user_id"
  And response body does NOT contain "password"

# 坏 — 太模糊，Initializer 会报告质量问题
- The registration should work properly
```

```
你: /opsx:tasks
```

OpenSpec 拆解为 tasks.md。

此时你的 change 目录：

```
changes/add-user-auth/
├── proposal.md       ← OpenSpec
├── specs.md          ← OpenSpec
└── tasks.md          ← OpenSpec
```

### 第 2 步：运行 harness-apply（替代 /opsx:apply）

```
你: /project:harness-apply add-user-auth
```

以下全部自动完成：

---

#### Phase 1：Initializer 生成验证材料

```
🔧 Phase 1: 初始化
   启动 Initializer subagent...

   Initializer 正在：
   ├── 读取 specs.md（12 个 scenarios）
   ├── 读取 tasks.md（6 个任务）
   ├── 检测项目技术栈：Python 3.12 / FastAPI / pytest
   ├── 判断每个任务的验证级别...
   │   ├── Task 1.1 Create User model        → L2 (Unit)
   │   ├── Task 1.2 Add /auth/register       → L3 (Integration)
   │   ├── Task 2.1 Add /auth/login          → L3 (Integration)
   │   ├── Task 2.2 Add JWT middleware        → L2 (Unit)
   │   ├── Task 3.1 Add login page           → L4 (E2E/Browser)
   │   └── Task 3.2 Style login page         → L5 (Visual)
   │
   ├── 生成测试骨架文件...
   │   ├── tests/models/test_user.py         (3 个测试函数)
   │   ├── tests/api/test_auth.py            (7 个测试函数)
   │   ├── tests/middleware/test_jwt.py       (4 个测试函数)
   │   └── tests/conftest.py                 (更新: 新增 3 个 fixtures)
   │
   ├── 生成 API 契约文件...
   │   └── tests/contracts/auth.json         (3 个端点, 8 个 case)
   │
   ├── 生成浏览器场景文件...
   │   └── tests/e2e/login_scenarios.json    (2 个场景)
   │
   └── 生成 feature_tests.json

   验证：运行所有测试确认当前全部 FAIL...
   ✅ 14/14 测试 FAIL（正确 — 实现还没写）

   Spec 覆盖率: 12/12 scenarios 有对应测试
   额外边界测试: +2 个

   ✅ Phase 1 完成 (commit: harness-init-abc123)
```

此时你的 change 目录：

```
changes/add-user-auth/
├── proposal.md              ← OpenSpec
├── specs.md                 ← OpenSpec
├── tasks.md                 ← OpenSpec
├── feature_tests.json       ← Harness (Initializer 生成)
└── claude-progress.txt      ← Harness

tests/                       ← Initializer 生成的测试（当前全部 FAIL）
├── models/test_user.py
├── api/test_auth.py
├── middleware/test_jwt.py
├── contracts/auth.json
├── e2e/login_scenarios.json
└── conftest.py
```

---

#### Phase 2：逐任务执行 → 评估 → 修复

```
📋 Task 1.1: Create User model [L2: Unit]
   Scenarios:
     - Given password, stored as bcrypt hash
     - Given email query, returns user or None
   Pre-generated tests:
     - tests/models/test_user.py::test_password_bcrypt
     - tests/models/test_user.py::test_query_by_email
     - tests/models/test_user.py::test_password_not_plaintext

   编码中...（只写实现，不写测试）
   ✅ 编码完成 (commit: feat-task-1.1)

   🔍 启动 Evaluator subagent [L2 模式]...
      运行 pytest tests/models/test_user.py -v
      3/3 passed ✅
      Scenario 覆盖: 2/2 ✅

   ✅ Task 1.1: PASS (1st attempt)
```

```
📋 Task 1.2: Add /auth/register [L3: Integration]
   Scenarios:
     - POST valid → 201
     - POST duplicate → 409
     - POST invalid email → 422
   Pre-generated tests:
     - tests/api/test_auth.py::test_register_201
     - tests/api/test_auth.py::test_register_duplicate_409
     - tests/api/test_auth.py::test_register_invalid_422

   编码中...
   ✅ 编码完成 (commit: feat-task-1.2)

   🔍 启动 Evaluator subagent [L3 模式]...
      启动服务: uvicorn app.main:app --port 8000
      运行 pytest tests/api/test_auth.py -v
      2/3 passed, 1 failed ❌
        FAIL: test_register_duplicate_409 — assert 500 == 409

   ❌ Task 1.2: FAIL (attempt 1/3)

   🔧 启动 Fixer subagent...
      读取评估报告: IntegrityError 未处理
      修复: app/api/auth.py 添加 try/except
      ✅ 修复完成 (commit: fix-task-1.2-attempt-1)

   🔍 重新评估...
      3/3 passed ✅

   ✅ Task 1.2: PASS (2nd attempt, 1 fix)
```

```
📋 Task 3.1: Add login page [L4: E2E/Browser]
   Scenarios:
     - Given login page, valid credentials → redirect to dashboard
     - Given login page, invalid password → show error

   编码中...（注意给 UI 元素加 data-testid）
   ✅ 编码完成 (commit: feat-task-3.1)

   🔍 启动 Evaluator subagent [L4 模式 — QA 工程师]...
      启动服务: npm run dev
      使用 Playwright MCP 浏览器工具...

      场景 1: Successful login
        ✅ Navigate to /login
        ✅ Type email
        ✅ Type password
        ✅ Click login button
        ✅ URL changed to /dashboard
        📸 Screenshot saved

      场景 2: Invalid password
        ✅ Navigate to /login
        ✅ Type wrong password
        ✅ Click login button
        ✅ Error message visible
        📸 Screenshot saved

   ✅ Task 3.1: PASS (1st attempt)
```

```
📋 Task 3.2: Style login page [L5: Visual]

   编码中...
   ✅ 编码完成 (commit: feat-task-3.2)

   🔍 启动 Evaluator subagent [L5 模式]...
      截图:
        📸 login-desktop (1920x1080) → evaluations/screenshots/login-desktop.png
        📸 login-mobile (375x667) → evaluations/screenshots/login-mobile.png

   ⏸️ Task 3.2: NEEDS_HUMAN_REVIEW
      截图保存在 changes/add-user-auth/evaluations/screenshots/
      请查看截图确认是否满意。
```

```
你: 截图看起来不错，通过。
```

```
   ✅ Task 3.2: PASS (human approved)
```

---

#### Phase 3：完成

```
🎉 全部 6 个任务通过！

Summary:
  Task 1.1 [L2] PASS (1st attempt)
  Task 1.2 [L3] PASS (2nd attempt, 1 auto-fix)
  Task 2.1 [L3] PASS (1st attempt)
  Task 2.2 [L2] PASS (1st attempt)
  Task 3.1 [L4] PASS (1st attempt, browser verified)
  Task 3.2 [L5] PASS (human reviewed)

Initializer 生成: 14 个测试, 覆盖 12 个 spec scenarios
Auto-fix: 1 次自动修复
评估报告: changes/add-user-auth/evaluations/

下一步:
  /opsx:verify   ← 最终验证
  /opsx:archive  ← 归档
```

---

#### 如果中途 session 中断了

Stop hook 会在退出前自动保存进度。下次打开 Claude Code：

```
--- Harness Status ---              ← session-init.sh 自动输出
Active harness: add-user-auth
Progress: 3/6 tasks passed

Completed:
  [x] 1.1 Create User model
  [x] 1.2 Add register endpoint
  [x] 2.1 Add login endpoint
Remaining:
  [ ] 2.2 Add JWT middleware
  [ ] 3.1 Add login page
  [ ] 3.2 Style login page

Next: Task 2.2 - Add JWT middleware
---
```

```
你: /project:harness-apply add-user-auth
```

```
🔄 恢复: add-user-auth (3/6 已完成)
继续: Task 2.2 — Add JWT middleware [L2]
```

---

#### 如果 Claude 试图提前退出

```
Claude: "我觉得差不多了，还有什么需要帮忙的吗？"
                ↓
        Stop hook 运行 → 检查 feature_tests.json
                ↓
        ❌ 3/6 tasks passed
                ↓
        Claude 被阻止退出，收到消息：
        "Harness: 3/6 tasks passed. Remaining:
          - Task 2.2: Add JWT middleware
          - Task 3.1: Add login page
          - Task 3.2: Style login page
         Continue working."
                ↓
        Claude 自动继续工作
```

---

## 不用 OpenSpec 也能用

跳过 OpenSpec，手动创建 specs 和 feature_tests.json：

```bash
mkdir -p changes/my-feature
```

写一个简单的 specs 文件（给 Initializer 用）：

```markdown
# changes/my-feature/specs.md
- Given GET /health, Then return 200 with {"status": "ok"}
- Given GET /metrics, Then return prometheus text format
```

写一个 tasks 文件：

```markdown
# changes/my-feature/tasks.md
- [ ] 1. Add health check endpoint
- [ ] 2. Add metrics endpoint
```

然后运行：

```
/project:harness-apply my-feature
```

Initializer 会从 specs.md 生成测试，然后进入正常的编码→评估→修复循环。

---

## 也可以跳过 Initializer

如果你已经手写了测试，直接创建 feature_tests.json 并设 `pre_generated_tests: true`：

```json
{
  "change_id": "my-feature",
  "evaluation_config": { "tdd_mode": false },
  "tasks": [
    {
      "id": "1",
      "description": "Add health check endpoint",
      "spec_scenarios": ["GET /health returns 200"],
      "verification_level": "L2",
      "verification_commands": ["pytest tests/test_health.py -v"],
      "passes": false,
      "evaluation_attempts": 0
    }
  ]
}
```

harness-apply 检测到 feature_tests.json 已存在，跳过 Initializer，直接进入 Phase 2。

---

## 命令速查

| 你输入的 | 作用 |
|---------|------|
| `/project:harness-apply <id>` | 开始或恢复执行（包含 Initializer + 评估循环） |
| `/opsx:propose "xxx"` | 创建提案（OpenSpec，不变） |
| `/opsx:specs` | 生成 specs（OpenSpec，不变） |
| `/opsx:tasks` | 拆解任务（OpenSpec，不变） |
| `/opsx:verify` | 最终验证（OpenSpec，不变） |
| `/opsx:archive` | 归档（OpenSpec，不变） |

## 组件速查

| 组件 | 什么时候运行 | 做什么 |
|------|-------------|--------|
| **Initializer** | Phase 1（编码之前） | 把 specs 变成可执行的测试和验证材料 |
| **Coding Agent** | Phase 2（你在用的 Claude） | 只写实现代码，让预生成的测试通过 |
| **Evaluator** | 每个 task 完成后 | 独立 subagent 跑测试，PASS/FAIL |
| **Fixer** | Evaluator 报 FAIL 时 | 独立 subagent 做最小修复 |
| **Stop hook** | Claude 想退出时 | 检查 feature_tests.json，没完成就阻止 |
| **Session hook** | 新 session 启动时 | 自动显示进度，告诉 Claude 从哪继续 |
