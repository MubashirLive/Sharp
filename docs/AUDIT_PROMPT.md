# Exhaustive Code Audit Prompt v1

Run on 2026-06-07 (cron). Output: [REPORT_2.md](REPORT_2.md). Summary: [AUTO_AUDIT_EXECUTION_SUMMARY.md](AUTO_AUDIT_EXECUTION_SUMMARY.md).

## Phase 0 — Setup
1. Read [REPORT.md](REPORT.md) end-to-end. Each finding → status row in REPORT_2.
2. Read [INDEX.md](INDEX.md), [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md), [PRD.md](PRD.md), [ONBOARDING.md](ONBOARDING.md), CLAUDE.md.
3. Read `.claude/skills/ui-ux-pro-max/SKILL.md` before any UI judgment.
4. code-review-graph: `build_or_update_graph_tool`, `get_minimal_context`.
5. Supabase MCP: `list_tables(verbose=true)`, `get_advisors(security/performance)`, `get_logs(api/edge-function)`.
6. `git log --oneline -20`, `git status`.

## Phase 1 — Graph-first
- `list_graph_stats`, `list_communities`, `get_architecture_overview`
- `list_flows` (sort criticality, limit 50)
- `find_large_functions(min_lines=50)`
- `refactor_tool(mode="dead_code")`
- `get_hub_nodes(top_n=20)`, `get_bridge_nodes(top_n=20)`
- `get_knowledge_gaps`
- `get_surprising_connections(top_n=15)`
- `get_impact_radius(base="HEAD~5")`, `get_review_context(base="HEAD~5")`

## Phase 2 — Dimensions
A. UI/UX, B. DB, C. Security, D. Code Quality, E. Performance, F. Feature Completeness, G. Bugs, H. Docs.

## Phase 3 — Synthesis
Pattern repeats, hotspot risk, quick wins, snowball risks.

## Phase 4 — Write REPORT_2.md
15 sections + Appendix. Every claim cited file:line. Severity + confidence.

## Rules
- Brutal honesty.
- file:line for every claim.
- No unverified claim.
- Run commands to verify.
- One file: REPORT_2.md.
