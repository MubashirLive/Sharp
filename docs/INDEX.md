# Docs — Index

Last update: 2026-06-17. Start here. Every cluster links to its source-of-truth doc.

## Meta
- [REPORT.md](REPORT.md) — Phase-1 project status (snapshot 2026-05-24)
- [REPORT_2.md](REPORT_2.md) — Code audit findings (88 findings, grade D)
- [PROJECT_REPORT_2026-05-24.md](PROJECT_REPORT_2026-05-24.md) — Status as of 14_05_2026
- [AUDIT_PROMPT.md](AUDIT_PROMPT.md) — Exhaustive audit prompt (run by REPORT_2)
- [AUTO_AUDIT_EXECUTION_SUMMARY.md](AUTO_AUDIT_EXECUTION_SUMMARY.md) — Cron job 2026-06-07 summary
- [TASK.md](TASK.md) — Backlog
- [BUGS.md](BUGS.md) — Bug log
- [IMPROVMENT.md](IMPROVMENT.md) — Improvement ideas

## Domain
- [PRD.md](PRD.md) — Product requirements
- [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md) — Role × action matrix (read before any RLS)
- [ONBOARDING.md](ONBOARDING.md) — School onboarding wizard
- [MY_SCHOOL.md](MY_SCHOOL.md) — My School page
- [SUPERADMIN.md](SUPERADMIN.md) — Super Admin portal
- [MY_STUDENT.md](MY_STUDENT.md) — Student app shell
- [SCREEN_FLOW_MAP.md](SCREEN_FLOW_MAP.md) — Navigation flows

## Auth, Form, UX
- [AUTH.md](AUTH.md) — OTP + PIN auth flow
- [SUBMIT_GUARD.md](SUBMIT_GUARD.md) — SubmitButton + useGuardedSubmit + idempotency
- [KEY_ROTATION_RUNBOOK.md](KEY_ROTATION_RUNBOOK.md) — Supabase key rotation
- [INTEGRATION.md](INTEGRATION.md) — Supabase integration
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — Tokens, components, UX rules
- [STAFF_DELETION.md](STAFF_DELETION.md) — Staff deletion rules
- [STAFF_FORM.md](STAFF_FORM.md) — Staff 7-tab form
- [STUDENT_FORM.md](STUDENT_FORM.md) — Student 10-tab form

## Feature
- [ROLE_MANAGER.md](ROLE_MANAGER.md) — Role manager (wings/dept/houses/coord)
- [ATTENDANCE.md](ATTENDANCE.md) — Attendance module
- [CALENDAR.md](CALENDAR.md) — Calendar module
- [MESSENGER.md](MESSENGER.md) — Chat / Messenger
- [MESSENGER_SETTING.md](MESSENGER_SETTING.md) — Messenger settings
- [MY_STAFF.md](MY_STAFF.md) — My Staff page
- [DATABASE_REPORT.md](DATABASE_REPORT.md) — DB audit

## Doc rules
- Read the relevant doc BEFORE writing code.
- Spec unclear → ask user, document the decision.
- Code that contradicts a doc = wrong code. Update the doc, then fix the code.

## Workflow artifacts
- [LESSONS.md](LESSONS.md) — per-session lessons (highest signal). Updated via `/reflect`.
- [superpowers/specs/](superpowers/specs/) — brainstorm design specs (created by `/brainstorm`)
- [superpowers/plans/](superpowers/plans/) — implementation plans (created by `/plan`). See [2026-06-17-wing-tab-cache-invalidation.md](superpowers/plans/2026-06-17-wing-tab-cache-invalidation.md) for example.

## Claude workflow chain
```
/brainstorm (spec) → /plan (tasks) → /tdd per task → implement → review → /finish → /reflect (lessons)
```
Slash commands live at `.claude/commands/`. Full skill matrix in [CLAUDE.md](../CLAUDE.md) §5.
