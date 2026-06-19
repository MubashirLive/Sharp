# Cross-Module Integration Contracts

> Shared-state rules between modules that edit or consume the same school data.
> When two modules provide different gateways to the same state, they must not create duplicate records or independent copies. They must read and write the same canonical assignment store.

---

## Academic Assignment Contract

### Covered

- Subject Teacher assignment
- Class Teacher assignment

### Editing gateway

**Sole editor: Role Manager** (My Staff > Roles tab). Subject Tab (My School) is now **read-only display** of subject assignments. All subject and class teacher assignment changes are made via Role Manager.

| Gateway | Editing style | Mental model |
|---|---|---|
| Role Manager | Staff-wise | "What roles and teaching assignments does this staff member hold?" |
| Subject Tab | Read-only | "What subjects are being taught in each class-section?" |

### Subject Teacher assignment

Connects: School · Academic session · Wing (derived from class) · Class · Section · Subject · Staff

Rules:
- One Class + Section + Subject has one Subject Teacher
- One staff can hold many assignments
- Co-teaching not supported
- Reassignment replaces the previous teacher only after explicit confirmation

Confirmation text must include: existing teacher, replacement teacher, class, section, subject, downstream modules affected.

### Class Teacher assignment

Connects: School · Academic session · Wing (derived from class) · Class · Section · Staff

Rules:
- One Class + Section has one Class Teacher
- One staff can hold only one Class Teacher assignment at a time (unless future setting allows multiple)
- Reassignment replaces the previous Class Teacher only after explicit confirmation
- Staff can be both Class Teacher and Subject Teacher

### Automatic wing membership

When a staff is assigned as Subject Teacher or Class Teacher:
1. Resolve the class's current wing from Wing tab / class `wing_id`
2. If wing exists, add the staff to that wing's read-only teacher membership
3. If no wing, save the assignment without wing membership
4. If the class later moves to another wing, the staff's displayed wing membership follows the class

Wing membership created by Subject/Class Teacher is not manually editable from Wing. Wing tab only displays: Teacher name · Class-section-subject (Subject) · Class-section (Class) · Assignment type.

Examples: `Rajesh Kumar - Class 8A Mathematics` · `Priya Sharma - Class Teacher 5B` · `Anita Verma - Class 11 Commerce Accountancy`

Activity Staff with no Class/Subject Teacher assignment displays as: `Activity Staff - Non-assigned`.

### Removal rules

When Subject Teacher assignment removed:
- Remove only that Class + Section + Subject mapping
- Keep the staff in the wing if they still have another Subject/Class Teacher/Coordinator/Activity Staff assignment in that wing
- Remove automatic teacher membership if no remaining wing assignment exists

Same rules apply for Class Teacher removal.

### Conflict handling

Role Manager is sole editor. Before saving a Class/Subject Teacher assignment, system checks for existing conflicts:
- If another teacher already holds the assignment → confirmation dialog with current holder's name
- If user confirms → overwrite

Subject Tab (read-only) shows current state after any change.

### Downstream consumers

| Module | Consumes |
|---|---|
| Wing | Read-only teacher list and class-subject/class-section mapping |
| Messenger | Visibility between students, Class Teacher, Subject Teachers |
| Attendance | Class Teacher attendance scope |
| Calendar | Subject Teacher and Class Teacher event/test/task scope |
| Reports | Teacher allocation, class responsibility, subject coverage |
| My Staff | Read-only filters and columns for subjects, roles, wings |

### Save-time dialog rule

Any save that changes Subject Teacher or Class Teacher assignment must explain the affected modules.

Minimum wording: `This change updates the same assignment used by Subject Tab, Role Manager, Wing, Messenger, Attendance, Calendar, Reports, and My Staff.`

If the change replaces another staff member, the dialog must also name the staff member being replaced.

---

## School Structure Change Contract

### Covered

Changes made from My School > Session & Classes: academic year, session start/end dates, term/semester structure, class create/rename/code/order/dates/remove/archive, section create/rename/code/order/stream/remove/archive.

### Canonical consumers

| Module | Dependency |
|---|---|
| Students | Class-section enrollment and roll number structure |
| Subjects | Section-wise subject setup |
| Subject Teacher Assignment | Class + section + subject mapping |
| Class Teacher Assignment | Class + section responsibility |
| Wings | Class-to-wing grouping and derived teacher membership |
| Attendance | Class-section attendance scope and academic session dates |
| Calendar | Class, section, subject, session scheduling scope |
| Messenger | Visibility between students, staff, class teachers, subject teachers |
| Reports | Academic structure, teacher coverage, class/attendance reports |
| Role Manager | Staff assignment visibility and role scope |

### Save contract

Save behavior must match the visible UI state. If UI shows class/section removed, save must either:
- Delete the corresponding saved row after confirmation
- Archive or deactivate after confirmation
- Block the action and explain which dependency prevents removal

The system must not silently keep a removed class/section active after the user confirms save. Academic year and session date edits must save to the academic session record, not only to local editor state.

### Destructive change protocol

Before removing or archiving a class/section, system must resolve dependencies and show impact confirmation including:
- Students affected
- Subjects affected
- Subject Teachers affected
- Class Teacher affected
- Attendance records affected
- Wing assignment affected
- Calendar, report, messenger, role-management impact
- Whether the operation is delete, archive, deactivate, or blocked

Destructive change not allowed when required dependencies cannot be safely migrated, removed, or archived.

### Validation contract

Structure cannot save when blocking validation errors exist:
- Missing academic year
- Missing session dates
- Session end before start
- Empty class name
- Duplicate class code in same session
- Active class without sections
- Empty section name
- Duplicate section code inside same class
- Class dates outside academic session dates
- Class end before class start

Non-blocking warnings (visible, not blocking):
- Section has no subjects
- Class not assigned to a wing
- Class-section has no Class Teacher
- Subject has no Subject Teacher

### Save summary contract

Every save must show a summary before commit: added classes/sections, renamed, removed/archived, code changes, order changes, date changes, term structure changes, academic year changes, affected modules.

### Audit contract

Each committed structure change creates an audit entry recording: actor, timestamp, location (`My School > Session & Classes`), change type, before/after values, class/section scope, affected modules.

Required for: add, edit, reorder, date change, academic year change, archive, delete operations.