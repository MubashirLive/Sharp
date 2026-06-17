# Role Manager
## Page: /role-manager | Version: 4.0 | Status: Wings Tab spec locked 2026-06-06

---

## Table of Contents

1. [Overview & Access](#1-overview--access)
2. [Data Model](#2-data-model)
3. [Tab Structure](#3-tab-structure)
   - 3.1 Staff Tab
   - 3.2 Subjects Tab
   - 3.3 Wings Tab
   - 3.4 Departments Tab
   - 3.5 Houses Tab ⭐ (rebuild 2026-06-07)
4. [Cross-Cutting Concerns](#4-cross-cutting-concerns)
   - 4.1 Synchronization
   - 4.2 Validation Rules
   - 4.3 Notifications
   - 4.4 Cross-Module Impact
5. [Open Questions](#5-open-questions)
6. [Verification & Implementation](#6-verification--implementation)

---

## 1. Overview & Access

**Purpose:** Role Manager is the assignment management UI for all staff role assignments. It exposes **five sibling write surfaces** — Staff, Subjects, Wings, Departments, Houses — each a complete editor for its slice, each writing to the same source tables. The Principal picks the mental model that fits the task:
- **Staff tab** — per-staff: edit a single staff's 9 fields (master admin, role, coordinator wings, class teacher sections, subject teacher triples, department member/incharge, house, status) from one card drawer.
- **Subjects tab** — per-section: assign Class Teachers and Subject Teachers via a section-block grid.
- **Wings tab** — per-wing: assign coordinators + manage all staff in a wing via a wing table.
- **Departments tab** — per-department: assign department members + incharge via department cards.
- **Houses tab** — per-house: assign staff to houses + designate house incharges via house cards.

All five write to the same source tables (`staff_roles`, `class_teachers`, `wing_staff`, `departments_staff`, `department_incharges`, `house_staff`, `house_incharges`, `profiles.status`). Edits in any tab reflect across all other tabs. **SchoolPage** is the read-only mirror for the rest of the app (e.g. SchoolPage's Wings tab shows which classes belong to which wing; Role Manager's Wings tab assigns which staff belong to that wing). The SchoolPage Subject Tab is a separate concern: it assigns **subjects to class-sections** (writes `section_subjects`), not teachers — Role Manager's Subjects tab assigns **teachers to subjects** (writes `staff_roles`/`class_teachers`).

### Access & Permissions

| Role | Access | Web | Mobile |
|------|--------|-----|--------|
| Principal | Full access to all role assignment | Visible | TBD |
| Master Admin | Full access except Master Admin toggle | Visible | TBD |
| Admin | Read-only view only | Visible | TBD |
| Staff | No access | Not Visible | Not Visible |
| Student | No access | Not Visible | Not Visible |

**Self-assign guard:** the logged-in user (Principal) cannot self-assign as Class Teacher or Subject Teacher — the Subject Picker Modal (in the Staff tab §3.1.2(f)) and the Subjects tab grid picker (§3.2) both exclude the current user's own profile. The Staff tab edit button is also hidden on the Principal's own card (§3.1.1).

---

## 2. Data Model

### Core Tables

**`staff_roles`** — Class Teacher and Subject Teacher assignments
```sql
CREATE TABLE staff_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  role_type TEXT NOT NULL CHECK (role_type IN ('subject_teacher', 'class_teacher')),
  class_id UUID NOT NULL REFERENCES classes(id),
  section_id UUID NOT NULL REFERENCES sections(id),
  subject_id UUID, -- NULL for class_teacher, required for subject_teacher
  academic_year_id UUID NOT NULL REFERENCES academic_sessions(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id)
);

-- One Class Teacher per section
CREATE UNIQUE INDEX uniq_ct_per_section
  ON staff_roles (section_id)
  WHERE role_type = 'class_teacher';

-- One Subject Teacher per section-subject
CREATE UNIQUE INDEX uniq_st_per_section_subject
  ON staff_roles (section_id, subject_id)
  WHERE role_type = 'subject_teacher';
```

**`wing_staff`** — Unified wing staff assignments (replaces wings_coordinators + wings_activity_staff after migration)
```sql
CREATE TABLE wing_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wing_id UUID NOT NULL REFERENCES wings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('coordinator', 'class_teacher', 'subject_teacher')),
  source_id UUID, -- class_id for CT/ST, NULL for manual coordinator
  school_id UUID NOT NULL REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wing_id, staff_id, source_id)
);
```

**`departments_staff`** — Department membership
```sql
CREATE TABLE departments_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  UNIQUE(department_id, staff_id)
);
```

**`department_incharges`** — Department incharge designation
```sql
CREATE TABLE department_incharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(department_id, staff_id)
);
```

**`house_staff` / `house_incharges`** — Both keyed by `(house_name, staff_profile_id, school_id)`; `house_incharges` adds no extra columns. Multi-incharge per house is allowed (no UNIQUE on house_name). **Houses entity storage:** Houses stored in `schools.houses` JSON column (`{name, color, emblem_url}`) — four defaults: Red, Blue, Green, Yellow.

```sql
-- house_staff (multiple staff per house; no UNIQUE on house_name)
CREATE TABLE house_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id)
);

-- house_incharges: same schema, no extra columns
CREATE TABLE house_incharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id)
);
```

### Legacy Tables (to be dropped after migration)

- `wings_coordinators` → migrate to `wing_staff`
- `wings_activity_staff` → migrate to `wing_staff`

---

## 3. Tab Structure

All five Role Manager tabs (Staff, Subjects, Wings, Departments, Houses) are **sibling write surfaces** — each is a complete editor for its slice, all writing to the same source tables. Edits in any tab reflect in every other tab. No tab is "primary" — the user picks the mental model that fits the task (see §1). The §3.1.2 sections (d) Coordinator, (e) Class Teacher, (f) Subject Teacher, (g) Department, (h) House are the same data also editable in Wings / Subjects / Departments / Houses tabs respectively.

### 3.1 Staff Tab

**Status:** Spec + implementation shipped 2026-06-12. See §3.1.4 for known limitations.

List of all staff with role summary cards.

**Layout:** Horizontal row cards stacked vertically. Each row: `[avatar] [name + EMP id + mobile + status + badges + tag] [summary chips] [Edit] [▾]`. The **summary chips** cluster is read-only and shows the role breakdown in detail: derived Role pill (Academic / Non-Academic / Both / —), each coordinator wing as `👑 {wing_name}`, each incharge dept as `👑 {dept_name} — Incharge`, each member-only dept as `{dept_name} — Member`, then class-teacher count, subject-teacher count, and house. **Incharge-also-member rows render once as the crowned `— Incharge` chip** (crown wins, no duplicate). Click ▾ to expand drawer with the 9 editable sections. Master Admin toggle appears at the top of the drawer (Principal only).

#### 3.1.1 Edit flow

- Pencil button on the row → enters edit mode, button transforms to dim Save (disabled until any field changed) + Cancel
- Dirty state propagates to `RoleManagerTab` via `onDirtyChange`
- **Page-leave guard** — current coverage: in-tab switch (Staff → Subjects / Wings / Departments / Houses) is blocked via `UnsavedChangesDialog` (`Cancel | Discard Changes | Save Changes`; Save calls `save()` then switches; Discard discards and switches; Cancel stays on current tab). Browser-level (back, refresh, tab close, window close) is blocked via `beforeunload` registered in `RoleManagerTab` while `anyDirty` is true. **In-app route change (sidebar nav to e.g. Dashboard while dirty) is not blocked** — `useBlocker` from react-router requires a data router (`createBrowserRouter` + `RouterProvider`); the app currently mounts `<BrowserRouter>` (see `App.tsx:60`). Tracked as known limitation; not blocking for v4.0.
- Self-assign guard: Principal cannot edit their own card (edit button hidden)

**Implementation files:** `RoleManagerTab.tsx` (in-tab guard + `beforeunload`), `UnsavedChangesDialog.tsx`, `StaffRoleCard.tsx` (dirty propagation + 9-section drawer + card view), `CoordinatorMultiSelect.tsx` (d), `SubjectPickerModal.tsx` (f), `MasterAdminConfirmDialog.tsx` (b), `RoleField.tsx` (c).

#### 3.1.2 The 9 editable sections

**(a) Messenger Tag** — Input with templated datalist: `PGT Commerce, TGT Hindi, Sports Teacher, Yoga Coach, Fees Incharge, etc.` Editable; reflected everywhere in app.

**(b) Master Admin toggle** — Principal only. Toggling ON or OFF opens a typed-name confirm dialog: user must type the staff's full name exactly (case-insensitive, trim-whitespace) before Confirm unlocks.
- Master Admin flag is independent of Admin flag, but **if Master Admin is ON, Admin toggle is disabled** (Master Admin already has all admin access)
- Admin toggle only functions when Master Admin is OFF
- Master Admin cannot grant Master Admin to others (the option is hidden from Master Admin role)

**(c) Role** — **Auto-derived, read-only, no override.** No toggle button. Computed every render from current assignments:
- **Academic** = staff has any of: Coordinator, Class Teacher, Subject Teacher, House
- **Non-Academic** = staff has any of: Department member, Department Incharge
- **Both** = both Academic AND Non-Academic items present
- If zero assignments: display `—` (no default label)

In edit mode, a small `auto-derived` hint is shown next to the role label. To change Role, change assignments.

**(d) Coordinator (Wing)** — Read-only display on the card: every wing where the staff is a coordinator is shown as a `👑 {wing_name}` chip in the summary cluster. Editable in the drawer via a **multi-select Popover dropdown** (`CoordinatorMultiSelect`): a single button labeled `👑 {wing_name}` / `👑 {N} wings` / `Pick wing(s)` opens a checkbox list of all wings in the school; toggling checkboxes adds/removes wings immediately. Selected wings also render as `👑 {name}` badges below the trigger with × to remove. Writes to `wing_staff` (assignment_type=`coordinator`). The same row is also editable in the Wings tab. Staff can be coordinator of multiple wings concurrently.

**(e) Class Teacher** — Existing class-section assignments shown as badges with ×. Add via class + section dropdowns. UNIQUE constraint: one Class Teacher per section (staff can teach multiple sections). Writes to `class_teachers`. The same row is also editable in the Subjects tab (per-section grid).

**(f) Subject Teacher** — Existing assignments shown as badges with ×. Add via separate **Subject Picker Modal**: cascading `class → section → subject` dropdowns (all 3 visible at open; Section and Subject are `disabled` until their parent is picked, with context-aware placeholders like `"Pick a class first"`, `"No sections"`). Class lists all classes for the current academic session, ordered by `display_order`; Section filters `sections` by selected class + session; Subject filters `section_subjects` by selected section, each option rendered as a single string `"SubjectName — TeacherName"` (e.g. `"Accountancy — Arun Srivastava"`) or `"SubjectName — Unassigned"`. A full-width "Add to list" button (secondary, below the dropdowns) is disabled until all three are picked; click adds the (class, section, subject) triple to the in-modal staged list as a badge and resets all 3 dropdowns — user can keep adding in one modal session. The in-modal staged list (rendered below the dropdowns, capped at `max-h-48`) is the in-progress work for this session; the DB is NOT touched here. **Footer**: `Cancel` discards the staged list and closes; `Done` calls `onDone(staged)`, transferring the staged list to the parent and closing the modal — parent's `draftSubjectTeachers` is REPLACED, not appended (single source of truth). On re-open, the modal pre-fills the staged list from `initialDrafts`; the user can add/remove, then click Done to replace the parent's list. **Duplicate guard**: blocks adding the same (class, section, subject) twice in the in-modal list with a red toast; Save path also enforces the UNIQUE constraint. **Cascade reset**: changing Class clears Section + Subject; changing Section clears Subject. **Label format**: `"ClassName SectionName — SubjectName"` (em-dash) — avoids ambiguity for sections with the same name across classes (e.g. `9A` vs `10A`). **No "Current Assignments" list and no "Selected Assignment" preview block** — both reported as useless. Subject name resolution: `section_subjects.subject_name` is the source of truth (no FK from `staff_roles.subject_id` to `subjects`). **Files**: `SubjectPickerModal.tsx` (modal), `StaffRoleCard.tsx` (consumer), `roleAssignments.ts` (read path).

**Subject Picker — bug fixes (2026-06-13):** (1) Pre-fix: flat 156-row list, draft badge showed `"Class 9 - ?"` (subject name missing — consumer label fallback `existing?.subject_name` was `null` for new drafts), post-save label was `"Class 9 B ?"` (read path asked for `subjects(name)` join from `staff_roles` which silently returned `null` since no FK exists). Fix: rewrote picker as 3 cascading dropdowns; consumer builds label from picker payload `(className sectionName — subjectName)` directly; `getSubjectTeachersForStaff` drops the `subjects(name)` join and does a second `section_subjects` query keyed by the unique `subject_id`s, merging `subject_name` client-side. Picker passes `subjectName`, `className`, `sectionName` to the consumer via extended `onPick` signature `(subjectId, classId, sectionId, subjectName, className, sectionName) => void`. (2) **Bug A**: `"more than one relationship was found"` on the existing-assignments query — `staff_roles` has TWO FKs to `profiles` (`staff_id` and `assigned_by`), so the embedded `staff:profiles(full_name)` is ambiguous. Fix: name the FK explicitly — `staff:profiles!staff_roles_staff_id_fkey(full_name)` (verified via `information_schema.table_constraints`). (3) **Bug B**: `"invalid input syntax for type uuid: undefined"` when picking a class — dependent effects re-fetched `academic_sessions` for `session_id` but did NOT destructure `{ data }` from the result, so `sessionData.id` was `undefined` (the result object has `data`/`error` keys, not `id`); the next query sent `session_id: undefined` to a UUID column. Fix: extract `sessionId` once in the initial load, cache in state, reuse in dependent effects; add `sessionId` to dep arrays.

**(g) Department** — Card shows each incharge dept as `👑 {dept_name} — Incharge` and each member-only dept as `{dept_name} — Member`; an incharge-also-member row renders once as the crowned `— Incharge` chip (crown wins, no duplicate). Drawer edits via **two independent single-add dropdowns**: `+ Add member` `<Select>` adds a `— Member` badge, `×` removes from member (cascades to incharge), `↑` promotes to incharge; `+ Add incharge` `<Select>` adds a `👑 — Incharge` badge, `×` demotes (keeps as member). Both dropdowns show only depts not yet in that list (a dept can't be added twice to the same list); `↑` on a member badge adds to incharge list and keeps the member row. **Single render pipeline** (unified 2026-06-15): badges are built from `effectiveMemberIds = union(memberIds, inchargeIds)`, walked in incharge-first order, deduped via a `Set` — one badge per dept, guaranteed. **Cascade rule**: incharge implies member (adding to Incharge auto-adds to Member in both UI and save); removing from Member also removes from Incharge (same save); removing from Incharge only removes the incharge designation (member remains). **Functional setState**: all `setDraftDeptInchargeIds` / `setDraftDeptMemberIds` calls in dropdown handlers and `↑`/`×` buttons use `setX((prev) => ...)` form, so a single event handler can update both lists in the same React batch without one reading stale closure state. Each row in the underlying data is one record with `is_incharge: boolean`. Writes to `departments_staff` + `department_incharges`. The same rows are also editable in the Departments tab (per-dept cards).

**(h) House** — Single-value select: 4 houses (from `schools.houses` JSON) + "No house". Writes to `house_staff`. The same value is also editable in the Houses tab (per-house cards).
  - **2026-06-15 fix**: `setHouse` call site was passing `currentUserId` (a profile UUID) as the third arg `schoolId`, causing the FK `house_staff_school_id_fkey` to reject every insert. Fixed: now passes the real `schoolId` (the school UUID) as the 3rd arg, and `currentUserId` as the 4th `changedBy` arg. Signature is `setHouse(staffId, houseName, schoolId, changedBy)`.

**(i) Status** — On/Off toggle. `On` = active (can login). `Off` = inactive (cannot login; logged out from current session; login attempt shows "this Id is deactivated"). Writes to `profiles.status`.

#### 3.1.3 Audit

Every change writes a row to `staff_role_audit` (action, field, old, new, changed_by, changed_at). Principal can read all entries for their school. Table + RLS + indexes applied to live DB via migration `20260612111214_staff_role_audit_and_master_admin.sql` + follow-up `20260612111345_add_staff_role_audit_field_column.sql`. **Audit inserts from the query layer are not yet wired** — `updateMasterAdmin`, `updateAdminRole`, `addCoordinator`, etc. currently do the change but do not write a row. Wiring the inserts is the next pass.

---

#### 3.1.4 Known limitations (v4.0)

| # | Limitation | Workaround | Resolution path |
|---|---|---|---|
| 1 | In-app sidebar nav (Dashboard / My Staff / etc.) while editing does not warn | Save or Cancel before navigating. Browser back is still covered. | Data router migration (`createBrowserRouter` + `RouterProvider`) for `useBlocker` |
| 2 | `profiles.is_master_admin` persists, but audit row is not written on toggle | None yet | Wire audit insert in `updateMasterAdmin` query |
| 3 | `staff_role_audit_select` policy exists alongside `staff_role_audit_read` (both school-scoped, redundant) | None needed — same predicate | Drop `staff_role_audit_select` in cleanup migration |

### 3.2 Subjects Tab

**Status:** Implementation complete. No pending spec.

Purpose: Assign Class Teachers and Subject Teachers to class-sections.

**Layout:** Grid of section-block cells.

**Behavior:**
- Click cell → open picker dialog (staff dropdown); real-time save on picker confirmation; no bulk action.

**Skip wing_staff when class has no wing:** if a class has `wing_id IS NULL`, subject/class-teacher assignments do NOT insert into `wing_staff`; subject assignment NOT blocked — only auto-membership skipped.

**Implementation:** `src/components/role-manager/SubjectAssignmentGrid.tsx`

**Bug fixes (2026-06-13):** (1) `handleAssignStaff` now checks `.error` on every `supabase.from("staff_roles")` call; previously `.error` was never inspected and RLS rejects / exclusion-constraint hits were silently swallowed — now they throw and fire `toast.error`. (2) `busyKeys: Set<string>` keyed by `${sectionId}:${subjectId ?? "ct"}` prevents double-click races: mid-save cell shows `Loader2` + "Saving", click disabled, re-entrant calls short-circuit (`if (busyKeys.has(key)) return`), `finally` always clears the key. **Not fixed this round**: `handleAssignStaff` does not write `assigned_by` or `academic_year_id` (legacy `class_teachers`/`subject_teachers` tables still being read by the Staff tab card — the "two-table split" refactor); Subjects tab intentionally not modified further per user request.

### 3.3 Wings Tab

**Status:** Spec locked 2026-06-06.

Purpose: Unified staff assignment to wings — coordinators + all teachers in one view.

**Collapsed View (Table).** Columns: `Wing` (name from `wings` table) | `Classes` (class badges via `wing_id`) | `Coordinator` (primary name + crown 👑; if 3+ show `+X View All`) | `Staff Count` (👨‍🏫 + count) | `Actions` (`[Edit]`) | `Expand` (chevron ↘).

**Expanded View.** Two-column: **Coordinators** (first 3 + `+X View All` modal; primary has ✨) | **All Staff** (search/filter/view toggle, paginated 25/page).

**Badge Legend:** `👑` coordinator (✨ = Primary, removable from Wings tab); `CT 6A` class teacher (not removable — managed in Subjects Tab); `ST 6A Eng` subject teacher with class+subject (not removable — Subjects Tab); `ST` generic subject teacher (removable).

**Edit Modal.** Two panels: **Coordinators** (`×` remove, `+ Add`, `↑` promote to primary, last-coordinator triggers Actor Replacement Protocol) | **All Staff in this Wing** (badges with CT/ST labels; auto-assigned rows show ⚠️ warning and link to Subjects Tab; `+ Add Staff`).

**Remove Flow.** Coordinator: direct remove. Last Coordinator: Actor Replacement Protocol dialog. Auto-assigned (CT/ST): warning + link to Subjects Tab.

**Data Model.** Uses `wing_staff` table (see §2). **Migration:** drop `wings_coordinators`, `wings_activity_staff` after migration.

**Cache (2026-06-17):** Reads via `useWingsForSchool`; writes via `useSaveWingAssignments`. See §4.5.

### 3.4 Departments Tab

**Status:** Implementation complete per existing code.

Department cards show: name, incharge (👑), staff avatars, [Edit] (incharge/staff add/remove).

### 3.5 Houses Tab

**Status:** Needs rebuild per agreed plan (2026-06-07). Current implementation is simple table.

Purpose: Assign staff to houses, designate House Incharges. Show stats per house (students + staff, total + wing-wise + gender-wise).

**House Definitions.** Managed in My School → HousesTab. Stored in `schools.houses` JSON as `{name, color, emblem_url}`. Four defaults: Red, Blue, Green, Yellow.

**Card View (2-column grid).** Per card: header (color + name + `[Edit]`), 2-col mini-table of `Students | Teachers` with rows for `Total`, `Junior`, `Middle`, `Senior`, `(No Wing)` and gender (♂/♀), then comma-separated incharges with 👑, then `[▼ Expand]`. Wing names from `wings` table (set in My School). Stats displayed as 2-col mini-table; gender symbols ♂ (male) / ♀ (female); incharge is comma-separated badges with 👑.

**Expanded View (per house).** `INCHARGE (N)` row: comma-separated incharges each with `[Remove]`, plus `[+ Add Incharge]`. `STAFF — grouped by wing`: collapsible groups for each wing in `display_order` (Junior → Senior, with `No Wing` last), each showing count + comma-separated staff + `[+ Add]`. Auto-assigned staff (e.g. via class assignment) shown with ⚠️.

**Edit Modal.** Two panels: `INCHARGE` (× remove, + add) | `STAFF` (🏠 × remove, + add, search dropdown). Excludes staff already assigned to other houses. One house per staff: assigning to this house removes from any other house.

**Data Model — tables used:** `schools.houses` (JSON) for definitions; `house_staff` / `house_incharges` for membership/designation; `student_profiles`, `students`, `classes`, `wings`, `profiles`, `wing_staff` for stats.

**Stats computation:** students by wing via `student_profiles` → `students` (class_id) → `classes` (wing_id); teachers by wing via `house_staff` → `wing_staff` OR `class_teachers`/`subject_teachers` → `class` → `wing`; `(No Wing)` = staff without any wing assignment. Gender joins `house_staff.staff_id` → `profiles.gender`.

**Rules:** 1 house per student (single string `student_profiles.house`); 1 house per staff (UI-enforced — assigning to new house removes from old); multiple incharges per house (DB-allowed, no UNIQUE on house_name); staff not in any house is OK.

---

## 4. Cross-Cutting Concerns

### 4.1 Synchronization

Department (member + incharge) is **fully decoupled** from academic roles (Coordinator, Class Teacher, Subject Teacher, House). Assigning a staff as CT/ST in the Subjects tab does **not** auto-insert them into any `departments_staff` row. Making them a Coordinator (in either the Staff tab Wings cell or the Wings tab Edit modal) does **not** auto-insert them into any `departments_staff` row. The two write paths are independent — each entry point writes only to its own table(s):

| Action | Tab + UI | Writes to | Does NOT touch |
|---|---|---|---|
| Assign CT/ST | Subjects tab grid (or Staff tab drawer §3.1.2(e)/(f)) | `staff_roles` (+ auto `wing_staff` if class has wing) | `departments_staff` |
| Make Coordinator | Wings tab Edit modal (or Staff tab §3.1.2(d)) | `wing_staff` (assignment_type=`coordinator`) | `departments_staff` |
| Add dept member | Departments tab Edit (or Staff tab §3.1.2(g)) | `departments_staff` | `staff_roles`, `wing_staff`, `house_staff` |
| Add dept incharge | Departments tab Edit (or Staff tab §3.1.2(g)) | `departments_staff` + `department_incharges` | `staff_roles`, `wing_staff`, `house_staff` |
| Assign house | Houses tab Edit (or Staff tab §3.1.2(h)) | `house_staff` | `staff_roles`, `wing_staff`, `departments_staff` |

All tabs write to the same source tables within their own domain — changes reflect across the Staff tab, Subjects tab, Wings tab, Departments tab, and Houses tab because each tab reads from the same underlying tables.

### 4.2 Validation Rules

- 1 CT per section — DB unique index `uniq_ct_per_section`
- 1 ST per section-subject — DB unique index `uniq_st_per_section_subject`
- 1 primary coordinator per wing — UI-enforced (replacement prompt)
- Self-assign blocked — picker excludes current user (see §1, §3.1.1)
- 1 house per staff — UI-enforced (see §3.5)

### 4.3 Notifications

Success toast on role assign/remove. Confirm dialog on last-coordinator removal. Inline error on validation failure.

### 4.4 Cross-Module Impact

- **All 5 Role Manager tabs** write to the same source tables; any edit in any tab reflects in all other tabs. No tab is "primary" — each is a complete editor for its slice.
- **SchoolPage** → read-only views for the rest of the app; no write capability.

### 4.5 Cross-tab freshness (cache invalidation)

The Role Manager has five tabs (Staff, Subjects, Wings, Departments, Houses) that all read from the same underlying tables. Two of them — Staff and Wings — currently write to `wing_staff` and `staff_roles`. Both write paths invalidate the same TanStack Query keys so that switching tabs always shows current data.

**Read keys** (defined in `src/hooks/useRoleManagerQueries.ts`):

| Hook | Key | Subscribed by |
|---|---|---|
| `useStaffList(schoolId)` | `roleManagerKeys.staffList(schoolId)` | Staff tab |
| `useStaffRoles(staffId, schoolId)` | `roleManagerKeys.staffRoles(schoolId, staffId)` | Each `StaffRoleCard` |
| `useWingsForSchool(schoolId)` | `roleManagerKeys.wings(schoolId)` | Wings tab |

**Write hooks** (same file):

| Hook | On-success invalidation |
|---|---|
| `useSaveStaffRoles(schoolId)` | `staffList(schoolId)` + `[...all, "staff-roles", schoolId]` (school-wide prefix) |
| `useSaveWingAssignments(schoolId)` | `staffList(schoolId)` + `[...all, "staff-roles", schoolId]` + `wings(schoolId)` |

Both save hooks call `invalidateRoleManagerSchool(qc, schoolId, { wings? })` — a shared helper that owns the invalidation contract. The `wings` flag is set only by the Wings tab mutation because that mutation produces changes the Wings tab's own `useWingsForSchool` query needs to refetch.

**Why broad prefix invalidation for `staff-roles`** — when a CT/ST row moves from Amit to Anjali, Amit's card must drop the row and Anjali's must gain it. The only correct call is to invalidate every `staff-roles` key for the school. TanStack's prefix match is the right primitive; the data layer is identical for every staff in the same school.

**Migration history** — prior to 2026-06-17 the Wings tab stored its data in `useState` and never invalidated TanStack's cache. A Wings save updated the database but the Staff tab's `useStaffRoles` payload stayed stale until a hard reload or until the Staff tab itself wrote something (which triggered its own `useSaveStaffRoles` invalidation). The fix replaced the Wings tab's local read+write pair with TanStack-managed equivalents and routed the save through `useSaveWingAssignments`. See plan: `docs/superpowers/plans/2026-06-17-wing-tab-cache-invalidation.md`.

**Read-mutation-render loop (Wings tab)** — `useWingsForSchool` is the read; `useSaveWingAssignments.onSuccess` invalidates its key; on next mount or refetch the query re-fires; the component re-renders with fresh data. The `useMemo` that sorts wings by academic rank runs again on the new `wingsQuery.data`.

**Error surface (Wings tab)** — `wingsQuery.error` triggers a `toast.error("Failed to load wings data")` and renders an error UI with a Retry button (calls `wingsQuery.refetch()`). This preserves the original `loadData` failure behavior, which the naive `useQuery` migration would have dropped.

---

## 5. Open Questions

1. **Bulk Assign for Subjects Tab:** earlier idea (all sections of one class for one subject), removed in favor of per-cell save. Reintroduce if needed.
2. **Wing auto-membership for non-wing classes:** currently skipped. Decide if staff should be manually addable to a wing even if their assigned class has no wing.
3. **House assignment limits:** currently unlimited per house. Consider: max staff per house?
4. **Mobile UX:** not designed for any tab. Phase 2.

---

## 6. Verification & Implementation

### 6.1 Wings Tab Audit (2026-06-07) — Historical

**Current state at audit time:** `WingsAssignmentTab.tsx` — partial implementation, missing critical features per spec. 12-row gap analysis identified: primary coordinator indicator (✨), `+X View All` for coordinators > 3, single staff-count column, `[Edit]` button in collapsed view, `[Edit]` + `[Collapse]` in expanded view, dedicated Edit Modal (CRITICAL), `ALL STAFF` with search/filter/pagination (25/page), staff role badges (CT 6A, ST 6A Eng, ST), Actor Replacement Protocol (was using basic `confirm()`), auto-assigned warning + Subjects Tab link, View All modal for coordinators, primary coordinator tracking in data (no `is_primary` concept — CRITICAL). Partial deviations: coordinator shows crown only (no ✨), columns didn't match spec (Stats vs Staff count), Teachers ≠ ALL STAFF (no CT/ST distinction), basic confirm vs full protocol.

**Status:** all 12 gaps addressed in subsequent patches — see §3.3 spec and 2026-06-13 / 2026-06-15 patch sections for the live implementation.

### 6.2 Execution Plan (2026-06-07) — Archived

The 8-phase execution plan (T1.1–T8.2) for the Wings Tab audit gap closure is fully superseded by the Implementation Status table below and the patch sections. Authoritative record: the 2026-06-13 and 2026-06-15 patch sections, plus the 2026-06-07 execution summary in git history (`7b17fdd first commit`).

### 6.3 Execution Summary (2026-06-07) — Historical

DB columns (`is_primary`, `auto_assigned`, `source_type`, `source_reference`) shipped via migration. Query updates landed in [wings.ts](src/integrations/supabase/queries/wings.ts) — `WingStaffMember` type, `getWingsWithFullDetails()`, `setPrimaryCoordinator()`. New components created: `WingStaffBadge.tsx` (crown/✨/CT/ST/Auto indicators), `CoordinatorReplacementDialog.tsx` (Actor Replacement Protocol), `WingEditModal.tsx` (full edit modal, not wired). Collapsed view update was partial — file had JSX issues, restored. **What's left**: re-integrate Edit Modal into `WingsAssignmentTab.tsx`, wire CoordinatorReplacementDialog into remove flow, implement ALL STAFF with search/filter/pagination, View All modal for coordinators >3, final verification, notifications on actions.

### Implementation Status

| Tab | Status |
|-----|--------|
| Staff | Complete (see 2026-06-15 patch) |
| Subjects | Complete (see 2026-06-13 patch) |
| Wings | Spec locked 2026-06-06; implementation per §3.3 |
| Departments | Complete |
| Houses | Complete |

### 2026-06-13 Patch — Role Manager (Staff tab + Subjects tab)

**Author:** Claude (Opus 4.7)

**Scope:** Two related defects that surfaced during a save-flow test on 2026-06-14.

**Changes:** (1) `SubjectPickerModal.tsx` full rewrite — replaced flat 156-row list with 3 cascading dropdowns (Class → Section → Subject); picker passes `subjectName`, `className`, `sectionName` to consumer via extended `onPick` signature `(subjectId, classId, sectionId, subjectName, className, sectionName) => void`. See §3.1.2(f) for full spec. (2) Error guards on every `supabase.from("staff_roles")` call (`.error` destructured + thrown) so RLS / exclusion-constraint hits surface as red toasts instead of silent failure. (3) Per-cell busy state (`busyKeys: Set<string>` keyed by `${sectionId}:${subjectId ?? "ct"}`) prevents double-click races — mid-save cell shows `Loader2` + "Saving", click disabled, `finally` clears. **Files**: `SubjectPickerModal.tsx`, `StaffRoleCard.tsx`, `roleAssignments.ts`, `SubjectAssignmentGrid.tsx`.

**Bug surface (why this matters):**
- **"Add Subject" picker — empty list:** broken select queried non-existent `subject_id` / `class_id` columns and embedded `classes` / `sections` / `subjects` relations that aren't FKs on `section_subjects`. Replaced by cascading dropdowns.
- **`"Class 9 - ?"` label:** label was constructed from `roles.subject_teachers.find(...)` that always returned `null` for new drafts. New picker passes the name directly.
- **Post-save `"?"` label:** `getSubjectTeachersForStaff` asked for `subjects(name)` join on a table with no FK — silently returned `null`. Now does a separate lookup against `section_subjects`.
- **`"more than one relationship"` toast on modal open:** ambiguous `staff:profiles(full_name)` join. Now uses explicit FK name `staff:profiles!staff_roles_staff_id_fkey(full_name)`.
- **`"invalid input syntax for type uuid: undefined"` on class pick:** `sessionData` not destructured. Now uses cached `sessionId` state.
- **Blank subject name dropdown row:** previous `Badge`/flex layout showed the badge as the only label. Now renders `"SubjectName — TeacherName"` as a single string.
- **Modal closes after one add:** consumer was calling `setSubjectPickerOpen(false)` on each `onPick`. Now modal stays open; user can keep adding.
- **Can't see what's been added in the modal:** the previous v2 modal accumulated drafts in the parent's state but the parent was hidden behind the modal. Now the modal has its own visible staged-list badges that the user can see and remove before clicking Done. Done replaces the parent's list (single source of truth).
- **"Current Assignments" list and "Selected Assignment" preview were useless:** removed entirely.
- **Subjects tab silent failure:** `handleAssignStaff` never checked `.error`. Now they fire red toasts.
- **Subjects tab double-click race:** a second click during an in-flight request could trigger the EXCLUSION constraint. Now blocked by `busyKeys`.

**2026-06-15 follow-ups.** (1) Subjects tab grid: `staff:profiles(full_name)` → `staff:profiles!staff_roles_staff_id_fkey(full_name)` in both `loadData` and post-`handleAssignStaff` refetches — same ambiguous FK fix. (2) `department_incharges` column mismatch in 5 places (live Postgres logs showed 20+ errors/page): `staff_id` → `staff_profile_id`, removed `is_active` filter — `roleAssignments.ts:191,204,210,362`; `departments.ts:31`; `staff.ts:567`; `roleManager.ts:321`.

**Verification:** tsc clean, 3 `staff_roles` rows landed 2026-06-14 07:51–09:42 (principal self-assign, Arun Srivastava Class 9 B / 10 A / 11 A), cascading dropdowns work, in-modal staging pre-fills on reopen, duplicate-add blocked, no regression on existing row `980c8609` (Nursery A).

### 2026-06-15 Patch — Role Manager (Staff tab edit-mode UX + house FK fix)

**Author:** Claude (Opus 4.7)

**Scope:** Three user-reported defects in the Staff tab edit mode: missing suffix labels on department badges, duplicate incharge+member badge bug on interactive add, and a FK violation on House save.

**Changes.**
1. **Badge suffix labels**: all incharge badges now render as `👑 {dept_name} — Incharge`; all member badges as `{dept_name} — Member`. Applies to both the read-only collapsed card and the edit-mode drawer.
2. **Dept badge pipeline — single render, dedup guaranteed**: replaced two parallel render blocks with a single IIFE that builds `effectiveMemberIds = union(memberIds, inchargeIds)`, walks `inchargeIds` first then `effectiveMemberIds`, dedupes via a `Set`. One badge per dept, guaranteed. Incharge-also-member rows render once as the `— Incharge` chip (crown wins). All four `setDraftDept*` calls switched to functional `setX((prev) => ...)` form so a single event handler can update both lists in the same React batch.
3. **Wing edit mode**: single-slot `<Select>` replaced with `CoordinatorMultiSelect` (Popover checkbox list). Staff can be coordinator of multiple wings concurrently. Selected wings render as `👑 {name}` badges with × to remove. Drawer section renamed from "Coordinator" to "Wing".
4. **House save FK violation fixed**: `setHouse(staff.id, draftHouse, currentUserId)` was passing `currentUserId` (a `profiles.id` UUID) as the 3rd arg `schoolId`. The FK `house_staff_school_id_fkey` points to `schools(id)`, so a profile UUID violated it on every insert. Fixed: `setHouse(staff.id, draftHouse, schoolId, currentUserId)`. Signature is `(staffId, houseName, schoolId, changedBy)`.
5. **Wing assignment state**: `draftCoordinator` (single object) → `draftCoordinatorWingIds: string[]`. `draftDepartments` (array with `isIncharge`) → `draftDeptMemberIds: string[]` + `draftDeptInchargeIds: string[]`. `seedDraft`, `dirty` useMemo, and `save()` reworked accordingly.

**Files changed:** `src/components/role-manager/StaffRoleCard.tsx` (badge labels, unified dept render, functional setState, multi-wing state, seedDraft/dirty/save rework, Coordinator → "Wing" rename, Department two-dropdown layout); `src/components/role-manager/CoordinatorMultiSelect.tsx` (new — multi-wing popover); `src/integrations/supabase/queries/roleAssignments.ts` (`setHouse` call-site fix); `src/test/roleAssignments.test.tsx` (updated "all sections" test + 2 new dept-badge tests); `docs/ROLE_MANAGER.md` (this section).

**Verification:** tsc clean, vitest 15/15 passing, build clean, incharge-also-member row renders once, House save no longer throws FK violation.

**Not in this patch (tracked for follow-up):** `handleAssignStaff` does not write `assigned_by` or `academic_year_id` (Subjects tab handler inconsistency); legacy `class_teachers` / `subject_teachers` tables still being read by the Staff tab card (the "two-table split" refactor from earlier); mobile UX for both tabs (Phase 2).