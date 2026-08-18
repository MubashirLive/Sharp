# My School — Implementation Report

> Updated 2026-06-17. Six tabs. See [ONBOARDING.md](ONBOARDING.md) for the wizard.

## Status
`/school` route, principal + admin only. Edit controls gated by `canEdit` (super_admin/principal/admin). Home card shows when `schools.onboarding_complete = true`.

Tabs: School Profile | Session & Classes | Subjects | Wings | Houses | Departments.

## Tab 1 — School Profile
**Locked (super-admin-owned):** name, acronym, address, postal, country, city, state, board, type, emblem, principal name/email/mobile. Lock icon → "contact Super Admin".

**Editable (principal/admin):** contact phone, contact email, alt phone, website, school shifts (add/remove + start/end). Saves to `schools`, refreshes school context.

## Tab 2 — Session & Classes
### 2a — Classes (`ClassesStep.tsx`)
CRUD classes, sections, codes, wing assign, drag-reorder, deletion safety.

**Removed:** custom session dates link, subject-count book icon, status badges.

**Kept:** drag handle, inline name+code edit, section pills, student count, teacher count, deletion confirm dialog with deps.

**Section code — auto-derived, never manually editable:** `name.replace(/[^a-zA-Z]/g,"")` → length 1 = that char, length ≥2 = first 2 chars ("Arts"→"AR"). Section name max 12 chars.

**Roll number:** `ClassCode + SectionCode + Sequence` (e.g. `9A01` = Class 9, Section A, roll #01). Sequence auto-assigned `01, 02, …`.

### 2b — Session (`SessionsStep.tsx`)
Term structure + class dates (drives attendance).

1. **Term structure** — templates (Annual, T1+2, Sem 1+2, Sem 1+2+3) + custom cards (drag-reorder, name/start/end). Stored in `academic_sessions.term_structure` (JSON).
2. **Class session dates** — table Class/Code/Start/End/Term, search + wing filter, per-class date pickers + term selector. Stored in `class_session_dates` + `classes.term_structure`.

Attendance integration: present count = records within session; absent = session days − records.

### Route restriction
`/school` in `App.tsx`: `ProtectedRoute allowedRoles={["principal","admin"]}`. Teacher/student redirected.

### Deletion safety
- Saved class (`_id`): dep check → `DeletionConfirmDialog` (students, subjects, teachers, attendance).
- Unsaved: local remove.

### Save behavior
1. Diff current vs DB → DELETE removed, UPSERT current.
2. PERSIST academic year to `academic_sessions`.
3. UPSERT classes + sections.
4. `logSessionChange` per change.

Classes tab component: `school/ClassesTab.tsx` (standalone; onboarding `ClassesStep.tsx` is frozen, separate). Save is diff-based — only editor-owned columns updated when changed. `acronym` is **derived** on save via `deriveClassAcronym(name)` (class + section), never user-editable — so validation has no duplicate-code check. `wing`/`wing_id` are **preserved from baseline, never written** here (Wings tab owns them; see Tab 4).

### Pending count
`pendingCount` = academic year change, class added/removed/renamed/reordered, section added/removed/renamed, code/term/dates change. Save button shows `(N)`.

### Blocking validation
| Error | Rule |
|---|---|
| Duplicate class code | `codeCounts[code] > 1` |
| Duplicate section code | per class |
| Missing start/end date | per class |
| End < start | per class |
| Class with no sections | per class |

### Academic year
System-derived (`Apr YYYY → Mar YYYY+1`). Badge, no dropdown. Auto-creates `academic_sessions` row if missing. `src/lib/academic-year.ts`.

### Health panel
Right panel: setup summary, blocking error count + per-error cards, teacher assignment warnings (no class teacher / no subject teachers), roll number format reference, custom code warning.

## Tab 3 — Subjects
**Subject↔section assignment only** — writes `section_subjects`, nothing else. Teacher assignment (class/subject teachers → `staff_roles`) is owned by Role Manager → Subjects tab ([ROLE_MANAGER.md](ROLE_MANAGER.md) §3.2), a separate table + interface. Component: `school/SubjectTab.tsx` (standalone; not the onboarding `SubjectsStep` reuse). Principal/Master Admin/Admin edit; others read-only.

Excel-like grid: class rows × section columns, wing-based tabs (per-wing + Unassigned + All), `[Save All]` at top. Click a cell → `SubjectEditModal` (one cell at a time): Assigned pills (× to remove) + Available checkboxes, **Copy from Section A** checkbox, `+ Add Custom Subject` inline, and a **Stream** selector for Class 11–12 (Science/Commerce/Arts/Bifocal). No "+N more" truncation — all subjects shown.

**Save** (`Save All`): per changed section, delete-and-reinsert `section_subjects`. Custom subjects stored with `subject_code = null`. Stream persisted on `sections` (11–12).

**Subject library** (pre-defined by class category, `data/subjects.ts`):
| Category | Classes | Subjects |
|---|---|---|
| Primary | Nursery–5 | English, Hindi, Maths, EVS, GK, Art & Craft, Computer, Music |
| Middle | 6–8 | English, Hindi, Maths, Science, Social Science, Sanskrit, Computer |
| Secondary | 9–10 | + Physical Education |
| Science 11–12 | | Physics, Chemistry, Biology, Maths, English, Hindi, PE |
| Commerce 11–12 | | Accountancy, Economics, Business Studies, Maths, English, Hindi |
| Arts 11–12 | | History, Geography, Pol. Science, Sociology, Psychology, English, Hindi |
| Bifocal 11–12 | | Physics, Chemistry, Maths, English, Hindi, Computer Science |

## Tab 4 — Wings
**Class↔wing assignment only** (board-based DnD, v3.0). Wing coordinators are owned by Role Manager → Wings tab ([ROLE_MANAGER.md](ROLE_MANAGER.md) §3.3, `wing_staff`). Principal/Master Admin only; `canEdit` gates edit UI.

Board view: wing cards with class badges (acronym only) + an Unassigned box (`wing_id IS NULL`). Edit mode ([Edit]→[Save]/[Cancel]) clones state locally: drag class between wings/Unassigned (`@dnd-kit`), × on badge → instant Unassigned, inline-editable wing names, `+ Add New Wing`, delete (empty wings only, type-to-confirm). Cross-wing drag shows yellow-border warning. No modals, no staged commit — Save writes one batch: upsert `wings`, update `classes.wing_id`, create/delete wings, one log entry.

**Rules:** 1 class min to save a wing; a class belongs to one wing at a time; auto-name `Class1 – Class2 – Class3 Wing` (blank name → auto-derived on save); wing order by lowest class number; class order by `display_order`. **Wings tab is the sole writer of `classes.wing_id`** — Classes tab never writes it. Name 2–50 chars.

**Log** (one entry per Save): `"N classes added: 6A, 6B"` · `"3 added: … | 2 removed: …"` · `"Renamed: Science -> Science Wing"` · `"Wing deleted"`.

## Tab 5 — Houses
**Entity management only** (name + emblem). Staff assignment + House Incharge are owned by Role Manager → Houses tab ([ROLE_MANAGER.md](ROLE_MANAGER.md) §3.5). Principal/Master Admin only.

4 fixed defaults (Red, Blue, Green, Yellow), pre-seeded with colour emblems — no add/delete in v1. Per-card Edit (one at a time, stage-and-commit): inline name + emblem circle (click to upload JPG/PNG/SVG), Reset button. Save → `schools.houses` JSONB (`{name, color, emblem_url}`). Name/emblem changes propagate instantly to all consumers (Student Module dropdowns, Staff Profile).

**Reset** (Principal/Master Admin): type-name confirm → reverts name + default emblem AND clears all `house_staff`/`house_incharges` rows for that house. Cleanup runs before rename; abort on failure.

**Name validation:** 2–30 chars, case-insensitive unique (`"This house name is already in use."`), charset `alphanumeric + space + & - ( )`, auto-trim. Emblem optional (default colour circle if none).

## Tab 6 — Departments
**Entity management only** (name + status). Incharge/member assignment owned by Role Manager → Departments tab ([ROLE_MANAGER.md](ROLE_MANAGER.md) §3.4). Principal/Master Admin only.

List view (Department | Status | Actions). Search + single tab-level Log button. **Create:** staff pre-check (≥1 staff must exist), name only (max 50 chars, case-insensitive unique, template chips Fees/Transport/HR/Reception/Discipline) → inserts `departments` row in **inactive** state (no incharge picker in form). **Edit:** name-only (2–50 chars, unique) + Delete. **Delete:** type-to-confirm dialog → deletes `department_staff` rows then the `departments` record (no Actor Replacement on this destruction path).

**Activation rule:** department is Inactive (amber badge) until ≥1 incharge assigned (in Role Manager); `is_active` derived from `department_staff` having a row with `is_incharge=true`. A dept can have zero members; a staff can belong to multiple depts; multiple equal-authority incharges allowed.

## Cross-cutting
### Audit log (Session & Classes)
`session_audit_log` — every save logs created/updated/deleted class/section with `changed_fields` JSONB. Principal/admin view only.

### Conflict detection
`academic_sessions.version`, `departments.version` for optimistic lock.
`academic_sessions.editor_heartbeat`, `departments.editor_heartbeat` for presence. Updated on tab open/edit entry. Warning when other heartbeat recent.

### Unsaved Changes Dialog
On tab switch with `dirtyTabs`:
- Bulleted list of specific changes (scrollable, max-height).
- Buttons: "Discard" / "Save & Switch".

**Summary format per tab:**
| Tab | Format |
|---|---|
| Session & Classes | `Academic year: "2025-26" → "2026-27"`, `New class "Nursery" (A, B)`, `Class renamed`, `Code change`, `Section add`, `Subject count` |
| School Profile | `Phone/Email/Shift changes`, `New shift` |
| Wings | `New wing`, `Class moved`, `Wing renamed`, `Coordinator` |
| Houses | `House renamed`, `Incharge`, `Emblem uploaded` |

Max 8 items, `(+N more)` overflow. `\n• ` separator. `initialSessionData` + `initialWingEditors` track originals.

## Tables
| Table | Purpose |
|---|---|
| `schools` | profile, shifts, houses |
| `academic_sessions` | year, dates, version, heartbeat, term_structure |
| `classes` | name, code, term, dates, wing_id |
| `sections` | name, code, order, stream |
| `section_subjects` | per-section subjects |
| `wings` | name, order, coordinator_id |
| `subject_teachers` | staff → class-section-subject |
| `class_teachers` | staff → class-section |
| `departments` | JSONB members/incharges/settings, version, heartbeat |
| `departments_audit_log` | per-dept change history |
| `session_audit_log` | class/section structural history |

## Files Changed
| File | Notes |
|---|---|
| `src/App.tsx` | `allowedRoles={["principal","admin"]}` on `/school` |
| `src/pages/SchoolPage.tsx` | 6 tabs, dept CRUD, wing coord, house incharge, audit log |
| `src/components/onboarding/SessionStep.tsx` | health warnings, blocking validation, deletion safety, pending count |
| `src/components/onboarding/SubjectsStep.tsx` | teacher assignment UI, wing filter, staff loading |
| `src/components/onboarding/types.ts` | `subjectTeachers`, `classTeacher`, `_id`, `_deleted` |
| `src/integrations/supabase/types.ts` | `subject_teachers`, `class_teachers` |

## Not Built
- Role Manager integration for shared teacher state.
- Department Messenger/Tasks/Calendar backend wiring (settings UI exists).
- Side-by-side diff UI for concurrent edit overwrites.
- Department inbox/thread view (only settings defined).
- **Post-onboarding Sessions tab** in My School > Structure — term structure + class date overrides are currently onboarding-only (`onboarding/SessionsStep.tsx`); no My School surface yet.
- **"Custom session dates"** link from a class card to that tab, + read-only override badge on class cards (`class_session_dates`).
