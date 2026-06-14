-- Migration: staff_bulk_actions
-- Description: Creates the staff_bulk_actions table for tracking bulk operations
-- (Quick Enrollment, Bulk Full Import) with revert capability.
-- Revert available for 2 hours after creation. Revert deletes batch and releases Staff IDs.

CREATE TABLE IF NOT EXISTS staff_bulk_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  mode TEXT NOT NULL, -- 'quick_enrollment' | 'bulk_full_import'
  count INTEGER NOT NULL, -- number of staff created
  status TEXT NOT NULL DEFAULT 'success', -- 'success' | 'reverted' | 'partial_failure'
  details JSONB DEFAULT '{}'::jsonb, -- {file_name, preview_count, committed_at, ...}
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '2 hours'),
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES profiles(id)
);

CREATE INDEX idx_staff_bulk_actions_school_id ON staff_bulk_actions(school_id);
CREATE INDEX idx_staff_bulk_actions_user_id ON staff_bulk_actions(user_id);
CREATE INDEX idx_staff_bulk_actions_created_at ON staff_bulk_actions(created_at DESC);

-- RLS
ALTER TABLE staff_bulk_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bulk actions within their school"
  ON staff_bulk_actions FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins and above can insert bulk actions"
  ON staff_bulk_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_bulk_actions.school_id
      AND profiles.role IN ('principal', 'master_admin')
    )
  );

CREATE POLICY "Admins and above can update bulk actions (for revert)"
  ON staff_bulk_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_bulk_actions.school_id
      AND profiles.role IN ('principal', 'master_admin')
    )
  );

-- Function: can_revert_bulk_action(action_id) -> BOOLEAN
-- Returns true if action is within 2-hour revert window
CREATE OR REPLACE FUNCTION can_revert_bulk_action(p_action_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_action staff_bulk_actions%ROWTYPE;
BEGIN
  SELECT * INTO v_action FROM staff_bulk_actions WHERE id = p_action_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN v_action.status = 'success'
    AND v_action.reverted_at IS NULL
    AND v_action.expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: revert_bulk_action(p_action_id, p_user_id) -> BOOLEAN
-- Reverts a bulk action: soft-deletes staff, releases staff IDs
CREATE OR REPLACE FUNCTION revert_bulk_action(p_action_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_action staff_bulk_actions%ROWTYPE;
  v_staff_ids UUID[];
BEGIN
  -- Check if revert is allowed
  IF NOT can_revert_bulk_action(p_action_id) THEN
    RETURN false;
  END IF;

  -- Get the action details
  SELECT * INTO v_action FROM staff_bulk_actions WHERE id = p_action_id;

  -- Extract staff IDs from details
  v_staff_ids := ARRAY(
    SELECT (jsonb_array_elements_text(v_action.details->'staff_ids'))::UUID
  );

  -- Soft-delete staff profiles (set status to 'deleted' or similar)
  UPDATE profiles
  SET status = 'inactive', updated_at = now()
  WHERE id = ANY(v_staff_ids);

  -- Update action status
  UPDATE staff_bulk_actions
  SET status = 'reverted', reverted_at = now(), reverted_by = p_user_id
  WHERE id = p_action_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;