# Houses Tab — Horizontal Card + Inline Student Count

**Date:** 2026-06-20
**Owner:** SHARP frontend
**Scope:** `src/components/role-manager/HouseAssignmentCard.tsx` + `HousesAssignmentTab.tsx` (grid)
**Aesthetic:** Refined claymorphism (existing `.clay-*` utilities)

## Context

The previous redesign added 3 mini stat-cards (incharge / staff / students) at the top of the collapsed block. User feedback: that felt cramped, and the student count should sit inline next to incharge + staff in the header (matching the existing pattern). Also: cards are currently in a 2-column grid on tablet+ — user wants them full-width (one per row) so the per-wing breakdown has room to breathe.

Outcome: a single full-width house card with a header row that reads `♛ 2 · 👤 6 · 🎓 80 · ›` and a per-wing breakdown underneath.

## Goals

1. Card is full-width (one per row) on all breakpoints.
2. Header row has **three** inline icon counts: incharge, staff, **students** (newly added inline).
3. Remove the 3-mini-stat-card row entirely.
4. Per-wing breakdown + Total row stay exactly as the previous redesign left them.
5. Touch targets ≥ 44px; dark mode parity; `prefers-reduced-motion` respected.
6. Diff is surgical — only the grid wrapper in `HousesAssignmentTab.tsx` and the collapsed block in `HouseAssignmentCard.tsx` change.

## Non-Goals

- Header restyle (emblem, name, chevron placement) — header just gets the new icon count.
- Per-wing breakdown or Total row changes — preserved verbatim.
- Expanded state, edit body, footer — untouched.
- Department / Wings / Subjects cards — out of scope.
- New tokens, fonts, colors — reuse existing.

## Design

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│  (R)  Red House            ♛ 2  👤 6  🎓 80                       ▾       │
│  ─────────────────────────────────────────────────────────────────────     │
│  A-Wing  ████████░░░  M 24 · F 16 · T 5                                    │
│  B-Wing  █████░░░░░░  M 15 · F 10 · T 5                                    │
│  C-Wing  ████░░░░░░░  M 9  · F 6  · T 4                                    │
│  ─────────────────────────────────────────────────────────────────────     │
│  Total       ████░░░  M 48 · F 32 · T 14                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

- Outer wrapper: full width (no inner column on tablet+).
- Inner wrapper of `HousesAssignmentTab.tsx`: change from `grid grid-cols-1 md:grid-cols-2 gap-4` → `flex flex-col gap-4`. One card per row, all viewports.

### Header row (lines 267–303)

Preserve verbatim **except** the right-side counter group (lines 285–302). New group:

```tsx
<span className="text-xs text-muted-foreground flex items-center gap-3">
  <span className="flex items-center gap-1">
    <Crown className="h-3 w-3 text-amber-600" />
    {effectiveIncharges.length}
  </span>
  <span className="flex items-center gap-1">
    <Users className="h-3 w-3" />
    {effectiveStaff.length}
  </span>
  <span className="flex items-center gap-1">
    <GraduationCap className="h-3 w-3" />
    {stats.totalStudents}
  </span>
</span>
```

- Replace the existing `gap-1` (between icon and count) with `gap-3` between the three groups.
- Replace `User` with `Users` in this group (semantic clarity — User is a person icon, Users is plural, matches the staff-count meaning). `User` is still used elsewhere in the component (read-only body + edit body) — keep that import.
- Add `GraduationCap` to lucide import (already imported for the removed stat-cards — just don't remove it from the import).
- `aria-label` on the wrapper span: `"{n} incharges, {n} staff, {n} students in {house name}"`.

### Collapsed stats block (lines 304–end-of-collapsed)

Remove the 3-mini-stat-card grid (the `<div className="grid grid-cols-3 gap-3">` block). Keep everything else (per-wing list + Total row + empty-wings fallback + house-color CSS vars). Trim the wrapper padding from `p-4` → `p-3` since the stat-cards no longer need the extra breathing room.

### CSS-var wiring (`.clay-stat-card::before`)

Still in effect but **no longer used** by the collapsed block. Other consumers (e.g. the HousesTab in My School) still use `.clay-stat-card`, so the CSS-var override stays. No code change.

### `GenderStackedBar`

Untouched. Still used in the per-wing list and Total row.

## Data flow

No change. Same `HouseWithStats` prop. The student count for the header is `stats.totalStudents` (already on the type).

## Files touched

| File | Change | Approx lines |
|---|---|---|
| `src/components/role-manager/HouseAssignmentCard.tsx` | Header: replace single `<span>` with 3 icon-count groups (incharge, staff, students) with `gap-3`. Collapsed: remove the `grid grid-cols-3 gap-3` stat-card block, drop wrapper padding to `p-3`, keep per-wing list + Total row. | ~10 net change |
| `src/components/role-manager/HousesAssignmentTab.tsx` | Outer grid `grid grid-cols-1 md:grid-cols-2 gap-4` → `flex flex-col gap-4`. | ~1 line |

## Testing

1. **Unit / component (Vitest + RTL)** — extend `src/test/houseAssignmentCardCollapsed.test.tsx`:
   - Remove the "renders 3 mini stat-cards" test (those cards no longer exist).
   - Add: header renders the 3 inline icon counts with correct values.
   - Add: header `aria-label` references the house name and all 3 counts.
   - Keep: per-wing list count, per-wing row text, gender bar aria values, Total row, empty-wings fallback, zero-count, zero-student edge case.

2. **Type-check + tests** — `npm run type-check` clean; `npx vitest run src/test/houseAssignmentCardCollapsed.test.tsx` all pass; `npx vitest run` shows no new failures.

## Accessibility checklist

- [x] 4.5:1 contrast on the inline counts (text-muted-foreground on card surface, already AA).
- [x] 44px touch target on the chevron (unchanged).
- [x] `aria-label` on header count wrapper references house name and all 3 counts.
- [x] `role="list"` on per-wing `<ul>` (preserved).
- [x] `aria-valuenow` on gender bar (preserved).
- [x] `prefers-reduced-motion` honored (no transitions in the new code).
- [x] No emoji icons (Lucide only).

## Rollout

- Branch: `feat/role-manager-houses-horizontal-card`
- One PR. No DB migration. No RLS change. No new dependency.
- After merge: no follow-up.

## Open questions

None.
