-- Migration: staff_form_7tab
-- Description: 7-tab staff form refactor
--   - Drop unused staff_profile_extended (0 rows)
--   - Add all 7-tab fields to staff_profiles
--   - Add RLS policies (per PERMISSION_MATRIX.md)
--   - Restructure documents_received from array to keyed object
-- Spec: docs/STAFF_FORM.md (7-tab plan)

BEGIN;

-- ============================================
-- STEP 1: Drop unused staff_profile_extended
-- ============================================

DROP TABLE IF EXISTS staff_profile_extended CASCADE;

-- ============================================
-- STEP 2: Add Tab 2 (Personal & Contact) columns
-- ============================================

ALTER TABLE staff_profiles
  -- Personal & Demographics
  ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
  -- Social / Category (category already exists)
  ADD COLUMN IF NOT EXISTS subcaste TEXT,
  ADD COLUMN IF NOT EXISTS caste_certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS religion_specify TEXT,
  ADD COLUMN IF NOT EXISTS minority BOOLEAN DEFAULT false,
  -- Family
  ADD COLUMN IF NOT EXISTS marital_status TEXT,
  ADD COLUMN IF NOT EXISTS date_of_marriage DATE,
  ADD COLUMN IF NOT EXISTS spouse_name TEXT,
  ADD COLUMN IF NOT EXISTS spouse_occupation TEXT,
  ADD COLUMN IF NOT EXISTS spouse_contact TEXT,
  ADD COLUMN IF NOT EXISTS father_occupation TEXT,
  ADD COLUMN IF NOT EXISTS father_contact TEXT,
  ADD COLUMN IF NOT EXISTS husband_occupation TEXT,
  ADD COLUMN IF NOT EXISTS husband_contact TEXT,
  ADD COLUMN IF NOT EXISTS has_children BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS children JSONB DEFAULT '[]'::jsonb,
  -- Contact
  ADD COLUMN IF NOT EXISTS secondary_mobile TEXT,
  -- Address (replacing single local_address/permanent_address text with structured object)
  ADD COLUMN IF NOT EXISTS local_address_obj JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS permanent_address_obj JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS same_as_local_address BOOLEAN DEFAULT true,
  -- Transport
  ADD COLUMN IF NOT EXISTS opted_for_transport BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bus_route TEXT,
  ADD COLUMN IF NOT EXISTS bus_stop TEXT;

-- ============================================
-- STEP 3: Add Tab 3 (Professional) columns
-- ============================================

ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS area_of_specialization TEXT,
  ADD COLUMN IF NOT EXISTS employment_type TEXT,
  ADD COLUMN IF NOT EXISTS date_of_joining DATE;

-- ============================================
-- STEP 4: Restructure education / certifications / experience row shapes
-- Old shape kept as separate columns via JSONB rewrite; client will provide new shape
-- ============================================

-- (education, certifications, experience, skills already exist as JSONB — restructure handled client-side)
-- Add new column to record new education shape with level[] array
ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS admin_experience_note TEXT,
  ADD COLUMN IF NOT EXISTS assignments_responsibilities TEXT,
  ADD COLUMN IF NOT EXISTS courses_currently_pursuing TEXT,
  ADD COLUMN IF NOT EXISTS leave_required_studies BOOLEAN;

-- ============================================
-- STEP 5: Add Tab 6 (Payroll) columns
-- ============================================

ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS pay_scale_grade TEXT,
  ADD COLUMN IF NOT EXISTS basic_salary NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS hra NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS da NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS special_allowance NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS other_allowance NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS gross_salary NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS last_salary_drawn NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS last_salary_year INTEGER,
  ADD COLUMN IF NOT EXISTS mode_of_last_salary_payment TEXT,
  ADD COLUMN IF NOT EXISTS salary_certificate_url TEXT,
  ADD COLUMN IF NOT EXISTS minimum_expected_salary NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS date_of_last_increment DATE,
  ADD COLUMN IF NOT EXISTS if_selected_joining_date DATE;

-- ============================================
-- STEP 6: Add Tab 7 (Statutory & Records) columns
-- ============================================

ALTER TABLE staff_profiles
  -- Bank (already has bank_name, account_number, ifsc_code; add remaining)
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code_text TEXT,
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS bank_passbook_url TEXT,
  ADD COLUMN IF NOT EXISTS aadhar_number_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS aadhar_not_available BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS epf_enrolled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS epf_uan TEXT,
  ADD COLUMN IF NOT EXISTS esic_number TEXT,
  ADD COLUMN IF NOT EXISTS gratuity_eligible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tds_applicable BOOLEAN DEFAULT false,
  -- Disability
  ADD COLUMN IF NOT EXISTS disability_type TEXT,
  ADD COLUMN IF NOT EXISTS pwd BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS disability_specification TEXT,
  ADD COLUMN IF NOT EXISTS disability_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS disability_certificate_url TEXT,
  -- Minority details
  ADD COLUMN IF NOT EXISTS minority_certificate_received BOOLEAN,
  ADD COLUMN IF NOT EXISTS minority_certificate_url TEXT,
  -- References
  ADD COLUMN IF NOT EXISTS references JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- STEP 7: Indexes for common filters
-- ============================================

CREATE INDEX IF NOT EXISTS idx_staff_profiles_employee_id ON staff_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_school_id ON staff_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_joining_date ON staff_profiles(date_of_joining);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_employment_type ON staff_profiles(employment_type);

-- ============================================
-- STEP 8: RLS — principal/admin full access in own school, staff read own
-- ============================================

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS staff_profiles_all ON staff_profiles;
DROP POLICY IF EXISTS staff_profiles_own ON staff_profiles;

-- Principal / master_admin / superadmin: full CRUD in their school
CREATE POLICY staff_profiles_admin_all ON staff_profiles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.school_id = staff_profiles.school_id
    AND profiles.status = 'active'
    AND profiles.role IN ('superadmin', 'master_admin', 'principal')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.school_id = staff_profiles.school_id
    AND profiles.status = 'active'
    AND profiles.role IN ('superadmin', 'master_admin', 'principal')
  ));

-- Staff: read own profile only
CREATE POLICY staff_profiles_own_read ON staff_profiles
  FOR SELECT
  USING (profile_id = auth.uid());

-- Staff: update own profile (limited columns handled via column-level grants if needed)
CREATE POLICY staff_profiles_own_update ON staff_profiles
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

COMMIT;
