-- Migration: staff_profile_extended
-- Description: Creates the staff_profile_extended table to store Stage 2-4 data
-- that cannot fit in the slim staffs table. Stage 1 data (identity, employment setup,
-- login setup, quick info) lives in profiles and staffs tables.
-- Stage 2: Address, Contact Details, Employment Extended
-- Stage 3: Education, Certifications, Prior Experience, Skills
-- Stage 4: Government IDs (encrypted), Bank Details (encrypted), Documents Received, Payroll

CREATE TABLE IF NOT EXISTS staff_profile_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Stage 2: Address & Contact
  local_address TEXT,
  permanent_address TEXT,
  same_as_local BOOLEAN DEFAULT false,
  personal_email TEXT,
  whatsapp_mobile TEXT,

  -- Stage 2: Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_number TEXT,
  emergency_contact_relation TEXT,

  -- Stage 2: Employment Extended
  employment_status TEXT, -- Probation, Permanent, Contract, Part-Time, Guest, Substitute
  grade_level TEXT,
  shift TEXT,
  house TEXT,
  religion TEXT,
  religion_specify TEXT,
  nationality TEXT,
  category TEXT, -- General, OBC, SC, ST, etc.

  -- Stage 3: Education (JSONB array)
  education JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,

  -- Stage 4: Government IDs (app-level encryption required)
  aadhar_number_encrypted TEXT,
  pan_number_encrypted TEXT,
  epf_uan TEXT,
  esic_number TEXT,

  -- Stage 4: Bank Details (app-level encryption required)
  bank_name TEXT,
  bank_account_encrypted TEXT,
  ifsc_code TEXT,
  bank_branch TEXT,
  bank_passbook_url TEXT,

  -- Stage 4: Payroll
  salary_grade TEXT,
  basic_salary NUMERIC(12,2),
  hra NUMERIC(12,2),
  da NUMERIC(12,2),
  special_allowance NUMERIC(12,2),
  gross_salary NUMERIC(12,2),
  last_salary_drawn NUMERIC(12,2),
  tds_applicable BOOLEAN DEFAULT false,
  gis BOOLEAN DEFAULT false,
  last_increment_date DATE,
  increment_due_date DATE,

  -- Stage 4: Documents Received (JSONB array of {type, received, file_url})
  documents_received JSONB DEFAULT '[]'::jsonb
);

-- Unique constraint: one extended record per staff profile
CREATE UNIQUE INDEX idx_staff_profile_extended_profile_id ON staff_profile_extended(profile_id);
CREATE INDEX idx_staff_profile_extended_school_id ON staff_profile_extended(school_id);

-- RLS
ALTER TABLE staff_profile_extended ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view staff_profile_extended within their school"
  ON staff_profile_extended FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_profile_extended.school_id
    )
  );

CREATE POLICY "Staff can update own profile extended"
  ON staff_profile_extended FOR UPDATE
  USING (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_profile_extended.school_id
    )
  );

CREATE POLICY "Admins and above can insert staff_profile_extended"
  ON staff_profile_extended FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_profile_extended.school_id
      AND profiles.role IN ('principal', 'master_admin')
    )
  );

CREATE POLICY "Admins and above can delete staff_profile_extended"
  ON staff_profile_extended FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.school_id = staff_profile_extended.school_id
      AND profiles.role IN ('principal', 'master_admin')
    )
  );

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER staff_profile_extended_updated_at
  BEFORE UPDATE ON staff_profile_extended
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();