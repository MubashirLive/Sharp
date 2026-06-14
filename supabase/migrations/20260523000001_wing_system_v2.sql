-- Wing System v2: Coordinators, Activity Staff, Audit Log
-- Replaces single coordinator_id on wings with join table

-- 1. wings_coordinators — many-to-many wing ↔ coordinator
CREATE TABLE IF NOT EXISTS wings_coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wing_id UUID NOT NULL REFERENCES wings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'COORDINATOR' CHECK (role IN ('PRIMARY', 'COORDINATOR')),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (wing_id, staff_id)
);

CREATE INDEX idx_wings_coordinators_wing_id ON wings_coordinators(wing_id);
CREATE INDEX idx_wings_coordinators_staff_id ON wings_coordinators(staff_id);
CREATE INDEX idx_wings_coordinators_school_id ON wings_coordinators(school_id);

ALTER TABLE wings_coordinators ENABLE ROW LEVEL SECURITY;

-- Principals and master admins manage coordinators for their school
CREATE POLICY "Manage wing coordinators"
  ON wings_coordinators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'principal', 'admin')
        AND school_id = wings_coordinators.school_id
    )
  );

-- 2. wings_activity_staff — many-to-many wing ↔ activity staff
CREATE TABLE IF NOT EXISTS wings_activity_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wing_id UUID NOT NULL REFERENCES wings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (wing_id, staff_id)
);

CREATE INDEX idx_wings_activity_staff_wing_id ON wings_activity_staff(wing_id);
CREATE INDEX idx_wings_activity_staff_staff_id ON wings_activity_staff(staff_id);
CREATE INDEX idx_wings_activity_staff_school_id ON wings_activity_staff(school_id);

ALTER TABLE wings_activity_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Manage activity staff"
  ON wings_activity_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'principal', 'admin')
        AND school_id = wings_activity_staff.school_id
    )
  );

-- 3. wings_audit_log — immutable audit trail
CREATE TABLE IF NOT EXISTS wings_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wing_id UUID REFERENCES wings(id) ON DELETE SET NULL,
  wing_name TEXT,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  what TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wings_audit_log_school_id ON wings_audit_log(school_id);
CREATE INDEX idx_wings_audit_log_wing_id ON wings_audit_log(wing_id);
CREATE INDEX idx_wings_audit_log_when ON wings_audit_log(when DESC);

ALTER TABLE wings_audit_log ENABLE ROW LEVEL SECURITY;

-- Read access for principals and master admins
CREATE POLICY "Read wing audit log"
  ON wings_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'principal', 'admin')
        AND school_id = wings_audit_log.school_id
    )
  );

-- Insert access managed via service role only (not directly from client)
CREATE POLICY "Insert wing audit log"
  ON wings_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Migrate existing coordinator_id data to join table
INSERT INTO wings_coordinators (wing_id, staff_id, school_id, role, assigned_at)
SELECT w.id, w.coordinator_id, w.school_id, 'PRIMARY', w.created_at
FROM wings w
WHERE w.coordinator_id IS NOT NULL;

-- 5. Drop the old single coordinator_id column
ALTER TABLE wings DROP COLUMN IF EXISTS coordinator_id;