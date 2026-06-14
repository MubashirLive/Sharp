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

**Purpose:** Role Manager is the sole write interface for all staff role assignments. All staff-to-role mappings are managed here. SchoolPage tabs (Wings, Departments, Houses) become read-only entity management only.

**What lives in Role Manager:**
- Staff role summary (Master Admin, Admin flags)
- Subject Teacher assignment (class-section-subject)
- Class Teacher assignment (class-section)
- Coordinator → Wing assignment
- Department membership + Incharge
- House assignment + House Incharge

**What lives elsewhere (read-only mirrors):**
- SchoolPage → Wings Tab: wing class groupings + read-only staff display
- SchoolPage → Department Tab: departments, reads staff from Role Manager
- SchoolPage → House Tab: houses, reads staff from Role Manager
- SchoolPage → Subject Tab: assigns subjects to class-sections (section_subjects), not teachers

**Key distinction:**
- Subject-tab (SchoolPage): assigns SUBJECTS to CLASS-SECTIONS (section_subjects)
- Role Manager Subjects tab: assigns TEACHERS to SUBJECTS (staff_roles)

### Access & Permissions

| Role | Access | Web | Mobile |
|------|--------|-----|--------|
| Principal | Full access to all role assignment | Visible | TBD |
| Master Admin | Full access except Master Admin toggle | Visible | TBD |
| Admin | Read-only view only | Visible | TBD |
| Staff | No access | Not Visible | Not Visible |
| Student | No access | Not Visible | Not Visible |

**Self-assign guard:** The logged-in user (Principal) cannot self-assign as Class Teacher or Subject Teacher via the picker. The picker excludes the current user's own profile.

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

**`house_staff`** — House membership (multiple staff per house allowed)
```sql
CREATE TABLE house_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id)
);
```

**`house_incharges`** — House incharge designation (multiple incharges per house allowed)
```sql
CREATE TABLE house_incharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id)
);
```

**Houses entity storage:** Houses stored in `schools.houses` JSON column. Each entry: `{name, color, emblem_url}`. Four defaults: Red, Blue, Green, Yellow.

### Legacy Tables (to be dropped after migration)

- `wings_coordinators` → migrate to `wing_staff`
- `wings_activity_staff` → migrate to `wing_staff`

---

## 3. Tab Structure

### 3.1 Staff Tab

**Status:** Spec + implementation shipped 2026-06-12. See §3.1.4 for known limitations.

List of all staff with role summary cards.

**Layout:** Horizontal row cards stacked vertically. Each row: `[avatar] [name + EMP id + mobile + status + badges + tag] [summary chips] [Edit] [▾]`. The **summary chips** cluster is read-only and shows the role breakdown in detail: derived Role pill (Academic / Non-Academic / Both / —), each coordinator wing as `👑 {wing_name}`, each incharge dept as `👑 {dept_name}`, each member dept as `{dept_name}`, then class-teacher count, subject-teacher count, and house. Click ▾ to expand drawer with the 9 editable sections. Master Admin toggle appears at the top of the drawer (Principal only).

#### 3.1.1 Edit flow

- Pencil button on the row → enters edit mode, button transforms to dim Save (disabled until any field changed) + Cancel
- Dirty state propagates to `RoleManagerTab` via `onDirtyChange`
- **Page-leave guard** — current coverage:
  - ✅ **In-tab switch** (Staff → Subjects / Wings / Departments / Houses): blocked. `UnsavedChangesDialog` with `Cancel | Discard Changes | Save Changes` (Save calls `save()` then switches; Discard discards and switches; Cancel stays on current tab).
  - ✅ **Browser-level** (back, refresh, tab close, window close): blocked via `beforeunload` listener registered in `RoleManagerTab` while `anyDirty` is true.
  - ❌ **In-app route change** (clicking a sidebar nav link to e.g. Dashboard while dirty): **not blocked.** `useBlocker` from react-router requires a data router (`createBrowserRouter` + `RouterProvider`); the app currently mounts `<BrowserRouter>` (see `App.tsx:60`), which is a non-data router. Full coverage of this case requires migrating the router to a data router. Tracked as known limitation; not blocking for v4.0.
- Self-assign guard: Principal cannot edit their own card (edit button hidden)

**Implementation:**
- `src/components/role-manager/RoleManagerTab.tsx` — in-tab guard + `beforeunload`.
- `src/components/role-manager/UnsavedChangesDialog.tsx` — dialog component.
- `src/components/role-manager/StaffRoleCard.tsx` — dirty propagation via `onDirtyChange`; 9-section drawer (see §3.1.2); card view (read-only summary chips).
- `src/components/role-manager/CoordinatorMultiSelect.tsx` — multi-wing popover dropdown for the (d) Coordinator section.
- `src/components/role-manager/SubjectPickerModal.tsx` — class→section→subject picker for the (f) Subject Teacher section.
- `src/components/role-manager/MasterAdminConfirmDialog.tsx` — typed-name gate for the (b) Master Admin toggle.
- `src/components/role-manager/RoleField.tsx` — derived-role pill for the (c) Role section.

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

**(d) Coordinator (Wing)** — Read-only display on the card: every wing where the staff is a coordinator is shown as a `👑 {wing_name}` chip in the summary cluster. Editable in the drawer via a **multi-select Popover dropdown** (`CoordinatorMultiSelect`): a single button labeled `👑 {wing_name}` / `👑 {N} wings` / `Pick wing(s)` opens a checkbox list of all wings in the school; toggling checkboxes adds/removes wings immediately. Selected wings also render as `👑 {name}` badges below the trigger with × to remove. Writes to `wing_staff` (assignment_type=`coordinator`); reflects in Wings tab. Staff can be coordinator of multiple wings concurrently.

**(e) Class Teacher** — Existing class-section assignments shown as badges with ×. Add via class + section dropdowns. UNIQUE constraint: one Class Teacher per section (staff can teach multiple sections). Writes to `class_teachers`; reflects in Subjects tab.

**(f) Subject Teacher** — Existing assignments shown as badges with ×. Add via separate **Subject Picker Modal**: cascading `class → section → subject` dropdowns. Last subject dropdown shows the currently assigned teacher's name (or blank if unassigned). Add button places draft badge; persisted on Save. Writes to `staff_roles`; reflects in Subjects tab.

**Subject Picker Modal — implementation (2026-06-13):**
- **Three cascading dropdowns** in order: Class → Section → Subject. Each dropdown enables only when its parent is selected.
- **Class dropdown**: lists all classes for the current academic session, ordered by `display_order`.
- **Section dropdown**: filters `sections` by selected class + current session.
- **Subject dropdown**: filters `section_subjects` by selected section. Each option shows a `Badge` with the currently assigned teacher's `full_name` next to the subject name (or no badge if unassigned). Subjects with existing assignments are still selectable — modal does not block, but the add step is blocked if the (class, section, subject) combination already has an assignment.
- **Live preview card** below the dropdowns shows the selected combination as `"ClassName SectionName — SubjectName"` (e.g. `"Class 9 B — Social Science"`). × on the preview resets all three dropdowns.
- **Current Assignments list** at the bottom shows the first 3 existing subject teacher rows for the staff being edited, each labeled `"ClassName SectionName — SubjectName"` with a teacher badge. If more than 3, `+N more assignments` text is shown.
- **Add Assignment button** is disabled until all three are picked. Click → adds a draft badge to the card and closes the modal. Card Save persists the draft to `staff_roles` via `addSubjectTeacher` (see `src/integrations/supabase/queries/roleAssignments.ts`).
- **Subject name resolution**: `section_subjects.subject_name` is the source of truth. `staff_roles.subject_id` has no FK to `subjects` (confirmed via `information_schema.table_constraints` 2026-06-13), so the picker reads the name directly from `section_subjects` when building the label, and the read path (`getSubjectTeachersForStaff`) does a separate `section_subjects` lookup keyed by `subject_id` for display.
- **Label format**: `"ClassName SectionName — SubjectName"` (em-dash separator). Avoids ambiguity for sections with the same name across classes (e.g. `9A` vs `10A`).
- **Files**: `src/components/role-manager/SubjectPickerModal.tsx` (modal), `src/components/role-manager/StaffRoleCard.tsx` (consumer), `src/integrations/supabase/queries/roleAssignments.ts` (read path).

**Subject Picker Modal — bug fixes (2026-06-13):**
- **Pre-fix behavior**: modal showed a flat list of all 156 `section_subjects` rows. Selecting one closed the modal, but the draft badge showed `"Class 9 - ?"` (subject name missing) because the consumer's label fallback `existing?.subject_name` was `null` for new drafts. After Save, `staff_roles` row was inserted correctly with `academic_year_id` set, but the card's read path asked for `subjects(name)` join from `staff_roles` which silently returned `null` (no FK), so the post-save label was also `Class 9 B ?`. User reported "save says success but nothing got assigned" — the row was assigned, the UI just couldn't render the subject name.
- **Fix 1**: Rewrote picker as 3 cascading dropdowns. Picker passes `subjectName`, `className`, `sectionName` to the consumer via extended `onPick` signature: `(subjectId, classId, sectionId, subjectName, className, sectionName) => void`.
- **Fix 2**: `getSubjectTeachersForStaff` no longer requests `subjects(name)` join. It does a second `section_subjects` query keyed by the unique `subject_id`s in the result, then merges `subject_name` client-side. Result: post-save label is `"Class 9 B — Social Science"`, not `"Class 9 B ?"`.
- **Fix 3**: Consumer (`StaffRoleCard`) builds the label directly from the picker payload (`className sectionName — subjectName`) — no lookup against `roles.subject_teachers` for the label, so `null` `existing` is no longer a problem.
- **Verification**: pick "Class 9 B — Social Science" → modal closes, draft badge shows `"Class 9 B — Social Science"` (not `"Class 9 - ?"`). Save → row in `staff_roles` with `academic_year_id` set. Post-save read path renders `"Class 9 B — Social Science"` (not `"Class 9 B ?"`). Subjects tab shows teacher name in correct cell.

**(g) Department** — Read-only display on the card: each incharge dept rendered as `👑 {dept_name}` chip, each member-only dept rendered as `{dept_name}` chip. An incharge-also-member row renders once as the crowned chip (incharge wins). Editable in the drawer via **two independent single-add dropdowns**:
  - **Department Member** `<Select>` labeled `+ Add member` — picking a dept adds a `{dept_name}` badge. × removes from member; ↑ promotes to incharge.
  - **Department Incharge** `<Select>` labeled `+ Add incharge` — picking a dept adds a `👑 {dept_name}` badge. × demotes (keeps as member, since incharge ⇒ member cascade).
  - Both dropdowns show **only departments not yet in that list** (so a dept can't be added twice). Promoting via ↑ on a member badge auto-adds to incharge list and keeps the member row.
  - Each row in the underlying data is one record with `is_incharge: boolean`.
- **Cascade rule:** removing member also removes incharge (same save). Removing incharge only removes the incharge designation; member remains. **Incharge implies member** — adding to Incharge auto-adds to Member (both in UI and in save). Removing from Member also removes from Incharge.
- Writes to `departments_staff` + `department_incharges`; reflects in Departments tab.

**(h) House** — Single-value select: 4 houses (from `schools.houses` JSON) + "No house". Writes to `house_staff`; reflects in Houses tab.

**(i) Status** — On/Off toggle. `On` = active (can login). `Off` = inactive (cannot login; logged out from current session; login attempt shows "this Id is deactivated"). Writes to `profiles.status`.

#### 3.1.3 Audit

Every change writes a row to `staff_role_audit` (action, field, old, new, changed_by, changed_at). Principal can read all entries for their school.

**Status 2026-06-12:** Table + RLS + indexes applied to live DB via migration `20260612111214_staff_role_audit_and_master_admin.sql` + follow-up `20260612111345_add_staff_role_audit_field_column.sql`. **Audit inserts from the query layer are not yet wired** — `updateMasterAdmin`, `updateAdminRole`, `addCoordinator`, etc. currently do the change but do not write a row. Wiring the inserts is the next pass.

---

#### 3.1.4 Known limitations (v4.0)

| # | Limitation | Workaround | Resolution path |
|---|---|---|---|
| 1 | In-app sidebar nav (Dashboard / My Staff / etc.) while editing does not warn | Save or Cancel before navigating. Browser back is still covered. | Migrate `App.tsx` to data router (`createBrowserRouter` + `RouterProvider`) so `useBlocker` works |
| 2 | `profiles.is_master_admin` persists, but audit row is not written on toggle | None yet | Wire audit insert in `updateMasterAdmin` query |
| 3 | `staff_role_audit_select` policy exists alongside `staff_role_audit_read` (both school-scoped, redundant) | None needed — same predicate | Drop `staff_role_audit_select` in a cleanup migration |

### 3.2 Subjects Tab

**Status:** Implementation complete. No pending spec.

Purpose: Assign Class Teachers and Subject Teachers to class-sections.

**Layout:** Grid of section-block cells.

**Behavior:**
- Click cell → open picker dialog (staff dropdown)
- Real-time save on picker confirmation
- No bulk action

**Skip wing_staff when class has no wing:**
- If a class has `wing_id IS NULL`, subject/class-teacher assignments do NOT insert into `wing_staff`
- Subject assignment NOT blocked — only auto-membership skipped

**Implementation:** `src/components/role-manager/SubjectAssignmentGrid.tsx`

**Subjects Tab — bug fixes (2026-06-13):**
- **Pre-fix behavior**: clicking a cell popped the staff list. Picking a teacher silently failed — popover closed, cell stayed empty, no toast. Some clicks DID land in the DB (rows visible in `staff_roles`), but the user couldn't tell which clicks succeeded and which didn't.
- **Root cause**: `handleAssignStaff` in `SubjectAssignmentGrid.tsx` destructured only the return value of `supabase.from("staff_roles").delete()` and `.upsert()` — it never inspected `.error`. Supabase JS returns `{ data, error }`; errors do not throw. RLS rejects / exclusion-constraint hits / FK violations were silently swallowed, the refresh query ran, and the cell appeared unchanged.
- **Fix 1 (error guards)**: every `supabase.from("staff_roles")` call now destructures `{ error }` and `throw error` if non-null. The existing `catch (e: any)` then fires `toast.error(\`Failed to save assignment: ${e?.message ?? "unknown"}\`)`. RLS / constraint failures now surface as red toasts instead of silent failures.
- **Fix 2 (per-cell busy state)**: `busyKeys: Set<string>` keyed by `${sectionId}:${subjectId ?? "ct"}`. While a cell is mid-save, the cell shows a `Loader2` spinner + "Saving" text, the click is disabled (`cursor-wait`, `opacity-60`), and re-entrant calls short-circuit (`if (busyKeys.has(key)) return`). `finally` always clears the key. Prevents double-click races that could trigger exclusion constraints.
- **Verification**: revoke principal RLS on `staff_roles` (set caller's `profiles.role` to `staff` temporarily), retry the assign — red toast appears with the Supabase error message. Re-pick the same teacher twice in a row — idempotent, no constraint error. The existing Class Teacher row (Arun Srivastava, `staff_roles.id = 980c8609-...`) still renders in the Class Teacher cell of Nursery A — no regression.
- **Out of scope (not fixed this round)**: `handleAssignStaff` does not write `assigned_by` or `academic_year_id`; the legacy `class_teachers` and `subject_teachers` tables still being read by the Staff tab (different from this bug); Subjects tab is intentionally not modified further per user request — only the bug fixes above.

### 3.3 Wings Tab

**Status:** Spec locked 2026-06-06.

Purpose: Unified staff assignment to wings — coordinators + all teachers in one view.

#### Collapsed View (Table)

```
┌──────────┬──────────┬────────────┬────────────┬────────┬────────┐
│ Wing     │ Classes  │ Coordinator│ Staff    │ Actions│ Expand │
├──────────┼──────────┼────────────┼────────────┼────────┼────────┤
│ Nursery  │ PKG, LKG│ Mrs. Anjali│ 👨‍🏫 5  │ [Edit] ���  ↘    │
│ Primary  │ 1st, 2nd│ Mr. Raj   │ 👨‍🏫 8  │ [Edit] │  ↘    │
│ Middle   │ 6th, 7th│ +15 View  │ 👨‍🏫 150│ [Edit] │  ↘    │
│ Senior   │ 11th,12th│ —        │ 👨‍🏫 45 │ [Edit] │  ↘    │
└──────────┴──────────┴────────────┴────────────┴────────┴────────┘
```

**Columns:**
1. **Wing:** Wing name from `wings` table
2. **Classes:** Class badges via `wing_id`
3. **Coordinator:** Primary name + crown (👑). If 3+, show "+X View All"
4. **Staff Count:** 👨‍🏫 icon + count
5. **Actions:** [Edit] button
6. **Expand:** Chevron ↘

#### Expanded View

```
┌─────────────────────────────────────────────────────────────────┐
│ ▼ Middle Wing — 6th to 8th              [Edit] [Collapse] │
├─────────────────────────────────────────────────────────────────┤
│  COORDINATORS (15)        │  ALL STAFF (150)           │
│  ──────────────────┐     │  ───────────────────────    │
│  👑 Mr. A. Singh │     │  [Search...] [Filter] [View▾] │
│  👑 Mrs. B.Sharma│     │  ────────────────────     │
│  👑 Mr. C.Kumar │     │  Mr. Rahul Sharma CT 6A•ST6AEng │
│  ... (+12 more)  │     │  ... (146 more)          │
│  [View All]     │     │  [< 1 2 3 ... 6 >] │
└─────────────────────────────────────────────────────────────────┘
```

**UX:**
- Coordinators: First 3 + "+X View All" modal
- Staff: Search/filter/view toggle/pagination (25/page)

#### Badge Legend

| Badge | Meaning | Remove? |
|-------|--------|--------|
| 👑 | Coordinator (✨ = Primary) | Yes |
| CT 6A | Class Teacher 6A | No (Subjects Tab) |
| ST 6A Eng | Subject Teacher | No (Subjects Tab) |
| ST | Generic Subject Teacher | Yes |

#### Edit Modal

```
┌───────────────────────────────────┐
│ ✎ Edit Wing: Middle               │
├───────────────────────────────────┤
│  COORDINATORS           [+ Add]   │
│  ──────────────────────────      │
│  👑 Mr. A. Singh ✨ [Remove] │
│  ...                         │
│  ALL STAFF IN THIS WING         │
│  ──────────────────────────      │
│  ▪ Mr. Rahul Sharma CT 6A    │
│    ⚠️ Auto-assigned          │
│  [+ Add Staff]               │
│                           [Cancel] [Save] │
└───────────────────────────────────┘
```

**Remove Flow:**
- Coordinator: Direct remove
- Last Coordinator: Actor Replacement Protocol dialog
- Auto-assigned (CT/ST): Warning → Link to Subjects Tab

#### Data Model

Uses `wing_staff` table (see Section 2).

**Migration:** Drop `wings_coordinators`, `wings_activity_staff` after migration.

### 3.4 Departments Tab

**Status:** Implementation complete per existing code.

Layout: Department cards with departments listed, each showing:
- Department Name
- Incharge (👑 badge)
- Staff list (avatars)
- Actions: Edit (incharge, staff add/remove)

### 3.5 Houses Tab

**Status:** Needs rebuild per agreed plan (2026-06-07). Current implementation is simple table.

Purpose: Assign staff to houses, designate House Incharges. Show stats per house (students + staff, total + wing-wise + gender-wise).

#### House Definitions

Managed in My School → HousesTab. Stored in `schools.houses` JSON:
```
{name, color, emblem_url} — 4 defaults: Red, Blue, Green, Yellow
```

#### Card View (Grid, 2 columns)

```
┌─────────────────────────────────────────────┐
│ 🔴 RED HOUSE                    [Edit]    │
├─────────────────────────────────────────────┤
│ STUDENTS              │ TEACHERS          │
│ Total: 150           │ Total: 12         │
│ Junior: 80 ♂45 ♀35  │ Junior: 5 ♂3 ♀2  │
│ Middle: 40 ♂20 ♀20  │ Middle: 4 ♂2 ♀2  │
│ Senior: 30 ♂15 ♀15  │ Senior: 4 ♂3 ♀1  │
│ (No Wing): 0         │ (No Wing): 0      │
├─────────────────────────────────────────────┤
│ Incharge: Mr. Sharma 👑, Ms. Rao 👑      │
│                         [▼ Expand]       │
└─────────────────────────────────────────────┘
```

- Stats displayed as 2-column mini-table
- Gender symbols: ♂ (male), ♀ (female)
- Wing names from `wings` table (set in My School)
- Incharge: comma-separated badges with 👑

#### Expanded View (per house)

```
INCHARGE (2)
👑 Mr. Sharma [Remove]   👑 Ms. Rao [Remove]   [+ Add Incharge]

STAFF — grouped by wing
▼ JUNIOR (5)                              [+ Add]
  Mr. Arun, Ms. Priya, Mr. Raj, ...

▼ MIDDLE (4)                              [+ Add]
  Ms. Anita, Mr. Kumar, ...

▼ SENIOR (4)                              [+ Add]
  Mr. Arun ⚠️, Mr. Singh, ...

▼ NO WING (0)                             [+ Add]
  —
```

- Wings sorted: lower → higher academic rank (Junior → Senior)
- "No Wing" group last (staff not assigned to any class/wing)
- Staff names: comma-separated list
- Each wing group: collapsible, shows count, [+ Add] button
- Multiple incharge supported (comma-separated)

#### Edit Modal

```
┌───────────────────────────────────┐
│ Edit RED House               [X] │
├───────────────────────────────────┤
│ INCHARGE                        │
│ 👑 Mr. Sharma [Remove]           │
│ 👑 Ms. Rao [Remove]              │
│ [+ Add Incharge]                 │
├───────────────────────────────────┤
│ STAFF                           │
│ 🏠 Mr. Arun [×]                 │
│ 🏠 Ms. Priya [×]                │
│ [+ Add Staff]                   │
└───────────────────────────────────┘
```

- Staff picker: search dropdown
- Exclude staff already assigned to OTHER houses
- One house per staff: assigning to this house removes from any other house

#### Data Model

**Tables used:**

| Table | Columns | Usage |
|-------|---------|-------|
| `schools.houses` (JSON) | name, color, emblem_url | House definitions |
| `house_staff` | house_name, staff_profile_id, school_id | Staff ↔ House membership |
| `house_incharges` | house_name, staff_profile_id, school_id | Staff → Incharge designation |
| `student_profiles` | house, class_id, school_id | Student → one house |
| `students` | gender, class_id | Student gender for stats |
| `classes` | wing_id, name | Class → wing mapping |
| `wings` | name, display_order | Wing definitions + sorting |
| `profiles` | gender | Staff gender for stats |
| `wing_staff` | wing_id, staff_id | Staff → wing membership |

#### Stats Computation

| Stat | Source |
|------|--------|
| Students total | `student_profiles` WHERE `house = ? AND school_id = ?` |
| Students by wing | Join: `student_profiles` → `students` (class_id) → `classes` (wing_id) → `wings.name` |
| Students by gender | Same join, group by `students.gender` |
| Teachers total | `house_staff` count (dedup by staff_id) |
| Teachers by wing | `house_staff` → check `wing_staff` assignments OR `class_teachers`/`subject_teachers` → class → wing |
| Teachers by gender | Join `house_staff.staff_id` → `profiles.gender` |
| (No Wing) | Staff not found in any wing assignment |

#### Rules

| Rule | Enforcement |
|------|-------------|
| One house per student | `student_profiles.house` is single string |
| One house per staff | UI enforcement — assigning to new house removes from old |
| Multiple incharge per house | DB supports it (no UNIQUE on house_name) |
| Staff not in house is OK | No staff must be in a house |

---

## 4. Cross-Cutting Concerns

### 4.1 Synchronization

| Action | Location | Effect |
|--------|----------|--------|
| Assign CT/ST to section | Subjects Tab | Auto INSERT to `wing_staff` |
| Make staff Coordinator | Staff Tab → Wings cell | INSERT to `wing_staff` |
| Assign CT/ST to class-section | Subjects Tab | Auto INSERT to `departments_staff` (if class linked to dept) |
| Make staff Coordinator | Staff Tab | INSERT to `departments_staff` |

All tabs write to same source tables — changes reflect across all views.

### 4.2 Validation Rules

| Rule | Enforcement |
|------|------------|
| One Class Teacher per section | Database unique index |
| One Subject Teacher per section-subject | Database unique index |
| One Primary Coordinator per wing | UI-enforced (prompt if replacing) |
| Self-assign blocked | Picker excludes current user |
| Staff belongs to only one house | UI enforcement |

### 4.3 Notifications

| Event | Toast/Alert |
|-------|-----------|
| Role assigned | Success toast |
| Role removed | Success toast |
| Last coordinator removal | Confirmation dialog |
| Validation failure | Inline error message |

### 4.4 Cross-Module Impact

- **Subjects Tab:** Changes mirror to Wings + Departments via auto-membership
- **Wings Tab:** Changes mirror to Staff Tab (coordinator column)
- **Departments Tab:** Changes mirror to Staff Tab (department column)
- **SchoolPage:** Read-only views, no write capability

---

## 5. Open Questions

1. **Bulk Assign for Subjects Tab:** Earlier idea (all sections of one class for one subject). Removed in favor of per-cell save. Reintroduce if needed.

2. **Wing auto-membership for non-wing classes:** Currently skipped. Decide if staff should be manually addable to wing even if their assigned class has no wing.

3. **House assignment limits:** Currently unlimited per house. Consider: max staff per house?

4. **Mobile UX:** Not designed for any tab. Phase 2.

---

## 6. Verification & Implementation

### 6.1 Wings Tab Audit (2026-06-07)

**Current State:** `src/components/role-manager/WingsAssignmentTab.tsx` — Partial implementation, missing critical features per spec.

#### Gap Analysis

| # | Spec Requirement | Current State | Severity |
|---|---|---|---|
| 1 | Primary coordinator indicator (✨) | Not shown | HIGH |
| 2 | "+X View All" when coordinators > 3 | Not implemented | HIGH |
| 3 | Staff count column: single 👨‍🏫 count | Shows Students/Teachers/Coordinators separately | HIGH |
| 4 | [Edit] button in collapsed view | Missing | HIGH |
| 5 | [Edit] + [Collapse] buttons in expanded view | Only chevron toggle | HIGH |
| 6 | Edit Modal (dedicated dialog) | Completely missing | CRITICAL |
| 7 | "ALL STAFF" with search/filter/view toggle/pagination (25/page) | Shows Teachers only, no search/filter/pagination | HIGH |
| 8 | Staff role badges (CT 6A, ST 6A Eng, ST) | Shows plain names | HIGH |
| 9 | Actor Replacement Protocol for last coordinator | Using basic `confirm()` | HIGH |
| 10 | Auto-assigned warning → Subjects Tab link | Not implemented | MEDIUM |
| 11 | View All modal for coordinators (first 3 + modal) | Not implemented | HIGH |
| 12 | Primary coordinator tracking in data | No `is_primary` concept | CRITICAL |

**Partial/Deviations:**
- Coordinator shows crown only, not crown + ✨
- Columns don't match spec (Stats vs Staff count)
- Teachers ≠ ALL STAFF (missing CT/ST distinction)
- Basic confirm dialog vs full Actor Replacement Protocol

---

### 6.2 Execution Plan

#### Phase 1: Data Model Fixes (Database)

**T1.1:** Add `is_primary` column to `wing_staff` table
```sql
ALTER TABLE wing_staff ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
```

**T1.2:** Add `auto_assigned` flag to track CT/ST auto-membership
```sql
ALTER TABLE wing_staff ADD COLUMN auto_assigned BOOLEAN DEFAULT FALSE;
```

#### Phase 2: Query Layer Updates

**T2.1:** Update `WingStaffMember` type to include new fields
```typescript
// In wings.ts
export interface WingStaffMember {
  id: string;
  staff_id: string;
  assignment_type: "teacher" | "coordinator";
  staff_name: string;
  is_active: boolean;
  is_primary?: boolean;      // NEW
  auto_assigned?: boolean;   // NEW
  class_teacher_for?: string;   // NEW: "6A"
  subject_teacher_for?: string; // NEW: "6A Eng"
}
```

**T2.2:** Update `getWingsWithFullDetails()` to fetch primary/auto_assigned flags

**T2.3:** Add new queries:
- `setPrimaryCoordinator(wingId, staffId, schoolId)` — promote to primary
- `getWingStaffBadges(wingId, staffId)` — get CT/ST badges

**T2.4:** Update `addStaffToWing()` to optionally set `is_primary`

#### Phase 3: UI Components — Collapsed View

**T3.1:** Update columns to match spec
- Remove: Stats column (students/teachers/coordinators)
- Add: Staff count column (single 👨‍🏫 count)
- Add: Actions column with [Edit] button
- Keep: Expand chevron

**T3.2:** Coordinator column updates:
- Show primary with ✨ badge
- Show "+X View All" when coordinators > 3 (clickable, opens modal)

**T3.3:** Add [Edit] button per row (opens Edit Modal)

#### Phase 4: UI Components — Expanded View

**T4.1:** Replace chevron-only with [Edit] + [Collapse] buttons
- Header bar: `▼ {Wing Name} — {classes}` [Edit] [Collapse]

**T4.2:** Staff section: ALL STAFF with search/filter/pagination
- Add search input
- Add role filter: All | CT | ST | Coordinator
- Add view toggle: Card | Table
- Pagination: 25/page

**T4.3:** Coordinators section: First 3 + View All modal

#### Phase 5: UI Components — Edit Modal

**T5.1:** Create new `WingEditModal` component
- Dialog with wing name in header
- Two sections: Coordinators + All Staff

**T5.2:** Coordinators panel:
- List with ✨ badge for primary
- [Remove] buttons
- [Add] trigger (StaffPicker)
- Promote to Primary option

**T5.3:** All Staff panel:
- Show staff with badges: CT 6A, ST 6A Eng, ST
- Auto-assigned indicator with link to Subjects Tab
- [Add] trigger

**T5.4:** Remove flow:
- Coordinator: Direct remove
- Last Coordinator: Actor Replacement Protocol dialog
- Auto-assigned: Warning → Link to Subjects Tab

#### Phase 6: UI Components — Badges & Legends

**T6.1:** StaffBadge component
```tsx
interface StaffBadgeProps {
  role: "coordinator" | "class_teacher" | "subject_teacher";
  className?: string;
  sectionName?: string;
  subjectName?: string;
  isPrimary?: boolean;
  onRemove?: () => void;
}
```
- CT 6A → Class Teacher 6A
- ST 6A Eng → Subject Teacher 6A Eng
- ST → Generic Subject Teacher
- 👑 for coordinator (✨ = primary)

**T6.2:** Legend section updates:
- Add badge examples
- Explain auto-assigned concept

#### Phase 7: Actor Replacement Protocol

**T7.1:** Create `CoordinatorReplacementDialog` component
```
┌────────────────────────────────────────┐
│ ⚠️ Cannot Remove Sole Coordinator       │
├────────────────────────────────────────┤
│ {Name} is the only coordinator for      │
│ {Wing Name}. Removing will leave this  │
│ wing without a coordinator.             │
│                                        │
│ To continue, either:                 │
│                                        │
│ ○ Assign another coordinator first     │
│   [Select Staff...]                  │
│                                        │
│ ○ Remove anyway (not recommended)   │
│   [Confirm Remove]                  │
│                           [Cancel] │
└────────────────────────────────────────┘
```

**T7.2:** Wire up in remove flow instead of basic `confirm()`

#### Phase 8: View All Modals

**T8.1:** `CoordinatorsViewAllModal`
- Shows all coordinators for a wing
- First 3 visible + scroll for more
- Primary indicator for each
- Remove buttons

**T8.2:** Reuse expanded ALL STAFF in modal for "View All Staff"

---

### Implementation Order

| Phase | Task | Files | Complexity |
|-------|------|-------|------------|
| 1 | Database columns | Migration | LOW |
| 2 | Query updates | wings.ts | MEDIUM |
| 3 | Collapsed view | WingsAssignmentTab.tsx | MEDIUM |
| 4 | Expanded view | WingsAssignmentTab.tsx | MEDIUM |
| 5 | Edit Modal | NEW: WingEditModal.tsx | HIGH |
| 6 | Badge system | NEW: WingStaffBadge.tsx | MEDIUM |
| 7 | Replacement Protocol | NEW: CoordinatorReplacementDialog.tsx | MEDIUM |
| 8 | View All modals | NEW: CoordinatorsViewAllModal.tsx | LOW |

**Recommended sequence:** 1 → 2 → 3 (collapsed) → 6 (badges) → 5 (edit modal) → 4 (expanded) → 7 → 8 → Test

### Verification Checklist

**Phase gates:**

- [ ] T1.2 complete: Migration applied, columns exist
- [ ] T2.3 complete: Queries work, primary flag stored/retrieved
- [ ] T3.3 complete: [Edit] button present, opens modal
- [ ] T5.3 complete: Badges display CT/ST correctly
- [ ] T7.1 complete: Replacement dialog triggers for last coordinator

**Final checklist:**

- [ ] Collapsed view shows: Wing | Classes | Coordinator (+X View All) | Staff | Actions | Expand
- [ ] Expanded view shows: Coordinators + ALL STAFF side-by-side
- [ ] [Edit] button opens modal with coordinators + staff sections
- [ ] Staff badges show CT 6A, ST 6A Eng, ST properly
- [ ] Primary coordinator has ✨ badge
- [ ] Last coordinator → Actor Replacement Protocol
- [ ] Auto-assigned → warning + Subjects Tab link
- [ ] Pagination works (25/page) in ALL STAFF
- [ ] Search/filter works in ALL STAFF

---

### 6.3 Execution Summary (2026-06-07)

**What was done:**

| Item | Status | Notes |
|------|--------|-------|
| DB columns (`is_primary`, `auto_assigned`, `source_type`, `source_reference`) | ✅ Done | Migration applied |
| Query updates (`WingStaffMember` type, `getWingsWithFullDetails()`, `setPrimaryCoordinator()`) | ✅ Done | [wings.ts](src/integrations/supabase/queries/wings.ts) |
| `WingStaffBadge.tsx` component | ✅ Created | Badge component with crown/✨/CT/ST/Auto indicators |
| `CoordinatorReplacementDialog.tsx` component | ✅ Created | Actor Replacement Protocol dialog |
| `WingEditModal.tsx` component | ✅ Created | Full edit modal (not wired yet) |
| Collapsed view update | ⚠️ Partial | File had JSX issues, restored. Stubs in place but needs refinal |

**What's left after JSX fix interruption:**

- Re-integrate Edit Modal into `WingsAssignmentTab.tsx` (stubs exist, just need to not break file)
- Wire CoordinatorReplacementDialog into remove flow
- Implement ALL STAFF with search/filter/pagination in expanded view
- View All modal for coordinators >3
- Final verification

**Files created/modified:**
- [wings.ts](src/integrations/supabase/queries/wings.ts) — types + queries
- [WingStaffBadge.tsx](src/components/role-manager/WingStaffBadge.tsx) — badge component
- [CoordinatorReplacementDialog.tsx](src/components/role-manager/CoordinatorReplacementDialog.tsx) — replacement dialog
- [WingEditModal.tsx](src/components/role-manager/WingEditModal.tsx) — edit modal (not wired)
- [ ] Notifications appear on actions

### Implementation Status

| Tab | Status |
|-----|--------|
| Staff | Complete (2026-06-13: Subject Picker modal — cascading dropdowns + label fix) |
| Subjects | Complete (2026-06-13: error guards + per-cell busy state; spec §3.2 unchanged) |
| Wings | Spec locked 2026-06-06 |
| Departments | Complete |
| Houses | Complete |

### 2026-06-13 Patch — Role Manager (Staff tab + Subjects tab)

**Author:** Claude (Opus 4.7)

**Scope:** Two related defects that surfaced during a save-flow test on 2026-06-14.

**Changes:**
1. **`SubjectPickerModal.tsx` — full rewrite.** Replaced flat 156-row list with 3 cascading dropdowns (Class → Section → Subject). Each dropdown enables only when its parent is picked. Live preview card shows the selected combination. Picker passes `subjectName`, `className`, `sectionName` to the consumer via extended `onPick` signature. See §3.1.2(f) for full spec.
2. **`StaffRoleCard.tsx` — `onPick` consumer updated.** Builds the draft label directly from the picker payload: `\`${className} ${sectionName} — ${subjectName}\``. No more `existing?.subject_name` lookup that returned `?` for new drafts.
3. **`roleAssignments.ts` — `getSubjectTeachersForStaff` no longer asks for `subjects(name)` join from `staff_roles`.** `staff_roles.subject_id` has no FK to `subjects` (confirmed via `information_schema.table_constraints`). The function now does a second `section_subjects` query keyed by `subject_id` and merges `subject_name` client-side. Post-save read path now shows correct subject name (e.g. `Class 9 B — Social Science`, not `Class 9 B ?`).
4. **`SubjectAssignmentGrid.tsx` — error guards on every `supabase.from("staff_roles")` call.** Previously `.error` was never checked; RLS rejects / exclusion-constraint hits were silently swallowed. Now they throw, landing in the existing `catch` and firing `toast.error`.
5. **`SubjectAssignmentGrid.tsx` — per-cell busy state.** `busyKeys: Set<string>` keyed by `${sectionId}:${subjectId ?? "ct"}`. While a cell is mid-save, the cell shows `Loader2` + "Saving", click is disabled. Re-entrant calls short-circuit. `finally` clears the key. Prevents double-click races.
6. **`StaffRoleCard.tsx` — fixed label typo.** `\`${cls?.name ?? "?"} ? ${existing?.subject_name ?? "?"}\`` → `\`${cls?.name ?? "?"} - ${existing?.subject_name ?? "?"}\``. (Subsequently replaced entirely by Fix 2 above.)

**Bug surface (why this matters):**
- **Staff tab "Add Subject"**: prior to the rewrite, the picker had a broken select (queried non-existent `subject_id` / `class_id` columns and embedded `classes` / `sections` / `subjects` relations that aren't FKs on `section_subjects`). Result: empty list. Replaced by cascading dropdowns.
- **Staff tab "Class 9 - ?" label**: label was constructed from a `roles.subject_teachers.find(...)` lookup that always returned `null` for new drafts. New picker passes the name directly.
- **Staff tab post-save "?" label**: `getSubjectTeachersForStaff` asked for `subjects(name)` join on a table with no FK — silently returned `null`. Now does a separate lookup against `section_subjects`.
- **Subjects tab silent failure**: `handleAssignStaff` never checked `.error`. RLS / constraint errors were swallowed. Now they fire red toasts.
- **Subjects tab double-click race**: a second click during an in-flight request could trigger the EXCLUSION constraint. Now blocked by `busyKeys`.

**Verification:**
- ✅ TypeScript clean: `npx tsc --noEmit` produces no errors.
- ✅ Live DB confirms writes: 3 new `staff_roles` rows landed in 2026-06-14 07:51–09:42 (principal self-assign, Arun Srivastava Class 9 B / 10 A / 11 A).
- ✅ Pick "Class 9 B — Social Science" from cascading dropdowns → modal closes → draft badge shows `Class 9 B — Social Science` (not `Class 9 - ?`) → Save → row in `staff_roles` with `academic_year_id` set → card exits edit mode → post-save label is `Class 9 B — Social Science` (not `Class 9 B ?`).
- ✅ No regression on existing assignments: Class Teacher row `980c8609` (Arun Srivastava) still renders in Nursery A.

**Not in this patch (tracked for follow-up):**
- `handleAssignStaff` does not write `assigned_by` or `academic_year_id`. `addSubjectTeacher` does, but the Subjects tab handler does not. Inconsistency worth a separate pass.
- Legacy `class_teachers` and `subject_teachers` tables still being read by the Staff tab card (different from this bug — the "two-table split" refactor from earlier in the project).
- Mobile UX for both tabs (Phase 2).