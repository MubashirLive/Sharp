-- ============================================================================
-- Unify class-teacher model on staff_roles
-- ============================================================================
-- The Subjects tab in Role Manager writes class_teacher assignments to
-- `staff_roles` (role_type = 'class_teacher'), while the Staff tab still
-- reads/writes the legacy `class_teachers` table. That split causes the two
-- tabs to disagree and the Subjects tab's upsert to collide with the
-- `one_class_teacher_per_section` exclusion constraint on staff_roles.
--
-- This migration:
--   1. Backfills any rows from class_teachers into staff_roles.
--   2. Rewrites the dependent function `user_class_ids()` to read staff_roles.
--   3. Rewrites the dependent `Staff can mark submissions` policy on
--      homework_submissions to read staff_roles.
--   4. Drops the legacy class_teachers table and its policies.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Backfill class_teachers -> staff_roles
-- ----------------------------------------------------------------------------
-- Skip rows that already exist in staff_roles for the same
-- (school, class, section, role_type='class_teacher', staff) to keep the
-- migration idempotent.
INSERT INTO public.staff_roles (
  staff_id, school_id, role_type, class_id, section_id, subject_id,
  academic_year_id, assigned_at, assigned_by
)
SELECT
  ct.staff_profile_id,
  ct.school_id,
  'class_teacher',
  ct.class_id,
  ct.section_id,
  NULL,
  ct.academic_year_id,
  ct.assigned_at,
  ct.assigned_by
FROM public.class_teachers ct
WHERE NOT EXISTS (
  SELECT 1 FROM public.staff_roles sr
  WHERE sr.school_id  = ct.school_id
    AND sr.class_id   = ct.class_id
    AND sr.section_id = ct.section_id
    AND sr.role_type  = 'class_teacher'
    AND sr.staff_id   = ct.staff_profile_id
);

-- ----------------------------------------------------------------------------
-- 2. Rewrite user_class_ids() to read staff_roles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_class_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT COALESCE(array_agg(class_id), ARRAY[]::uuid[])
  FROM public.staff_roles
  WHERE staff_id = auth.uid()
    AND role_type = 'class_teacher';
$function$;

-- ----------------------------------------------------------------------------
-- 3. Rewrite the homework_submissions policy to read staff_roles
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can mark submissions" ON public.homework_submissions;

CREATE POLICY "Staff can mark submissions"
  ON public.homework_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles
      WHERE staff_profiles.id = auth.uid()
        AND homework_submissions.homework_id IN (
          SELECT homework.id
          FROM homework
          WHERE homework.submitted_by = auth.uid()
             OR homework.assigned_to_class IN (
               SELECT sr.class_id
               FROM public.staff_roles sr
               WHERE sr.staff_id  = auth.uid()
                 AND sr.role_type = 'class_teacher'
             )
        )
    )
  )
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. Drop the legacy class_teachers table (and its policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "class_teachers_manage"               ON public.class_teachers;
DROP POLICY IF EXISTS "teachers_select_class_teachers"      ON public.class_teachers;
DROP POLICY IF EXISTS "staff_select_class_teachers"         ON public.class_teachers;
DROP POLICY IF EXISTS "non_teaching_select_class_teachers" ON public.class_teachers;
DROP POLICY IF EXISTS "principal_select_class_teachers"     ON public.class_teachers;

DROP TABLE IF EXISTS public.class_teachers CASCADE;
