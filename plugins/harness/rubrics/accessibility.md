---
name: accessibility
applies-to: L4
severity: warning
---

# Accessibility Rubric

Basic a11y checks for UI tasks. Applies to L4 (browser) verification.

## Criteria

- [ ] **Semantic HTML**: Uses proper tags (button, nav, main, header) not generic divs
- [ ] **ARIA labels**: Interactive elements without visible text have aria-label
- [ ] **Keyboard navigation**: All interactive elements reachable via Tab
- [ ] **Focus indicators**: :focus styles visible (not `outline: none` without replacement)
- [ ] **Color contrast**: Text has sufficient contrast against background (WCAG AA 4.5:1)
- [ ] **Form labels**: All form inputs have associated `<label>` or aria-label
- [ ] **Image alt text**: All meaningful images have alt attributes
- [ ] **data-testid for tests**: Interactive elements have data-testid for Playwright

## Pass condition

Warning-level. Failures lower SCORE by 1 but don't block.

## How to verify (with Playwright)

- Use `page.accessibility.snapshot()` to inspect the accessibility tree
- Check for presence of semantic tags in the rendered HTML
- Verify tab order by pressing Tab and checking `page.evaluate(() => document.activeElement)`
- Take screenshot and have evaluator visually assess contrast
