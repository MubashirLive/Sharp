-- Migration: Houses Slot Trigger Fix (PR 1.5)
-- Scope: Fix sync_house_name_from_slot to extract (houses->slot)->>'name'
--        instead of (houses->>slot) which returned the whole JSON object as text.
--
-- Discovered during PR 1-3 autorun verification step 5 (rename-survives-staff
-- test). INSERT INTO house_staff (house_slot=0) set house_name to the entire
-- house object as a JSON string instead of just the name field.
--
-- Idempotent: DROP+CREATE the function and triggers.

BEGIN;

CREATE OR REPLACE FUNCTION sync_house_name_from_slot() RETURNS TRIGGER AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  SELECT ((houses -> NEW.house_slot)->>'name')::text
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