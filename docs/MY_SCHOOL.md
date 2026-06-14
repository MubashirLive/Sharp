# My School — Implementation Report

## Current Build Status

The My School page is available after school onboarding is completed.

The Home dashboard shows the **My School** card when `school.onboarding_complete = true`. The card opens `/school`, which renders the SchoolPage.

The SchoolPage has six tabs:

1. School Profile
2. Session & Classes
3. Subjects
4. Wings
5. Houses
6. Departments

## Access

The `/school` route is restricted to `principal` and `admin` roles only.
Edit controls inside each tab are gated by `canEdit`, which is true for Super Admin, Principal, and Admin.

---

## Tab 1: School Profile

### Locked School Information

These fields are read-only — controlled by Super Admin:

- School Name, Acronym, Address, Postal Code, Country, City, State
- Academic Board, School Type, School Emblem
- Principal Name, Principal Email, Principal Mobile

UI shows lock indicator with "contact Super Admin to request changes."

### Editable Contacts & Shifts

Principal/Admin can edit:

- Contact Phone, Contact Email, Alternate Contact Phone, Website
- School Shifts (add/remove with name, start time, end time)

Saving updates the `schools` row and refreshes school context.

---

## Tab 2: Session & Classes

Two separate tabs: **Classes** (class management) and **Session** (term structure + date assignment).

### Tab 2a: Classes (ClassesStep.tsx)

Manages class creation, editing, deletion, section management, and class codes.

**What it does:**
- Create/edit/delete classes with inline editing
- Add/remove/reorder sections per class
- Assign wing to class
- Edit class code (4-char max, uppercase)

**What it does NOT contain (removed):**
- Custom session dates link (moved to Session tab)
- Book icon + subject count (irrelevant to class management)
- Status badges (complete/incomplete/missing) — added noise

**Components kept:**
- Drag handle for reordering
- Inline class name editing
- Inline class code editing (EditableCode component)
- Section pills with inline name/code editing
- Student count (Users icon)
- Teacher count (UserCheck icon)
- Deletion confirm dialog with dependency check

### Tab 2b: Session (SessionsStep.tsx)

Assigns start/end dates and term structure to each class. Dates drive attendance module calculation.

**Two sections:**

#### 1. Term Structure Setup

- System templates: Annual, Term 1 & 2, Semester 1 & 2, Semester 1, 2 & 3
- Custom term cards with drag-to-reorder
- Each term card: name (editable) + start date + end date
- Add custom term button

**Purpose:** Define how the academic year is divided into terms/semesters. These term definitions are stored in `academic_sessions.term_structure` as JSON.

#### 2. Class Session Dates

- Table view with columns: Class, Code, Start Date, End Date, Term Structure
- Search + wing filter
- Date pickers per class
- Term structure selector per class (dropdown)
- All classes displayed (even without custom overrides)

**Purpose:** Assign dates to each class. These dates are used in the Attendance module to calculate present/absent counts. If a class has no session dates, attendance cannot be recorded for that class.

**Data storage:**
- Per-class overrides stored in `class_session_dates` table
- `classes.term_structure` field stores per-class term structure assignment
- `academic_sessions.term_structure` JSON stores term definitions

**Attendance integration:**
- Attendance module queries `class_session_dates` to determine valid attendance dates
- Present count: attendance records where date falls within class session
- Absent count: class session days minus attendance records

### Route Restriction (Phase 1)

`/school` route in `App.tsx` wrapped with `ProtectedRoute allowedRoles={["principal","admin"]}`.
Teacher/student roles are redirected away from `/school`.

### Deletion Safety (Phase 1)

- Removing a class with `_id` (saved to DB): dependency check runs → `DeletionConfirmDialog` shown
- Removing a class without `_id` (new): immediate local removal
- Dialog shows: student count, subject count, teacher assignments, attendance status
- "Remove" (green) when no deps, "Remove Anyway" (red) when deps exist

**Tables queried for dependency check:** `students`, `section_subjects`, `attendance`, `class_teachers`

### Save Behavior Fix (Phase 1)

Save handler now:
1. Determines kept class/section IDs from current data
2. DELETEs from DB any classes/sections present in DB but absent from data
3. PERSISTs academic year change to `academic_sessions` row
4. UPSERTs all current classes and sections
5. Calls `logSessionChange` for each structural change (class added/removed/renamed, section added/removed)

### Pending Change Count (Phase 1)

`pendingCount` computed by comparing current data vs `initialData`:
- Academic year changed
- Class added/removed/renamed/reordered
- Section added/removed/renamed
- Class code, term structure, dates changed

Save button shows `(N)` badge when changes exist.

### Blocking Validation (Phase 3)

Save button disabled when blocking errors exist:

| Error | Rule |
|---|---|
| Duplicate class code | `codeCounts[code] > 1` |
| Duplicate section code | `secCodeCounts[code] > 1` inside same class |
| Missing start date | `!c.start_date` |
| Missing end date | `!c.end_date` |
| End before start | `c.end_date < c.start_date` |
| Class with no sections | `c.sections.length === 0` |

### Academic Year (Auto-Assigned)

Year is **system-derived, read-only** — no user selection possible in post-onboarding flow.

- Auto-derived from current date: `Apr YYYY → Mar (YYYY+1)`
- Displayed as `<Badge>` — no dropdown, no toggle
- Auto-creates `academic_sessions` row if none exists when saving
- `saveSession` queries for `is_current = true` session; creates one with auto-derived year if missing
- Session ID stored on all `classes` and `sections` rows

**Helper:** `src/lib/academic-year.ts` — `getCurrentAcademicYear()`, `getAcademicYearDates()`

### Health Panel (Phase 3)

Right panel (`RightPanel` component) shows:

- **Setup Summary** — class count, section count, custom codes flag
- **Health panel** — blocking errors with count, per-error cards (message + class ref), "No blocking issues" green badge when clean
- **Teacher Assignment panel** — warning cards for sections missing class teacher or subject teachers
- **Roll Number Format** — structure reference with examples
- **Custom code warning** — shown when selected class has custom code

Health panel icon: `AlertCircle` (red) when errors, `CheckCircle2` (green) when clean.

---

## Tab 3: Subjects

Reuses `SubjectsStep` component from onboarding flow.

### Wing-wise Subject UI (Phase 3)

Top filter bar shows when school has multiple wings:
- "All Wings" button (default)
- Per-wing button (derived from `classes.wing_id`)
- "Unassigned Classes" button (shown when any class has no wing)

`filteredClasses` controls which classes render. Class header shows wing `Badge` when wing exists.

### Teacher Assignment (Phase 2)

**Class Teacher block** — per section, shows:
- "Assign" / "Replace" button
- Avatar + name when assigned
- Clear (X) button to remove

**Subject Teacher block** — per subject row, shows:
- Staff name badge when assigned
- "Replace" / "+ Assign" button
- Clear (X) button to remove

**Assignment dialog:**
- Replaces existing teacher → warning box naming current teacher
- Staff selector (active staff from `staffs` table)
- One teacher per section (Class Teacher), one teacher per subject-section (Subject Teacher)

**Data loaded from DB on mount:**
- `subject_teachers` table for Subject Teacher assignments
- `class_teachers` table for Class Teacher assignments

### Save Behavior (Phase 2)

`saveSubjects` in SchoolPage now:
1. Deletes and re-inserts `section_subjects` (subject toggles)
2. `class_teachers`: upsert on `section_id` conflict, delete if cleared
3. `subject_teachers`: delete all for section, re-insert all assignments

---

## Tab 4: Wings

- "Add Wing" creates new wing editor row
- Inline-editable wing name
- Class badge assignment via dropdown
- Move classes between wings via `SelectTrigger` on badge
- Remove class from wing via X button
- `+ Add class to this wing` selector for unassigned classes
- Coordinator assignment via staff selector

**Save:** Inserts/updates `wings` rows, updates `classes.wing_id` for affected classes, saves `coordinator_id` on wings table.

---

## Tab 5: Houses

- Displays 4 default houses (Red, Blue, Green, Yellow)
- Emblem circle with color or uploaded image
- Edit mode: inline name input + incharge selector
- Click emblem circle to upload image
- Save: updates `schools.houses` JSONB (includes incharge_id and incharge_name)

---

## Tab 6: Departments

Accessible only to Principal/Admin. Full spec in `docs/DEPARTMENT.md`.

### Features

- **Card view** (default) and **List view** with localStorage persistence
- **Search** by department name
- **Create** — pre-check for staff existence, name validation (2-50 chars, alphanumeric + `&-()`), template name chips
- **Edit** — stage-and-commit flow, member list with role management, promote/demote incharge
- **Delete** — dissolve confirmation with impact summary
- **Actor Replacement Protocol** — when sole incharge is removed, immediate dialog forces backfill
- **Messenger Settings** — gear icon opens popover with "who can use" dropdown and visibility checkboxes
- **Audit Log** — per-department change history via `departments_audit_log` table
- **Concurrent editing warning** — version-based optimistic locking with `departments.version` column
- **Heartbeat** — `editor_heartbeat` column for presence detection

### Tables Used

| Table | Purpose |
|---|---|
| `departments` | Department record with JSONB members/incharges/messenger_settings, version for conflict detection |
| `departments_audit_log` | Change history per department (who, when, what) |

---

## Cross-cutting Features

### Audit Log (Session & Classes)

`session_audit_log` table tracks structural changes to classes and sections:
- Logs on every save in `saveSession` — created/updated/deleted classes and sections
- Actor ID from auth context, includes `changed_fields` JSONB
- Viewable via principal/admin only

### Conflict Detection

- `academic_sessions.version` and `departments.version` columns for optimistic locking
- `academic_sessions.editor_heartbeat` and `departments.editor_heartbeat` for presence detection
- Heartbeat updates on tab open/edit mode entry
- Concurrent edit warning when another user's heartbeat is recent

### Unsaved Changes Dialog

On tab switch with pending changes:

- **Trigger**: switching from a tab that has `dirtyTabs` entry
- **Modal shows**:
  - Title: "Unsaved changes"
  - Description: **bulleted list** of specific changes made (scrollable, max-height)
  - Buttons: "Discard" (discard + switch), "Save & Switch" (save + switch)

**Summary format per tab** (each item on new line with bullet `• `):

| Tab | Summary format |
|---|---|
| Session & Classes | `Academic year: "2025-26" → "2026-27"` `New class "Nursery" (Sections: A, B)` `Class renamed: "Class 1" → "Grade 1"` `Code: "C1" → "G1"` `Section "B" added to Class 5` `Subjects in Class 5: 3 → 5` |
| School Profile | `Phone: "98765XXXX" → "99887XXXX"` `Email: "—" → "info@school.com"` `Shift "Morning": 08:00-12:00 → 07:30-12:00` `New shift "Evening" (14:00-17:00)` |
| Wings | `New wing "Montessori" (Nursery, LKG)` `"Class 1" moved into Primary` `Wing "Secondary" → "Middle School"` `Coordinator: "—" → "John Kumar"` |
| Houses | `House: "Red" → "Phoenix"` `Blue incharge: Priya Sharma` `Yellow: emblem uploaded` |

**Max 8 items** shown; excess shows `(+N more changes)`. Uses `\n• ` separator.

**Initial state tracking**: `initialSessionData` and `initialWingEditors` state vars store original values (set on load, updated after each successful save).

---

## Data Tables

| Table | Purpose |
|---|---|
| `schools` | School profile, shifts, houses |
| `academic_sessions` | Academic year, session dates, version |
| `classes` | Class name, code, term, dates, wing_id |
| `sections` | Section name, code, stream |
| `section_subjects` | Subject assignments per section |
| `wings` | Wing name, display order, coordinator_id |
| `subject_teachers` | Staff → class-section-subject assignment |
| `class_teachers` | Staff → class-section assignment |
| `departments` | Department with JSONB members/incharges/settings, version, heartbeat |
| `departments_audit_log` | Per-department change history |
| `session_audit_log` | Class/section structural change history |

---

## Not Built Yet

- Role Manager integration for shared teacher assignment state
- Department Messenger/Tasks/Calendar full integration (settings UI exists, backend behavior not wired)
- Conflict resolution side-by-side diff UI for concurrent edit overwrites
- Department inbox/thread view for Messenger (only settings defined)

---

## Files Changed

| File | Changes |
|---|---|
| `src/App.tsx` | Route restriction: `allowedRoles={["principal","admin"]}` on `/school` |
| `src/pages/SchoolPage.tsx` | All 5 tabs, department CRUD, wing coordinator, house incharge, audit log |
| `src/components/onboarding/SessionStep.tsx` | Teacher health warnings in RightPanel, blocking validation, deletion safety, pending count |
| `src/components/onboarding/SubjectsStep.tsx` | Teacher assignment UI, wing filter, staff loading, Class/Subject Teacher blocks |
| `src/components/onboarding/types.ts` | `subjectTeachers`, `classTeacher` fields in SectionDraft; `_id`, `_deleted` in ClassDraft/SectionDraft |
| `src/integrations/supabase/types.ts` | `subject_teachers` and `class_teachers` table types |
| DB migrations | `create_subject_teachers_table`, `extend_departments_table`, `add_session_audit_log_table`, `add_version_column_session_dept`, `add_wing_coordinator_field` |