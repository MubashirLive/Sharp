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
Reuses `SubjectsStep` from onboarding. Wing filter (when multi-wing): "All Wings" + per-wing + "Unassigned". Class header shows wing `Badge`.

**Class Teacher block** — per section: Assign/Replace, avatar+name, clear.
**Subject Teacher block** — per subject: name badge, Replace/+Assign, clear.

**Assignment dialog** — replace warning naming current teacher, active staff selector, one per (section)/(subject-section).

DB: `subject_teachers` + `class_teachers` loaded on mount.

**Save behavior** — delete-and-reinsert `section_subjects`, upsert `class_teachers` on section_id conflict, delete-all + reinsert `subject_teachers` for section.

## Tab 4 — Wings
"Add Wing" creates row. Inline name, class badge dropdown assign, move classes between wings, remove class, `+ Add class to this wing` for unassigned, coordinator via staff selector.

Save: insert/update `wings`, update `classes.wing_id`, save `coordinator_id`.

## Tab 5 — Houses
4 defaults (Red, Blue, Green, Yellow). Emblem circle (color or upload). Edit: inline name + incharge selector. Save: `schools.houses` JSONB (incharge_id, incharge_name).

## Tab 6 — Departments
See [DEPARTMENT.md](DEPARTMENT.md). Card + List view (localStorage). Search. Create (staff pre-check, 2-50 chars, `&-()` allowed, template chips). Edit (stage-and-commit, member role mgmt, promote/demote incharge). Delete (dissolve confirm, impact summary). Actor Replacement Protocol (sole incharge → force backfill). Messenger Settings gear (who can use + visibility). Audit log (`departments_audit_log`). Optimistic locking (`departments.version`). Heartbeat (`editor_heartbeat`).

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
