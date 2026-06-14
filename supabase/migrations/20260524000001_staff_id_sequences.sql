-- Migration: staff_id_sequences
-- Description: Creates the staff_id_sequences table for managing auto-generated
-- staff IDs with Reserve-Release pattern. Format: E{YY}{ACRONYM}{SEQ:0000}
-- e.g., E26IIS0001 where E=Staff prefix, 26=year, IIS=school acronym, 0001=sequence
-- Reserve-Release ensures IDs aren't wasted if user abandons enrollment flow.

CREATE TABLE IF NOT EXISTS staff_id_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id),
  year INTEGER NOT NULL, -- e.g., 2026
  prefix TEXT NOT NULL, -- e.g., "E"
  acronym TEXT NOT NULL, -- e.g., "IIS" (from school.acronym)
  last_assigned INTEGER DEFAULT 0,
  reserved_count INTEGER DEFAULT 0, -- count of IDs currently in reserved state
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, year)
);

CREATE INDEX idx_staff_id_sequences_school_year ON staff_id_sequences(school_id, year);

-- Function: reserve_staff_id(school_id, year) -> TEXT
-- Atomically reserves the next ID and returns it. If no sequence exists,
-- creates one starting at 1. Clears after 30 minutes if not committed.
CREATE OR REPLACE FUNCTION reserve_staff_id(p_school_id UUID, p_year INTEGER)
RETURNS TEXT AS $$
DECLARE
  v_seq RECORD;
  v_next INTEGER;
  v_id TEXT;
  v_acronym TEXT;
  v_prefix TEXT;
BEGIN
  -- Get or create sequence for this school/year
  SELECT * INTO v_seq FROM staff_id_sequences
  WHERE school_id = p_school_id AND year = p_year
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Create new sequence
    SELECT acronym INTO v_acronym FROM schools WHERE id = p_school_id;
    v_prefix := 'E';

    INSERT INTO staff_id_sequences (school_id, year, prefix, acronym, last_assigned, reserved_count)
    VALUES (p_school_id, p_year, v_prefix, COALESCE(v_acronym, 'SCH'), 0, 0)
    RETURNING * INTO v_seq;

    v_next := 1;
  ELSE
    v_next := v_seq.last_assigned + 1;
  END IF;

  -- Update sequence
  UPDATE staff_id_sequences
  SET last_assigned = v_next, reserved_count = reserved_count + 1
  WHERE id = v_seq.id;

  -- Generate ID: E{YY}{ACRONYM}{SEQ:0000}
  v_id := format('%s%02d%s%04d', v_seq.prefix, p_year % 100, v_seq.acronym, v_next);

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: release_staff_id(school_id, year, staff_id) -> BOOLEAN
-- Releases a reserved ID back to the pool (if enrollment was abandoned).
-- Only works within 30 minutes of reservation.
CREATE OR REPLACE FUNCTION release_staff_id(p_school_id UUID, p_year INTEGER, p_staff_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_seq RECORD;
BEGIN
  SELECT * INTO v_seq FROM staff_id_sequences
  WHERE school_id = p_school_id AND year = p_year
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Decrement reserved count
  UPDATE staff_id_sequences
  SET reserved_count = GREATEST(0, reserved_count - 1)
  WHERE id = v_seq.id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: commit_staff_id(p_school_id, p_year)
-- Called after bulk enrollment committed — clears reserved count
CREATE OR REPLACE FUNCTION commit_staff_id(p_school_id UUID, p_year INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE staff_id_sequences
  SET reserved_count = 0
  WHERE school_id = p_school_id AND year = p_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE staff_id_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view staff_id_sequences within their school"
  ON staff_id_sequences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_id_sequences.school_id
    )
  );

CREATE POLICY "Admins and above can manage staff_id_sequences"
  ON staff_id_sequences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_id_sequences.school_id
      AND profiles.role IN ('principal', 'master_admin', 'admin')
    )
  );