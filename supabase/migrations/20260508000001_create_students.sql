-- Create students table
-- Multi-tenant: all queries MUST filter by school_id
-- FK: class_id → classes.id, section_id → sections.id

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL CHECK (char_length(full_name) >= 2),
  roll_no TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('male','female','other')),
  dob DATE,
  admission_date DATE DEFAULT CURRENT_DATE,
  father_name TEXT,
  father_mobile TEXT,
  mother_name TEXT,
  mother_mobile TEXT,
  parent_email TEXT,
  category TEXT,
  religion TEXT,
  nationality TEXT DEFAULT 'Indian',
  mother_tongue TEXT,
  medium_of_instruction TEXT DEFAULT 'English',
  is_minority BOOLEAN DEFAULT FALSE,
  is_only_child BOOLEAN DEFAULT FALSE,
  aadhar_number TEXT,
  blood_group TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_class_section ON students(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_students_school_status ON students(school_id, status);
CREATE INDEX IF NOT EXISTS idx_students_roll_no ON students(roll_no);

-- RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Users can read students in their school
CREATE POLICY "policy_students_select"
  ON students FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE school_id = students.school_id
    )
  );

-- Admins (super_admin, principal) can insert/update/delete
CREATE POLICY "policy_students_all"
  ON students FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE school_id = students.school_id
        AND role IN ('super_admin', 'principal')
    )
  );
