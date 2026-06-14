-- Add UPDATE policy for principals/admins on their own school
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "principal_admin update own school" ON public.schools;

CREATE POLICY "principal_admin update own school" ON public.schools
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('principal', 'admin')
      AND school_id = schools.id
    )
  );