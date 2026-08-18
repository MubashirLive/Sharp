-- Dedup section_subjects and prevent recurrence.
--
-- Bug: the whole section_subjects table was duplicated (every
-- (section_id, subject_name) pair stored exactly twice, 322 rows / 161 pairs).
-- Duplicate rows surfaced as duplicate chips in the My School Subjects modal,
-- which keys chips by subject_name in React -> ambiguous keys made the remove (X)
-- button behave erratically ("keeps adding", "not clickable").
--
-- Root structural gap: no UNIQUE constraint on (section_id, subject_name).

-- Step A: delete duplicates, keep one row per (section_id, subject_name).
-- Prefer the row with a non-null subject_code (preserves standard-subject
-- metadata over a code-less custom copy), then the earliest created_at, then id.
DELETE FROM section_subjects s
USING (
  SELECT id,
         row_number() OVER (
           PARTITION BY section_id, subject_name
           ORDER BY (subject_code IS NULL), created_at, id
         ) AS rn
  FROM section_subjects
) d
WHERE s.id = d.id
  AND d.rn > 1;

-- Step B: add the unique constraint so a double-insert can never recur.
-- section_id already implies school_id (a section belongs to one school), so
-- (section_id, subject_name) is sufficient.
ALTER TABLE section_subjects
  ADD CONSTRAINT section_subjects_section_name_uniq UNIQUE (section_id, subject_name);
