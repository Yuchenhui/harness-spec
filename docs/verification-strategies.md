# 验证策略 / Verification Strategies

## 核心问题

当前 evaluator 的验证链存在一个根本缺陷：

```
Coding Agent 写实现代码  ──┐
Coding Agent 写测试代码  ──┤──→ Evaluator 跑测试 ──→ "通过了！"
                           │
                           └── 但测试也是 Coding Agent 写的！
                               它可能写了"永远通过"的测试
```

这就像让学生自己出考题再自己答——当然满分。

## 解决方案：分层验证 + TDD

### 原则 1：测试先于代码（TDD）

**Initializer 阶段生成测试骨架**，而不是让 Coding Agent 自己写测试：

```
OpenSpec specs.md (Given/When/Then)
         ↓
    Initializer 生成
         ↓
    test_xxx.py（只有测试函数签名和断言，没有实现）
         ↓
    Coding Agent 的目标变成 "让这些预写的测试通过"
         ↓
    Evaluator 跑的是 Initializer 写的测试，不是 Coding Agent 写的
```

示例：

```python
# Initializer 生成的测试（在 coding 之前就存在）
# tests/test_auth.py

def test_register_returns_201_with_valid_data(client):
    """Spec: Given valid email and password, When POST /auth/register, Then return 201"""
    response = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "SecurePass123!"
    })
    assert response.status_code == 201
    assert "user_id" in response.json()

def test_register_returns_409_on_duplicate(client, existing_user):
    """Spec: Given duplicate email, When POST /auth/register, Then return 409"""
    response = client.post("/auth/register", json={
        "email": existing_user.email,
        "password": "AnyPass123!"
    })
    assert response.status_code == 409

def test_password_stored_as_bcrypt(db_session, registered_user):
    """Spec: Given registration, password stored as bcrypt hash"""
    user = db_session.query(User).filter_by(email=registered_user.email).first()
    assert user.password_hash.startswith("$2b$")
    assert user.password_hash != "SecurePass123!"  # not plaintext
```

Coding Agent 只需要写实现代码让这些测试通过，不需要自己写测试。

### 原则 2：按任务类型选择验证级别

不同类型的代码变更需要不同的验证手段：

| 验证级别 | 适用场景 | 工具 | 能验证什么 |
|----------|---------|------|-----------|
| **L1: Static** | 所有代码 | ruff, mypy, eslint, tsc | 语法、类型、代码风格 |
| **L2: Unit** | 业务逻辑、模型、工具函数 | pytest, jest | 函数输入输出正确性 |
| **L3: Integration** | API 接口、数据库操作 | pytest + httpx, supertest | 端到端 API 行为 |
| **L4: E2E/Browser** | UI 界面、交互功能 | **Playwright MCP** | 用户可见的行为和效果 |
| **L5: Visual** | 样式、布局、设计 | Playwright screenshots + 人工 | 视觉回归 |

### 原则 3：Evaluator 不信任 Coding Agent 写的测试

Evaluator 的信任层级：

```
最可信 ─── Initializer 预生成的测试（specs → 测试，coding 之前就存在）
  ↑        Playwright MCP 黑盒测试（只有浏览器工具，没有代码访问）
  │        Integration 测试（curl/httpx 实际调用 API）
  │        Coding Agent 写的单元测试（可能有偏差，但有参考价值）
最不可信 ── Coding Agent 自己说 "我测试过了，没问题"
```

## 验证级别详解

### L1: Static（静态检查）

所有任务都应该通过静态检查，这是最低要求。

```json
{
  "id": "1.1",
  "verification_level": "L1",
  "verification_commands": [
    "ruff check app/models/user.py",
    "mypy app/models/user.py --no-error-summary"
  ]
}
```

Evaluator 工具：`Bash(ruff *)`, `Bash(mypy *)`, `Bash(npx tsc *)`

### L2: Unit（单元测试）

适合纯逻辑、模型、工具函数。

```json
{
  "id": "1.1",
  "verification_level": "L2",
  "verification_commands": [
    "pytest tests/models/test_user.py -v"
  ],
  "pre_generated_tests": true
}
```

`pre_generated_tests: true` 表示测试是 Initializer 在编码之前生成的，可信度更高。

### L3: Integration（集成测试）

适合 API 接口、数据库交互。需要启动服务。

```json
{
  "id": "1.2",
  "verification_level": "L3",
  "verification_commands": [
    "pytest tests/api/test_auth.py -v",
    "bash -c 'curl -s -o /dev/null -w \"%{http_code}\" http://localhost:8000/auth/register -X POST -H \"Content-Type: application/json\" -d \"{\\\"email\\\":\\\"test@test.com\\\",\\\"password\\\":\\\"Pass123!\\\"}\"'"
  ],
  "setup_commands": [
    "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &",
    "sleep 3"
  ],
  "teardown_commands": [
    "kill %1 2>/dev/null || true"
  ]
}
```

### L4: E2E / Browser（端到端浏览器测试）

**这是回答你核心问题的关键。** 使用 Playwright MCP 让 evaluator 像真实用户一样操作浏览器。

有一个已验证的模式（来自业界实践）：给 evaluator 一个 "QA 工程师" 人格，只给它浏览器工具，不给代码访问权限，让它做**黑盒测试**。

```json
{
  "id": "2.1",
  "verification_level": "L4",
  "verification_commands": [],
  "browser_verification": {
    "start_url": "http://localhost:3000",
    "scenarios": [
      {
        "description": "Dark mode toggle works",
        "steps": [
          "Navigate to http://localhost:3000/settings",
          "Click the dark mode toggle",
          "Verify the page background changes to dark color",
          "Take a screenshot",
          "Refresh the page",
          "Verify dark mode persists after refresh"
        ]
      }
    ]
  },
  "setup_commands": [
    "npm run dev &",
    "sleep 5"
  ]
}
```

需要在项目中配置 Playwright MCP：

```json
// .mcp.json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/playwright-mcp@latest", "--headless"]
    }
  }
}
```

Evaluator agent 在 L4 模式下的工具列表：

```yaml
# evaluator.md (L4 模式)
tools:
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_resize
  - Write(**/evaluations/*)
  # 注意：没有 Read/Edit 代码的权限！纯黑盒。
```

### L5: Visual（视觉验证）

截图保存，由人工最终确认。Evaluator 只负责截图和标注差异。

```json
{
  "id": "3.1",
  "verification_level": "L5",
  "browser_verification": {
    "screenshots": [
      {"name": "dark-mode-desktop", "url": "http://localhost:3000", "viewport": [1920, 1080]},
      {"name": "dark-mode-mobile", "url": "http://localhost:3000", "viewport": [375, 667]}
    ]
  }
}
```

截图保存在 `changes/<id>/evaluations/screenshots/`，evaluator 输出 NEEDS_HUMAN_REVIEW 而不是 PASS/FAIL。

## feature_tests.json 完整格式（更新版）

```json
{
  "change_id": "add-dark-mode",
  "evaluation_config": {
    "max_retries": 3,
    "tdd_mode": true
  },
  "tasks": [
    {
      "id": "1.1",
      "description": "Add ThemeContext provider",
      "spec_scenarios": ["Given app loads, Then default theme is light"],
      "verification_level": "L2",
      "pre_generated_tests": true,
      "verification_commands": ["pytest tests/test_theme.py -v"],
      "passes": false,
      "evaluation_attempts": 0
    },
    {
      "id": "2.1",
      "description": "Add dark mode toggle to settings page",
      "spec_scenarios": [
        "Given settings page, When click toggle, Then theme switches",
        "Given dark mode active, When refresh, Then dark mode persists"
      ],
      "verification_level": "L4",
      "browser_verification": {
        "start_url": "http://localhost:3000/settings",
        "scenarios": [
          {
            "description": "Toggle switches theme",
            "steps": [
              "Click the dark mode toggle",
              "Verify body has class 'dark' or background is dark",
              "Take screenshot"
            ]
          }
        ]
      },
      "setup_commands": ["npm run dev &", "sleep 5"],
      "teardown_commands": ["kill %1 2>/dev/null"],
      "passes": false,
      "evaluation_attempts": 0
    }
  ]
}
```

## harness-apply 更新后的流程

```
Phase 1: 初始化
  ├── 读 tasks.md + specs.md
  ├── 生成 feature_tests.json（含 verification_level）
  ├── 如果 tdd_mode: true:
  │     └── 为 L2/L3 任务生成测试骨架（pre_generated_tests）
  │         Coding Agent 不写测试，只写实现
  └── git commit 初始化文件

Phase 2: 逐任务执行
  ├── Coding Agent 实现任务
  ├── git commit
  ├── 根据 verification_level 选择评估方式：
  │     ├── L1: 跑 lint/type check
  │     ├── L2: 跑预生成的单元测试
  │     ├── L3: 启动服务 → 跑集成测试 + curl → 关服务
  │     ├── L4: 启动服务 → Playwright MCP 黑盒测试 → 关服务
  │     └── L5: 截图 → 标记 NEEDS_HUMAN_REVIEW
  ├── PASS → 下一个
  ├── FAIL → fixer → 重新评估
  └── L5 NEEDS_REVIEW → 暂停等人工

Phase 3: 完成
  └── 所有 L1-L4 PASS + L5 已审查 → 完成
```

## 配置 Playwright MCP

### 安装

```bash
npm install -D @anthropic-ai/playwright-mcp
```

### 项目配置

在项目根目录创建或更新 `.mcp.json`：

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/playwright-mcp@latest", "--headless"]
    }
  }
}
```

### Evaluator 在 L4 模式下的行为

当 evaluator 处理 L4 级别的任务时，它的行为变成 **"QA 工程师"** 模式：

1. 只使用浏览器工具（navigate, click, type, screenshot）
2. 不读代码、不看实现
3. 按照 `browser_verification.scenarios` 中的步骤操作
4. 截图作为证据
5. 像真实用户一样验证功能

这确保了评估完全独立于实现——evaluator 不知道代码怎么写的，只知道应该表现出什么行为。

## 不同项目类型的推荐配置

### 纯后端 API（Python/FastAPI, Go, Spring Boot）

```
所有任务默认 L2 或 L3
不需要 Playwright
verification_commands 用 pytest/curl/httpie
```

### 全栈 Web（React/Vue + API）

```
后端任务: L3（集成测试）
前端逻辑: L2（jest 单元测试）
UI 交互: L4（Playwright MCP 黑盒测试）
样式变更: L5（截图 + 人工审查）
```

### CLI 工具

```
所有任务: L2 + L3
L3 的 verification_commands 直接运行 CLI 并检查输出:
  "verification_commands": [
    "bash -c './mycli scan --target 192.168.1.0/24 --format json | jq .hosts | grep -c . | test $(cat) -gt 0'"
  ]
```
