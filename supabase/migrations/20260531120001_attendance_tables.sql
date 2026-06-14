-- Attendance Tables
-- Phase 1: Core attendance marking, list view, and filtered views

BEGIN;

-- ─── attendance ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id       UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_sessions(id),
  marked_by        UUID NOT NULL REFERENCES public.profiles(id),
  date             DATE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (class_id, section_id, date)
);

-- ─── attendance_records ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES public.attendance(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('present', 'absent', 'leave')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (attendance_id, student_id)
);

-- ─── indexes ───────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS attendance_date_idx ON public.attendance (date);
CREATE INDEX IF NOT EXISTS attendance_class_date_idx ON public.attendance (class_id, date);
CREATE INDEX IF NOT EXISTS attendance_section_idx ON public.attendance (section_id);
CREATE INDEX IF NOT EXISTS attendance_school_idx ON public.attendance (school_id);
CREATE INDEX IF NOT EXISTS attendance_records_attendance_idx ON public.attendance_records (attendance_id);
CREATE INDEX IF NOT EXISTS attendance_records_student_idx ON public.attendance_records (student_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- attendance policies: school-level isolation
CREATE POLICY "attendance_school_read"
  ON public.attendance FOR SELECT
  USING (school_id IN (
    SELECT s.id FROM public.schools s
    JOIN public.profiles p ON p.school_id = s.id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "attendance_school_insert"
  ON public.attendance FOR INSERT
  WITH CHECK (school_id IN (
    SELECT s.id FROM public.schools s
    JOIN public.profiles p ON p.school_id = s.id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "attendance_school_update"
  ON public.attendance FOR UPDATE
  USING (school_id IN (
    SELECT s.id FROM public.schools s
    JOIN public.profiles p ON p.school_id = s.id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY "attendance_school_delete"
  ON public.attendance FOR DELETE
  USING (school_id IN (
    SELECT s.id FROM public.schools s
    JOIN public.profiles p ON p.school_id = s.id
    WHERE p.id = auth.uid()
  ));

-- attendance_records follows attendance (no direct school_id column — access via attendance)
CREATE POLICY "attendance_records_read"
  ON public.attendance_records FOR SELECT
  USING (attendance_id IN (
    SELECT a.id FROM public.attendance a WHERE a.school_id IN (
      SELECT s.id FROM public.schools s
      JOIN public.profiles p ON p.school_id = s.id
      WHERE p.id = auth.uid()
    )
  ));

CREATE POLICY "attendance_records_insert"
  ON public.attendance_records FOR INSERT
  WITH CHECK (attendance_id IN (
    SELECT a.id FROM public.attendance a WHERE a.school_id IN (
      SELECT s.id FROM public.schools s
      JOIN public.profiles p ON p.school_id = s.id
      WHERE p.id = auth.uid()
    )
  ));

CREATE POLICY "attendance_records_update"
  ON public.attendance_records FOR UPDATE
  USING (attendance_id IN (
    SELECT a.id FROM public.attendance a WHERE a.school_id IN (
      SELECT s.id FROM public.schools s
      JOIN public.profiles p ON p.school_id = s.id
      WHERE p.id = auth.uid()
    )
  ));

CREATE POLICY "attendance_records_delete"
  ON public.attendance_records FOR DELETE
  USING (attendance_id IN (
    SELECT a.id FROM public.attendance a WHERE a.school_id IN (
      SELECT s.id FROM public.schools s
      JOIN public.profiles p ON p.school_id = s.id
      WHERE p.id = auth.uid()
    )
  ));

COMMIT;
