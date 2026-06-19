# Houses Slot Migration

**Status:** PLAN (not yet executed)
**Author:** Claude (Opus 4.7)
**Created:** 2026-06-19
**Branch:** TBD
**TDD:** Iron Law applies — every write/filter touched gets a regression test.

---

## Why this plan exists

`schools.houses` is a JSONB array on the `schools` row — the only place the 4 default house definitions live. `house_staff` and `house_incharges` join to that array by string-equality on the free-text column `house_name`. The join breaks silently on rename.

**Reproducer (live DB, school `f143cacd-dd2e-4fc8-baad-9cbc84360f9f`):**

```
schools.houses        = [Red, Blue, Green, Yellow]   ← current slot 0 name
house_staff           = "Devil House" → 2 rows         ← orphaned
house_incharges       = "Red" → 1 row                  ← current
```

**Symptoms as reported by user:**

1. Card header "Total" reads `0` while stats-table "Total" reads `1`. The header is sourced from `house.staff` / `house.incharges` (filtered by `house_name === "Red"`); the stats table counts the incharge row only.
2. Expanded view shows no names. `house.staff` is empty because the 2 rows are under `"Devil House"`.
3. Reset button can't recover — once rows are under an old name, they are invisible to the slot they belong to.

**Root cause — schema smell (the same one the original Explore agent flagged on 2026-06-19):** `house_staff.house_name` and `house_incharges.house_name` are free-text columns with no referential integrity. The codebase has no real `houses` table.

**Fix direction (chosen):** add a stable `house_slot INTEGER (0..3)` column to `house_staff` and `house_incharges`, backfilled from the current array index in `schools.houses`. The slot is the natural primary key; it is immutable across renames. `schools.houses[i].name` stays the source of truth for display.

**Why not a real `houses` table?** A `houses(id, school_id, slot, name, color, emblem_url)` table is the more "correct" relational shape, but it touches `student_profiles.house` (the column students are joined by), the staff-roles payload shape, and the houses JSONB column. Karpathy §2 — minimum code that solves the problem. Slot index is already implicit in the JSON array; making it explicit in the join tables is the smallest change that fixes the orphan-row bug.

---

## Goal

After the migration:
- Renaming a house (`schools.houses[slot].name = "New Name"`) does NOT orphan any staff/incharge rows.
- All staff assigned to a slot remain attached to that slot, displayed under the new name.
- `house_staff` and `house_incharges` rows are keyed by `(house_slot, school_id, staff_profile_id)`.
- `student_profiles.house` continues to work (out of scope for this plan — same risk class, separate fix).
- `houses_audit_log` continues to work (we add `house_slot`, keep `house_name` as denormalized text for human-readable audit messages).

---

## Non-goals

- `student_profiles.house` migration (separate plan, same shape).
- Real `houses` table (separate, larger refactor).
- Renaming the JSON column `schools.houses` → `school.house_definitions` (cosmetic, out of scope).
- Backfill of `house_staff.house_slot` for the 2 orphan rows under `"Devil House"`. **See §"Pre-migration cleanup" below** — we must decide what to do with the live orphans BEFORE running the backfill SQL.

---

## Pre-migration cleanup (RESOLVED)

User decision: **delete both orphan rows.** The assignments were debug noise from the previous session, not real data. Plan:

```sql
-- Step 0 (operator, pre-PR-1):
DELETE FROM house_staff
WHERE school_id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f'
  AND house_name NOT IN ('Red','Blue','Green','Yellow');
```

Verify zero rows remain:

```sql
SELECT COUNT(*) FROM house_staff
WHERE school_id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f'
  AND house_name NOT IN ('Red','Blue','Green','Yellow');
-- expect 0
```

After delete, `house_staff` has 0 rows in this school. `house_incharges` keeps its 1 row at `"Red"`. Backfill in step 2 will resolve cleanly with zero orphans.

---

## Design

### 1. New columns

```sql
ALTER TABLE house_staff
  ADD COLUMN house_slot INTEGER;  -- nullable during backfill window
ALTER TABLE house_incharges
  ADD COLUMN house_slot INTEGER;  -- nullable during backfill window
```

Nullable for the duration of the migration so backfill can be verified before locking the NOT NULL constraint.

### 2. Backfill `house_slot` from `schools.houses` array index

For every row in `house_staff` and `house_incharges`, find the array index `i` in `schools.houses` whose `name` matches `house_name`. If no match, leave `house_slot` NULL and log to a temp table `house_staff_unmatched` / `house_incharges_unmatched` for post-migration triage.

```sql
-- Backfill helper: returns slot index for (school_id, house_name) tuple.
-- Returns NULL if house_name not found in the school's houses array.

-- house_staff backfill
UPDATE house_staff hs
SET house_slot = s.slot
FROM (
  SELECT
    school_id,
    ((arr.pos - 1))::int AS slot,
    arr.element->>'name' AS name
  FROM schools sc,
       LATERAL jsonb_array_elements(sc.houses)
         WITH ORDINALITY AS arr(element, pos)
) s
WHERE hs.school_id = s.school_id
  AND hs.house_name = s.name
  AND hs.house_slot IS NULL;

-- house_incharges backfill (identical shape)
UPDATE house_incharges hi
SET house_slot = s.slot
FROM (
  SELECT
    school_id,
    ((arr.pos - 1))::int AS slot,
    arr.element->>'name' AS name
  FROM schools sc,
       LATERAL jsonb_array_elements(sc.houses)
         WITH ORDINALITY AS arr(element, pos)
) s
WHERE hi.school_id = s.school_id
  AND hi.house_name = s.name
  AND hi.house_slot IS NULL;
```

Post-backfill assertions:
- `SELECT COUNT(*) FROM house_staff WHERE house_slot IS NULL;` → must be 0 (after pre-migration cleanup).
- `SELECT COUNT(*) FROM house_incharges WHERE house_slot IS NULL;` → must be 0.
- Any non-zero count is a halt condition. Surface to user.

### 3. Lock schema

```sql
ALTER TABLE house_staff
  ALTER COLUMN house_slot SET NOT NULL;
ALTER TABLE house_incharges
  ALTER COLUMN house_slot SET NOT NULL;

ALTER TABLE house_staff
  ADD CONSTRAINT house_staff_slot_range
  CHECK (house_slot BETWEEN 0 AND 3);
ALTER TABLE house_incharges
  ADD CONSTRAINT house_incharges_slot_range
  CHECK (house_slot BETWEEN 0 AND 3);
```

### 4. Replace UNIQUE constraints

The 2-column UNIQUE on `house_name` becomes a 2-column UNIQUE on `house_slot`. We add the new one FIRST, then drop the old one (avoids a window where neither exists).

```sql
-- house_staff: (house_slot, staff_profile_id)
ALTER TABLE house_staff
  ADD CONSTRAINT house_staff_house_slot_staff_profile_id_key
  UNIQUE (house_slot, staff_profile_id);
ALTER TABLE house_staff
  DROP CONSTRAINT house_staff_house_name_staff_profile_id_key;

-- house_incharges: (house_slot, school_id) — preserves "single incharge per house" semantics
ALTER TABLE house_incharges
  ADD CONSTRAINT house_incharges_house_slot_school_id_key
  UNIQUE (house_slot, school_id);
ALTER TABLE house_incharges
  DROP CONSTRAINT house_incharges_house_name_school_id_key;
```

### 5. Update indexes (drop the `house_name` ones; add `house_slot` ones)

```sql
-- house_staff
DROP INDEX IF EXISTS idx_house_staff_house_name;
CREATE INDEX idx_house_staff_house_slot ON house_staff (house_slot);

-- house_incharges
DROP INDEX IF EXISTS idx_house_incharges_house_name;
CREATE INDEX idx_house_incharges_house_slot ON house_incharges (house_slot);
```

### 6. KEEP `house_name` column (deferred drop)

We do NOT drop `house_name` in this migration. Reasons:
- `houses_audit_log` references it for human-readable messages; we need to keep inserting denormalized `house_name` into the audit row.
- The `HousesTab.tsx` `House` UI type and `StaffRoleCard.tsx` `HouseOption` select items still display the name.
- Dropping it requires auditing every reader. A follow-up migration can drop it after a deprecation window.

**However:** we do add a NOT NULL trigger or app-level invariant that any new write MUST provide a `house_slot`, AND a generated column or trigger that auto-syncs `house_name` from `schools.houses[slot].name` so the denormalized value can never drift from the source of truth.

Generated column approach (preferred — declarative, no trigger to forget):

```sql
-- house_staff: house_name is generated from schools.houses[house_slot].name
ALTER TABLE house_staff
  ADD COLUMN house_name_new text
  GENERATED ALWAYS AS (
    (SELECT (houses ->> house_slot)::text
     FROM schools WHERE id = school_id
     LIMIT 1)
  ) STORED;
-- The above does not work in a single ALTER; generated columns cannot reference other tables.
```

Generated columns can't reference other tables. Two options:

**Option A — trigger BEFORE INSERT/UPDATE:**

```sql
CREATE OR REPLACE FUNCTION sync_house_name_from_slot() RETURNS TRIGGER AS $$
BEGIN
  SELECT (houses ->> NEW.house_slot)::text
    INTO NEW.house_name
  FROM schools
  WHERE id = NEW.school_id;
  IF NEW.house_name IS NULL THEN
    RAISE EXCEPTION 'house_slot % not found in schools.houses for school %',
      NEW.house_slot, NEW.school_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_house_name_house_staff
  BEFORE INSERT OR UPDATE OF house_slot, school_id ON house_staff
  FOR EACH ROW EXECUTE FUNCTION sync_house_name_from_slot();

-- identical for house_incharges
```

**Option B — drop `house_name` from `house_staff` and `house_incharges`, denormalize at read time in the query helper.**

Option A is simpler at the read path (existing queries still work, the audit log join is unchanged). Choose A.

### 7. `houses_audit_log` — add `house_slot`, drop `house_name`

User decision: **drop `house_name`, resolve at read time.** Cleaner schema, future-proof against renames, no denormalization drift. The historical 10 rows lose their human-readable label — `HouseLogPanel.tsx` joins `schools` on `(id, slot)` to resolve the name at display time.

```sql
ALTER TABLE houses_audit_log ADD COLUMN house_slot INTEGER;
-- backfill from house_name match (same shape as house_staff backfill)
UPDATE houses_audit_log hal
SET house_slot = s.slot
FROM (
  SELECT
    school_id,
    ((arr.pos - 1))::int AS slot,
    arr.element->>'name' AS name
  FROM schools sc,
       LATERAL jsonb_array_elements(sc.houses)
         WITH ORDINALITY AS arr(element, pos)
) s
WHERE hal.school_id = s.school_id
  AND hal.house_name = s.name
  AND hal.house_slot IS NULL;

-- CHECK on slot range, NOT NULL going forward
ALTER TABLE houses_audit_log
  ALTER COLUMN house_slot SET NOT NULL;
ALTER TABLE houses_audit_log
  ADD CONSTRAINT houses_audit_log_slot_range
  CHECK (house_slot BETWEEN 0 AND 3);

-- drop house_name + its index, add slot index
DROP INDEX IF EXISTS idx_houses_audit_log_house_name;
CREATE INDEX idx_houses_audit_log_house_slot ON houses_audit_log (house_slot);
ALTER TABLE houses_audit_log DROP COLUMN house_name;
```

`HouseLogPanel.tsx` (currently L61, L75-158) reads `house_name` directly. Post-migration it must join `schools.houses[house_slot].name` to resolve the display name. See §"Code changes" / `HouseLogPanel.tsx` below.

### 8. `house_incharges` table migration history

Per the blast-radius report, `house_incharges` has no CREATE TABLE in the migration history. Add a "history-bridging" migration that does `CREATE TABLE IF NOT EXISTS house_incharges (... same DDL ...)`. Same for `schools.houses` column (ALTER TABLE IF NOT EXISTS) and `houses_audit_log` (CREATE TABLE IF NOT EXISTS). All `IF NOT EXISTS` so the migration is idempotent on databases that already have the objects.

---

## Code changes

### `src/integrations/supabase/queries/houses.ts`

All 8 exported functions get the same surgical change: replace `houseName: string` with `slot: number` in the parameter list, and replace every `.eq("house_name", ...)` / `house_name: ...` payload with the slot equivalent.

| Function | Line | Change |
|---|---|---|
| `getHousesWithStats(schoolId)` | 78-337 | Read path: `getHousesWithStats` returns `HouseWithStats[]`. The `HouseDefinition` type must include `slot: number`. The query helper `getHousesWithStats` must build the slot by enumerating the JSONB array on `schools` (same logic as the SQL backfill — use `arrayElements` from `supabase-js` or do a follow-up `select` per slot). **Simpler:** add a synthetic `slot` field to the `HouseDefinition` object built in JS at L113-121 (it's the array index, we already have it). Filter change at L222: `hs.house_slot === houseDef.slot` (was `hs.house_name === houseName`). L224: `hi.house_slot === houseDef.slot`. The insert writes still go through the SQL trigger for `house_name` sync — JS code passes `house_slot` and lets the trigger fill `house_name`. |
| `getHouseStaffGroupedByWing(houseName, schoolId)` | 343-480 | Rename param to `slot: number`. L359-360: `.eq("house_slot", slot)`. |
| `getHouseIncharges(houseName, schoolId)` | 485-513 | Rename param to `slot: number`. L493: `.eq("house_slot", slot)`. |
| `assignStaffToHouse(houseName, staffId, schoolId, userId?)` | 521-547 | Rename param. Insert payload: `{ house_slot: slot, staff_profile_id: staffId, school_id: schoolId, assigned_by: userId }`. Trigger fills `house_name`. |
| `removeStaffFromHouse(houseName, staffId, schoolId)` | 552-565 | Rename param. L560: `.eq("house_slot", slot)`. |
| `setHouseIncharge(houseName, staffId, schoolId, userId?)` | 573-598 | Rename param. L587: `.eq("house_slot", slot)`. L591: insert with `house_slot`. |
| `removeHouseIncharge(houseName, staffId, schoolId)` | 603-616 | Rename param. L611: `.eq("house_slot", slot)`. |
| `clearHouseAssignments(houseName, schoolId)` | 625-644 | Rename param to `slot: number`. L634, L639: `.eq("house_slot", slot)`. |

### `src/integrations/supabase/queries/roleAssignments.ts`

| Line | Change |
|---|---|
| L599 | `from("house_staff").select("house_slot").eq("staff_profile_id", staffId)` |
| L604 | `from("house_staff").insert({ house_slot, staff_profile_id: staffId, school_id })` — the existing `setHouse(staffId, house, schoolId, userId)` call signature takes `house: string` (the house name) and needs to take `slot: number` instead. Caller `useSaveStaffRoles` L264 passes the slot from the `HouseOption` UI. |
| L607 | `logRoleAudit(…, oldValue: old?.house_name ?? null, newValue: houseName || null, …)` — `houseName` should be resolved by the caller (read `schools.houses[slot].name`) and passed in. Renaming now is the moment to fix this — the audit message says "old: Devil House, new: Red" which is meaningless to a user reading logs. Replace with `oldSlot: number | null, newSlot: number | null` and resolve names in the audit renderer. |
| L742-744 | Reads `from("house_staff").select("house_slot")`. |
| L773 | `house: house ? { house_slot: house, house_name: <resolved name> } : null` (slot is the primary key, name is denormalized display). |
| L35 (`house: { house_name: string } \| null`) | Becomes `house: { house_slot: number, house_name: string } \| null`. |

### `src/hooks/useRoleManagerQueries.ts`

| Line | Change |
|---|---|
| L167-171 `SaveHouseAssignmentsInput` | `additions: { houseSlot: number, staffId, role }[]`, `removals: { houseSlot, staffId, role }[]`. |
| L263 dirty check | `if (draft.house?.house_slot !== original.house?.house_slot)`. |
| L188, L263-264 `useSaveStaffRoles` | The `setHouse(staffId, house, schoolId, userId)` call: `house` is now the slot number. |
| L446, L448, L459, L461 `useSaveHouseAssignments` | All four `houses.ts` function calls update to `slot` arg. |

### `src/components/role-manager/HousesAssignmentTab.tsx`

| Line | Change |
|---|---|
| L141, L168 | `h.definition.slot` instead of `h.definition.name` for matching moves. |
| L146, L156, L173 | `fromHouse: h.definition.slot`, `toHouse: targetHouse.definition.slot`. |
| L270-291 | The `houses.map((house) => …)` UI uses `house.definition.name` for display (unchanged) but `house.definition.slot` for keys and identification. |
| L250 invalidation | No change (query key factory already keys by school). |

### `src/components/role-manager/HouseAssignmentCard.tsx`

| Line | Change |
|---|---|
| L238 | Save payload uses `slot` for `house_slot`. `name` still rendered. |
| L266-278 | `definition.name` display unchanged. Add a hidden `data-slot={definition.slot}` for testability. |

### `src/components/role-manager/HouseMovePromptDialog.tsx`

| Line | Change |
|---|---|
| L23-29 `HouseMoveEntry` | `{ staffId, staffName, fromSlot, toSlot, fromHouseName, toHouseName, role }` — keep both slot (for the move) and name (for the human message). |
| L61-73 | `m.fromSlot`, `m.toSlot` for the move call; `m.fromHouseName`, `m.toHouseName` for display. |

### `src/components/role-manager/StaffRoleCard.tsx`

| Line | Change |
|---|---|
| L88 `HouseOption` state | `HouseOption = { name: string, slot: number }`. |
| L136, L153, L784, L901, L967 | Reads `roles.house?.house_slot` (was `house_name`). |
| L263 payload | `house: draftSlot != null ? { house_slot: draftSlot, house_name: <display name> } : null`. |
| L776-780 select | `<SelectItem value={String(h.slot)}>{h.name}</SelectItem>`. |

### `src/components/school/HousesTab.tsx`

This is the My School > Houses page that bypasses `houses.ts` helpers. Two reads + one write are direct table hits.

| Line | Change |
|---|---|
| L87 | `.select("house_slot, staff_profile_id, staff:profiles(id, full_name)")`. The UI binding at L110 (`houseIncharges.find((i) => i.house_name.toLowerCase() === houseName.toLowerCase())`) becomes `houseIncharges.find((i) => i.house_slot === houseIndex)`. |
| L144-157 edit modal save | No change needed to the JSON update logic (still writes `schools.houses`), but the page now uses `houseIndex` (array index) as the stable key. If a rename happens, the slot stays, the name changes, the staff rows under that slot are not orphaned. **This is the bug we are fixing.** |
| L214 `clearHouseAssignments` | Update call: `clearHouseAssignments(houseToReset.slot, schoolId)`. |
| L452 dead `logHouseAction` | Drop or update to use slot. This module-level helper has no callsite per the blast-radius report — confirm with one more grep before deleting. If zero callsites, delete. |

### `src/components/school/HouseLogPanel.tsx`

The audit log loses the `house_name` column (per user decision). The panel must join `schools.houses[house_slot].name` at read time.

| Line | Change |
|---|---|
| L8 `HouseAuditLog` type | `{ id, school_id, house_slot, action, actor_id, actor_name, old_value, new_value, created_at, house_name: string }` — the local type adds `house_name` (resolved from `schools.houses[house_slot].name` at query time) to keep the JSX unchanged. |
| L11 `house_name: string` field | Stays in the local type. The query now selects `house_slot` and resolves `house_name` from a single `schools` row. |
| L61 `query.ilike("house_name", selectedHouse)` | Becomes `query.eq("house_slot", selectedSlot)` — the filter is now by slot, not by name string. |
| L75, L95, L97, L99, L101, L103, L105, L107, L109, L158 | JSX unchanged. `log.house_name` is still the display key — just resolved at read time. |
| Query shape | Two options: (a) single round-trip — `select("*, schools!houses_audit_log_school_id_fkey(houses)")` and resolve in JS. (b) two round-trips — fetch audit rows, fetch the school's `houses` JSON, join in memory. (b) is simpler and the audit panel is not a hot path. Use (b). |

### Types

| Type | New field |
|---|---|
| `HouseDefinition` | `slot: number` (array index, immutable) |
| `HouseWithStats` | inherits `definition.slot` (no new field) |
| `HouseStaffMember` | unchanged |
| `HouseInchargeInfo` | unchanged |
| `HouseOption` (in `roleAssignments.ts:42`) | `slot: number` |

### `src/integrations/supabase/types.ts`

Regenerated after the migration runs. The new `house_slot` column appears on `house_staff` and `house_incharges` and `houses_audit_log`. The `house_name` column stays.

### Tests

| File | Change |
|---|---|
| `src/test/assignStaffToHouse.test.ts` | L60 payload: `house_slot: 0` (was `house_name: "Blue"`). Call arg: `assignStaffToHouse(0, ...)` (was `("Blue", ...)`). Mock chain: `.eq("house_slot", 0)` (was `.eq("house_name", "Blue")`). |
| `src/test/setHouseIncharge.test.ts` | L42, L65 call args become slot numbers. L50 assertion: `expect(deleteEq).toHaveBeenCalledWith("house_slot", 0)`. L55 payload: `house_slot: 0`. |
| `src/test/clearHouseAssignments.test.ts` | L43, L70 call args become slot numbers. Mock chain: `.eq("house_slot", 0)`. |
| `src/test/HouseMovePromptDialog.test.tsx` | L21, L25, L26 fixture literals: include `slot` and `name` per `HouseMoveEntry` new shape. |
| `src/test/housesSlotRead.test.ts` (NEW) | Regression test: a `house_staff` row inserted with `house_slot = 0` and `house_name = "Red"` (via the trigger) is returned by `getHousesWithStats(schoolId)` for the `Red` slot even if `schools.houses[0].name` is renamed to `"Scarlet"`. Uses the existing in-memory mock pattern from `setHouseIncharge.test.ts`. |
| `src/test/roleManagerTabs.test.tsx` | No change (asserts on query keys only). |

### Dead code cleanup (PR 9, resolved)

User decision: **delete both.** Subagent reported zero callers. PR 9 of the order-of-operations:

- `useHouses` (L121-130) in `src/hooks/useRoleManagerQueries.ts` — delete the function and its `roleManagerKeys` reference if unused. Functionally identical to `useHousesWithDetails`.
- `logHouseAction` in `src/components/school/HousesTab.tsx:431-459` — delete the dead module-level helper. (Will run one more grep to confirm zero callsites before deleting.)

---

## Documentation

| File | Change |
|---|---|
| `docs/HOUSE.md` | DDL block (L269-290) updated: add `house_slot INTEGER NOT NULL` and the trigger. L4 stale `20260515000000_houses.sql` reference corrected to the new migration filename. L263 typo `houses_staff` → `house_staff`. §6.1 "Renaming the House" — add note: "renames are display-only, staff and incharges remain attached to the slot". §7-9 cross-references updated. |
| `docs/ROLE_MANAGER.md` | L110, L113, L295 — DDL block now lists `house_slot` and the new UNIQUE. Drift on multi-incharge language corrected. L473-481 invalidation contract unchanged. |
| `docs/MY_STAFF.md` (L67, L136, L364, L429, L545, L623) | Cross-references use `house_slot` terminology. |
| `docs/STAFF_DELETION.md` (L33, L55, L59) | CASCADE behavior documented against `house_slot` keys. |
| `docs/LESSONS.md` | New entry: "Free-text columns masquerading as foreign keys" — the bug class this migration fixes. |

---

## Migration file

`supabase/migrations/20260619000000_houses_slot_migration.sql`

Sections:
1. Pre-flight: list current orphan counts for the operator.
2. CREATE TABLE / ALTER TABLE IF NOT EXISTS for `house_incharges`, `houses_audit_log`, `schools.houses` (idempotent history-bridging).
3. `ALTER TABLE` adding `house_slot` (nullable).
4. Backfill `house_slot` from `schools.houses` array index.
5. Post-backfill assertions (`ASSERT` or DO block raising on non-zero orphan counts).
6. `ALTER COLUMN ... SET NOT NULL` + CHECK constraint.
7. Replace UNIQUE constraints.
8. Add trigger `sync_house_name_from_slot()` on both tables.
9. Replace indexes.
10. Add `house_slot` to `houses_audit_log`, backfill, CHECK constraint, replace index.

Operator must:
- Pre-flight confirms zero orphan rows.
- Backfill assertions pass.
- Run `supabase gen types typescript --project-id ndtqhschvnyloeccaelv` after apply.

---

## Verification (per karpathy §4 — goal-driven execution)

**Pre-flight (DB level):**

1. `SELECT COUNT(*) FROM house_staff WHERE house_name NOT IN (SELECT (houses->>0)::text FROM schools WHERE id = school_id) AND house_name NOT IN (SELECT (houses->>1)::text FROM schools WHERE id = school_id) AND ...` — list orphan rows.
2. Resolve with user (Pre-migration cleanup § above).

**Post-migration (DB level):**

1. `SELECT COUNT(*) FROM house_staff WHERE house_slot IS NULL;` → 0.
2. `SELECT COUNT(*) FROM house_incharges WHERE house_slot IS NULL;` → 0.
3. `SELECT COUNT(*) FROM houses_audit_log WHERE house_slot IS NULL;` → 0 (or 0 in non-historical rows; legacy rows are tolerable NULL).
4. `SELECT DISTINCT house_slot FROM house_staff;` — all values in 0..3.
5. Rename slot 0 from "Red" to "Scarlet" via `UPDATE schools SET houses = jsonb_set(houses, '{0,name}', '"Scarlet"') WHERE id = 'f143cacd-...'`. Re-query `getHousesWithStats(schoolId)`. The 1 incharge + 2 staff rows must still appear under "Scarlet" (now via slot 0, denormalized `house_name` auto-updated by the trigger). This is the proof of the fix.

**Post-migration (code level):**

1. `npx tsc --noEmit` — clean.
2. `npx vitest run` — all existing tests pass, all 3 updated tests pass, new `housesSlotRead.test.ts` passes.
3. Manual app retest: add staff to Red, rename Red to Crimson, refresh — staff still attached. Add same staff to Blue — move-prompt fires, staff moves cleanly. Reset Crimson — staff gone.
4. `get_advisors security` — confirm no new RLS warnings on the new column.

---

## Risks and rollback

**Risks:**

1. **Backfill fails to match orphan rows** (the live "Devil House" case). Halt, surface to user, decide. Migration does not proceed to NOT NULL until count is 0.
2. **Trigger performance** — BEFORE INSERT/UPDATE trigger runs `SELECT FROM schools WHERE id = NEW.school_id` for every write. Indexed PK lookup, sub-ms. Acceptable.
3. **The `house_name` column is now redundant in `house_staff` and `house_incharges`** — denormalized from `schools.houses`. A future migration will drop it once all readers are confirmed slot-based. Document the deprecation in `docs/HOUSE.md`.
4. **`houses_audit_log.house_name` remains text** — historical rows are immutable, the trigger does NOT touch them. New writes must include both `house_slot` and `house_name` (the caller resolves the name from `schools.houses`). Update the `HousesTab.tsx` write path to do this resolution.

**Rollback:**

The migration is additive in steps 1-3 (column add, backfill). Steps 4-9 are destructive. The plan is to commit and tag at step 3, run step 4-9 in a single transaction, capture a backup of `house_staff` and `house_incharges` first via `CREATE TABLE house_staff_backup_20260619 AS SELECT * FROM house_staff;` (same for incharges). If anything fails post-step-4, restore from backup. Step 3 → production with feature off; step 4 → cutover.

---

## Order of operations (PR-by-PR)

| PR | Scope | TDD |
|---|---|---|
| 1 | Migration file (`20260619000000_houses_slot_migration.sql`). Idempotent history-bridging section + new column add. **Stop before backfill.** | DB-only. No app changes. |
| 2 | Backfill + assertions + NOT NULL + CHECK + UNIQUE swap + trigger. Manual verification per §"Post-migration (DB level)". | DB-only. |
| 3 | Type regen (`src/integrations/supabase/types.ts`). No app behavior change yet. | Types only. |
| 4 | `houses.ts` — switch 8 functions to `slot` arg. Update existing 3 test files. New `housesSlotRead.test.ts` regression test. | TDD: tests fail on main branch, pass on this branch. |
| 5 | `roleAssignments.ts` — switch `setHouse` and 4 inline callsites. Update `StaffRoleCard.tsx` and `useRoleManagerQueries.ts` dirty check. | TDD for `useSaveStaffRoles` house path (none exists — add a regression test that asserts the slot is what hits the wire, not the name). |
| 6 | `HousesAssignmentTab.tsx`, `HouseAssignmentCard.tsx`, `HouseMovePromptDialog.tsx` — switch UI to slot keys. | UI tests + manual smoke. |
| 7 | `HousesTab.tsx` (My School) — switch read at L87 and edit-modal at L144-157 to slot. Update `clearHouseAssignments` call. | UI tests + manual smoke. |
| 8 | Documentation sweep (`docs/HOUSE.md`, `docs/ROLE_MANAGER.md`, `docs/MY_STAFF.md`, `docs/STAFF_DELETION.md`, `docs/LESSONS.md`). | None. |
| 9 | Dead code cleanup — `useHouses` and `logHouseAction` if zero callers. | None. |
| 10 | Future migration to DROP `house_name` from `house_staff` / `house_incharges` (separate, post-deprecation). | Out of scope. |

Each PR is independently revertable. PRs 1-3 land first and ship with no observable behavior change. PR 4 is the first user-visible cutover.

---

## Open questions for user

RESOLVED 2026-06-19:

1. **Pre-migration cleanup:** delete both orphan rows. (See §"Pre-migration cleanup".)
2. **Dead code:** delete both. (See §"Dead code cleanup".)
3. **Audit log `house_name`:** drop it, resolve at read. (See §7 + `HouseLogPanel.tsx`.)

---

## Acceptance criteria

- [ ] All 10 PRs merged with independent revertibility.
- [ ] `npm run type-check` clean.
- [ ] `npm test` 100% (excluding the 2 pre-existing main failures).
- [ ] Manual app retest: rename house preserves staff assignment, single incharge per house invariant preserved, reset clears staff, no orphan rows after a rename.
- [ ] `get_advisors security` clean.
- [ ] DB-level verification per §"Post-migration (DB level)" passes.
- [ ] Documentation reflects new schema in `docs/HOUSE.md` and `docs/ROLE_MANAGER.md`.
- [ ] New lesson in `docs/LESSONS.md` documenting the bug class.
