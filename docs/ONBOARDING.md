# SHARP — Onboarding Specification

> Last updated: May 2026
> Source: consolidated from PRD.md, PERMISSION_MATRIX.md, SCREEN_FLOW_MAP.md, SUPERMaster Admin.md, CLAUDE.md

---

## OVERVIEW

One-time setup. Steps fixed — cannot be skipped.

| Step | Who | What |
|------|-----|------|
| 1 | Principal / Master Admin | Completes School Form (houses, shifts, departments) |
| 2 | Principal / Master Admin | Confirms auto-assigned academic year + completes Session Form (classes, sections) |
| 3 | Principal / Master Admin | Assigns subjects to each section |
| 4 | Principal / Master Admin | Reviews and submits (SummaryStep) |

> Step 1, 2 and 3 are onboarding setup.
> Super Admin creates the Principal ID before the Principal ever logs in — see docs/SUPERADMIN.md.

---

## STEP 1 — SCHOOL FORM (Principal — Onboarding Wizard)

First screen the Principal sees after first login is the Principal Dashboard.

**Principal fills in this step:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Houses | List | ✅ | Add house name + emblem. Default: Red, Blue, Green, Yellow. |
| Shifts | List | ✅ | Add shift name + start/end time. |
| Departments | List | ✅ | Default: Transport, Fees, Marketing, Academic, Master Admin, Discipline, Sports, IT. Add custom. |

This step is part of the 4-tab onboarding wizard: School | Session & Classes | Subjects | Review.
Nav during onboarding: Home + My School + My Staff only.

---

## STEP 2 — STRUCTURE FORM

**Component:** `StructureStep.tsx` (tabbed: Classes | Sessions)

4-tab onboarding wizard: School | Structure | Subjects | Review.

### Classes Tab (default)

- **Quick-add buttons** — Nursery to Class 12 (one click each)
- **Custom input** — for classes not in the default list (e.g. Pre-Nursery)
- **Drag to reorder** — affects display order in student forms
- **Wing filter + search** — filter classes by wing or search by name/code
- **Per class card:**
  - Class name: inline editable
  - Class code (roll prefix): inline editable via pencil icon
  - Sections: pill-style, each with inline-editable name + section code
  - Dependency badges: student count, subject count, teacher count, status
  - Wing assignment dropdown
  - "Custom session dates" link → navigates to Sessions tab
- **Settings panel** (collapsed): roll prefix, wing assignment

### Sessions Tab

- Academic year badge (read-only)
- Term structure dropdown (Annual, Term 1 & 2, Semester 1 & 2, etc.)
- Term cards with drag-to-reorder
- Each term: inline-editable name, start date, end date
- "Class Date Overrides" section:
  - Lists all classes
  - Toggle custom dates per class
  - Saves to `class_session_dates` table

### Saves To

- `academic_sessions` — academic year + start_date/end_date
- `classes` — name, acronym, display_order, wing, wing_id
- `sections` — name, acronym (2-char), display_order, stream
- `class_session_dates` — per-class date overrides

---

## STEP 3 — SUBJECTS FORM

**Component:** `SubjectsStep.tsx`

Per section: add subjects with name + code.

### Class Accordion

Each class expands to show its sections. Badge shows category (Primary/Middle/Secondary/Senior).

### Pre-loaded Subjects

Auto-selected based on class category or stream:

| Category / Stream | Subjects |
|---|---|
| Primary (Nursery–5) | English, Hindi, Mathematics, EVS, GK, Art & Craft, Computer |
| Middle (6–8) | English, Hindi, Mathematics, Science, SST, Sanskrit, Computer |
| Secondary (9–10) | English, Hindi, Mathematics, Science, SST, Sanskrit, Computer, Physical Education |
| Science (11–12) | Physics, Chemistry, Biology, Mathematics, English, Physical Education |
| Commerce (11–12) | Accountancy, Economics, Business Studies, Mathematics, English |
| Arts (11–12) | History, Geography, Political Science, Sociology, English, Psychology |

### Per Section Panel

- **Stream selector** (Class 11–12 only) — must select stream before subjects appear
- **Subject toggles** — click pre-loaded subjects to select/deselect
- **Custom subjects** — add by name, code auto-generated from first 3 letters + sequence number
- **Copy from Section A** — for sections B, C, etc., copy subjects + stream from Section A
- **Remove custom subject** — X button on custom-added badges

### Saves To

`section_subjects` — per-section subject assignments (name, code, stream)

---

## STEP 4 — REVIEW

**Component:** `SummaryStep.tsx`

Read-only summary. Shows:

- **School** — name, address, contact, board/type, shifts
- **Academic Session** — year, class count, section count
- **Classes & Subjects** — each class with term structure, dates, sections, subject badges

No edits on this screen. "Complete Setup" writes all data and redirects to My School.

---

## NAVIGATION & REDIRECT RULES- Onboarding wizard: `/school/onboarding`
- Redirects to `/school` once `onboarding_complete = true`
- After password change: redirects to `/school/onboarding` if onboarding incomplete, else `/`
- My School page: redirects to `/school/onboarding` if onboarding not complete
- People.tsx: shows "Complete onboarding first" empty state if `onboarding_complete = false`

## RLS GATE

RLS policies for `staff` and `students` require `schools.onboarding_complete = true`.
Migration: `20260512000000_onboarding_gate_rls.sql`