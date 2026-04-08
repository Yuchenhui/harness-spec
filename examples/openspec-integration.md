# OpenSpec + Harness 集成示例

## 完整示例：为 FastAPI 项目添加用户认证

本示例展示如何从零开始使用 OpenSpec + Harness 完成一个完整的 feature 开发。

### 前提条件

- 项目已安装 OpenSpec (`npm install -g openspec-cli`)
- 项目 `.claude/` 目录下已放置 harness 模板文件
- 项目使用 Python/FastAPI + pytest

### Step 1: 提案

```bash
# 使用 OpenSpec 创建提案
/opsx:propose "add-user-authentication"
```

OpenSpec 生成 `changes/add-user-authentication/proposal.md`:

```markdown
# Proposal: Add User Authentication

## Motivation
The application currently has no user authentication.
All endpoints are publicly accessible.

## Scope
- User registration (email + password)
- Login with JWT tokens
- Token refresh mechanism
- Protected route middleware

## Out of Scope
- OAuth/social login (future iteration)
- Role-based access control (future iteration)
```

### Step 2: 生成 Specs

```bash
/opsx:specs
```

OpenSpec 生成 `changes/add-user-authentication/specs.md`:

```markdown
# Specs: User Authentication

## 1. User Registration
- Given a new user with valid email and password
  When POST /auth/register
  Then return 201 with user_id
  And password is stored as bcrypt hash

- Given a duplicate email
  When POST /auth/register
  Then return 409 Conflict

## 2. User Login
- Given valid credentials
  When POST /auth/login
  Then return 200 with access_token (expires 1h) and refresh_token (expires 7d)

- Given invalid credentials
  When POST /auth/login
  Then return 401 Unauthorized

## 3. JWT Middleware
- Given valid JWT in Authorization: Bearer header
  When accessing any protected route
  Then request proceeds with user context

- Given expired/invalid JWT
  When accessing any protected route
  Then return 401

## 4. Token Refresh
- Given valid refresh_token
  When POST /auth/refresh
  Then return new access_token

## 5. User Profile
- Given authenticated user
  When GET /auth/me
  Then return user profile (id, email, created_at) without password hash
```

### Step 3: 任务拆解

```bash
/opsx:tasks
```

OpenSpec 生成 `changes/add-user-authentication/tasks.md`:

```markdown
# Tasks

- [ ] 1.1 Create User model with password hashing
- [ ] 1.2 Add /auth/register endpoint
- [ ] 2.1 Add /auth/login endpoint with JWT token generation
- [ ] 2.2 Add JWT middleware for protected routes
- [ ] 3.1 Add /auth/refresh endpoint
- [ ] 3.2 Add /auth/me endpoint
```

### Step 4: Harness Apply（核心）

```bash
# 不用 /opsx:apply，改用 harness 增强版
/harness-apply add-user-authentication
```

#### 4.1 Harness 初始化

```
📋 Harness: 初始化 add-user-authentication
   读取 tasks.md: 6 个任务
   读取 specs.md: 提取 spec scenarios
   生成 feature_tests.json: 6 个可验证条目
   初始化 claude-progress.txt

   ✅ 初始化完成 (commit: init-harness-abc123)
```

#### 4.2 Task 1.1 — Create User Model

```
📋 Task 1.1: Create User model with password hashing
   Scenarios:
   - "Given new registration, password stored as bcrypt hash"
   - "Given User model, query by email returns user or None"

   开始编码...
```

Coding agent 创建:
- `app/models/user.py` — User model with set_password/check_password
- `tests/models/test_user.py` — 测试用例
- `alembic/versions/001_create_users.py` — 数据库迁移

```
   ✅ 编码完成 (commit: feat-task-1.1-def456)
   🔍 启动评估...
```

Evaluator 运行:
```
   Evaluation: Task 1.1
   - pytest tests/models/test_user.py: 3 passed ✅
   - Scenario coverage: 2/2 ✅

   ✅ Task 1.1: PASS (1st attempt)
```

#### 4.3 Task 1.2 — Register Endpoint

```
📋 Task 1.2: Add /auth/register endpoint
   Scenarios:
   - "Valid email+password → 201 with user_id"
   - "Duplicate email → 409 Conflict"
   - "Invalid email → 422 Validation Error"

   开始编码...
   ✅ 编码完成 (commit: feat-task-1.2-ghi789)
   🔍 启动评估...
```

**第一次评估失败:**
```
   Evaluation: Task 1.2 (attempt 1/3)
   - pytest test_register_success: ✅ passed
   - pytest test_register_duplicate: ❌ FAILED
     assert 500 == 409 — unhandled IntegrityError
   - pytest test_register_invalid_email: ✅ passed

   ❌ Task 1.2: FAIL
   🔧 启动修复 (attempt 1/3)...
```

**Fixer 修复:**
```
   Fixer: 读取评估报告
   - 问题: register endpoint 未处理 IntegrityError
   - 修复: 在 db.commit() 周围添加 try/except
   - 提交: fix(task-1.2): handle duplicate email IntegrityError [attempt 1]

   🔍 重新评估...
```

**第二次评估通过:**
```
   Evaluation: Task 1.2 (attempt 2/3)
   - pytest test_register_success: ✅ passed
   - pytest test_register_duplicate: ✅ passed
   - pytest test_register_invalid_email: ✅ passed

   ✅ Task 1.2: PASS (2nd attempt, 1 fix applied)
```

#### 4.4 后续任务...

（Task 2.1 - 3.2 类似流程，省略）

#### 4.5 完成

```
🎉 所有 6 个任务已通过评估

Summary:
- Task 1.1: PASS (1st attempt)
- Task 1.2: PASS (2nd attempt, 1 fix)
- Task 2.1: PASS (1st attempt)
- Task 2.2: PASS (1st attempt)
- Task 3.1: PASS (2nd attempt, 1 fix)
- Task 3.2: PASS (1st attempt)

总计: 6 tasks, 8 evaluation runs, 2 auto-fixes
评估报告: changes/add-user-authentication/evaluations/

下一步:
- /opsx:verify  — 最终验证
- /opsx:archive — 归档变更
```

### Step 5: 验证和归档

```bash
/opsx:verify
# OpenSpec 做最终验证，确认所有 specs 满足

/opsx:archive
# 归档整个 change，包括 harness 的评估报告
```

## 跨 Session 恢复示例

假设在 Task 2.2 执行时 session 中断了：

**新 Session:**

```bash
/harness-apply add-user-authentication --resume
```

```
🔄 恢复执行: add-user-authentication

读取 claude-progress.txt:
  状态: 3/6 tasks completed
  最后完成: Task 2.1 (commit: xyz789)
  下一个: Task 2.2 — Add JWT middleware

读取 git log:
  xyz789 feat(auth): implement login endpoint [task-2.1]
  uvw456 fix(task-1.2): handle duplicate email [attempt 1]
  ghi789 feat(auth): implement register endpoint [task-1.2]
  def456 feat(auth): create User model [task-1.1]

继续: Task 2.2 — Add JWT middleware for protected routes
```

## 项目结构参考

完整的项目结构（以 FastAPI 项目为例）：

```
my-fastapi-project/
├── .claude/
│   ├── agents/
│   │   ├── evaluator.md          ← Harness 模板
│   │   └── fixer.md              ← Harness 模板
│   ├── commands/
│   │   └── harness-apply.md      ← Harness 模板
│   ├── skills/
│   │   └── progress-tracker/
│   │       └── SKILL.md          ← Harness 模板
│   └── settings.json             ← 权限配置
├── CLAUDE.md                     ← 项目级约束（< 60 行）
├── changes/                      ← OpenSpec 目录
│   └── add-user-authentication/
│       ├── proposal.md           ← OpenSpec
│       ├── specs.md              ← OpenSpec
│       ├── tasks.md              ← OpenSpec
│       ├── feature_tests.json    ← Harness (初始化时生成)
│       ├── claude-progress.txt   ← Harness (持续更新)
│       └── evaluations/          ← Harness (评估报告)
│           ├── task-1.1-attempt-1.md
│           ├── task-1.2-attempt-1.md
│           └── task-1.2-attempt-2.md
├── app/
│   ├── models/
│   ├── api/
│   └── ...
└── tests/
    ├── models/
    ├── api/
    └── ...
```
