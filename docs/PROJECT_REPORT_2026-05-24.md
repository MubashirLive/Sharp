# SHARP — Project Status Report
**Date:** 2026-05-24
**Branch:** Chatting_Feature_MK
**Last Commit:** 4af8b6c (14_05_2026)
**Status:** Phase 1 MVP — In Development

---

## 1. PROJECT OVERVIEW

**SHARP** — Multi-school Learning Management System (LMS)
- Multi-tenant SaaS architecture (500+ schools)
- Role-based access (7 roles)
- Built with React 18 + TypeScript + Vite + shadcn/ui + Supabase
- Mobile-first (360px min), Hindi + English support
- PIN-based authentication

**Repository:** `c:\Users\MUBASHIR\Documents\GitHub\Sharp`
**Supabase Project:** ndtqhschvnyloeccaelv

---

## 2. TECH STACK

### Frontend
- React 18.3.1 + TypeScript 5.8.3
- Vite 5.4.19 (build tool)
- Tailwind CSS 3.4.17 + shadcn/ui + Radix UI
- Lucide React (icons), React Router DOM v6
- TanStack Query v5.83.0 (data fetch)
- React Hook Form v7.61 + Zod v3.25 (forms)
- Recharts v2.15.4 (charts)
- @dnd-kit (drag & drop)
- Framer Motion v12.38 (animations)

### Backend
- Supabase: PostgreSQL, Auth, Storage, Edge Functions, Realtime
- 9 Edge Functions deployed (see Section 8)
- 41 migrations applied (see Section 7)

### Phase 2 (Planned)
- Flutter Mobile App
- Razorpay Payments

---

## 3. ROLES & ACCESS

| Role | Created By | Platform |
|---|---|---|
| Super Admin | Internal (SHARP team) | Web only |
| Principal | Super Admin | Web + Mobile |
| Master Admin | Principal | Web + Mobile |
| Admin | Principal / Master Admin | Web + Mobile |
| Teacher / Non-Teaching | Principal / Master Admin / Admin | Web + Mobile |
| Student | Principal / Master Admin / Admin | Mobile only |

**Login Types:**
- Super Admin: Email + password
- Staff/Student: OTP first login → 6-digit PIN daily

---

## 4. FEATURE STATUS

### Phase 1 MVP Modules

| Module | Status | Notes |
|--------|--------|-------|
| **Authentication** | ✅ Complete | 5 login screens, OTP + PIN auth |
| **Onboarding Wizard** | ✅ Complete | 4-step (School → Session → Subjects → Review) |
| **School Setup** | ✅ Complete | Houses, Shifts, Departments, Classes, Sections, Subjects |
| **Wings Tab** | ✅ Complete | Full CRUD, Actor Replacement Protocol, Staff Directory |
| **Departments Tab** | ✅ Complete | Full CRUD, Actor Replacement Protocol, Incharge management |
| **Calendar** | ✅ Complete | All 7 event types, RLS, notifications |
| **Messenger** | ✅ Built | ChatService + ChatModal, group/broadcast messaging |
| **Student Management** | ✅ Built | 3-stage wizard, 42 fields, profile tracking |
| **People (Staff)** | ✅ Built | Staff listing, detail page, CRUD |
| **Super Admin Portal** | ✅ Built | School management, Principal ID creation |
| **Homework** | ❌ Not Built | Spec in PRD/CALENDAR.md, matrix empty |
| **Attendance** | ❌ Not Built | Spec written, Calendar gate done, UI not built |
| **Roles & Permissions UI** | ⚠️ Partial | Matrix documented, config UI not built |

### Phase 2 Modules (Planned)
- Flutter Mobile App, Fee Management + Razorpay, Timetable, HR & Payroll
- Transport Management, Library Management, Analytics Dashboard, Quiz/MCQ Engine

---

## 5. DATABASE

### Schema Stats
- **41 Migrations** applied
- **Tables:** profiles, schools, academic_sessions, classes, sections, students
- **Tables:** wings, wings_coordinators, wings_activity_staff, wings_audit_log
- **Tables:** departments, department_staff, department_incharges, department_audit_log
- **Tables:** calendar_events, school_calendar, national_holidays, class_session_dates
- **Tables:** staffs, subject_teachers, chat_conversations, chat_messages, chat_participants
- **Tables:** user_preferences, role_manager tables

### Key Design Decisions
- `school_id` on every data table (multi-tenancy)
- 3-tier subject hierarchy: school_subjects → subjects → section_subjects
- UUID primary keys, snake_case naming
- RLS enabled on all tables
- PGP encryption for PII (Aadhar, temp passwords)
- `updated_at` triggers on 7+ tables

### Known Issues (from DATABASE_REPORT.md)
| # | Issue | Priority | Status |
|---|-------|---------|--------|
| 3.1 | Dual Role System | P0 | ✅ FIXED |
| 3.2 | onboarding_complete column | P0 | ✅ FIXED |
| 3.3 | Principal temp password encryption | P0 | ✅ FIXED |
| 3.4 | Aadhar encryption | P0 | ✅ FIXED |
| 3.9 | Staff table creation | P2 | ✅ FIXED (2026-05-21) |
| 3.10 | Roll resequence race condition | P2 | ❌ PENDING |
| 3.13 | Chat storage policy guard | P2 | ❌ PENDING |
| 3.14 | Hardcoded holidays | P3 | ❌ PENDING |
| 3.15 | No soft delete | P3 | ❌ PENDING |
| 3.16 | No audit triggers | P3 | ❌ PENDING |

---

## 6. EDGE FUNCTIONS (9 Deployed)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| `create-school` | 2 | Yes | Create school + principal profile |
| `claim-super-admin` | 1 | Yes | Claim super admin role |
| `delete-school` | 2 | Yes | Delete school with cascade |
| `check-staff-deletion-eligibility` | 2 | Yes | Block deletion if sole coordinator/incharge |
| `send-otp` | 1 | No | Send OTP to mobile |
| `verify-otp` | 1 | No | Verify OTP code |
| `set-pin` | 1 | No | Set/reset 6-digit PIN |
| `recover-owner` | 4 | No | Owner recovery flow |
| `swift-responder` | 1 | Yes | Custom responder |

---

## 7. KEY COMPONENTS

### Pages
- `SuperAdmin.tsx` — School management, Principal creation
- `SchoolPage.tsx` — My School (Wings, Departments tabs)
- `SchoolOnboarding.tsx` — 4-step onboarding wizard
- `Students.tsx` — Student listing + 3-stage creation
- `Calendar.tsx` — Full calendar with Events/Holiday/Exam/Test/Task/Homework/Attendance tabs
- `Messenger.tsx` — Chat UI
- `AuthRoleLogin.tsx` — Staff/Student OTP + PIN login
- `AuthSuperAdmin.tsx` — Super Admin login

### Core Components
- `AuthContext` — Auth state management
- `ProtectedRoute` — Role-based route guarding
- `SchoolSelection` — School picker on first login
- `WingsTab` / `WingCard` / `WingEditMode` — Wing management
- `DepartmentsTab` / `DepartmentCard` / `DepartmentEditMode` — Department management
- `ChatModal` / `ChatWindow` — Messenger UI
- `CalendarGrid` / `CalendarHeader` / `EventForm` — Calendar UI

---

## 8. AUTHENTICATION FLOW

1. **Super Admin:** `/auth/superadmin` → Email + Password
2. **Principal:** Email + Temp Password → Forced PIN setup → Onboarding
3. **Staff:** OTP → PIN setup → Dashboard
4. **Student:** OTP → PIN setup → Dashboard

**Key files:**
- `src/contexts/AuthContext.tsx` — Central auth state
- `src/pages/AuthRoleLogin.tsx` — OTP + PIN login
- `src/services/chatService.ts` — Chat messaging

---

## 9. DOCUMENTATION

| Doc | Purpose |
|-----|---------|
| [CLAUDE.md](CLAUDE.md) | Project instructions, tech stack, rules |
| [docs/INDEX.md](docs/INDEX.md) | Doc map — start here |
| [docs/PRD.md](docs/PRD.md) | Full product requirements |
| [docs/PERMISSION_MATRIX.md](docs/PERMISSION_MATRIX.md) | Role access table |
| [docs/SCREEN_FLOW_MAP.md](docs/SCREEN_FLOW_MAP.md) | Navigation flows |
| [docs/ONBOARDING.md](docs/ONBOARDING.md) | Onboarding spec |
| [docs/CALENDAR.md](docs/CALENDAR.md) | Calendar module spec |
| [docs/MESSENGER.md](docs/MESSENGER.md) | Messenger spec |
| [docs/WINGS.md](docs/WINGS.md) | Wings tab spec |
| [docs/DEPARTMENT.md](docs/DEPARTMENT.md) | Department tab spec |
| [docs/DATABASE_REPORT.md](docs/DATABASE_REPORT.md) | DB audit report |

---

## 10. RECENT COMMITS

```
4af8b6c  14_05_2026
a281825  Last update after Claude expired
40446b6  12:34 - 07 05 2026
0e7ee66  06 may last updates
2988914  06 may 2026
3451f72  changes
d8c969f  incompete chat feature
```

**Last 5 commits changed:** 140 files, +27,530 insertions, -3,977 deletions

---

## 11. CURRENT CHALLENGES

### In Progress
- **Chat feature integration** — ChatService built, ChatModal/ChatWindow built, permission wiring pending
- **Attendance module** — Spec complete, Calendar gate done, UI + DB tables not built
- **Homework module** — Spec in PRD, matrix empty, not started

### Engineering Gaps
- **Zero test coverage** — 227 functions untested
- **No CI/CD** — No lint/type-check/test on push
- **Type sync drift** — Schema changes may not be reflected in types.ts
- **No error boundaries** — App can crash on unhandled errors
- **i18n not started** — Hindi + English required from launch

---

## 12. GIT STATUS

```
Branch: Chatting_Feature_MK
Main: master

Modified (key files):
- src/App.tsx
- src/contexts/AuthContext.tsx
- src/pages/SchoolPage.tsx
- src/pages/Students.tsx
- src/pages/Calendar.tsx
- src/services/chatService.ts
- docs/*.md

New files:
- src/components/auth/*.tsx
- src/components/calendar/*.tsx
- src/components/wings/*.tsx
- src/components/departments/*.tsx
- src/components/messenger/*.tsx
- docs/ATTENDANCE.md
- docs/DESIGN_SYSTEM.md
```

---

## 13. NEXT STEPS

### Immediate (Priority 1)
1. **Build Homework module** — Core teacher workflow
2. **Build Attendance module** — Core student workflow
3. **Wire Messenger permissions** — Connect ChatModal to permission matrix
4. **Add test infrastructure** — Vitest + React Testing Library

### Short-term (Priority 2)
5. **Set up CI/CD** — GitHub Actions pipeline
6. **Create shared TanStack Query hooks** — Consistent data fetching
7. **Add error boundaries** — Prevent full-app crashes
8. **Run `supabase gen types`** — Verify types.ts sync

### Medium-term (Priority 3)
9. **Build Roles & Permissions UI** — Principal config interface
10. **Set up pre-commit hooks** — ESLint + TS check
11. **Add loading skeletons** — Consistent loading states
12. **i18n setup** — react-i18next

---

*Report generated: 2026-05-24*