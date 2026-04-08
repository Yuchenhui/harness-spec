---
name: progress-tracker
description: "Manages feature_tests.json and claude-progress.txt for cross-session state recovery in harness engineering workflows."
---

# Progress Tracker Skill

管理 harness engineering 的状态文件，确保跨 session 的工作连续性。

## 触发条件

当以下情况时自动激活：
- 新 session 开始且项目中存在 `changes/*/feature_tests.json`
- 用户运行 `/harness-apply` 命令
- 用户询问当前进度或状态

## 核心功能

### 1. 状态查询

读取并汇报当前 harness 执行状态：

```
读取文件:
1. changes/<change-id>/feature_tests.json
2. changes/<change-id>/claude-progress.txt
3. git log --oneline -10

输出:
- 当前 change: <change-id>
- 进度: {completed}/{total} tasks
- 上次操作: <timestamp> — <description>
- 下一个任务: Task {id} — {description}
```

### 2. 进度更新

当一个任务的评估状态变化时，同步更新两个文件：

#### 更新 feature_tests.json

```json
// 找到对应 task，更新以下字段:
{
  "passes": true,           // false → true
  "last_evaluated": "ISO8601 timestamp",
  "evaluation_attempts": 2  // 记录总尝试次数
}
```

#### 更新 claude-progress.txt

```markdown
# Progress: <change-id>
## Last Updated: <新 timestamp>
## Status: IN_PROGRESS ({n}/{total} tasks completed)

### Completed
- [x] 1.1 Create User model (commit: abc1234)   ← 新增一行
- [x] 1.2 Add register endpoint (commit: def5678)

### In Progress
- [ ] 2.1 Add login endpoint   ← 移到这里

### Remaining
- [ ] 2.2 Add JWT middleware
- [ ] 3.1 Add password reset

### Notes
- {添加本次操作的关键信息，供下一个 session 参考}
```

### 3. Session 初始化

新 session 启动时，快速建立上下文：

```
执行步骤:
1. pwd → 确认工作目录
2. ls changes/ → 列出所有 change
3. 对最近的 change:
   a. cat feature_tests.json → 解析进度
   b. cat claude-progress.txt → 读取上下文
   c. git log --oneline -20 → 理解最近历史
4. 汇报状态给用户
```

输出示例：
```
📊 项目状态汇报

当前活跃变更: add-user-authentication
进度: 3/7 tasks 已完成 (43%)

已完成:
  ✅ 1.1 Create User model
  ✅ 1.2 Add register endpoint
  ✅ 2.1 Add login endpoint

下一步:
  → 2.2 Add JWT middleware

注意事项 (来自 progress notes):
  - JWT secret 配置在 .env 的 JWT_SECRET_KEY
  - Token 过期时间需求: 24h (见 specs.md section 3)
```

### 4. 异常恢复

处理非正常中断后的状态恢复：

**场景 A: feature_tests.json 标记 passes 但代码不存在**
```
检测: git diff 发现 feature_tests 中 passes=true 的 task 对应的代码不在工作树中
原因: 可能 git reset 或 branch 切换
操作: 将对应 task 的 passes 重置为 false，提示用户
```

**场景 B: progress.txt 和 feature_tests.json 不一致**
```
检测: progress.txt 显示 3 个完成，feature_tests.json 只有 2 个 passes=true
操作: 以 feature_tests.json 为准，更新 progress.txt
```

**场景 C: 有未提交的代码改动**
```
检测: git status 显示 uncommitted changes
操作: 提示用户 — "发现未提交的改动，可能是上次 session 的未完成工作。
  是否先 commit 这些改动再继续？"
```

## 文件格式规范

### feature_tests.json Schema

```json
{
  "change_id": "string — 与 changes/ 目录名一致",
  "created_at": "string — ISO8601 timestamp",
  "evaluation_config": {
    "max_retries": "number — 默认 3",
    "require_test_coverage": "boolean — 默认 true",
    "require_type_check": "boolean — 默认 false",
    "require_lint_pass": "boolean — 默认 true",
    "custom_checks": ["string — 自定义验证命令"]
  },
  "tasks": [
    {
      "id": "string — 任务编号如 '1.1'",
      "description": "string — 任务描述",
      "spec_scenarios": ["string — Given/When/Then 格式"],
      "verification_commands": ["string — 可执行的验证命令"],
      "passes": "boolean",
      "last_evaluated": "string|null — ISO8601 timestamp",
      "evaluation_attempts": "number — 评估次数"
    }
  ]
}
```

### claude-progress.txt 格式

```
# Progress: {change_id}
## Last Updated: {ISO8601 timestamp}
## Status: {IN_PROGRESS|COMPLETED|BLOCKED} ({n}/{total} tasks completed)

### Completed
- [x] {id} {description} (commit: {short-hash})

### In Progress
- [ ] {id} {description}

### Remaining
- [ ] {id} {description}

### Blocked (if any)
- {id} {description}: {原因}

### Notes
- {任何下一个 session 需要知道的信息}
- {环境配置要点、已知问题、设计决策等}
```
