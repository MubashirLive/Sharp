-- Create wings table for grouping classes (e.g. Montessori: Nursery, LKG, UKG)
CREATE TABLE wings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE wings ENABLE ROW LEVEL SECURITY;

-- Principals and admins can manage wings for their school
CREATE POLICY "wing_manage" ON wings
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE role IN ('principal', 'admin')
      AND school_id = wings.school_id
    )
  );

-- Add wing_id FK to classes (wing text column kept for backward compat)
ALTER TABLE classes ADD COLUMN wing_id UUID REFERENCES wings(id) ON DELETE SET NULL;
CREATE INDEX idx_classes_wing_id ON classes(wing_id);