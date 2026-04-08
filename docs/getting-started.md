# 实际操作指南

## TL;DR — 三步开始用

```bash
# 1. 把模板复制到你的项目
cd ~/your-project
cp -r /path/to/harness-spec/templates/.claude/ .claude/

# 2. 用 OpenSpec 正常创建提案和任务
# /opsx:propose "xxx" → /opsx:specs → /opsx:tasks

# 3. 用 /project:harness-apply 替代 /opsx:apply
# /project:harness-apply add-xxx
```

就这样。下面是详细说明。

---

## 详细步骤

### Step 1: 安装模板

把 `templates/.claude/` 目录复制到你的项目根目录：

```bash
cd ~/your-project

# 方法 A: 如果你已经 clone 了 harness-spec
cp -r ~/harness-spec/templates/.claude/ .claude/

# 方法 B: 如果 .claude 目录已存在（比如你已经有 settings.json）
mkdir -p .claude/agents .claude/commands .claude/skills/progress-tracker
cp ~/harness-spec/templates/.claude/agents/*.md .claude/agents/
cp ~/harness-spec/templates/.claude/commands/*.md .claude/commands/
cp ~/harness-spec/templates/.claude/skills/progress-tracker/SKILL.md .claude/skills/progress-tracker/
```

安装后的结构：

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── evaluator.md      ← 新增
│   │   └── fixer.md          ← 新增
│   ├── commands/
│   │   └── harness-apply.md  ← 新增（这就是你的 /project:harness-apply 命令）
│   ├── skills/
│   │   └── progress-tracker/
│   │       └── SKILL.md      ← 新增
│   └── settings.json         ← 你已有的（可选）
├── CLAUDE.md
└── ...
```

提交：

```bash
git add .claude/
git commit -m "chore: add harness engineering templates"
```

### Step 2: 正常用 OpenSpec 创建提案

这一步完全不变：

```
你: /opsx:propose "add-user-auth"
    → OpenSpec 创建 changes/add-user-auth/proposal.md

你: /opsx:specs
    → OpenSpec 创建 changes/add-user-auth/specs.md

你: /opsx:tasks
    → OpenSpec 创建 changes/add-user-auth/tasks.md
```

### Step 3: 用 harness-apply 执行

**原来你会这样做**：
```
你: /opsx:apply
```
Agent 一口气做完所有任务，自己判断自己做得对不对。

**现在你这样做**：
```
你: /project:harness-apply add-user-auth
```

然后 Claude Code 会：

```
📋 初始化: 读取 tasks.md，生成 feature_tests.json...
✅ 初始化完成，共 5 个任务

--- Task 1.1: Create User model ---
Scenarios:
  - Given password, stored as bcrypt hash
  - Given email query, returns user or None
编码中...
✅ 编码完成 (commit: abc1234)
🔍 启动独立评估（subagent）...
✅ Task 1.1: PASS

--- Task 1.2: Add /auth/register endpoint ---
Scenarios:
  - POST valid data → 201
  - POST duplicate email → 409
编码中...
✅ 编码完成 (commit: def5678)
🔍 启动独立评估（subagent）...
❌ Task 1.2: FAIL — test_register_duplicate 失败 (500 != 409)
🔧 启动修复（subagent, attempt 1/3）...
🔍 重新评估...
✅ Task 1.2: PASS (2nd attempt)

--- Task 2.1: Add /auth/login endpoint ---
...

🎉 全部 5 个任务通过！
```

### Step 4: 如果中途 session 断了

下次打开 Claude Code：

```
你: /project:harness-apply add-user-auth
```

它会自动检测到 feature_tests.json 已存在，进入恢复模式：

```
🔄 恢复: add-user-auth (3/5 已完成)
继续: Task 2.2 — Add JWT middleware
```

---

## 不用 OpenSpec 也能用

如果你不用 OpenSpec，可以手动创建 `feature_tests.json`：

```bash
mkdir -p changes/my-feature
```

然后创建 `changes/my-feature/feature_tests.json`：

```json
{
  "change_id": "my-feature",
  "tasks": [
    {
      "id": "1",
      "description": "Add health check endpoint",
      "spec_scenarios": ["GET /health returns 200 with status ok"],
      "verification_commands": ["pytest tests/test_health.py -v"],
      "passes": false,
      "evaluation_attempts": 0
    },
    {
      "id": "2",
      "description": "Add metrics endpoint",
      "spec_scenarios": ["GET /metrics returns prometheus format"],
      "verification_commands": ["pytest tests/test_metrics.py -v"],
      "passes": false,
      "evaluation_attempts": 0
    }
  ]
}
```

然后：

```
你: /project:harness-apply my-feature
```

它会跳过初始化（因为 feature_tests.json 已存在），直接开始逐任务执行。

---

## 单独使用 evaluator

如果你手写了一些代码，只想让 evaluator 验证一下：

```
你: 请用 evaluator agent 验证 changes/my-feature 中 task 1 的实现。
    verification_commands: ["pytest tests/test_health.py -v"]
    spec_scenarios: ["GET /health returns 200 with status ok"]
```

Claude Code 会启动一个独立的 evaluator subagent，跑测试后告诉你 PASS 或 FAIL。

---

## 调整模板（根据项目技术栈）

如果你用的不是 Python/pytest，编辑 `.claude/agents/evaluator.md` 的 tools 部分：

**Node.js 项目**：
```yaml
tools:
  - Bash(npm test *)
  - Bash(npx jest *)
  - Bash(npx tsc --noEmit)
```

**Go 项目**：
```yaml
tools:
  - Bash(go test *)
  - Bash(go vet *)
```

**Java/Maven 项目**：
```yaml
tools:
  - Bash(mvn test *)
  - Bash(mvn verify *)
```

harness-apply.md 命令本身不需要改——它会根据项目结构自动判断用什么测试框架。

---

## 命令速查

| 你输入的 | 作用 |
|---------|------|
| `/project:harness-apply <change-id>` | 开始或恢复执行 |
| `/opsx:propose "xxx"` | 创建提案（OpenSpec，不变） |
| `/opsx:specs` | 生成 specs（OpenSpec，不变） |
| `/opsx:tasks` | 拆解任务（OpenSpec，不变） |
| `/opsx:verify` | 最终验证（OpenSpec，不变） |
| `/opsx:archive` | 归档（OpenSpec，不变） |
