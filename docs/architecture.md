# 架构设计与原理

## 核心问题

当 AI agent（如 Claude Code）执行复杂的开发任务时，存在三个结构性问题：

### 1. 自我评估偏差 (Self-Evaluation Bias)

> "当 agent 被要求评估自己产出的工作时，它们倾向于自信地表扬自己——即使在人类观察者看来质量明显一般。"
> — Anthropic, How We Built Our Multi-Agent Research System

这意味着让同一个 agent 既写代码又判断代码是否满足需求，是不可靠的。Agent 自己勾选 tasks.md 里的 checkbox 不代表任务真的完成了。

### 2. 上下文贪婪 (Context Greediness)

> "Agent 倾向于一次性完成所有事情，结果经常在上下文窗口中间耗尽，留下半完成的 feature 和零文档给下一个 session。"
> — Anthropic, Claude Code Best Practices

OpenSpec 的 tasks.md 可能列出 10-15 个子任务，如果 `/opsx:apply` 让 agent 一口气全做，大概率后面几个任务质量急剧下降。

### 3. 状态断裂 (State Discontinuity)

每个新的 Claude Code session 启动时，agent 对项目的理解从零开始。它需要：
- 读 git log 理解历史
- 读代码理解当前状态
- 猜测下一步该做什么

如果没有显式的进度文件，agent 可能重复已完成的工作，或跳过关键步骤。

## 架构设计

Harness 采用 **四层架构**，每层解决一个特定问题：

```
┌─────────────────────────────────────────────────────┐
│                  编排层 (Orchestration)               │
│              harness-apply command                    │
│         读 tasks → 分发 → 循环 → 汇总                  │
├─────────────────────────────────────────────────────┤
│                  执行层 (Execution)                    │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│     │ Coding   │→ │Evaluator │→ │  Fixer   │        │
│     │ Agent    │  │ Agent    │  │  Agent   │        │
│     │(主上下文) │  │(独立上下文)│  │(独立上下文)│        │
│     └──────────┘  └──────────┘  └──────────┘        │
├─────────────────────────────────────────────────────┤
│                  状态层 (State)                        │
│   feature_tests.json  │  claude-progress.txt         │
│   评估报告             │  git history                 │
├─────────────────────────────────────────────────────┤
│                  规约层 (Specification)                │
│         OpenSpec: specs.md / tasks.md                 │
│         CLAUDE.md: 项目级约束                          │
└─────────────────────────────────────────────────────┘
```

### 编排层：harness-apply command

这是整个系统的入口和控制器。它负责：

- 从 OpenSpec 的 tasks.md 读取任务列表
- 调用 initializer 将每个 task 转化为可验证的 feature_tests.json 条目
- 按顺序（而非并行）执行每个任务
- 在每个任务完成后启动独立的 evaluator
- 根据评估结果决定是标记通过还是启动 fixer
- 维护全局进度状态

### 执行层：三个独立的 Agent

**Coding Agent**（主上下文）：
- 就是用户当前的 Claude Code session
- 负责实际的代码编写
- 每次只处理一个任务，不越界

**Evaluator Agent**（独立上下文，通过 subagent 启动）：
- 使用全新的上下文窗口，没有对刚写的代码的偏见
- 只读取代码和测试结果，不做任何修改
- 输出结构化的 PASS/FAIL 报告

**Fixer Agent**（独立上下文，通过 subagent 启动）：
- 读取 evaluator 的失败报告
- 针对性地修复问题
- 修复后再次触发 evaluator 验证

### 状态层：持久化的进度文件

**feature_tests.json**：
```json
{
  "change_id": "add-dark-mode",
  "created_at": "2025-01-15T10:00:00Z",
  "tasks": [
    {
      "id": "1.1",
      "description": "Add theme context provider",
      "spec_scenarios": [
        "Given dark mode toggle, When clicked, Then body class changes to 'dark'"
      ],
      "verification_commands": [
        "pytest tests/test_theme.py -v",
        "curl -s http://localhost:8000/api/theme | jq .mode"
      ],
      "passes": false,
      "last_evaluated": null,
      "evaluation_attempts": 0
    }
  ]
}
```

**claude-progress.txt**：
```
# Progress: add-dark-mode
## Last Updated: 2025-01-15 14:30
## Status: IN_PROGRESS (3/7 tasks completed)

### Completed
- [x] 1.1 Add theme context provider (commit: abc1234)
- [x] 1.2 Create CSS variables for dark theme (commit: def5678)
- [x] 2.1 Update header component (commit: ghi9012)

### In Progress
- [ ] 2.2 Update sidebar component

### Remaining
- [ ] 2.3 Update card components
- [ ] 3.1 Add toggle animation
- [ ] 3.2 Persist preference to localStorage

### Notes
- Theme provider uses React Context, see src/contexts/ThemeContext.tsx
- CSS variables defined in src/styles/themes.css
- Dark mode class applied to <body> element
```

### 规约层：OpenSpec + CLAUDE.md

这层保持不变。OpenSpec 的 specs.md 和 tasks.md 是输入，CLAUDE.md 提供项目级约束。

## 关键设计决策

### 为什么不 fork OpenSpec？

1. **职责分离**：OpenSpec 管 "what"，Harness 管 "how"，天然正交
2. **维护成本**：OpenSpec 有 23 个 tool adapter，在快速迭代，fork 后 rebase 成本高
3. **最小侵入**：4 个 markdown 文件 vs 整个 TypeScript 项目的维护
4. **可组合性**：Harness 可以独立于 OpenSpec 使用，也可以和其他 spec 工具配合

### 为什么用 subagent 而不是同一个 session？

Anthropic 的研究明确指出："用一个 session 写代码，用新的 session 做审查，因为新上下文不会对刚写的代码有偏见。" Claude Code 的 `Task` 工具（subagent）天然提供了独立上下文的能力，这比在同一个 session 里切换角色要可靠得多。

### 为什么限制重试次数为 3？

- 第 1 次修复：通常能解决 70% 的简单问题（语法错误、import 缺失、变量名错误）
- 第 2 次修复：能解决需要理解上下文的中等问题（逻辑错误、边界条件）
- 第 3 次修复：如果到这里还没解决，说明问题可能是需求理解偏差或架构问题，需要人类介入
- 超过 3 次的自动修复更容易引入新问题而非解决现有问题

### 为什么逐任务执行而非并行？

1. 任务之间通常有依赖关系（task 2 依赖 task 1 的输出）
2. 逐个执行使每个任务的上下文窗口利用率最大化
3. 失败时能精确定位到具体任务，而非面对多个并行失败
4. 进度文件可以在每个任务完成后立即更新，支持随时中断和恢复
