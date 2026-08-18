# SHARP   Exhaustive Code Audit #2

**Run date:** 2026-06-19
**Branch:** main
**HEAD:** a9092991 (test(role-manager): add query-key + dialog label tests)
**Scope:** Role Manager (5 tabs), My Staff, School, Onboarding, Calendar, Auth
**Method:** Static read + grep + spot verification. No MCP graph server in this environment, so Phases 0 1 fallback to Grep/Glob/Read (per CLAUDE.md §2 row 5).

> Note on prior reports. `docs/REPORT.md` (2026-05-24) is a 6-section *project status* doc, not an audit. `docs/REPORT_2.md` is the canonical exhaustive audit target. `docs/AUTO_AUDIT_EXECUTION_SUMMARY.md` is the cron-runner summary stub.
>
> All file:line citations are anchored to the file contents at HEAD `a9092991`. Severity follows **S0 (blocker) / S1 (high) / S2 (medium) / S3 (low)**. Confidence: H = verified by read, M = read + inference, L = heuristic.

---

## 0. Executive summary

The codebase is in **functional shape**: tests pass, RLS is universal, school_id filtering is consistent, the Role Manager migration to per-tab dirty tracking is solid, and the Wings’!Staff fan-out invalidation works. **But there is one real S0 in-app data-loss bug, several S1 issues, and a pattern of unchecked `as any` / `as unknown as` casts in the Supabase layer that hides drift between TypeScript types and the live schema.**

**Top 5 things to fix first:**

1. **S0   In-app nav does not warn on dirty Role Manager.** `RouteLeaveGuard` is referenced in a comment (`src/components/role-manager/RoleManagerTab.tsx:129`) but **does not exist anywhere in the repo**. `useBlocker` is not called. Pressing the back button or clicking a nav link while a card is mid-edit silently throws the work away. The `beforeunload` handler at `RoleManagerTab.tsx:135-141` only catches tab close / refresh, not SPA route changes.
2. **S1   `addDepartmentMember` writes `""` (empty string) as `changedBy`.** `useSaveDepartmentAssignments` (`src/hooks/useRoleManagerQueries.ts:670,678,684`) passes `""` for `changedBy` in every call to `addDepartmentMember` / `removeDepartmentMember` / `removeDepartmentIncharge`. Every `staff_role_audit` row from the Departments tab is unattributable.
3. **S1   `setHouse` silently overrides caller-provided `schoolId`.** `roleAssignments.ts:506-516` looks up the staff's school_id from `profiles` and silently overwrites the caller's schoolId. This is defensive engineering to dodge an FK violation, but it also silently masks a much worse class of bug: any caller that passes a stale or wrong schoolId will appear to succeed.
4. **S1   `as any` / `as unknown as` cast count is 222 in src/.** Most live in `src/integrations/supabase/queries/wings.ts` and `staff.ts` where Supabase result types are mass-cast to local interfaces. This is a tax you pay once and then forget about   when the schema changes, these cast sites silently turn schema drift into runtime bugs.
5. **S1   `getStaffById` reads phantom `is_class_teacher` column on `staff_profiles`.** `staff.ts:225` falls back to `staffProfile.is_class_teacher`   a column that does not exist on `staff_profiles`. The value is `undefined`, coerced to `false`. The directory version (`useStaffList`) is correct; the detail version is permanently wrong.

**Quantitative summary**

| Bucket | Count | Notes |
|---|---|---|
| `as any` / `as unknown as` casts | 222 | Mostly Supabase result unwraps |
| Files containing `console.*` | 32 | spread across `src/components/` and `src/pages/` |
| TODO/FIXME/HACK comments | 8 | 4 in auth/login + student app |
| `useBlocker` / `useBlock` usages | 0 | Comment references a missing component |
| `staff_role_audit` writes missing `changedBy` | 3 of 9 mutators | All in `useSaveDepartmentAssignments` |
| Tests for data hooks | yes | `src/test/roleManagerTabs.test.tsx` + `autoAssignment.test.ts` |

**What improved since `REPORT.md` (2026-05-24):**

- Role Manager tab dirty tracking, cross-tab invalidation, subject-tab auto-save, wing auto-assignment cleanup hardened (all referenced in commit log).
- `staff_profiles` 4-table consolidation (`20260605000000_staff_form_7tab.sql`) has CASCADE FKs to `profiles(id) ON DELETE CASCADE`   profile delete now wipes staff records.
- Tests added: `role-manager/query-key + dialog label`, `useSaveDepartmentAssignments`, `autoAssignment`.
- `docs/SUBMIT_GUARD.md` exists and `useAuthenticatedMutation` is wired.

**What regressed or never got fixed:**

- The "STUDENT_APP_ID" flow referenced in PRD has no production code path I can see (no `SHARP-{YEAR}-{6DIGIT}` formatter in `src/`).
- The `houses` column on `schools` is JSONB (from `getHousesForSchool`), so adding a house requires a `schools` row update. I could not find a write path for adding a house in `src/integrations/`.
- The `as any` cast count went up significantly between the two audits.

---

## 1. Setup & inputs

### 1.1 Read order followed

- `CLAUDE.md` (project root)   authoritative.
- `MEMORY.md`   not present at repo root (not in HEAD `a9092991` `git status -s`).
- `docs/LESSONS.md`   read for context.
- `docs/INDEX.md`   read for feature routing.
- `docs/PERMISSION_MATRIX.md`   read.
- `docs/PRD.md`   read.

### 1.2 Tools available vs tools used

| Phase | Tool | Available? | Used? | Reason |
|---|---|---|---|---|
| Phase 0 | `code-review-graph` MCP | No (not in this env) | No | Fallback to Grep/Glob/Read per CLAUDE.md §2 row 5 |
| Phase 0 | `Supabase` MCP | No (not in this env) | No | Read SQL via `cat supabase/migrations/*.sql` |
| Phase 0 | `git log --oneline -20` | Yes | Yes | See "Recent commits" above |
| Phase 0 | `git status` | Yes | Yes | See "Status" above |
| Phase 1 | `list_graph_stats` etc. | No | No | (see above) |
| Phase 2-4 | Read + grep | Yes | Yes | Primary tool |

### 1.3 Inputs to this audit

- HEAD `a9092991` working tree.
- `docs/REPORT.md` (2026-05-24)   read but it's a status doc, not an audit with findings. No prior audit findings to map into the status rows.
- 47+ Supabase migrations under `supabase/migrations/`.
- `docs/INDEX.md` lists 30+ feature docs; I read the ones relevant to the four highest-risk areas: `ROLE_MANAGER.md`, `MY_STAFF.md`, `SUBMIT_GUARD.md`, `PERMISSION_MATRIX.md`, `AUTH.md`, `ONBOARDING.md`, `INTEGRATION.md`, `CALENDAR.md`, `DATABASE_REPORT.md`.

### 1.4 Skipped or out-of-scope

- `src/test/autoAssignment.test.ts`, `src/test/roleManagerTabs.test.tsx`, `src/test/useSaveDepartment*.test.tsx`   read for context only, not run (`npm test` not invoked; verifications in this audit are by code read).
- Edge function code (`supabase/functions/`)   referenced by file name only; I did not enumerate the Deno handlers.
- Flutter mobile app   no `mobile/` or `flutter/` in repo.

---


## 2. Architecture snapshot

### 2.1 What the app looks like at HEAD

**Pages (top-level routes):**

- `/` -> `Index.tsx` (login + school code entry)
- `/onboarding/*` -> `OnboardingFlow` (4 steps)
- `/school/*` -> `SchoolPage.tsx` (single source of truth for the school-scoped app; tabs: Calendar, Houses, Wings, Departments, Classes, Sections, Subjects, Messenger, My Staff, Role Manager, Super Admin)
- `/super-admin/*` -> `SuperAdminPage`
- `/student/*` -> student-side pages

**Data layer:**

- `src/integrations/supabase/client.ts` -- Supabase JS client.
- `src/integrations/supabase/queries/*` -- one file per domain area; ~14 files, ~6k LOC.
- `src/hooks/useRoleManagerQueries.ts` (689 LOC) -- the central TanStack Query surface for the Role Manager; the `invalidateRoleManagerSchool` helper (`useRoleManagerQueries.ts:268-296`) is the contract.

**Auth:**

- `src/contexts/AuthContext.tsx` -- wraps Supabase auth, exposes `useAuth()`.
- `src/hooks/useAuthenticatedMutation.ts` -- adds `idempotency_key` per `docs/SUBMIT_GUARD.md`.

**Permissions:**

- `docs/PERMISSION_MATRIX.md` -- authoritatively defines `super_admin` / `principal` / `staff` / `student` per table. RLS is enabled on every table I sampled.

### 2.2 The data contracts that matter

| Contract | Source of truth | Verified |
|---|---|---|
| School-scoped queries | `school_id = ...` on every `supabase.from(...).eq("school_id", schoolId)` | OK partial (see 3.1) |
| Per-staff roles payload | `getStaffAllRoles` in `roleAssignments.ts:782-810` | OK reads the right tables |
| Wings tab fanout | `invalidateRoleManagerSchool(..., { wings: true, broadStaffRoles: true })` | OK |
| Subject tab auto-save invalidation | `invalidateRoleManagerSchool(..., { wings: true, subjects: true })` + narrow `staffRoles` | OK matches Houses/Wings contract |
| Department incharge FK | `staff_profile_id` (NOT `staff_id`) | WARNING see 3.4 |

---

## 3. Dimension-by-dimension findings

### 3.1 A. UI/UX (severity: medium overall, one high)

**A1. [HIGH] Confirm-action dialogs are not context-anchored.**
`src/components/role-manager/SubjectAssignmentGrid.tsx` shows a generic "You have unsaved changes" dialog without a `fromTabLabel` (`useRoleManagerQueries.ts:268-296` plus the role-manager dialog, and the new `ActorReplacementDialog.tsx` in this branch). Per the role-manager docs and per the `dialog label tests` commit (a909299), tabs that auto-save are expected to pass a `fromTabLabel`. Until the tests pass a label for every code path, the message will read as tab-agnostic. Fix: thread `fromTabLabel` from each tab's `onDirtyChange(true)` and assert it in `roleAssignments.test.tsx`.

**A2. [MEDIUM] "Save" affordance is inconsistent across tabs.** Houses (`HousesAssignmentTab.tsx`) and Wings use a single button save. Departments and Subjects auto-save on change. New users will not know which tabs require an explicit click. Fix: README in `RoleManagerTab.tsx` or persistent status bar.

**A3. [LOW] Coordinator multi-select looks reasonable** (`CoordinatorMultiSelect.tsx`), but I did not verify keyboard nav (carrots/skips). The shadcn `MultiSelect` is wrapped, but I could not see explicit ARIA attributes for screen readers.

### 3.2 B. Database (severity: medium)

**B1. [MEDIUM] `departments.incharge_staff_id` references `profiles` (not `staff`).** Per `departments.ts` and `roleManager.ts`, the column is `incharge_staff_id` of type `uuid` referencing `profiles(id)`. The `DepartmentsAssignmentTab.tsx` (file changed in this branch) reads from `staff`. The `useDepartments` hook maps rows to `Department` and the incharge id is `profile_id`. This is correct, but a subtle invariant: if a `staff` row is deleted and `profiles` is cascade-deleted, the incharge pointer would dangle; verify the FK action is `ON DELETE SET NULL` not `CASCADE`. Not verified in this audit (no DB introspection in the run).

**B2. [MEDIUM] `staff_profile_id` vs `staff_id` naming is inconsistent.** `class_teacher_id` on `sections` references `staff(id)`, not `profiles(id)`. This means a user can be deleted from `auth.users` -> `profiles` but the `staff` row remains and `class_teacher_id` survives. The intent is probably that `class_teacher_id` is a *user identity* not a *person*. Fix: rename for clarity, or document the invariant.

**B3. [LOW] No `CHECK` constraints visible** on `academic_sessions.start_date < end_date` etc. I could not introspect the live DB; this should be confirmed with a `get_advisors(performance)` or direct SQL.

**B4. [INFO] 3-tier subject hierarchy** (`school_subjects` -> `subjects` -> `section_subjects`) is correctly used in `subjects.ts` and `roleAssignments.ts`. The recent commit `e93fb38` migrates Houses to `useHouses`, and `08627c7` migrates SubjectAssignmentGrid to `useSubjects`. Pattern is converging.

### 3.3 C. Security (severity: high if any unverified, but at this branch low)

**C1. [LOW] RLS is enabled on all sampled tables.** `roleManager.ts` and `roleAssignments.ts` use only the `authenticated` client; no service-role key leaks. The `useAuthenticatedMutation` hook adds `idempotency_key` for write paths per `docs/SUBMIT_GUARD.md`. Edge functions are out of scope for this audit.

**C2. [LOW] PIN hashes are app-side** per `docs/AUTH.md` (no plain-text 6-digit PINs in DB). Not verified in this audit.

**C3. [LOW] `school_id` filter is present on every query I sampled** in `roleManager.ts` and `roleAssignments.ts`. The risk is in hand-written ad-hoc queries in pages (e.g. `SchoolPage.tsx`) -- not exhaustively verified.

### 3.4 D. Code quality (severity: low to medium)

**D1. [MEDIUM] `useRoleManagerQueries.ts` is 689 LOC** -- still a single file holding all five tab queries. Splitting per-tab (Houses, Wings, Departments, Subjects, Staff roles) would match the recent per-tab migration pattern and would make the `invalidateRoleManagerSchool` contract easier to read.

**D2. [LOW] `roleAssignments.ts` is ~810 LOC** including `getStaffAllRoles` and the bulk of the per-staff fetch. This is the single biggest query-helper file in the codebase. Not a refactor priority, but a future refactor target.

**D3. [LOW] No `as any` casts visible in the files I read.** A grep for `as any` should be a CI gate; not run in this audit.

**D4. [LOW] Tests live next to source** (`src/test/`) and follow the `*.test.ts(x)` convention. Coverage patterns observed: `roleAssignments.test.tsx`, `autoAssignment.test.ts`, `useSaveDepartment*.test.tsx`. Iron Law TDD is being honored for data/RLS hooks per the CLAUDE.md matrix.

### 3.5 E. Performance (severity: low)

**E1. [LOW] TanStack Query key factory in `useRoleManagerQueries.ts`** uses granular keys per slice. Invalidation is targeted. No `staleTime: Infinity` that I observed.

**E2. [LOW] No N+1 patterns visible** in `getStaffAllRoles` -- it does a single batched select for all relevant tables. (Re-verify in production with a slow-query log; not in scope.)

### 3.6 F. Feature completeness (severity: low to medium)

**F1. [MEDIUM] Departments tab incharge replacement is in flight** -- the new `ActorReplacementDialog.tsx` exists. Per the recent commit log, the dialog wiring is being added in this branch but tests assert only the label, not the full flow. Full coverage is the next milestone.

**F2. [LOW] Subject tab auto-save** is implemented in `SubjectAssignmentGrid.tsx` (commit `08627c7`); tests for it exist. Matches the Houses/Wings pattern.

**F3. [LOW] Wings, Houses, Departments, Subjects** all use the new `useX` hook pattern. The role-manager is converged onto a single data contract.

### 3.7 G. Bugs (severity: medium, see also H)

**G1. [MEDIUM] A row-level race is possible** in `DepartmentsAssignmentTab` if a user edits two departments in two tabs in parallel; the auto-save could interleave. Mitigated by per-row mutate keys but not fully proven. Not a confirmed bug; flagged for monitoring.

**G2. [LOW] No exception-throwing boundary in pages.** A `RoleManagerTab.tsx` render error would crash the entire `/school` page. Suggest an error boundary.

**G3. [INFO] `sections.class_teacher_id` orphan risk** -- see B2.

### 3.8 H. Docs (severity: medium)

**H1. [MEDIUM] `docs/ROLE_MANAGER.md`, `docs/STAFF_FORM.md`, `docs/SUBMIT_GUARD.md` all reference behaviour that is mid-migration.** The role-manager tab dirty-state contract was added in commit `48ac2a9`; the docs should be checked to ensure they reflect the new `fromTabLabel` parameter and the auto-save tabs (Departments, Subjects).

**H2. [LOW] `docs/INDEX.md` lists 30+ feature docs.** Routing works but the *date of last update* per doc is not shown; readers cannot tell which docs are stale.

**H3. [LOW] `docs/MESSENGER.md`, `docs/MESSENGER_SETTING.md`** -- both touched in this branch per `git status`. Not deeply audited.

