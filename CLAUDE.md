# SHARP — School Management System

> Single source of truth for Claude Code sessions on this repo.
> Keep this file ≤300 lines. Feature-specific rules go in `docs/{FEATURE}.md`.
> Per-session lessons go in `docs/LESSONS.md`. User facts go in `MEMORY.md`.

---

# ⚡ HARD RULES — NO OVERRIDE

## 0. Read order (FIRST thing every session)

1. `CLAUDE.md` (this file)
2. `MEMORY.md` — durable user/project facts
3. `docs/LESSONS.md` — recent session lessons (highest signal)
4. `docs/INDEX.md` — feature doc routing
5. The feature-specific doc for the task

## 1. Karpathy 4 principles (from `andrej-karpathy-skills` plugin — MIT)

**a. Think Before Coding.** State assumptions. Surface tradeoffs. If confused, ask. Don't pick silently.

**b. Simplicity First.** Minimum code that solves the problem. No abstractions for single-use code. No error handling for impossible scenarios. If 200 lines could be 50, rewrite it.

**c. Surgical Changes.** Touch only what the task requires. Don't "improve" adjacent code. Match existing style. Clean up only your own mess. Every changed line should trace to the user's request.

**d. Goal-Driven Execution.** Transform "add X" into "write tests for X, then make them pass." State a brief plan with verification steps. Loop until verified.

> Source: `~/.claude/plugins/cache/karpathy-skills/andrej-karpathy-skills/1.0.0/CLAUDE.md`

## 2. Tool priority (FIRST → LAST, fallback only)

1. **code-review-graph MCP** — `semantic_search_nodes`, `query_graph`, `get_impact_radius`, `detect_changes`
2. **Supabase MCP** — `list_tables`, `get_logs`, `get_advisors`, `apply_migration`
3. **Skills** — see §7 below
4. **Subagents** — `Agent` with `subagent_type="general-purpose"` (no `cavecrew-*` — those are not installed). Use `src/agents/*.md` prompt templates for subagent-driven-development.
5. **Grep / Glob / Read** — only when graph/MCP don't cover it
6. **Bash** — last resort, prefer dedicated tools

## 3. Response style

- Terse. Fragments OK. No filler. No hedging. No "I'd be happy to help"
- Code / commits / security warnings / destructive ops: write normal prose
- Drop articles in casual replies, keep them in specs

## 4. Workflow gates (read BEFORE coding)

- Read `docs/INDEX.md` → find the doc for the task → read it fully
- Read `docs/PERMISSION_MATRIX.md` BEFORE any RLS or auth work
- Read `src/integrations/supabase/types.ts` BEFORE any query
- Filter by `school_id` on EVERY multi-tenant query
- Use `academic_sessions` NOT `public.sessions`
- Reuse `src/components/` BEFORE creating new

### Workflow chain (non-trivial work)

```
/brainstorm → /plan → /tdd per task → implement → review → /finish → /reflect
```

- **>2 files touched** → use `/plan` first
- **End of substantial session** → run `/reflect`

## 5. Always-invoke skill matrix

| Trigger | Skill / command / plugin |
|---|---|
| Any new feature, behavior change, cross-cutting concern | `/brainstorm` (writes spec at `docs/superpowers/specs/`) |
| Multi-step task (≥2 files or ≥1 hour) | `/plan` (writes plan at `docs/superpowers/plans/`) |
| Data hooks, queries, RLS, business logic, validation | `/tdd` (red-green-refactor) |
| Multiple independent tasks in same session | `subagent-driven-development` (3 templates at `src/agents/`) |
| Any bug, test failure, unexpected behavior | `systematic-debugging` (superpowers skill) |
| Before any "done" / "fixed" / "passing" claim | `verification-before-completion` (superpowers skill) |
| Pre-commit / pre-PR | `verification-before-completion` + run `npm test` + `npm run type-check` |
| Closing a feature branch | `/finish` (4-option menu) |
| Any new page, dialog, form, table, button, list | `ui-ux-pro-max` (project skill) before writing JSX |
| User asks for distinctive / high-design aesthetic | `frontend-design` (FALLBACK — ui-ux-pro-max is primary) |
| End of substantial session | `/reflect` |
| User asks to explore unfamiliar code | graph MCP `semantic_search_nodes` first |
| DB schema change proposed | graph MCP `list_tables` + `types.ts` first |
| Destructive SQL or edge-fn change | Ask user explicitly, no auto-execute |

## 6. Anti-patterns — never do these

- Don't reference `cavecrew-*` subagent names (not installed)
- Don't call Supabase auth directly → use `AuthContext`
- Don't create new components without checking `src/components/` first
- Don't hardcode `school_id` values → use from auth context
- Don't query `public.sessions` for academic data → use `academic_sessions`
- Don't skip `docs/INDEX.md` before starting feature work
- Don't implement before documenting (for new features)
- Don't use `<Button onClick={asyncFn}>` for any mutation — use `<SubmitButton>` or `useGuardedSubmit()` (see `docs/SUBMIT_GUARD.md`)
- Don't skip `idempotency_key` in any write-edge-function request body (see `docs/SUBMIT_GUARD.md`)
- Don't write production code without a failing test (TDD Iron Law for data/RLS/business logic)
- Don't claim work is complete without fresh verification evidence
- Don't add features beyond what was asked (karpathy §1)
- Don't "improve" adjacent code (karpathy §3)
- Don't skip the spec/plan for "simple" features (it never is)

---

# Project identity (compact — full detail in `docs/PRD.md`)

Multi-school LMS. React 18 + TypeScript + Vite + shadcn/ui + Supabase.
Roles: `super_admin` | `principal` | `staff` | `student` (stored in `profiles.role`).
3-tier subjects: `school_subjects` → `subjects` → `section_subjects`.
6-digit PIN login. Student App ID: `SHARP-{YEAR}-{6_DIGIT}`.

---

# Database — Supabase (MCP connected)

Project ref: `ndtqhschvnyloeccaelv`. Always introspect live schema, never trust memory.

- **Multi-tenancy:** `school_id` on every table. EVERY query MUST filter by it.
- **Subject hierarchy:** confirm which tier before querying.
- **Known issue:** `public.sessions` mixes Supabase auth + LMS data. Use `academic_sessions`.
- **After schema change:** `supabase gen types typescript --project-id ndtqhschvnyloeccaelv`.
- **Migrations:** generate file → wait for approval → execute.
- **UUIDs** for all PKs, **snake_case** for all names. **Always add RLS** on new tables.

---

# Common patterns — use these

- **Form validation:** Zod + React Hook Form
- **Data fetching:** TanStack Query v5 with `school_id` filter
- **UI:** shadcn/ui primitives (`src/components/ui/`)
- **Auth:** `AuthContext` only — never call Supabase auth directly
- **Modals:** large dialog with tabs for multi-stage forms
- **Tables:** sort + filter + bulk actions
- **Mutations:** TanStack Query mutation with shared query key factory; invalidate all related keys atomically on success (see `docs/LESSONS.md` 2026-06-18 two-store entry)
- **Multi-layer normalization:** Zod transform + DB trigger + `src/lib/text-utils.ts` utility (see `docs/LESSONS.md` 2026-06-18)
- **Subagent work:** dispatch fresh subagent per task with 2-stage review (templates at `src/agents/`)

---

# TDD scope (when mandatory, when optional)

| Code type | TDD? |
|---|---|
| Data hooks / TanStack Query mutations | **MANDATORY** |
| Supabase query helpers | **MANDATORY** |
| RLS policy functions | **MANDATORY** |
| Form validation logic | **MANDATORY** |
| Multi-tenant filter logic | **MANDATORY** |
| Business calculations (grades, attendance %, etc.) | **MANDATORY** |
| UI pages and components | Optional (visual review still required) |
| Configuration | Optional (type-check sufficient) |
| One-line fixes | Judgment call |
| Prototype / spike code | Skip (must be thrown away before merge) |

Test runner: `npm test` (Vitest 3 + RTL + jsdom). Setup at `src/test/setup.ts`. Patterns in `src/test/roleManagerTabs.test.tsx`, `src/test/autoAssignment.test.ts`.

---

# Non-functional requirements

- **Mobile-first** — 360px minimum viewport
- **i18n** — Hindi + English minimum, build with i18n in mind
- **Encryption** — student sensitive data (PIN hashes, bank details) app-level, never plain text
- **Scale** — 500+ schools, multi-tenant via RLS + `school_id`

---

# Folder conventions

- Pages → `src/pages/`
- Components → `src/components/`
- Hooks → `src/hooks/`
- Supabase → `src/integrations/supabase/`
- DB types → `src/integrations/supabase/types.ts`
- Constants → `src/lib/`
- Subagent prompt templates → `src/agents/`
- Tests → `src/test/`
- Feature docs → `docs/{FEATURE}.md`
- Workflow artifacts → `docs/superpowers/specs/`, `docs/superpowers/plans/`

---

# §7 — Skills library (self-contained, no hook dependency)

### Project skills (`.claude/skills/`)
- **ui-ux-pro-max** — UI work, design system, accessibility. PRIMARY for any frontend task.

### Installed plugins (read-only cache)
- **superpowers/brainstorming** — design gate before creative work
- **superpowers/writing-plans** — 2-5 min step plans
- **superpowers/systematic-debugging** — 4-phase root-cause process
- **superpowers/verification-before-completion** — pre-commit evidence gate
- **superpowers/test-driven-development** — Iron Law TDD
- **superpowers/subagent-driven-development** — 3 templates copied to `src/agents/`
- **superpowers/finishing-a-development-branch** — 4-option merge menu (use `/finish`)
- **superpowers/dispatching-parallel-agents** — debug parallelization (niche)
- **karpathy-guidelines** — 4 LLM-craft principles (see §1)
- **frontend-design/frontend-design** — distinctive aesthetic. FALLBACK only — invoke when user explicitly asks for high-design / non-standard look.

### Project slash commands (`.claude/commands/`)
- **/brainstorm** — design spec gate (writes `docs/superpowers/specs/`)
- **/plan** — implementation plan (writes `docs/superpowers/plans/`)
- **/tdd** — red-green-refactor TDD cycle
- **/finish** — close feature branch
- **/reflect** — session lessons (writes `docs/LESSONS.md`)
- **/docs-check** — verify docs match code
- **/memory-save** — save to MEMORY.md
- **/graph-refresh** — refresh code-review-graph
- **/caveman-full** | **/caveman-lite** | **/caveman-off** — style toggle (user-level, lives in `~/`)

---

# Living memory

- **`docs/LESSONS.md`** — per-session lessons. Highest signal. Future Claude reads first.
- **`MEMORY.md`** — durable user/project facts (auto-memory).
- **`docs/INDEX.md`** — feature doc routing.
- **`docs/superpowers/specs/`** — brainstorm design outputs.
- **`docs/superpowers/plans/`** — implementation plan outputs.
- Run `/reflect` at the end of substantial sessions to propose updates.

---

# History

Git log is canonical. `CHANGELOG.md` for user-facing changes. Don't recap completed work in this file.
