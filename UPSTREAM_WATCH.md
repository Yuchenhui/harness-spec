# Upstream Watch: OpenSpec Issues & PRs

Tracked as of 2026-04-08. Our base: OpenSpec v1.2.0 (commit `64d476f`).

## HIGH VALUE — Should Port When Merged

### PRs to Watch

| PR | Title | Why It Matters | Our Module |
|----|-------|---------------|------------|
| **#843** | fix: scenario-level merge for MODIFIED requirements | Fixes bug in delta spec merge logic — **we use `specs-apply.ts` directly** | `src/core/specs-apply.ts` |
| **#887** | feat: inject config.yaml context and rules into apply/verify | Injects project context into workflows — improves our apply + verify quality | `src/core/templates/workflows/` |
| **#839** | feat: hierarchical specs | Parent/child spec trees with inheritance — major artifact-graph enhancement | `src/core/artifact-graph/` |
| **#902** | feat: sub-agent spec discovery in proposals | Auto-discovers existing specs during propose — improves proposal quality | `src/core/templates/workflows/propose.ts` |
| **#893** | feat: `/opsx:refine` with scratchpad-based review | Scratchpad review concept — may yield ideas for our `review` workflow | `src/core/templates/workflows/review.ts` |

### Issues to Monitor

| Issue | Title | Why It Matters |
|-------|-------|---------------|
| **#906** | Resume interrupted skill/command | Critical for our long-running harness-apply loops |
| **#880** | `/opsx:validate` command | Overlaps with our L1-L5 verify — evaluate their approach |
| **#900** | Optional test generation from specs | Exactly what our `init-tests` does — potential upstream convergence |
| **#901** | Automatic spec catalog discovery | Improves proposal quality |
| **#835** | Global config.yaml for workflow rules | May change global config structure we depend on |
| **#662** | Hierarchical spec structure | Foundation for PR #839 |

## MEDIUM VALUE — Monitor But Don't Act Yet

| # | Title | Notes |
|---|-------|-------|
| #879/#881 | Skills-only delivery reference bug (P0) | Could affect our skill generation |
| #911 | sync messed up spec.md files | May be a specs-apply bug we inherited |
| #869 | Claude Opus 4.6 skips opsx:ff | Claude-specific — we're Claude-only, may need same prompt fix |
| #875 | explore transitions to implementation | Same category — prompt engineering issue |
| #907 | Rename /opsx: to /openspec: | Would affect our prefix choice if merged |
| #850 | Allow numeric-prefixed change names | Touches validation module we use |
| #919 | Refactor skill packaging | Architectural change to skill generation |

## LOW VALUE — Not Relevant

~20 issues/PRs about non-Claude adapters (Kiro, Junie, Pi, OpenCode, etc.), i18n, PostHog telemetry. We removed all of these. Ignore.

## How to Sync

When a HIGH VALUE PR merges upstream:

```bash
# 1. Get the specific changed file(s)
cd /tmp && git clone --depth 1 https://github.com/Fission-AI/OpenSpec.git

# 2. Compare with our version
diff /tmp/OpenSpec/src/core/specs-apply.ts src/core/specs-apply.ts

# 3. Apply the fix/feature manually (don't blindly copy — our code may have diverged)

# 4. Update upstream-openspec/ snapshot
cp /tmp/OpenSpec/src/core/specs-apply.ts upstream-openspec/src/core/specs-apply.ts

# 5. Update UPSTREAM.md version info

# 6. Test
npx tsc --noEmit && npm test
```

## Action Items

- [ ] When PR #843 merges: port scenario-level merge fix to `src/core/specs-apply.ts`
- [ ] When PR #887 merges: port config injection to apply/verify workflows
- [ ] When PR #839 merges: evaluate hierarchical specs for our artifact-graph
- [ ] When PR #902 merges: port spec discovery to propose workflow
- [ ] Check Issue #869 — if they fix the "Claude skips workflow" prompt issue, apply same fix to our workflows
