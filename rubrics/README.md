# Example Rubrics

Drop `.md` files into `.claude/harness-rubrics/` in your project to add custom evaluation criteria. The evaluator agent will load all `.md` files in that directory and apply them alongside the default 0-5 scoring.

## Format

Each rubric file should follow this structure:

```markdown
---
name: rubric-name
applies-to: L2|L3|L4  (optional — which levels this applies to)
severity: critical|warning  (optional — critical blocks, warning is informational)
---

# What this rubric checks

One-paragraph description of what this rubric enforces.

## Criteria

- [ ] Concrete check 1
- [ ] Concrete check 2
- [ ] Concrete check 3

## Pass condition

All critical checks must pass.
```

## Built-in examples

See the files in this directory for ready-to-use rubrics:

- `security.md` — OWASP-style security checks (input validation, auth, secrets)
- `performance.md` — Performance baseline (no N+1 queries, response time)
- `accessibility.md` — Basic a11y checks for UI tasks (semantic HTML, ARIA)

Copy any of these to your project's `.claude/harness-rubrics/` to activate them.

## How they work

During evaluation, the evaluator agent will:
1. Run the standard L1-L5 verification
2. Check `.claude/harness-rubrics/` for `.md` files
3. For each rubric file, verify the criteria (may run additional commands)
4. Include rubric results in `RUBRIC_CHECKS` output section
5. If a critical rubric check fails, SCORE cannot exceed 2

You can also use rubrics to EXCEED the default checks — a custom rubric can push a task from score 3 to score 4 by validating extra quality signals.
