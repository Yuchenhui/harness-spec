# Upstream Watch: OpenSpec Issues & PRs

Tracked as of 2026-04-08. Our base: OpenSpec v1.2.0 (commit `64d476f`).

## HIGH VALUE — Should Port When Merged

### PRs to Watch

| PR | Title | Why It Matters | Our Module |
|----|-------|---------------|------------|
| **#843** | fix: scenario-level merge for MODIFIED | Fixes data-loss bug in delta spec merge | `specs-apply.ts`, `requirement-blocks.ts` | **INTEGRATED** |
| **#887** | feat: config.yaml injection | Injects project context into apply/verify | `project-config.ts`, `shared.ts` | **INTEGRATED (infra)** |
| **#839** | feat: hierarchical specs | Parent/child spec trees | `artifact-graph/`, `specs-apply.ts` | Watching |
| **#902** | feat: sub-agent spec discovery | Auto-discovers existing specs during propose | `propose.ts` | Skipped (blocked) |
| **#893** | feat: /opsx:refine scratchpad | Scratchpad-based artifact review | `review.ts` | Watching |

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

- [x] PR #843: scenario-level merge fix — **INTEGRATED** (2026-04-08)
- [x] PR #887: config injection infra — **INTEGRATED** (2026-04-08, templates need manual adaptation)
- [ ] When PR #839 merges: evaluate hierarchical specs for our artifact-graph
- [ ] When PR #902 merges: port spec discovery to propose workflow
- [ ] Check Issue #869 — if they fix the "Claude skips workflow" prompt issue, apply same fix to our workflows
