-- Add stream column to sections table
-- Needed for Class 11/12 stream distinction (Science, Commerce, Arts)
-- Roll numbers use this: 11SA01 = Class 11, Science, Section A, Roll 01

ALTER TABLE sections ADD COLUMN IF NOT EXISTS stream TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sections.stream IS 'Stream for Class 11/12: Science, Commerce, Arts. NULL for other classes.';
