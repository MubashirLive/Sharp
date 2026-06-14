-- FIX: Split father_name into 3 columns on staff_profiles + principal_profiles
-- Adds father_first_name, father_middle_name, father_last_name
-- Replaces plain father_name with GENERATED ALWAYS AS STORED column
-- Backfills from existing single-column value (1/2/3+ word names)

BEGIN;

-- ============================================
-- STEP 1: Add 3 split columns to staff_profiles
-- ============================================
ALTER TABLE staff_profiles
  ADD COLUMN IF NOT EXISTS father_first_name TEXT,
  ADD COLUMN IF NOT EXISTS father_middle_name TEXT,
  ADD COLUMN IF NOT EXISTS father_last_name TEXT;

-- Backfill from existing father_name.
-- Heuristic: first token = first_name, last token = last_name,
-- everything between = middle_name. Empty middle if 1 or 2 tokens.
DO $$
DECLARE
  rec RECORD;
  parts TEXT[];
  n INTEGER;
  first_t TEXT;
  mid_t TEXT;
  last_t TEXT;
BEGIN
  FOR rec IN
    SELECT id, father_name
    FROM staff_profiles
    WHERE father_name IS NOT NULL
      AND btrim(father_name) <> ''
      AND (father_first_name IS NULL AND father_last_name IS NULL)
  LOOP
    parts := regexp_split_to_array(btrim(rec.father_name), '\s+');
    n := array_length(parts, 1);
    IF n IS NULL OR n = 0 THEN
      CONTINUE;
    ELSIF n = 1 THEN
      first_t := parts[1];
      mid_t := NULL;
      last_t := NULL;
    ELSIF n = 2 THEN
      first_t := parts[1];
      mid_t := NULL;
      last_t := parts[2];
    ELSE
      first_t := parts[1];
      mid_t := array_to_string(parts[2:n-1], ' ');
      last_t := parts[n];
    END IF;

    UPDATE staff_profiles
    SET father_first_name = first_t,
        father_middle_name = mid_t,
        father_last_name = last_t
    WHERE id = rec.id;
  END LOOP;
END $$;

-- Drop + re-add father_name as GENERATED column.
-- Cannot ALTER to GENERATED directly in Postgres — must drop + add.
-- Use simple || concat (immutable) instead of concat_ws/btrim.
ALTER TABLE staff_profiles DROP COLUMN father_name;
ALTER TABLE staff_profiles
  ADD COLUMN father_name TEXT GENERATED ALWAYS AS (
    CASE
      WHEN father_first_name IS NULL AND father_middle_name IS NULL AND father_last_name IS NULL THEN NULL
      WHEN father_first_name IS NOT NULL AND father_middle_name IS NOT NULL AND father_last_name IS NOT NULL
        THEN father_first_name || ' ' || father_middle_name || ' ' || father_last_name
      WHEN father_first_name IS NOT NULL AND father_middle_name IS NOT NULL
        THEN father_first_name || ' ' || father_middle_name
      WHEN father_first_name IS NOT NULL AND father_last_name IS NOT NULL
        THEN father_first_name || ' ' || father_last_name
      WHEN father_middle_name IS NOT NULL AND father_last_name IS NOT NULL
        THEN father_middle_name || ' ' || father_last_name
      ELSE COALESCE(father_first_name, father_middle_name, father_last_name)
    END
  ) STORED;

-- ============================================
-- STEP 2: Same for principal_profiles
-- ============================================
ALTER TABLE principal_profiles
  ADD COLUMN IF NOT EXISTS father_first_name TEXT,
  ADD COLUMN IF NOT EXISTS father_middle_name TEXT,
  ADD COLUMN IF NOT EXISTS father_last_name TEXT;

DO $$
DECLARE
  rec RECORD;
  parts TEXT[];
  n INTEGER;
  first_t TEXT;
  mid_t TEXT;
  last_t TEXT;
BEGIN
  FOR rec IN
    SELECT id, father_name
    FROM principal_profiles
    WHERE father_name IS NOT NULL
      AND btrim(father_name) <> ''
      AND (father_first_name IS NULL AND father_last_name IS NULL)
  LOOP
    parts := regexp_split_to_array(btrim(rec.father_name), '\s+');
    n := array_length(parts, 1);
    IF n IS NULL OR n = 0 THEN
      CONTINUE;
    ELSIF n = 1 THEN
      first_t := parts[1];
      mid_t := NULL;
      last_t := NULL;
    ELSIF n = 2 THEN
      first_t := parts[1];
      mid_t := NULL;
      last_t := parts[2];
    ELSE
      first_t := parts[1];
      mid_t := array_to_string(parts[2:n-1], ' ');
      last_t := parts[n];
    END IF;

    UPDATE principal_profiles
    SET father_first_name = first_t,
        father_middle_name = mid_t,
        father_last_name = last_t
    WHERE id = rec.id;
  END LOOP;
END $$;

ALTER TABLE principal_profiles DROP COLUMN father_name;
ALTER TABLE principal_profiles
  ADD COLUMN father_name TEXT GENERATED ALWAYS AS (
    CASE
      WHEN father_first_name IS NULL AND father_middle_name IS NULL AND father_last_name IS NULL THEN NULL
      WHEN father_first_name IS NOT NULL AND father_middle_name IS NOT NULL AND father_last_name IS NOT NULL
        THEN father_first_name || ' ' || father_middle_name || ' ' || father_last_name
      WHEN father_first_name IS NOT NULL AND father_middle_name IS NOT NULL
        THEN father_first_name || ' ' || father_middle_name
      WHEN father_first_name IS NOT NULL AND father_last_name IS NOT NULL
        THEN father_first_name || ' ' || father_last_name
      WHEN father_middle_name IS NOT NULL AND father_last_name IS NOT NULL
        THEN father_middle_name || ' ' || father_last_name
      ELSE COALESCE(father_first_name, father_middle_name, father_last_name)
    END
  ) STORED;

COMMIT;
