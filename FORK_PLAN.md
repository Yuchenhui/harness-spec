# Fork 改造计划

## 当前仓库结构

```
harness-spec/
├── upstream-openspec/       ← OpenSpec 原始源码（21,847 行 TS，参考用）
├── docs/                    ← 我们写的 harness engineering 文档
├── agents/                  ← Claude Code agent 模板（plugin 布局）
├── commands/                ← Claude Code command 模板
├── hooks/                   ← Hook 脚本
├── skills/                  ← Skill 模板
├── templates/               ← 手动安装布局
├── README.md                ← English
└── README_CN.md             ← 中文
```

## 改造目标

从 `upstream-openspec/` 提取核心，与我们的 harness 设计融合，产出：

```
harness-spec/
├── src/                     ← TypeScript 源码（从 OpenSpec 核心 + 我们的新增）
│   ├── cli/                 ← CLI 入口（改名后的命令）
│   ├── core/
│   │   ├── artifact-graph/  ← 保留：DAG 依赖系统
│   │   ├── schema/          ← 保留：Schema 解析
│   │   ├── specs-apply.ts   ← 保留：Delta spec 合并
│   │   ├── archive.ts       ← 保留：归档逻辑
│   │   ├── config.ts        ← 精简：只保留 Claude Code
│   │   ├── init.ts          ← 改造：初始化流程加入 harness 配置
│   │   └── templates/
│   │       └── workflows/   ← 重写：我们的 harness workflow
│   │           ├── propose.ts        ← 保留 OpenSpec 原版
│   │           ├── explore.ts        ← 保留 OpenSpec 原版
│   │           ├── review.ts         ← 新增：Spec Reviewer (Phase 0)
│   │           ├── init-tests.ts     ← 新增：Initializer (Phase 1)
│   │           ├── harness-apply.ts  ← 替换：Harness 循环 (Phase 2)
│   │           ├── verify.ts         ← 增强：分层验证 L1-L5
│   │           └── archive.ts        ← 保留 OpenSpec 原版
│   ├── adapters/
│   │   └── claude.ts        ← 只保留 Claude Code adapter
│   ├── hooks/               ← 新增：Hook 系统
│   │   ├── stop-check.ts
│   │   ├── session-init.ts
│   │   └── post-commit.ts
│   └── index.ts
├── schemas/
│   └── harness-driven/      ← 新增：我们的 workflow schema
│       ├── schema.yaml
│       └── templates/       ← proposal.md, design.md, specs.md, tasks.md 模板
├── docs/                    ← 保留：我们的文档
├── test/                    ← 保留 OpenSpec 的测试 + 新增
├── package.json             ← 改名、改依赖
├── tsconfig.json            ← 保留
├── README.md
└── README_CN.md
```

## 分步改造清单

### Phase 1: 提取核心（删掉不需要的）

从 `upstream-openspec/src/` 复制到 `src/`，跳过以下：

**删除的文件/目录：**
- [ ] `src/core/command-generation/adapters/` — 删 23 个非 Claude 适配器，只保留 `claude.ts`
- [ ] `src/telemetry/` — 删除 PostHog 遥测
- [ ] `src/ui/` — 删除 ASCII art 欢迎界面
- [ ] `src/prompts/` — 删除自定义 searchable prompt（用 AskUserQuestion 替代）
- [ ] `src/core/completions/` — 暂时删除 shell 补全（后续可加回）

**预估删除：~8,000 行（651 文件 → ~200 文件）**

### Phase 2: 重命名

全局替换：
- [ ] `openspec` → `harness`（目录名、配置路径、变量名）
- [ ] `/opsx:` → `/harness:`（slash command 前缀）
- [ ] `@fission-ai/openspec` → `@yuchenhui/harness-spec`（package name）
- [ ] `OPENSPEC_DIR_NAME` → `HARNESS_DIR_NAME`
- [ ] CLI 命令 `openspec` → `harness`

### Phase 3: 改造 Schema

创建 `schemas/harness-driven/schema.yaml`，基于 OpenSpec 的 `spec-driven` 但新增 harness phases：

```yaml
name: harness-driven
description: Spec-driven development with harness engineering verification

artifacts:
  - id: proposal
    generates: proposal.md
    template: templates/proposal.md
    instruction: instructions/proposal.md

  - id: design
    generates: design.md
    requires: [proposal]
    template: templates/design.md
    instruction: instructions/design.md

  - id: specs
    generates: specs.md
    requires: [proposal]
    template: templates/specs.md
    instruction: instructions/specs.md

  # ---- 以下为 Harness 新增 ----

  - id: review
    generates: specs.md  # 回写到同一文件
    requires: [specs, design]
    instruction: instructions/review.md
    interactive: true  # 需要用户交互确认

  - id: tasks
    generates: tasks.md
    requires: [specs]  # review 后的 specs
    template: templates/tasks.md
    instruction: instructions/tasks.md

  - id: init-tests
    generates: feature_tests.json
    requires: [specs, tasks]
    instruction: instructions/init-tests.md

apply:
  requires: [tasks, init-tests]
  tracks: tasks.md
  phases:
    - coding      # Coding Agent 写实现
    - evaluate    # Evaluator subagent 验证
    - fix         # Fixer subagent 修复（如需要）
```

### Phase 4: 重写 Workflow Templates

**保留（微调）：**
- [ ] `propose.ts` — OpenSpec 的 propose 流程，微调措辞
- [ ] `explore.ts` — OpenSpec 的 explore 模式，保持

**新增：**
- [ ] `review.ts` — Spec Reviewer（我们的 Phase 0）
  - 审查 proposal → design → specs → tasks 全链路
  - 输出 JSON 报告
  - 交互式确认（AskUserQuestion）
  - 回写到 specs.md

- [ ] `init-tests.ts` — Initializer（我们的 Phase 1）
  - 从 specs 生成测试骨架
  - 生成 API 契约
  - 生成浏览器场景
  - 生成 feature_tests.json

**替换：**
- [ ] `apply.ts` → `harness-apply.ts`（我们的 Phase 2）
  - 逐任务执行 + Evaluator + Fixer 循环
  - 分层验证 L1-L5
  - Stop hook 集成
  - 跨 session 恢复

**增强：**
- [ ] `verify.ts` — 增加分层验证（L1-L5），Playwright MCP 支持

**保留：**
- [ ] `archive.ts` — OpenSpec 的归档逻辑 + 打包 harness 评估报告

### Phase 5: Hook 系统

- [ ] 在 init 流程中自动生成 hooks 配置
- [ ] `stop-check.ts` — 阻止未完成退出
- [ ] `session-init.ts` — 自动恢复状态
- [ ] `post-commit.ts` — commit 后提醒评估

### Phase 6: Playwright MCP 集成

- [ ] L4 任务的浏览器验证配置
- [ ] init 流程中检测是否需要 Playwright 并提示安装

## 保留的 OpenSpec 核心代码清单

| 文件 | 行数 | 为什么保留 |
|------|------|-----------|
| `src/core/artifact-graph/graph.ts` | ~200 | DAG 拓扑排序、就绪/阻塞查询 |
| `src/core/artifact-graph/schema.ts` | ~250 | YAML schema 加载、环检测 |
| `src/core/artifact-graph/state.ts` | ~100 | 文件系统状态检测 |
| `src/core/artifact-graph/resolver.ts` | ~150 | 3 层 schema 解析 |
| `src/core/artifact-graph/instruction-loader.ts` | ~200 | 模板+上下文+规则生成 |
| `src/core/specs-apply.ts` | ~480 | Delta spec CRUD 合并 |
| `src/core/archive.ts` | ~400 | 归档验证和执行 |
| `src/core/config.ts` | ~100 | 精简后的配置（只保留 Claude） |
| `src/core/init.ts` | ~300 | 改造后的初始化 |
| `src/core/project-config.ts` | ~200 | 项目配置 |
| `src/core/global-config.ts` | ~150 | 全局配置 |
| `src/core/command-generation/generator.ts` | ~100 | 命令文件生成 |
| `src/core/command-generation/adapters/claude.ts` | ~50 | Claude Code 适配器 |
| `src/core/validation/` | ~300 | Spec/Change 验证 |
| `src/core/parsers/` | ~200 | Markdown 解析 |
| `src/utils/` | ~500 | 文件操作等工具函数 |
| **总计** | **~3,700** | **占原 21,847 行的 17%** |
