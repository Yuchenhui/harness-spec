---
name: security
applies-to: L2|L3
severity: critical
---

# Security Rubric

Basic OWASP-style checks for code that handles user input, authentication, or sensitive data.

## Criteria

- [ ] **Input validation**: All user inputs are validated/sanitized before use
- [ ] **SQL injection**: Parameterized queries used, no string concatenation in SQL
- [ ] **Auth on protected routes**: Routes under /admin, /api/internal have auth middleware
- [ ] **No hardcoded secrets**: No API keys, passwords, tokens in source code
- [ ] **Password handling**: Passwords hashed with bcrypt/argon2, never stored plaintext
- [ ] **HTTPS only for sensitive data**: Cookies with sensitive data marked Secure + HttpOnly
- [ ] **CSRF protection**: State-changing POST/PUT/DELETE endpoints have CSRF tokens (or use SameSite cookies)
- [ ] **Rate limiting**: Login/registration endpoints have rate limiting
- [ ] **Error messages don't leak info**: No stack traces, DB errors, or file paths in responses

## Pass condition

All critical checks must pass. Any failure caps SCORE at 2.

## How to verify

For L2/L3 tasks:
- grep for common anti-patterns (SELECT \* FROM users WHERE .* \+)
- Check imports for auth middleware on protected routes
- Run dependency scanner if available (npm audit, safety, etc.)
