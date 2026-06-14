# Cross-Module Integration Contracts

## Purpose

This file defines shared-state rules between modules that edit or consume the same school data.

When two modules provide different gateways to the same state, they must not create duplicate records or independent copies. They must read and write the same canonical assignment store.

## Academic Assignment Contract

### Covered Assignments

This contract covers:

- Subject Teacher assignment
- Class Teacher assignment

### Editing Gateway

The sole editing gateway is **Role Manager** (My Staff > Roles tab).

The Subject Tab (My School) is now a **read-only display** of subject assignments. It does not write. All subject and class teacher assignment changes are made via Role Manager.

| Gateway | Editing Style | Primary User Mental Model |
|---|---|---|
| Role Manager | Staff-wise | "What roles and teaching assignments does this staff member hold?" |
| Subject Tab | Read-only display | "What subjects are being taught in each class-section?" |

## Subject Teacher Assignment

A Subject Teacher assignment connects:

- School
- Academic session
- Wing, derived from class
- Class
- Section
- Subject
- Staff member

Rules:

- One Class + Section + Subject has one Subject Teacher.
- One staff member can hold many Subject Teacher assignments.
- Co-teaching is not supported.
- Reassignment replaces the previous teacher only after explicit confirmation.

Required confirmation text must include:

- Existing teacher
- Replacement teacher
- Class
- Section
- Subject
- Downstream modules affected

## Class Teacher Assignment

A Class Teacher assignment connects:

- School
- Academic session
- Wing, derived from class
- Class
- Section
- Staff member

Rules:

- One Class + Section has one Class Teacher.
- One staff member can hold only one Class Teacher assignment at a time unless a future school setting allows multiple.
- Reassignment replaces the previous Class Teacher only after explicit confirmation.
- A staff member can be both Class Teacher and Subject Teacher.

## Automatic Wing Membership

When a staff member is assigned as Subject Teacher or Class Teacher:

1. Resolve the class's current wing from the Wing tab / class `wing_id`.
2. If the class has a wing, add the staff member to that wing's read-only teacher membership.
3. If the class has no wing, save the assignment without wing membership.
4. If the class later moves to another wing, the staff member's displayed wing membership follows the class.

Wing membership created by Subject Teacher or Class Teacher assignment is not manually editable from Wing.

The Wing tab only displays:

- Teacher name
- Class-section-subject mapping for Subject Teacher
- Class-section mapping for Class Teacher
- Assignment type

Examples:

- `Rajesh Kumar - Class 8A Mathematics`
- `Priya Sharma - Class Teacher 5B`
- `Anita Verma - Class 11 Commerce Accountancy`

Activity Staff with no Class Teacher or Subject Teacher assignment must display as:

- `Activity Staff - Non-assigned`

## Removal Rules

When a Subject Teacher assignment is removed:

- Remove only that Class + Section + Subject mapping.
- Keep the staff member in the wing if they still have another Subject Teacher, Class Teacher, Coordinator, or Activity Staff assignment in that wing.
- Remove the automatic teacher membership from the wing if no remaining wing assignment exists.

When a Class Teacher assignment is removed:

- Remove only that Class + Section mapping.
- Keep the staff member in the wing if they still have another Subject Teacher, Class Teacher, Coordinator, or Activity Staff assignment in that wing.
- Remove the automatic teacher membership from the wing if no remaining wing assignment exists.

## Conflict Handling

Role Manager is the sole editor. Before saving a Class Teacher or Subject Teacher assignment, the system checks for existing conflicts:

- If another teacher already holds the assignment → show confirmation dialog with current holder's name.
- If the user confirms → overwrite the previous assignment.

The Subject Tab (read-only) shows the current state after any change.

## Downstream Consumers

| Module | Consumes |
|---|---|
| Wing | Read-only teacher list and class-subject/class-section mapping |
| Messenger | Visibility between students, Class Teacher, and Subject Teachers |
| Attendance | Class Teacher attendance scope |
| Calendar | Subject Teacher and Class Teacher event/test/task scope |
| Reports | Teacher allocation, class responsibility, subject coverage |
| My Staff | Read-only filters and columns for subjects, roles, and wings |

## Save-Time Dialog Rule

Any save that changes Subject Teacher or Class Teacher assignment must explain the affected modules.

Minimum wording:

> This change updates the same assignment used by Subject Tab, Role Manager, Wing, Messenger, Attendance, Calendar, Reports, and My Staff.

If the change replaces another staff member, the dialog must also name the staff member being replaced.

## School Structure Change Contract

### Covered Structure

This contract covers changes made from My School > Session & Classes:

- Academic year
- Session start date
- Session end date
- Term or semester structure
- Class creation
- Class rename
- Class code change
- Class order change
- Class start and end date change
- Class removal or archive
- Section creation
- Section rename
- Section code change
- Section order change
- Section stream change
- Section removal or archive

### Canonical Consumers

The Session & Classes structure is consumed by:

| Module | Dependency |
|---|---|
| Students | Class-section enrollment and roll number structure |
| Subjects | Section-wise subject setup |
| Subject Teacher Assignment | Class + section + subject mapping |
| Class Teacher Assignment | Class + section responsibility |
| Wings | Class-to-wing grouping and derived teacher membership |
| Attendance | Class-section attendance scope and academic session dates |
| Calendar | Class, section, subject, and session scheduling scope |
| Messenger | Visibility between students, staff, class teachers, and subject teachers |
| Reports | Academic structure, teacher coverage, class reports, attendance reports |
| Role Manager | Staff assignment visibility and role scope |

### Save Contract

The save behavior must match the visible UI state.

If the UI shows that a class or section has been removed, save must either:

- Delete the corresponding saved row after confirmation.
- Archive or deactivate the row after confirmation.
- Block the action and explain which dependency prevents removal.

The system must not silently keep a removed class or section active after the user confirms save.

Academic year and session date edits must save to the academic session record, not only to local editor state.

### Destructive Change Protocol

Before removing or archiving a class or section, the system must resolve dependencies and show an impact confirmation.

The confirmation must include:

- Students affected
- Subjects affected
- Subject Teachers affected
- Class Teacher affected
- Attendance records affected
- Wing assignment affected
- Calendar, report, messenger, and role-management impact
- Whether the operation is delete, archive, deactivate, or blocked

Destructive change is not allowed when required dependencies cannot be safely migrated, removed, or archived.

### Validation Contract

The structure cannot be saved when blocking validation errors exist.

Blocking errors include:

- Missing academic year
- Missing session dates
- Session end date before session start date
- Empty class name
- Duplicate class code in the same session
- Active class without sections
- Empty section name
- Duplicate section code inside the same class
- Class dates outside academic session dates
- Class end date before class start date

Non-blocking warnings should remain visible for incomplete setup:

- Section has no subjects
- Class is not assigned to a wing
- Class-section has no Class Teacher
- Subject has no Subject Teacher

### Save Summary Contract

Every save must show a summary before commit.

The summary must include:

- Added classes and sections
- Renamed classes and sections
- Removed or archived classes and sections
- Code changes
- Order changes
- Date changes
- Term structure changes
- Academic year changes
- Affected modules

### Audit Contract

Each committed structure change must create an audit entry.

The audit entry must record:

- Actor
- Timestamp
- Location: My School > Session & Classes
- Change type
- Before value
- After value
- Class and section scope
- Affected modules

Audit records are required for add, edit, reorder, date change, academic year change, archive, and delete operations.
