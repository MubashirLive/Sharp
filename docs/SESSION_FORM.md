# Session & Classes Form

> My School > **Structure** (single tab — Sessions are configured during onboarding only).
> Classes tab spec: `docs/CLASSES_FIX.md`. Sessions step spec: `docs/ONBOARDING.md`.

## Status

| UI surface | Built? | File |
|---|---|---|
| My School > Structure > Classes | ✅ Built | `src/components/school/ClassesTab.tsx` |
| My School > Structure > Sessions | ❌ Not built as a tab. Sessions configured in onboarding only | `src/components/onboarding/SessionsStep.tsx` (onboarding only) |
| Onboarding > Sessions | ✅ Built | `src/components/onboarding/SessionsStep.tsx` |

## Access

Principal, Master Admin, Admin have CRUD access. My School > Structure is the post-onboarding school-management screen (not just setup wizard).

## Purpose

**Classes tab** (current): class names + codes, sections + auto-derived codes, class order (drag-to-reorder), wing filter, search.

**Sessions** (onboarding only): term/semester structure, term cards with start/end dates, class-specific date overrides (`class_session_dates`).

Downstream consumers: Subjects · Students · Attendance · Wings · Teacher assignments · Reports · Calendar · Messenger visibility · Role management.

## Architecture

```
SchoolPage.tsx (tab container)
└── ClassesTab.tsx (MY School side; onboarding ClassesStep.tsx is separate, frozen)
    ├── Academic year badge
    ├── Search bar
    ├── Quick-add + custom class inputs
    ├── WingClassFilter (shared) → wing tabs
    │   └── Class cards (drag-to-reorder)
    │       ├── Section pills (inline editable name, auto-derive code)
    │       └── Dependency badges (students, teachers)
    └── Roll number help tooltip
```

## Field Matrix — Classes Tab

| Field | Type | Required | Notes |
|---|---|---|---|
| Academic Year | Badge | Yes | Read-only. Set during onboarding. |
| Search | Text | No | Filter by class name or code |
| Wing Filter | Tabs | No | All + per-wing + Unassigned (`WingClassFilter`) |
| Class Name | Text / preset | Yes | Quick-add buttons + custom input |
| Class Code | Text | Yes | Unique in session; used in roll numbers. Editable inline in card. |
| Class Order | Drag-and-drop | Yes | Defines display order across modules |
| Section Name | Text | Yes | Inline editable. Max 12 chars. |
| Section Code | Auto-derived | Yes | 1 char if name=1 char; 2 chars if name≥2. Strip non-alpha first. Never manually editable. |
| Wing | — | — | Wing assignment removed from class cards. Wings tab owns it. |

## Field Matrix — Onboarding Sessions (SessionsStep)

| Field | Type | Required | Notes |
|---|---|---|---|
| Academic Year | Badge | Yes | Read-only |
| Term Structure | Dropdown | Yes | Annual, Term 1 & 2, Semester 1 & 2, etc. |
| Term Name | Text | Yes | Inline editable |
| Term Start Date | Date | Yes | Must be within academic year |
| Term End Date | Date | Yes | Must be after start |
| Class Date Override | Toggle + dates | No | Overrides for specific classes (`class_session_dates` table) |

## Dependency badges — Classes Tab

Each class card shows: Student count, Subject count, Teacher count, Status (Complete / Incomplete / Missing). Fetched on-demand for saved classes (those with `_id`).

## Wing filter

`WingClassFilter` (`src/components/ui/WingClassFilter.tsx`) renders tabs: All + per-wing + Unassigned (if any). Uses `wing_id` to filter. Reused by Classes tab + Subjects tab.

## Search and filters

- Search by class name or code (text input above wing tabs)
- Filter by wing (tabs — All / per-wing / Unassigned)

## Validation (blocking)

- Duplicate class codes
- Duplicate section codes inside same class
- Classes without sections
- Session end before start
- Term end before start

## Deletion protocol

Class and section removal requires dependency check before confirmation. Confirmation shows: item, student count, subject count, teacher count, attendance dependency.

## Section code auto-derivation

1. `name.replace(/[^a-zA-Z]/g, "")`
2. Length === 1 → that char
3. Length ≥ 2 → first 2 chars (e.g. "Arts" → "AR", "Blue" → "BL")
4. Never manually editable

## Roll number formula

```
Roll No. = Class Code + Section Code + Sequence
Example: 9A01 → Class 9, Section A, Roll #01
- Class Code: from class name (9, N, 11S)
- Section Code: 1-2 chars from section name (A→A, Arts→AR)
- Sequence: auto-assigned 01, 02, ...
```

## Custom session dates

1. User clicks "Custom session dates" on class card (planned, not yet built in My School)
2. Navigate to onboarding Sessions step with class pre-selected
3. Expand class override card
4. Toggle "Set Custom Dates" → inputs appear
5. Save → `class_session_dates` upserted

## Save behavior

**Classes tab:** `classes` insert/update/delete · `sections` insert/update/delete (auto-derived acronym) · `display_order` changes
**Sessions step (onboarding):** `academic_sessions` term structure · `class_session_dates` per-class overrides

## Downstream modules

Students · Subjects · Subject Teacher assignments · Class Teacher assignments · Wings · Attendance · Calendar · Reports

## Components

| Component | File | Purpose |
|---|---|---|
| `ClassesTab` | `school/ClassesTab.tsx` | MY School Classes tab (see `CLASSES_FIX.md`) |
| `ClassesStep` | `onboarding/ClassesStep.tsx` | Onboarding Classes step (frozen, separate) |
| `SessionsStep` | `onboarding/SessionsStep.tsx` | Onboarding Sessions step (term structure + class date overrides) |
| `WingClassFilter` | `ui/WingClassFilter.tsx` | Reusable wing tab filter (Classes + Subjects) |

## Open work

- Build a post-onboarding Sessions tab in My School > Structure (currently SessionsStep is onboarding-only).
- Wire "Custom session dates" link from a class card to that tab.
- Surface class_session_dates in class cards (read-only override badge).