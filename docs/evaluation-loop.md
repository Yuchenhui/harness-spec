# 评估-修复循环详解

## 为什么需要独立评估

### 问题：自我评估偏差

在传统的 `/opsx:apply` 流程中，agent 自己写代码、自己判断是否完成、自己勾选 tasks.md 的 checkbox。这引入了系统性偏差：

```
传统流程（不可靠）：
Agent 写代码 → Agent 自测 → Agent 说 "完成了" → ✅ [x] Task done
                                                      ↑
                                              这个 ✅ 可信吗？
```

Anthropic 在构建多 agent 研究系统时发现了同样的问题，并给出了明确答案：

> "我们发现让前端生成和评估分开到不同 agent 中，建立一个反馈环来驱动生成器产出更好的结果，效果显著提升。"

### 解决方案：生成/评估分离

```
Harness 流程（可靠）：
Coding Agent 写代码 → git commit → Evaluator Agent 验证 → PASS/FAIL
     ↑                              (独立上下文)              │
     │                                                       │
     └──────────── Fixer Agent 修复 ←── FAIL ────────────────┘
```

关键点：Evaluator Agent 运行在**独立的上下文窗口**中，它没有看到 coding agent 的思考过程，没有对代码的"创作者偏见"。它只看到：
1. 代码的当前状态
2. 测试的运行结果
3. spec scenarios 的验证条件

## 评估循环的完整流程

### Step 1: Coding Agent 完成任务

Coding agent 根据 feature_tests.json 中当前任务的描述和 spec_scenarios 进行编码：

```python
# Coding agent 的工作范围
# 任务: "Add /auth/register endpoint"
# Spec: "Given valid email and password, When POST /auth/register, Then return 201"

# 写实现
@router.post("/auth/register", status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(email=user_data.email)
    user.set_password(user_data.password)
    db.add(user)
    await db.commit()
    return {"user_id": user.id}

# 写测试
async def test_register_success(client):
    response = await client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    assert response.status_code == 201
    assert "user_id" in response.json()
```

完成后执行 `git commit`。

### Step 2: 启动 Evaluator Subagent

通过 Claude Code 的 Task 工具启动独立的 evaluator：

```
启动 evaluator subagent:
- 模型: sonnet (更快、成本更低，且评估不需要最强的创造力)
- 工具: Bash(read-only), Read, Glob, Grep
- 输入: feature_tests.json 中当前任务的条目
```

Evaluator 的执行步骤：

**2a. 运行验证命令**

```bash
# 执行 feature_tests.json 中定义的 verification_commands
pytest tests/api/test_auth.py::test_register -v
pytest tests/api/test_auth.py::test_register_duplicate -v
```

**2b. 检查 Spec Scenario 覆盖**

Evaluator 逐条检查每个 spec scenario 是否有对应的测试覆盖：

```
Scenario: "Given valid email and password, When POST /auth/register, Then return 201"
→ 检查: test_register_success 测试了 POST /auth/register 并断言 status_code == 201
→ 结果: ✅ COVERED

Scenario: "Given duplicate email, When POST /auth/register, Then return 409 Conflict"
→ 检查: test_register_duplicate 测试了重复邮箱注册
→ 结果: ❌ NOT COVERED — 测试存在但 endpoint 没有处理重复邮箱的逻辑
```

**2c. 静态检查（可选）**

```bash
# 类型检查
mypy app/api/auth.py --no-error-summary

# Lint
ruff check app/api/auth.py
```

**2d. 生成评估报告**

```markdown
## Evaluation Report: Task 1.2 — Add /auth/register endpoint

**Status: FAIL**
**Evaluated at: 2025-01-15T14:30:00Z**
**Attempt: 1/3**

### Verification Commands
| Command | Result |
|---------|--------|
| `pytest tests/api/test_auth.py::test_register -v` | ✅ 1 passed |
| `pytest tests/api/test_auth.py::test_register_duplicate -v` | ❌ 1 failed |

### Test Failures
```
FAILED tests/api/test_auth.py::test_register_duplicate
    assert response.status_code == 409
    AssertionError: assert 500 == 409
```

### Scenario Coverage
- ✅ "Given valid email and password, When POST /auth/register, Then return 201"
- ❌ "Given duplicate email, When POST /auth/register, Then return 409 Conflict"
  - Issue: No duplicate email check in register endpoint, raises unhandled IntegrityError

### Root Cause Analysis
The register endpoint at `app/api/auth.py:12` does not catch
`sqlalchemy.exc.IntegrityError` when a duplicate email is inserted.
The database unique constraint triggers a 500 Internal Server Error
instead of a 409 Conflict response.

### Suggested Fix
Add try/except around db.commit() to catch IntegrityError and return 409:
```python
try:
    await db.commit()
except IntegrityError:
    await db.rollback()
    raise HTTPException(status_code=409, detail="Email already registered")
```
```

### Step 3: 判定与分支

```python
# 伪代码：harness-apply 的判定逻辑
if evaluation.status == "PASS":
    # 更新进度
    update_feature_tests(task_id, passes=True)
    update_progress_txt(task_id, status="completed")
    # 进入下一个任务
    proceed_to_next_task()

elif evaluation.attempt < 3:
    # 启动 fixer
    launch_fixer_agent(evaluation_report)
    # fixer 完成后重新评估
    re_evaluate()

else:
    # 3 次修复仍失败，请求人类介入
    pause_and_ask_human(evaluation_report)
```

### Step 4: Fixer Agent 修复

Fixer agent 接收评估报告作为输入：

```
启动 fixer subagent:
- 模型: sonnet 或 opus (取决于问题复杂度)
- 工具: Bash, Read, Edit, Glob, Grep
- 输入: evaluation report
- 约束: 只修复报告中指出的问题，不做额外重构
```

Fixer 的工作范围严格限定在评估报告指出的问题：

```python
# Fixer 只修复评估报告中指出的问题
# 报告说: "No duplicate email check, raises unhandled IntegrityError"
# Fixer 只做:

@router.post("/auth/register", status_code=201)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    user = User(email=user_data.email)
    user.set_password(user_data.password)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    return {"user_id": user.id}
```

修复后 `git commit`，然后重新触发 evaluator。

### Step 5: 重新评估

Evaluator 再次运行，这次使用 attempt=2：

```markdown
## Evaluation Report: Task 1.2 — Add /auth/register endpoint

**Status: PASS**
**Evaluated at: 2025-01-15T14:35:00Z**
**Attempt: 2/3**

### Verification Commands
| Command | Result |
|---------|--------|
| `pytest tests/api/test_auth.py::test_register -v` | ✅ 1 passed |
| `pytest tests/api/test_auth.py::test_register_duplicate -v` | ✅ 1 passed |

### Scenario Coverage
- ✅ "Given valid email and password, When POST /auth/register, Then return 201"
- ✅ "Given duplicate email, When POST /auth/register, Then return 409 Conflict"

### Summary
All verification commands pass. All spec scenarios are covered by tests.
```

## 评估严格度配置

不同项目可能需要不同的评估严格度。通过 feature_tests.json 的顶层配置控制：

```json
{
  "change_id": "add-auth",
  "evaluation_config": {
    "max_retries": 3,
    "require_test_coverage": true,
    "require_type_check": false,
    "require_lint_pass": true,
    "custom_checks": [
      "python -m bandit -r app/ -ll"
    ]
  },
  "tasks": [...]
}
```

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `max_retries` | 3 | 最大修复重试次数 |
| `require_test_coverage` | true | 每个 spec scenario 必须有对应测试 |
| `require_type_check` | false | 是否要求 mypy/pyright 通过 |
| `require_lint_pass` | true | 是否要求 linter 通过 |
| `custom_checks` | [] | 自定义验证命令（如安全扫描） |

## 评估报告的存储

每次评估的报告存储在 change 目录下：

```
changes/add-auth/
├── proposal.md          ← OpenSpec
├── specs.md             ← OpenSpec
├── tasks.md             ← OpenSpec
├── feature_tests.json   ← Harness
├── claude-progress.txt  ← Harness
└── evaluations/         ← Harness
    ├── task-1.1-attempt-1.md
    ├── task-1.2-attempt-1.md
    ├── task-1.2-attempt-2.md   ← 第一次失败后修复再评估
    └── ...
```

这些报告在 `/opsx:archive` 时可以一并归档，作为实现质量的可追溯证据。
