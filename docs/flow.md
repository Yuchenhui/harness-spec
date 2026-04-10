# 完整流程图

## 一句话版本

```
/harness:propose → /harness:continue → /harness:continue → /project:harness-apply → /harness:verify → /harness:archive
                                                     │
                                        自动完成以下所有步骤
```

## harness-apply 内部的 4 个 Phase

```
/project:harness-apply add-user-auth
│
├── Phase 0: Spec Review ─────────────────────── 需要你参与（选择题）
│   │
│   ├── Reviewer subagent 审查 specs.md
│   │   输出 JSON 报告：质量评分、问题列表、缺失场景
│   │
│   ├── AskUserQuestion：模糊 scenario 要不要补强？
│   │   ☑ 接受 "register works" → "POST /auth/register → 201"
│   │   ☐ 跳过
│   │   ☐ 我自己改
│   │
│   ├── AskUserQuestion：要不要新增 error/edge case？
│   │   ☑ [error] duplicate email → 409
│   │   ☑ [edge] empty email → 422
│   │   ☐ [edge] password < 8 chars → 422
│   │
│   ├── 回写到 specs.md（直接修改，不建平行文件）
│   │   新增的标 [harness-reviewed]
│   │
│   ├── AskUserQuestion：需要重新生成 tasks 吗？
│   │   ○ 不需要，新增场景属于已有 task (Recommended)
│   │   ○ 重新运行 /harness:continue
│   │
│   └── AskUserQuestion：确认进入下一阶段？
│       ○ 确认 (Recommended)
│       ○ 再看看 / 重新审查
│
├── Phase 1: Initializer ────────────────────── 全自动
│   │
│   ├── Initializer subagent 读取（已审查的）specs.md + tasks.md
│   │
│   ├── 生成：
│   │   ├── feature_tests.json（每个 task 的验证级别和命令）
│   │   ├── tests/test_*.py（有真实断言的测试骨架）
│   │   ├── tests/contracts/*.json（API 契约）
│   │   ├── tests/e2e/*.json（浏览器场景）
│   │   └── tests/conftest.py（fixtures）
│   │
│   ├── 验证：所有测试当前 FAIL（红灯）✅
│   │
│   └── git commit
│
├── Phase 2: Code → Evaluate → Fix ──────────── 全自动（偶尔 L5 需要你看截图）
│   │
│   │  ┌─────────── 对每个 task 循环 ───────────┐
│   │  │                                         │
│   ├──┤  Coding Agent 写实现（不写测试）          │
│   │  │  git commit                              │
│   │  │       ↓                                  │
│   │  │  Evaluator subagent（独立上下文）          │
│   │  │  ├── L2/L3: 跑 pytest/curl               │
│   │  │  ├── L4: Playwright 黑盒浏览器测试         │
│   │  │  └── L5: 截图 → 问你确认                  │
│   │  │       ↓                                  │
│   │  │  PASS → 下一个 task                       │
│   │  │  FAIL → Fixer subagent 修复 → 重新评估    │
│   │  │         （最多 3 次，超过问你）              │
│   │  │                                         │
│   │  └─────────────────────────────────────────┘
│   │
│   └── Stop hook：feature_tests.json 没全 PASS 就不让退出
│
└── Phase 3: 完成 ───────────────────────────── 全自动
    │
    ├── 输出汇总报告
    └── 提示：/harness:verify → /harness:archive
```

## 你需要做什么 vs 自动完成

| 步骤 | 谁做 | 你做什么 |
|------|------|---------|
| `/harness:propose` | 你 | 输入需求描述 |
| `/harness:continue` | OpenSpec | 无 |
| `/harness:continue` | OpenSpec | 无 |
| `/project:harness-apply` | 你 | 输入这一个命令 |
| Phase 0: Spec Review | Reviewer + 你 | **选选择题**（接受/跳过/自己改） |
| Phase 1: Initializer | 自动 | 无 |
| Phase 2: 编码+评估 | 自动 | L5 看截图确认（如果有 UI 样式任务） |
| Phase 2: 3 次修复失败 | 自动 → 你 | 偶尔需要决策 |
| Phase 3: 完成 | 自动 | 无 |
| `/harness:verify` | 你 | 输入命令 |
| `/harness:archive` | 你 | 输入命令 |

## 文件变化时间线

```
开始前:
changes/add-user-auth/
├── proposal.md              ← /harness:propose 生成
├── specs.md                 ← /harness:continue 生成
└── tasks.md                 ← /harness:continue 生成

Phase 0 后:
changes/add-user-auth/
├── proposal.md              ← 不变
├── specs.md                 ← 被 Reviewer 补强（用户确认的修改回写到这里）
└── tasks.md                 ← 不变（或用户选择重新生成）

Phase 1 后:
changes/add-user-auth/
├── proposal.md              ← 不变
├── specs.md                 ← 不变
├── tasks.md                 ← 不变
├── feature_tests.json       ← Initializer 生成
└── claude-progress.txt      ← Initializer 生成

tests/
├── api/test_auth.py         ← Initializer 生成（测试骨架，当前 FAIL）
├── models/test_user.py      ← Initializer 生成
├── contracts/auth.json      ← Initializer 生成
├── e2e/login.json           ← Initializer 生成（如果有 L4 任务）
└── conftest.py              ← Initializer 生成/更新

Phase 2 过程中（每完成一个 task）:
changes/add-user-auth/
├── ...
├── feature_tests.json       ← passes 逐个变成 true
├── claude-progress.txt      ← 持续更新
└── evaluations/
    ├── task-1.1-attempt-1.md ← Evaluator 报告
    └── task-1.2-attempt-1.md

app/                          ← Coding Agent 写的实现代码
├── models/user.py
├── api/auth.py
└── ...

Phase 3 完成后:
  所有 feature_tests.json 的 passes = true
  所有测试 PASS
  → /harness:verify 验证（对齐的 specs.md）
  → /harness:archive 归档全部
```

## Session 中断和恢复

```
任何时刻中断（关了终端、上下文耗尽、网络断了）

下次打开 Claude Code:
│
├── session-init.sh hook 自动运行
│   打印: "Active harness: add-user-auth, 3/6 tasks passed, Next: task 2.2"
│
├── 你输入: /project:harness-apply add-user-auth
│
├── harness-apply 检测到 feature_tests.json 已存在且有 passes=true
│   → 跳过 Phase 0 和 Phase 1
│   → 直接进入 Phase 2，从第一个 passes=false 的 task 继续
│
└── 正常执行剩余 tasks
```
