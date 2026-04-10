---
name: performance
applies-to: L3
severity: warning
---

# Performance Rubric

Basic performance checks for API endpoints and database operations.

## Criteria

- [ ] **No N+1 queries**: ORM queries use select_related / prefetch_related / eager loading
- [ ] **Database indexes**: Frequently queried fields have indexes
- [ ] **Response time < 500ms**: Verification commands include response time assertion if possible
- [ ] **No unbounded queries**: LIST endpoints use pagination (LIMIT, OFFSET, cursor)
- [ ] **No unnecessary data loading**: SELECT only needed columns, not SELECT \*
- [ ] **Caching where appropriate**: Expensive computations or frequent reads use cache

## Pass condition

Warning-level only. Failures are informational and lower SCORE by 1 but don't block.

## How to verify

- Inspect query logs or ORM generated SQL
- Check test execution time — if > 500ms for a simple endpoint, investigate
- Look for obvious pagination in list endpoints
