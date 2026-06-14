-- Drop existing trigger + functions if re-applying (e.g. after schema update)
DROP TRIGGER IF EXISTS trg_student_insert_resequence ON students;
DROP FUNCTION IF EXISTS resequence_rolls_on_change();
DROP FUNCTION IF EXISTS build_roll_prefix(UUID, UUID);

-- Roll number auto-resequence trigger
-- INSERT / UPDATE (full_name, class_id, section_id): Postgres trigger fires AFTER
-- DELETE: handled in application layer (see student-utils.ts)
--
-- Roll format: {CLASS_CODE}{STREAM_CODE?}{SECTION}{SEQUENCE:00}
-- Examples: 9A01, NA01, 11SA01, 12CB02

-- Build the prefix portion of a roll number from class + section.
-- Prefer explicit acronym columns over auto-derivation from names.
CREATE OR REPLACE FUNCTION build_roll_prefix(p_class_id UUID, p_section_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_class_name TEXT;
  v_class_acronym TEXT;
  v_section_name TEXT;
  v_section_acronym TEXT;
  v_stream TEXT;
  cc TEXT;
BEGIN
  SELECT c.name, c.acronym INTO v_class_name, v_class_acronym
  FROM classes c WHERE c.id = p_class_id;
  SELECT s.name, s.acronym, COALESCE(s.stream, '') INTO v_section_name, v_section_acronym, v_stream
  FROM sections s WHERE s.id = p_section_id;

  -- Class code: explicit acronym wins; fall back to N/L/U or digits
  IF v_class_acronym IS NOT NULL AND v_class_acronym != '' THEN
    cc := v_class_acronym;
  ELSIF v_class_name = 'Nursery' THEN cc := 'N';
  ELSIF v_class_name = 'LKG' THEN cc := 'L';
  ELSIF v_class_name = 'UKG' THEN cc := 'U';
  ELSE
    cc := regexp_replace(v_class_name, '\D', '', 'g');
  END IF;

  -- Append stream code for Class 11/12 streams
  IF v_stream = 'Science' THEN cc := cc || 'S';
  ELSIF v_stream = 'Commerce' THEN cc := cc || 'C';
  ELSIF v_stream = 'Arts' THEN cc := cc || 'A';
  END IF;

  -- Section: explicit acronym wins; fall back to section name
  RETURN cc || COALESCE(NULLIF(v_section_acronym, ''), v_section_name);
END;
$$ LANGUAGE plpgsql;

-- Trigger function: re-sequence all OTHER students in the same class+section
-- when a new student is inserted or when full_name / class / section changes
CREATE OR REPLACE FUNCTION resequence_rolls_on_change()
RETURNS TRIGGER AS $$
DECLARE
  v_prefix TEXT;
BEGIN
  v_prefix := build_roll_prefix(NEW.class_id, NEW.section_id);

  UPDATE students
  SET
    roll_no = v_prefix || LPAD((rn)::TEXT, 2, '0'),
    updated_at = NOW()
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY full_name ASC) as rn
    FROM students
    WHERE class_id = NEW.class_id
      AND section_id = NEW.section_id
      AND id != NEW.id
  ) ordered
  WHERE students.id = ordered.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire after INSERT or UPDATE of the ordering-relevant columns
CREATE TRIGGER trg_student_insert_resequence
  AFTER INSERT OR UPDATE OF full_name, class_id, section_id
  ON students
  FOR EACH ROW
  EXECUTE FUNCTION resequence_rolls_on_change();
