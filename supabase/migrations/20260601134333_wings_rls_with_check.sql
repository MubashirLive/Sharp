-- Fix: wings RLS policy was missing WITH CHECK clause.
-- The original policy (20260513000000_create_wings.sql) was:
--   CREATE POLICY "wing_manage" ON wings FOR ALL USING (...);
-- FOR INSERT, this means RLS does not validate the new row's school_id.
-- FOR UPDATE, RLS uses USING on the old row only, so a principal could
-- in theory update a wing's school_id to a different school.
--
-- This migration drops and recreates the policy with both USING and
-- WITH CHECK to fully validate every mutation. Also aligns the allowed
-- roles with the rest of the wing system (super_admin included, matching
-- wings_coordinators / wings_activity_staff / wings_audit_log).
--
-- Reported bug: Wings tab "Save Changes" in the unsaved-changes modal
-- appeared to succeed (modal closed, tab switched) but the DB row was
-- not updated. Root cause was handleSave swallowing per-step errors
-- (WingsTab.tsx) — fixed in code. This migration closes the RLS gap
-- so any future failure surface visibly.
--
-- Permission: principal/admin/super_admin of the same school.

DROP POLICY IF EXISTS "wing_manage" ON wings;

CREATE POLICY "wing_manage" ON wings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'principal', 'admin')
        AND school_id = wings.school_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'principal', 'admin')
        AND school_id = wings.school_id
    )
  );
