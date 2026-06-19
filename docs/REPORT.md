# SHARP — Project Status Report
**Date:** 2026-05-24 (snapshot, kept for history)
**Branch:** Chatting_Feature_MK
**Status:** Phase 1 MVP — In Development

> Snapshot report. For current status see [REPORT_2.md](REPORT_2.md) (audit) + git log.

## 1. Project
SHARP — Multi-school LMS. React 18 + TypeScript + Vite + shadcn/ui + Supabase.
Multi-tenant (school_id on every table), 4 roles (super_admin, principal, staff, student), PIN auth, mobile-first 360px, i18n-ready (Hindi + English).

## 2. Tech Stack
- **Frontend:** React 18.3.1, TS 5.8.3, Vite 5.4.19, Tailwind 3.4.17, shadcn/ui + Radix, TanStack Query v5, RHF + Zod, Recharts, @dnd-kit, Framer Motion 12.38.
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime).
- **Phase 2:** Flutter mobile, Razorpay.

## 3. Roles
super_admin, principal, staff, student. Stored in `profiles.role`.

## 4. Features (Phase 1)
- Auth (5 screens, OTP + PIN)
- Onboarding (4-step)
- School setup (Houses, Shifts, Departments, Classes, Sections, Subjects)
- Wings tab (with actor replacement)
- Departments tab
- Calendar (7 event types)
- Messenger (group + broadcast)
- Student management (3-stage wizard)
- My Staff (People)
- Super Admin portal
- Homework — BUILT (2026-06, see Homework.tsx + HomeworkPage.tsx)
- Attendance — BUILT (2026-06, see Attendance.tsx + components/attendance)
- Role Manager UI — BUILT (2026-06, see RoleManager.tsx + components/role-manager)

## 5. DB
- Migrations: 47+ applied (see supabase/migrations).
- Key tables: profiles, schools, academic_sessions, classes, sections, students, wings (+_coordinators, +_activity_staff, +_audit_log), departments (+_staff, +_incharges, +_audit_log), houses, calendar_events, school_calendar, national_holidays, class_session_dates, staffs, subject_teachers, chat_conversations, chat_messages, chat_participants, role_assignment tables, attendance tables, idempotency_keys.
- school_id everywhere, RLS on all, UUID PK, snake_case, PGP for PII (Aadhar, temp passwords).

## 6. Edge Functions
| Function | JWT | Purpose |
|---|---|---|
| create-school | yes | school + principal |
| claim-super-admin | yes | claim role |
| delete-school | yes | cascade delete |
| check-staff-deletion-eligibility | yes | block if sole actor |
| send-otp | no | OTP send |
| verify-otp | no | OTP verify |
| set-pin | no | PIN set/reset |
| recover-owner | no | owner recovery |
| notify-calendar-event | yes | event notify |
| send-message | yes | chat send |
| superadmin-* (6) | yes | super admin actions |
| create-staff-user | yes | staff create |
| delete-staff | yes | staff delete |
| verify-pin | no | PIN verify |

## 7. Key Components
- Pages: SuperAdmin, SchoolPage, SchoolOnboarding, Students, Calendar, Messenger, AuthRoleLogin, AuthSuperAdmin, Homework, HomeworkPage, Attendance, MyStaff, RoleManager, SchoolSetupCalendar.
- Core: AuthContext, ProtectedRoute, SchoolSelection, AppShell, ErrorBoundary.

## 8. Auth
- Super admin: email + password (`/auth/superadmin`).
- Staff/Student: OTP → 6-digit PIN daily.
- Principal: email + temp password → forced PIN → onboarding.

## 9. Docs
See [INDEX.md](INDEX.md).

## 10. Recent Commits
See git log. Last commit at snapshot: 4af8b6c.

## 11. Current State (snapshot)
- Chat integration, Homework, Attendance, Role Manager UI all built.
- Role Manager = wings + departments + houses + master admin confirm.
- Zero test coverage (now being addressed — see src/test/).

## 12. Next Steps
- Build test coverage (Vitest + RTL, scaffolding in src/test/).
- Wire Messenger permissions to matrix.
- Add i18n strings.
- CI/CD pipeline.

---
*Snapshot 2026-05-24. For audit findings see REPORT_2.md.*
