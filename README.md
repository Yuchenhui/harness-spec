# Harness Engineering for OpenSpec

[English](#english) | [中文](#中文)

---

<a id="english"></a>

## English

> Layer **"what to build"** (OpenSpec) with **"how to build reliably"** (Harness Engineering) — verified, recoverable, self-healing AI-assisted development.

### What is Harness Engineering?

Harness Engineering is a practice framework built around AI coding agents. It solves three fundamental problems:

1. **Self-evaluation bias** — When agents evaluate their own output, they tend to confidently praise it — even when quality is clearly mediocre (Anthropic Research, 2025)
2. **Context exhaustion** — Agents try to do everything at once, often running out of context mid-task, leaving half-finished features
3. **State loss** — Across sessions, a new agent has no idea what the previous one did

### How It Works

```
OpenSpec (What to Build)          Harness (How to Build Reliably)
┌──────────────────────┐          ┌──────────────────────────────┐
│  /opsx:propose       │          │  Initializer                 │
│  /opsx:specs         │    →     │  tasks.md → feature_tests    │
│  /opsx:tasks         │          │                              │
│  /opsx:apply         │          │  Coding Agent (one task)     │
│  /opsx:verify        │          │  Evaluator Agent (independent│
│  /opsx:archive       │          │    verification)             │
└──────────────────────┘          │  Fixer Agent (auto-repair)   │
                                  │  Progress Tracker (recovery) │
                                  └──────────────────────────────┘
```

OpenSpec stays untouched. Harness layers on top using Claude Code native agents, commands, and skills.

### Installation

```bash
# Clone this repo
git clone https://github.com/yuchenhui/harness-spec.git

# Go to your project
cd ~/your-project

# Copy templates
cp -r /path/to/harness-spec/templates/.claude/ .claude/

# If .claude/ already exists, merge manually:
mkdir -p .claude/agents .claude/commands .claude/skills/progress-tracker
cp /path/to/harness-spec/templates/.claude/agents/*.md .claude/agents/
cp /path/to/harness-spec/templates/.claude/commands/*.md .claude/commands/
cp /path/to/harness-spec/templates/.claude/skills/progress-tracker/SKILL.md .claude/skills/progress-tracker/

# Commit
git add .claude/
git commit -m "chore: add harness engineering templates"
```

After installation, your project looks like:

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── evaluator.md        ← Independent verification agent
│   │   └── fixer.md            ← Auto-repair agent
│   ├── commands/
│   │   └── harness-apply.md    ← /project:harness-apply command
│   └── skills/
│       └── progress-tracker/
│           └── SKILL.md        ← Cross-session state recovery
├── CLAUDE.md
└── ...
```

### Usage

```bash
# 1. Create proposal with OpenSpec (unchanged)
/opsx:propose "add-user-auth"
/opsx:specs
/opsx:tasks

# 2. Use harness-apply instead of /opsx:apply  ← the only change
/project:harness-apply add-user-auth

# 3. Verify and archive (unchanged)
/opsx:verify
/opsx:archive
```

What `/project:harness-apply` does automatically:

- Converts tasks.md into verifiable `feature_tests.json`
- Executes tasks **one at a time** (not all at once)
- Launches an **independent evaluator subagent** after each task (not self-judging)
- Auto-launches fixer subagent on failure (max 3 retries)
- Maintains progress files for **cross-session recovery**

Resume after session interruption:

```bash
/project:harness-apply add-user-auth
# Detects existing feature_tests.json → resumes from last incomplete task
```

### Use Without OpenSpec

You can skip OpenSpec entirely. Just create `feature_tests.json` manually:

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
    }
  ]
}
```

Then run:

```bash
/project:harness-apply my-feature
```

### Core Components

| Component | File | Role |
|-----------|------|------|
| Evaluator Agent | `.claude/agents/evaluator.md` | Verifies implementation in independent context |
| Fixer Agent | `.claude/agents/fixer.md` | Minimal code fixes based on evaluation reports |
| Harness Apply | `.claude/commands/harness-apply.md` | Orchestrates the apply → evaluate → fix loop |
| Progress Tracker | `.claude/skills/progress-tracker/SKILL.md` | Manages feature_tests.json and progress state |

### Adapt to Your Tech Stack

Edit `.claude/agents/evaluator.md` tools section:

**Python** (default): `Bash(pytest *)`, `Bash(ruff *)`
**Node.js**: `Bash(npm test *)`, `Bash(npx jest *)`
**Go**: `Bash(go test *)`, `Bash(go vet *)`
**Java**: `Bash(mvn test *)`, `Bash(./gradlew test *)`

---

<a id="中文"></a>

## 中文

> 将 AI Agent 的"做什么"（OpenSpec）和"怎么可靠地做"（Harness Engineering）分层组合，构建可验证、可恢复、可自愈的 AI 辅助开发流程。

### 什么是 Harness Engineering

Harness Engineering 是一套围绕 AI coding agent 构建的工程实践框架，解决 agent 在实际开发中的三个根本问题：

1. **自我评估偏差** — Agent 评估自己的产出时倾向于自信地表扬自己，即使质量明显一般（Anthropic Research, 2025）
2. **上下文耗尽** — Agent 倾向于一次性完成所有事情，经常在上下文窗口中间耗尽，留下半完成的 feature
3. **状态丢失** — 跨 session 时，新的 agent 不知道之前做了什么，从零开始理解项目

### 工作原理

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

### 安装

```bash
# 克隆本仓库
git clone https://github.com/yuchenhui/harness-spec.git

# 进入你的项目
cd ~/your-project

# 复制模板
cp -r /path/to/harness-spec/templates/.claude/ .claude/

# 如果 .claude/ 目录已存在，手动合并：
mkdir -p .claude/agents .claude/commands .claude/skills/progress-tracker
cp /path/to/harness-spec/templates/.claude/agents/*.md .claude/agents/
cp /path/to/harness-spec/templates/.claude/commands/*.md .claude/commands/
cp /path/to/harness-spec/templates/.claude/skills/progress-tracker/SKILL.md .claude/skills/progress-tracker/

# 提交
git add .claude/
git commit -m "chore: add harness engineering templates"
```

安装后的项目结构：

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── evaluator.md        ← 独立评估 agent
│   │   └── fixer.md            ← 自动修复 agent
│   ├── commands/
│   │   └── harness-apply.md    ← /project:harness-apply 命令
│   └── skills/
│       └── progress-tracker/
│           └── SKILL.md        ← 跨 session 状态恢复
├── CLAUDE.md
└── ...
```

### 使用方法

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

### 不用 OpenSpec 也能用

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

### 核心组件

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| Evaluator Agent | `.claude/agents/evaluator.md` | 在独立上下文中验证实现 |
| Fixer Agent | `.claude/agents/fixer.md` | 根据评估报告做最小修复 |
| Harness Apply | `.claude/commands/harness-apply.md` | 编排 apply → evaluate → fix 循环 |
| Progress Tracker | `.claude/skills/progress-tracker/SKILL.md` | 管理 feature_tests.json 和进度状态 |

### 适配你的技术栈

编辑 `.claude/agents/evaluator.md` 的 tools 部分：

**Python**（默认）：`Bash(pytest *)`、`Bash(ruff *)`
**Node.js**：`Bash(npm test *)`、`Bash(npx jest *)`
**Go**：`Bash(go test *)`、`Bash(go vet *)`
**Java**：`Bash(mvn test *)`、`Bash(./gradlew test *)`

---

## Documentation / 文档

| Doc | Description |
|-----|-------------|
| [docs/getting-started.md](docs/getting-started.md) | Step-by-step usage guide / 实际操作指南 |
| [docs/architecture.md](docs/architecture.md) | Architecture & design principles / 架构设计与原理 |
| [docs/workflow.md](docs/workflow.md) | Full workflow guide / 完整工作流指南 |
| [docs/evaluation-loop.md](docs/evaluation-loop.md) | Evaluation-fix loop details / 评估修复循环详解 |
| [docs/best-practices.md](docs/best-practices.md) | Best practices from Anthropic/OpenAI / 最佳实践整理 |
| [examples/openspec-integration.md](examples/openspec-integration.md) | End-to-end integration example / 端到端集成示例 |

## References

- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) — harness design & evaluation separation
- [Anthropic: Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) — CLAUDE.md governance & headless mode
- [OpenAI: A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) — modular agent building blocks
- [Boris Cherny: Claude Code settings.json](https://blog.borischerny.com/p/claude-code-settings-json) — deterministic behavior constraints
- [HumanLayer: Claude Code best practices](https://humanlayer.dev/blog/claude-code-best-practices) — lean CLAUDE.md principles

## License

MIT
