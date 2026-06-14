-- Migration: staff join tables
-- Description: Creates department_staff, house_staff, and department_incharges tables
-- for staff membership tracking. These enable filtering in My Staff by department/house
-- and support cascade checks for deactivation/deletion.
--
-- MY_STAFF.md references:
-- - Department membership filter/column (reads department_staff table)
-- - House membership filter/column (reads house_staff table)
-- - Department Incharge cascade check (uses department_incharges table)

-- department_staff: Many-to-many between staff and departments
CREATE TABLE IF NOT EXISTS department_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(department_id, staff_profile_id)
);

CREATE INDEX idx_department_staff_department_id ON department_staff(department_id);
CREATE INDEX idx_department_staff_staff_id ON department_staff(staff_profile_id);
CREATE INDEX idx_department_staff_school_id ON department_staff(school_id);

-- house_staff: Many-to-many between staff and houses
-- Note: houses are stored as JSON in schools table, so we use house_name TEXT instead of FK
CREATE TABLE IF NOT EXISTS house_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL, -- References schools.houses JSON array by name
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(house_name, staff_profile_id)
);

CREATE INDEX idx_house_staff_house_name ON house_staff(house_name);
CREATE INDEX idx_house_staff_staff_id ON house_staff(staff_profile_id);
CREATE INDEX idx_house_staff_school_id ON house_staff(school_id);

-- department_incharges: Tracks which staff is incharge of which department
-- A department should have exactly one incharge (or none if vacant)
CREATE TABLE IF NOT EXISTS department_incharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(department_id, staff_profile_id)
);

CREATE INDEX idx_department_incharges_department_id ON department_incharges(department_id);
CREATE INDEX idx_department_incharges_staff_id ON department_incharges(staff_profile_id);
CREATE INDEX idx_department_incharges_school_id ON department_incharges(school_id);

-- RLS for all tables
ALTER TABLE department_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_incharges ENABLE ROW LEVEL SECURITY;

-- department_staff policies
CREATE POLICY "Users can view department_staff within their school"
  ON department_staff FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and above can manage department_staff"
  ON department_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = department_staff.school_id
      AND profiles.role IN ('principal', 'master_admin', 'admin')
    )
  );

-- house_staff policies
CREATE POLICY "Users can view house_staff within their school"
  ON house_staff FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and above can manage house_staff"
  ON house_staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = house_staff.school_id
      AND profiles.role IN ('principal', 'master_admin', 'admin')
    )
  );

-- department_incharges policies
CREATE POLICY "Users can view department_incharges within their school"
  ON department_incharges FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and above can manage department_incharges"
  ON department_incharges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = department_incharges.school_id
      AND profiles.role IN ('principal', 'master_admin')
    )
  );