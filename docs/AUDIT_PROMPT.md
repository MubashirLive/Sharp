# SHARP — Exhaustive Code Audit Prompt v1

You are a senior full-stack engineer. Do a minute, exhaustive audit of the SHARP school management app at `c:\Users\MUBASHIR\Documents\GitHub\Sharp`. Write findings to `docs/REPORT_2.md`.

---

## Phase 0 — Setup (mandatory, in order)

1. Read `docs/REPORT.md` end-to-end. Every numbered finding = tracked item. Mark each **FIXED / PARTIAL / OPEN / REGRESSED** with file:line evidence.
2. Read `docs/INDEX.md`, `docs/PERMISSION_MATRIX.md`, `docs/PRD.md`, `docs/ONBOARDING.md`, `CLAUDE.md`.
3. Read `.claude/skills/ui-ux-pro-max/SKILL.md` before any UI judgment.
4. Build/refresh the graph: `mcp__code-review-graph__build_or_update_graph_tool(full_rebuild=false)`.
5. Get minimal context: `mcp__code-review-graph__get_minimal_context`.
6. Pull live schema: `mcp__supabase__list_tables(schemas=["public"], verbose=true)`.
7. Pull advisor reports: `mcp__supabase__get_advisors(type="security")` then `type="performance"`.
8. Pull last-24h logs: `mcp__supabase__get_logs(service="api")` and `service="edge-function"`.
9. Run `git log --oneline -20` and `git status` to anchor branch/commit.

---

## Phase 1 — Graph-First Static Analysis

Use code-review-graph tools FIRST. Fall back to Grep/Glob/Read only when graph lacks coverage. For every finding, capture: `file:line`, severity (CRITICAL/HIGH/MEDIUM/LOW/INFO), confidence (HIGH/MED/LOW), evidence (snippet or query result).

Required calls:
- `list_graph_stats`
- `list_communities` + `get_architecture_overview` (standard)
- `list_flows` (sort by criticality, limit 50)
- `find_large_functions(min_lines=50)` — list all
- `refactor_tool(mode="dead_code")` — list all
- `get_hub_nodes(top_n=20)` — blast-radius candidates
- `get_bridge_nodes(top_n=20)` — chokepoint candidates
- `get_knowledge_gaps` — untested hotspots, thin communities, isolated nodes
- `get_surprising_connections(top_n=15)` — unexpected coupling
- `get_impact_radius(base="HEAD~5")` — recent-change blast
- `get_review_context(base="HEAD~5", include_source=true)` for diff-quality view

Subagent delegation rules:
- > 2 file scope → `caveman:cavecrew-investigator` (locate) or `caveman:cavecrew-reviewer` (diff)
- For PR-grade review: `code-review` skill
- For cleanups: `simplify` skill
- For multi-modal sweep: `Workflow` with `parallel()` on independent dimensions

---

## Phase 2 — Dimension Audit

For every dimension, walk every file. Cite `file:line`. No claim without evidence.

### A. UI/UX (button → toast → dropdown → modal → form → table → page)
- **Mobile-first 360px**: any overflow, small text, touch target < 44px.
- **Loading state**: skeleton, spinner, disabled, shimmer. Missing → flag.
- **Empty state**: zero data, no results, no permission, error. Missing → flag.
- **Error state**: inline, toast, dialog, fallback. Missing → flag.
- **Accessibility**: aria-label, role, focus-visible, tab order, keyboard trap, screen reader text. Missing → flag.
- **Toast**: success/error/info variants, auto-dismiss, stacking, position.
- **Dropdown**: keyboard nav, multi-select, clear action, empty option, search for long lists.
- **Modal**: focus trap, esc close, scroll lock, backdrop click, restore focus.
- **Form**: inline validation timing, error placement, submit guard, dirty state, autosave.
- **Table**: sort, filter, paginate, bulk select, empty/loading states, column resize.
- **Navigation**: active state, breadcrumbs, role-based hide, deep link survival.
- **Design system**: tokens vs hardcoded colors, spacing scale, typography scale.

### B. Database
- Every public table: `school_id` column? RLS enabled? Policies present? Indexes on FK + lookup cols?
- Soft delete vs hard delete consistency.
- Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by` — coverage.
- Migrations: order, idempotency, down path, data vs schema split.
- Functions/triggers: `SECURITY DEFINER` audit, `search_path` set, RLS bypass risk, trigger order.
- **Type drift**: run `supabase gen types typescript --project-id ndtqhschvnyloeccaelv` → diff against `src/integrations/supabase/types.ts`. Report every missing/extra field.
- Hot path queries: missing indexes, N+1, `select("*")` waste.

### C. Security
- Direct `supabase.auth.*` calls outside AuthContext. Flag.
- RLS gaps: every table without policies. Flag with severity.
- Idempotency key on every write edge function. Flag missing.
- Secret leaks: search `.env*`, `.gitignore` gaps, hardcoded keys.
- SQL injection: raw queries with user input.
- XSS: `dangerouslySetInnerHTML`, unescaped user content.
- CSRF: state-changing GETs.
- File upload: size/type/MIME validation, virus scan, signed URL TTL.
- Auth rate limiting on login + OTP.
- Webhook signature verification.
- `get_advisors(security)` output: report verbatim + remediation link.

### D. Code Quality
- Functions > 50 lines. List with count.
- Files > 300 lines. List.
- Components doing fetch + render + state. List.
- Inline supabase calls in components (should be in `queries/` or `hooks/`).
- Magic numbers/strings not in `src/lib/constants.ts`.
- `any` types. Count + list first 20.
- Dead code from `refactor_tool`. List.
- Circular imports. List.
- `console.log` / `debugger` left in code. List with file:line.
- TODO / FIXME / HACK / XXX comments. List with `git blame` age.
- Test coverage: `get_knowledge_gaps` untested hotspots. List.

### E. Performance
- Bundle: `npm run build`, capture dist size. Large deps, tree-shake check.
- Re-render hotspots: inline objects/arrays as props, unstable refs.
- `useMemo`/`useCallback` on hot paths? Missing list.
- TanStack Query: `staleTime` / `gcTime` / `refetchOnWindowFocus`. Misconfig list.
- Image: lazy loading, responsive sizes, format (webp/avif).
- Supabase: `select("*")` vs specific columns. List.
- Realtime: subscription cleanup on unmount. Leaks list.
- `get_advisors(performance)` output verbatim.

### F. Feature Completeness
- PRD features: built / partial / missing. Cross-check REPORT.md + PRD.md.
- Edge functions: list. Each: auth check, idempotency, error handling, logging, return shape.
- Onboarding: spec match? `docs/ONBOARDING.md` vs actual code.
- Permission matrix: UI gates match? Mismatches list.
- i18n: Hindi strings extracted? Hooks wired? Missing list.
- Mobile responsive: 360px breakpoint test per page.

### G. Bugs / Errors / Failures
- `get_logs(api)` + `get_logs(edge-function)` patterns. Top 5 errors.
- Build: `npm run build`. Capture errors.
- Lint: `npm run lint`. Capture errors.
- Type: `npx tsc --noEmit`. Capture errors.
- Race conditions: useEffect deps, stale closures, async state.
- Memory leaks: subscriptions, intervals, listeners.
- Browser console errors during typical user flow (mentally trace from src/pages/).

### H. Documentation
- `docs/INDEX.md`: complete? Stale? Missing sections?
- Inline code comments on complex logic.
- `CLAUDE.md` project state: accurate vs reality?
- Session notes updated?
- Spec vs code drift.

---

## Phase 3 — Synthesis

Cross-reference findings. Identify:
- **Pattern repeats**: same mistake in N places → single fix benefits many.
- **Hotspot risk**: high-degree node + no test + recent change → highest priority.
- **Quick wins**: small effort, high value.
- **Snowball risks**: compound failures if not addressed now.

---

## Phase 4 — Write `docs/REPORT_2.md`

Structure (mandatory sections, in order):

1. **Executive Summary** — overall grade (A-F), counts (CRITICAL/HIGH/MED/LOW/INFO), top 3 wins, top 3 risks, one-paragraph headline.
2. **REPORT.md Progress Tracker** — table per finding with status + evidence + commit. Summary: X% resolved.
3. **UI/UX Audit** — per-page matrix + per-element findings.
4. **Database Audit** — schema, RLS, indexes, type drift, migrations, triggers.
5. **Security Audit** — advisor output, RLS gaps, secrets, idempotency, CVEs.
6. **Code Quality** — large functions, dead code, magic strings, any types.
7. **Performance** — bundle, re-renders, queries, realtime.
8. **Feature Completeness** — PRD matrix, edge functions, permissions, i18n.
9. **Bugs / Errors / Failures** — log patterns, build/lint/type errors.
10. **Documentation** — drift, missing, stale.
11. **Best Practices Found** — what we do right. Cite file:line.
12. **Worst Practices Found** — what we do wrong. Cite file:line + severity.
13. **Threats & Warnings** — future risks. Probability + impact + trigger condition.
14. **Future Plan & Direction** — Phase 1 gaps, Phase 2 readiness, 4-week roadmap.
15. **Priority Action Plan** — ranked, owner-suggested, effort estimate, dependency chain.

**Appendix**:
- Tools used
- Files read
- Time spent per phase
- Confidence per section
- Unverified claims (couldn't confirm)

---

## Rules

- **Brutal honesty**. No sugarcoating.
- **Every claim cited**: `file:line`.
- **No claim without evidence**. If you can't verify, say so.
- **Severity**: CRITICAL / HIGH / MEDIUM / LOW / INFO.
- **Confidence**: HIGH / MED / LOW.
- **Run commands to verify**. Don't guess.
- **Write the file**. Don't just summarize in chat.
- **Token efficiency**: graph tools first, subagents for > 2 file scope, skills for review/simplify.
- **Compare to REPORT.md**: every old finding gets a status row in section 2.
- **One file, one report**: `docs/REPORT_2.md`. Don't create REPORT_2_PART1, _PART2.
