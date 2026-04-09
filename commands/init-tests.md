Generate test skeletons from specs before coding begins (TDD).

**Input**: $ARGUMENTS — change name (optional, auto-detect).

Usually called automatically by /harness:apply. Run manually to inspect tests before implementation.

**Steps**

1. Find the change. Read reviewed specs and tasks.

2. Detect project tech stack (package.json / requirements.txt / go.mod).

3. Assign verification_level per task based on spec scenario keywords:
   - UI interaction (click, page, button) → L4 (E2E)
   - Visual only (style, color, layout) → L5 (Visual)
   - API endpoint (POST, GET, status) → L3 (Integration)
   - Database (stored, unique, constraint) → L3 with fixtures
   - Everything else → L2 (Unit)

4. Generate test skeleton files with REAL assertions (not empty shells).
   Each spec scenario → at least one test function with assert statements.
   Add edge case tests (empty input, duplicates, special characters).

5. Generate feature_tests.json with verification metadata per task.

6. Verify all tests FAIL (TDD red phase).

7. Git commit.

Report: "Generated {n} tests across {files}. All currently FAIL. Run /harness:apply to start coding."
