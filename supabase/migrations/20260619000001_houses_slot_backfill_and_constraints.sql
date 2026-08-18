-- Migration: Houses Slot Backfill + Constraints (PR 2 of 10)
-- Scope: backfill house_slot from schools.houses array index,
--        lock schema (NOT NULL + CHECK) on house_staff + house_incharges,
--        leave houses_audit_log.house_slot NULLABLE (historical rows may have
--        house_name values that no longer exist in schools.houses),
--        replace UNIQUE constraints, replace indexes (partial index for audit log),
--        add house_name sync trigger.
--
-- IMPORTANT: houses_audit_log DROP COLUMN house_name was originally here but
-- was moved to PR 7 (HouseLogPanel UI work), because dropping house_name now
-- would break HouseLogPanel.tsx which still reads it.

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
-- Section 2: Post-backfill assertion
-- house_staff + house_incharges: must be 0 NULL.
-- houses_audit_log: NULL is acceptable (legacy rows from before current roster).
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
-- house_staff + house_incharges: full lock.
-- houses_audit_log: column stays nullable, but if set, must be in range.
-- ============================================================

ALTER TABLE house_staff ALTER COLUMN house_slot SET NOT NULL;
ALTER TABLE house_incharges ALTER COLUMN house_slot SET NOT NULL;
-- houses_audit_log.house_slot stays NULLABLE (historical rows).

ALTER TABLE house_staff
  ADD CONSTRAINT house_staff_slot_range CHECK (house_slot BETWEEN 0 AND 3);
ALTER TABLE house_incharges
  ADD CONSTRAINT house_incharges_slot_range CHECK (house_slot BETWEEN 0 AND 3);
ALTER TABLE houses_audit_log
  ADD CONSTRAINT houses_audit_log_slot_range
  CHECK (house_slot IS NULL OR house_slot BETWEEN 0 AND 3);

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
-- house_staff + house_incharges: full slot index.
-- houses_audit_log: partial index WHERE house_slot IS NOT NULL.
-- ============================================================

DROP INDEX IF EXISTS idx_house_staff_house_name;
CREATE INDEX idx_house_staff_house_slot ON house_staff (house_slot);

DROP INDEX IF EXISTS idx_house_incharges_house_name;
CREATE INDEX idx_house_incharges_house_slot ON house_incharges (house_slot);

DROP INDEX IF EXISTS idx_houses_audit_log_house_name;
CREATE INDEX idx_houses_audit_log_house_slot
  ON houses_audit_log (house_slot) WHERE house_slot IS NOT NULL;

-- ============================================================
-- Section 6: house_name sync trigger
-- Only fires on house_staff + house_incharges (the writable tables).
-- Audit log writes happen in app code with explicit slot.
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