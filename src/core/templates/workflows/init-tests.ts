/**
 * Harness Verification Initializer Workflow
 *
 * Phase 1: Generate test skeletons, API contracts, browser scenarios
 * from reviewed specs. All tests should FAIL before coding begins (TDD red phase).
 */
import type { SkillTemplate, CommandTemplate } from '../types.js';

export function getOpsxInitTestsSkillTemplate(): SkillTemplate {
  return {
    name: 'openspec-init-tests',
    description: 'Generate verification material (test skeletons, API contracts, browser scenarios) from specs before coding. Part of the harness apply workflow — usually called automatically.',
    instructions: `Generate verification material for a change before coding begins.

This creates the "exam" that the Coding Agent must pass. Tests are written
by this Initializer, not by the agent that writes the implementation.

---

**Input**: Change name or path.

**Steps**

1. **Locate the change and read files**
   \`\`\`bash
   openspec status --change "$ARGUMENTS" --json
   \`\`\`
   Read the reviewed specs (look for [harness-reviewed] tags) and tasks.md.

2. **Detect project tech stack**
   Check for: package.json (Node), requirements.txt/pyproject.toml (Python),
   go.mod (Go), pom.xml/build.gradle (Java).
   Determine test framework: pytest, jest, go test, junit.

3. **Assign verification_level to each task**
   - Pure model/utility/config → **L2** (Unit test)
   - API endpoint/database operation → **L3** (Integration test)
   - UI page/interaction → **L4** (E2E browser test via Playwright)
   - Pure styling/design → **L5** (Visual, human review)

4. **Generate test skeleton files (L2/L3 tasks)**

   For each spec scenario, create a test function with:
   - Function name derived from scenario
   - Docstring quoting the original scenario
   - Real assertions (assert status_code == 201, assert "user_id" in body)
   - Necessary fixtures referenced

   Place tests in the project's test directory following existing conventions.
   If no test directory exists, create tests/ with conftest.py/setup files.

   **Critical**: Tests must have REAL assertions, not \`pass\` or \`TODO\`.
   **Critical**: Also generate edge case tests (empty input, long input, special chars).

5. **Generate API contract files (L3 tasks, optional)**

   Create JSON files with request/response expectations:
   \`\`\`json
   {
     "endpoint": "POST /auth/register",
     "cases": [
       {"name": "success", "request": {...}, "expected": {"status": 201, ...}},
       {"name": "duplicate", "request": {...}, "expected": {"status": 409}}
     ]
   }
   \`\`\`

6. **Generate browser scenario files (L4 tasks)**

   Create JSON files with step-by-step Playwright actions:
   \`\`\`json
   {
     "scenarios": [{
       "name": "login_success",
       "steps": [
         {"action": "navigate", "url": "http://localhost:3000/login"},
         {"action": "type", "selector": "input[name='email']", "text": "..."},
         {"action": "click", "selector": "button[type='submit']"}
       ],
       "assertions": [{"type": "url_contains", "value": "/dashboard"}]
     }]
   }
   \`\`\`

7. **Generate feature_tests.json**

   \`\`\`json
   {
     "change_id": "<name>",
     "evaluation_config": {"max_retries": 3, "tdd_mode": true},
     "tasks": [{
       "id": "1.1",
       "description": "from tasks.md",
       "spec_scenarios": ["from specs"],
       "verification_level": "L2",
       "pre_generated_tests": true,
       "verification_commands": ["pytest tests/test_xxx.py::test_yyy -v"],
       "passes": false,
       "evaluation_attempts": 0
     }]
   }
   \`\`\`

8. **Generate claude-progress.txt**

   List all tasks as pending.

9. **Verify all tests FAIL**
   \`\`\`bash
   # Run all generated tests — they should ALL fail
   pytest tests/ -v  # or npm test, go test, etc.
   \`\`\`
   If any test passes, it means either the test is wrong (no real assertion)
   or the implementation already exists.

10. **Git commit all generated files**
    \`\`\`bash
    git add tests/ changes/<name>/feature_tests.json changes/<name>/claude-progress.txt
    git commit -m "harness: generate verification material for <name>"
    \`\`\`

11. **Report summary**
    \`\`\`
    Initialization complete:
    - feature_tests.json: {n} tasks (L2: {a}, L3: {b}, L4: {c}, L5: {d})
    - Test files: {list}
    - Spec coverage: {covered}/{total} scenarios
    - Edge case tests: +{extra}
    - All tests currently FAIL ✅
    \`\`\`
`,
  };
}

export function getOpsxInitTestsCommandTemplate(): CommandTemplate {
  return {
    name: 'init-tests',
    description: 'Generate test skeletons from specs (harness initializer)',
    category: 'harness',
    tags: ['tests', 'tdd', 'initializer', 'harness'],
    content: `Generate verification material for change: $ARGUMENTS

Creates test skeletons, API contracts, and browser scenarios from
reviewed specs. All tests will initially FAIL (TDD red phase).

Usually called automatically by /opsx:apply. Run manually if you
want to inspect generated tests before starting implementation.`,
  };
}
