# SHARP - Docs Index

> **START HERE.** Read this first. Pick your doc based on what you need.

---

## Quick Path

| Need | Read |
|---|---|
| Product overview, roles, and core module scope | [PRD.md](PRD.md) |
| What Super Admin can/cannot do | [SUPERADMIN.md](SUPERADMIN.md) |
| Principal onboarding flow | [ONBOARDING.md](ONBOARDING.md) |
| Who can access what | [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md) |
| Screen navigation and transitions | [SCREEN_FLOW_MAP.md](SCREEN_FLOW_MAP.md) |
| Session/Class/Subject setup form | [SESSION_FORM.md](SESSION_FORM.md) |
| Student creation form | [STUDENT_FORM.md](STUDENT_FORM.md) |
| Staff creation form | [STAFF_FORM.md](STAFF_FORM.md) |
| Staff deletion flow | [STAFF_DELETION.md](STAFF_DELETION.md) |
| Calendar module | [CALENDAR.md](CALENDAR.md) |
| Messenger module and communication rules | [MESSENGER.md](MESSENGER.md) |
| Messenger defaults and settings | [MESSENGER_SETTING.md](MESSENGER_SETTING.md) |
| Staff Task Management | [TASK.md](TASK.md) |
| Staff roles, access, and assignments | [ROLE_MANAGER.md](ROLE_MANAGER.md) |
| Subject assignment to class-sections | [SUBJECT.md](SUBJECT.md) |
| Classes tab rebuild spec (MY School) | [CLASSES_FIX.md](CLASSES_FIX.md) |
| Submit-once guard (mandatory for all mutation buttons) | [SUBMIT_GUARD.md](SUBMIT_GUARD.md) |

---

## Doc Map

```text
PRD.md (start here)
|-- SUPERADMIN.md        -> Super Admin: create school, edit principal credentials
|-- ONBOARDING.md        -> Principal onboarding wizard
|-- PERMISSION_MATRIX.md -> Role access table: who can do what
|-- SCREEN_FLOW_MAP.md   -> Navigation flows for all roles
|-- SESSION_FORM.md      -> Class/section/subject form fields
|-- STUDENT_FORM.md      -> Student creation form
|-- STAFF_FORM.md        -> Staff creation form
|-- STAFF_DELETION.md    -> Hard delete: cascade checks, atomic deletion, edge functions
|-- CALENDAR.md          -> Calendar: events, holidays, exam/test, task, homework, attendance
|-- MESSENGER.md         -> Messaging, groups, broadcasts, system messages
|-- MESSENGER_SETTING.md -> Messenger defaults, settings, visibility rules
|-- TASK.md              -> Staff task assignment, lifecycle, records
|-- ROLE_MANAGER.md      -> Staff roles, access, and assignments
`-- SUBJECT.md           -> Subject assignment to class-sections
`-- SUBMIT_GUARD.md      -> Mandatory pattern: <SubmitButton> + server idempotency
```

---

## Before Writing Code

1. **Any auth or RLS work** -> read `PERMISSION_MATRIX.md` first.
2. **Any UI or navigation** -> read `SCREEN_FLOW_MAP.md` first.
3. **Any form fields** -> read the relevant form doc first.
4. **Any Super Admin feature** -> read `SUPERADMIN.md` first.
5. **Any onboarding** -> read `ONBOARDING.md` first.
6. **Any Messenger, Task, or Calendar integration** -> read `MESSENGER.md`, `MESSENGER_SETTING.md`, `TASK.md`, and `CALENDAR.md` together.
7. **Any staff role or assignment logic** -> read `ROLE_MANAGER.md` first.

---

## Build Order For New Features

1. Read `PRD.md` and the relevant focused doc.
2. Plan the behavior and permission rules.
3. Write code.
4. Update docs if behavior differs from spec.
