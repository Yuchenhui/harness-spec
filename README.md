# Harness Engineering for OpenSpec

> 将 AI Agent 的"做什么"（OpenSpec）和"怎么可靠地做"（Harness Engineering）分层组合，构建可验证、可恢复、可自愈的 AI 辅助开发流程。

## 什么是 Harness Engineering

Harness Engineering 是一套围绕 AI coding agent 构建的工程实践框架，核心目标是解决 agent 在实际开发中的三个根本问题：

1. **自我评估偏差** — Agent 评估自己的产出时倾向于自信地表扬自己，即使质量明显一般（Anthropic Research, 2025）
2. **上下文耗尽** — Agent 倾向于一次性完成所有事情，经常在上下文窗口中间耗尽，留下半完成的 feature
3. **状态丢失** — 跨 session 时，新的 agent 不知道之前做了什么，从零开始理解项目

## 设计哲学

```
OpenSpec (What to Build)          Harness (How to Build Reliably)
┌──────────────────────┐          ┌──────────────────────────────┐
│  /opsx:propose       │          │  Initializer Agent           │
│  /opsx:specs         │    →     │  tasks.md → feature_tests    │
│  /opsx:tasks         │          │                              │
│  /opsx:apply         │          │  Coding Agent (单任务执行)    │
│  /opsx:verify        │          │  Evaluator Agent (独立评估)   │
│  /opsx:archive       │          │  Fixer Agent (自动修复)       │
└──────────────────────┘          │  Progress Tracker (状态恢复)  │
                                  └──────────────────────────────┘
```

**OpenSpec 不需要修改**。Harness 作为独立层叠加在 OpenSpec 之上，通过 Claude Code 原生的 agents、commands 和 skills 机制实现。

## 核心组件

| 组件 | 文件路径 | 职责 |
|------|---------|------|
| Evaluator Agent | `.claude/agents/evaluator.md` | 独立上下文中验证实现是否满足 spec scenarios |
| Fixer Agent | `.claude/agents/fixer.md` | 根据评估报告自动修复代码 |
| Harness Apply Command | `.claude/commands/harness-apply.md` | 编排完整的 apply → evaluate → fix 循环 |
| Progress Tracker Skill | `.claude/skills/progress-tracker/` | 管理 feature_tests.json 和 claude-progress.txt |

## 快速开始

### 1. 复制模板到你的项目

```bash
cp -r templates/.claude/ your-project/.claude/
```

### 2. 用 OpenSpec 创建提案（不变）

```
/opsx:propose "add-dark-mode-toggle"
/opsx:specs
/opsx:tasks
```

### 3. 用 Harness Apply 替代直接 apply

```
/harness-apply add-dark-mode-toggle
```

这个命令会自动：
- 读取 tasks.md 生成可验证的 feature_tests.json
- 逐个任务执行（而非一次性全做）
- 每完成一个任务启动独立 evaluator 验证
- 验证失败时自动启动 fixer 修复（最多 3 次）
- 维护 progress.txt 确保跨 session 可恢复

### 4. 验证和归档（不变）

```
/opsx:verify
/opsx:archive
```

## 文档结构

```
harness-spec/
├── README.md                          # 本文件
├── docs/
│   ├── architecture.md                # 架构设计与原理
│   ├── workflow.md                    # 完整工作流指南
│   ├── evaluation-loop.md             # 评估-修复循环详解
│   └── best-practices.md             # Anthropic/OpenAI 最佳实践整理
├── templates/
│   ├── .claude/
│   │   ├── agents/
│   │   │   ├── evaluator.md           # 评估 agent 模板
│   │   │   └── fixer.md              # 修复 agent 模板
│   │   ├── commands/
│   │   │   └── harness-apply.md       # harness-apply 命令模板
│   │   └── skills/
│   │       └── progress-tracker/
│   │           └── SKILL.md           # 进度追踪 skill 模板
│   └── feature_tests.json.example     # feature_tests.json 示例
└── examples/
    └── openspec-integration.md        # OpenSpec 集成示例
```

## 适用场景

- 使用 Claude Code 作为主要开发工具的项目
- 已经在使用或计划使用 OpenSpec 管理变更的项目
- 需要 AI agent 在长任务中保持可靠性的场景
- 多 session 开发、需要状态恢复的复杂 feature

## 参考来源

- [Anthropic: How we built our multi-agent research system](https://www.anthropic.com/engineering/built-multi-agent-research-system) — harness design 与评估分离
- [Anthropic: Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) — CLAUDE.md 治理与 headless mode
- [OpenAI: A practical guide to building agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf) — agent 构建模块化
- [Boris Cherny: Claude Code settings.json](https://blog.borischerny.com/p/claude-code-settings-json) — 确定性行为约束
- [HumanLayer: Claude Code best practices](https://humanlayer.dev/blog/claude-code-best-practices) — CLAUDE.md 精简原则

## License

MIT
