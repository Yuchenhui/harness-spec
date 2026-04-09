# 最佳实践整理

> 综合 Anthropic、OpenAI、HumanLayer、Boris Cherny 等来源的 AI coding agent 最佳实践，按 harness engineering 的角度重新组织。

## 1. CLAUDE.md 治理

### 原则：精简、普适、分层

**来源**: HumanLayer, Boris Cherny, Anthropic

CLAUDE.md 是项目的"宪法"，不是百科全书。

```markdown
# 好的 CLAUDE.md（< 60 行）

## Tech Stack
- Python 3.12 / FastAPI / SQLAlchemy 2.0 / PostgreSQL
- pytest for testing, ruff for linting

## Code Standards
- All API endpoints must have request/response models (Pydantic)
- Use async/await for all database operations
- Never commit .env files or credentials

## Testing
- Run: pytest tests/ -v
- All new endpoints must have integration tests
- Use fixtures from tests/conftest.py

## Project Structure
- See docs/architecture.md for detailed architecture
- See docs/api-conventions.md for API patterns
```

```markdown
# 坏的 CLAUDE.md（> 300 行）

## 1. Introduction
This is a comprehensive guide to...（省略 50 行描述）

## 2. Every Single API Endpoint
POST /api/users - Creates a user...（省略 200 行 API 文档）

## 3. Database Schema
CREATE TABLE users...（省略 100 行 DDL）
```

**关键实践**:
- CLAUDE.md 控制在 50-60 行以内
- 详细知识放在 `docs/` 目录的结构化文件中
- CLAUDE.md 当"目录表"，指向详细文档
- 分层：根目录放全局规则，子目录放局部规则

### settings.json vs CLAUDE.md

**来源**: Boris Cherny

确定性行为放 settings.json，启发性指导放 CLAUDE.md：

```jsonc
// .claude/settings.json — 确定性约束
{
  "permissions": {
    "allow": [
      "Bash(pytest *)",
      "Bash(ruff *)",
      "Read(**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(git push --force *)"
    ]
  }
}
```

```markdown
# CLAUDE.md — 启发性指导
## When writing tests
- Prefer integration tests over unit tests for API endpoints
- Use factory_boy for test data generation
- Mock external API calls, never mock database
```

## 2. 上下文管理

### 原则：上下文是稀缺资源

**来源**: OpenAI, Anthropic

> "上下文是稀缺资源。一个巨大的指令文件会挤占任务、代码和相关文档的空间。"
> — OpenAI, A Practical Guide to Building Agents

**关键实践**:

**工具数量控制**:
- 不要一次性暴露所有工具给 agent
- HumanLayer 研究表明 MCP 工具过多时 agent 性能下降
- Anthropic 的 MCP tool search 就是为了解决这个问题——渐进式披露工具
- 从 wshobson/commands 等工具集中**挑选**需要的，而非全量安装

**文档引用而非内联**:
```markdown
# 好的做法
See docs/database-schema.md for the complete schema.

# 坏的做法
The database schema is:
CREATE TABLE users (id SERIAL PRIMARY KEY, ...
（把整个 schema 放在 CLAUDE.md 里）
```

**进度文件保持简洁**:
```
# claude-progress.txt — 简洁有效
Status: 3/7 tasks done
Last: task 2.1 (commit abc123)
Next: task 2.2
Blocked: none
```

## 3. 测试驱动的反馈环

### 原则：Test-First, Tight Feedback Loop

**来源**: Simon Willison, Anthropic

> "先写失败测试（red），让 agent 使其通过（green）。Agent 看到测试失败输出后自行诊断修复，形成紧密的反馈环。"
> — Simon Willison

这与 harness engineering 的评估循环天然契合：

```
OpenSpec scenarios → 转化为测试 → Agent 编码使测试通过 → Evaluator 验证
```

**关键实践**:

1. **Initializer 阶段生成测试骨架**:
   - 读取 spec scenarios
   - 为每个 scenario 生成失败的测试（只有断言，没有实现）
   - Coding agent 的目标变成"让这些测试通过"

2. **测试即验证标准**:
   - Evaluator 不需要"理解"代码，只需要运行测试
   - 测试结果是客观的，不受自我评估偏差影响

3. **测试失败输出是最好的反馈**:
   - Fixer agent 读测试失败的 traceback 比读自然语言描述更有效
   - 包含行号、期望值、实际值，信息密度高

## 4. 增量执行与状态恢复

### 原则：每个 Agent Session 做一件事

**来源**: Anthropic

> "让 agent 通过 claude-progress.txt 加上 git history 来快速理解工作状态。"
> — Anthropic, Claude Code Best Practices

**关键实践**:

**Feature Requirements 文件防止过度执行**:
```json
// feature_tests.json 中每个 task 标记为 passes: false
// Agent 只能修改 passes 字段，不能删除或编辑验证条件
{
  "id": "1.1",
  "passes": false  // agent 只负责让这个变成 true
}
```

**Session 初始化流程**:
```
新 Session 启动
  → pwd (确认工作目录)
  → git log --oneline -20 (理解最近历史)
  → cat claude-progress.txt (理解当前状态)
  → cat feature_tests.json | jq '.tasks[] | select(.passes==false) | .id' (找下一个任务)
  → 开始工作
```

**Git Commit 即检查点**:
- 每完成一个任务就 commit
- Commit message 包含任务 ID: `feat(auth): implement user registration [task-1.2]`
- 即使 session 中断，下一个 session 也能从 git log 恢复

## 5. Writer/Reviewer 分离

### 原则：创作和审查不能由同一个 Agent 完成

**来源**: Anthropic

> "用一个 session 写代码，用新的 session 做审查，因为新上下文不会对刚写的代码有偏见。"

**在 Harness 中的应用**:

| 角色 | Agent | 上下文 | 能力 |
|------|-------|--------|------|
| Writer | Coding Agent | 主 session | 读写代码、运行命令 |
| Reviewer | Evaluator Agent | 独立 subagent | 只读代码、运行测试 |
| Debugger | Fixer Agent | 独立 subagent | 读写代码、运行测试 |

**Evaluator 为什么用 Sonnet 而不是 Opus**:
- 评估任务不需要强创造力，需要的是精确的测试执行和结果比对
- Sonnet 更快，成本更低，适合频繁调用（每个 task 至少调一次）
- 如果评估逻辑简单（只是跑测试看结果），甚至可以用 Haiku

## 6. Skills 化重复操作

### 原则：做两次以上的事，变成 Skill

**来源**: Boris Cherny

> "如果你一天做超过一次的事，就把它变成 skill 或 command。"

**识别候选 Skill 的信号**:
- 你多次告诉 Claude "运行测试然后..." → 做成 command
- 你每次 session 都要解释项目结构 → 写进 CLAUDE.md
- 你每次修 bug 都走相同的诊断流程 → 做成 agent
- 你每次部署都执行相同的步骤 → 做成 skill

**Harness 本身就是这个原则的产物**:
- `/harness-apply` 把 "执行 → 评估 → 修复" 封装成一个 command
- `evaluator.md` 把 "独立验证" 封装成一个 agent
- `progress-tracker` 把 "状态管理" 封装成一个 skill

## 7. 安全与权限边界

### 原则：信任但验证

**来源**: Boris Cherny, Anthropic

**关键实践**:

- **settings.json 白名单优于 CLAUDE.md 禁令**
  - 在 settings.json 中明确 allow 哪些 Bash 命令
  - 比在 CLAUDE.md 写 "不要删除文件" 更可靠

- **Evaluator 不应有写权限**
  - Evaluator 只运行测试和读代码
  - 如果 evaluator 能修改代码，就失去了独立评估的意义

- **Fixer 的修改范围要受限**
  - 只修改评估报告中指出的文件
  - 不做"顺便重构"或"改进代码风格"

## 总结：核心原则清单

| # | 原则 | 来源 |
|---|------|------|
| 1 | CLAUDE.md < 60 行，当目录用 | HumanLayer |
| 2 | 确定性约束放 settings.json | Boris Cherny |
| 3 | 上下文是稀缺资源，不要浪费 | OpenAI |
| 4 | 工具渐进式披露，不要一次暴露全部 | Anthropic/HumanLayer |
| 5 | 生成和评估必须分开到不同 agent | Anthropic |
| 6 | Test-first 驱动，测试即验证标准 | Simon Willison |
| 7 | 每个 session 做一件事，git commit 即检查点 | Anthropic |
| 8 | 用 progress 文件实现跨 session 恢复 | Anthropic |
| 9 | 重复操作 Skill 化 | Boris Cherny |
| 10 | 白名单优于黑名单，权限最小化 | Boris Cherny |
