# Lessons — SHARP Project

> Living log of lessons learned per session. Future Claude reads this FIRST (after `CLAUDE.md` and `MEMORY.md`).
> Append via `/reflect` slash command. Each entry is one rule + one reason. Keep entries short.

## Format

```
## YYYY-MM-DD — [slug]

**Rule:** [one sentence]
**Why:** [bug or wasted time this prevents]
**Example:** [one short code/ref snippet if relevant]
**Applies to:** [ui | rls | queries | forms | planning | subagents | docs]
```

---

## 2026-06-18 — Karpathy merged into CLAUDE.md

**Rule:** Always read `~/.claude/plugins/cache/karpathy-skills/andrej-karpathy-skills/1.0.0/skills/karpathy-guidelines/SKILL.md` before any non-trivial code task.
**Why:** 4 principles (think / simplicity / surgical / goal-driven) prevent the 4 most common LLM coding mistakes — wrong assumptions, overcomplication, orthogonal edits, unverifiable success.
**Applies to:** planning, code, refactor

## 2026-06-18 — Use general-purpose Agent, not cavecrew-*

**Rule:** The old `cavecrew-investigator` / `cavecrew-builder` / `cavecrew-reviewer` subagent names do not exist in this install. Use `Agent` with `subagent_type="general-purpose"` and a graph-first scout step instead.
**Why:** Old CLAUDE.md referenced agents that were never installed; Claude would invent behavior or skip the step.
**Applies to:** subagents, planning

## 2026-06-18 — Two-store bug in role manager

**Rule:** When two unrelated `useState` stores hold overlapping domain data, convert both to TanStack Query hooks with a shared key factory and invalidate both keys atomically on mutation success.
**Why:** Independent fetches drift between save and read; hard refresh hides the bug; RLS-correct DB looks wrong on UI. Bug: class teacher reassign showed both old + new as class teachers.
**Example:** See [docs/superpowers/plans/2026-06-17-wing-tab-cache-invalidation.md](superpowers/plans/2026-06-17-wing-tab-cache-invalidation.md)
**Applies to:** react, queries, state

## 2026-06-18 — Title Case normalization needs 3 layers

**Rule:** Name normalization (subjects, houses, departments, wings) must run in 3 places: Zod transform (UX), DB trigger (truth), and `src/lib/text-utils.ts` utility (bulk imports).
**Why:** Single-layer normalizes break when one path is skipped; users see inconsistent capitalization; searches miss; duplicates appear.
**Applies to:** forms, db, bulk imports

## 2026-06-18 — TDD scope: data/RLS yes, UI no

**Rule:** TDD Iron Law is mandatory for data hooks, Supabase queries, RLS, form validation, multi-tenant filtering, business logic. Optional for UI components, config, one-line fixes.
**Why:** Strict TDD on UI prototypes fights the medium; tests on data logic catch the bugs that hit production (school_id leaks, RLS gaps, validation holes).
**Applies to:** all code, but test-discipline choice per code type

## 2026-06-18 — Subagent templates live at src/agents/, not the plugin cache

**Rule:** The 3 superpowers subagent prompt templates (`implementer`, `spec-reviewer`, `code-quality-reviewer`) are copied to `src/agents/`. SHARP-specific additions are appended (school_id filter, no public.sessions, AuthContext, etc.). Edit the SHARP copies, not the plugin cache.
**Why:** Plugin cache is read-only convention; SHARP needs project-specific context injected into every dispatch. Keeping copies in repo = single source of truth + audit trail.
**Applies to:** subagents, code review

## 2026-06-18 — Skills list mirrored in CLAUDE.md, not hook-dependent

**Rule:** CLAUDE.md §7 lists every available skill (project + plugins). Don't rely on the superpowers SessionStart hook to surface skills — read CLAUDE.md first, §7 is self-contained.
**Why:** Hook injection order is brittle across versions; CLAUDE.md is the authoritative source per our own precedence rule.
**Applies to:** planning, future Claude sessions

## 2026-06-19 — Per-card edit pattern across role-manager tabs

**Rule:** All five Role Manager tabs (Staff, Subjects, Wings, Departments, Houses) must follow the same per-card edit contract: one card in edit mode at a time, internal draft state, `[Edit] → [Cancel] / [Save Changes]` footer, `onDirtyChange` bubble to parent, `onAttemptSave` callback for cross-cutting gates (Actor Replacement, Move Prompt), parent owns the mutation + cache invalidation. Page-level `isEditing` toggles that open all cards at once are a smell — replace with `editingEntityId: string | null` + `isOtherCardBeingEdited` gate.
**Why:** Diverging patterns make cross-tab sync + dirty tracking fragile; the user mentally models the tabs as siblings, not as one batch editor. Wings/Departments/Houses already converged on this; Staff tab is the exception (per-staff drawer, not per-card grid).
**Applies to:** ui, planning, refactor

## 2026-06-19 — DB-enforced constraints still need UI confirmation gates

**Rule:** When the DB enforces a constraint atomically (e.g. `assignStaffToHouse` pre-deletes the existing `house_staff` row to enforce one-house-per-staff), the UI MUST still surface a confirmation dialog before the save fires. "The DB handles it" is not a reason to skip the prompt.
**Why:** Silent atomic moves break user trust — they expect "Add Staff" to add, not move. `docs/HOUSE.md §7.1` requires the explicit confirm. Pattern: detect the constraint-violating case in the parent, open a dialog listing every affected row, only fire the mutation on confirm.
**Applies to:** ui, forms, db

## 2026-06-19 — "Sync between tabs" means cache invalidation, not event bus

**Rule:** When a user asks "how does tab X sync with tab Y", do NOT propose an event bus, shared Zustand store, or pub/sub layer. In this codebase, "sync" = `useSave*Assignments` mutation's `onSuccess` calls `invalidateRoleManagerSchool(qc, schoolId, { broadStaffRoles: true })` which fans out `staffList` + the school-wide `staff-roles` prefix. The Staff tab card's `useStaffRoles` refetches; the chip updates on next mount/refetch. Tab-switch re-mounts the new tab which re-fetches.
**Why:** Users and Claude both over-engineer "sync" as a real-time event system. The TanStack Query key factory + mutation's invalidation contract is the sync surface. Adding any other mechanism is duplicate work + drift risk.
**Applies to:** planning, queries, refactor

## 2026-06-19 — One-house-per-staff means one row total, not "one row except target"

**Rule:** When enforcing "X per Y" in the DB via pre-delete + insert, the pre-delete must clear EVERY existing row for the (X-key, Y-scope) tuple — not "all rows except the target". A `.neq(target_column, target_value)` clause leaves stale rows in the target slot and the subsequent insert hits the UNIQUE constraint.
**Why:** Bug: `assignStaffToHouse(houseName, staffId)` had `delete().neq(house_name, houseName)` which left a stale `house_staff` row in the target house in place. The next `insert` then threw `duplicate key value violates unique constraint "house_staff_house_name_staff_profile_id_key"`. Fix: drop the `.neq()` — one row total per (staff, school). Test: `src/test/assignStaffToHouse.test.ts` asserts `deleteNeq` is never called.
**Applies to:** queries, db

## 2026-06-19 — ON CONFLICT spec must match an actual UNIQUE constraint

**Rule:** `supabase.from(...).upsert(row, { onConflict: "col1,col2,col3" })` requires the named columns to form an actual UNIQUE constraint or unique index on the table. If the table has `UNIQUE(col1, col2)` (2-column), a 3-column `onConflict` spec fails with "there is no unique or exclusion constraint matching the ON CONFLICT specification". Read the DDL first.
**Why:** Bug: `setHouseIncharge` upserted with `onConflict: "house_name,staff_profile_id,school_id"` but `house_incharges` has `UNIQUE(house_name, school_id)` (single incharge per house, not per (house, staff)). Fix: pre-delete + insert (matches `assignStaffToHouse` post-hotfix-1). Test: `src/test/setHouseIncharge.test.ts` asserts no upsert call.
**Applies to:** queries, db

## 2026-06-19 — Reset semantics must match the spec, not just the visible state

**Rule:** When a "reset" action appears in the UI, the data layer must drop EVERY dependent row — not just the visible state of the entity itself. Spec drift: docs say "reset clears staff assignments", code only renames + clears emblem.
**Why:** Bug: `HousesTab.tsx` `handleConfirmReset` renamed the house and cleared the emblem but left `house_staff` / `house_incharges` rows in place. A staff assigned to "Devil" (renamed from Red) stayed attached to the slot after reset to default (Red). Fix: `clearHouseAssignments(houseName, schoolId)` helper called BEFORE the rename so rows keyed to the OLD name are matched. Test: `src/test/clearHouseAssignments.test.ts` asserts both tables are touched.
**Applies to:** ui, queries, db

## 2026-06-19 — Sibling surface must share the same TanStack Query key

**Rule:** Any component that writes to a table must also READ from the same `useQuery` key the rest of the app uses. A sibling surface that does its own `useEffect` + `useState` + raw `supabase.from(...)` fetch will silently bypass all cache invalidation — invalidating the right key does nothing because nothing subscribes. Symptom: "save works in tab A, but tab B keeps stale data until F5".
**Why:** Bug: MySchool `DepartmentsTab.tsx` read departments via a one-shot `getDepartmentsWithDetails` + `useState`. Role Manager invalidation fired correctly, but MySchool never saw the update. Fix: replace with `useDepartments(schoolId)` from `useRoleManagerQueries` so both surfaces share `roleManagerKeys.departments(schoolId)`. For surfaces that write to the same tables from outside the role-manager React subtree, expose `useInvalidateRoleManagerSchool` as a thin bridge — pattern in `useRoleManagerQueries.ts`.
**Applies to:** react, queries, ui, refactor

## 2026-06-19 — Pass business keys to mutators, never row ids

**Rule:** When a helper takes `(rowId, other_args)` but the underlying query filter is on a different column (e.g. `(staff_profile_id, department_id)`), pass the BUSINESS KEYS — never the junction-table row id. A mismatched arg silently matches zero rows, the delete appears to succeed, and the chip "reappears" on next load.
**Why:** Bug: `useSaveStaffRoles` was passing `id` (the `department_staff` row UUID) as the first arg to `removeDepartmentMember` / `removeDepartmentIncharge`, which filter on `(staff_profile_id, department_id)`. The delete matched 0 rows; Supabase reported success; on next refetch the membership was still there. Fix: callers pass `staffId, deptId, schoolId, changedBy` — the same keys the read path uses. Test: `src/test/useSaveStaffRolesDepartments.test.ts` pins the call signature with `expect(removeDepartmentMember).toHaveBeenCalledWith("staff-C", "dept-3", "school-1", "user-X")`.
**Applies to:** queries, db, refactor

## 2026-06-19 — Two tables tracking the same relationship collapse to one + flag

**Rule:** When two tables both link the same A→B relationship (e.g. `department_staff` for membership, `department_incharges` for incharge designation), collapse to one table with a boolean flag. The two-table split causes silent no-op writes, RLS gaps, and dual-cache drift.
**Why:** `department_incharges` was a parallel table that could (and did) drift from `department_staff`. A row could be an incharge but not a member — a state the spec doesn't allow. Single table + `is_incharge` makes "incharge implies member" structurally true at the DB level. Migration: add column with `DEFAULT false`, backfill from the dropped table, `DROP TABLE ... CASCADE`, add partial index for the boolean-flag read path. Test: `src/test/departmentInchargesCollapse.test.ts`.
**Applies to:** db, schema, queries
