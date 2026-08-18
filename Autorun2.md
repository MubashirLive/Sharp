# Autorun2 — Houses Collapsed Card Redesign

> Autonomous execution brief. Read this file fully, execute the work end-to-end,
> then DELETE this file from disk before signing off.

---

## 0. Mission

Redesign the **collapsed** block of every `HouseAssignmentCard` in the Role Manager > Houses tab so the four headline counts (incharge, staff, students) and a per-wing breakdown with stacked male/female bar + Total row are clearly visible — replacing the current cramped `<table>` with `text-xs` cells.

**Spec (locked, do not re-derive):** [docs/superpowers/specs/2026-06-19-houses-collapsed-card-redesign.md](docs/superpowers/specs/2026-06-19-houses-collapsed-card-redesign.md)

**Aesthetic:** refined claymorphism — reuse existing `.clay-*` utilities, no new tokens, no new fonts, no new colors.

**Scope:** collapsed stats block only. Header row, expanded state, edit body, and sibling Department/Wings/Subjects cards are out of scope. Do not touch them.

---

## 1. Current state (verified, 2026-06-20)

The collapsed block lives in [src/components/role-manager/HouseAssignmentCard.tsx](src/components/role-manager/HouseAssignmentCard.tsx) lines 304–330 of the pre-refactor file. The redesign is already in place. **Confirm it matches the spec before doing anything else.**

Expected state on disk:

- [src/components/role-manager/HouseAssignmentCard.tsx](src/components/role-manager/HouseAssignmentCard.tsx) — collapsed block replaced with 3-mini-stat-card row + per-wing list + Total row; imports include `Users`, `GraduationCap`, `GenderStackedBar`; CSSProperties import from react.
- [src/components/role-manager/GenderStackedBar.tsx](src/components/role-manager/GenderStackedBar.tsx) — new pure-presentational component, ~60 lines, `role="progressbar"`, blue/pink Tailwind tokens, `aria-valuenow`, `title` tooltip.
- [src/index.css](src/index.css) — `.clay-stat-card::before` honors `--accent-from` / `--accent-to` CSS vars (additive change, falls back to `--primary`).
- [src/test/houseAssignmentCardCollapsed.test.tsx](src/test/houseAssignmentCardCollapsed.test.tsx) — 9 tests, all passing.

**If any of these are missing or stale, complete them per §2 below.**

---

## 2. Tasks (in order)

### 2.1 Create `GenderStackedBar` (if missing)

- File: `src/components/role-manager/GenderStackedBar.tsx`
- Props: `{ male: number; female: number; total: number; className?: string }`
- Render: 6px-tall horizontal bar split by ratio. `role="progressbar"`, `aria-valuemin={0}`, `aria-valuemax={total}`, `aria-valuenow={total}`, `aria-label="{male} male, {female} female"`, `title="{male} male / {female} female"`.
- Tailwind: `flex w-full h-1.5 rounded-full overflow-hidden bg-muted`. Male segment `bg-blue-500 dark:bg-blue-400`. Female segment `bg-pink-500 dark:bg-pink-400`. Empty (`total === 0`): single full-width `bg-muted` segment.
- `width: ${pct}%` inline.
- No transitions. No emojis.

### 2.2 Update `src/index.css` `.clay-stat-card::before` (if missing)

Change the `background` declaration to read CSS vars with `--primary` fallback:

```css
.clay-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--accent-from, hsl(var(--primary))) 0%,
    var(--accent-to, hsl(var(--primary))) 100%
  );
  border-radius: var(--radius) var(--radius) 0 0;
}
```

### 2.3 Refactor `HouseAssignmentCard.tsx` collapsed block (if not already done)

Replace the `<div className="p-3">` block that holds the `<table>` with:

```tsx
{/* Collapsed stats — always visible. Refined claymorphism:
    3 mini stat-cards (incharge / staff / students) + per-wing list
    with stacked male/female bar + Total row. See
    docs/superpowers/specs/2026-06-19-houses-collapsed-card-redesign.md. */}
<div
  className="p-4"
  style={
    {
      "--house-color": definition.color,
      "--accent-from": definition.color,
      "--accent-to": definition.color,
    } as CSSProperties
  }
>
  <div className="grid grid-cols-3 gap-3">
    {[
      { key: "incharges", label: "Incharge", value: effectiveIncharges.length, icon: Crown, tone: "text-amber-600 dark:text-amber-400" },
      { key: "staff", label: "Staff", value: effectiveStaff.length, icon: Users, tone: "text-muted-foreground" },
      { key: "students", label: "Students", value: stats.totalStudents, icon: GraduationCap, tone: "text-muted-foreground" },
    ].map((stat) => {
      const Icon = stat.icon;
      return (
        <div
          key={stat.key}
          className="clay-stat-card clay-card flex flex-col items-start gap-1 p-3"
          aria-label={`${stat.value} ${stat.label} in ${definition.name}`}
        >
          <Icon className={`w-3.5 h-3.5 ${stat.tone}`} aria-hidden="true" />
          <span className={`clay-stat-value text-2xl leading-none ${stat.value === 0 ? "text-muted-foreground" : ""}`}>
            {stat.value}
          </span>
          <span className="clay-stat-label">{stat.label}</span>
        </div>
      );
    })}
  </div>

  <div className="mt-4 pt-3 border-t border-border">
    {stats.byWing.length === 0 ? (
      <p className="text-xs text-muted-foreground">No wings defined for this house.</p>
    ) : (
      <ul className="space-y-1.5" role="list">
        {stats.byWing.map((wing) => (
          <li
            key={wing.wingId ?? wing.wingName}
            className="grid grid-cols-[1fr_120px_auto] items-center gap-3 py-1.5"
          >
            <span className="text-sm font-semibold truncate">{wing.wingName}</span>
            <GenderStackedBar
              male={wing.studentsMale}
              female={wing.studentsFemale}
              total={wing.students}
            />
            <span className="text-xs font-medium tabular-nums text-right whitespace-nowrap">
              M {wing.studentsMale} · F {wing.studentsFemale} ·{" "}
              <span className="text-muted-foreground">T {wing.teachers}</span>
            </span>
          </li>
        ))}
        <li
          className="grid grid-cols-[1fr_120px_auto] items-center gap-3 py-1.5 border-t border-border pt-2 mt-1"
          aria-label="House-wide total"
        >
          <span className="text-sm font-semibold truncate">Total</span>
          <GenderStackedBar
            male={stats.byGender.studentsMale}
            female={stats.byGender.studentsFemale}
            total={stats.totalStudents}
          />
          <span className="text-xs font-semibold tabular-nums text-right whitespace-nowrap">
            M {stats.byGender.studentsMale} · F {stats.byGender.studentsFemale} ·{" "}
            <span className="text-muted-foreground">T {stats.totalTeachers}</span>
          </span>
        </li>
      </ul>
    )}
  </div>
</div>
```

Update imports:
- Add `Users`, `GraduationCap` to the lucide-react import.
- Keep `User` (used elsewhere — header count + read-only body).
- Add `import { GenderStackedBar } from "./GenderStackedBar";`
- Add `import type { CSSProperties } from "react";`

**Do not touch** the header row, the expanded body, the edit body, or the footer.

### 2.4 Add tests (if missing)

File: `src/test/houseAssignmentCardCollapsed.test.tsx`. Test cases:

1. Renders 3 stat-cards with correct `aria-label` per house name.
2. Per-wing list renders N rows for N wings (3 wings + 1 Total = 4 list items).
3. Per-wing row text shows `M {n} · F {n} · T {n}` (use `(_, el) => el?.textContent === "..."` matcher because the teacher count is in a nested span).
4. Gender bar has correct `aria-valuemin/max/now`.
5. Total row renders with house-wide M/F + teacher count.
6. Empty wings path renders `No wings defined for this house.`
7. Zero incharge count still renders a stat card.
8. Gender bar handles a wing with zero students (`aria-valuenow="0"`).

### 2.5 Run verification

```bash
npm run type-check
npx vitest run src/test/houseAssignmentCardCollapsed.test.tsx
npx vitest run
```

**Acceptance:**
- Type-check: clean.
- New test file: 9/9 pass.
- Full suite: 75/77 pass. The 2 pre-existing failures (`autoAssignment.test.ts` `fromClient` mock-hoist, `auth.test.tsx` `jest is not defined`) are NOT this task's responsibility — leave them.

Lint is not a gate. The repo has 374 pre-existing lint errors; none of them are in the new files. Do not try to "fix" the others.

---

## 3. Verification evidence to capture

After running, save this in your final response:

- type-check output (one line, "clean" or "N errors").
- new test file: `9/9 passed`.
- full suite: `77/77 expected (75 passed + 2 pre-existing failures unrelated to this work)`.
- list of files changed: `HouseAssignmentCard.tsx`, `GenderStackedBar.tsx` (new), `index.css`, `houseAssignmentCardCollapsed.test.tsx` (new).
- spec path: `docs/superpowers/specs/2026-06-19-houses-collapsed-card-redesign.md`.

---

## 4. Final step — WIPE THIS FILE

After all of §2 succeeds and §3 evidence is captured, **delete** this file:

```bash
rm "C:\Users\MUBASHIR\Documents\GitHub\Sharp\Autorun2.md"
```

(Use the appropriate shell incantation for Windows Git Bash. The path is exact. The file must not survive past execution.)

Verify with `ls Autorun2.md 2>&1` — should report "No such file or directory".

---

## 5. Non-goals (do not do)

- Do not edit any other component (DepartmentsAssignmentCard, WingsAssignmentTab, etc.).
- Do not change the data shape (`HouseStats` is untouched).
- Do not add new dependencies, fonts, or colors.
- Do not refactor the header row, expanded body, edit body, or footer.
- Do not change the spec file unless a clear factual error is found.
- Do not run `npm run lint` as a verification gate.
- Do not commit anything (the user will commit themselves).
- Do not write to any file other than the four listed in §1/§2.

---

## 6. Rollback

If something goes wrong mid-execution: `git checkout -- src/components/role-manager/HouseAssignmentCard.tsx src/index.css` will revert the source changes and leave the new files (GenderStackedBar.tsx, the test) — delete those manually with `rm`. Then re-read this file from disk.
