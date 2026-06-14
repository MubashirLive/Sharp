-- Staff role audit + is_master_admin
-- Used by Role Manager Staff tab

-- 1. Add is_master_admin column to profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_master_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_master_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 2. Create staff_role_audit table
CREATE TABLE IF NOT EXISTS public.staff_role_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_role_audit_staff ON public.staff_role_audit(staff_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_role_audit_school ON public.staff_role_audit(school_id, changed_at DESC);

-- 3. RLS for staff_role_audit
ALTER TABLE public.staff_role_audit ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "staff_role_audit_read" ON public.staff_role_audit;
DROP POLICY IF EXISTS "staff_role_audit_insert" ON public.staff_role_audit;

-- Principal can read all audit entries for their school
CREATE POLICY "staff_role_audit_read" ON public.staff_role_audit
  FOR SELECT TO authenticated
  USING (school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid()));

-- Principal can insert audit entries for their school
CREATE POLICY "staff_role_audit_insert" ON public.staff_role_audit
  FOR INSERT TO authenticated
  WITH CHECK (
    changed_by = auth.uid()
    AND school_id IN (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

COMMENT ON TABLE public.staff_role_audit IS 'Audit log for staff role changes via Role Manager';
