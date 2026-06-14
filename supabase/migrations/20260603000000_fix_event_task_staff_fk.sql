-- FIX: Unblock staff hard-delete
-- 1. event_task_completions.staff_id was created without ON DELETE clause (default NO ACTION).
--    A profile delete would FK-violate. Add CASCADE.
-- 2. staff_bulk_actions.user_id and reverted_by are NO ACTION — would block delete of any staff
--    who ever ran or reverted a bulk import. Change to SET NULL so history is preserved.

BEGIN;

-- 1) event_task_completions.staff_id → CASCADE
ALTER TABLE event_task_completions
  DROP CONSTRAINT IF EXISTS event_task_completions_staff_id_fkey;
ALTER TABLE event_task_completions
  ADD CONSTRAINT event_task_completions_staff_id_fkey
  FOREIGN KEY (staff_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2) staff_bulk_actions.user_id → SET NULL
ALTER TABLE staff_bulk_actions
  DROP CONSTRAINT IF EXISTS staff_bulk_actions_user_id_fkey;
ALTER TABLE staff_bulk_actions
  ADD CONSTRAINT staff_bulk_actions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3) staff_bulk_actions.reverted_by → SET NULL
ALTER TABLE staff_bulk_actions
  DROP CONSTRAINT IF EXISTS staff_bulk_actions_reverted_by_fkey;
ALTER TABLE staff_bulk_actions
  ADD CONSTRAINT staff_bulk_actions_reverted_by_fkey
  FOREIGN KEY (reverted_by) REFERENCES profiles(id) ON DELETE SET NULL;

COMMIT;
