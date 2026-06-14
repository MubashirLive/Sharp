-- Fix: Super Admin must be able to INSERT into schools table
-- The existing "super_admin manages all schools" policy uses WITH CHECK on auth.uid()
-- but does not allow inserting because the school row doesn't exist yet for auth.uid() check.
-- This new INSERT policy uses USING only (not WITH CHECK) which is correct for inserts.

DROP POLICY IF EXISTS "super_admin can insert schools" ON public.schools;

CREATE POLICY "super_admin can insert schools" ON public.schools
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Fix: profiles table needs INSERT policy
-- 1. Users can insert their own profile (handled by trigger auto-creates, but as backup)
-- 2. Super admins can insert profiles for any user (needed for principal account creation)

DROP POLICY IF EXISTS "users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "super_admin can insert profiles" ON public.profiles;

CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "super_admin can insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));