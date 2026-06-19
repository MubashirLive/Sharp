# Houses Assignment — Collapsed Card Redesign

**Date:** 2026-06-19
**Owner:** SHARP frontend
**Scope:** `src/components/role-manager/HouseAssignmentCard.tsx` — collapsed (always-visible) block only
**Aesthetic:** Refined claymorphism (existing `.clay-*` utilities)

## Context

Today the collapsed block of every house card is a flat bordered container with a `<table>` of `text-xs` rows: `STUDENTS | TEACHERS` headers, a `Total:` row, then one row per wing showing `Wing: N ♂M ♀F` and the parallel teachers line. The four headline counts (incharge, staff, students, teachers) are **never displayed as totals in the collapsed view** — they exist only as inline header chips. The table mixes totals and per-wing breakdown in the same vertical column, and the gender split is raw Unicode symbols crammed into a sentence.

Outcome: an admin opening the Role Manager > Houses tab should see, at a glance, **how many incharges, staff, students, and teachers belong to each house**, plus a clean per-wing breakdown with a visual male/female proportion — without expanding any card.

## Goals

1. Show the four headline counts (incharge, staff, students, teachers) in the collapsed view, not only in the header.
2. Use the existing claymorphism design system (no new tokens, no new fonts).
3. Per-house color appears as a 3px gradient accent bar on each stat card.
4. Per-wing breakdown gains a stacked bar for male/female ratio.
5. Touch targets ≥ 44px; dark mode parity; `prefers-reduced-motion` respected.
6. Diff is surgical: **only the collapsed stats block (lines 299–325 of `HouseAssignmentCard.tsx`)** is changed. The header row (lines 261–297) and the expanded body (lines 327+) are untouched.

## Non-Goals

- Header row restyle (emblem, name, incharge/staff count chips, chevron) — out of scope.
- Expanded state (ReadOnlyBody, EditBody) — out of scope.
- Department / Wings / Subjects sibling cards — out of scope.
- New tokens, new fonts, new color palette — reuse existing.
- Data shape changes (no new fields; the `stats` object is unchanged).

## Design

### Visual structure (collapsed block, replaces lines 299–325)

```
┌───────────────────────────────────────────────────────┐
│  ▆▆▆  3px house-color gradient bar (full width)       │
│                                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │ ♛    │  │ 👤   │  │ 🎓   │  │ 📖   │  ← 4 mini    │
│  │ 02   │  │ 14   │  │ 142  │  │ 28   │    stat cards │
│  │INCHG │  │STAFF │  │STUDNT│  │TCHRS │    (grid-cols-4)│
│  └──────┘  └──────┘  └──────┘  └──────┘               │
│                                                        │
│  Per-wing breakdown                                    │
│  ─────────────────                                     │
│  A-Wing  ████████░░░░░░  M 48  F 32        T: 11       │
│  B-Wing  █████░░░░░░░░░  M 20  F 28        T: 06       │
│  C-Wing  ████░░░░░░░░░░  M 12  F 22        T: 11       │
│                                                        │
└───────────────────────────────────────────────────────┘
```

### Tokens used (all existing)

| Concern | Token / class | Source |
|---|---|---|
| Card surface | `.clay-card` | `src/index.css:185` |
| Stat card | `.clay-stat-card` (3px gradient top-bar via `::before`) | `src/index.css:408` |
| Stat value (number) | `.clay-stat-value` (1.875rem / 700 / -0.03em) | `src/index.css:447` |
| Stat label (caption) | `.clay-stat-label` (0.75rem / 600 / uppercase / 0.06em) | `src/index.css:439` |
| Per-wing row | `.clay-table-container > .clay-table` row styles | `src/index.css:306–356` |
| Stacked bar | inline flex with two `bg-*-500` segments + `aria-valuenow` | new helper `GenderStackedBar.tsx` |
| Font | `Plus Jakarta Sans` 400/500/600/700 | `src/index.css:138` |
| Color | HSL CSS vars + per-house `definition.color` (hex from DB) | `tailwind.config.ts`, `docs/HOUSE.md` |
| Icons | Lucide: `Crown`, `Users`, `GraduationCap`, `BookOpen` — `w-3.5 h-3.5` | `docs/DESIGN_SYSTEM.md:580` |
| Motion | `transition-all duration-200 ease-out` on hover-lift; disable if `prefers-reduced-motion: reduce` | `docs/DESIGN_SYSTEM.md:251–334` |
| Dark mode | All `.clay-*` utilities already dark-mode-aware | `src/index.css:78–131` |

### Type scale applied

| Element | Class | Effective |
|---|---|---|
| Stat value (large number) | `.clay-stat-value` | 30px / 700 / -0.03em |
| Stat label | `.clay-stat-label` | 12px / 600 / uppercase / 0.06em |
| Wing name (per-wing row) | `text-sm font-semibold` | 14px / 600 |
| Wing counts (`M 48 F 32`) | `text-xs font-medium tabular-nums` | 12px / 500 / `font-variant-numeric: tabular-nums` |
| Bar segment fallback | `text-[10px] font-medium tabular-nums` | 10px / 500 / tabular |

### Spacing (4px base, design system §4)

| Element | Token | Value |
|---|---|---|
| Card outer padding | `p-4` | 16px (was 12px) — matches `.clay-card` spec |
| Stat card grid gap | `gap-3` | 12px |
| Stat card internal padding | `p-3` (inherited from `.clay-stat-card`) | 12px |
| Section divider | `mt-4 pt-3 border-t border-border` | 16px / 12px |
| Per-wing row vertical rhythm | `py-1.5` | 6px each side, 12px row |
| Bar height | `h-1.5` | 6px |
| Bar inline gap | `gap-2` | 8px |

### Alignment rules

- All four stat cards: identical internal layout (`flex flex-col items-start gap-1`).
- Stat value is `text-left` (no centering — preserves left-rhythm across the row).
- Per-wing rows: 3-column grid `grid-cols-[1fr_auto_auto] gap-3` — wing name, bar, counts. Vertically centered.
- Counts column is `text-right tabular-nums` so digits align vertically across rows.
- Bar and counts share a fixed minimum width so rows don't jitter as numbers change.

### 3px gradient accent bar (per-house)

- Apply the existing `.clay-stat-card` class — its `::before` pseudo-element is a 3px gradient bar across the card top.
- **Override the gradient direction** so it uses the house color (not the brand violet):
  ```css
  /* per-card, set via inline style or a CSS var */
  .clay-stat-card { --accent-from: var(--house-color); --accent-to: var(--house-color); }
  ```
- Implementation: pass `style={{ '--house-color': definition.color }}` to the wrapper. The existing `.clay-stat-card` `::before` reads from CSS vars `var(--accent-from)` / `var(--accent-to)`. We add a **fallback override** in `src/index.css` so the stat-card gradient honors the CSS var when set:
  ```css
  .clay-stat-card::before {
    background: linear-gradient(
      90deg,
      var(--accent-from, hsl(var(--primary))) 0%,
      var(--accent-to, hsl(var(--primary))) 100%
    );
  }
  ```
  (One-line additive change to `.clay-stat-card::before` in `src/index.css`. Does not break existing usages because the default falls back to `--primary`.)

### Stacked gender bar (`GenderStackedBar.tsx`)

- New file: `src/components/role-manager/GenderStackedBar.tsx` — pure presentational, no data fetching.
- Props: `{ male: number; female: number; total: number; className?: string }`.
- Renders a 6px-tall horizontal bar split by ratio, with `aria-valuenow` / `aria-valuemin` / `aria-valuemax` for screen readers.
- Male segment: `bg-blue-500` (Tailwind token, dark-mode safe). Female segment: `bg-pink-500`. Empty wing: single gray segment `bg-muted` with `aria-valuenow=0`.
- Hidden tooltip via `title` attribute: `"{male} male / {female} female"`.
- Respects `prefers-reduced-motion`: no transition.
- Width: takes full available width of its grid cell.

### 4-mini-stat-card row (collapsed block, replaces table)

Grid: `grid grid-cols-2 sm:grid-cols-4 gap-3`.

Each card uses the existing `.clay-stat-card` class plus:
- `aria-label="{value} {label} in {house name}"` for a11y.
- Hover lift via existing `.clay-card` hover; disabled if `prefers-reduced-motion`.
- Icon at top-left (`w-3.5 h-3.5 text-muted-foreground`), value below, label below value.

### Per-wing row (replaces `<table>`)

Drop the `<table>` — semantically a list, not tabular data. Use a `ul` with `role="list"` and three-column grid rows.

```tsx
<ul className="space-y-1.5" role="list">
  {stats.byWing.map((wing) => (
    <li
      key={wing.wingId ?? wing.wingName}
      className="grid grid-cols-[1fr_120px_auto] items-center gap-3 py-1.5"
    >
      <span className="text-sm font-semibold truncate">{wing.wingName}</span>
      <GenderStackedBar male={wing.studentsMale} female={wing.studentsFemale} total={wing.students} />
      <span className="text-xs font-medium tabular-nums text-right whitespace-nowrap">
        M {wing.studentsMale} · F {wing.studentsFemale} · <span className="text-muted-foreground">T {wing.teachers}</span>
      </span>
    </li>
  ))}
</ul>
```

Two parallel lists? No — collapse the per-wing teachers count into the same row to keep the collapsed view scannable. (Teachers per wing go in the trailing `T {n}` after a muted divider.)

**Decision (locked):** the per-wing row in the collapsed view shows **only student gender split** (male/female bar + M/F counts). The per-wing teacher gender split (`teachersMale` / `teachersFemale`) is dropped from the collapsed view — it remains available in the expanded read-only body if needed later. This keeps each row to one bar + three numbers, preserving scan-ability.

### Empty / zero states

- `stats.totalStudents === 0` → stat value renders `0` with `text-muted-foreground`; bar shows single muted segment; per-wing list shows `No students assigned`.
- `stats.byWing.length === 0` → omit the per-wing section entirely; show a single line of muted text: `No wings defined for this house.`
- All loading / error states are owned by `HousesAssignmentTab` (unchanged).

## Data flow

No data flow change. The component still receives:

```ts
type HouseAssignmentCardProps = {
  definition: { id; name; color; emblem_url? };
  incharges: ...;
  staff: ...;
  staffByWing: ...;
  stats: { totalStudents; totalTeachers; byWing: { wingId; wingName; students; studentsMale; studentsFemale; teachers; teachersMale; teachersFemale }[] };
  // ...other props unchanged
};
```

The new `GenderStackedBar` receives per-wing `studentsMale` / `studentsFemale` / `students` (total). All other state and props are unchanged.

## Files touched

| File | Change | Approx lines |
|---|---|---|
| `src/components/role-manager/HouseAssignmentCard.tsx` | Replace lines 299–325 (the `<div className="p-3">` block) with new stat-card grid + per-wing list. Update imports (add `Crown`, `Users`, `GraduationCap`, `BookOpen` if not already — currently `Crown`, `User` are imported; replace `User` with `Users`, add `GraduationCap`, `BookOpen`). | ~30 lines net add |
| `src/components/role-manager/GenderStackedBar.tsx` | **New file** — pure presentational. | ~40 lines |
| `src/index.css` | One-line additive override to `.clay-stat-card::before` to honor `--accent-from` / `--accent-to` CSS vars. | +3 lines |
| `src/test/roleAssignments.test.tsx` | Add test: collapsed block renders 4 stat cards with correct counts; renders per-wing list with gender bar; empty-wings path renders fallback text. | +1 test file, ~50 lines |

No other files change. The expanded state, the read-only body, the edit body, the incharge/staff pickers, and the parent tab all remain untouched.

## Testing

1. **Unit / component (Vitest + RTL)** — extend `src/test/roleAssignments.test.tsx`:
   - Renders 4 stat cards in collapsed view, each with correct value + label.
   - `aria-label` includes house name on each card.
   - Per-wing list renders N rows for N wings; gender bar reflects male/female ratio (assert `aria-valuenow`).
   - Empty wings path renders fallback text.
   - Zero totals render `0` muted.
   - **No expanded-state assertions in this test** (out of scope).
2. **Visual** — manual screenshot at 360px, 768px, 1280px viewports, light + dark mode. Verify:
   - 4-column row collapses to 2-column at <640px.
   - 3px gradient bar visible at top of card in house color.
   - Stacked gender bars sum to 100% width.
   - 44px touch target on the chevron (unchanged — header not in scope).
3. **Accessibility** — keyboard tab through stat cards (they're not focusable; chevron is the only focusable element in collapsed view — same as today). `prefers-reduced-motion` removes hover lift.
4. **Type-check + lint** — `npm run type-check` and `npm run lint` clean.
5. **Test runner** — `npm test` passes.

## Accessibility checklist (from `docs/DESIGN_SYSTEM.md:496`)

- [x] 4.5:1 text contrast — stat values inherit `foreground` token; labels inherit `muted-foreground` (AA on `--background`).
- [x] 44px touch target — stat cards are non-interactive; chevron already meets the bar.
- [x] `aria-label` on each stat card references the house name.
- [x] `aria-valuenow` / `aria-valuemin` / `aria-valuemax` on gender bar.
- [x] `role="list"` on the per-wing `<ul>`.
- [x] `prefers-reduced-motion` honored (no transition on bar fill or hover lift).
- [x] No emoji icons (Lucide only).

## Rollout

- Branch: `feat/role-manager-houses-collapsed-redesign`
- One PR. No DB migration. No RLS change. No new dependency.
- After merge: optionally apply the same `.clay-stat-card` treatment to `DepartmentAssignmentCard.tsx` (out of scope here; follow-up issue).

## Open questions

None. All four user-confirmed design choices are captured above. The implementation is a single component refactor with one tiny CSS additive change and one new tiny presentational component.
