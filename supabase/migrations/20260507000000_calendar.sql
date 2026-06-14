-- ============================================================
-- Calendar System — SHARP LMS
-- ============================================================

-- 1. national_holidays — reference table. Attendance gate reads this directly.
-- Schools do NOT copy from this. Schools add custom holidays to calendar_events.
CREATE TABLE IF NOT EXISTS public.national_holidays (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  title        TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'India',
  state        TEXT,   -- NULL = applies nationwide
  holiday_type TEXT CHECK (holiday_type IN ('gazetted', 'restricted', 'state'))
);

CREATE POLICY "national_holidays_read" ON public.national_holidays
  FOR SELECT TO authenticated USING (true);

-- India national holidays — static reference, not copied per school.
-- Attendance gate checks this at runtime — no per-school seeding needed.
INSERT INTO public.national_holidays (date, title, country, holiday_type, state) VALUES
-- 2026
('2026-01-01',  'New Year''s Day',            'India', 'gazetted',    NULL),
('2026-01-26', 'Republic Day',               'India', 'gazetted',    NULL),
('2026-03-10', 'Mahashivratri',              'India', 'restricted',  NULL),
('2026-03-14', 'Holi',                       'India', 'restricted',  NULL),
('2026-04-01', 'Good Friday',                'India', 'restricted',  NULL),
('2026-04-06', 'Easter Monday',              'India', 'restricted',  NULL),
('2026-05-01', 'May Day',                    'India', 'restricted',  NULL),
('2026-08-15', 'Independence Day',           'India', 'gazetted',    NULL),
('2026-08-16', 'Moharram',                   'India', 'restricted',  NULL),
('2026-08-27', 'Ganesh Chaturthi',           'India', 'restricted',  NULL),
('2026-09-07', 'Onam',                       'India', 'restricted',  NULL),
('2026-09-17', 'Milad-un-Nabi',              'India', 'gazetted',    NULL),
('2026-10-02', 'Mahatma Gandhi Jayanti',     'India', 'gazetted',    NULL),
('2026-10-20', 'Dussehra',                   'India', 'restricted',  NULL),
('2026-11-04', 'Diwali (Deepavali)',          'India', 'restricted',  NULL),
('2026-11-05', 'Bali Pratipada',              'India', 'restricted',  NULL),
('2026-11-15', 'Bhai Dooj',                   'India', 'restricted',  NULL),
('2026-12-25', 'Christmas Day',              'India', 'gazetted',    NULL),
-- 2027
('2027-01-01',  'New Year''s Day',            'India', 'gazetted',    NULL),
('2027-01-26', 'Republic Day',               'India', 'gazetted',    NULL),
('2027-03-01', 'Mahashivratri',              'India', 'restricted',  NULL),
('2027-03-04', 'Holi',                       'India', 'restricted',  NULL),
('2027-04-02', 'Good Friday',                'India', 'restricted',  NULL),
('2027-05-01', 'May Day',                    'India', 'restricted',  NULL),
('2027-08-15', 'Independence Day',           'India', 'gazetted',    NULL),
('2027-08-27', 'Ganesh Chaturthi',           'India', 'restricted',  NULL),
('2027-10-02', 'Mahatma Gandhi Jayanti',     'India', 'gazetted',    NULL),
('2027-10-10', 'Dussehra',                   'India', 'restricted',  NULL),
('2027-10-24', 'Diwali (Deepavali)',          'India', 'restricted',  NULL),
('2027-10-25', 'Bali Pratipada',              'India', 'restricted',  NULL),
('2027-12-25', 'Christmas Day',              'India', 'gazetted',    NULL),
-- 2028
('2028-01-01',  'New Year''s Day',            'India', 'gazetted',    NULL),
('2028-01-26', 'Republic Day',               'India', 'gazetted',    NULL),
('2028-02-19', 'Mahashivratri',              'India', 'restricted',  NULL),
('2028-03-07', 'Holi',                       'India', 'restricted',  NULL),
('2028-03-10', 'Good Friday',                'India', 'restricted',  NULL),
('2028-04-24', 'Easter Monday',              'India', 'restricted',  NULL),
('2028-05-01', 'May Day',                    'India', 'restricted',  NULL),
('2028-08-15', 'Independence Day',           'India', 'gazetted',    NULL),
('2028-08-27', 'Ganesh Chaturthi',           'India', 'restricted',  NULL),
('2028-09-02', 'Onam',                       'India', 'restricted',  NULL),
('2028-09-06', 'Milad-un-Nabi',             'India', 'gazetted',    NULL),
('2028-10-02', 'Mahatma Gandhi Jayanti',     'India', 'gazetted',    NULL),
('2028-10-24', 'Dussehra',                   'India', 'restricted',  NULL),
('2028-11-01', 'Diwali (Deepavali)',          'India', 'restricted',  NULL),
('2028-11-02', 'Bali Pratipada',              'India', 'restricted',  NULL),
('2028-11-13', 'Bhai Dooj',                   'India', 'restricted',  NULL),
('2028-12-25', 'Christmas Day',              'India', 'gazetted',    NULL),
-- 2029
('2029-01-01',  'New Year''s Day',            'India', 'gazetted',    NULL),
('2029-01-26', 'Republic Day',               'India', 'gazetted',    NULL),
('2029-02-06', 'Mahashivratri',              'India', 'restricted',  NULL),
('2029-02-20', 'Holi',                       'India', 'restricted',  NULL),
('2029-03-30', 'Good Friday',                'India', 'restricted',  NULL),
('2029-04-16', 'Easter Monday',              'India', 'restricted',  NULL),
('2029-05-01', 'May Day',                    'India', 'restricted',  NULL),
('2029-08-15', 'Independence Day',           'India', 'gazetted',    NULL),
('2029-08-16', 'Moharram',                   'India', 'restricted',  NULL),
('2029-08-27', 'Ganesh Chaturthi',           'India', 'restricted',  NULL),
('2029-09-22', 'Onam',                       'India', 'restricted',  NULL),
('2029-09-26', 'Milad-un-Nabi',              'India', 'gazetted',    NULL),
('2029-10-02', 'Mahatma Gandhi Jayanti',     'India', 'gazetted',    NULL),
('2029-10-14', 'Dussehra',                   'India', 'restricted',  NULL),
('2029-10-24', 'Diwali (Deepavali)',          'India', 'restricted',  NULL),
('2029-10-25', 'Bali Pratipada',              'India', 'restricted',  NULL),
('2029-11-02', 'Bhai Dooj',                   'India', 'restricted',  NULL),
('2029-12-25', 'Christmas Day',              'India', 'gazetted',    NULL),
-- 2030
('2030-01-01',  'New Year''s Day',            'India', 'gazetted',    NULL),
('2030-01-26', 'Republic Day',               'India', 'gazetted',    NULL),
('2030-02-26', 'Mahashivratri',              'India', 'restricted',  NULL),
('2030-03-12', 'Holi',                       'India', 'restricted',  NULL),
('2030-04-19', 'Good Friday',                'India', 'restricted',  NULL),
('2030-04-22', 'Easter Monday',              'India', 'restricted',  NULL),
('2030-05-01', 'May Day',                    'India', 'restricted',  NULL),
('2030-08-15', 'Independence Day',           'India', 'gazetted',    NULL),
('2030-08-16', 'Moharram',                   'India', 'restricted',  NULL),
('2030-08-27', 'Ganesh Chaturthi',           'India', 'restricted',  NULL),
('2030-09-11', 'Onam',                       'India', 'restricted',  NULL),
('2030-09-15', 'Milad-un-Nabi',              'India', 'gazetted',    NULL),
('2030-10-02', 'Mahatma Gandhi Jayanti',     'India', 'gazetted',    NULL),
('2030-10-03', 'Dussehra',                   'India', 'restricted',  NULL),
('2030-10-28', 'Diwali (Deepavali)',          'India', 'restricted',  NULL),
('2030-10-29', 'Bali Pratipada',              'India', 'restricted',  NULL),
('2030-11-07', 'Bhai Dooj',                   'India', 'restricted',  NULL),
('2030-12-25', 'Christmas Day',              'India', 'gazetted',    NULL);

-- 2. school_calendar — working week definition per school per academic year
CREATE TABLE IF NOT EXISTS public.school_calendar (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  working_days     TEXT[] NOT NULL DEFAULT '{"Mon","Tue","Wed","Thu","Fri"}',
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (school_id, academic_year_id)
);

CREATE POLICY "school_calendar_isolation" ON public.school_calendar
  FOR ALL USING (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_school_calendar_school_year ON public.school_calendar(school_id, academic_year_id);

-- 3. calendar_events — school-specific events only (custom holidays, school events, meetings, tasks)
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  calendar_id        UUID NOT NULL REFERENCES public.school_calendar(id) ON DELETE CASCADE,
  date               DATE NOT NULL,
  event_type          TEXT NOT NULL CHECK (event_type IN (
                       'holiday', 'working_override', 'school_event',
                       'class_event', 'staff_meeting', 'staff_task', 'exam_timetable'
                     )),
  title              TEXT NOT NULL,
  detail             TEXT,
  scope              TEXT NOT NULL CHECK (scope IN (
                       'all', 'students', 'staff', 'wing', 'class', 'individual'
                     )),
  scope_ids          UUID[],
  is_half_day        BOOLEAN DEFAULT false,
  half_day_fraction  DECIMAL(4,3),
  notify             BOOLEAN DEFAULT true,
  notify_at          TIMESTAMPTZ,
  exam_id            UUID,
  declared_by        UUID NOT NULL REFERENCES public.profiles(id),
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE POLICY "calendar_events_school_isolation" ON public.calendar_events
  FOR ALL USING (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Students see scoped events only
CREATE POLICY "calendar_events_student_view" ON public.calendar_events
  FOR SELECT USING (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    AND (scope = 'all' OR scope = 'students'
      OR (scope = 'class' AND auth.uid()::text = ANY(scope_ids::text[])))
  );

CREATE INDEX idx_calendar_events_school_date ON public.calendar_events(school_id, date);
CREATE INDEX idx_calendar_events_date         ON public.calendar_events(date);
CREATE INDEX idx_calendar_events_scope_ids    ON public.calendar_events USING GIN ((scope_ids::text[]));

-- 4. class_session_dates — per-class start/end boundaries
CREATE TABLE IF NOT EXISTS public.class_session_dates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  class_id         UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE (school_id, academic_year_id, class_id)
);

CREATE POLICY "class_session_dates_isolation" ON public.class_session_dates
  FOR ALL USING (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    school_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE INDEX idx_class_session_dates_school_class ON public.class_session_dates(school_id, class_id);

-- 5. event_task_completions
CREATE TABLE IF NOT EXISTS public.event_task_completions (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id),
  done     BOOLEAN DEFAULT false,
  done_at  TIMESTAMPTZ,
  UNIQUE (event_id, staff_id)
);

CREATE POLICY "task_completions_own" ON public.event_task_completions
  FOR ALL USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());

CREATE INDEX idx_task_completions_event ON public.event_task_completions(event_id);

-- 6. Realtime trigger for Edge Function
ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_events;

-- ============================================================
-- can_mark_attendance
-- Checks:
--   1. Class session dates (class-specific start/end)
--   2. Working week (school's defined working days)
--   3. National holidays (nationwide + state-specific, checked at runtime)
--   4. School-specific holiday events (custom holidays from calendar_events)
-- ============================================================
CREATE OR REPLACE FUNCTION public.can_mark_attendance(
  p_class_id UUID,
  p_date     DATE
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_school_id        UUID;
  v_academic_year_id UUID;
  v_working_days     TEXT[];
  v_date_weekday     TEXT;
  v_school_state     TEXT;
BEGIN
  -- Get school and academic year from class
  SELECT c.school_id, c.session_id
    INTO v_school_id, v_academic_year_id
    FROM public.classes c WHERE c.id = p_class_id;

  IF v_school_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Class not found');
  END IF;

  -- Gate 1: class session dates
  IF NOT EXISTS (
    SELECT 1 FROM public.class_session_dates csd
    WHERE csd.class_id = p_class_id
      AND p_date BETWEEN csd.start_date AND csd.end_date
  ) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'Outside class session dates — attendance not open for this class'
    );
  END IF;

  -- Get school working week
  SELECT sc.working_days, s.state
    INTO v_working_days, v_school_state
    FROM public.school_calendar sc
    JOIN public.schools s ON s.id = sc.school_id
    WHERE sc.school_id = v_school_id
      AND sc.academic_year_id = v_academic_year_id;

  IF v_working_days IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'Working week not configured — run Calendar Setup first'
    );
  END IF;

  -- Gate 2: working day check (weekday in working_days OR working_override event)
  v_date_weekday := trim(both '"' from upper(to_char(p_date, 'Day')));

  IF NOT (v_date_weekday = ANY(v_working_days))
     AND NOT EXISTS (
       SELECT 1 FROM public.calendar_events ce
       WHERE ce.school_id = v_school_id
         AND ce.date = p_date
         AND ce.event_type = 'working_override'
         AND (ce.scope = 'all' OR (ce.scope = 'class' AND p_class_id::text = ANY(ce.scope_ids::text[])))
     )
  THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'Non-working day — ' || v_date_weekday || ' is not a working day for this school'
    );
  END IF;

  -- Gate 3: national holidays — checked at runtime, not seeded per school.
  -- Matches: nationwide holidays OR state-specific holidays for this school's state.
  IF EXISTS (
    SELECT 1 FROM public.national_holidays nh
    WHERE nh.date = p_date
      AND (nh.state IS NULL OR nh.state = v_school_state)
  ) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'National holiday on ' || to_char(p_date, 'DD Mon YYYY')
    );
  END IF;

  -- Gate 4: school-specific custom holiday events
  IF EXISTS (
    SELECT 1 FROM public.calendar_events ce
    WHERE ce.school_id   = v_school_id
      AND ce.date        = p_date
      AND ce.event_type  = 'holiday'
      AND (
        ce.scope = 'all'
        OR (ce.scope = 'class' AND p_class_id::text = ANY(ce.scope_ids::text[]))
        OR (ce.scope = 'students')
      )
  ) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'School holiday declared on ' || to_char(p_date, 'DD Mon YYYY')
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;