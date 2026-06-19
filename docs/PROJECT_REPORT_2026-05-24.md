# SHARP — Project Status (2026-05-24)
**Branch:** Chatting_Feature_MK
**Last commit at snapshot:** 4af8b6c (14_05_2026)
**Status:** Phase 1 MVP — In Development

> See [REPORT.md](REPORT.md) for the snapshot. For current state see git log + [REPORT_2.md](REPORT_2.md).

## Stack
React 18.3.1 + TS 5.8.3 + Vite 5.4.19 + Tailwind 3.4.17 + shadcn/ui + Radix.
TanStack Query 5.83.0, RHF 7.61, Zod 3.25, Recharts 2.15.4, @dnd-kit, Framer Motion 12.38.
Supabase: Postgres + Auth + Storage + Edge Functions + Realtime.

## Roles
super_admin, principal, master_admin, admin, teacher/non-teaching, student. Login: super admin = email+password, staff/student = OTP then 6-digit PIN.

## Phase 1 status (at snapshot)
Built: Auth, Onboarding, School setup, Wings, Departments, Calendar, Messenger, Student mgmt, My Staff, Super Admin portal.
Pending: Homework, Attendance, Role/Permissions UI.

## Phase 2
Flutter mobile, Razorpay, Timetable, HR & Payroll, Transport, Library, Analytics, Quiz.

## DB
41 migrations at snapshot, all with RLS, school_id everywhere, PGP for PII.

## Edge functions (9)
create-school, claim-super-admin, delete-school, check-staff-deletion-eligibility, send-otp, verify-otp, set-pin, recover-owner, swift-responder.

## Docs
[INDEX.md](INDEX.md) is the entry point.

## Status
- Chat integration: in progress.
- Attendance + Homework: not built at snapshot (now built, see REPORT.md current).
- Zero test coverage (scaffolded now in src/test/).

---
*Snapshot. Refreshed versions in [REPORT.md](REPORT.md).*
