-- Fix: staffs + profiles RLS policies for staff creation flow
-- Root cause: staffs INSERT had no INSERT policy; profiles INSERT policy only
-- allowed superadmin or user creating own profile. Both blocked the create flow.

-- 1. staffs INSERT policy — any active user in the school can create staff records
CREATE POLICY staffs_insert_for_staff_creation ON staffs
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.school_id = staffs.school_id
        AND profiles.status = 'active'
    )
  );

-- 2. staffs SELECT policy — admins/principals can view all staff in their school
CREATE POLICY staffs_select_for_staff_directory ON staffs
  FOR SELECT TO authenticated
  USING (
    auth_user_school_role_check(school_id, ARRAY['principal'::text, 'admin'::text, 'superadmin'::text])
  );

-- 3. profiles INSERT policy — principals/admins can create staff profiles in their school
CREATE POLICY profiles_insert_for_staff_creation ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
        AND p.school_id = profiles.school_id
        AND p.status = 'active'
        AND p.role IN ('principal', 'admin', 'superadmin')
    )
  );
