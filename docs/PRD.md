# SHARP — Product Requirements Document

> Last updated: 2026-06-17. Built modules: Auth, Onboarding, School setup, Wings, Departments, Calendar, Messenger, Students, My Staff, Super Admin, **Homework**, **Attendance**, **Role Manager UI**.

## 1. Roles
| Role | Created By | Platform |
|---|---|---|
| Super Admin | SHARP team | Web only |
| Principal | Super Admin | Web + Mobile |
| Master Admin | Principal | Web + Mobile |
| Admin | Principal / Master Admin | Web + Mobile |
| Teacher / Non-Teaching | Principal / Master Admin / Admin | Web + Mobile |
| Student | Principal / Master Admin / Admin | Mobile only |

Rules: no self sign-up; super_admin fully isolated; PIN 6-digit (hashed, app-level encryption); 30-day session, daily PIN, OTP on expiry/new device; forced PIN setup on first login (no skip); teachers can't change own mobile.

Login screens: Super Admin (`/auth/superadmin` email+password), Principal, Staff, Student. No role dropdown — role from `profiles.role`.

## 2. Architecture (day-1)
- School A ↔ B isolation via `school_id` + RLS.
- Per-school subdomain (dev: school selection screen).
- 360px mobile-first, Hindi + English.
- UUID PK, snake_case.
- 500+ school scale target.
- PII (Aadhar, PIN hashes, bank) encrypted at app level.
- Multi-branch under one account.

## 3. Onboarding
[ONBOARDING.md](ONBOARDING.md). 4 steps: School → Session → Subjects → Review.

## 4. Calendar ✅
[CALENDAR.md](CALENDAR.md). Built: `school_calendar` (working week), `calendar_events` (7 types), `national_holidays` seed, `class_session_dates`, `event_task_completions`, RLS on all, attendance 3-check gate, `notify-calendar-event` edge function, hover/tap UI, dot colour coding.

Phase 2: student attendance overlay, scheduled notifications, exam marks link.

## 5. Messenger ✅
[MESSENGER.md](MESSENGER.md). Rules: super_admin ❌; students only message assigned teacher + designated admin; teacher-formed groups (students can send, not create); teacher ↔ own class only; admin → anyone; 2-min delete window; image+PDF media; broadcasts one-way; auto class+section and class+subject broadcasts; read receipts; chat archive.

## 6. Homework ✅
[HOMEWORK page](../src/pages/Homework.tsx) + [HomeworkPage](../src/pages/HomeworkPage.tsx). Teacher: own class/subject, text/attach/written-in-copy, notif on submit, checked-locked without admin override. Student: late after due date, locked after review, photo/type/mark-paper submission.

## 7. Attendance ✅
[ATTENDANCE.md](ATTENDANCE.md). Class Teacher: full-day or per-period (school chooses), edit ≤24h with reason, edit >24h needs admin override, 3-consecutive-absence auto alert, <75% profile flag. Student: monthly calendar G/R/Y, %, <75% flag. Admin: class summary, alerts, export.

## 8. Roles & Permissions ✅
[ROLE_MANAGER.md](ROLE_MANAGER.md) + [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md). Principal sets: primary role, additional roles, can-add-staff toggle, can-broadcast toggle, subjects taught, class-teacher assign, class+section.

## 9. Tech Stack
React 18 + TS + Vite + shadcn/ui + Radix + Tailwind + Lucide + RHF + Zod + TanStack Query v5 + Recharts + @dnd-kit + Framer Motion. Supabase: Postgres + Auth + Storage + Edge Functions + Realtime. Phase 2: Flutter + Razorpay.

## 10. Future Modules
Timetable, Fee, HR & Payroll, Analytics, Resources, Complaints, Notice Board, My Docs, School Status, Transport, Library, Admissions CRM, Quiz/MCQ.

## 11. Open Questions
- Period-wise vs full-day attendance (resolved at school setup).
- Data retention on subscription cancel (Phase 2).
