-- RLS: require onboarding_complete before students data is accessible
-- Only applied if table exists. staff table does not exist yet (People.tsx uses mock data).
-- Apply to staff table when staff table is created.

-- ── Students table ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'students') THEN
    ALTER TABLE students ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "students_read_onboarding_gate" ON students;
    CREATE POLICY "students_read_onboarding_gate"
      ON students FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM schools
          WHERE schools.id = students.school_id
          AND schools.onboarding_complete = true
        )
      );

    DROP POLICY IF EXISTS "students_insert_onboarding_gate" ON students;
    CREATE POLICY "students_insert_onboarding_gate"
      ON students FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM schools
          WHERE schools.id = students.school_id
          AND schools.onboarding_complete = true
        )
      );

    DROP POLICY IF EXISTS "students_update_onboarding_gate" ON students;
    CREATE POLICY "students_update_onboarding_gate"
      ON students FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM schools
          WHERE schools.id = students.school_id
          AND schools.onboarding_complete = true
        )
      );

    DROP POLICY IF EXISTS "students_delete_onboarding_gate" ON students;
    CREATE POLICY "students_delete_onboarding_gate"
      ON students FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM schools
          WHERE schools.id = students.school_id
          AND schools.onboarding_complete = true
        )
      );

    RAISE NOTICE 'students RLS policies applied';
  ELSE
    RAISE NOTICE 'students table not found — skipping RLS policies';
  END IF;
END $$;

-- ── Staff table (add when table is created) ──────────────────────────────────
-- Uncomment when staff table is created:
--
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'staff') THEN
--     ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
--     -- ... policies here
--   END IF;
-- END $$;