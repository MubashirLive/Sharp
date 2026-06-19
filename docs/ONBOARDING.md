# SHARP — Onboarding

> Updated 2026-06-17. One-time wizard, 4 steps, fixed, cannot skip.

## Overview
| Step | Who | What |
|---|---|---|
| 1 | Principal / Master Admin | School form (Houses, Shifts, Departments) |
| 2 | Principal / Master Admin | Confirm auto-assigned academic year + Session form (Classes, Sections) |
| 3 | Principal / Master Admin | Assign subjects per section |
| 4 | Principal / Master Admin | Review + submit |

> Super Admin creates Principal ID first (see [SUPERADMIN.md](SUPERADMIN.md)).

## Step 1 — School Form (`SchoolStep.tsx`)
| Field | Type | Req | Notes |
|---|---|---|---|
| Houses | List | ✅ | Default: Red, Blue, Green, Yellow. Add name + emblem. |
| Shifts | List | ✅ | Name + start + end. |
| Departments | List | ✅ | Default: Transport, Fees, Marketing, Academic, Master Admin, Discipline, Sports, IT. Add custom. |

Wizard tabs: School | Structure | Subjects | Review. During onboarding nav: Home + My School + My Staff.

## Step 2 — Structure (`StructureStep.tsx`)
Tabs: Classes | Sessions.

**Classes (default):**
- Quick-add Nursery → Class 12.
- Custom input (Pre-Nursery etc).
- Drag to reorder (display order).
- Wing filter + search.
- Per class card: editable name + 4-char uppercase code, pill sections (inline name + 2-char code), dependency badges (students/subjects/teachers/status), wing dropdown, "Custom session dates" link.

**Sessions:**
- Auto-assigned academic year badge (read-only).
- Term structure: Annual / Term 1+2 / Sem 1+2 / Sem 1+2+3 / custom cards (drag to reorder).
- Class Date Overrides: list all classes, toggle per-class custom dates → `class_session_dates`.

Saves: `academic_sessions`, `classes` (incl. `wing_id`, `term_structure`), `sections` (name/acronym/order/stream), `class_session_dates`.

## Step 3 — Subjects (`SubjectsStep.tsx`)
Per section: add name + code. Class accordion → sections. Category badges (Primary/Middle/Secondary/Senior).

Pre-loaded by category/stream:
| Category / Stream | Subjects |
|---|---|
| Primary (N-5) | English, Hindi, Math, EVS, GK, Art & Craft, Computer |
| Middle (6-8) | English, Hindi, Math, Science, SST, Sanskrit, Computer |
| Secondary (9-10) | English, Hindi, Math, Science, SST, Sanskrit, Computer, PE |
| Science (11-12) | Physics, Chemistry, Biology, Math, English, PE |
| Commerce (11-12) | Accountancy, Economics, Business Studies, Math, English |
| Arts (11-12) | History, Geography, PolSci, Sociology, English, Psychology |

Per section: stream selector (11-12), subject toggles, custom (code = first 3 letters + seq), "Copy from Section A", remove custom.

Saves: `section_subjects` (name, code, stream).

## Step 4 — Review (`SummaryStep.tsx`)
Read-only summary: School / Academic session / Classes & subjects. "Complete Setup" → writes everything, redirects to My School.

## Navigation & Redirect
- `/school/onboarding` — wizard.
- On `onboarding_complete = true` → `/school`.
- After password change: `/school/onboarding` if incomplete, else `/`.
- My School: redirects to `/school/onboarding` if not complete.
- People: "Complete onboarding first" empty state.

## RLS Gate
`staff` + `students` policies require `schools.onboarding_complete = true`. Migration: `20260512000000_onboarding_gate_rls.sql`.
