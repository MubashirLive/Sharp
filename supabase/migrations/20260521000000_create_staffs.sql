-- Create staffs table
-- Multi-tenant: all queries MUST filter by school_id
-- Stores staff profiles with multi-designation support

CREATE TABLE IF NOT EXISTS staffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,

  -- Identity
  staff_id_no TEXT NOT NULL,
  salutation TEXT CHECK (salutation IN ('Mr.','Mrs.','Ms.','Dr.','Prof.')),
  first_name TEXT NOT NULL CHECK (char_length(first_name) <= 30),
  middle_name TEXT,
  last_name TEXT NOT NULL CHECK (char_length(last_name) <= 30),
  gender TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  dob DATE,
  photo_url TEXT,
  blood_group TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),

  -- Employment Setup (Stage 1)
  staff_type TEXT NOT NULL CHECK (staff_type IN ('Teaching','Non-Teaching')),
  primary_designation TEXT NOT NULL,
  custom_designation TEXT,
  additional_designations JSONB DEFAULT '[]' CHECK (jsonb_typeof(additional_designations) = 'array'),
  department TEXT NOT NULL,
  joining_date DATE DEFAULT CURRENT_DATE,

  -- Login
  personal_mobile TEXT NOT NULL,
  login_mobile TEXT NOT NULL,
  force_pin_change BOOLEAN DEFAULT TRUE,

  -- Address (Stage 2)
  local_address TEXT,
  permanent_address TEXT,
  same_permanent_address BOOLEAN DEFAULT FALSE,

  -- Contact (Stage 2)
  personal_email TEXT,
  whatsapp_mobile TEXT,
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  emergency_contact_relation TEXT,

  -- Employment Extended (Stage 2)
  employment_status TEXT CHECK (employment_status IN ('Permanent','Contract','Probation')),
  grade_level TEXT,
  shift TEXT,
  house TEXT,
  religion TEXT,
  religion_specify TEXT,
  nationality TEXT DEFAULT 'Indian',
  category TEXT CHECK (category IN ('General','SC','ST','OBC','Subcaste')),

  -- Qualifications (Stage 3)
  education JSONB DEFAULT '[]' CHECK (jsonb_typeof(education) = 'array'),
  certifications JSONB DEFAULT '[]' CHECK (jsonb_typeof(certifications) = 'array'),
  experience JSONB DEFAULT '[]' CHECK (jsonb_typeof(experience) = 'array'),
  skills JSONB DEFAULT '[]' CHECK (jsonb_typeof(skills) = 'array'),

  -- Compliance & Payroll (Stage 4)
  aadhar_number TEXT,
  pan_number TEXT,
  epf_uan TEXT,
  esic_number TEXT,

  -- Bank Details
  bank_name TEXT,
  bank_account_no TEXT,
  ifsc_code TEXT,
  bank_branch TEXT,
  bank_passbook_url TEXT,

  -- Documents Received (admin checklist)
  documents_received JSONB DEFAULT '[]' CHECK (jsonb_typeof(documents_received) = 'array'),

  -- Payroll
  salary_grade TEXT,
  tds_applicable BOOLEAN DEFAULT FALSE,
  gis BOOLEAN DEFAULT FALSE,
  last_increment_date DATE,
  increment_due_date DATE,

  -- Profile completion tracking
  profile_stage1_complete BOOLEAN DEFAULT FALSE,
  profile_stage2_complete BOOLEAN DEFAULT FALSE,
  profile_stage3_complete BOOLEAN DEFAULT FALSE,
  profile_stage4_complete BOOLEAN DEFAULT FALSE,

  -- Status & timestamps
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave','suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraints
  UNIQUE(school_id, staff_id_no),
  UNIQUE(school_id, login_mobile)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_staffs_school_id ON staffs(school_id);
CREATE INDEX IF NOT EXISTS idx_staffs_staff_id_no ON staffs(school_id, staff_id_no);
CREATE INDEX IF NOT EXISTS idx_staffs_login_mobile ON staffs(school_id, login_mobile);
CREATE INDEX IF NOT EXISTS idx_staffs_status ON staffs(school_id, status);
CREATE INDEX IF NOT EXISTS idx_staffs_staff_type ON staffs(school_id, staff_type);
CREATE INDEX IF NOT EXISTS idx_staffs_department ON staffs(school_id, department);
CREATE INDEX IF NOT EXISTS idx_staffs_personal_mobile ON staffs(personal_mobile);

-- RLS
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

-- Users can read staffs in their school
CREATE POLICY "policy_staffs_select"
  ON staffs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE school_id = staffs.school_id
    )
  );

-- Admins (super_admin, principal, admin) can insert/update/delete
CREATE POLICY "policy_staffs_all"
  ON staffs FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles
      WHERE school_id = staffs.school_id
        AND role IN ('super_admin', 'principal', 'admin')
    )
  );

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staffs_updated_at
  BEFORE UPDATE ON staffs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Staff ID auto-generation trigger
CREATE OR REPLACE FUNCTION generate_staff_app_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.staff_id_no IS NULL OR NEW.staff_id_no = '' THEN
    NEW.staff_id_no := 'STF' || TO_CHAR(NOW(), 'YY') || LPAD(substr(md5(random()::text), 1, 5), 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_staff_app_id
  BEFORE INSERT ON staffs
  FOR EACH ROW
  EXECUTE FUNCTION generate_staff_app_id();