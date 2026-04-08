/**
 * Harness Verification Initializer Workflow
 *
 * Phase 1: Generate test skeletons, API contracts, browser scenarios
 * from reviewed specs. All tests should FAIL before coding begins (TDD red phase).
 *
 * Key design: the SPEC SCENARIO determines the test type, not the task description.
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

const INIT_TESTS_INSTRUCTIONS = `Generate verification material for a change before coding begins.

This creates the "exam" that the Coding Agent must pass.
Tests are written by this Initializer, not by the Coding Agent.

---

**Input**: Change name or path.

**Steps**

## Step 1: Detect Project Context

Read project files to understand the environment:

\`\`\`bash
# Detect tech stack
ls package.json requirements.txt pyproject.toml go.mod pom.xml build.gradle Cargo.toml 2>/dev/null

# Detect test framework
ls -d tests/ test/ __tests__/ spec/ 2>/dev/null

# Check for existing test config
ls pytest.ini pyproject.toml jest.config.* vitest.config.* 2>/dev/null

# Check for existing Playwright
ls playwright.config.* 2>/dev/null

# Check for test-strategy.yaml override
ls openspec/test-strategy.yaml 2>/dev/null
\`\`\`

If \`openspec/test-strategy.yaml\` exists, read it and use its settings.
Otherwise, auto-detect everything.

**Auto-detection rules:**

| File found | Project type | Test framework | Notes |
|------------|-------------|----------------|-------|
| package.json + src/**/*.tsx | frontend | jest or vitest | Check "test" script in package.json |
| package.json + src/**/*.ts (no .tsx) | backend (Node) | jest or vitest | |
| package.json + src/**/*.tsx + app/api/ | fullstack | jest + playwright | Both API and UI tests needed |
| requirements.txt or pyproject.toml | backend (Python) | pytest | Check if pytest in deps |
| go.mod | backend (Go) | go test | |
| pom.xml | backend (Java) | junit/maven | |
| Cargo.toml | backend (Rust) | cargo test | |

## Step 2: Determine Verification Level Per Task

**The spec scenario text determines the test type, not the task title.**

Parse each task's spec_scenarios and apply this decision tree:

\`\`\`
For each spec scenario in the task:

1. Does the scenario mention UI interaction?
   Keywords: "click", "page", "button", "form", "input", "navigate",
             "redirect", "display", "visible", "modal", "dialog",
             "dropdown", "toggle", "scroll", "hover"
   → L4 (E2E browser test)

2. Does the scenario mention visual appearance only?
   Keywords: "look", "style", "color", "font", "layout", "responsive",
             "centered", "aligned", "animation", "dark mode", "theme"
   AND does NOT mention user interaction?
   → L5 (Visual screenshot + human review)

3. Does the scenario mention an API endpoint?
   Keywords: "POST", "GET", "PUT", "DELETE", "PATCH",
             "/api/", "endpoint", "request", "response",
             "status code", "JSON body", "header"
   → L3 (Integration test — actually call the endpoint)

4. Does the scenario mention database operations?
   Keywords: "stored", "persisted", "query", "database", "table",
             "record", "unique", "constraint", "migration"
   AND the project has a database (detected via ORM imports)?
   → L3 (Integration test with DB fixtures)

5. Does the scenario mention external services?
   Keywords: "email sent", "webhook", "notification", "queue",
             "cache", "redis", "S3", "upload"
   → L3 (Integration test with mocks for external services)

6. Everything else (pure logic, model methods, utils, config):
   → L2 (Unit test)
\`\`\`

**If a task has mixed scenarios** (e.g., one API + one UI):
- Assign the HIGHEST level (L4 > L3 > L2)
- Generate tests for ALL levels that apply

**Level override**: If test-strategy.yaml has level_overrides, apply them.

## Step 3: Generate Tests by Level

### L2: Unit Tests

**What**: Test pure functions, model methods, business logic in isolation.
**Where**: \`tests/unit/\` or follow project convention.
**Pattern**:

For Python (pytest):
\`\`\`python
# tests/unit/test_user_model.py

import pytest
from app.models.user import User

class TestUserPasswordHashing:
    """Spec: User model password hashing"""

    def test_password_stored_as_bcrypt(self):
        """Scenario: Given password provided, Then stored as bcrypt hash"""
        user = User(email="test@example.com")
        user.set_password("SecurePass123!")
        assert user.password_hash is not None
        assert user.password_hash.startswith("$2b$")
        assert user.password_hash != "SecurePass123!"

    def test_check_password_correct(self):
        """Scenario: Given correct password, Then check_password returns True"""
        user = User(email="test@example.com")
        user.set_password("SecurePass123!")
        assert user.check_password("SecurePass123!") is True

    def test_check_password_wrong(self):
        """Edge case: wrong password returns False"""
        user = User(email="test@example.com")
        user.set_password("SecurePass123!")
        assert user.check_password("WrongPass") is False
\`\`\`

For TypeScript (vitest/jest):
\`\`\`typescript
// tests/unit/user.test.ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../src/utils/password'

describe('Password hashing', () => {
  it('should hash password with bcrypt', () => {
    const hash = hashPassword('SecurePass123!')
    expect(hash).not.toBe('SecurePass123!')
    expect(hash).toMatch(/^\\$2[aby]\\$/)
  })
})
\`\`\`

### L3: Integration Tests

**What**: Test API endpoints, database operations, service interactions end-to-end.
**Where**: \`tests/integration/\` or \`tests/api/\`.
**Requires**: Running server or test client, database fixtures.

**Setup/teardown generation**:
\`\`\`json
{
  "setup_commands": [
    "python -m uvicorn app.main:app --port 8000 &",
    "sleep 3"
  ],
  "teardown_commands": [
    "kill %1 2>/dev/null || true"
  ]
}
\`\`\`

For Python (pytest + httpx):
\`\`\`python
# tests/integration/test_auth_api.py

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

class TestRegisterEndpoint:
    """Spec: POST /auth/register"""

    @pytest.mark.asyncio
    async def test_register_success(self, client):
        """Scenario: Given valid email and password, Then return 201 with user_id"""
        response = await client.post("/auth/register", json={
            "email": "test@example.com",
            "password": "SecurePass123!"
        })
        assert response.status_code == 201
        data = response.json()
        assert "user_id" in data
        assert "password" not in data  # must not leak password

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client):
        """Scenario: Given duplicate email, Then return 409"""
        # First registration
        await client.post("/auth/register", json={
            "email": "dup@example.com", "password": "Pass123!"
        })
        # Duplicate
        response = await client.post("/auth/register", json={
            "email": "dup@example.com", "password": "Pass123!"
        })
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_register_empty_email(self, client):
        """Edge case: empty email → 422"""
        response = await client.post("/auth/register", json={
            "email": "", "password": "Pass123!"
        })
        assert response.status_code == 422
\`\`\`

### L4: E2E Browser Tests (Playwright)

**What**: Test user-facing interactions through a real browser.
**Where**: \`tests/e2e/\` or browser scenario JSON files.
**Requires**: Playwright MCP, running dev server.
**Mode**: Always **headless** for automated evaluation, headed only for manual debug.

**Two approaches** (choose based on project):

**Approach A: Playwright test files** (if project already uses Playwright):
\`\`\`typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'SecurePass123!')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/\\/dashboard/)
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible()
  })

  test('invalid password shows error', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'wrong')
    await page.click('[data-testid="login-button"]')
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL(/\\/login/)
  })
})
\`\`\`

verification_commands: \`npx playwright test tests/e2e/login.spec.ts --headed=false\`

**Approach B: Browser scenario JSON** (for Playwright MCP evaluator):
\`\`\`json
{
  "page": "Login",
  "start_url": "http://localhost:3000/login",
  "scenarios": [{
    "name": "successful_login",
    "steps": [
      {"action": "navigate", "url": "http://localhost:3000/login"},
      {"action": "wait_for", "selector": "[data-testid='email-input']", "timeout": 5000},
      {"action": "type", "selector": "[data-testid='email-input']", "text": "test@example.com"},
      {"action": "type", "selector": "[data-testid='password-input']", "text": "SecurePass123!"},
      {"action": "screenshot", "name": "before-submit"},
      {"action": "click", "selector": "[data-testid='login-button']"},
      {"action": "wait_for_url", "url_contains": "/dashboard", "timeout": 5000},
      {"action": "screenshot", "name": "after-login"}
    ],
    "assertions": [
      {"type": "url_contains", "value": "/dashboard"},
      {"type": "element_visible", "selector": "[data-testid='welcome-message']"}
    ]
  }]
}
\`\`\`

**Decision: Approach A or B?**
- Project already has \`playwright.config.*\` → Use Approach A (native Playwright tests)
- Project doesn't use Playwright yet → Use Approach B (JSON scenarios for Playwright MCP evaluator)

**Headed vs Headless:**
- **Default: headless** (\`--headed=false\` or Playwright MCP \`--headless\` flag)
  - Used for automated evaluation (evaluator subagent runs this)
  - Faster, no display needed, CI-compatible
- **Headed**: only when user explicitly requests debug mode
  - User runs \`/opsx:apply --headed\` (future feature)
- **Configuration**: can be overridden in test-strategy.yaml:
  \`\`\`yaml
  frontend:
    headless: false  # set true for debug
  \`\`\`

### L5: Visual Screenshot Tests

**What**: Capture screenshots for human review. Not auto-PASS/FAIL.
**Where**: \`evaluations/screenshots/\`.
**Requires**: Playwright MCP or Playwright test with \`toHaveScreenshot()\`.

\`\`\`json
{
  "screenshots": [
    {"name": "login-desktop", "url": "http://localhost:3000/login", "viewport": [1920, 1080]},
    {"name": "login-tablet", "url": "http://localhost:3000/login", "viewport": [768, 1024]},
    {"name": "login-mobile", "url": "http://localhost:3000/login", "viewport": [375, 667]}
  ]
}
\`\`\`

Evaluator outputs \`STATUS: NEEDS_HUMAN_REVIEW\` with screenshot paths.

## Step 4: Handle Regression Tests

When the change MODIFIES existing features (not just adds new ones):

1. **Find existing tests** for modified areas:
   \`\`\`bash
   # Search for tests related to modified specs
   grep -rl "register\\|login\\|auth" tests/ 2>/dev/null
   \`\`\`

2. **Add existing test commands to verification_commands**:
   If task 2.1 modifies the auth module and \`tests/test_auth.py\` already exists:
   \`\`\`json
   {
     "id": "2.1",
     "verification_commands": [
       "pytest tests/test_new_feature.py -v",
       "pytest tests/test_auth.py -v"
     ],
     "regression_tests": ["tests/test_auth.py"]
   }
   \`\`\`
   The \`regression_tests\` field tells the evaluator these are EXISTING tests
   that must continue to pass (not break).

3. **If the change's spec has MODIFIED or REMOVED sections**:
   - MODIFIED: add regression tests for the original behavior that should still work
   - REMOVED: add tests that verify the old behavior is properly gone/migrated

## Step 5: Generate feature_tests.json

Combine all the above into a single file:

\`\`\`json
{
  "change_id": "<name>",
  "created_at": "<ISO8601>",
  "project_type": "backend",
  "test_framework": "pytest",
  "evaluation_config": {
    "max_retries": 3,
    "tdd_mode": true,
    "headless": true
  },
  "tasks": [
    {
      "id": "1.1",
      "description": "Create User model with password hashing",
      "spec_scenarios": [
        "Given password provided, Then stored as bcrypt hash",
        "Given correct password, Then check_password returns True"
      ],
      "verification_level": "L2",
      "pre_generated_tests": true,
      "verification_commands": [
        "pytest tests/unit/test_user_model.py -v"
      ],
      "test_files_generated": [
        "tests/unit/test_user_model.py"
      ],
      "passes": false,
      "evaluation_attempts": 0
    },
    {
      "id": "1.2",
      "description": "Add POST /auth/register endpoint",
      "spec_scenarios": [
        "Given valid email, When POST /auth/register, Then 201",
        "Given duplicate email, When POST /auth/register, Then 409"
      ],
      "verification_level": "L3",
      "pre_generated_tests": true,
      "verification_commands": [
        "pytest tests/integration/test_auth_api.py::TestRegisterEndpoint -v"
      ],
      "regression_tests": [],
      "test_files_generated": [
        "tests/integration/test_auth_api.py"
      ],
      "setup_commands": [],
      "teardown_commands": [],
      "passes": false,
      "evaluation_attempts": 0
    },
    {
      "id": "3.1",
      "description": "Add login page with form validation",
      "spec_scenarios": [
        "Given login page, When valid credentials, Then redirect to dashboard",
        "Given login page, When invalid password, Then show error"
      ],
      "verification_level": "L4",
      "pre_generated_tests": true,
      "verification_commands": [
        "npx playwright test tests/e2e/login.spec.ts --headed=false"
      ],
      "browser_verification": {
        "approach": "playwright_test",
        "headless": true,
        "start_url": "http://localhost:3000/login"
      },
      "test_files_generated": [
        "tests/e2e/login.spec.ts"
      ],
      "setup_commands": ["npm run dev &", "sleep 5"],
      "teardown_commands": ["kill %1 2>/dev/null || true"],
      "passes": false,
      "evaluation_attempts": 0
    }
  ]
}
\`\`\`

## Step 6: Verify and Report

1. Run all generated tests — they should ALL fail (TDD red phase)
2. If any test passes → the test has no real assertion, fix it
3. Git commit all generated files
4. Report:
   \`\`\`
   Initialization complete:
   - Project type: {type} ({framework})
   - Tasks: {n} total (L2: {a}, L3: {b}, L4: {c}, L5: {d})
   - Test files generated: {list}
   - Spec coverage: {n}/{total} scenarios have tests
   - Edge case tests: +{extra}
   - Regression tests: {n} existing test files included
   - Browser mode: headless={true/false}
   - All tests currently FAIL ✅
   \`\`\`
`;

export function getOpsxInitTestsSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-init-tests',
    description: 'Generate verification material (tests, contracts, browser scenarios) from specs. Assigns L2-L5 levels based on spec scenario content. Part of harness-apply, can also be run standalone.',
    instructions: INIT_TESTS_INSTRUCTIONS,
    license: 'MIT',
    compatibility: 'Requires openspec CLI and Claude Code. Playwright MCP for L4/L5 tasks.',
    metadata: { author: 'harness-spec', version: '1.0' },
  };
}

export function getOpsxInitTestsCommandTemplate(): CommandTemplate {
  return {
    name: 'init-tests',
    description: 'Generate test skeletons from specs (harness initializer)',
    category: 'harness',
    tags: ['tests', 'tdd', 'initializer', 'harness'],
    content: `Generate verification material for change: $ARGUMENTS

${INIT_TESTS_INSTRUCTIONS}`,
  };
}
