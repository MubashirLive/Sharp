-- FIX2: 4-Table User Profile Architecture
-- Creates staff_profiles, principal_profiles, superadmin_profiles, student_profiles
-- Migrates data from staffs + staff_profile_extended + profiles
-- Replaces fragmented 3-table staff data with single staff_profiles table

BEGIN;

-- ============================================
-- STEP 1: Create new tables
-- ============================================

-- superadmin_profiles: isolated superadmin identity
CREATE TABLE IF NOT EXISTS superadmin_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE superadmin_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_profiles_all ON superadmin_profiles;
CREATE POLICY superadmin_profiles_all ON superadmin_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- principal_profiles: principal-specific fields
CREATE TABLE IF NOT EXISTS principal_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  salutation TEXT,
  father_name TEXT,
  gender TEXT,
  dob DATE,
  photo_url TEXT,
  school_id UUID NOT NULL,
  designation TEXT,
  school_name TEXT,
  mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE principal_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS principal_profiles_all ON principal_profiles;
CREATE POLICY principal_profiles_all ON principal_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND profiles.role IN ('superadmin', 'admin')
  ));

-- staff_profiles: ALL staff fields in one table (replaces staffs + staff_profile_extended)
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id TEXT,
  full_name TEXT NOT NULL DEFAULT '',
  salutation TEXT,
  father_name TEXT,
  gender TEXT,
  dob DATE,
  photo_url TEXT,
  school_id UUID NOT NULL,
  -- Employment
  designation TEXT,
  department TEXT,
  qualification TEXT,
  experience_years INTEGER,
  joining_date DATE,
  is_class_teacher BOOLEAN DEFAULT false,
  assigned_class_id UUID,
  assigned_section_id UUID,
  salary_pattern TEXT,
  -- Contact
  local_address TEXT,
  permanent_address TEXT,
  personal_email TEXT,
  whatsapp_mobile TEXT,
  official_email TEXT,
  -- Emergency
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  emergency_contact_relation TEXT,
  -- Personal
  blood_group TEXT,
  employment_status TEXT,
  grade_level TEXT,
  shift TEXT,
  house TEXT,
  religion TEXT,
  nationality TEXT,
  category TEXT,
  -- Documents (jsonb)
  education JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  documents_received JSONB DEFAULT '{}'::jsonb,
  -- Bank
  bank_name TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  pan_number TEXT,
  -- Salary
  ctc JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS staff_profiles_all ON staff_profiles;
CREATE POLICY staff_profiles_all ON staff_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND profiles.school_id = staff_profiles.school_id
    AND profiles.status = 'active'
    AND profiles.role IN ('superadmin', 'admin', 'principal')
  ));
DROP POLICY IF EXISTS staff_profiles_own ON staff_profiles;
CREATE POLICY staff_profiles_own ON staff_profiles FOR SELECT, UPDATE
  USING (profile_id = auth.uid());

-- student_profiles: academic extension (students table has all personal data)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  admission_no TEXT UNIQUE,
  roll_no TEXT,
  class_id UUID,
  section_id UUID,
  house TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS student_profiles_all ON student_profiles;
CREATE POLICY student_profiles_all ON student_profiles FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND profiles.school_id = student_profiles.school_id
    AND profiles.status = 'active'
    AND profiles.role IN ('superadmin', 'admin', 'principal')
  ));
DROP POLICY IF EXISTS student_profiles_read ON student_profiles;
CREATE POLICY student_profiles_read ON student_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
    AND profiles.school_id = student_profiles.school_id
    AND profiles.status = 'active'
  ));

-- ============================================
-- STEP 2: Migrate data (non-destructive, idempotent)
-- ============================================

-- Migrate superadmins
INSERT INTO superadmin_profiles (profile_id, full_name, email, mobile)
SELECT id, COALESCE(full_name, ''), email, mobile
FROM profiles WHERE role = 'superadmin'
ON CONFLICT (profile_id) DO NOTHING;

-- Migrate principals
INSERT INTO principal_profiles (profile_id, full_name, salutation, school_id, mobile)
SELECT id, COALESCE(full_name, ''), salutation, school_id, mobile
FROM profiles WHERE role = 'principal'
ON CONFLICT (profile_id) DO NOTHING;

-- Migrate staff: combine staffs + staff_profile_extended into staff_profiles
INSERT INTO staff_profiles (
  id, profile_id, employee_id, full_name, school_id,
  designation, department, qualification, experience_years, joining_date,
  is_class_teacher, assigned_class_id, assigned_section_id, salary_pattern,
  local_address, permanent_address, personal_email, whatsapp_mobile,
  emergency_contact_name, emergency_contact_number, emergency_contact_relation,
  employment_status, grade_level, shift, house, religion, nationality, category,
  education, certifications, experience, skills,
  bank_name, account_holder_name, account_number, ifsc_code, pan_number, ctc,
  created_at
)
SELECT
  s.id,
  s.profile_id,
  s.employee_id,
  COALESCE(p.full_name, ''),
  s.school_id,
  s.designation,
  s.department,
  s.qualification,
  s.experience_years,
  s.joining_date,
  s.is_class_teacher,
  s.assigned_class_id,
  s.assigned_section_id,
  s.salary_pattern,
  se.local_address,
  se.permanent_address,
  se.personal_email,
  se.whatsapp_mobile,
  se.emergency_contact_name,
  se.emergency_contact_number,
  se.emergency_contact_relation,
  se.employment_status,
  se.grade_level,
  se.shift,
  se.house,
  se.religion,
  se.nationality,
  se.category,
  COALESCE(se.education, '[]'::jsonb),
  COALESCE(se.certifications, '[]'::jsonb),
  COALESCE(se.experience, '[]'::jsonb),
  COALESCE(se.skills, '[]'::jsonb),
  se.bank_name,
  se.account_holder_name,
  se.account_number,
  se.ifsc_code,
  se.pan_number,
  jsonb_build_object(
    'basic', se.basic_salary,
    'da', se.da,
    'hra', se.hra,
    'allowances', se.allowances,
    'deductions', se.deductions,
    'net_salary', se.net_salary
  ) AS ctc,
  COALESCE(s.created_at, now())
FROM staffs s
LEFT JOIN profiles p ON p.id = s.profile_id
LEFT JOIN staff_profile_extended se ON se.staff_id = s.id
ON CONFLICT (profile_id) DO NOTHING;

-- Migrate students: create student_profiles for students with students table data
INSERT INTO student_profiles (profile_id, class_id, section_id)
SELECT p.id, st.class_id, st.section_id
FROM students st
JOIN profiles p ON p.school_id = st.school_id AND p.role = 'student'
ON CONFLICT (profile_id) DO NOTHING;

COMMIT;