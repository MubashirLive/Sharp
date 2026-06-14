# SHARP — Product Requirements Document

> Last updated: May 2026
> **Docs:** `/docs/PERMISSION_MATRIX.md` — check before any feature. `/docs/SCREEN_FLOW_MAP.md` — check before any UI.

---

## SECTION 1 — ROLES & ACCESS

| Role | Created By | Platform |
|---|---|---|
| Super Admin | Internal (SHARP team) | Web only |
| Principal | Super Admin | Web + Mobile |
| Master Admin | Principal | Web + Mobile |
| Admin | Principal / Master Admin | Web + Mobile |
| Teacher / Non-Teaching Staff | Principal / Master Admin / Admin | Web + Mobile |
| Student | Principal / Master Admin / Admin | Mobile only |

**Rules:**
- No self sign-up. All accounts created by authorised roles only.
- Super Admin fully isolated — no access to any school's modules, data, or operations.
- Student = one account per enrollment. No separate parent login.
- PIN: 6-digit numeric only. Never stored as plain text.
- Session: 30 days. Daily login = PIN only. OTP re-triggered on expiry or new device.
- Forced PIN setup on first login — cannot be skipped by any role.
- Teachers cannot update their own registered mobile. Only Principal or Admin can.

**Role capabilities:** Full detail in docs/SUPERADMIN.md.
- **Super Admin** — activate/deactivate/delete schools, create Principal IDs, edit principal credentials, manage billing. Cannot enter any school.
- **Principal** — full access within their school. Login: Email + temp password → PIN. Principal credential changes managed by Super Admin (see docs/SUPERADMIN.md).
- **Master Admin** — same as Principal except cannot delete school or manage billing. Login: OTP → PIN.
- **Admin** — day-to-day operations. Permissions set by Principal. Login: OTP → PIN.
- **Teacher** — own classes, students, homework, attendance only. Login: OTP → PIN.
- **Non-Teaching Staff** — access depends on designation. Login: OTP → PIN.
- **Student** — own attendance, homework, assigned chat only. Mobile only. Login: OTP → PIN.

**Login screens (5 separate):** Full spec in docs/SUPERADMIN.md.

| Screen | Who | Platform |
|---|---|---|
| Super Admin Login | SHARP team only | Separate URL (`/auth/superadmin`) |
| Principal Login | Principal | Web + Mobile |
| Staff Login | Admin, Master Admin, Teacher, Non-Teaching | Web + Mobile |
| Student Login | Student | Mobile only |

- Staff and Student first login: State → City → School selection (saved to local storage). School logo + name shown (white-label) until credentials are entered — then SHARP branding shown.
- Principal first login: enters credentials directly → redirected to onboarding.
- No role dropdown on any login screen. Role is determined by the user's profile in the database.

**PIN Recovery:** See docs/SUPERADMIN.md for Super Admin. Other roles via Mobile OTP only.

---

## SECTION 2 — ARCHITECTURE RULES (Day 1, non-negotiable)

- Every school fully isolated — School A can never access School B's data.
- RLS enforced at database level on every table — not just application code.
- Each school gets their own subdomain (`greenvalley.sharpschool.com`). Dev: detected via selection screen.
- Schools can upload own logo, colors, name.
- Multi-branch support under one account.
- Scalable to 500+ schools simultaneously.
- Student data encrypted at rest. PIN hashes and bank details use additional app-level encryption.
- UUID primary keys on all tables. snake_case for all table and column names.
- Mobile-first UI — 360px viewport minimum.
- Hindi + English minimum from launch.

---

## SECTION 3 — ONBOARDING & SETUP

**One-time setup. Steps fixed — cannot be skipped.**

See docs/ONBOARDING.md for full onboarding specification.

**Bulk Import — Phase 2:** Full spec will be added when Phase 2 begins.

### Student Form
See `docs/STUDENT_FORM.md` — full field-by-field spec.

### Staff Form
See docs/STAFF_FORM.md

## SECTION 4 — CALENDAR ✅ DONE (Phase 1 MVP)
See `docs/CALENDAR.md` — complete spec including schema, event types, RLS policies, notification flow, and Phase 1 vs Phase 2 scope.

**What's built:**
- `school_calendar` table with working week definition (per-school)
- `calendar_events` table with all 7 event types
- `national_holidays` seed data (shared, read-only per school)
- `class_session_dates` table (per-class session boundaries)
- `event_task_completions` table (task done/not-done tracking)
- All RLS policies enforced
- Principal view: full read/write (holiday, meeting, task, event, working override)
- Teacher view: read-only + create class events for own class + task checklist
- Student view: read-only events calendar
- Attendance gate: 3-check query before attendance screen renders
- Notification: immediate send via Edge Function (`notify-calendar-event`)
- UI: hover tooltip (desktop), tap panel (mobile), dot colour coding

**Phase 2 still to build:** student attendance overlay on calendar, scheduled notifications, exam timetable marks link.

## SECTION 5 — MESSENGER

**Rules:**
- Super Admin has zero access.
- Students can only message their assigned teacher and designated admin staff.
- Students cannot see or message other students.
- Students can send in teacher-formed groups — not groups they create.
- Teachers can only message students of their own assigned class.
- Admin can message anyone in the school.
- Messages cannot be deleted after 2 minutes.
- Media: images and PDFs only — no direct video upload.
- Broadcasts are one-way (school → students). Each student reply goes into a private thread visible only to them and the broadcast admin.
- Broadcasts auto-created: class+section broadcast (Class Teacher as admin), class+subject broadcast (Subject Teacher as admin).
- Read receipts. Message status: Sent / Delivered / Read.
- Chat logs archived for safety audits.

| Role | Can Message | Form Group | Form Broadcast |
|---|---|---|---|
| Super Admin | ❌ | ❌ | ❌ |
| Student | Assigned teacher + designated admin only | ❌ | ❌ |
| Teacher | Own class only | ⚙️ If permitted | ⚙️ If permitted |
| Admin | Anyone in school | ⚙️ If permitted | ⚙️ If permitted |
| Master Admin | Anyone in school | ✅ | ✅ |
| Principal | Anyone in school | ✅ | ✅ |

---

## SECTION 6 — HOMEWORK

**Teacher:**
- Assigns to own class/subject only.
- Types: text instructions, file attachment (PDF/image), or "written in copy" (no digital submission).
- Notified when student submits.
- Once marked checked → cannot uncheck without Admin override.

**Student:**
- After due date → automatically marked Late.
- Cannot edit submission after teacher has reviewed it.
- Submission types: upload photo, type answer, mark as "done on paper".

---

## SECTION 7 — ATTENDANCE

**Teacher (Class Teacher):**
- Marked once per day (full-day) or per period — school chooses during setup.
- Edit within 24 hours: allowed with reason note.
- Edit after 24 hours: requires Admin override.
- 3 consecutive absences → auto alert to Student account + Admin.
- Below 75% → warning flag on student profile.

**Student:**
- Monthly calendar view (Green = Present, Red = Absent, Yellow = Leave).
- Attendance % (current month + academic year).
- Below 75% → warning flag shown.

**Admin:**
- Class-wise attendance summary.
- Low attendance and consecutive absence alerts.
- Export report (PDF or Excel).

---
## SECTION 8 — ROLES AND PERMISSIONS
**Role & Permissions** — Set by Principal only.

| Field | Type | Required | Notes |
|---|---|---|---|
| Primary Role | Dropdown | ✅ | Admin, Teacher, Non-Teaching Staff, etc. |
| Additional Roles | Multi-select | ❌ | e.g. Class Teacher + House Master |
| Can Add/Edit Staff? | Toggle | ✅ | Default: No |
| Can Send Broadcasts? | Toggle | ✅ | Default: No |

**Teaching-Specific** — Visible only if Employee Type = Teaching.

| Field | Type | Required | Notes |
|---|---|---|---|
| Subjects Taught | Multi-select | ✅ | From Session Form subjects |
| Assign Class Teacher Role? | Toggle | ✅ | Default: No |
| Assigned Class | Dropdown | Conditional | If Class Teacher |
| Assigned Section | Dropdown | Conditional | If Class Teacher |
| Assigned Subjects per Class | Multi-select + class mapping | ✅ | e.g. Class 10A → Math |

---
## SECTION 9 — TECH STACK

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI Components | Shadcn UI + Radix UI |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Routing | React Router DOM v6 |
| Data Fetching | TanStack Query v5 |
| Forms & Validation | React Hook Form + Zod |
| Charts | Recharts |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | Supabase (Auth, DB, Storage, Edge Functions, Realtime) |
| Mobile (Phase 2) | Flutter |
| Payment | Razorpay — Phase 2 |

**Coding rules:** See CLAUDE.md. Key rule: always RLS on new tables, always TypeScript.

---

## SECTION 10 — FUTURE MODULES

**Calendar — DONE (Phase 1).** See Section 4.

Timetable, Fee Management, HR & Payroll, Analytics Dashboard, Resources Manager, Holiday & Event Calendar ✅ (Calendar module done), Complaint & Grievance, Notice Board / Feed, My Docs, School Status, Transport Management ✅ (Transport in Student Form), Library Management, Admissions CRM, Quiz/MCQ Engine.

---

## SECTION 11 — OPEN QUESTIONS (resolve before building)

- **Attendance type:** period-wise or full-day marking? ← blocks Attendance build
- **Data retention:** what happens to student data when a school cancels subscription?
