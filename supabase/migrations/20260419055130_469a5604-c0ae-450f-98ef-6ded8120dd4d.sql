
-- Shifts (per school)
CREATE TABLE public.school_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Academic sessions
CREATE TABLE public.academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  term_structure TEXT NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Classes (linked to a session)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sections (per class)
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subjects (per class)
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add columns to schools for richer profile
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS acronym TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS school_type TEXT;

-- Enable RLS
ALTER TABLE public.school_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Generic policy helper inline: school staff manage; members view
-- school_shifts
CREATE POLICY "members view shifts" ON public.school_shifts FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "staff manage shifts" ON public.school_shifts FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));

-- academic_sessions
CREATE POLICY "members view sessions" ON public.academic_sessions FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "staff manage sessions" ON public.academic_sessions FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));

-- classes
CREATE POLICY "members view classes" ON public.classes FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "staff manage classes" ON public.classes FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));

-- sections
CREATE POLICY "members view sections" ON public.sections FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "staff manage sections" ON public.sections FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));

-- subjects
CREATE POLICY "members view subjects" ON public.subjects FOR SELECT TO authenticated
  USING (school_id = public.get_user_school_id(auth.uid()) OR public.is_super_admin(auth.uid()));
CREATE POLICY "staff manage subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_school_staff(auth.uid(), school_id) OR public.is_super_admin(auth.uid()));

-- Helpful indexes
CREATE INDEX idx_classes_session ON public.classes(session_id);
CREATE INDEX idx_sections_class ON public.sections(class_id);
CREATE INDEX idx_subjects_class ON public.subjects(class_id);
