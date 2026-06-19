# SHARP — Screen Flow Map (MVP)

> Updated 2026-06-17. All MVP modules built: Auth, Onboarding, Messenger, **Homework**, **Attendance**, **Calendar**, Student Management, Role Manager.
> [S] Screen | [A] Action | [C] Condition | [→] Leads to | [!] Rule

## Flow 1 — Super Admin
```
[S] Super Admin Login (`/auth/superadmin`)
  ├── [A] email + password
  ├── [C] 2FA? → OTP
  └── [→] Dashboard
        ├── [S] Schools list (activate/deactivate/delete/view 👁)
        ├── [S] Create Principal ID (school basics + creds)
        └── [S] Billing (Phase 2)
[!] Cannot enter any school module or view school data.
```

## Flow 2 — Principal
### 2A First Login
```
[S] Principal Login → email + temp password → 2FA? OTP
  → [→] Forced PIN Setup [!] no skip
  → [C] onboarding_complete? → Dashboard | No → Onboarding (2B)
```

### 2B Onboarding — see docs/ONBOARDING.md
Wizard: School → Structure (Classes + Sessions) → Subjects → Review.

### 2C Daily Login
```
[S] Principal Login → email (pre-filled) + PIN
  → [C] session expired / new device? → OTP → PIN
  → [→] Dashboard
```

### 2D Dashboard
Dynamic cards: school overview (attendance %, active users), pending alerts, quick actions.
[→] Messenger | Homework | Attendance | Calendar | Students | My Staff | Role Manager | Settings

## Flow 3 — Staff (Admin / Master Admin / Teacher / Non-Teaching)
### 3A First Login
```
[S] Staff Login
  → [C] first time? → School Selection (State → City → School, local save) → white-label
  → [A] email + password
  → [C] 3 wrong OTP? → locked → contact Principal/Admin
  → [→] Forced PIN [!] no skip
  → [→] Dashboard
```

### 3B Daily Login
School auto-detected, white-label, PIN only. OTP on expiry/new device. → Dashboard.

### 3C Forgot PIN
Registered mobile → OTP → new PIN. Mobile changed → "Contact your Admin or Principal". [!] Teachers cannot change own mobile.

### 3D Dashboard (per role)
- Admin / Master Admin: school overview, students/staff, attendance summary, homework overview, Calendar (full).
- Class Teacher: quick attendance mark, pending homework reviews, my class, messenger, Calendar (read + create own class events).
- Subject Teacher: assigned subjects, homework assigned, messenger, Calendar (read).
- Non-Teaching: role cards (transport/fees) + messenger + Calendar (read).
- All staff: Messenger, Profile, Notifications, Calendar.

## Flow 4 — Student / Parent
### 4A First Login
```
[S] Student Login (mobile only)
  → [C] first time? → School Selection → white-label
  → [A] Student ID or mobile → OTP
  → [C] 3 wrong OTP? → locked → school Admin
  → [→] Forced PIN [!] no skip
  → [→] Dashboard
```

### 4B Daily Login
School auto-detected, white-label, PIN. OTP on expiry/new device. → Dashboard.
[!] One account per enrollment, no parent login.

### 4C Dashboard
Today's attendance, pending homework, recent broadcasts. [→] Messenger | Homework | Attendance | Calendar.

## Flow 5 — Messenger
```
[S] Chat List (search by name/subject)
  → Individual | Group | Broadcast
[S] Individual Chat → text / image ≤2MB / PDF
  → Delete own ≤2 min only
  → Status Sent → Delivered → Read
  [!] After 2 min = permanent
[S] Group Chat → teacher/admin-formed; students send only
[S] Broadcast → one-way school→students; student reply = private thread
```

## Flow 6 — Homework
```
TEACHER:
[S] List — filter class/subject/date/status
  → Create (class/section/subject + instructions + attachment + due date)
  → Push notification to students
  → Submission Inbox (submitted/pending/late) → View → marks + comment → Mark checked
    [!] Once checked = locked without Admin override
  → Class completion report

STUDENT:
[S] List — tabs Pending | Submitted | Late
  → Detail → view + (upload photo / type / "done on paper")
  → After due date = auto Late
  [!] Locked after teacher review
```

## Flow 7 — Attendance
```
TEACHER (Class Teacher):
[S] Attendance — today's class
  → Mark each: Present / Absent / Leave → Submit
  → Edit ≤24h with reason
  → Edit >24h needs Admin override
  → 3 consecutive absent → auto alert Student + Admin

STUDENT:
[S] My Attendance — monthly calendar (G=Present, R=Absent, Y=Leave)
  → % (current month + year)
  → <75% = warning flag

ADMIN:
[S] Dashboard — class summary (today), low-attendance + consecutive alerts
  → Export PDF/Excel
```

## Flow 7B — Calendar
```
PRINCIPAL: full read/write on 7 event types.
  → Declare Holiday (scope: all/students/staff/wing/class/individual)
  → Schedule Meeting (invite staff)
  → Assign Task (deadline + assignees)
  → Announce Event (school or class)
  → Working Override (mark holiday as working)
  → Historical view (click past date)
  → Notifications: immediate on save, or scheduled

TEACHER: read school events, create class events for own class, task checklist sidebar.

STUDENT: read-only events calendar.

Event types: holiday | working_override | school_event | class_event | staff_meeting | staff_task | exam_timetable
Scope: all | students | staff | wing | class | individual

Attendance gate (runs before Attendance screen):
  1. Today in class session start/end?
  2. Today in school's working week?
  3. Holiday for today applies to this class?
  → Any fail → "No school today — [reason]" — locked.

[!] Holidays = future dates only. Past = immutable.
```

## Flow 8 — Student Management
### 8A My Students Dashboard
Stat cards: Total | Active | Inactive | Classes. Toolbar: Search (name/ID/App ID), Filter (class/section/status), Sort (name/class/roll/date), Bulk Import (14-col CSV, all-or-nothing), Export .xlsx (column picker + sequence).

Table: Photo/Initials | Name+App ID | Class&Section | Father | Joined | Status | Completion bar | Actions. Profile bar = blue (80%+) / green (100%).

[A] New Student → 3-Stage Wizard (8C). [A] Click name → Profile (8B).

[!] House/Stream/Wing NOT in creation — assigned post-creation (8D).

### 8B Student Profile
Breadcrumb. Header: photo, name, App ID, class&section, status, completion bar. Stage summary. Info cards (read-only) by stage. Academic assignment. Account & login (masked). Actions: Edit, Academic Assignment, Delete.

[!] Login Mobile masked (e.g. 98*****210). Full visible only to Principal + Master Admin.

### 8C 3-Stage Wizard
Large Dialog with stage tabs + completion bar.

**Stage 1 — Account Creation (40%):**
- 1A Identity: App ID (auto, read-only), Student ID No, First/Middle/Last, Gender, DOB.
- 1B Contact: Father name+mobile (+ WhatsApp), Mother name+mobile (+ WhatsApp), Emergency name/number/relation, "Same as Father's Mobile" checkbox, emergency WhatsApp, Parent email.
- 1C Academic: Class (from Session), Section, Roll No, Admission Date (auto today, editable).
- 1D Login Setup: Login Mobile (OTP), "Use Father's Mobile" button, Status Active/Inactive.
- 1E Social: Category (General/SC/ST/OBC/Subcaste → subcaste text), Religion/Belief (Other → specify), Nationality (Indian default), Mother Tongue, Medium, Minority toggle, Only Child toggle.

**Stage 2 — Operational Profile (40%):**
- 2A Photo & Blood Group: photo ≤500KB PNG/JPG, blood group.
- 2B Address: local (req), permanent.
- 2C Parent Extended: father/mother qualification, occupation, photo.
- 2D Transfer: previous school → board, last exam, leaving cert.
- 2E Siblings: +Add Sibling (max 3): name, class, school.
- 2F Transport: opted toggle → bus route + stop.
- 2G Documents (7 checklist): birth cert, student photo, caste cert, marksheet, leaving cert, father photo, mother photo. Each: received toggle + upload.

**Stage 3 — Full Record (20%):**
- 3A Govt IDs: Aadhar (12 digits, 999999999999 if unavailable), MP → SSSM ID + card upload + Family ID.
- 3B Disability: type (None/Locomotor/Visual/Hearing/Other → spec) → cert upload.
- 3C Health: height (cm), weight (kg).
- 3D Minority: cert received toggle + upload.
- 3E UDISE Welfare: free textbooks, midday meal, scholarship, free uniforms (Y/N) → scholarship name.
- 3F Bank: A/C, name, branch, passbook upload.

Completion: Stage 1 = 40%, Stage 2 = 40% (photo + local address + 7 docs), Stage 3 = 20% (aadhar + disability + height + weight + welfare).

[A] Stage "Save & Continue" validates + moves. [A] "Create Student" / "Save Changes" on Stage 3.

[!] Login Mobile: Principal/Master Admin/Admin only. Bulk import: 14-col CSV, all-or-nothing, intra-file duplicate login_mobile = warning only.

### 8D Academic Assignment
Post-create. House (from Additional Info), Stream (from Session, filtered by class), Wing (from Session, if configured). Save → reflected in Profile.

[!] Separate from creation by design.

### 8E Export
Column picker (toggle), sequence (drag-reorder). Default: App ID, Full Name (2 cols checked). Download .xlsx for current filter.
