# 从 Specs 到可执行验证：如何构建足够的评审材料

## 问题

OpenSpec 生成的 specs.md 是给人读的：

```markdown
## User Registration
- Given valid email and password, When POST /auth/register, Then return 201 with user_id
```

但 evaluator 需要的是**可执行的验证**：

```bash
pytest tests/api/test_auth.py::test_register_returns_201 -v
# PASSED ✅ 或 FAILED ❌
```

中间的转化——把文本 spec 变成可执行的测试、API 契约、浏览器场景——是 **Initializer Agent** 的工作。

## 完整的材料生成链

```
                    OpenSpec                          Initializer Agent
                ┌─────────────┐                    ┌──────────────────────┐
人的需求 ──────→│  proposal.md │                    │                      │
                │  specs.md   │──────────────────→ │  读 specs + 项目结构   │
                │  tasks.md   │                    │                      │
                └─────────────┘                    │  生成:                │
                                                   │  ├─ feature_tests.json│
                                                   │  ├─ test_*.py 骨架    │
                                                   │  ├─ API 契约 .json    │
                                                   │  ├─ 浏览器场景 .json   │
                                                   │  └─ conftest fixtures │
                                                   └──────────┬───────────┘
                                                              │
                                                              ▼
                                                   所有测试当前应该 FAIL
                                                   （因为实现还没写）
                                                              │
                                                              ▼
                                                   ┌──────────────────┐
                                                   │   Coding Agent    │
                                                   │  目标：让测试通过   │
                                                   │  不需要自己写测试   │
                                                   └──────────┬───────┘
                                                              │
                                                              ▼
                                                   ┌──────────────────┐
                                                   │  Evaluator Agent  │
                                                   │  跑 Initializer   │
                                                   │  生成的测试        │
                                                   │  完全独立可信       │
                                                   └──────────────────┘
```

## Initializer 生成的五类材料

### 1. feature_tests.json — 任务级验证清单

这是 evaluator 的"指令书"，告诉它**每个任务怎么验证**。

之前（不够）：
```json
{
  "id": "1.2",
  "verification_commands": ["pytest tests/api/test_auth.py -v"]
}
```
问题：测试文件里有什么？可能是空的。

之后（充分）：
```json
{
  "id": "1.2",
  "description": "Add /auth/register endpoint",
  "verification_level": "L3",
  "pre_generated_tests": true,
  "verification_commands": [
    "pytest tests/api/test_auth.py::test_register_returns_201 -v",
    "pytest tests/api/test_auth.py::test_register_duplicate_409 -v",
    "pytest tests/api/test_auth.py::test_register_invalid_email_422 -v"
  ],
  "api_contract": "tests/contracts/auth_register.json",
  "setup_commands": ["python -m uvicorn app.main:app --port 8000 &", "sleep 3"],
  "teardown_commands": ["kill %1 2>/dev/null"]
}
```
每个 verification_command 指向一个**具体的测试函数**，这个测试函数是 Initializer 写的，有真实的断言。

### 2. 测试骨架文件 — 可执行断言

Initializer 把每个 spec scenario 转化为一个有断言的测试函数。

**Spec 输入**：
```
Given valid email and password, When POST /auth/register, Then return 201 with user_id
Given duplicate email, When POST /auth/register, Then return 409
Given password < 8 chars, When POST /auth/register, Then return 422
```

**Initializer 输出**（`tests/api/test_auth.py`）：
```python
import pytest
from httpx import AsyncClient

class TestRegister:
    """Spec: User Registration"""

    @pytest.mark.asyncio
    async def test_register_returns_201(self, client: AsyncClient):
        """Given valid email and password, When POST /auth/register, Then return 201 with user_id"""
        response = await client.post("/auth/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 201
        assert "user_id" in response.json()

    @pytest.mark.asyncio
    async def test_register_duplicate_409(self, client: AsyncClient, existing_user):
        """Given duplicate email, When POST /auth/register, Then return 409"""
        response = await client.post("/auth/register", json={
            "email": existing_user.email,
            "password": "AnyPass123!"
        })
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_short_password_422(self, client: AsyncClient):
        """Given password < 8 chars, When POST /auth/register, Then return 422"""
        response = await client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "short"
        })
        assert response.status_code == 422

    # --- Initializer 额外生成的边界测试 ---

    @pytest.mark.asyncio
    async def test_register_empty_email_422(self, client: AsyncClient):
        """Edge case: empty email should be rejected"""
        response = await client.post("/auth/register", json={
            "email": "",
            "password": "SecurePass123!"
        })
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_register_missing_fields_422(self, client: AsyncClient):
        """Edge case: missing required fields"""
        response = await client.post("/auth/register", json={})
        assert response.status_code == 422
```

**注意**：这些测试在实现之前应该全部 FAIL（因为 `/auth/register` 还不存在）。这就是 TDD 的 "Red" 阶段。

### 3. API 契约文件 — 结构化的请求/响应期望

对于 L3 任务，除了 pytest 测试，还生成 JSON 格式的 API 契约，evaluator 可以用 curl 独立验证：

```json
{
  "endpoint": "POST /auth/register",
  "base_url": "http://localhost:8000",
  "cases": [
    {
      "name": "valid_registration",
      "request": {
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": {"email": "contract-test@example.com", "password": "Pass123456!"}
      },
      "expected": {
        "status": 201,
        "body_schema": {
          "user_id": "string|integer"
        },
        "body_must_not_contain": ["password", "password_hash"]
      }
    },
    {
      "name": "duplicate_email",
      "depends_on": "valid_registration",
      "request": {
        "method": "POST",
        "headers": {"Content-Type": "application/json"},
        "body": {"email": "contract-test@example.com", "password": "Pass123456!"}
      },
      "expected": {
        "status": 409
      }
    }
  ]
}
```

Evaluator 可以在不运行 pytest 的情况下，用 curl 独立验证这些契约。

### 4. 浏览器场景文件 — L4 测试脚本

对于 UI 任务，生成详细的操作步骤，evaluator 使用 Playwright MCP 逐步执行：

```json
{
  "page": "Registration Form",
  "start_url": "http://localhost:3000/register",
  "setup": "npm run dev",
  "scenarios": [
    {
      "name": "successful_registration_flow",
      "spec": "Given registration form, When fill all fields and submit, Then show success message",
      "steps": [
        {"action": "navigate", "url": "http://localhost:3000/register"},
        {"action": "wait_for", "selector": "form[data-testid='register-form']", "timeout": 5000},
        {"action": "type", "selector": "input[name='email']", "text": "newuser@example.com"},
        {"action": "type", "selector": "input[name='password']", "text": "SecurePass123!"},
        {"action": "type", "selector": "input[name='confirmPassword']", "text": "SecurePass123!"},
        {"action": "screenshot", "name": "before-submit"},
        {"action": "click", "selector": "button[type='submit']"},
        {"action": "wait_for", "selector": "[data-testid='success-message']", "timeout": 5000},
        {"action": "screenshot", "name": "after-submit"}
      ],
      "assertions": [
        {"type": "element_visible", "selector": "[data-testid='success-message']"},
        {"type": "element_text_contains", "selector": "[data-testid='success-message']", "text": "Registration successful"}
      ]
    }
  ]
}
```

### 5. 测试基础设施 — conftest/helpers

如果项目还没有测试基础设施，Initializer 生成必要的 fixtures 和 helpers，确保上面的测试能运行。

## 判断 specs.md 是否"够用"

Initializer 在生成材料前会检查 specs.md 的质量。如果 specs 太模糊，它会报告缺失并建议补充：

```
⚠️ Spec quality check:

Sufficient:
  ✅ "Given valid email and password, When POST /auth/register, Then return 201 with user_id"
     → Can generate: test function with status + body assertion

Insufficient:
  ❌ "The registration should work properly"
     → Too vague. Cannot generate test. Needs: specific input, action, expected output.

  ❌ "The UI should look good"
     → Cannot be machine-verified. Suggest: "Given desktop viewport, When load /register, Then form is centered and all fields visible"

  ⚠️ "Given admin user, When delete other user, Then user is deleted"
     → Missing: How to verify "user is deleted"? Suggest adding: "and GET /users/{id} returns 404"

Recommendation: Update specs.md with specific, verifiable scenarios before proceeding.
```

## 增强 OpenSpec Specs 的模板

为了让 Initializer 生成高质量的材料，specs.md 中的每个 scenario 最好遵循这个模式：

```markdown
## Feature: User Registration

### API Scenarios

- Given valid email "test@example.com" and password "SecurePass123!"
  When POST /auth/register with JSON body {"email": "{email}", "password": "{password}"}
  Then response status is 201
  And response body contains "user_id"
  And response body does NOT contain "password"

- Given email "existing@example.com" already registered
  When POST /auth/register with same email
  Then response status is 409
  And response body contains "already registered"

### UI Scenarios (需要 Playwright)

- Given registration page at /register
  When user fills email "test@example.com", password "Pass123!", confirm "Pass123!"
  And clicks submit button
  Then page shows success message "Registration successful"
  And URL changes to /login

### Edge Cases

- Given empty email ""
  When POST /auth/register
  Then response status is 422
  And response body contains "email is required"
```

**关键改进**：
- 包含具体的输入值（不是"valid email"，而是"test@example.com"）
- 包含具体的 HTTP 方法和路径
- 包含具体的响应字段检查
- 区分 API 场景和 UI 场景
- 包含边界情况

## 总结：评审材料的完整性检查

在 Initializer 完成后、Coding 开始前，harness-apply 应该验证：

```
✅ 检查清单:
  [ ] 每个 spec scenario 有至少一个对应的测试函数
  [ ] 每个测试函数有具体的断言（不是 pass 或 TODO）
  [ ] 每个 L3 任务有 API 契约或 curl 命令
  [ ] 每个 L4 任务有浏览器场景文件
  [ ] 所有测试当前 FAIL（因为实现还没写）
  [ ] feature_tests.json 的 verification_commands 指向真实的测试函数
  [ ] 测试基础设施（conftest/fixtures）已就位
```

只有这个检查清单全部通过，才开始 Coding Agent 的工作。
