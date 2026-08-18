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
