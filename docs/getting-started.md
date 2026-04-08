# 使用指南

> 从零开始，5 分钟将 Harness Engineering 集成到你的项目中。

## 前提条件

- [x] 已安装 Claude Code（CLI、桌面版或 Web 版均可）
- [x] 已安装 OpenSpec（`npm install -g openspec-cli`）
- [x] 项目是一个 git 仓库

## 第一步：复制模板到你的项目

```bash
# 克隆 harness-spec 仓库（如果还没有）
git clone https://github.com/yuchenhui/harness-spec.git /tmp/harness-spec

# 进入你的项目目录
cd ~/your-project

# 复制 harness 模板
cp -r /tmp/harness-spec/templates/.claude/ .claude/

# 如果 .claude 目录已存在，手动合并：
# mkdir -p .claude/agents .claude/commands .claude/skills/progress-tracker
# cp /tmp/harness-spec/templates/.claude/agents/*.md .claude/agents/
# cp /tmp/harness-spec/templates/.claude/commands/*.md .claude/commands/
# cp /tmp/harness-spec/templates/.claude/skills/progress-tracker/SKILL.md .claude/skills/progress-tracker/
```

复制完成后，你的项目结构应该是：

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── evaluator.md        ← 独立评估 agent
│   │   └── fixer.md            ← 自动修复 agent
│   ├── commands/
│   │   └── harness-apply.md    ← /harness-apply 命令
│   └── skills/
│       └── progress-tracker/
│           └── SKILL.md        ← 进度追踪 skill
├── CLAUDE.md                   ← 你的项目已有的（或新建）
├── changes/                    ← OpenSpec 的 change 目录
├── src/                        ← 你的源代码
└── tests/                      ← 你的测试
```

## 第二步：配置 CLAUDE.md（如果还没有）

在项目根目录创建或更新 CLAUDE.md，保持精简（< 60 行）：

```markdown
# Project: Your Project Name

## Tech Stack
- Python 3.12 / FastAPI / SQLAlchemy 2.0 / PostgreSQL
- pytest for testing, ruff for linting

## Code Standards
- All API endpoints must have Pydantic request/response models
- Use async/await for all database operations
- Run tests: pytest tests/ -v
- Run lint: ruff check .

## Harness Integration
- Use /harness-apply instead of /opsx:apply for verified execution
- Evaluation reports stored in changes/<id>/evaluations/
- Progress tracked in changes/<id>/claude-progress.txt
```

## 第三步：配置 settings.json（可选但推荐）

创建 `.claude/settings.json` 配置权限白名单：

```json
{
  "permissions": {
    "allow": [
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Bash(mypy *)",
      "Bash(python -c *)",
      "Bash(python -m *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git log *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(curl *)",
      "Bash(mkdir *)",
      "Read(**)",
      "Edit(**)",
      "Glob(**)",
      "Grep(**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)",
      "Bash(git reset --hard *)"
    ]
  }
}
```

## 第四步：日常使用

### 场景 A：新 Feature 开发（完整流程）

```
# 1. 用 OpenSpec 创建提案（和以前一样）
> /opsx:propose "add-dark-mode"

# 2. 生成 specs 和 tasks（和以前一样）
> /opsx:specs
> /opsx:tasks

# 3. 用 harness-apply 替代 /opsx:apply ← 这是关键变化
> /harness-apply add-dark-mode

# harness-apply 会自动：
# - 把 tasks.md 转化为 feature_tests.json（可验证条目）
# - 逐个任务执行
# - 每个任务完成后启动独立 evaluator 验证
# - 验证失败自动修复（最多 3 次）
# - 维护 progress 文件

# 4. 全部通过后，验证和归档（和以前一样）
> /opsx:verify
> /opsx:archive
```

### 场景 B：Session 中断后恢复

```
# 上次在任务 3/7 时 session 中断了
# 新 session 中直接恢复：

> /harness-apply add-dark-mode --resume

# 它会自动：
# - 读取 claude-progress.txt
# - 找到下一个未完成的任务
# - 从那里继续
```

### 场景 C：手动触发单个任务的评估

如果你手动写了一些代码，想让 evaluator 验证：

```
> 请用 evaluator agent 验证 task 2.1 的实现

# Claude Code 会启动独立的 evaluator subagent
# 读取 feature_tests.json 中 task 2.1 的验证条件
# 运行测试并给出 PASS/FAIL 报告
```

### 场景 D：查看当前进度

```
> 当前 harness 进度是什么？

# Claude Code 会读取 claude-progress.txt 并汇报：
# - 完成了哪些任务
# - 当前在哪个任务
# - 还剩哪些
```

## 实际操作演示

以下是一个完整的终端操作示例：

```bash
# ========================================
# 准备工作（只需做一次）
# ========================================

# 1. 进入你的项目
cd ~/projects/argus

# 2. 复制 harness 模板
cp -r /tmp/harness-spec/templates/.claude/ .claude/

# 3. 提交 harness 配置
git add .claude/
git commit -m "chore: add harness engineering templates"

# ========================================
# 开始一个 Feature（每次开发 Feature 时）
# ========================================

# 4. 启动 Claude Code
claude

# 5. 在 Claude Code 中操作：

> /opsx:propose "add-asset-scan-scheduler"
# OpenSpec 创建提案...

> /opsx:specs
# OpenSpec 生成 specs...

> /opsx:tasks
# OpenSpec 拆解任务...

> /harness-apply add-asset-scan-scheduler
# Harness 开始执行：
#
# 📋 初始化: 读取 tasks.md，生成 feature_tests.json
# ✅ 初始化完成
#
# 📋 Task 1.1: Create ScanScheduler model
#    编码中...
#    ✅ 编码完成 (commit: abc123)
#    🔍 启动评估...
#    ✅ PASS (1st attempt)
#
# 📋 Task 1.2: Add /scheduler/create endpoint
#    编码中...
#    ✅ 编码完成 (commit: def456)
#    🔍 启动评估...
#    ❌ FAIL: test_create_duplicate_schedule 失败
#    🔧 修复中 (attempt 1/3)...
#    🔍 重新评估...
#    ✅ PASS (2nd attempt)
#
# ... (后续任务)
#
# 🎉 所有任务完成！

> /opsx:verify
# 最终验证通过

> /opsx:archive
# 归档完成
```

## 根据项目类型调整

### Python/FastAPI 项目

模板默认适合 Python 项目，无需特殊调整。verification_commands 会自动使用 `pytest`。

### Node.js/TypeScript 项目

修改 evaluator.md 中的工具列表：
```yaml
tools:
  - Bash(npm test *)
  - Bash(npx jest *)
  - Bash(npx tsc --noEmit)
  - Bash(npx eslint *)
```

### Go 项目

修改 evaluator.md 中的工具列表：
```yaml
tools:
  - Bash(go test *)
  - Bash(go vet *)
  - Bash(golangci-lint *)
```

### Spring Boot/Java 项目

修改 evaluator.md 中的工具列表：
```yaml
tools:
  - Bash(mvn test *)
  - Bash(mvn verify *)
  - Bash(./gradlew test *)
```

## 常见问题

### Q: harness-apply 和 opsx:apply 有什么区别？

| | `/opsx:apply` | `/harness-apply` |
|---|---|---|
| 执行方式 | 一次性执行所有任务 | 逐任务执行 |
| 验证 | Agent 自我评估 | 独立 evaluator 验证 |
| 失败处理 | 手动修复 | 自动修复（最多 3 次）|
| 跨 session | 从头开始 | progress 文件恢复 |
| 证据 | 无 | 评估报告可追溯 |

### Q: 如果我不用 OpenSpec 可以用 Harness 吗？

可以。你可以手动创建 `feature_tests.json`，不需要经过 OpenSpec 的 propose/specs/tasks 流程。Harness 只依赖 `feature_tests.json` 作为输入。

### Q: Evaluator 会不会很慢？

Evaluator 使用 Sonnet 模型（通过 subagent），主要工作是运行测试和比对结果，通常 10-30 秒完成。相比手动检查代码，这个时间投资是值得的。

### Q: 自动修复安全吗？

Fixer agent 有严格的约束：
- 只修改评估报告中指出的文件
- 不能修改 feature_tests.json（不能降低标准）
- 不能删除失败的测试
- 每次修复后都会重新评估
- 最多 3 次，超过就暂停等人工

### Q: 我需要修改模板吗？

大多数情况下不需要。可能需要调整的地方：
- `evaluator.md` 的 `tools` 列表（根据项目技术栈）
- `evaluation_config` 中的 `require_type_check`（TypeScript/Python typed 项目建议开启）
- `max_retries`（简单项目可降为 2，复杂项目可升为 5）
