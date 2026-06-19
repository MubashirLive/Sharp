-- 2026-06-19: Collapse department_incharges into department_staff.
--
-- Two tables tracked the same staff-dept relationship: department_staff (membership)
-- and department_incharges (incharge designation). The 2-table split caused a
-- silent-no-op bug on 2026-06-19 (useSaveStaffRoles passed rowId instead of
-- staffId, the delete matched zero rows, chip reappeared on next load).
--
-- Collapse to a single table. An incharge IS a member — encode that as a boolean
-- flag on the membership row. One row per (staff, department, school) with an
-- optional incharge flag.

BEGIN;

-- 1. Add the is_incharge column. Default false so existing member rows stay
--    members; backfill below will flip the ones that have an incharge row.
ALTER TABLE department_staff
  ADD COLUMN IF NOT EXISTS is_incharge boolean NOT NULL DEFAULT false;

-- 2. Backfill: for every incharge designation, set the matching membership row
--    to is_incharge = true. Safe to run multiple times.
UPDATE department_staff ds
SET is_incharge = true
FROM department_incharges di
WHERE ds.department_id = di.department_id
  AND ds.staff_profile_id = di.staff_profile_id
  AND ds.school_id = di.school_id
  AND ds.is_incharge = false;

-- 3. Drop the now-redundant table. CASCADE removes FKs, RLS policies, indexes.
--    Triggers on the table (if any) are also dropped via CASCADE.
DROP TABLE IF EXISTS department_incharges CASCADE;

-- 4. Index for the "is this staff the incharge of dept X?" read path that
--    used to scan the whole department_incharges table.
CREATE INDEX IF NOT EXISTS idx_department_staff_incharge
  ON department_staff (department_id, staff_profile_id)
  WHERE is_incharge = true;

COMMIT;
