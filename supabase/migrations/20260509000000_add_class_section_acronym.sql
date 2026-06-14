-- Add acronym + display_order columns to classes/sections
-- These feed into roll number generation: classes.acronym overrides auto-derivation

ALTER TABLE classes ADD COLUMN IF NOT EXISTS acronym TEXT;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS acronym TEXT;
ALTER TABLE sections ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;

-- Backfill display_order for existing sections (existing order preserved)
UPDATE sections s
SET display_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY class_id ORDER BY name ASC) - 1 AS rn
  FROM sections
) sub
WHERE s.id = sub.id;

-- Existing sections get display_order 0..N-1 per class, alphabetically