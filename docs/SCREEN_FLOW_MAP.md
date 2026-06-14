# SHARP — Screen Flow Map (MVP)

> Last updated: May 2026
> **MVP Scope:** Login → Onboarding → Messenger → Homework → Attendance → Student Management
> [S] Screen | [A] Action | [C] Condition | [→] Leads to | [!] Critical rule

---

## FLOW 1 — SUPER ADMIN

```
[S] Super Admin Login (separate URL)
    ├── [A] Enter email + password
    ├── [C] 2FA enabled? → Enter OTP
    └── [→] Super Admin Dashboard
            ├── [S] All Schools List — activate / deactivate / delete / view (read only)
            ├── [S] Create Principal ID
            │       ├── [A] Fill school basics + Principal credentials
            │       └── [→] System generates ID + sends credentials via email + SMS
            └── [S] Billing & Subscriptions

[!] Super Admin cannot enter any school's modules or view any school data.
```

---

## FLOW 2 — PRINCIPAL

### 2A — First Login
```
[S] Principal Login
    ├── [A] Enter email + temporary password
    ├── [C] 2FA enabled? → Enter OTP
    ├── [→] Forced PIN Setup — enter + confirm 6-digit PIN [!] cannot skip
    └── [C] Onboarding complete? → Principal Dashboard | No → Onboarding (2B)
```

### 2B — School Onboarding (one-time wizard)

Full spec: docs/ONBOARDING.md

### 2C — Daily Login
```
[S] Principal Login
    ├── [A] Enter email (pre-filled) + 6-digit PIN
    ├── [C] Session expired / new device? → OTP → PIN
    └── [→] Principal Dashboard
```

### 2D — Principal Dashboard
```
[S] Principal Dashboard (dynamic cards)
    ├── School overview (attendance %, active users), pending alerts, quick actions
    └── [→] Messenger | Homework | Attendance | Calendar | Staff Management | Student Management | Roles & Permissions | Settings
```

---

## FLOW 3 — STAFF (Admin / Master Admin / Teacher / Non-Teaching)

### 3A — First Login
```
[S] Staff Login
    ├── [C] First time? → School Selection: State → City → School (saved to local storage) → white-label branding shown
    ├── [A] Enter email + password
    ├── [C] Wrong OTP 3 times? → Locked → Contact Principal/Admin
    ├── [→] Forced PIN Setup [!] cannot skip
    └── [→] Staff Dashboard
```

### 3B — Daily Login
```
[S] Staff Login
    ├── School auto-detected, logo + school name shown (white-label)
    ├── [A] Enter 6-digit PIN
    ├── [C] Session expired / new device? → OTP → PIN
    └── [→] Staff Dashboard (dynamically rendered per role)
```

### 3C — Forgot PIN
```
[S] Forgot PIN
    ├── [A] Enter registered mobile → OTP → new 6-digit PIN
    ├── [C] Mobile changed? → "Contact your Admin or Principal"
    └── [!] Teachers cannot update own mobile. Only Principal or Admin can.
```

### 3D — Staff Dashboard (per role)
```
Admin / Master Admin  → school overview, student/staff management, attendance summary, homework overview, Calendar (full access)
Class Teacher         → quick attendance mark, pending homework reviews, my class, messenger, Calendar (read + create own class events)
Subject Teacher       → assigned subjects, homework assigned, messenger, Calendar (read-only)
Non-Teaching          → role-specific cards (transport, fees, etc.) + messenger, Calendar (read-only)
All Staff             → Messenger, My Profile, Notifications, Calendar
```

---

## FLOW 4 — STUDENT / PARENT

### 4A — First Login
```
[S] Student Login (mobile only)
    ├── [C] First time? → School Selection: State → City → School (saved to local storage) → white-label branding shown
    ├── [A] Enter Student ID or mobile → OTP
    ├── [C] Wrong OTP 3 times? → Locked → Contact school Admin
    ├── [→] Forced PIN Setup [!] cannot skip
    └── [→] Student Dashboard
```

### 4B — Daily Login
```
[S] Student Login
    ├── School auto-detected, logo + school name shown (white-label)
    ├── [A] Enter 6-digit PIN
    ├── [C] Session expired / new device? → OTP → PIN
    └── [→] Student Dashboard

[!] One account per enrollment. No distinction between student and parent.
```

### 4C — Student Dashboard
```
[S] Student Dashboard
    ├── Today's attendance status
    ├── Pending homework (count + due dates)
    ├── Recent notices / broadcasts
    └── [→] Messenger | Homework | Attendance | Calendar
```

---

## FLOW 5 — MESSENGER

```
[S] Chat List
    ├── Individual chats, group chats, broadcast channels
    └── [A] Search by name or subject

[S] Individual Chat
    ├── [A] Send text / attach image (max 2MB) / attach PDF
    ├── [A] Delete own message within 2 minutes only
    ├── Status: Sent → Delivered → Read
    └── [!] After 2 minutes, messages are permanent

[S] Group Chat
    ├── Formed by Teacher or Admin — not students
    └── Students can send in teacher-formed groups only

[S] Broadcast Channel
    ├── One-way: school → students
    └── Student reply → private thread (student + broadcast admin only)
```

---

## FLOW 6 — HOMEWORK

```
TEACHER:

[S] Homework List — filter by class / subject / date / status
    └── [→] Create Homework
            ├── Select class, section, subject
            ├── Write instructions + optional attachment (PDF/image)
            ├── Set due date → Assign → push notification to students
            └── [→] Submission Inbox
                    ├── Student list: submitted / pending / late
                    ├── [→] View submission → add marks + comment → Mark checked
                    │       [!] Once checked, cannot uncheck without Admin override
                    └── Class completion report

STUDENT:

[S] Homework List — tabs: Pending | Submitted | Late
    └── [→] Homework Detail
            ├── View instructions + attachment
            ├── [A] Upload photo / type answer / mark as "done on paper"
            ├── [C] After due date? → marked Late automatically
            └── [!] Cannot edit after teacher has reviewed
```

---

## FLOW 7 — ATTENDANCE

```
TEACHER (Class Teacher):

[S] Attendance Screen
    ├── Today's class shown by default
    ├── [A] Mark each student: Present / Absent / Leave → Submit
    ├── [C] Edit within 24hrs? → Allowed with reason note
    ├── [C] Edit after 24hrs? → Admin override required
    └── [C] 3 consecutive absences? → Auto alert to Student + Admin

STUDENT:

[S] My Attendance
    ├── Monthly calendar (Green = Present, Red = Absent, Yellow = Leave)
    ├── Attendance % — current month + academic year
    └── [C] Below 75%? → Warning flag shown

ADMIN:

[S] Attendance Dashboard
    ├── Class-wise summary (today)
    ├── Low attendance + consecutive absence alerts
    └── [A] Export report (PDF or Excel)
```

---

## FLOW 7B — CALENDAR

```
PRINCIPAL:

[S] Calendar View (command center)
    ├── Full read + write on all event types
    ├── [→] Declare Holiday — scope: all / students / staff / wing / class / individual
    ├── [→] Schedule Meeting — invite staff members
    ├── [→] Assign Task — deadline + assignee(s)
    ├── [→] Announce Event — school-wide or class-scoped
    ├── [→] Working Override — mark a holiday as a working day
    ├── Historical view — click any past date to see events declared
    └── [→] Notifications — sent immediately on save (or scheduled for future)

TEACHER:

[S] Calendar View (my work)
    ├── Read-only on all school events
    ├── [→] Create Class Event — for own class only
    ├── Task checklist sidebar — deadline tasks, mark done with checkbox
    └── [A] Click any date → see events for that date

STUDENT:

[S] Calendar View (my school life)
    ├── Read-only — school events + class events + holidays
    └── [A] Click any date → see events for that date

EVENT TYPES:
  holiday             → blocks attendance marking for affected group
  working_override    → non-working day declared as working
  school_event        → Annual Function, Sports Day, PTM
  class_event         → class-specific activity (teacher creates own class only)
  staff_meeting       → invite selected staff, notification on creation
  staff_task          → deadline + assignee, marked done by assignee
  exam_timetable      → announcement only

SCOPE RULES:
  all        → entire school
  students   → students off, teachers still report
  staff      → students off, staff work (half-day fraction stored)
  wing       → e.g. Junior wing off, Senior wing working
  class      → specific class(es)
  individual → specific staff member(s)

ATTENDANCE GATE (runs before Attendance screen renders):
  1. Is today within this class's session start/end dates?
  2. Is today a working day in this school's defined working week?
  3. Is there a holiday event for today that applies to this class?
  → Any check fails → "No school today — [reason]" — attendance locked.

[!] Holidays are declared for future dates only. Past dates are immutable.

---

## FLOW 8 — STUDENT MANAGEMENT (Admin / Master Admin / Principal)

### 8A — My Students Dashboard
```
[S] My Students Dashboard
    ├── Stat cards: Total students | Active | Inactive/Suspended | Classes count
    ├── Toolbar
    │       ├── Search — by name, Student ID, Student App ID
    │       ├── Filter — Class | Section | Status
    │       ├── Sort — Name A→Z | Name Z→A | Class | Roll No. | Admission date
    │       ├── Bulk Import — download 14-col template CSV, drag-drop upload,
    │       │   all-or-nothing validation, error report on rejection
    │       └── Export .xlsx — column picker with sequence control
    ├── Student table
    │       Columns: Photo/Initials | Name + Student App ID | Class & Section |
    │                Father details | Joined date | Status | Completion bar | Actions
    │       Profile completion bar per row (40/40/20) — colored: blue (80%+) / green (100%)
    │       [A] Click student name → Student Profile (8B)
    └── [A] New Student → 3-Stage Wizard Dialog (8C)

[!] House, Stream, and Wing are NOT assigned during creation.
    They are assigned post-creation via Academic Assignment (8D).
```

### 8B — Student Profile (view-only)
```
[S] Student Profile — full page, navigated from dashboard
    ├── Breadcrumb: My Students Dashboard → [Student Name]
    ├── Header: photo, full name, Student App ID, class & section,
    │           status badge, profile completion bar (40/40/20)
    ├── Stage progress summary (which stages complete, which partial/empty)
    ├── Info cards (read-only, organized by stage):
    │       ├── Stage 1: Student identity, contact details, academic placement,
    │       │            login mobile (masked), social profile
    │       ├── Stage 2: Photo, blood group, address, parent extended info,
    │       │            transfer details (if applicable), siblings, transport,
    │       │            documents received checklist (7 items, received/not)
    │       ├── Stage 3: Govt IDs (Aadhar/SSSM/Family), disability, health,
    │       │            minority details (if applicable), UDISE welfare flags, bank
    │       ├── Academic assignment (house, stream, wing — or "Not yet assigned")
    │       └── Account & login (login mobile masked, account status)
    ├── [A] Edit → 3-Stage Wizard (8C, pre-filled, all stages accessible)
    ├── [A] Academic Assignment → 8D
    └── [A] Delete → confirmation dialog → removes student record

[!] Login Mobile shown masked (e.g. 98*****210). Full number visible only to Principal and Master Admin.
```

### 8C — Student Creation / Edit Modal (3-Stage Wizard)
```
[S] Student Modal — creation (blank) or edit (pre-filled)
    Opens as large Dialog with Stage tabs at top + profile completion bar.
    Profile completion bar (Stage 1=40%, Stage 2=40%, Stage 3=20%) shown at top of dialog.
    Stages: [Stage 1: Account Creation] [Stage 2: Operational Profile] [Stage 3: Full Record]

    ┌─ STAGE 1 — ACCOUNT CREATION ─────────────────────────────────────────────┐
    │ Tab 1A: Student Identity                                                  │
    │         Student App ID — auto-generated, read-only                        │
    │         Student ID No., First Name, Middle Name, Last Name               │
    │         Gender, Date of Birth                                            │
    │                                                                          │
    │ Tab 1B: Contact Details                                                   │
    │         Father: Full Name, Mobile (+ WhatsApp checkbox)                   │
    │         Mother: Full Name, Mobile (+ WhatsApp checkbox)                   │
    │         Emergency: Name, Number, Relation                                 │
    │         "Same as Father's Mobile" checkbox → copies father's number      │
    │         Emergency WhatsApp checkbox, Parent/Guardian Email               │
    │                                                                          │
    │ Tab 1C: Academic Placement                                               │
    │         Class (from Session Form), Section, Roll Number                   │
    │         Admission Date (auto-fills today, editable)                       │
    │                                                                          │
    │ Tab 1D: Login Setup                                                      │
    │         Login Mobile (OTP)                                               │
    │         "Use Father's Mobile" button → auto-fills from father field       │
    │         Account Status: Active / Inactive                                │
    │                                                                          │
    │ Tab 1E: Social Profile                                                   │
    │         Category (General/SC/ST/OBC/Subcaste)                             │
    │         [C] Category=Subcaste → Subcaste text field                      │
    │         Religion / Belief dropdown                                       │
    │         [C] Religion=Other → religionSpecify text field                  │
    │         Nationality (default: Indian), Mother Tongue,                    │
    │         Medium of Instruction, Minority toggle, Only Child toggle        │
    └──────────────────────────────────────────────────────────────────────────┘

    ┌─ STAGE 2 — OPERATIONAL PROFILE (complete within first week) ────────────┐
    │ Tab 2A: Photo & Blood Group                                             │
    │         Photo upload (max 500KB PNG/JPG) — upload/preview/remove pattern │
    │         Blood Group dropdown (A+/A-/B+/B-/AB+/AB-/O+/O-)                  │
    │                                                                          │
    │ Tab 2B: Address                                                         │
    │         Local Address (required), Permanent Address (if different)       │
    │                                                                          │
    │ Tab 2C: Parent / Guardian Extended                                       │
    │         Father: Qualification, Occupation, Photo upload                  │
    │         Mother: Qualification, Occupation, Photo upload                  │
    │                                                                          │
    │ Tab 2D: Transfer Details                                                 │
    │         [C] Previous School Name filled → section expands:              │
    │           Board, Last Exam Class/Year/Result/Percentage,                │
    │           School Leaving Certificate upload                              │
    │                                                                          │
    │ Tab 2E: Siblings                                                         │
    │         "+ Add Sibling" button — max 3 rows, each row individually       │
    │         removable. Fields: Sibling Full Name, Class, School             │
    │                                                                          │
    │ Tab 2F: Transport                                                        │
    │         "Opted for Transport" toggle                                     │
    │         [C] Opted=Yes → Bus Route + Bus Stop fields appear              │
    │                                                                          │
    │ Tab 2G: Documents Received (7-row checklist)                             │
    │         Each row: Received toggle (Yes/No) + Upload button              │
    │         Birth Cert | Student Photo | Caste Cert | Marksheet |           │
    │         School Leaving Cert | Father's Photo | Mother's Photo           │
    │         Every uploaded doc has: thumbnail preview + remove + download   │
    └──────────────────────────────────────────────────────────────────────────┘

    ┌─ STAGE 3 — FULL RECORD (compliance / UDISE — no operational dep) ──────┐
    │ Tab 3A: Government IDs                                                   │
    │         Aadhar No. (12 digits, no upload — enter 999999999999 if        │
    │         unavailable per UDISE requirement)                               │
    │         [C] school_state=MP → SSSM ID (with card upload), Family ID    │
    │                                                                          │
    │ Tab 3B: Disability                                                       │
    │         Type: None / Locomotor / Visual / Hearing / Other               │
    │         [C] Type=Other → Disability Specification text field           │
    │         [C] Type not None → Disability Certificate upload              │
    │                                                                          │
    │ Tab 3C: Health (UDISE child health reporting)                           │
    │         Height (cm), Weight (kg)                                         │
    │                                                                          │
    │ Tab 3D: Minority Details                                                │
    │         [C] Minority=Yes (set in Stage 1) → section appears:            │
    │           Certificate Received toggle, Certificate upload               │
    │                                                                          │
    │ Tab 3E: UDISE Welfare Flags                                             │
    │         Free Textbooks | Midday Meal | Scholarship | Free Uniforms      │
    │         (each: Yes/No toggle)                                            │
    │         [C] Receives Scholarship=Yes → Scholarship Name field          │
    │                                                                          │
    │ Tab 3F: Bank Details                                                     │
    │         Student Bank A/C No., Bank Name, Bank Branch,                   │
    │         Bank Passbook upload                                             │
    └──────────────────────────────────────────────────────────────────────────┘

    Profile Completion Bar (on every student card + profile page header):
    - Stage 1 = 40% → all required Stage 1 fields filled
    - Stage 2 = 40% → Photo + Local Address + all 7 document checklist items done
    - Stage 3 = 20% → Aadhar + Disability Type + Height + Weight + Welfare Flags

    [A] Stage 1 "Save & Continue" → validates Stage 1 → moves to Stage 2
    [A] Stage 2 "Save & Continue" → moves to Stage 3
    [A] Stage 3 "Create Student" / "Save Changes" → validates all → saves
    [A] Back button on each stage tab → navigates to previous stage

    [A] Create → generates Student App ID → student appears in dashboard at 40%
    [A] Edit → all 3 stages accessible, completion bar updates live

[!] Login Mobile editable only by Principal, Master Admin, Admin. Not by student.
[!] Bulk import: template = 14-column CSV. All-or-nothing. Error file with
    error_reason column + summary sheet on rejection. Intra-file duplicate
    login_mobile = warning (not hard error).
```

### 8D — Academic Assignment (post-creation)
```
[S] Academic Assignment — accessed from Student Profile
    ├── House — dropdown (from Additional Info Form)
    ├── Stream — dropdown (from Session Form, filtered by class)
    └── Wing — dropdown (from Session Form, if configured)

    [A] Save → updates student record → reflected in Student Profile

[!] This screen is separate from the creation form by design.
    Assignment can be done at any time after the student record exists.
```

### 8E — Export (.xlsx)
```
[S] Export Modal — triggered from My Students Dashboard toolbar
    ├── Column picker — toggle which columns to include
    ├── Sequence control — drag to reorder column output
    ├── Default columns: Student App ID, Full Name (2 columns checked by default)
    └── [A] Download → generates .xlsx with selected columns for currently filtered student list

[!] Export respects active filters — exports only what is visible in the current table view.
```