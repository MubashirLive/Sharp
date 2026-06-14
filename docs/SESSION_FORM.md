# Session & Classes Form

## Module

My School > Structure (tabbed: Classes | Sessions)

## Access

Principal, Master Admin, and Admin have CRUD access.

This form is used during onboarding and after onboarding. After onboarding, it behaves as a structural school-management screen, not only as a setup wizard.

## Purpose

The Structure screen defines the academic structure of the school via two tabs:

**Classes tab** (default):
- Class names and codes
- Sections and section codes (auto-derived)
- Class order (drag-to-reorder)
- Wing filter (tabs)
- Search and filter by wing
- Roll number help tooltip

**Sessions tab** (secondary):
- Term/semester structure for the academic year
- Term cards with start/end dates
- Class-specific date overrides (via `class_session_dates` table)

Subjects, students, attendance, wings, teacher assignments, reports, calendar, messenger visibility, and role management depend on this structure.

## Architecture

```
SchoolPage.tsx (tab container)
├── ClassesStep.tsx (default tab)
│   ├── Academic year badge
│   ├── Search bar
│   ├── Quick-add + custom class inputs
│   ├── WingClassFilter (shared component) → wing tabs
│   │   └── Class cards (drag-to-reorder)
│   │       ├── Section pills (inline editable name, auto-derive code)
│   │       └── Dependency badges (students, teachers)
│   └── Roll number help tooltip
└── SessionsStep.tsx (secondary tab)
    ├── Academic year + dates
    ├── Term structure selector
    ├── Term cards (drag-to-reorder)
    └── Class date overrides (class_session_dates)
```

## Field Matrix — Classes Tab

| Field | Type | Required | Notes |
|---|---|---|---|
| Academic Year | Badge | Yes | Read-only. Set during onboarding. |
| Search | Text | No | Filter by class name or code |
| Wing Filter | Tabs | No | All + per-wing + Unassigned (via WingClassFilter) |
| Class Name | Text / preset | Yes | Quick-add buttons + custom input |
| Class Code | Text | Yes | Unique in session; used in roll numbers. Editable inline in card. |
| Class Order | Drag-and-drop | Yes | Defines display order across modules |
| Section Name | Text | Yes | Inline editable. Max 12 chars. |
| Section Code | Auto-derived | Yes | 1 char if name=1 char; 2 chars if name>=2. Strip non-alpha first. Never manually editable. |
| Wing | N/A | — | Wing assignment removed from class cards. Use Wings tab instead. |

## Field Matrix — Sessions Tab

| Field | Type | Required | Notes |
|---|---|---|---|
| Academic Year | Badge | Yes | Read-only |
| Term Structure | Dropdown | Yes | Annual, Term 1 & 2, Semester 1 & 2, etc. |
| Term Name | Text | Yes | Inline editable |
| Term Start Date | Date | Yes | Must be within academic year |
| Term End Date | Date | Yes | Must be after start date |
| Class Date Override | Toggle + dates | No | Overrides for specific classes |

## Dependency Summary — Classes Tab

Each class card shows badges indicating:

- Student count (loaded from DB)
- Subject count (loaded from DB)
- Teacher count (loaded from DB)
- Status: Complete | Incomplete | Missing

These are fetched on-demand for saved classes (those with `_id`).

## Wing Filter

Shared via `WingClassFilter` component (`src/components/ui/WingClassFilter.tsx`).

Rendered as tabs: All + per-wing + Unassigned (if any unassigned classes exist). Uses `wing_id` to filter classes.

Reused by: Classes tab, Subjects tab.

## Search and Filters

Classes tab supports:

- Search by class name or code (text input above wing tabs)
- Filter by wing (WingClassFilter tabs — All / per-wing / Unassigned)

Sessions tab shows all terms and class overrides without filtering.

## Validation

**Blocking errors (save blocked):**
- Duplicate class codes
- Duplicate section codes inside same class
- Classes without sections
- Session end date before start date
- Term end date before start date

## Deletion Protocol

Class and section removal requires dependency check before confirmation.

Confirmation shows:
- Item being removed
- Student count
- Subject count
- Teacher count
- Attendance dependency

## Section Code Auto-derivation

When section name is edited:
1. Strip non-alpha characters: `name.replace(/[^a-zA-Z]/g, "")`
2. If result length === 1 → use that char as code (e.g., "A" → "A")
3. If result length >= 2 → use first 2 chars (e.g., "Arts" → "AR", "Blue" → "BL")
4. Section code is never manually editable — always auto-derived

## Roll Number Formula

Shown via help icon (HelpCircle) in the filter bar. Hover tooltip explains:

```
Roll No. = Class Code + Section Code + Sequence
Example: 9A01 → Class 9, Section A, Roll #01
- Class Code: from class name (e.g., 9, N, 11S)
- Section Code: 1-2 chars from section name (A→A, Arts→AR)
- Sequence: auto-assigned 01, 02, ...
```

Roll prefix display removed from individual section pills.

## Custom Session Dates

When a class has different session dates from the academic year:

1. User clicks "Custom session dates" on class card
2. Navigates to Sessions tab with class pre-selected
3. Expand class override card
4. Toggle "Set Custom Dates" → inputs appear
5. Save → `class_session_dates` upserted

## Save Behavior

**Classes tab saves:**
- `classes` — insert/update/delete
- `sections` — insert/update/delete (with auto-derived acronym)
- `display_order` changes

**Sessions tab saves:**
- `academic_sessions` — term structure
- `class_session_dates` — per-class date overrides

## Downstream Modules

Changes affect:

- Students
- Subjects
- Subject Teacher assignments
- Class Teacher assignments
- Wings
- Attendance
- Calendar
- Reports

## Components

| Component | File | Purpose |
|-----------|------|---------|
| ClassesStep | `onboarding/ClassesStep.tsx` | Class/section management with wing filter |
| SessionsStep | `onboarding/SessionsStep.tsx` | Terms + date overrides |
| WingClassFilter | `ui/WingClassFilter.tsx` | Reusable wing tab filter (Classes + Subjects) |