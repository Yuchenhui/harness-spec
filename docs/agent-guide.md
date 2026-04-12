# Agent 使用指南 / Agent Usage Guide

## 哪个阶段用哪个 Agent

Harness 流程中每个阶段可以调用不同的 agent。有些是**自动调用**的（harness-apply 内部启动 subagent），有些是**用户按需调用**的（`@agent-name` 或 Task 工具）。

```
/harness:explore                           ← 可用: deep-research-agent
     ↓
/harness:new + /harness:continue              ← 可用: requirements-analyst, system-architect,
     ↓                                          backend-architect, frontend-architect,
     ↓                                          ui-ux-designer
Phase 0: /harness:review                   ← 自动: spec-reviewer
     ↓                                    可用: security-engineer
Phase 1: init-tests                     ← 自动: initializer
     ↓                                    可用: quality-engineer
Phase 2: code → evaluate → fix          ← 自动: evaluator, fixer
     ↓                                    可用: root-cause-analyst, python-expert,
     ↓                                          security-engineer, performance-engineer,
     ↓                                          idempotent-db-script-generator
Phase 3: /harness:verify + /harness:archive   ← 自动: verify 增强版
                                          可用: technical-writer, performance-engineer
```

## 自动调用的 Agent（Harness 内建）

这些 agent 在 `/harness:apply` 执行时自动启动为 subagent，不需要用户手动调用：

| Agent | 阶段 | 触发条件 | 做什么 |
|-------|------|---------|--------|
| **spec-reviewer** | Phase 0 | `/harness:review` 或 `/harness:apply` 开始时 | 审查 specs 质量，交互式补强 |
| **initializer** | Phase 1 | review 通过后 | 从 specs 生成测试骨架 |
| **evaluator** | Phase 2 | 每个 task 编码完成后 | 独立上下文验证实现 |
| **fixer** | Phase 2 | evaluator 报 FAIL 时 | 最小修复，最多 3 次 |

## 用户按需调用的 Agent（@agent）

这些 agent 在 `/harness:continue` 的分步过程中或任何时候按需 `@agent-name` 调用：

### 探索 & 需求阶段

| Agent | 用在哪 | 怎么用 | 价值 |
|-------|--------|--------|------|
| **deep-research-agent** | `/harness:explore` | `@deep-research-agent 帮我调研 JWT vs Session 的选型` | 系统性调研，多轮推理 |
| **requirements-analyst** | `/harness:continue` 生成 specs 时 | `@requirements-analyst 帮我从这个需求提取完整的 specs` | 需求→specs 转化，防遗漏 |
| **system-architect** | `/harness:continue` 生成 design 时 | `@system-architect 审查这个架构设计` | 架构级审查，识别反模式 |
### 设计阶段

| Agent | 用在哪 | 怎么用 | 价值 |
|-------|--------|--------|------|
| **backend-architect** | `/harness:continue` 生成 design 时 | `@backend-architect 帮我设计这个 API 和数据库` | API 设计、DB schema、安全 |
| **frontend-architect** | `/harness:continue` 生成 design 时 | `@frontend-architect 帮我设计前端组件架构` | 组件拆分、响应式、性能 |
| **ui-ux-designer** | `/harness:continue` 生成 design 时 | `@ui-ux-designer 帮我设计这个页面的交互` | UI 规范、设计系统、可访问性 |

### 编码阶段（Phase 2）

| Agent | 用在哪 | 怎么用 | 价值 |
|-------|--------|--------|------|
| **python-expert** | 实现 Python 任务时 | `@python-expert 帮我实现这个 async 函数` | 语言级最佳实践 |
| **idempotent-db-script-generator** | 数据库迁移任务时 | `@idempotent-db-script-generator 生成安全的迁移脚本` | 幂等 DDL，回滚安全 |
| **root-cause-analyst** | evaluator 失败且 fixer 搞不定时 | `@root-cause-analyst 帮我分析为什么这个测试一直失败` | 深度调试，假设检验 |
| **security-engineer** | 涉及认证/权限的任务时 | `@security-engineer 审查这段认证代码` | 漏洞扫描，威胁建模 |
| **performance-engineer** | 性能敏感的任务时 | `@performance-engineer 帮我优化这个查询` | 性能分析，瓶颈定位 |

### 完成阶段（Phase 3）

| Agent | 用在哪 | 怎么用 | 价值 |
|-------|--------|--------|------|
| **technical-writer** | 归档前补文档 | `@technical-writer 帮我写这个 API 的文档` | 文档生成，API docs |
| **refactoring-expert** | 归档前清理代码 | `@refactoring-expert 帮我重构这段代码` | 技术债清理 |

### 工具类

| Agent/Command | 用在哪 | 做什么 |
|-------|--------|--------|
| **/git-commit** | Phase 2 每个 task 完成后 | 智能分组 conventional commit |
| **get-current-datetime** | 任何时候 | 获取当前时间戳 |

## 推荐的工作流示例

### 示例 A：后端 API Feature（深度使用 agent）

```
/harness:explore "添加用户认证系统"
  @deep-research-agent JWT vs Session 对比分析

/harness:new add-user-auth
/harness:continue                          # 生成 proposal

/harness:continue                          # 生成 specs
  @requirements-analyst 补充边界情况

/harness:continue                          # 生成 design
  @backend-architect 审查 API 和数据库设计
  @security-engineer 审查安全设计

/harness:continue                          # 生成 tasks

/harness:apply                             # Harness 接管
  # Phase 0: spec-reviewer 自动审查
  # Phase 1: initializer 自动生成测试
  # Phase 2: 逐任务执行
  #   → 某个 DB 任务: @idempotent-db-script-generator
  #   → evaluator 3 次失败: @root-cause-analyst 分析
  # Phase 3: 完成
  @technical-writer 补充 API 文档

/harness:archive
```

### 示例 B：快速小改动（最少 agent）

```
/harness:propose "fix-login-bug"           # 一步到位
/harness:apply                             # Harness 自动完成全部
/git-commit                             # 规范化提交
/harness:archive
```
