# SHARP — School Management System

---

# ⚡ HARD RULES — NO OVERRIDE

## Tool priority (FIRST → LAST, fallback only)
1. **code-review-graph MCP** — `semantic_search_nodes`, `detect_changes`, `query_graph`, `get_impact_radius`
2. **Supabase MCP** — `list_tables`, `get_logs`, `get_advisors`, `apply_migration`
3. **Skills** — `ui-ux-pro-max` (UI), `deep-research` (web), `code-review` (PR), `verify` (run)
4. **Subagents** — `cavecrew-investigator` (locate), `cavecrew-builder` (1-2 file edit), `cavecrew-reviewer` (diff)
5. **Grep / Glob / Read** — only when graph/MCP don't cover it
6. **Bash** — last resort, prefer dedicated tools

## Response style
- Terse. Fragments OK. No filler. No hedging. No "I'd be happy to help"
- Code / commits / security warnings / destructive ops: write normal prose
- Drop articles in casual replies, keep them in specs

## Workflow gates
- Read `docs/INDEX.md` BEFORE any feature work
- Read `docs/PERMISSION_MATRIX.md` BEFORE any RLS or auth
- Read `src/integrations/supabase/types.ts` BEFORE any query
- Filter by `school_id` on EVERY multi-tenant query
- Use `academic_sessions` NOT `public.sessions`
- Reuse `src/components/` BEFORE creating new
- Subagent delegation for scope > 2 files

## Project identity
- Multi-school LMS, React + TypeScript + Vite + shadcn/ui + Supabase
- Roles: super_admin, principal, staff, student
- 3-tier subjects: school_subjects → subjects → section_subjects
- 6-digit PIN login, not password
- Student App ID: `SHARP-{YEAR}-{6_DIGIT}`

---

## What this app is
A multi-school LMS (Learning Management System) with role-based access.
Manages schools, academic sessions, classes, sections, subjects, staff and students.
Built with React + TypeScript + Vite + shadcn/ui + Supabase.

---

## DOCS-FIRST RULE — ALWAYS FOLLOW THIS

### Before ANY feature work
1. Check **docs/INDEX.md** — find the relevant doc for your task
2. Read that doc completely before writing any code
3. If spec is unclear → ask user to clarify → document the decision

### If feature has NO doc
→ Create the doc first, get user approval, THEN write code

### After ANY implementation
→ Verify behavior matches the doc
→ If you found a better approach → update the doc first, then implement

### Golden rule
**Code that contradicts docs = wrong code. Update the doc, then fix the code.**

---

## Docs — source of truth for all features

- docs/PRD.md                  → Full product requirements
- docs/PERMISSION_MATRIX.md    → Who can access what (read before ANY auth or RLS work)
- docs/SCREEN_FLOW_MAP.md      → Navigation logic and screen transitions
- docs/ONBOARDING.md           → Full onboarding specification

---

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite, shadcn/ui + Radix UI (in src/components/ui/), Tailwind CSS
- Lucide React (icons only), React Router DOM v6
- TanStack Query v5 (data fetch), React Hook Form + Zod (forms), Recharts (charts)
- Auth: AuthContext (src/contexts/AuthContext.tsx) — never call Supabase auth directly

### Backend
- Supabase: PostgreSQL, Auth, Storage, Edge Functions, Realtime
- Payments: Razorpay — Phase 2 only, do not implement now

### Mobile
- Flutter — Phase 2 only. Ignore for all current work.

---

## Roles — consider for every single feature
- super_admin  → Full access to all schools (src/pages/SuperAdmin.tsx)
- principal    → Manages one school only
- staff        → Teachers within a school
- student      → Learner within a school

Role is stored in profiles.role.
Always read docs/PERMISSION_MATRIX.md before writing any RLS policy or access-gated UI.

---

## Folder Conventions
Pages→src/pages/ | Components→src/components/ | Hooks→src/hooks/ | Supabase→src/integrations/supabase/ | DB Types→src/integrations/supabase/types.ts | Constants→src/lib/

## Key Existing Components — reuse, never rebuild
AuthContext | ProtectedRoute | AppShell | ChatModal/ChatWindow | SchoolSelection | shadcn primitives in src/components/ui/
Check src/components/ before creating anything new.

---

## UI Skill
Before building any page or UI component, always read:
  .claude/skills/ui-ux-pro-max/SKILL.md

This contains design system rules, component patterns and UX guidelines
specific to this project. Do not skip this step for any UI work.

---

## Non-Functional Requirements — enforced from day 1
- Mobile-first — 360px minimum viewport for all UI
- Hindi + English support minimum — build with i18n in mind from the start
- Student sensitive data (PIN hashes, bank details) must use app-level
  encryption — never store as plain text
- Scalable to 500+ schools — multi-tenant architecture via RLS + school_id

---

## Database — Supabase (MCP Connected)
Project ref: ndtqhschvnyloeccaelv

Claude has live schema access via MCP.
→ Always introspect live schema instead of relying on memory
→ Always reference src/integrations/supabase/types.ts before writing queries
→ After ANY schema change run:
   supabase gen types typescript --project-id ndtqhschvnyloeccaelv



### Multi-tenancy rule
school_id exists on almost every table.
EVERY query on school data MUST filter by school_id.
This is how SHARP isolates data between schools.

### Subject hierarchy — 3-tier, intentional
  school_subjects → subjects → section_subjects
1A-English and 1B-English are separate records. Always confirm which tier before writing queries.

### Known schema issue
public.sessions has Supabase auth columns mixed with LMS data.
→ Use academic_sessions for academic year/term logic
→ Never query public.sessions for academic data
→ Never modify public.sessions without asking first

### Database & Coding Rules
- Always TypeScript — never plain JS
- Never run destructive SQL without explicit confirmation
- Use /plan before touching more than 2 files at once
- Check existing components before creating anything new
- All DB queries MUST filter by school_id (multi-tenancy)
- Always add RLS when creating new tables
- Always read PERMISSION_MATRIX.md before writing RLS policies
- After schema change: `supabase gen types typescript --project-id ndtqhschvnyloeccaelv`
- Generate migration file → wait for approval → execute
- UUIDs for all primary keys, snake_case for all names


## Common Patterns — Use These
- Form validation: Zod schemas + React Hook Form
- Data fetching: TanStack Query v5 with school_id filter
- UI components: shadcn/ui primitives (src/components/ui/)
- Auth flow: AuthContext → never call Supabase auth directly
- Modals: Large dialog with tabs for multi-stage forms
- Tables: Sort + filter + bulk actions pattern

---

## Anti-Patterns — Never Do These
- Call Supabase auth directly → use AuthContext
- Create new components without checking src/components/ first
- Hardcode school_id values → use from auth context
- Query public.sessions for academic data → use academic_sessions
- Skip docs/INDEX.md before starting feature work
- Implement before documenting (for new features)
- Use `<Button onClick={asyncFn}>` for any mutation — must use `<SubmitButton>` from `src/components/ui/submit-button.tsx` or `useGuardedSubmit()` from `src/hooks/useGuardedSubmit.ts` (see `docs/SUBMIT_GUARD.md`)
- Skip `idempotency_key` in any write-edge-function request body — replay is mandatory (see `docs/SUBMIT_GUARD.md`)

---

## History
Git log is canonical. CHANGELOG.md for user-facing changes.
Don't recap completed work in this file.