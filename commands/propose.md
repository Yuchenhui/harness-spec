Propose a new change. Create all artifacts in one step.

**Input**: $ARGUMENTS — a change name (kebab-case) or description of what to build.

**Steps**

1. If no clear input, use AskUserQuestion: "What do you want to build?"
   Derive a kebab-case name from the description.

2. Create the change directory structure:
   ```
   changes/<name>/
   ├── proposal.md   — Why this change, what it affects
   ├── design.md     — Technical approach (optional, skip for simple changes)
   ├── specs.md      — Given/When/Then scenarios (be specific: concrete values, HTTP methods, status codes)
   └── tasks.md      — Checkbox task list: - [ ] 1.1 Description
   ```

3. **proposal.md**: Sections — Why, What Changes, Capabilities (new/modified), Impact. Keep to 1-2 pages.

4. **specs.md**: Each requirement as `### Requirement: <name>` with `#### Scenario: <name>` using WHEN/THEN format. Use SHALL/MUST for normative language. Every requirement must have at least one scenario.

   **HARNESS TIP**: Write specific, verifiable scenarios. Instead of "Given valid data", write "Given email 'test@example.com' and password 'Pass123!'". This helps test generation later.

5. **design.md** (if needed): Context, Goals/Non-Goals, Decisions with rationale, Risks/Trade-offs.

6. **tasks.md**: Numbered groups with checkboxes. Tasks should be small enough for one session.
   ```
   ## 1. Setup
   - [ ] 1.1 Create module structure
   - [ ] 1.2 Add dependencies

   ## 2. Core
   - [ ] 2.1 Implement main feature
   ```

7. Git commit all files.

When done, suggest: "Run /harness:review to check spec quality, then /harness:apply to start implementation."
