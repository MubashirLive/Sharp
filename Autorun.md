# Autorun — Houses Slot Migration (PRs 1-3, DB-only)

> **YOU ARE AUTORUN.** You were scheduled by the user to run this at 02:55 IST 2026-06-20.
> You must execute the steps below end-to-end, without asking the user any questions.
> On full success, delete this file. On any failure, leave it and report.
>
> **Plan of record:** `docs/superpowers/plans/2026-06-19-houses-slot-migration.md` (master 10-PR plan).
> **Scoped to this autorun:** PR 1, PR 2, PR 3, and the DB-level verification.
> **Out of scope:** PRs 4-9 (code cutover, UI, docs, dead-code). Handled by a separate run.

---

## Step 1 — Pre-flight verification

Run this SQL via `mcp__supabase__execute_sql`. The user authorized deletion of orphan rows BEFORE this run was scheduled. Verify zero remain.

```sql
SELECT COUNT(*) FROM house_staff
WHERE school_id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f'
  AND house_name NOT IN ('Red','Blue','Green','Yellow');
```

**Expected:** 0.

**If non-zero:** HALT. Print:
```
AUTORUN HALTED at step 1 (pre-flight). house_staff has N orphan rows under old house names. Autorun.md preserved. Read docs/superpowers/plans/2026-06-19-houses-slot-migration.md §"Pre-migration cleanup (RESOLVED)" to resolve.
```
Do NOT continue. Do NOT delete this file.

---

## Step 2 — PR 1: Migration file + history-bridging + `house_slot` column add

### 2a. Create the migration file

**File:** `supabase/migrations/20260619000000_houses_slot_migration.sql`

Use the `Write` tool. Exact content:

```sql
-- Migration: Houses Slot Index (PR 1 of 10)
-- Scope: history-bridging for house_incharges / houses_audit_log / schools.houses,
--        add nullable house_slot column to house_staff, house_incharges, houses_audit_log.
-- Stops before backfill (PR 2 applies the backfill + constraints).
--
-- See docs/superpowers/plans/2026-06-19-houses-slot-migration.md for the master plan.
-- See Autorun.md for the scoped run that applies this file.

BEGIN;

-- ============================================================
-- Section 1: History-bridging (idempotent)
-- ============================================================

-- house_incharges: no CREATE TABLE in migration history. Add it.
CREATE TABLE IF NOT EXISTS house_incharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id)
);
CREATE INDEX IF NOT EXISTS idx_house_incharges_house_name ON house_incharges (house_name);
CREATE INDEX IF NOT EXISTS idx_house_incharges_school_id ON house_incharges (school_id);
CREATE INDEX IF NOT EXISTS idx_house_incharges_staff_id ON house_incharges (staff_profile_id);

-- houses_audit_log: same.
CREATE TABLE IF NOT EXISTS houses_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  house_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action = ANY (ARRAY['house_renamed','emblem_changed','staff_assigned','staff_removed','incharge_assigned','incharge_removed','reset'])),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_houses_audit_log_created_at ON houses_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_houses_audit_log_house_name ON houses_audit_log (house_name);
CREATE INDEX IF NOT EXISTS idx_houses_audit_log_school_id ON houses_audit_log (school_id);

-- schools.houses column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'schools' AND column_name = 'houses'
  ) THEN
    ALTER TABLE schools ADD COLUMN houses JSONB;
  END IF;
END$$;

-- ============================================================
-- Section 2: RLS (idempotent)
-- ============================================================

ALTER TABLE house_incharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Section 3: Add nullable house_slot (PR 1 scope ends here)
-- ============================================================

ALTER TABLE house_staff ADD COLUMN IF NOT EXISTS house_slot INTEGER;
ALTER TABLE house_incharges ADD COLUMN IF NOT EXISTS house_slot INTEGER;
ALTER TABLE houses_audit_log ADD COLUMN IF NOT EXISTS house_slot INTEGER;

-- ============================================================
-- Section 4: Pre-backfill orphan count (operator-readable)
-- ============================================================

DO $$
DECLARE
  hs_unmatched INT;
  hi_unmatched INT;
  hal_unmatched INT;
BEGIN
  SELECT COUNT(*) INTO hs_unmatched FROM house_staff hs
    WHERE hs.house_slot IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM schools sc, LATERAL jsonb_array_elements(sc.houses) arr(element)
        WHERE sc.id = hs.school_id AND (arr.element->>'name') = hs.house_name
      );
  SELECT COUNT(*) INTO hi_unmatched FROM house_incharges hi
    WHERE hi.house_slot IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM schools sc, LATERAL jsonb_array_elements(sc.houses) arr(element)
        WHERE sc.id = hi.school_id AND (arr.element->>'name') = hi.house_name
      );
  SELECT COUNT(*) INTO hal_unmatched FROM houses_audit_log hal
    WHERE hal.house_slot IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM schools sc, LATERAL jsonb_array_elements(sc.houses) arr(element)
        WHERE sc.id = hal.school_id AND (arr.element->>'name') = hal.house_name
      );
  RAISE NOTICE 'Pre-backfill unmatched: house_staff=%, house_incharges=%, houses_audit_log=%',
    hs_unmatched, hi_unmatched, hal_unmatched;
END$$;

COMMIT;
```

### 2b. Apply the migration

Call `mcp__supabase__apply_migration` with:
- `name`: `20260619000000_houses_slot_migration`
- `query`: read the file content written in 2a (or pass the same SQL string directly)

If you used `Write` to create the file, read it back with `Read` to get the exact content for `apply_migration`.

**On success:** proceed to Step 3.
**On error:** HALT. Print:
```
AUTORUN HALTED at step 2 (PR 1 apply). Error: <error message>. Autorun.md preserved. Run the migration file manually via the Supabase MCP to diagnose.
```

---

## Step 3 — PR 2: Backfill + constraints + UNIQUE swap + trigger + indexes

### 3a. Create the migration file

**File:** `supabase/migrations/20260619000001_houses_slot_backfill_and_constraints.sql`

Use the `Write` tool. Exact content:

```sql
-- Migration: Houses Slot Backfill + Constraints (PR 2 of 10)
-- Scope: backfill house_slot from schools.houses array index,
--        lock schema (NOT NULL + CHECK), replace UNIQUE constraints,
--        replace indexes, add house_name sync trigger.
--
-- See docs/superpowers/plans/2026-06-19-houses-slot-migration.md for the master plan.
-- See Autorun.md for the scoped run that applies this file.

BEGIN;

-- ============================================================
-- Section 1: Backfill house_slot
-- ============================================================

UPDATE house_staff hs
SET house_slot = ((arr.pos - 1))::int
FROM schools sc,
     LATERAL jsonb_array_elements(sc.houses) WITH ORDINALITY AS arr(element, pos)
WHERE hs.school_id = sc.id
  AND hs.house_name = (arr.element->>'name')
  AND hs.house_slot IS NULL;

UPDATE house_incharges hi
SET house_slot = ((arr.pos - 1))::int
FROM schools sc,
     LATERAL jsonb_array_elements(sc.houses) WITH ORDINALITY AS arr(element, pos)
WHERE hi.school_id = sc.id
  AND hi.house_name = (arr.element->>'name')
  AND hi.house_slot IS NULL;

UPDATE houses_audit_log hal
SET house_slot = ((arr.pos - 1))::int
FROM schools sc,
     LATERAL jsonb_array_elements(sc.houses) WITH ORDINALITY AS arr(element, pos)
WHERE hal.school_id = sc.id
  AND hal.house_name = (arr.element->>'name')
  AND hal.house_slot IS NULL;

-- ============================================================
-- Section 2: Post-backfill assertion — HALT on non-zero
-- ============================================================

DO $$
DECLARE
  hs_null INT;
  hi_null INT;
  hal_null INT;
BEGIN
  SELECT COUNT(*) INTO hs_null FROM house_staff WHERE house_slot IS NULL;
  SELECT COUNT(*) INTO hi_null FROM house_incharges WHERE house_slot IS NULL;
  SELECT COUNT(*) INTO hal_null FROM houses_audit_log WHERE house_slot IS NULL;
  IF hs_null > 0 OR hi_null > 0 THEN
    RAISE EXCEPTION 'Backfill left % house_staff and % house_incharges rows unmatched. HALTING.', hs_null, hi_null;
  END IF;
  RAISE NOTICE 'Backfill complete. house_staff NULL=% (expect 0), house_incharges NULL=% (expect 0), houses_audit_log NULL=% (legacy OK if non-zero).',
    hs_null, hi_null, hal_null;
END$$;

-- ============================================================
-- Section 3: Lock schema — NOT NULL + CHECK
-- ============================================================

ALTER TABLE house_staff ALTER COLUMN house_slot SET NOT NULL;
ALTER TABLE house_incharges ALTER COLUMN house_slot SET NOT NULL;
ALTER TABLE houses_audit_log ALTER COLUMN house_slot SET NOT NULL;

ALTER TABLE house_staff
  ADD CONSTRAINT house_staff_slot_range CHECK (house_slot BETWEEN 0 AND 3);
ALTER TABLE house_incharges
  ADD CONSTRAINT house_incharges_slot_range CHECK (house_slot BETWEEN 0 AND 3);
ALTER TABLE houses_audit_log
  ADD CONSTRAINT houses_audit_log_slot_range CHECK (house_slot BETWEEN 0 AND 3);

-- ============================================================
-- Section 4: Replace UNIQUE constraints
-- (Add new BEFORE dropping old — never a window without a UNIQUE.)
-- ============================================================

ALTER TABLE house_staff
  ADD CONSTRAINT house_staff_house_slot_staff_profile_id_key
  UNIQUE (house_slot, staff_profile_id);
ALTER TABLE house_staff
  DROP CONSTRAINT house_staff_house_name_staff_profile_id_key;

ALTER TABLE house_incharges
  ADD CONSTRAINT house_incharges_house_slot_school_id_key
  UNIQUE (house_slot, school_id);
ALTER TABLE house_incharges
  DROP CONSTRAINT house_incharges_house_name_school_id_key;

-- ============================================================
-- Section 5: Replace indexes
-- ============================================================

DROP INDEX IF EXISTS idx_house_staff_house_name;
CREATE INDEX idx_house_staff_house_slot ON house_staff (house_slot);

DROP INDEX IF EXISTS idx_house_incharges_house_name;
CREATE INDEX idx_house_incharges_house_slot ON house_incharges (house_slot);

DROP INDEX IF EXISTS idx_houses_audit_log_house_name;
CREATE INDEX idx_houses_audit_log_house_slot ON houses_audit_log (house_slot);

-- ============================================================
-- Section 6: house_name sync trigger
-- ============================================================

CREATE OR REPLACE FUNCTION sync_house_name_from_slot() RETURNS TRIGGER AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  SELECT (houses ->> NEW.house_slot)::text
    INTO resolved_name
  FROM schools
  WHERE id = NEW.school_id;
  IF resolved_name IS NULL THEN
    RAISE EXCEPTION 'house_slot % not found in schools.houses for school %',
      NEW.house_slot, NEW.school_id;
  END IF;
  NEW.house_name := resolved_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_house_name_house_staff ON house_staff;
CREATE TRIGGER trg_sync_house_name_house_staff
  BEFORE INSERT OR UPDATE OF house_slot, school_id ON house_staff
  FOR EACH ROW EXECUTE FUNCTION sync_house_name_from_slot();

DROP TRIGGER IF EXISTS trg_sync_house_name_house_incharges ON house_incharges;
CREATE TRIGGER trg_sync_house_name_house_incharges
  BEFORE INSERT OR UPDATE OF house_slot, school_id ON house_incharges
  FOR EACH ROW EXECUTE FUNCTION sync_house_name_from_slot();

COMMIT;
```

### 3b. Apply the migration

Call `mcp__supabase__apply_migration` with:
- `name`: `20260619000001_houses_slot_backfill_and_constraints`
- `query`: same content as 3a

**On success:** proceed to Step 4.
**On error (especially the post-backfill assertion in Section 2):** HALT. Print:
```
AUTORUN HALTED at step 3 (PR 2 apply). The post-backfill assertion fired — some rows did not match any slot. Read docs/superpowers/plans/2026-06-19-houses-slot-migration.md §"Pre-migration cleanup" to resolve the unmatched rows, then re-run Autorun.md.
```

---

## Step 4 — PR 3: Regen Supabase types

Call `mcp__supabase__generate_typescript_types`. The MCP tool returns the new types content. Overwrite `src/integrations/supabase/types.ts` with the response.

**Verify the regenerated file contains the new column. Run via `Grep`:**

```
Grep pattern: "house_slot"
path: src/integrations/supabase/types.ts
```

Expected hits: at least 3 (one each on `house_staff`, `house_incharges`, `houses_audit_log` Row / Insert / Update shapes — likely 6+ hits because each table has Row/Insert/Update variants).

**If `house_slot` is not present:** HALT. Print:
```
AUTORUN HALTED at step 4 (type regen). The regenerated src/integrations/supabase/types.ts does not contain house_slot. Manually re-run `supabase gen types typescript --project-id ndtqhschvnyloeccaelv` and inspect the output.
```

**If present:** proceed to Step 5.

---

## Step 5 — Post-migration verification (DB level)

Run all 6 checks via `mcp__supabase__execute_sql`. Each must return a value consistent with success.

### Check 1 — Unmatched counts after backfill

```sql
SELECT
  (SELECT COUNT(*) FROM house_staff WHERE house_slot IS NULL) AS hs_null,
  (SELECT COUNT(*) FROM house_incharges WHERE house_slot IS NULL) AS hi_null,
  (SELECT COUNT(*) FROM houses_audit_log WHERE house_slot IS NULL) AS hal_null;
```

**Expected:** `hs_null = 0`, `hi_null = 0`. `hal_null` may be non-zero (legacy audit rows are tolerable NULL per master plan §7).

**If `hs_null` or `hi_null` is non-zero:** HALT. (The PR 2 assertion should have caught this — defensive check.)

### Check 2 — Slot range sanity

```sql
SELECT DISTINCT house_slot FROM house_staff ORDER BY house_slot;
SELECT DISTINCT house_slot FROM house_incharges ORDER BY house_slot;
```

**Expected:** values in {0, 1, 2, 3}. May be a subset.

### Check 3 — Constraint sanity

```sql
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.house_staff'::regclass AND contype = 'c';
```

**Expected output includes:** `house_staff_slot_range`. (Plus the existing `house_staff_house_slot_staff_profile_id_key` is type 'u', not 'c' — that's fine, it should also exist as a UNIQUE.)

### Check 4 — Trigger sanity

```sql
SELECT tgname FROM pg_trigger
WHERE tgrelid IN ('public.house_staff'::regclass, 'public.house_incharges'::regclass)
  AND NOT tgisinternal
ORDER BY tgname;
```

**Expected output includes:** `trg_sync_house_name_house_staff`, `trg_sync_house_name_house_incharges`.

### Check 5 — Rename-survives-staff proof (the actual fix)

```sql
-- Before rename: count staff in slot 0
SELECT COUNT(*) AS before_count FROM house_staff
WHERE school_id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f' AND house_slot = 0;
-- Expect 0 (the orphan rows were deleted pre-run)
-- If non-zero, record the number.

-- Rename slot 0 from "Red" to "Scarlet"
UPDATE schools
SET houses = jsonb_set(houses, '{0,name}', '"Scarlet"')
WHERE id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f';

-- After rename: count staff in slot 0 (should be same as before_count)
SELECT COUNT(*) AS after_count FROM house_staff
WHERE school_id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f' AND house_slot = 0;
-- MUST equal before_count.

-- RENAME BACK to "Red" (the user's UI still expects this name)
UPDATE schools
SET houses = jsonb_set(houses, '{0,name}', '"Red"')
WHERE id = 'f143cacd-dd2e-4fc8-baad-9cbc84360f9f';
```

**If `after_count != before_count`:** HALT. The fix is not working. Print:
```
AUTORUN HALTED at step 5 (verification check 5). Rename-survives-staff test failed. Slot-based queries returned a different count after a rename — the fix is incomplete. Investigate manually.
```

### Check 6 — TypeScript type-check (compile sanity)

Run `Bash` with:
- `command`: `npx tsc --noEmit 2>&1 | head -50`
- `timeout`: 180000

**Expected:** empty output (clean) or warnings only, no errors.

**If errors mention `house_slot` or `house_staff` / `house_incharges` / `houses_audit_log`:** HALT. Print the first 50 lines of the output.

(If errors are unrelated to the migration, log them but do NOT halt — pre-existing TS issues are not this run's responsibility.)

---

## Step 6 — Wipe (success only)

If all 5 steps above succeeded:

Run `Bash`:
- `command`: `rm Autorun.md`
- `description`: Wipe autorun file on success

Print to stdout:
```
AUTORUN SUCCESS — Houses Slot Migration PRs 1-3 applied.
- house_staff.house_slot NOT NULL (0..3)
- house_incharges.house_slot NOT NULL (0..3)
- houses_audit_log.house_slot NOT NULL (0..3)
- UNIQUE constraints swapped to (house_slot, ...)
- Indexes swapped
- Trigger sync_house_name_from_slot active
- Types regenerated
- Rename-survives-staff proof: passed
Autorun.md wiped.
Remaining work: PRs 4-9 (code cutover, UI, docs, dead-code). Schedule a separate autorun, or run by hand.
```

If any step halted:

Leave `Autorun.md` on disk. Print:
```
AUTORUN HALTED at step <N>. Reason: <reason>. Autorun.md preserved for inspection. Run `git status` to see what was created. Re-run after the issue is resolved.
```

Do NOT delete this file on failure.

---

## What you (the executing Claude) should NOT do

- Do NOT run `npm test` — PRs 1-3 are DB-only, no app code changed. Tests are for PR 4+. (The user said "in the end run the test" — but the autorun scope is PRs 1-3, no app code, no test surface. The full test run happens when code cutover lands.)
- Do NOT modify any file in `src/` (except `src/integrations/supabase/types.ts` from the type regen).
- Do NOT modify any file in `docs/`.
- Do NOT delete any data — only the orphan rows from pre-flight (already done before this run).
- Do NOT ask the user any questions. This is an unattended run.

---

## Files this autorun creates

- `supabase/migrations/20260619000000_houses_slot_migration.sql` (new)
- `supabase/migrations/20260619000001_houses_slot_backfill_and_constraints.sql` (new)
- `src/integrations/supabase/types.ts` (regenerated)

## Files this autorun deletes (on success only)

- `Autorun.md` (root of repo)
