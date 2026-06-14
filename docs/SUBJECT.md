# Subject Assignment Module

> **Scope:** This document covers **subject → class-section** assignment only (managed in My School > Subjects tab). It does NOT cover **teacher → subject** assignment. Teacher assignment to subjects and class-teacher designation is owned by [ROLE_MANAGER.md §4.2 Subjects Tab](ROLE_MANAGER.md). The Subjects tab in My School writes to `section_subjects`; the Role Manager writes to `staff_roles`. They are separate tables and separate write interfaces.

## Module

My School > Subjects (tab)

## Access

Principal, Master Admin, and Admin have edit access. Read-only for other roles.

## Purpose

Assign subjects to class-sections. Pre-defined subject library by class level. Custom subjects can be added per school.

## Architecture

```
SubjectTab.tsx
├── Wing-based tabs (dynamic: wing names + Unassigned + All)
├── SubjectGrid.tsx (Excel-like grid)
│   ├── Class rows
│   └── Section columns (clickable cells)
├── SubjectCell.tsx (pill display per cell)
└── SubjectEditModal.tsx (edit popup per cell)
```

## UI Structure

### Grid Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Save All Subjects]                                                ← top │
├──────────────────────────────────────────────────────────────────────────┤
│ [Wing A] [Wing B] [Wing C] [Unassigned] [All]         ← wing-based tabs │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│         │  Sec A   │  Sec B   │  Sec C   │  Sec D                        │
│  ───────┼──────────┼──────────┼──────────┼──────────                       │
│  Nursery│ [pills]  │ [pills]  │ [pills]  │ [pills]     ← click cell→edit │
│  ───────┼──────────┼──────────┼──────────┼──────────                       │
│  LKG   │ [pills]  │ [pills]  │ [pills]  │ [pills]                        │
│  ───────┼──────────┼──────────┼──────────┼──────────                       │
│  UKG   │ [pills]  │ [pills]  │ [pills]  │ [pills]                        │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Edit Modal

When user clicks a cell:

```
┌─────────────────────────────────────────────┐
│  Nursery — Section B              ☐ Copy    │
│                              from Sec A     │
├─────────────────────────────────────────────┤
│                                             │
│  Assigned (3)                                │
│  [Hindi ×] [Eng ×] [Math ×]                │
│                                             │
│  Available                                   │
│  ☑ Science   ☐ EVS    ☐ Computer           │
│  ☐ Art       ☐ Music  ☐ GK                  │
│                                             │
│  [+ Add Custom Subject]                      │
│                                             │
│  Stream: [Science ▾]  ← Class 11-12 only   │
│                                             │
├─────────────────────────────────────────────┤
│           [Cancel]  [Save & Close]          │
└─────────────────────────────────────────────┘
```

## Data Model

### Subjects Library

Pre-defined by class category:

| Category | Classes | Subjects |
|----------|---------|----------|
| Primary | Nursery, LKG, UKG, 1-5 | English, Hindi, Mathematics, EVS, General Knowledge, Art & Craft, Computer, Music |
| Middle | 6-8 | English, Hindi, Mathematics, Science, Social Science, Sanskrit, Computer |
| Secondary | 9-10 | English, Hindi, Mathematics, Science, Social Science, Sanskrit, Computer, Physical Education |
| Science | 11-12 Science | Physics, Chemistry, Biology, Mathematics, English, Hindi, Physical Education |
| Commerce | 11-12 Commerce | Accountancy, Economics, Business Studies, Mathematics, English, Hindi |
| Arts | 11-12 Arts | History, Geography, Political Science, Sociology, Psychology, English, Hindi |
| Bifocal | 11-12 Bifocal | Physics, Chemistry, Mathematics, English, Hindi, Computer Science |

### Custom Subjects

Schools can add custom subjects. Stored in `section_subjects` with `subject_code = null`.

## Components

| Component | File | Purpose |
|-----------|------|---------|
| SubjectTab | `school/SubjectTab.tsx` | Main container, tabs, Save All |
| SubjectGrid | `school/SubjectGrid.tsx` | Excel-like grid layout |
| SubjectCell | `school/SubjectCell.tsx` | Clickable pill display |
| SubjectEditModal | `school/SubjectEditModal.tsx` | Edit popup with all options |
| CustomSubjectInput | `school/CustomSubjectInput.tsx` | Add custom subject inline |
| subjects | `data/subjects.ts` | Subject library data |

## Key Features

1. **One cell editable at a time** — Click cell → modal opens for that section only
2. **Copy from Section A** — Checkbox copies Section A subjects to target section
3. **Custom subjects** — Add per-school subjects inline
4. **Stream selection** — Class 11-12 can filter by Science/Commerce/Arts/Bifocal
5. **Wing-based tabs** — Filter by wing, Unassigned, or All
6. **All subjects visible** — No "+N more" truncation

## Interactions

| Action | Result |
|--------|--------|
| Click cell | Opens SubjectEditModal |
| Check "Copy from Section A" | Loads Section A subjects |
| Click subject checkbox | Adds to selection |
| Click Assign | Moves selected subjects to assigned |
| Click X on pill | Removes from assigned |
| Enter custom subject | Adds to available and assigns |
| Click Save & Close | Updates cell, closes modal |
| Click Save All | Persists all changes to DB |

## Database

**Tables:**
- `section_subjects` — stores subject assignments per section
- `sections` — stores stream for Class 11-12

**No schema changes required.**

## Downstream Modules

Changes affect:
- Homework assignments
- Attendance tracking
- Reports (subject-wise)
- Timetables

## Related Docs

- [SESSION_FORM.md](SESSION_FORM.md) — Class/section structure
- [ROLE_MANAGER.md](ROLE_MANAGER.md) — Teacher assignments (separate module)