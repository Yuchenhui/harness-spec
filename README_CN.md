# Harness Engineering for OpenSpec

[English](README.md)

> 将 AI Agent 的"做什么"（OpenSpec）和"怎么可靠地做"（Harness Engineering）分层组合，构建可验证、可恢复、可自愈的 AI 辅助开发流程。

## 什么是 Harness Engineering

Harness Engineering 是一套围绕 AI coding agent 构建的工程实践框架，解决 agent 在实际开发中的三个根本问题：

1. **自我评估偏差** — Agent 评估自己的产出时倾向于自信地表扬自己，即使质量明显一般（Anthropic Research, 2025）
2. **上下文耗尽** — Agent 倾向于一次性完成所有事情，经常在上下文窗口中间耗尽，留下半完成的 feature
3. **状态丢失** — 跨 session 时，新的 agent 不知道之前做了什么，从零开始理解项目

## 工作原理

```
OpenSpec（做什么）                Harness（怎么可靠地做）
┌──────────────────────┐          ┌──────────────────────────────┐
│  /opsx:propose       │          │  初始化器                     │
│  /opsx:specs         │    →     │  tasks.md → feature_tests    │
│  /opsx:tasks         │          │                              │
│  /opsx:apply         │          │  Coding Agent（单任务执行）    │
│  /opsx:verify        │          │  Evaluator Agent（独立评估）   │
│  /opsx:archive       │          │  Fixer Agent（自动修复）       │
└──────────────────────┘          │  Progress Tracker（状态恢复）  │
                                  └──────────────────────────────┘
```

OpenSpec 完全不需要修改。Harness 作为独立层叠加在上面，通过 Claude Code 原生的 agents、commands 和 skills 实现。

## 与 OpenSpec 的配合方式

### 职责划分

OpenSpec 和 Harness 解决的是**不同的问题**，各自负责开发生命周期中**不同的阶段**：

| 阶段 | 谁负责 | 做什么 |
|------|--------|--------|
| **Propose** | OpenSpec | 定义做什么、范围、动机 |
| **Specs** | OpenSpec | 展开为 Given/When/Then 场景 |
| **Tasks** | OpenSpec | 把 specs 拆解为可执行的开发任务 |
| **Apply** | **Harness** | 带验证循环的任务执行（替代 `/opsx:apply`）|
| **Verify** | OpenSpec | 最终确认所有 specs 都被满足 |
| **Archive** | OpenSpec | 归档完成的变更 |

一句话：**OpenSpec 决定做什么，Harness 确保做对。**

### Harness 插入的位置

Harness 只在一个点介入 — **Tasks** 和 **Verify** 之间：

```
/opsx:propose → /opsx:specs → /opsx:tasks → /project:harness-apply → /opsx:verify → /opsx:archive
      │              │             │                  │                    │              │
   OpenSpec       OpenSpec      OpenSpec           Harness             OpenSpec       OpenSpec
                                    │                  │
                                    ▼                  ▼
                                tasks.md ──────→ feature_tests.json
                                specs.md ──────→ （提取验证场景）
```

### Harness 从 OpenSpec 读取什么

Harness 读取 OpenSpec 生成的**两个文件**：

| 文件 | Harness 提取什么 |
|------|-----------------|
| `changes/<id>/tasks.md` | 任务列表 — 每个 `- [ ]` 变成 feature_tests.json 中的一个 task |
| `changes/<id>/specs.md` | Spec 场景 — 每个 Given/When/Then 变成需要验证的 `spec_scenario` |

示例 — OpenSpec 生成了：

```markdown
<!-- specs.md -->
## 用户注册
- Given 合法的邮箱和密码, When POST /auth/register, Then 返回 201

<!-- tasks.md -->
- [ ] 1.1 创建 User 模型，支持密码哈希
- [ ] 1.2 添加 /auth/register 接口
```

Harness 将其转化为：

```json
{
  "tasks": [
    {
      "id": "1.2",
      "description": "添加 /auth/register 接口",
      "spec_scenarios": ["Given 合法的邮箱和密码, When POST /auth/register, Then 返回 201"],
      "verification_commands": ["pytest tests/api/test_auth.py::test_register -v"],
      "passes": false
    }
  ]
}
```

### Harness 在 OpenSpec 旁边产出什么

harness-apply 完成后，change 目录下同时包含 OpenSpec 和 Harness 的产物：

```
changes/add-user-auth/
├── proposal.md              ← OpenSpec（不变）
├── specs.md                 ← OpenSpec（不变）
├── tasks.md                 ← OpenSpec（不变）
├── feature_tests.json       ← Harness（生成，追踪每个任务的通过/失败）
├── claude-progress.txt      ← Harness（进度状态，用于 session 恢复）
└── evaluations/             ← Harness（每个任务的评估报告）
    ├── task-1.1-attempt-1.md
    ├── task-1.2-attempt-1.md    （失败）
    └── task-1.2-attempt-2.md    （修复后通过）
```

运行 `/opsx:archive` 时，这些会一起被归档 — 评估报告作为实现质量的**可追溯证据**。

### 为什么不直接改 OpenSpec？

1. **职责分离** — "做什么"和"怎么可靠地做"是正交的
2. **维护成本** — OpenSpec 有 23 个工具适配器且在快速迭代，fork 后要不断 rebase
3. **最小体量** — Harness 只有 4 个 markdown 文件，vs 维护一整个 TypeScript 项目
4. **可组合性** — Harness 可以脱离 OpenSpec 单独使用（手写 `feature_tests.json` 即可）

## Hooks：自动触发机制（参考 ralph-wiggum）

纯 markdown 命令依赖 Claude 在上下文中"遵守指令"。Hooks 则提供**确定性的强制执行** — 它们是 shell 脚本，在特定生命周期事件时运行，不管 Claude "觉得"自己做完了没有。

这个方法参考了 [ralph-wiggum](https://github.com/anthropics/claude-code/tree/main/plugins/ralph-wiggum)，这是 Anthropic 官方插件，它使用 **Stop hook** 阻止 Claude 在任务未完成时退出。

### 三个 Hook

| Hook | 事件 | 做什么 |
|------|------|--------|
| `stop-check.sh` | **Stop** | 检查 `feature_tests.json` — 如果有任务 `passes: false`，**阻止 Claude 退出**，告诉它还剩哪些任务 |
| `session-init.sh` | **SessionStart** | 读取 `feature_tests.json` + `claude-progress.txt`，打印进度摘要，让 Claude 立刻知道从哪里继续 |
| `post-tool-notify.sh` | **PostToolUse** (Bash) | `git commit` 后，提醒 Claude 启动 evaluator subagent |

### Stop Hook 的工作原理

这是核心机制。当 Claude 认为自己"做完了"要退出时：

```
Claude: "全部完成了！"
         ↓ （尝试退出）
Stop hook 运行 → 读取 feature_tests.json
         ↓
         ├── 所有任务 passes: true  → {"decision":"allow"}  → Claude 退出 ✅
         │
         └── 部分任务 passes: false → {"decision":"block",   → Claude 无法退出 ❌
                                       "reason": "3/7 任务通过。剩余：
                                         - Task 2.2: Add JWT middleware
                                         - Task 3.1: Add token refresh
                                       继续工作。"}
                                               ↓
                                        Claude 看到原因
                                        继续工作
                                               ↓
                                        （循环重复）
```

这从机制上解决了**自我评估偏差**问题：Claude 不能光*说*自己做完了 — hook 会独立检查 `feature_tests.json` 来验证。

### Hooks vs 纯 MD

| 方面 | 纯 MD（仅命令）| MD + Hooks |
|------|---------------|------------|
| 评估触发 | Claude 遵循 prompt 指令 | `post-tool-notify.sh` 在每次 commit 后提醒 |
| 退出控制 | Claude 自己决定何时停下 | `stop-check.sh` 阻止退出直到验证通过 |
| Session 恢复 | Claude 被提示后才读文件 | `session-init.sh` 自动打印状态 |
| 可靠性 | 取决于上下文窗口和注意力 | 确定性的 shell 脚本，必定执行 |

**建议**：正式开发用 hooks 模式，简单或实验性任务用纯 MD 模式。

## 依赖

**无。** Harness 使用 markdown 文件 + bash hook 脚本，全部基于 Claude Code 内置机制。不需要 MCP 服务器、npm 包或其他插件。OpenSpec 也是可选的 — 可以单独使用 Harness。

## 安装

### 方式一：Claude Code Plugin 安装（推荐）

```bash
# 在 Claude Code 中执行：
/plugin marketplace add yuchenhui/harness-spec
/plugin install harness-spec@harness-spec
```

安装后，命令通过以下方式调用：

```
/harness-spec:harness-apply <change-id>
```

### 方式二：手动复制

```bash
# 克隆本仓库
git clone https://github.com/yuchenhui/harness-spec.git

# 进入你的项目
cd ~/your-project

# 复制模板（agents, commands, skills, hooks）
cp -r /path/to/harness-spec/templates/.claude/ .claude/

# 如果 .claude/ 目录已存在，手动合并：
mkdir -p .claude/agents .claude/commands .claude/skills/progress-tracker .claude/hooks
cp /path/to/harness-spec/templates/.claude/agents/*.md .claude/agents/
cp /path/to/harness-spec/templates/.claude/commands/*.md .claude/commands/
cp /path/to/harness-spec/templates/.claude/skills/progress-tracker/SKILL.md .claude/skills/progress-tracker/
cp /path/to/harness-spec/templates/.claude/hooks/* .claude/hooks/
chmod +x .claude/hooks/*.sh

# 将 hooks.json 合并到你的 .claude/settings.json（参考 hooks/hooks.json）

# 提交
git add .claude/
git commit -m "chore: add harness engineering templates with hooks"
```

手动安装后，命令通过以下方式调用：

```
/project:harness-apply <change-id>
```

### 安装了什么

```
.claude/（或 plugin 命名空间下）
├── agents/
│   ├── evaluator.md        ← 独立评估 agent
│   └── fixer.md            ← 自动修复 agent
├── commands/
│   └── harness-apply.md    ← harness-apply 命令
├── hooks/
│   ├── hooks.json          ← Hook 事件定义
│   ├── stop-check.sh       ← 任务未完成时阻止退出
│   ├── session-init.sh     ← Session 启动时自动加载进度
│   └── post-tool-notify.sh ← git commit 后提醒评估
└── skills/
    └── progress-tracker/
        └── SKILL.md        ← 跨 session 状态恢复
```

## 使用方法

```bash
# 1. 用 OpenSpec 创建提案（不变）
/opsx:propose "add-user-auth"
/opsx:specs
/opsx:tasks

# 2. 用 harness-apply 替代 /opsx:apply  ← 唯一的变化
/project:harness-apply add-user-auth

# 3. 验证和归档（不变）
/opsx:verify
/opsx:archive
```

`/project:harness-apply` 自动完成：

- 将 tasks.md 转化为可验证的 `feature_tests.json`
- **逐个任务执行**（不是一口气全做）
- 每个任务完成后启动**独立 evaluator subagent** 验证（不是自己判自己）
- 失败时自动启动 fixer subagent 修复（最多 3 次）
- 维护 progress 文件，支持**跨 session 恢复**

Session 中断后恢复：

```bash
/project:harness-apply add-user-auth
# 检测到已有 feature_tests.json → 从上次未完成的任务继续
```

## 不用 OpenSpec 也能用

可以跳过 OpenSpec，直接手写 `feature_tests.json`：

```json
{
  "change_id": "my-feature",
  "tasks": [
    {
      "id": "1",
      "description": "添加健康检查接口",
      "spec_scenarios": ["GET /health 返回 200 和 status ok"],
      "verification_commands": ["pytest tests/test_health.py -v"],
      "passes": false,
      "evaluation_attempts": 0
    }
  ]
}
```

然后运行：

```bash
/project:harness-apply my-feature
```

## 核心组件

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| Evaluator Agent | `.claude/agents/evaluator.md` | 在独立上下文中验证实现 |
| Fixer Agent | `.claude/agents/fixer.md` | 根据评估报告做最小修复 |
| Harness Apply | `.claude/commands/harness-apply.md` | 编排 apply → evaluate → fix 循环 |
| Progress Tracker | `.claude/skills/progress-tracker/SKILL.md` | 管理 feature_tests.json 和进度状态 |

### 验证级别

不同类型的任务需要不同的验证手段。详见 [docs/verification-strategies.md](docs/verification-strategies.md)。

| 级别 | 工具 | 适用场景 |
|------|------|---------|
| **L1: Static** | ruff, mypy, tsc | 所有代码（lint + 类型检查）|
| **L2: Unit** | pytest, jest | 业务逻辑、模型、工具函数 |
| **L3: Integration** | pytest + curl/httpx | API 接口、数据库操作 |
| **L4: E2E/Browser** | **Playwright MCP** | UI 交互、前端功能 |
| **L5: Visual** | Playwright 截图 | 样式、布局、设计验证 |

**核心改进**：TDD 模式下（`tdd_mode: true`），Initializer 在编码之前就生成测试骨架。Coding Agent 只写实现代码，测试来自 specs，不是 agent 自己写的。避免"学生自己出题自己答"的问题。

**对于 L4（浏览器验证）**，evaluator 使用 [Playwright MCP](https://github.com/anthropics/playwright-mcp) 做黑盒测试 — 它只有浏览器工具（导航、点击、输入、截图），没有代码访问权限。像真实用户一样测试。

## 适配你的技术栈

编辑 `.claude/agents/evaluator.md` 的 tools 部分：

**Python**（默认）：`Bash(pytest *)`、`Bash(ruff *)`
**Node.js**：`Bash(npm test *)`、`Bash(npx jest *)`
**Go**：`Bash(go test *)`、`Bash(go vet *)`
**Java**：`Bash(mvn test *)`、`Bash(./gradlew test *)`

## 仓库结构

```
harness-spec/
├── .claude-plugin/
│   ├── plugin.json              # Plugin 清单（用于 /plugin install）
│   └── marketplace.json         # Marketplace 清单（用于 /plugin marketplace add）
├── agents/                      # Plugin 布局（/plugin install 使用）
│   ├── evaluator.md
│   └── fixer.md
├── commands/
│   └── harness-apply.md
├── skills/
│   └── progress-tracker/
│       └── SKILL.md
├── hooks/                       # Hook 脚本（参考 ralph-wiggum）
│   ├── hooks.json               #   Hook 事件定义
│   ├── stop-check.sh            #   Stop hook — 任务未完成时阻止退出
│   ├── session-init.sh          #   SessionStart — 自动加载进度
│   └── post-tool-notify.sh      #   PostToolUse — commit 后提醒评估
├── templates/.claude/           # 手动安装布局（cp -r 使用）
│   ├── agents/
│   ├── commands/
│   ├── hooks/
│   └── skills/
├── docs/                        # 文档
│   ├── getting-started.md       # 实际操作指南
│   ├── architecture.md          # 架构设计与原理
│   ├── workflow.md              # 完整工作流指南
│   ├── evaluation-loop.md       # 评估修复循环详解
│   └── best-practices.md        # 最佳实践整理
└── examples/
    └── openspec-integration.md  # 端到端集成示例
```

## 文档

| 文档 | 说明 |
|------|------|
| [docs/getting-started.md](docs/getting-started.md) | 实际操作指南 |
| [docs/architecture.md](docs/architecture.md) | 架构设计与原理 |
| [docs/workflow.md](docs/workflow.md) | 完整工作流指南 |
| [docs/evaluation-loop.md](docs/evaluation-loop.md) | 评估修复循环详解 |
| [docs/best-practices.md](docs/best-practices.md) | Anthropic/OpenAI 最佳实践整理 |
| [docs/verification-strategies.md](docs/verification-strategies.md) | 分层验证策略（L1-L5）与 Playwright |
| [examples/openspec-integration.md](examples/openspec-integration.md) | 端到端集成示例 |

## 参考来源

- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) — harness design 与评估分离
- [Anthropic: Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) — CLAUDE.md 治理与 headless mode
- [OpenAI: A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) — agent 构建模块化
- [Boris Cherny: Claude Code settings.json](https://blog.borischerny.com/p/claude-code-settings-json) — 确定性行为约束
- [HumanLayer: Claude Code best practices](https://humanlayer.dev/blog/claude-code-best-practices) — CLAUDE.md 精简原则

## License

MIT
