# Upstream Tracking: OpenSpec

This project incorporates core code from [OpenSpec](https://github.com/Fission-AI/OpenSpec) (MIT License).

## Current Upstream Version

| Field | Value |
|-------|-------|
| **Source** | [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec) |
| **Version** | 1.2.0 |
| **Commit** | `64d476f8b924bb9b74b896ea0aa784970e37da69` |
| **Date** | 2026-04-04 |
| **License** | MIT |

## What We Took from OpenSpec

The `upstream-openspec/` directory contains the full unmodified source at the version above.

Core modules extracted into `src/` (~3,700 lines out of ~21,847):

| Module | Path | Purpose |
|--------|------|---------|
| Artifact Graph | `src/core/artifact-graph/` | DAG dependency system, topological sort, completion detection |
| Delta Spec Apply | `src/core/specs-apply.ts` | ADDED/MODIFIED/REMOVED/RENAMED merge with conflict detection |
| Archive | `src/core/archive.ts` | Validation + archival logic |
| Schema System | `src/core/artifact-graph/schema.ts`, `resolver.ts` | 3-tier YAML schema resolution |
| Instruction Loader | `src/core/artifact-graph/instruction-loader.ts` | Template + context + rules generation |
| Config | `src/core/config.ts`, `project-config.ts`, `global-config.ts` | Configuration management |
| Validation | `src/core/validation/` | Spec/change validation |
| Parsers | `src/core/parsers/` | Markdown parsing |
| Utils | `src/utils/` | File system utilities |
| Claude Adapter | `src/core/command-generation/adapters/claude.ts` | Claude Code file generation |

## What We Changed / Added

| What | Status | Description |
|------|--------|-------------|
| 23 non-Claude adapters | **Removed** | Only Claude Code adapter retained |
| PostHog telemetry | **Removed** | No analytics |
| ASCII UI | **Removed** | Simplified |
| Workflow: review | **Added** | Spec Reviewer (Phase 0) — interactive spec quality gate |
| Workflow: init-tests | **Added** | Initializer (Phase 1) — generate test skeletons from specs |
| Workflow: harness-apply | **Replaced** apply | Harness loop (Phase 2) — code → evaluate → fix cycle |
| Workflow: verify | **Enhanced** | Multi-level verification L1-L5, Playwright MCP |
| Hooks system | **Added** | stop-check, session-init, post-commit hooks |
| Schema: harness-driven | **Added** | New workflow schema with review/init-tests phases |

## How to Sync Upstream Updates

When OpenSpec releases a new version with changes we want:

```bash
# 1. Download the new version
cd /tmp && git clone --depth 1 https://github.com/Fission-AI/OpenSpec.git openspec-new

# 2. Compare with our upstream snapshot
diff -rq /tmp/openspec-new/src/core/artifact-graph/ upstream-openspec/src/core/artifact-graph/
diff -rq /tmp/openspec-new/src/core/specs-apply.ts upstream-openspec/src/core/specs-apply.ts

# 3. If core modules changed, review and apply changes:
#    - artifact-graph/ changes: likely safe to take
#    - specs-apply.ts changes: review carefully (our workflows depend on it)
#    - new adapters: ignore (we only use Claude)
#    - workflow templates: ignore (we have our own)

# 4. Update upstream-openspec/ snapshot
rm -rf upstream-openspec/
cp -r /tmp/openspec-new/ upstream-openspec/ && rm -rf upstream-openspec/.git

# 5. Update this file with new version info

# 6. Test
npm test
```

## Decision Log

**2026-04-08**: Initial import of OpenSpec v1.2.0. Chose to extract core rather than fork because:
- We only need ~17% of the codebase (3,700 / 21,847 lines)
- We're replacing the workflow layer entirely with harness engineering
- We only support Claude Code (not 24 tools)
- Tracking upstream on core modules is straightforward (they're stable infrastructure)
