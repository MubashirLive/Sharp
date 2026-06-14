# SHARP — Calendar Module Specification

> **Version:** May 2026 | **Status:** Events Tab Implemented

---

## 1. Module Overview

Calendar is the school-wide time and schedule system inside SHARP — the **single source of truth** for all date-based school operations.

**Used by:** Events · Announcements · Holidays · Exam/Test Schedules · Task Management · Homework · Attendance · Messenger Notifications · *(Future: Salary, Timetable, Exams, Meetings)*

> **Core Rule:** Every school date-related activity must either be created in Calendar or appear in Calendar from its source module.

---

## 2. Calendar Tabs

| Tab | Shows |
|---|---|
| **Events** | School events by scope |
| **Holiday** | School holidays and working-day overrides |
| **Exam/Test** | Scheduled exams and tests |
| **Task** | Assigned tasks and due dates |
| **Homework** | Homework records and student submissions |
| **Attendance** | Attendance records and summaries |

---

## 3. Design Principles

- Calendar is the single source of truth for date-based school operations.
- Users see only calendar data they are permitted to access, governed by school hierarchy and role permissions.
- Past school records remain visible according to each module's retention rules.
- Calendar connects to Messenger for announcements and notifications.
- Calendar does not duplicate full module behaviour when another module owns the workflow.

> *Example: Task status is controlled by Task Management. Calendar only displays and filters task dates and statuses.*

---

## 4. Role Access and Permissions

### 4.1 Role Descriptions

| Role | Calendar Access |
|---|---|
| **Principal** | Full school-wide access across all tabs and scopes. Can create, edit, and cancel any event. |
| **Master Admin** | School-wide access equivalent to Principal (except actions reserved for Principal in future phases). |
| **Admin** | Depends on module and permission. May schedule/announce school-wide operational items where permitted. |
| **Departmental Incharge** | Views calendar items for their department and department-assigned tasks. |
| **Coordinator** | Views calendar items for their assigned wing. Can schedule exams/tests for their wing where permitted. Sees tasks assigned by or to them. |
| **Teacher / Class Teacher** | Views items for assigned classes, subjects, own tasks, relevant homework, and exam/test schedules. Subject teachers can schedule tests for their class/subject by default — no Principal approval needed. |
| **Non-Teaching Staff** | Views items assigned or relevant to them: holidays, staff meetings, own tasks, dept-specific events, wing/class events within scope. |
| **Student / Parent** | Views student-facing items only: school-wide events, class/wing events, applicable holidays, exam/test schedules, homework dates, own attendance. Cannot view staff-only tasks or internal staff meetings. Students access events via Calendar and Messenger only — no separate Events section. |

### 4.2 Permission Matrix

| Calendar Action | Principal | Master Admin | Admin | Dept. Incharge | Coordinator | Teacher / Class Teacher | Non-Teaching Staff | Student / Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| View own relevant calendar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View school-wide calendar | ✅ | ✅ | Configurable | ❌ default | ❌ default | ❌ | ❌ | ❌ |
| Create school event | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Declare holiday | ✅ | ✅ | ❌ default | ❌ | ❌ | ❌ | ❌ | ❌ |
| Schedule staff meeting | ✅ | ✅ | Configurable | Dept. only, if allowed | Wing only, if allowed | ❌ default | ❌ | ❌ |
| Assign task | Follows Task rules | Follows Task rules | Follows Task rules | Own dept. only | Own wing only | ❌ | ❌ | ❌ |
| Schedule exam | ✅ | ✅ | Whole school, if allowed | ❌ default | Own wing, if allowed | ❌ default | ❌ | ❌ |
| Schedule test | ✅ | ✅ | Configurable | ❌ default | Own wing, if allowed | Own class/subject *(default)* | ❌ | ❌ |
| View Attendance tab | ✅ | ✅ | Configurable | ❌ default | Own wing, if allowed | Own class/subject only | ❌ default | Own only |
| View Task tab | All tasks | All tasks | Own/allowed | Own dept. | Own wing | Own tasks | Own tasks | ❌ |

---

## 5. Events Tab

### 5.1 Overview

The Events tab is the school-wide area for creating, publishing, and viewing events. Events are **informational only** — recipients cannot RSVP, respond, or mark attendance. Events appear in Calendar and are announced via Messenger broadcast.

### 5.2 Creation Rights

Only **Principal** and **Master Admin** can create events — for any scope. All other roles are recipients only.

### 5.3 Event Scope

| Scope | Visible To | Student Inclusion | Notes |
|---|---|---|---|
| **School-wide** | All staff + all students | Always included | Cannot combine with other scopes |
| **Department** | Staff in selected dept(s) | Creator toggle — not automatic | Multi-select supported |
| **Wing** | Staff + students in selected wing(s) | Creator toggle — not automatic | Multi-select supported |
| **Class** | Class Teacher + subject teachers + students | Creator toggle — not automatic | Multi-select supported |

### 5.4 Event Content

**Required fields:**
- Event title
- Event date or date range *(see date types below)*
- Event scope
- Scope target *(departments/wings/classes — not required for school-wide)*
- Student inclusion setting *(include or exclude)*

**Optional fields:**
- Event description
- Attachments *(images, PDFs, general files — downloadable by all scoped recipients)*

> *Removed from scope: creator identity, creation date/time, start time, end time, venue/location are not part of the event record.*

### 5.5 Event Date Types

| Type | Definition |
|---|---|
| **One-day** | Event occurs on a single date. |
| **Multi-day** | Event spans consecutive dates; creator selects start and end dates. |
| **Selected days** | Event occurs on specific non-consecutive dates; creator selects individually. |

### 5.6 Publishing and Lifecycle

- **Immediate publish** — Event goes live and Messenger broadcast sends at time of creation.
- **Scheduled publish** — Event is saved but not visible or broadcast until the scheduled date/time.
- No manual draft state. Events are always either published immediately or scheduled.
- **Ended events** (date passed) remain visible in Calendar with no status label.
- **Cancelled events** are removed from Calendar immediately — no "cancelled" label is shown.

### 5.7 Editing and Cancellation

| Action | Who |
|---|---|
| Edit any event | Creator, Principal, or Master Admin |
| Cancel any event | Creator, Principal, or Master Admin |
| Edit past events | ❌ Locked once event date has passed |

- On edit or cancel, creator is prompted to send a Messenger broadcast *(on by default; can be toggled off)*.
- Cancellation removes the event from Calendar entirely.

### 5.8 Messenger Integration

- All event announcements are sent as **individual broadcasts** — not group chat messages.
- Each scoped recipient receives the broadcast in their own Messenger inbox.
- Broadcast message includes: event title, event date/range, description *(if provided)*, and a link to open the event in Calendar.
- Critical event announcements **bypass muted Messenger conversations**.
- System-generated broadcasts are not editable. Event discussion can happen in separate Messenger conversations.

### 5.9 Events Tab Filters

`All Events` · `School-wide` · `Department` · `Wing` · `Class` · `Upcoming` · `Ended`

> Principal and Master Admin see all events across all scopes. All other roles see only events within their recipient scope.

### 5.10 Role Access Summary — Events

| Role | Create | Edit / Cancel | Visibility |
|---|:---:|:---:|---|
| Principal | ✅ | ✅ Any event | All scopes |
| Master Admin | ✅ | ✅ Any event | All scopes |
| Admin | ❌ | ❌ | Events they are a recipient of |
| Departmental Incharge | ❌ | ❌ | School-wide + own dept/wing events |
| Coordinator | ❌ | ❌ | School-wide + own wing + own wing class events |
| Teacher / Class Teacher | ❌ | ❌ | School-wide + own dept/wing/class events |
| Non-Teaching Staff | ❌ | ❌ | School-wide + dept/wing + class/wing-level in scope |
| Student / Parent | ❌ | ❌ | School-wide + own class/wing *(Calendar & Messenger only)* |

### 5.11 Audit Record

Every event maintains a record of: creator identity and creation timestamp · scope and scope target · student inclusion setting · title and description · date type and dates · edits *(who and when)* · cancellations *(who and when)* · Messenger broadcast history · attachments included.

### 5.12 Record Retention

- Records kept for one **academic year**; archived *(not immediately deleted)* at year end.
- Principal can export event records before the yearly wipe.
- Cancelled events follow the same wipe cycle as active/ended events.

### 5.13 Implementation Notes *(May 2026)*

**Database Schema:**
- `departments` — separate table for department scope management
- `calendar_events` extended with: `end_date`, `specific_dates[]`, `include_students`, `attachment_urls[]`, `published_at`, `scheduled_publish_at`, `cancelled_at`, `cancelled_by`
- `event_history` — audit trail table with action types: `created`, `edited`, `cancelled`, `broadcast_sent`
- `event-attachments` storage bucket with signed URLs (7-day expiry)

**RLS Functions:**
- `current_school_id()` — returns authenticated user's school
- `user_role()` — returns authenticated user's role
- `user_department_ids()`, `user_wing_ids()`, `user_class_ids()` — return user's scope memberships for visibility filtering

**Event Filters Available:**
All Events · School-wide · Department · Wing · Class · Upcoming · Ended

---

## 6. Holiday Tab

### 6.1 Overview

The Holiday tab is used to declare and view holidays. Holiday data is used by Attendance to determine whether attendance can be marked for a given date.

### 6.2 Holiday Scopes

| Scope | Applies To |
|---|---|
| Whole school | All staff and students |
| Students only | Student-facing calendar only |
| Staff only | Staff calendar only — does not block student attendance |
| Wing | All staff and students in selected wing(s) |
| Class | All staff and students in selected class(es) |
| Department | All staff in selected department(s) |
| Selected staff | Individually chosen staff members |

### 6.3 Rules

- Holidays should be declared for future dates.
- Past dates must not be changed casually — changes affect attendance records.
- National holidays are recognised by the system.
- School-specific holidays can be added by Principal or Master Admin.
- A normally non-working day can be marked as a working day via a working-day override.

---

## 7. Exam/Test Tab

### 7.1 Scheduling Rights and Fields

| Type | Who Can Schedule | Schedule Fields |
|---|---|---|
| **Exam** | Principal, Master Admin, Admin *(if permitted)*, Coordinator *(own wing, if permitted)* | Exam name, date, time, class, section, subject, venue *(opt.)*, instructions *(opt.)* |
| **Test** | Principal, Master Admin, Admin *(if permitted)*, Coordinator *(own wing, if permitted)*, **Subject Teacher** *(own class/subject — allowed by default, no Principal approval needed)* | Test name, date, time, class, section, subject, marks/syllabus *(opt.)*, instructions *(opt.)* |

### 7.2 Notifications

Exam/Test announcements notify the relevant audience via Messenger, scoped to the appropriate classes, wings, or school-wide.

---

## 8. Task Tab

### 8.1 Ownership Boundary

Calendar does not own the task workflow. **Task Management** owns: creation, assignment hierarchy, attachments, status changes, submission, verification, completion, reassignment, and records. Calendar displays task dates and statuses only.

### 8.2 What Appears in the Task Tab

- Tasks assigned to the logged-in user
- Tasks assigned by the logged-in user
- Group tasks relevant to the logged-in user
- Overdue incomplete tasks *(highlighted)*
- Completed tasks *(visible by default; filterable)*

> Principal and Master Admin can view all task records school-wide.

### 8.3 Task Tab Rules

| Aspect | Rule |
|---|---|
| Status flow | `Assigned → Seen → Submitted → Verified → Completed` |
| Calendar date shown | Due date only — assigned date not shown in grid |
| Overdue tasks | Highlighted; visible to assigned user |
| Completed tasks | Visible by default; filterable |
| Group task progress summary | Visible to Principal and Master Admin only — **Admin excluded** |
| Group task (individual view) | Each group member sees their own task status only |

### 8.4 Messenger Link

When a task is assigned, Messenger sends a system-generated notification. Task discussion happens in Messenger; task actions happen in Task Management.

---

## 9. Homework Tab

### 9.1 Ownership Boundary

Homework module owns assignment, submission, review, and marking workflows. Calendar displays homework-related dates only.

### 9.2 What Appears in the Homework Tab

- Homework assigned date and due date
- Homework status, subject, class/section, teacher

### 9.3 Visibility

| Role | Sees |
|---|---|
| Student / Parent | Own enrolment only |
| Teacher | Homework they assigned or are responsible for |
| Principal / Master Admin / permitted Admin | Broader summaries |

> Messenger notifies students/parents when homework is assigned or reviewed.

---

## 10. Attendance Tab

### 10.1 Ownership Boundary

Attendance module owns marking, editing, approval, and reports. Attendance tab in Calendar is **Phase 1 for students**.

### 10.2 Principal and Master Admin View

- Default filters: Class = All, Wing = None, Section = None, Search = Empty.
- Date cells show attendance percentage **or** Total/Present/Absent/Leave — toggled by user.
- Search suggests matching students with class and section; selecting one shows that student's individual attendance calendar.

### 10.3 Individual Student Calendar — Color Key

| Color | Meaning |
|---|---|
| 🟢 Green | Present |
| 🔴 Red | Absent |
| 🟡 Yellow | Leave |
| ⬜ White | Not marked |

### 10.4 Attendance Stats Cards

Cards appear beside the Calendar view and update when filters change.

*Possible cards:* Today's snapshot · Monthly trend · Wing summary · Class summary · Chronic absentees · Individual student monthly summary · Individual student session summary

> Design rule: cards should be scannable quickly and avoid overcrowding.

---

## 11. Working Days and Session Dates

### 11.1 Working Day Logic

A date is a working day based on: school working week · national holidays · school-declared holidays · working-day overrides · class session start/end dates · wing/class-specific holidays.

> Attendance checks Calendar before allowing marking. If the date is not a valid working day for that class/group, attendance is locked.

### 11.2 Session and Class Date Rules

- Different classes may have different session start and end dates — Calendar supports class-wise session boundaries.
- If a class session date is not configured, attendance remains locked for that class until setup is complete.

---

## 12. Messenger Integration

Calendar uses Messenger for notifications and announcements. Messages follow the same scope as the Calendar item.

### 12.1 Notification Triggers

- Event creation, editing, or cancellation *(individual broadcast)*
- Holiday declaration
- Exam/Test schedule
- Staff meeting
- Task assignment *(follows Task Management Messenger rules)*
- Homework notification *(if triggered by Homework module)*

### 12.2 Critical Announcement Rule

> Critical Calendar announcements *(events, holidays, exams, task assignments)* **bypass muted Messenger conversations**.

*Examples: A wing-level event broadcasts individually to all staff and students in that wing. A class test notifies only that class and relevant teachers.*

---

## 13. UI Expectations

### 13.1 Views and Navigation

- Month view and Day detail view
- Tab switching
- Mobile tap panel for date details
- Desktop hover/click detail panel

### 13.2 Filters

Class · Section · Wing · Department · User · Status · Event scope *(where relevant)*

### 13.3 Item Indicators *(dots/colors in date cells)*

`Holiday` · `Event` · `Exam/Test` · `Task` · `Homework` · `Attendance`

> Date cells show summary indicators only. Full details open in a panel. Avoid too much text inside date boxes.

### 13.4 What Calendar Must Not Do

- Verify tasks or review homework
- Mark attendance directly *(unless Attendance module explicitly exposes this)*
- Replace Messenger, Task Management, or Exam results/marks modules
- Show staff-only data to students/parents, or student private data to unrelated staff
- Send automatic reminders before task, homework, or exam due dates
- Support recurring events
- Show draft/unpublished events to recipients before their scheduled publish time

---

## 14. Records and History

Past dates may show: events that occurred · holidays declared · exams/tests scheduled · task deadlines and completion status · homework due dates · attendance summaries.

Calendar does not override module-specific retention rules.

| Data | Retention |
|---|---|
| Task records | 1 year *(Task Management retention policy)* |
| Event records | 1 academic year, archived before deletion |
| Attendance records | Follows Attendance module retention rules |
| Past events | Locked from editing once event date has passed |

---

## 15. Build Priority and Order

Calendar should be built after Session setup is ready and before modules that depend heavily on dates.

| Step | Module |
|:---:|---|
| 1 | Session and class setup |
| 2 | Calendar working days and holidays |
| 3 | Events and announcements |
| 4 | Messenger notification connection |
| 5 | Task tab integration |
| 6 | Homework tab integration |
| 7 | Attendance tab integration |
| 8 | Exam/Test scheduling |

---

## 16. Resolved Decisions

| Decision | Resolution |
|---|---|
| Recurring events | Not supported. One-time entries only. |
| Past events editing | Locked once event date passes. |
| Task dates in grid | Due date only. Assigned date not shown. |
| Completed tasks display | Visible by default; filterable. |
| Group task progress summary | Principal and Master Admin only. Admin excluded. |
| Subject teacher test scheduling | Allowed by default; no Principal approval needed. |
| Automatic reminders | Not sent for any module via Calendar. |
| Critical announcements & muted chats | Critical announcements bypass muted Messenger conversations. |
| Attendance tab (students) | Phase 1. |
| Draft state for events | Not supported. Events are published immediately or scheduled. |
| Multi-scope events | Supported. Dept., wing, and class fields support multi-select. |
| Student inclusion in events | Creator-controlled per event. Not automatic for dept/wing/class events. |
| Event categories / types | Not supported. |
| Event status labels (ended/active) | Not used. Events appear/disappear by date. Cancelled events removed immediately. |
| Separate Events section for students | Not available. Students use Calendar and Messenger only. |
| Summary report for upcoming events | Not available. |
| Attachments downloadable | Yes, by all scoped recipients. |
| Non-teaching staff and class/wing events | Non-teaching staff can see class/wing-level events even if not directly involved. |
| Yearly event wipe | By academic year; archived before deletion; Principal can export; cancelled events on same cycle. |
| Event visibility filtering | RLS policy on `calendar_events` table + query-level filtering in application layer for role-based scope |
| Audit record storage | New `event_history` table (normalized, extensible) — tracks created/edited/cancelled/broadcast_sent with diff history |
| Department scope | New `departments` table (not schools.departments JSONB) — separate table for department management |
| Event preview before publish | Preview dialog shows event as recipients will see it before confirming publish |
| Attachments storage | Supabase Storage bucket `event-attachments`, multiple files per event, signed URLs with 7-day expiry |
| Date type UI | Range picker for multi-day, multi-date picker for selected days, single date picker for one-day |
| Department scope selector | Single-select dropdown in EventForm powered by `departments` table |
| Event cancellation | Soft delete via `cancelled_at` + `cancelled_by` columns, event removed from calendar grid |